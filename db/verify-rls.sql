-- Run with the privileged SQL editor/migration connection after schema.sql.
-- All fixtures and every test write are rolled back. No signup or email is sent.
BEGIN;
SET LOCAL statement_timeout = '60s';

DO $setup$
DECLARE
  user_a uuid := pg_catalog.gen_random_uuid();
  user_b uuid := pg_catalog.gen_random_uuid();
BEGIN
  PERFORM pg_catalog.set_config('test.progress_user_a', user_a::text, true);
  PERFORM pg_catalog.set_config('test.progress_user_b', user_b::text, true);

  INSERT INTO auth.users
    (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES
    (user_a, 'authenticated', 'authenticated', 'rls-a-' || user_a::text || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now()),
    (user_b, 'authenticated', 'authenticated', 'rls-b-' || user_b::text || '@example.invalid', '{}'::jsonb, '{}'::jsonb, now(), now());

  IF NOT (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.progress_snapshots'::regclass) THEN
    RAISE EXCEPTION 'FAIL: row-level security is not enabled';
  END IF;
  IF (SELECT prosecdef FROM pg_catalog.pg_proc WHERE oid = 'public.save_progress_snapshot(bigint,jsonb)'::regprocedure) THEN
    RAISE EXCEPTION 'FAIL: RPC must be SECURITY INVOKER';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc
    WHERE oid = 'public.save_progress_snapshot(bigint,jsonb)'::regprocedure
      AND 'search_path=""' = ANY(proconfig)
  ) THEN
    RAISE EXCEPTION 'FAIL: RPC search_path must be empty';
  END IF;
  IF pg_catalog.has_table_privilege('anon', 'public.progress_snapshots', 'SELECT')
    OR pg_catalog.has_table_privilege('anon', 'public.progress_snapshots', 'INSERT')
    OR pg_catalog.has_table_privilege('anon', 'public.progress_snapshots', 'UPDATE')
    OR pg_catalog.has_function_privilege('anon', 'public.save_progress_snapshot(bigint,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: anon has snapshot privileges';
  END IF;
  IF NOT pg_catalog.has_table_privilege('authenticated', 'public.progress_snapshots', 'SELECT')
    OR NOT pg_catalog.has_table_privilege('authenticated', 'public.progress_snapshots', 'INSERT')
    OR NOT pg_catalog.has_table_privilege('authenticated', 'public.progress_snapshots', 'UPDATE')
    OR NOT pg_catalog.has_function_privilege('authenticated', 'public.save_progress_snapshot(bigint,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: authenticated grants are incomplete';
  END IF;
  IF pg_catalog.has_table_privilege('authenticated', 'public.progress_snapshots', 'DELETE')
    OR pg_catalog.has_table_privilege('authenticated', 'public.progress_snapshots', 'TRUNCATE') THEN
    RAISE EXCEPTION 'FAIL: authenticated must not delete or truncate snapshots';
  END IF;
END;
$setup$;

-- User B creates a genuine row through the invoker RPC.
SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config('request.jwt.claim.sub', pg_catalog.current_setting('test.progress_user_b'), true);
SELECT pg_catalog.set_config('request.jwt.claims', pg_catalog.jsonb_build_object('sub', pg_catalog.current_setting('test.progress_user_b'), 'role', 'authenticated')::text, true);
DO $user_b_create$
DECLARE
  user_b uuid := pg_catalog.current_setting('test.progress_user_b')::uuid;
  result jsonb;
  payload jsonb;
BEGIN
  IF auth.uid() IS DISTINCT FROM user_b THEN RAISE EXCEPTION 'FAIL: B JWT fixture'; END IF;
  payload := pg_catalog.jsonb_build_object('version', 1, 'owner', user_b::text, 'clock', 1,
    'values', pg_catalog.jsonb_build_object('wort-learned', '[18]'), 'stamps', '{}'::jsonb, 'saved', '{}'::jsonb, 'conflicts', '[]'::jsonb);
  result := public.save_progress_snapshot(0, payload);
  IF result -> 'ok' IS DISTINCT FROM 'true'::jsonb
    OR (result ->> 'revision')::bigint <> 1
    OR result -> 'payload' IS DISTINCT FROM payload THEN
    RAISE EXCEPTION 'FAIL: initial B CAS must return revision 1';
  END IF;
END;
$user_b_create$;

-- User A cannot see or change B, and cannot mislabel an owned envelope.
SELECT pg_catalog.set_config('request.jwt.claim.sub', pg_catalog.current_setting('test.progress_user_a'), true);
SELECT pg_catalog.set_config('request.jwt.claims', pg_catalog.jsonb_build_object('sub', pg_catalog.current_setting('test.progress_user_a'), 'role', 'authenticated')::text, true);
DO $user_a$
DECLARE
  user_a uuid := pg_catalog.current_setting('test.progress_user_a')::uuid;
  user_b uuid := pg_catalog.current_setting('test.progress_user_b')::uuid;
  payload_a jsonb;
  payload_b jsonb;
  result jsonb;
  stored_payload jsonb;
  stored_revision bigint;
  previous_at timestamptz;
  changed integer;
BEGIN
  IF auth.uid() IS DISTINCT FROM user_a THEN RAISE EXCEPTION 'FAIL: A JWT fixture'; END IF;
  payload_a := pg_catalog.jsonb_build_object('version', 1, 'owner', user_a::text, 'clock', 1,
    'values', pg_catalog.jsonb_build_object('wort-learned', '[0]'), 'stamps', '{}'::jsonb, 'saved', '{}'::jsonb, 'conflicts', '[]'::jsonb);
  payload_b := pg_catalog.jsonb_set(payload_a, '{owner}', pg_catalog.to_jsonb(user_b::text));

  IF EXISTS (SELECT 1 FROM public.progress_snapshots) THEN RAISE EXCEPTION 'FAIL: A can read another account'; END IF;
  UPDATE public.progress_snapshots SET payload = payload_b WHERE user_id = user_b;
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 0 THEN RAISE EXCEPTION 'FAIL: A changed B'; END IF;
  BEGIN
    INSERT INTO public.progress_snapshots(user_id, payload) VALUES (user_b, payload_b);
    RAISE EXCEPTION 'FAIL: cross-owner insert accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  -- A stale write against an absent row must not create any row.
  result := public.save_progress_snapshot(9, payload_a);
  IF result -> 'ok' IS DISTINCT FROM 'false'::jsonb
    OR (result ->> 'revision')::bigint <> 0
    OR result -> 'payload' IS DISTINCT FROM 'null'::jsonb
    OR EXISTS (SELECT 1 FROM public.progress_snapshots) THEN
    RAISE EXCEPTION 'FAIL: absent-row stale CAS persisted data';
  END IF;

  BEGIN
    INSERT INTO public.progress_snapshots(user_id, payload) VALUES (user_a, payload_b);
    RAISE EXCEPTION 'FAIL: table accepted a different payload owner';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO public.progress_snapshots(user_id, payload) VALUES (user_a, payload_a - 'owner');
    RAISE EXCEPTION 'FAIL: table accepted a missing payload owner';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO public.progress_snapshots(user_id, payload) VALUES (user_a, payload_a - 'version');
    RAISE EXCEPTION 'FAIL: table accepted a missing payload version';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  -- Exercise the explicit INSERT grant, then the existing-revision-zero path.
  INSERT INTO public.progress_snapshots(user_id, revision, payload) VALUES (user_a, 0, payload_a);
  IF (SELECT count(*) FROM public.progress_snapshots) <> 1 THEN RAISE EXCEPTION 'FAIL: A own-row read'; END IF;
  result := public.save_progress_snapshot(0, payload_a);
  IF result -> 'ok' IS DISTINCT FROM 'true'::jsonb OR (result ->> 'revision')::bigint <> 1 THEN
    RAISE EXCEPTION 'FAIL: A CAS from revision 0';
  END IF;
  SELECT updated_at INTO previous_at FROM public.progress_snapshots WHERE user_id = user_a;

  result := public.save_progress_snapshot(0, pg_catalog.jsonb_set(payload_a, '{clock}', '99'::jsonb));
  SELECT revision, payload INTO stored_revision, stored_payload FROM public.progress_snapshots WHERE user_id = user_a;
  IF result -> 'ok' IS DISTINCT FROM 'false'::jsonb OR (result ->> 'revision')::bigint <> 1
    OR result -> 'payload' IS DISTINCT FROM payload_a OR stored_revision <> 1 OR stored_payload IS DISTINCT FROM payload_a
    OR (SELECT updated_at FROM public.progress_snapshots WHERE user_id = user_a) IS DISTINCT FROM previous_at THEN
    RAISE EXCEPTION 'FAIL: stale CAS changed the current snapshot';
  END IF;

  payload_a := pg_catalog.jsonb_set(payload_a, '{clock}', '2'::jsonb);
  result := public.save_progress_snapshot(1, payload_a);
  IF result -> 'ok' IS DISTINCT FROM 'true'::jsonb OR (result ->> 'revision')::bigint <> 2
    OR result -> 'payload' IS DISTINCT FROM payload_a THEN RAISE EXCEPTION 'FAIL: matching CAS update'; END IF;
  result := public.save_progress_snapshot(1, pg_catalog.jsonb_set(payload_a, '{clock}', '3'::jsonb));
  IF result -> 'ok' IS DISTINCT FROM 'false'::jsonb OR (result ->> 'revision')::bigint <> 2
    OR result -> 'payload' IS DISTINCT FROM payload_a THEN RAISE EXCEPTION 'FAIL: subsequent stale CAS'; END IF;

  UPDATE public.progress_snapshots SET payload = payload_a WHERE user_id = user_a;
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 1 THEN RAISE EXCEPTION 'FAIL: A own UPDATE grant/policy'; END IF;
  BEGIN
    UPDATE public.progress_snapshots SET user_id = user_b, payload = payload_b WHERE user_id = user_a;
    RAISE EXCEPTION 'FAIL: owner reassignment accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    UPDATE public.progress_snapshots SET revision = -1 WHERE user_id = user_a;
    RAISE EXCEPTION 'FAIL: negative revision accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    PERFORM public.save_progress_snapshot(2, payload_b);
    RAISE EXCEPTION 'FAIL: RPC owner guard';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  BEGIN
    PERFORM public.save_progress_snapshot(2, '[]'::jsonb);
    RAISE EXCEPTION 'FAIL: RPC accepted a non-object';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  BEGIN
    PERFORM public.save_progress_snapshot(2, NULL);
    RAISE EXCEPTION 'FAIL: RPC accepted null payload';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  BEGIN
    PERFORM public.save_progress_snapshot(2, payload_a - 'version');
    RAISE EXCEPTION 'FAIL: RPC accepted missing version';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  BEGIN
    PERFORM public.save_progress_snapshot(2, pg_catalog.jsonb_set(payload_a, '{version}', '"1"'::jsonb));
    RAISE EXCEPTION 'FAIL: RPC accepted string version';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  BEGIN
    PERFORM public.save_progress_snapshot(-1, payload_a);
    RAISE EXCEPTION 'FAIL: RPC accepted negative expected_revision';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  BEGIN
    PERFORM public.save_progress_snapshot(NULL, payload_a);
    RAISE EXCEPTION 'FAIL: RPC accepted null expected_revision';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  BEGIN
    PERFORM public.save_progress_snapshot(2, payload_a || pg_catalog.jsonb_build_object('oversize', pg_catalog.repeat('x', 10485761)));
    RAISE EXCEPTION 'FAIL: RPC accepted payload larger than 10 MiB';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
END;
$user_a$;

-- Switching to B exposes only B and does not overwrite A.
SELECT pg_catalog.set_config('request.jwt.claim.sub', pg_catalog.current_setting('test.progress_user_b'), true);
SELECT pg_catalog.set_config('request.jwt.claims', pg_catalog.jsonb_build_object('sub', pg_catalog.current_setting('test.progress_user_b'), 'role', 'authenticated')::text, true);
DO $user_b_isolation$
DECLARE
  user_a uuid := pg_catalog.current_setting('test.progress_user_a')::uuid;
  user_b uuid := pg_catalog.current_setting('test.progress_user_b')::uuid;
  changed integer;
BEGIN
  IF (SELECT count(*) FROM public.progress_snapshots) <> 1
    OR EXISTS (SELECT 1 FROM public.progress_snapshots WHERE user_id = user_a)
    OR (SELECT revision FROM public.progress_snapshots WHERE user_id = user_b) <> 1 THEN
    RAISE EXCEPTION 'FAIL: B row isolation';
  END IF;
  UPDATE public.progress_snapshots SET revision = 99 WHERE user_id = user_a;
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 0 THEN RAISE EXCEPTION 'FAIL: B changed A'; END IF;
END;
$user_b_isolation$;

-- An authenticated DB role without a subject is still not an authenticated user.
SELECT pg_catalog.set_config('request.jwt.claim.sub', '', true);
SELECT pg_catalog.set_config('request.jwt.claims', '{}', true);
DO $missing_subject$
BEGIN
  IF auth.uid() IS NOT NULL THEN RAISE EXCEPTION 'FAIL: blank-subject fixture'; END IF;
  IF EXISTS (SELECT 1 FROM public.progress_snapshots) THEN RAISE EXCEPTION 'FAIL: missing subject read rows'; END IF;
  BEGIN
    PERFORM public.save_progress_snapshot(0, '{}'::jsonb);
    RAISE EXCEPTION 'FAIL: unauthenticated RPC accepted';
  EXCEPTION WHEN invalid_authorization_specification THEN NULL;
  END;
END;
$missing_subject$;

SET LOCAL ROLE anon;
DO $anonymous$
BEGIN
  BEGIN
    PERFORM 1 FROM public.progress_snapshots;
    RAISE EXCEPTION 'FAIL: anon table access accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.save_progress_snapshot(0, '{}'::jsonb);
    RAISE EXCEPTION 'FAIL: anon function access accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$anonymous$;

RESET ROLE;
DO $final$
DECLARE
  user_a uuid := pg_catalog.current_setting('test.progress_user_a')::uuid;
  user_b uuid := pg_catalog.current_setting('test.progress_user_b')::uuid;
BEGIN
  IF (SELECT revision FROM public.progress_snapshots WHERE user_id = user_a) <> 2
    OR (SELECT revision FROM public.progress_snapshots WHERE user_id = user_b) <> 1 THEN
    RAISE EXCEPTION 'FAIL: fixture data changed across accounts';
  END IF;
  DELETE FROM auth.users WHERE id = user_b;
  IF EXISTS (SELECT 1 FROM public.progress_snapshots WHERE user_id = user_b) THEN
    RAISE EXCEPTION 'FAIL: Auth-user cascade did not remove its snapshot';
  END IF;
END;
$final$;

ROLLBACK;
SELECT 'PASS: owned RLS, explicit privileges, CAS/conflicts, payload guards, anonymous denial and cascade; all fixtures rolled back.' AS verification;
