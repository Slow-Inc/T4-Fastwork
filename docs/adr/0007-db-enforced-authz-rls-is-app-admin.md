# ADR 0007 — Authorization enforced at the database: RLS everywhere + `is_app_admin()` SECURITY DEFINER, no service-role key

**Status**: Accepted · 2026-07-15 · merged to `master` (PR #34, `c8a131f`)
**Relates to**: [ADR 0005](0005-member-content-to-db-provenance-additive.md) (member CMS) · [ADR 0006](0006-unified-github-auth-member-is-admin.md) (admin identity)
**Spec**: pre-merge `/scrutinize` + `/security-review` (PR #34 body)

## Context

Once members can authenticate ([ADR 0006](0006-unified-github-auth-member-is-admin.md)) and
own DB content ([ADR 0005](0005-member-content-to-db-provenance-additive.md)), the app can no
longer trust the app layer alone for write authorization:

- Member writes are **client-side** (`supabase.from(...).update/insert/delete` via the
  browser client) — the established convention (`app/member/member-profile-form.tsx` etc.),
  so the database, not the client, must enforce who-writes-what.
- Admin writes go through **Server Actions using the cookie client** (role `authenticated`),
  which RLS-enabled tables would block, and **there is no `SUPABASE_SERVICE_ROLE_KEY` in the
  environment** to bypass RLS.
- The pre-merge review proved two real escalations that the app-layer guard did not stop:
  (a) admin Server Actions never re-checked admin, and (b) `projects`/`services`/`faqs`/
  `certificates`/taxonomy had **no RLS** + default `authenticated` write grants, so a member
  could write them **directly via PostgREST**, bypassing the Server Actions entirely
  (confirmed by JWT simulation: a member `INSERT`ed into `projects`).

## Decision

**Authorization is enforced in the database (RLS + grants), with the app layer as
defense-in-depth — never the sole gate.**

- **Member writes**: RLS policies scope every write to the member's own rows via the FK
  (`member_id in (select id from members where auth_user_id = auth.uid())`), and **column
  grants** limit which fields (revoke the table grant, then `grant update (col,…)`) — e.g.
  a member cannot set `status`/`ai_rank`/`views` or flip `is_admin`. Verified with
  `has_column_privilege` + JWT simulation on every table.
- **Admin writes without a service role**: `app_admins` + `members.is_admin` →
  `is_app_admin()` (SECURITY DEFINER, `search_path=public`, reads the JWT email / `auth.uid`).
  Privileged mutations that must bypass the member column-grant run through SECURITY DEFINER
  RPCs gated by `is_app_admin()` (`admin_set_member_certificate_status`,
  `admin_set_member_admin`); admin content writes use `is_app_admin()` RLS policies.
  **Not** the `service_role` key.
- **RLS everywhere**: every public content table is RLS-gated — public read, admin-only write
  (`projects`/`services`/`faqs`/`certificates`/`categories`/`technologies`/`tags` +
  `project_tags`/`project_technologies`, migrations `0016`/`0017`); the member tables +
  `blog_posts` were already RLS'd (`0005`–`0013`, `0015`). The backend superuser pooler
  (GitHub sync / rank job) bypasses RLS as intended.
- **Defense-in-depth**: `assertAdmin()` (`lib/admin-access.ts`) at the top of all 17 admin
  mutation Server Actions — even though RLS is now the real gate.

Key commits: `1f8d4ed` (approve RPC), `ed54906` (is_admin/RPCs), `149623d` (assertAdmin +
blog column-scope), `f9aeda5` (RLS on public tables + M2M). Migrations `0005`–`0017`.

## Consequences

- A signed-in non-admin cannot write public content by any path (Server Action or direct
  PostgREST) — verified blocked ("new row violates row-level security policy"). Public reads
  intact; admin writes work via `is_app_admin()`; backend superuser unaffected.
- **The recurring pitfall to keep watching**: Supabase auto-grants table-wide privileges to
  `anon`/`authenticated`, which silently override column-scoped grants — always
  `revoke … then grant (col,…)` and confirm with `has_column_privilege(...)`. RLS policies
  gate rows; column grants gate fields; both are needed.
- No `service_role` key on the frontend — smaller blast radius, but admin approval logic must
  live in DB-gated RPCs, not app code.
- **Out of scope (pre-existing tech-debt)**: `document_embeddings`/`conversations`/`messages`
  still lack RLS; `conversations.session_id` exposure; media-bucket listing — noted in the
  ledger for a separate pass.

## Alternatives considered

- **`SUPABASE_SERVICE_ROLE_KEY` for admin writes** — rejected: no key in env, and it widens
  the blast radius (a leaked key bypasses all RLS). The `is_app_admin()` + SECURITY DEFINER
  pattern keeps privilege in the DB.
- **App-layer guard only (`assertAdmin` / layout)** — rejected as insufficient: members hold
  a Supabase session and can hit PostgREST directly, bypassing all app code.
