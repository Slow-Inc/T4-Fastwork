# #92 — cache propagation for direct-DB writers: options + recommendation

**Date**: 2026-07-17 · **For**: the developer, to pick a revalidation strategy so a CI/cron
writer's DB change (screenshot worker, rank job, GitHub sync) appears on the live public pages
without a manual redeploy. Prepared AFK; grounded in the code. **No code written from this** —
it is the `/grill-with-docs` analysis that unblocks #92.

Related: issue #92 · ADR 0004 (stale-while-heal) · `nextjs/lib/live-actions.ts` ·
`nextjs/app/admin/(dash)/projects/actions.ts` · `nextjs/lib/public-db.ts`.

## The problem, precisely

Public pages read via the cookieless `publicDb()` → they stay **static / ISR-cached**
(`public-db.ts:3-8`). The cache is busted only by:

1. **Admin Server Actions** — e.g. `app/admin/(dash)/projects/actions.ts:49` calls
   `revalidatePath('/projects')` after a write. This is the "revalidated on demand from admin
   actions" path.
2. **Realtime tag-bust** — `<LiveSnapshot>` → `refreshLiveTags()` → `updateTag()`
   (`live-actions.ts`), but it **only touches `gh:*` tags = `github_snapshots`** (team-page
   badges/READMEs), **not the `projects` table**.

The screenshot worker (and the rank job, and GitHub sync) write the DB **directly** (Node script
/ backend pooler) — they are neither a Server Action nor a `github_snapshots` Realtime event — so
**nothing busts the cache**. The page serves the pre-write build until a redeploy. Verified:
`projects.snapshot_image` for `mangadock` is set in prod, but `https://t4labs.co/projects/mangadock`
does not yet show it.

**Related gap:** even the admin path calls `revalidatePath('/projects')` (the list) but **not**
`/projects/[slug]` (the detail page). Whatever we pick should cover the detail route too.

## Options

### Option A (recommended) — a secret-guarded revalidate Route Handler the writers call

A Next.js Route Handler (`app/api/revalidate/route.ts`) that, on a valid secret, calls
`revalidatePath('/projects')` + `revalidatePath('/projects/[slug]', 'page')` (and the other
affected surfaces). Each direct-DB writer POSTs it after a successful write — the screenshot
Action already holds `BACKEND_REFRESH_SECRET`; reuse `GITHUB_REFRESH_SECRET`/the same shared
secret with a constant-time compare (mirror `github-write.controller` `doRefresh`).

- *Pros:* on-write (no staleness window); one endpoint serves every writer (screenshot / rank /
  sync / content-gen); matches the existing `revalidatePath` propagation admin already uses.
- *Cons:* a **new secret-guarded endpoint = a security boundary** → must ship with
  `/security-review` (fail-closed when the secret is unset; constant-time compare; only ever
  revalidates public paths, never returns data).
- *Verify:* unit-test the handler (401 without/with wrong secret; calls the right paths with the
  secret) at a pure seam; confirm on prod that a screenshot run is followed by the page updating.

### Option B — ISR `revalidate` interval on the pages

`export const revalidate = <seconds>` on `/projects` + `/projects/[slug]`.

- *Pros:* one line per page, no endpoint, no secret.
- *Cons:* **time-based staleness** (up to the interval before a write shows); a **site-wide
  caching-policy change** (freshness vs build/ISR cost); doesn't give read-your-own-writes.
- *Verify:* pages still render (e2e); the "appears within the interval" is only observable after
  waiting the interval on prod.

### Option C — extend the Realtime tag-bust to `projects`

Mirror the `gh:*` mechanism: tag project reads (`proj:<slug>`), enable Supabase Realtime on the
`projects` table, and add a `<LiveSnapshot>`-style subscriber on the project pages that
`updateTag`s on a change.

- *Pros:* fully live (no reload, no interval), consistent with ADR 0004.
- *Cons:* the most work + surface; Realtime must be enabled on `projects`; hardest to verify
  unattended (needs a real Realtime event on prod).

## Recommendation

**Option A.** It is the on-write fix #92 asks for, reuses the existing secret + `revalidatePath`
propagation, and a single endpoint covers **all** the direct-DB writers (the systemic audit
#0/#17 gap), not just the screenshot worker. Treat it as a security-boundary change: fail-closed,
constant-time secret, public-paths-only, `/security-review` before merge. Fold the missing
`/projects/[slug]` revalidation (and the other write surfaces) into the same endpoint.

Option B is an acceptable stopgap if an endpoint is unwanted, but it trades correctness for a
staleness window and is a broader caching-policy decision.

## Why this is a developer decision (parked under AFK)

Picking A vs B vs C is an **architecture/caching-policy** call, and A creates a **security-boundary
endpoint** — both are must-park unattended. End-to-end verification also needs prod cache
observation, which isn't possible without the developer / a test surface. On approval of a shape,
the build is a normal TDD item.
