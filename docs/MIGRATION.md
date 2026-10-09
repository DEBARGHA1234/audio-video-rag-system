# ContextCore Database Consolidation Plan

**Status:** Proposal only — no live SQL, schema mutation, deletion, or data movement was performed while preparing this document.  
**Repository:** `DEBARGHA1234/audio-video-rag-system`  
**Target:** Supabase Postgres as the only application database.

## Why this migration is needed

The current application has two database paths:

- Manus OAuth user persistence uses Drizzle ORM with `drizzle-orm/mysql2`, the MySQL `users` schema, and `DATABASE_URL`.
- ContextCore workspace data uses Supabase Postgres through a server-only `SUPABASE_SERVICE_ROLE_KEY` client.

This split makes schema changes, backups, authorization, migrations, and local development harder to reason about. The target state is one Postgres database accessed through Drizzle for relational application queries, with pgvector for embeddings. Supabase remains the managed Postgres provider and storage/authorization boundary.

## Safety boundary

The following actions require explicit approval immediately before execution:

- Any `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`, `CREATE EXTENSION`, policy, function, or trigger applied to the live Supabase project.
- Any insert or update used to migrate existing user/RAG rows.
- Any deletion, rename, drop, or replacement of MySQL tables or Supabase objects.
- Removing `mysql2`, changing the production `DATABASE_URL`, or switching the runtime database adapter.

The first implementation pass will use additive, idempotent migrations and verification queries. No destructive SQL will be included in the first migration. Destructive cleanup will be a separate proposal after the new path has been validated.

## Current inventory

### Existing Drizzle/MySQL path

- Table: `users`.
- ORM: `drizzle-orm/mysql2`.
- Schema source: `drizzle/schema.ts`.
- Migration history: `drizzle/0000_initial_users.sql` and Drizzle metadata.
- Runtime access: `server/db.ts`, used by Manus OAuth SDK helpers.
- Environment: `DATABASE_URL`.

### Existing Supabase/Postgres path

The current Supabase project already contains the RAG tables below, with RLS enabled and demo rows flagged by `is_demo`:

- `workspaces`
- `workspace_members`
- `documents`
- `document_chunks`
- `queries`
- `query_citations`
- `answer_cache`
- `evaluation_cases`
- `evaluation_runs`
- `evaluation_results`
- `evaluation_daily`
- `activity_events`
- `usage_daily`
- `workspace_settings`

`document_chunks.embedding` is `extensions.vector(384)` and `chunks_embedding_hnsw_idx` exists. These tables are currently accessed through `@supabase/supabase-js`, not Drizzle.

## Target schema

### Identity and authorization

Add a Postgres `users` table that preserves the existing Manus OAuth identity values:

| Column | Type | Rule | Source |
|---|---|---|---|
| `id` | `bigint generated always as identity` or UUID | Primary key | Generated during migration |
| `open_id` | `text` | Unique, not null | MySQL `users.openId` |
| `name` | `text` | Nullable | MySQL `users.name` |
| `email` | `text` | Nullable | MySQL `users.email` |
| `login_method` | `text` | Nullable | MySQL `users.loginMethod` |
| `role` | enum/text | `user` or `admin` | MySQL `users.role` |
| `created_at` | `timestamptz` | Not null | MySQL `users.createdAt` |
| `updated_at` | `timestamptz` | Not null | MySQL `users.updatedAt` |
| `last_signed_in` | `timestamptz` | Not null | MySQL `users.lastSignedIn` |

The application will continue using Manus OAuth. This is **not** a Supabase Auth migration and does not create a Supabase Auth bridge. Existing session cookies and Manus identity verification remain unchanged.

`workspace_members.manus_user_id` will remain the stable authorization key for the current app. A later additive migration may add a foreign key to `users.open_id` after all production values have been validated. The first migration will not add a hard foreign key that could block legacy identities.

### Existing RAG tables

Keep the existing RAG tables and columns as the initial source-compatible target. Convert their access layer to Drizzle/Postgres without renaming columns in the same change. This reduces risk and keeps the current Supabase data and RLS policies intact.

Required additive changes for the media/RAG roadmap will be separate migrations after consolidation:

- `documents`: media MIME, duration, storage key, source type, job status, error, and content hash fields.
- `document_chunks`: `start_sec`, `end_sec`, `speaker`, `tsvector` search column, and embedding metadata.
- `ingestion_jobs`: durable background-job state and retry metadata.
- `transcript_segments`: timestamped transcript segments if segments need independent querying.

Those media tables are intentionally not created by this consolidation plan.

## Migration sequence

### Phase A — Read-only preflight

1. Read the current Git branch and working tree.
2. Inspect Supabase migration history, table definitions, row counts, RLS, policies, extensions, and indexes.
3. Inspect the current MySQL `users` row count and schema using the configured database connection, without changing data.
4. Confirm `pgvector` availability and the current vector dimension.
5. Capture a timestamped inventory report in `docs/migration-evidence/`.
6. Compare `users.openId` values against `workspace_members.manus_user_id` values and report orphaned identities.

Preflight must stop if the source database cannot be read, if row counts cannot be captured, or if any identity mapping is ambiguous.

### Phase B — Additive Postgres schema migration

1. Add the Drizzle Postgres driver dependency (`postgres`) and switch `drizzle.config.ts` to the Postgres dialect using `DATABASE_URL` or a separately named Supabase Postgres connection variable.
2. Convert `drizzle/schema.ts` from `mysql-core` to `pg-core` while preserving logical names and existing application field semantics.
3. Add the Postgres `users` table definition and a unique index on `open_id`.
4. Add indexes required for current auth lookups and workspace membership lookups.
5. Preserve the existing Supabase RAG tables and RLS policies. Drizzle migrations should use `if not exists` or carefully inspected existence guards where supported.
6. Move the contents of `supabase-evaluation-trend.sql` into a checked-in, numbered Drizzle SQL migration. The file may remain as a historical reference until the migration is verified; it must not be applied twice.
7. Keep `mysql2` installed during the compatibility window so the old auth path can be rolled back without an emergency dependency install.

### Phase C — Copy existing user data

1. Export or read the MySQL `users` rows into a migration script that maps names explicitly.
2. Insert into Postgres `users` using `open_id` as the idempotency key.
3. Preserve roles exactly; do not promote users based on email or display name.
4. Preserve timestamps where possible and record unmappable/null values in a migration report.
5. Verify source count, destination count, unique `open_id` count, role counts, and a sample hash comparison.
6. Do not delete or mutate the MySQL source.

The first data-copy script must be repeatable. A rerun should update only the documented mutable fields for matching `open_id` values and must not create duplicate identities.

### Phase D — Switch runtime reads/writes

1. Change `server/db.ts` to use `drizzle-orm/postgres-js` and a Postgres client.
2. Keep `server/supabase.ts` only for operations that genuinely require Supabase service APIs or storage; do not use the service role as a replacement for application authorization.
3. Move workspace reads/writes from the Supabase JS query builder to Drizzle queries, preserving current tRPC response shapes.
4. Add explicit workspace authorization checks using the existing Manus identity and `workspace_members`.
5. Run the current tests, type check, production build, and live read-only route smoke tests.
6. Write a canary user/session record through the new Drizzle/Postgres path only after read parity is confirmed.
7. Monitor query errors and latency before removing the old path.

### Phase E — Compatibility window and cutover

Keep the old MySQL path available until all of the following are true:

- Auth user read parity is verified.
- User upsert and last-sign-in updates succeed against Postgres.
- Workspace pages, ingestion, Q&A, Settings, evaluation, and admin routes pass live smoke tests.
- Production backup/export is confirmed.
- Rollback to the previous application commit is possible.
- No application code imports `drizzle-orm/mysql2` or `mysql2`.

Only then should a separate change remove `mysql2`, remove MySQL-specific Drizzle metadata, and update deployment secrets/configuration. Dropping or decommissioning the old MySQL table is outside this plan and requires a new confirmation.

## RLS and authorization plan

- Keep RLS enabled on every Supabase table.
- Keep public workspace reads limited to `workspaces.is_public = true` if the public route still needs them.
- Keep all document, chunk, query, citation, cache, evaluation, usage, activity, settings, and membership writes server-only until the client has a deliberate authenticated Supabase policy.
- Add server-side workspace membership checks before any read/write that currently uses the fixed demo workspace ID.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## Rollback plan

Before Phase C or later:

1. Save the current application commit and migration revision.
2. Export source row counts and checksums.
3. Do not delete the MySQL source.
4. Keep the previous runtime configuration available.
5. If Postgres parity fails, deploy the previous application commit and restore the prior `DATABASE_URL`/runtime configuration.
6. Do not roll back by dropping Postgres tables; additive objects can remain until a separately approved cleanup.

## Verification evidence required

The implementation should produce a report containing:

- MySQL users source count.
- Postgres users destination count.
- Count of duplicate `open_id` values in either source.
- Count of orphaned `workspace_members.manus_user_id` values.
- Per-table RAG row counts before and after access-layer conversion.
- RLS enabled and policy counts for every table.
- pgvector extension version and HNSW index definition.
- Results for `pnpm check`, `pnpm test`, and `pnpm build`.
- Live read/write smoke-test outcomes, with any test rows removed only if they were created by the test itself.

## Explicit approval gate

Approval is requested for **Phase A read-only preflight only** first. Phase A does not mutate the live database. After Phase A produces its evidence, a second approval will be requested before applying the additive Postgres schema migration or copying any user data.

No destructive SQL is included or authorized by this document.
