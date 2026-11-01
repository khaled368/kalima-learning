-- Per-account progress snapshots. Apply with a privileged migration connection.
-- Browser clients use only the publishable key and their authenticated JWT.
CREATE TABLE public.progress_snapshots (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  revision bigint NOT NULL DEFAULT 0,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT progress_snapshots_revision_nonnegative CHECK (revision >= 0),
  CONSTRAINT progress_snapshots_payload_object
    CHECK (pg_catalog.jsonb_typeof(payload) = 'object'),
  CONSTRAINT progress_snapshots_payload_version
    CHECK (payload -> 'version' IS NOT DISTINCT FROM '1'::jsonb),
  CONSTRAINT progress_snapshots_payload_owner
    CHECK (payload ->> 'owner' IS NOT DISTINCT FROM user_id::text),
  CONSTRAINT progress_snapshots_payload_size
    CHECK (pg_catalog.octet_length(payload::text) <= 10485760)
);

ALTER TABLE public.progress_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY progress_snapshots_select_own
  ON public.progress_snapshots FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY progress_snapshots_insert_own
  ON public.progress_snapshots FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY progress_snapshots_update_own
  ON public.progress_snapshots FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Remove inherited/default table grants before exposing the intended operations.
REVOKE ALL ON TABLE public.progress_snapshots FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.progress_snapshots TO authenticated;

CREATE OR REPLACE FUNCTION public.save_progress_snapshot(
  expected_revision bigint,
  next_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  current_user_id uuid := auth.uid();
  current_revision bigint;
  current_payload jsonb;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '28000', MESSAGE = 'Authentication is required.';
  END IF;
  IF expected_revision IS NULL OR expected_revision < 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'expected_revision must be a nonnegative integer.';
  END IF;
  IF next_payload IS NULL OR pg_catalog.jsonb_typeof(next_payload) <> 'object' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'The snapshot payload must be an object.';
  END IF;
  IF next_payload -> 'version' IS DISTINCT FROM '1'::jsonb THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'The snapshot payload version must be 1.';
  END IF;
  IF next_payload ->> 'owner' IS DISTINCT FROM current_user_id::text THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'The snapshot owner must match the authenticated account.';
  END IF;
  IF pg_catalog.octet_length(next_payload::text) > 10485760 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'The snapshot exceeds the 10 MiB limit.';
  END IF;

  -- A new snapshot is accepted only against the absent-row revision, zero.
  -- The unique key serializes simultaneous first writes; the loser then reads
  -- the committed winner and returns its actual revision and payload.
  IF expected_revision = 0 THEN
    INSERT INTO public.progress_snapshots AS snapshots
      (user_id, revision, payload, updated_at)
    VALUES (current_user_id, 1, next_payload, pg_catalog.clock_timestamp())
    ON CONFLICT (user_id) DO NOTHING
    RETURNING snapshots.revision, snapshots.payload
      INTO current_revision, current_payload;
    IF FOUND THEN
      RETURN pg_catalog.jsonb_build_object(
        'ok', true, 'revision', current_revision, 'payload', current_payload
      );
    END IF;
  END IF;

  SELECT snapshots.revision, snapshots.payload
    INTO current_revision, current_payload
    FROM public.progress_snapshots AS snapshots
    WHERE snapshots.user_id = current_user_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('ok', false, 'revision', 0, 'payload', NULL);
  END IF;
  IF current_revision <> expected_revision THEN
    RETURN pg_catalog.jsonb_build_object(
      'ok', false, 'revision', current_revision, 'payload', current_payload
    );
  END IF;

  UPDATE public.progress_snapshots AS snapshots
    SET revision = current_revision + 1,
        payload = next_payload,
        updated_at = pg_catalog.clock_timestamp()
    WHERE snapshots.user_id = current_user_id
    RETURNING snapshots.revision, snapshots.payload
      INTO current_revision, current_payload;

  RETURN pg_catalog.jsonb_build_object(
    'ok', true, 'revision', current_revision, 'payload', current_payload
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.save_progress_snapshot(bigint, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_progress_snapshot(bigint, jsonb)
  TO authenticated;

COMMENT ON TABLE public.progress_snapshots IS
  'An owned progress envelope per Auth account; app writes use the revision-checked RPC.';
COMMENT ON FUNCTION public.save_progress_snapshot(bigint, jsonb) IS
  'Authenticated, invoker-security compare-and-swap. A conflict returns the current server snapshot without changing it.';
