# ADR 0006 — Unified auth: members and admins log in with GitHub; admin = a member flagged `is_admin`

**Status**: Superseded by 0012 · original decision accepted 2026-07-15 · merged to `master` (PR #34, `c8a131f`)
**Relates to**: [ADR 0005](0005-member-content-to-db-provenance-additive.md) (member CMS) · [ADR 0007](0007-db-enforced-authz-rls-is-app-admin.md) (DB authz) · Epic C #53/#57
**Spec**: `docs/superpowers/specs/2026-07-15-member-profile-cms.md`

## Context

Two auth systems existed side by side:

- **Admin CMS** — email/password (`supabase.auth.signInWithPassword`) gated by an
  `ADMIN_EMAILS` allowlist checked only in the `/admin` layout
  (`app/admin/(dash)/layout.tsx`).
- **Member area** — "Log in with GitHub" (Supabase OAuth), matched to a `members` row by
  **GitHub login** (not handle/email — they differ), scoped by `auth_user_id`
  (`app/auth/callback/route.ts` → `link_current_member()`; `lib/member-session.ts`).

The team wants **one login**: "คนในทีมต้องสามารถปรับ Website ได้" — teammates should reach
the admin CMS with the same GitHub login they already use, not a separate password account.

A latent hole surfaced once members could authenticate: `isAllowedAdmin` returned `true`
for **any** signed-in user when `ADMIN_EMAILS` was empty (it was), so any GitHub-logged-in
member could reach `/admin`.

## Decision

**An admin is a member flagged `members.is_admin`** (same GitHub login as everyone else);
email/password + `ADMIN_EMAILS` stays as a break-glass fallback (user's choice).

- Schema: `members.is_admin boolean default false` (migration `0011`). Bootstrapped
  `xenodev`; admins grant others via the members roster toggle (`admin_set_member_admin`
  RPC, see ADR 0007).
- Gate: `lib/admin-access.ts::getAdminSession()` admits `member.is_admin` (primary, by
  `auth_user_id`) **OR** an `ADMIN_EMAILS` match (fallback). The `/admin` layout uses it.
- Admin login page adds a "เข้าสู่ระบบด้วย GitHub" button (`/auth/callback?next=/admin`)
  above the email form.
- **Fail-closed**: `isAllowedAdmin` now returns `false` on an empty/unset allowlist
  (commit `c49a32f`) — an empty list admits nobody. Verified: members cannot self-elevate
  (`members.is_admin` is not in any `authenticated` UPDATE grant — column-protected).

Key commits: `ed54906` (unified auth), `c49a32f` (fail-closed).

## Consequences

- One login for the whole team; `/admin` is reached via GitHub. Verified live: `xenodev`
  (a GitHub member flagged admin) reached `/admin`, toggled a teammate's flag, and approved
  content through the real UI.
- **Human action required**: set `is_admin` for other teammates at `/admin/members` (only
  `xenodev` is bootstrapped); optionally set `ADMIN_EMAILS` + run `seed-app-admins.ts` for
  the email fallback path.
- Admin identity now lives in the DB (`members.is_admin` / `app_admins`), which lets the
  database enforce authorization directly — [ADR 0007](0007-db-enforced-authz-rls-is-app-admin.md).

## Alternatives considered

- **Keep two separate auth systems** — rejected: the team wants one login; two systems
  double the surface.
- **All members are admins** — rejected (user chose a per-person flag): editors/PM should
  self-edit without full CMS write access.
- **A dedicated roles/RBAC table** — deferred as over-engineered for a member-vs-admin split;
  a single `is_admin` flag suffices today.
