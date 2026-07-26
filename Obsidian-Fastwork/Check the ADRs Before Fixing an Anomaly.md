---
tags:
  - engineering
  - documentation
  - delivery
description: Search the ADRs before proposing or making a fix for something that looks wrong, so the fix cannot silently contradict a recorded decision — and so a missing ADR is recognised as the real gap.
source: T4 Fastwork, 2026-07-25 — #234 (/projects uncached) filed with a hypothesis before any ADR was read
---

# Check the ADRs Before Fixing an Anomaly

**When something in the running system looks wrong, read `docs/adr/` before proposing a cause or a
fix.** Not after the diagnosis, and not after filing the issue. Two different failures are prevented,
and the second is the one that bites hardest:

1. **A fix that contradicts a recorded decision.** What looks like a defect may be a deliberate
   trade-off someone already argued and wrote down. "Fixing" it undoes the reasoning without
   engaging it, and the next person sees a change that fights an accepted ADR with no explanation.
2. **A missing ADR mistaken for a code bug.** When the ADRs are silent, the anomaly is usually not a
   line to patch — it is an *undecided* question. Patching it quietly makes a decision by accident,
   at whatever layer happened to be open in the editor.

## The worked example that produced this note

`/projects` on production served `Cache-Control: no-store` with `x-vercel-cache: MISS` on every
request — every visitor paying a full database read. The order of work was wrong: a hypothesis
(`@supabase/ssr` fetching with `cache: 'no-store'`) was written into the issue **before** any ADR was
opened. Two things came out of finally reading them:

- The hypothesis was **wrong**. Comparing the other public pages showed the split exactly: every page
  that awaits `searchParams` is uncached, every page that does not is prerendered. `/projects` is
  dynamic *by construction*, because its category+technology filter reads the query string.
- **No ADR covers the caching strategy at all.** ADR 0004 covers freshness on a different axis
  (Realtime channel, heal-on-read, ETag/304, advisory lock) and assumes a read "renders instantly
  from the snapshot" without ever saying which pages are static, ISR or dynamic. The only written
  statement of intent was a **code comment** in `lib/public-db.ts` claiming pages using it "stay
  statically generated / ISR-cached" — contradicted by production for two pages.

So the deliverable was never a patch. It was an ADR choosing the caching strategy per public surface,
with the code change following from it. Anyone who had started from the filed hypothesis would have
gone looking in the wrong file.

## How to apply it

- **Grep the ADRs by concept, not filename** — `grep -rln -i "cache\|ISR\|revalidat" docs/adr/`. The
  relevant decision often lives in an ADR whose title mentions something else entirely.
- **A code comment is not a decision record.** It is evidence of intent at the moment it was written,
  and it can be wrong about the running system. Per [[Documentation Truth Hierarchy]], runtime
  behaviour outranks it — and a comment that *appears* to answer the question is worse than silence,
  because it stops the search.
- **When the ADRs are silent on a load-bearing choice, say so in the issue and make the ADR the
  deliverable.** Then list the real options with their costs, so the decision is made once and
  visibly rather than implied by a diff.
- **When an ADR does cover it, check the interaction before changing anything.** For the example
  above, any move toward a cached `/projects` has to stay compatible with ADR 0004's heal-on-read and
  its Realtime "double" — that constraint is invisible unless the ADR is read first.
- Write a new ADR rather than editing one to reverse it — see [[ADR Lifecycle and Supersession]].

Related: [[Documentation Truth Hierarchy]] · [[ADR Lifecycle and Supersession]] ·
[[Deliberate Diagnosis Loop]] · [[Baselines Before Optimization]] · [[Learning Capture Before Completion]]
