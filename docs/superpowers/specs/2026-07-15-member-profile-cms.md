# PRD — Epic C: Member self-service profile CMS

> Part of the vision umbrella `2026-07-15-showcase-cms-vision.md`. English doc
> (bilingual applies to the GitHub tracker). Shared decisions D1–D5 live in the
> umbrella; this PRD applies them to member profiles. Largest epic; Phase-2 (DB).

> **STATUS — SHIPPED + MERGED (PR #34, `c8a131f`), 2026-07-15.** C1–C6 delivered +
> verified; issues **#52–#57 closed** (epic #46). Two things CHANGED during
> implementation vs the plan below — the ADRs are the shipped truth:
> - **Auth (C2) — UNIFIED, not "admin path unchanged".** Admin is now a member flagged
>   `members.is_admin` (same GitHub login); `ADMIN_EMAILS` is only a break-glass
>   fallback; member scoping is by `auth_user_id`. **Supersedes** the "Auth (C2)" section
>   + "admin stays authoritative / admin path unchanged" (lines below).
>   → [ADR 0006](../../adr/0006-unified-github-auth-member-is-admin.md).
> - **Authorization is DB-enforced** — RLS on every content table + column grants +
>   `is_app_admin()` SECURITY DEFINER, **no service-role key** (far beyond the "fold RLS
>   into C2's review" note in §Risks). → [ADR 0007](../../adr/0007-db-enforced-authz-rls-is-app-admin.md).
> - Data model + `*_owner` provenance + additive draft→approve →
>   [ADR 0005](../../adr/0005-member-content-to-db-provenance-additive.md).
> - Beyond the plan: README-content **override** shipped (not just the visibility toggle).

## Problem

Team/member profiles are **hardcoded** in `nextjs/content/site.ts` (`team:
TeamMember[]`, `dynamicParams=false`). There is **no `members` DB table**, no
per-member auth, and the admin CMS is single-tier (`ADMIN_EMAILS` allowlist, no
roles, no scoping). A member cannot edit their own profile, choose which of their
GitHub repos to show, toggle their README, or add their own certificates/articles.
The only dynamic member data today is the live GitHub overlay (avatar/README/stars).

## Goals

- A member logs in and edits **only their own** profile (D5).
- **Override** GitHub-sourced fields; **author** additive content (D-model below).
- Public pages read members from the DB, keeping the static-fallback pattern.
- Reuse, don't reinvent: the per-field provenance model (D1) and the draft/approve
  philosophy (D4).

## Non-goals

- Full RBAC beyond member-vs-admin. - Editing other members' data. - Replacing the
  admin CMS (admin stays authoritative, D5). - Non-GitHub identity providers.

## Data model (C1)

Migrate `team` out of `content/site.ts` into a `members` table:
- Identity: `handle` (GitHub login, unique), `slug`, `name`, `role`, `role_en`,
  `github_url`, `education` (jsonb), `sort_order`.
- Editable profile: `skills text[]`, `stack text[]`, `readme_visible boolean`,
  plus profile copy fields.
- **Provenance (D1):** a `*_owner 'auto'|'human'` per editable field. GitHub sync
  fills `'auto'` fields; a member edit flips that field to `'human'` and is never
  overwritten.
- Relations: `member_projects` (which GitHub repos to show — selection over the
  fetched repo list), `member_certificates` (additive), authored `blog_posts.author_id`.
- Keep the static `content/site.ts` team as the **seed + fallback** (migrate its data
  in, then read DB-first).

## Auth (C2, applies D3 + D5)

- **GitHub OAuth** ("Log in with GitHub"). On callback, map the GitHub login →
  `members.handle`; only known members get a member session (others → not a member).
- Route guard: a member may read/write **only their own** `members` row + relations.
- Admins (existing `ADMIN_EMAILS`) keep global scope; the two auth paths coexist.

## Override vs additive (the two field kinds)

- **Override** (GitHub baseline exists, member edits on top): profile fields, skills,
  tech stack, README toggle, **project selection** (pick from the fetched repo list).
  No approval — the member's own facts (D4).
- **Additive** (no GitHub source, default empty, member authors): **certificates**,
  **blog articles** → created `draft`, **admin approves/publishes** (D4).

## Deliverables (issues)

- **C1 — `members` schema + migrate `content/site.ts`.** Table + relations +
  provenance columns; seed from the current static team; DB-first repo with static
  fallback.
- **C2 — GitHub OAuth member login + scoping.** OAuth flow, session→member link,
  own-record guard; admin path unchanged (D3/D5).
- **C3 — Member edit UI (override fields).** Profile, skills, tech stack, README
  toggle, **project selection** from the fetched GitHub repo list; each edit flips
  provenance to `'human'` (D1).
- **C4 — Additive authoring + approve.** Member certificate + blog authoring as
  `draft`; **admin approve/publish queue**; add the missing admin edit actions for
  blog/certs (today create+delete only).
- **C5 — Public read path on DB.** `/team/[slug]` + home team sections + aggregated
  certs read members/relations from the DB (static fallback preserved); retire the
  `dynamicParams=false` constraint.
- **C6 — Admin Team/Members section.** A dash section for global member management +
  the D4 approval queue.

## Testing

Pure mappers/guards/provenance-reconcile unit-tested (bun); auth-scoping tests
(a member cannot write another's row); repo DB-first/fallback tests; e2e for the
member edit flow + the public read reflecting an edit. Security-review the OAuth +
scoping boundary (auth boundary → `/security-review`, per workflow).

## Risks & sequencing

- **Biggest blast radius** (auth + DB migration of live content) → land after A + B;
  migrate behind the static fallback so a bad deploy degrades to today's behaviour.
- **RLS:** the survey flagged pre-existing `rls_disabled_in_public` on many tables;
  member-writable tables **must** get correct RLS/anon policies — fold into C2's
  security review.
- **Identity drift:** a member renaming their GitHub login breaks the handle map →
  store the GitHub numeric user id as the stable key.
