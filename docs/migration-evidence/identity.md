# Identity mismatch investigation

**Date:** 2026-10-10  
**Mode:** Read-only investigation; no identity rows or authorization policies were changed.

## Observed evidence

The current source/destination comparison has one row on each side and zero exact matches:

| Source | Count | Identity evidence |
|---|---:|---|
| MySQL `users.openId` | 1 | Length 22; SHA-256 prefix `e6123c9278714d07`; does not match the membership value |
| Supabase `workspace_members.manus_user_id` | 1 | Length 15; SHA-256 prefix `04cc04f0e2720512`; `is_demo = true`; role `owner`; looks like a seeded demo/test identifier |
| Exact overlap | 0 | No match |

The raw identity strings are intentionally not recorded in this document.

## Explanation

The evidence strongly supports that the Supabase membership row is a **seeded demo membership**, not the current signed-in production/preview OAuth identity. Its `is_demo = true` flag, owner role, shorter length, and demo/test-like shape distinguish it from the MySQL OAuth row.

A preview-versus-production OAuth ID difference is possible in general, because OAuth providers can issue different identifiers across applications or environments, but the current database does not contain environment provenance for either value. Therefore the repository cannot prove that preview/prod separation is the cause. The defensible conclusion is: **the immediate mismatch is caused by seeded demo membership; environment-specific OAuth provenance remains unverified.**

## Exact mapping proposal

The canonical application identity will be the Manus OAuth `session.openId`, persisted as `public.users.open_id`. Mapping will be by exact equality only:

```text
session.openId == users.open_id == workspace_members.manus_user_id
```

No mapping by email, display name, hash prefix, row ID, or fuzzy match will be used. The seeded demo membership will not be silently rewritten to the current user's ID.

If the user needs access, an authorized server-side/admin operation will create a new membership row with:

```text
workspace_members.workspace_id = requested workspace UUID
workspace_members.manus_user_id = authenticated session.openId
workspace_members.role = explicitly selected role
workspace_members.is_demo = false
```

That explicit membership grant is outside this investigation and requires separate approval before identity data or authorization state changes.

## Exact server-side authorization check

Before protected workspace reads or writes, the server will resolve the Manus session and perform this check:

```ts
const sessionUserId = ctx.user?.openId;
if (!sessionUserId) throw new TRPCError({ code: "UNAUTHORIZED" });

const { data: membership, error } = await supabase
  .from("workspace_members")
  .select("role")
  .eq("workspace_id", workspaceId)
  .eq("manus_user_id", sessionUserId)
  .maybeSingle();

if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
if (!membership) throw new TRPCError({ code: "FORBIDDEN" });

const canWrite = membership.role === "owner" || membership.role === "admin" || membership.role === "member";
const canManage = membership.role === "owner" || membership.role === "admin";
```

The final implementation will keep `canWrite` and `canManage` checks adjacent to the mutation/query procedure rather than relying only on frontend route visibility. Public workspaces may have narrowly scoped public reads, but mutations and private workspace reads still require exact membership.

## What happens if IDs do not match

The account remains authenticated and its row in `public.users` is preserved. It does **not** receive access merely because a user row exists. For a private workspace, a mismatch produces `403 FORBIDDEN` for workspace reads and writes. For protected mutations, the request is rejected before any document, query, settings, or evaluation row is changed. The seeded demo membership continues to authorize only its exact seeded identifier and does not grant access to the current account.

To restore access, an administrator must explicitly grant membership for the current exact `session.openId`, or the OAuth environment must be corrected so the same canonical ID is used. No automatic identity merge will run.

## Approval gate

This identity mapping and authorization check are proposals only. No identity data, membership row, RLS policy, or runtime authorization behavior was changed during this investigation. Approval is required before implementing the membership grant path or switching workspace procedures from public access to the exact membership check.
