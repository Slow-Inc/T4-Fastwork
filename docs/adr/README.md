# Architecture Decision Records

One decision per file (`NNNN-<kebab>.md`); numbers are globally unique and never reused.
Overturning a decision → a **new** ADR that marks the old one *Superseded by NNNN* (never
edit-to-reverse). See `docs/agents/domain.md` and the `t4-engineering-records` skill.

| # | Decision | Status | Date |
|---|---|---|---|
| [0001](0001-deploy-frontend-and-backend-to-vercel.md) | Deploy the Next.js frontend + Nest.js backend to Vercel | Accepted | 2026-07 |
| [0002](0002-use-cloudflare-turnstile-instead-of-recaptcha.md) | Use Cloudflare Turnstile instead of reCAPTCHA | Accepted | 2026-07 |
| [0003](0003-github-live-team-portfolio.md) | Live GitHub team portfolio: Supabase snapshot + event-driven refresh | Accepted | 2026-07-13 |
| [0004](0004-serverless-realtime-freshness.md) | Serverless-native live freshness via Supabase Realtime + event-driven refresh | Accepted (design) | 2026-07-14 |
| [0005](0005-member-content-to-db-provenance-additive.md) | Member profiles & showcase content: static → Supabase, per-field provenance, additive draft→approve | Superseded by 0012 | 2026-07-15 |
| [0006](0006-unified-github-auth-member-is-admin.md) | Unified auth: members & admins log in with GitHub; admin = a member flagged `is_admin` | Superseded by 0012 | 2026-07-15 |
| [0007](0007-db-enforced-authz-rls-is-app-admin.md) | Authorization enforced at the database: RLS everywhere + `is_app_admin()` SECURITY DEFINER, no service-role key | Accepted | 2026-07-15 |
| [0008](0008-ai-display-ranking-order-not-content.md) | AI display-ranking: content keeps its source; only display ORDER comes from a persisted `ai_rank` | Accepted | 2026-07-15 |
| [0009](0009-github-sourced-ai-authored-case-studies.md) | GitHub-sourced, AI-authored native case studies: kill the static catalog; project → per-audience posts; map-reduce generation on MD change | Partially superseded by 0013 | 2026-07-17 |
| [0010](0010-case-study-extract-cache-column.md) | Map-reduce extract cache lives in a single `project_documents.extract jsonb` column (implements ADR 0009 D2) | Unused (see 0013) | 2026-07-18 |
| [0011](0011-auto-publish-public-repos-visibility-is-authorization.md) | Auto-publish generated content for public repos: repo visibility IS the publish authorization (supersedes ADR 0009's publish-gate; keeps automated input/output validation) | Accepted | 2026-07-22 |
| [0012](0012-flat-team-authz-any-linked-member-is-admin.md) | Flat team authorization: any linked member is an admin | Accepted | 2026-07-23 |
| [0013](0013-simplified-single-readme-case-study.md) | Simplified single-README case study generation | Accepted | 2026-07-23 |
