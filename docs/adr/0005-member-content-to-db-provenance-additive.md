# ADR 0005 — Member profiles & showcase content: static → Supabase, with per-field provenance and additive draft→approve

**Status**: Accepted · 2026-07-15 · merged to `master` (PR #34, `c8a131f`)
**Relates to**: [ADR 0003](0003-github-live-team-portfolio.md) (live GitHub portfolio) · Epic C #46 (#52–#57)
**Spec**: `docs/superpowers/specs/2026-07-15-member-profile-cms.md` · `…-showcase-cms-vision.md`

## Context

Team/member showcase data (profiles, per-member projects, certificates, the collaborative
"team work", the blog) was **hand-authored and frozen** in `nextjs/content/site.ts`
(`team: TeamMember[]`, `teamProjects`) + `content/catalog.ts` + `content/blog.ts`, with
`dynamicParams = false` on `/team/[slug]`. A member could not edit their own profile,
choose which repos to show, or add a certificate/article without a code change + redeploy.
The only dynamic layer was the live-GitHub overlay (ADR 0003).

The vision (`showcase-vision-2026-07`) needs a member-editable CMS where GitHub is the
baseline source and members layer edits on top, split into two kinds of content:
**override** (a GitHub baseline exists — profile, skills, stack, README, repo selection)
and **additive** (no source, member authors — certificates, blog articles).

## Decision

Migrate the per-member/team showcase content into Supabase, member-editable, keeping the
static files as the seed + fallback:

- **Tables** (Drizzle, `nestjs/src/database/schema/{members.ts,member-content.ts}`,
  migrations `0004`/`0006`): `members` (profile/skills/stack/education/readme_visible/
  readme_override), `member_projects` (+`selected`), `member_certificates` (+`status`
  draft|published), `team_projects` (collaborative, `contributors[]`). Each content row
  also carries `ai_rank` (see [ADR 0008](0008-ai-display-ranking-order-not-content.md)).
- **Per-field provenance (D1)**: `*_owner 'auto'|'human'` columns (e.g. `members.skills_owner`)
  + a BEFORE-UPDATE trigger `members_flag_human_edits` (migration `0006`) that flips a field
  to `'human'` on a member edit, so a future GitHub sync never overwrites a member's own edit.
- **Override vs additive (D4)**: override fields are the member's own facts — no approval.
  **Superseded by ADR 0012:** the additive-content draft→approve gate was removed; linked team
  members publish team content directly. The static→DB provenance decision remains valid.
- **Read path**: DB-first repos with a static fallback so a bad deploy degrades to today's
  behaviour — `nextjs/lib/members-repo.ts` (`getTeamMembers`, `getMemberBySlug`),
  `member-content-repo.ts`, `certificates-repo.ts`, `blog-repo.ts`. `/team/[slug]` dropped
  `dynamicParams=false`. Pure snake→camel mappers (`member-map.ts`, `member-content-map.ts`)
  are unit-tested.

Key commits: `4ed106a` (members C1), `3d07704` (certs/projects foundation), `9b791f2` (C5
/team reads DB), `6afa591`/`184c7da` (C3 self-edit).

## Consequences

- Members self-serve; edits reflect on the public site without a redeploy. Verified live
  end-to-end (Playwright member session + Supabase MCP assertions).
- The static `content/site.ts` team array remains as the seed source + runtime fallback —
  two sources of truth exist transitionally; the DB wins when reachable.
- Auth + write-authorization for these tables is a separate, load-bearing decision —
  [ADR 0006](0006-unified-github-auth-member-is-admin.md) (who) and
  [ADR 0007](0007-db-enforced-authz-rls-is-app-admin.md) (how, at the DB).
- **Deferred**: the projects *catalog* (`content/catalog.ts`) content is NOT yet in the DB
  (only rank-holder rows are — ADR 0008); full content migration (M2M tech/tags, `tone`,
  `description_en`, category reconcile) is a parity-sensitive follow-up (#45/#51).

## Alternatives considered

- **Keep static, edit via PRs** — rejected: not member-self-service; every edit is a deploy.
- **A single generic CMS table** — rejected: the override/additive split + provenance needs
  typed columns; separate tables keep RLS + the draft/approve boundary clean.
