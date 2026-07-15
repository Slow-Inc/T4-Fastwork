# Member CMS + unified admin auth — activation runbook

Post-merge operational steps for the member CMS (PR #34, `c8a131f`, 2026-07-15).
Decisions: [ADR 0005](../adr/0005-member-content-to-db-provenance-additive.md) (content→DB),
[0006](../adr/0006-unified-github-auth-member-is-admin.md) (unified GitHub auth),
[0007](../adr/0007-db-enforced-authz-rls-is-app-admin.md) (DB-enforced authz),
[0008](../adr/0008-ai-display-ranking-order-not-content.md) (AI ranking).

## Migrations (already applied to prod)

Migrations `0004`–`0017` are applied to the Supabase project `t4-fastwork`
(`ngpsbetwbhbemcoequoy`) — members table, member content, RLS + column grants, unified-auth
`is_admin`, and the security fixes. Drizzle migrations run via `bun run db:migrate`
(needs `DATABASE_URL`); Supabase-only SQL under `supabase/migrations/` is applied via the
Supabase MCP. Re-applying is idempotent.

## Required human steps

1. **Grant admin to teammates.** Only `xenodev` is bootstrapped as an admin. An existing admin
   flags others at **`/admin/members`** (the "Admin" toggle → `admin_set_member_admin` RPC,
   gated by `is_app_admin()`). A member reaches `/admin` by logging in with **GitHub** (no
   separate password).

2. **(Optional) email/password fallback.** `ADMIN_EMAILS` is empty, so the email login admits
   nobody (fail-closed, by design). To enable the break-glass path: set `ADMIN_EMAILS` in
   `nextjs/.env.local` + the Vercel project, then sync it into the DB allowlist:
   ```
   cd nestjs
   ADMIN_EMAILS="$(grep '^ADMIN_EMAILS=' ../nextjs/.env.local | cut -d= -f2- | tr -d '\r')" \
     bun src/database/seed-app-admins.ts
   ```

3. **Frontend env (prod).** The member/admin flows need `NEXT_PUBLIC_SUPABASE_URL` +
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` on Vercel (already used by the public reads). The
   GitHub OAuth provider must be enabled in Supabase Auth with the prod callback
   `…/auth/callback` registered on the GitHub OAuth app.

4. **(Optional) run the AI display-rank job.** Ranking is dormant until `POST /rank/refresh`
   (secret-guarded, needs the backend + `CUSTOM_OPENAI_*` gateway) populates `ai_rank`; until
   then listings fall back to `sort_order`/seed order. Wire it to the refresh cron for
   steady-state.

## Operational notes (carry forward)

- **Authorization is in the database.** Members write via the browser client + RLS
  (own-row, column-scoped); admins write via `is_app_admin()` RLS policies + SECURITY DEFINER
  RPCs — **no service-role key**. The backend superuser pooler (GitHub sync, rank job, seeds)
  bypasses RLS. Run `/security-review` on every RLS/auth/admin-write change.
- **The recurring RLS pitfall:** Supabase auto-grants table-wide privileges to
  `anon`/`authenticated`, silently overriding column-scoped grants — always
  `revoke … then grant (col,…)` and confirm with `has_column_privilege(...)`.
- **Verify member flows** with a logged-in member session (Playwright) + Supabase MCP DB
  assertions; **admin-only flows** are also reachable once a teammate is `is_admin`.
- **Known deferred (#45/#51):** the projects *catalog* content is not yet in the DB (only
  rank-holder rows are); moving it fully is a parity-sensitive follow-up. Pre-existing RLS
  tech-debt remains on `document_embeddings`/`conversations`/`messages` (see the ledger).
