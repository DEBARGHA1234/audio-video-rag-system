# Database consolidation preflight

**Date:** 2026-10-09  
**Mode:** Read-only; no SQL mutation or data movement was performed.

## MySQL source

- `users` rows: 1
- Distinct `openId` values: 1
- Admin rows: 0
- Oldest `createdAt`: 2026-10-05T05:30:21.000Z
- Latest `lastSignedIn`: 2026-10-05T05:31:01.000Z

## Supabase target

- Public RAG tables: 14
- All 14 tables have RLS enabled.
- All 14 tables have at least one explicit policy.
- `vector` extension: installed, version 0.8.0, schema `extensions`.
- `document_chunks.embedding`: `extensions.vector` user-defined type.
- Existing RAG demo rows remain flagged with `is_demo = true`.
- Seven ContextCore migrations are already recorded in Supabase migration history:
  - `contextcore_initial_schema_and_demo_seed`
  - `contextcore_evaluation_daily`
  - `contextcore_rls_and_fk_hardening`
  - `contextcore_cleanup_smoke_rows`
  - `contextcore_usage_indexed_chunks`
  - `contextcore_restore_demo_flags`
  - `contextcore_advisor_cleanup`

## Current row counts

| Table | Rows | Demo rows |
|---|---:|---:|
| `workspaces` | 1 | 1 |
| `workspace_members` | 1 | 1 |
| `documents` | 4 | 4 |
| `document_chunks` | 4 | 4 |
| `queries` | 4 | 4 |
| `query_citations` | 4 | 4 |
| `answer_cache` | 1 | 1 |
| `evaluation_cases` | 4 | 4 |
| `evaluation_runs` | 1 | 1 |
| `evaluation_results` | 4 | 4 |
| `evaluation_daily` | 7 | 7 |
| `activity_events` | 4 | 4 |
| `usage_daily` | 7 | 7 |
| `workspace_settings` | 1 | 1 |

## Identity mapping

The identifier comparison was performed in memory and reported only as counts. No user identifiers were copied, printed, or modified.

- MySQL user identifiers: 1
- Supabase workspace-member identifiers: 1
- Exact overlap: 0
- MySQL-only identifiers: 1
- Supabase-only identifiers: 1

This mismatch must be resolved explicitly before adding a foreign key or changing authorization behavior. The first migration therefore keeps `workspace_members.manus_user_id` as text and does not add a foreign key to the new `users` table.

## Decision

The database is small enough for an idempotent additive Postgres users migration and a controlled data copy. The main unresolved migration decision is whether the runtime should switch directly after parity checks or use a short compatibility window with both drivers installed. The proposed plan chooses the compatibility window.

## Additive migration verification

- `public.users` rows: 1
- Distinct `open_id` values: 1
- Admin rows: 0
- RLS enabled: yes
- Explicit policy count: 1
- Columns verified: `id`, `open_id`, `name`, `email`, `login_method`, `role`, `created_at`, `updated_at`, `last_signed_in`
- Idempotent copy rerun: passed; destination remained one row.
- No MySQL table was deleted or altered.
- No destructive SQL was executed.

## Repository checks

- `pnpm check`: passed
- `pnpm test`: passed — 2 files, 6 tests
- `pnpm build`: passed

## Identity sequence verification

The approved `0003_contextcore_users_identity_sequence.sql` migration was applied on 2026-10-10. Before verification, `max(public.users.id)` was 1. A normal Supabase upsert without an explicit `id` allocated ID 2, proving the identity sequence advanced. Exactly one temporary test row was deleted by its unique generated `open_id` marker.

Post-verification state: `public.users` has 1 row, `max(id) = 1`, the sequence last value is 2, RLS remains enabled, and the table has 1 policy. No identity or membership data changed.
