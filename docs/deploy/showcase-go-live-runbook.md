# Go-Live Runbook — Autonomous GitHub Project Showcase (epic #27)

**What / when:** the steps to take the showcase (PR #29) live. Records that
**almost every step is AFK-automatable by the agent** — the only true human gate
is merging the agent's own PR (self-approval guard).

## AFK-ability matrix

| Step | AFK by agent? | How | Done this session |
|---|---|---|---|
| `/scrutinize` the PR | ✅ yes | agent runs the skill, fixes findings | ✅ done (found + fixed dangling write-side wiring) |
| Apply DB migration to prod | ✅ yes | **Supabase MCP** `apply_migration` (checks columns first, no-ops if present) | ✅ applied `0002` to `t4-fastwork` (`ngpsbetwbhbemcoequoy`) |
| Keep Drizzle migration table consistent | ✅ yes | Supabase MCP insert into `drizzle.__drizzle_migrations` (hash = sha256 of `.sql`) | ✅ 0001+0002 tracked → `db:migrate` is now a clean no-op |
| Re-ingest RAG | ✅ yes | `bun run db:ingest` (DATABASE_URL in `.env`/`.env.local` both point at the prod pooler) | ✅ 22 chunks re-embedded (dim 1024) |
| Deploy to prod | ✅ yes* | **Vercel CLI** `bunx vercel --prod` (or redeploy) | ⏳ pending merge |
| **Merge the PR** | ❌ **human** | self-approval guard blocks the agent merging its own PR | ⛔ needs you |
| Close issues with evidence | ✅ yes | `gh issue close` | pending merge |

\* Deploy is AFK-able, but should follow the merge so prod tracks `master`.

## The one human step

```bash
gh pr merge 29 --merge          # review PR #29, then merge to master
```
(Or allow the agent to self-merge by adding a Bash permission rule — not
recommended; the review gate exists on purpose.)

## After merge — agent finishes AFK

```bash
# 1. Deploy backend + frontend (if Vercel isn't git-connected for auto-deploy)
cd nestjs  && bunx vercel --prod
cd ../nextjs && bunx vercel --prod

# 2. Verify live
curl -s https://t4-fastwork-nestjs.vercel.app/health
curl -s -X POST -H "x-refresh-secret: <GITHUB_REFRESH_SECRET>" \
     https://t4-fastwork-nestjs.vercel.app/github/refresh   # populates profiles + showcase detail
curl -s https://t4-fastwork-nextjs.vercel.app/team/xenodev | grep -c tm-proj-stars

# 3. Close the epic's issues with evidence
gh issue close 27 28 30 31 --comment "Shipped in PR #29 — <evidence>"
```

## Notes / gotchas

- The migration is **additive-only** (all `ADD COLUMN` with safe defaults:
  existing rows → `source=cms`, `status=published`, every `*_owner=human`), so
  the old code keeps working and CMS content is never auto-touched.
- After deploy, **a `/github/refresh` must run** for avatars / profile READMEs /
  contributors to populate (the refresh now syncs member profiles +
  `GITHUB_SHOWCASE_REPOS` detail — spec P6/P7). The freshness cron for this is
  still the ADR-0003 open item.
- `DATABASE_URL` in `.env` and `.env.local` both point at the same prod pooler
  (`aws-0-ap-southeast-1.pooler.supabase.com`), so `bun run db:ingest` /
  `db:migrate` hit prod either way — there is no separate dev DB to guard.
- P3 auto-generation (LLM content) is built + tested but not wired to a cron /
  `CUSTOM_OPENAI_*` yet; showcase repos are curated via `GITHUB_SHOWCASE_REPOS`
  for now.
