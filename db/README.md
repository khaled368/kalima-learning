# Account progress storage

The Supabase project recorded in [project.json](project.json) stores one progress
snapshot per Auth account. Website assets and local progress continue to work
independently; the browser syncs an owned snapshot after sign-in.

## Files

- [schema.sql](schema.sql) defines the table, ownership policies, explicit grants
  and compare-and-swap RPC. Apply it once through the hosted migration workflow.
- [verify-rls.sql](verify-rls.sql) checks the deployed database with two isolated
  test accounts. Run it through a privileged SQL connection after applying the
  schema. It finishes with `ROLLBACK` and a single `PASS` result.

The verification script uses random account IDs and reserved
`@example.invalid` addresses. It inserts Auth fixtures directly inside its
transaction; it does not call signup or send email. Every fixture and write is
rolled back. If a SQL runner stops at a failed assertion, roll back that same
connection before continuing.

## Snapshot format

`public.progress_snapshots` has these columns:

| Column | Meaning |
| --- | --- |
| `user_id` | Primary key and foreign key to `auth.users(id)`, deleted with its Auth account. |
| `revision` | Nonnegative `bigint`, default `0`; accepted RPC saves advance it by one. |
| `payload` | Required JSON object, with numeric `version: 1` and `owner` equal to `user_id` as a UUID string. |
| `updated_at` | Server timestamp of the last accepted save. |

The payload has no empty-object default because an empty object would not be a
valid owned envelope. An example envelope is:

```json
{
  "version": 1,
  "owner": "the-authenticated-user-uuid",
  "clock": 1,
  "values": {
    "wort-learned": "[0]"
  },
  "stamps": {
    "wort-learned": { "n": 1, "actor": "this-browser" }
  },
  "saved": {},
  "conflicts": []
}
```

The client allowlists progress keys and handles merging and conflict resolution.
The database treats the envelope contents as opaque data after validating its
object shape, supported version, owner and maximum size. Serialized JSON must
be at most **10 MiB** (`10,485,760` UTF-8 bytes); compression does not bypass this
check. Auth tokens, credentials and application secrets do not belong in the
progress envelope.

## Reading and saving

Use the normal browser Supabase client with its publishable key and the signed-in
user's JWT. Never embed a secret or `service_role` key in the website.

Reading the account's current state:

```js
const { data, error } = await supabase
  .from('progress_snapshots')
  .select('revision, payload, updated_at')
  .eq('user_id', user.id)
  .maybeSingle();
```

No row means revision `0`. Save through:

```js
const { data, error } = await supabase.rpc('save_progress_snapshot', {
  expected_revision: currentRevision,
  next_payload: nextEnvelope
});
```

The RPC derives the owner from `auth.uid()`; there is no caller-supplied account
ID parameter.

- A first save with expected revision `0` creates revision `1`.
- A matching existing revision is locked, updated and incremented once.
- A stale revision returns `{ "ok": false, "revision": current, "payload": currentPayload }`
  and changes neither data nor its timestamp.
- A stale save against a missing row returns
  `{ "ok": false, "revision": 0, "payload": null }` and creates nothing.

On a conflict, reconcile the returned server envelope with the local envelope
before retrying at the returned revision. Do not silently replace a conflicting
snapshot or retry with guessed revision numbers.

The UUID primary key serializes competing first inserts. Existing-row saves use
`SELECT ... FOR UPDATE`, so another accepted save cannot slip between the
revision comparison and update. There is no automatic JSON merge in SQL.

## Permissions

RLS is enabled. The `authenticated` role can select, insert and update only the
row whose `user_id` matches `(SELECT auth.uid())`. The update policy includes
both `USING` and `WITH CHECK`, so moving a row to another owner is denied.

The table and function revoke inherited `PUBLIC`, `anon` and `authenticated`
privileges before granting the intended access explicitly:

- `authenticated`: table `SELECT`, `INSERT`, `UPDATE`, and RPC `EXECUTE`.
- `anon`: no table or RPC access.
- No client `DELETE` or `TRUNCATE` grant or delete policy.

The RPC uses `SECURITY INVOKER` and an empty `search_path`, with qualified
database references. Its writes obey the same RLS policies as direct queries.
The table owner check also protects direct writes from storing a different
envelope owner. Client saves must use the RPC to follow the revision protocol;
the underlying insert/update grants are necessary for invoker-security SQL and
do not prevent an account from directly editing its own permitted row.

The primary-key index supports account lookups and the ownership predicate. No
JSON index is needed because the application does not query inside snapshots.

## Supabase deployment notes

New tables are not guaranteed to become accessible through the Data API solely
because they are in `public`. Current Supabase Data API guidance requires
explicit grants in addition to RLS; this schema includes both. Ensure `public`
is in the project's exposed schemas. Only the publishable key belongs in browser
configuration; project administration and migrations use the connected account.

The implementation follows the April 28, 2026 Data API grant guidance checked in
the deployment workflow. Modern browser HTTPS does not require legacy TLS-CBC
cipher support; the October 2026 CBC deprecation does not require weakening TLS
settings for this client.

References:

- [Supabase changelog](https://supabase.com/changelog.md)
- [Securing the Data API](https://supabase.com/docs/guides/api/securing-your-api)
- [Row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Database functions](https://supabase.com/docs/guides/database/functions)

After deployment, run the verification script and the Supabase security and
performance advisors. The rollback script tests ownership, grants, direct-write
checks, missing authentication, revision conflicts, size limits and Auth-user
cascade. Concurrent first-write serialization is also enforced by the primary
key and SQL locking; the single-connection rollback script checks the conflict
protocol without opening a second database connection.
