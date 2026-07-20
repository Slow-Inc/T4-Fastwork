# 0011 — T4 Bot (v3 art direction) graduates from /lab4 to the live site

- **Status:** accepted (dev-directed, 2026-07-20)
- **Deciders:** dev (xeno) + agent
- **Context:** requirement3.md §14 (v3 art direction — Layered Immersive Swiss ×
  Brand Robot Character), prototyped on `/lab4` (branch `prototype/labs-grade-hero`)

## Decision

The T4 Bot brand character graduates from the `/lab4` prototype onto the **live
home page**, replacing the abstract-metal hero object (`hero-scene.tsx`,
deleted). The robot is ONE fixed-canvas stage (`lab4-robot-stage.tsx`) that
chases `[data-l4-zone]` markers — on home: **hero** (drag-to-rotate,
cursor-follow) → **closing CTA** (perches on the เริ่มโปรเจกต์ button, happy
face). The stage is marker-driven and page-agnostic: any page can host the
robot by rendering markers + mounting `Lab4RobotStageLazy`.

The migration is **art-direction-level, not structural**: the home page's
information architecture (§14.3 editorial sequence — team, SDLC, tech stack,
certificates, claims) and every tested behavior stay intact. The full-site
**dual dark/light theme** (§14.7) is deliberately **phased out of this step**
— the site's ~8 root tokens make it tractable, but hardcoded light values
across ~6,800 CSS lines need an audit pass of their own.

## Why

- v3 (§14.2.1) makes the robot the brand's #1 recognition motif and the same
  character as the AI assistant — keeping it locked in a noindex prototype
  delivers zero brand value.
- The stage was built marker-driven from day one (zone travel, §14.2.1 seam
  rule), so the live-site integration is additive: markers + one mount, no
  rewrite of shipped sections.
- Replacing (not co-existing with) the old hero object honors "หนึ่ง viewport
  มี Robot เด่นได้ตัวเดียว" and removes a dead brand asset.

## Consequences

- `components/site/hero-scene{,-lazy}.tsx` deleted; `.hero-scene` div is now
  the hero zone marker (poster orb kept as the no-WebGL/loading fallback,
  hidden via `body.l4-stage-live` when the stage runs).
- The stage handles pages without a `.lab4` shell: theme falls back to the light
  rig; `.l4-aim` highlight is unscoped with a fallback accent.
- Marker caches refresh on `isConnected` loss — locale switch (TH/EN)
  re-renders markers and must not strand the robot (regression-tested by the
  language-switch e2e).
- Follow-ups tracked in the ledger: full-site dual theme (§14.7), robot as the
  AI avatar in the greeting popup/chat button (§5.4), wordmark-footer peek
  zone, remaining /lab4-only flourishes (kinetic marquee band, blueprint
  field) — each needs its own design pass against the live content.

## Rollback

`git revert` of the graduation commit restores the metal hero (files come back
with the revert); the /lab4 prototype remains the reference implementation.
