# ADR 0012 — Flat team authorization: any linked member is an admin

**Status**: Accepted
**Date**: 2026-07-23
**Relates to**: [ADR 0005](0005-member-content-to-db-provenance-additive.md) · [ADR 0006](0006-unified-github-auth-member-is-admin.md) · [ADR 0007](0007-db-enforced-authz-rls-is-app-admin.md) · migrations [0023](../../supabase/migrations/0023_flatten_authz_team_admin.sql) and [0024](../../supabase/migrations/0024_flatten_member_owned_tables.sql)

**Supersedes**: ADR 0006 (admin = `is_admin`) in full; ADR 0005's draft→approve gate.

## Context

T4 Labs is a small trusted team of four to five people. A single administrator is both a
recovery single point of failure and no safer than the same trusted team acting together. The
previous `is_admin` split and member-content approval queue added a workflow boundary that does
not fit the team's operating model.

## Decision

Every linked team member is a full admin. There is no member/admin split and no approval queue for
team content. Existing database authorization remains authoritative: `is_app_admin()` is the
database-side decision used by RLS and admin RPCs, while the application check remains defense in
depth.

The allowlist boundary is load-bearing. `link_current_member()` is UPDATE-only: it claims a
pre-seeded `members` row whose GitHub login matches the caller's unspoofable GitHub identity, only
when that row is still unlinked. It never inserts a row. Therefore “every member = admin” means
the pre-seeded team, not every public GitHub user.

The existing column grants remain part of the security model. Widening row access for linked team
members does not grant writes to identity or privilege columns such as `auth_user_id`,
`github_user_id`, `is_admin`, `slug`, or `handle`.

## Consequences

- Any linked teammate can edit team content and publish it directly.
- The draft→approve member-content workflow is removed; manual editorial flows remain available
  without that approval gate.
- The pre-seeded-member allowlist and database-enforced RLS remain mandatory; this decision does
  not make public users administrators.
- Recovery is resilient because any linked teammate can correct a broken or defaced content row.
