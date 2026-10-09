# Database migrations

`0000_initial_users.sql` is the original MySQL/Drizzle migration retained for rollback history during the compatibility window.

`0001_contextcore_postgres_users.sql` is the additive Supabase Postgres migration for the Manus OAuth users table. It is idempotent and contains no destructive statements.

`0002_contextcore_evaluation_daily.sql` is the checked-in Postgres form of the previously applied evaluation trend migration. Its upsert seed is safe to rerun, but the live Supabase migration history must be checked before applying it again.

The runtime Drizzle switch to `postgres-js` is intentionally gated until a direct Supabase Postgres connection string is available as a server-only secret. The existing MySQL path remains available for rollback during this compatibility window.

`0003_contextcore_users_identity_sequence.sql` is prepared but not applied. It requires explicit approval because it changes live sequence state after the explicit-id import.

`pnpm db:migrate` is guarded to accept only a MySQL `DATABASE_URL`; `pnpm db:pg:migrate` is guarded to accept only a Postgres `SUPABASE_DATABASE_URL`. The copy command refuses when `SUPABASE_DATABASE_URL` is set or `CUTOVER_DONE=1`.
