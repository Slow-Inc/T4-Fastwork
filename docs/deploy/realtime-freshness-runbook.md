# Live-freshness (#25) — activation runbook

The serverless-native "double" (ADR 0004). All code phases R1–R5 are shipped on
branch `feat/25-serverless-realtime-freshness`. This runbook covers what's live,
the three human activation steps (external dashboards — not doable AFK), and how
to verify.

## What ships in code (done)

| Phase | What | Where |
|---|---|---|
| R1 | Heal one snapshot key: single-flight (`pg_try_advisory_xact_lock` in one txn — pooler-safe) + ETag/304 gate + secret-guarded `POST /github/heal?key=` | `nestjs/src/github/github-heal.service.ts`, `github.config.ts` (`resolveHealTarget`, charset-hardened), `github-write.controller.ts` |
| R2 | Realtime on `github_snapshots` (already anon-SELECT RLS from ADR 0003) | prod migration `enable_realtime_github_snapshots` (applied) |
| R3 | Client subscriber → `updateTag` Server Action → fresh re-read (the "double") | `nextjs/lib/live-snapshot.ts`, `lib/live-actions.ts`, `components/site/live-snapshot.tsx`; wired into `/team/[slug]` + `/projects/[slug]` |
| R4 | Next `after()` stale-heal trigger on live reads | `nextjs/lib/heal.ts`; wired into `lib/github.ts` reads |
| R5 | Hourly cron safety-net (webhook already broadcasts via R2) | `.github/workflows/github-refresh-cron.yml` |

Event sources feeding the "double" (no loop, no timer held): **heal-on-read**
(R4), **org webhook** (push), **cron** (safety-net). Idle = provably zero work.

## Human activation steps (external — do these to fully turn it on)

1. **Frontend Vercel env var** — Vercel → the *frontend* (nextjs) project →
   Settings → Environment Variables → add `GITHUB_REFRESH_SECRET` = the same
   value as the *backend* (nestjs) project's `GITHUB_REFRESH_SECRET`. Redeploy.
   - Unset → the R4 heal-on-read POSTs no secret → heal no-ops. Pages still serve
     stale data correctly; they just won't self-heal on read.

2. **Repo Actions secret** — GitHub repo → Settings → Secrets and variables →
   Actions → New secret `BACKEND_REFRESH_SECRET` = the backend's
   `GITHUB_REFRESH_SECRET`. (GitHub forbids the `GITHUB_` prefix on Actions
   secrets, hence the different name.) Optionally set repo *variable* `BACKEND_URL`
   if the backend isn't `https://t4-fastwork-nestjs.vercel.app`.
   - Unset → the hourly `github-refresh-cron` workflow no-ops (exits 0).
   - The workflow only runs on the default branch — it activates after this branch
     merges to `master`.

3. **Org webhook** (carried from ADR 0003) — `Slow-Inc` org → Settings → Webhooks
   → add `POST <backend>/github/webhook`, content-type `application/json`, secret =
   backend `GITHUB_WEBHOOK_SECRET`, events: **push** (or "repository" events).
   - Without it, pushes don't fast-path; the cron + heal-on-read still keep data
     fresh, just less immediately.

## Verify

- **Backend heal** (needs the secret; from a shell with it):
  `curl -sS -X POST -H "x-refresh-secret: $SECRET" "$BACKEND/github/heal?key=user:xenodeve"`
  → `{"healing":false,"changed":<bool>}` (or `{"skipped":"unhealable key"}` for a
  bad key). A second immediate call may return `{"healing":true}` (single-flight).
- **Realtime enabled**: `select tablename from pg_publication_tables where
  pubname='supabase_realtime';` includes `github_snapshots`.
- **The "double" in the browser**: open a `/team/<slug>` page; in another client
  change that member's data on GitHub (or force a heal); the open page updates
  within a few seconds **without a reload** and with no polling in the Network tab.
- **Cron**: Actions tab → `github-refresh-cron` → "Run workflow" → the run logs
  `POST … /github/refresh -> HTTP 2xx`.

## Notes / gotchas

- `updateTag` (Next 16) is used, not `revalidateTag(tag,'max')` — the latter is
  stale-while-revalidate (would show stale once more); `updateTag` is immediate
  read-your-own-writes. It is Server-Action-only, so R3 uses an action, not a
  Route Handler.
- Realtime enforces the table's existing anon-SELECT RLS; it exposes only the
  already-public GitHub data. `/security-review` passed clean (+ regex-charset
  hardening on `resolveHealTarget`).
- `github-refresh-cron` is hourly to stay well within Actions minutes; tune the
  `cron:` if faster safety-net freshness is needed (heal-on-read + webhook already
  cover active traffic).
