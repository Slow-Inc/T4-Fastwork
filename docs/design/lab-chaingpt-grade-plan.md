# Plan — /lab from 20% → ChainGPT-labs-grade "wow"

> 2026-07-19 · Synthesized from multi-agent review (codex + antigravity via clink-brainstorm)
> + empirical mobile measurement + the ChainGPT teardown (`docs/design/chaingpt-teardown.md`).
> Tool research: `docs/reports/immersive-lab-stack-research-2026.md`.
> Execution rule: each phase = its own branch · TDD where testable · e2e verify · **localhost
> review before merge** · codex+antigravity review per round. Nothing merges without dev OK.

## Settled facts (decide from these, don't re-litigate)
- **Multi-WebGL-context is NOT an auto-crash.** Measured on real mobile emulation: `www.chaingpt.org`
  runs **9 live canvases** on mobile, no crash; `labs.chaingpt.org` **degrades** heavy WebGL to ~1
  small canvas. So we may use Unicorn/three/Rive — with lifecycle discipline + optional mobile degrade.
- **GSAP is fully free** (all plugins, since the Webflow acquisition).
- **Robot GLB** will be AI-generated (Meshy: gen→auto-rig→animate→GLB) then optimized. Meshy topology/
  rigging quality is the **#1 schedule risk** — validate clips before compression.
- Current `/lab`: CSS marquee, procedural icosahedron (already ssr:false + DPR cap + offscreen-pause),
  IntersectionObserver opacity reveals, Lenis on its own rAF, a fake-timer preloader.

## The stack to adopt (mapped)
| Job | Tool | Add when |
|---|---|---|
| scroll choreography (scrub/pin/reveal) | `gsap` + `@gsap/react` (ScrollTrigger) | Phase 1 |
| kinetic + scramble/split text | GSAP `SplitText` + `ScrambleTextPlugin` | Phase 1 |
| smooth scroll | `lenis` (have) → sync to `gsap.ticker` | Phase 1 |
| node-graph connectors | SVG `stroke-dasharray` (DrawSVG only if paths get complex) | Phase 3 |
| bespoke rigged robot GLB | **Meshy** (gen+rig+animate) → Blender finish | Phase 2 |
| GLB optimize (dev) | `@gltf-transform/cli` (Draco/Meshopt + KTX2 + simplify) + `gltfjsx` | Phase 2 |
| premium r3f render | `@react-three/drei` (`useGLTF`/`<Environment>` HDR) + `@react-three/postprocessing` (selective bloom) | Phase 2 |
| transient scroll↔3D bridge | ref or tiny `zustand` store, read in `useFrame` (never React state) | Phase 2 |
| WebGL reactive background | **Unicorn Studio** (`unicornstudio-react/next`) — OPTIONAL, spiked | Phase 4 |
| card micro-anim | Rive (`@rive-app/react-canvas`) **or** CSS/SVG — spike one | Phase 4 |
| display font | licensed variable font + **Thai companion** via `next/font/local` | Phase 0/1 (NOT last) |
| GPU tiering / mobile degrade | `detect-gpu` (or width+memory heuristic) → static poster | Phase 2 |
| design-token extraction (ref) | `firecrawl-website-design-clone` on ChainGPT | Phase 0 |

## Phases (resequenced — fonts early, deps with first consumer, riskiest asset de-risked)

### Phase 0 — Creative contract + baseline (0.5–1.5d) · install nothing yet
- Lock **font shortlist + license status** (display + Thai companion). Fonts change layout metrics, so
  this MUST precede any SplitText/ScrollTrigger geometry.
- 3-state **hero storyboard** (top / mid / end scroll) — the composition target ("brief → assemble → ship").
- Device/perf **baseline** (current screenshots + a Lighthouse/FPS reading) to measure against.
- **Start the Meshy brief now** (front/side/back pose sheet) so the asset generates in parallel.
- Optional: `firecrawl-website-design-clone` on ChainGPT → reference DESIGN.md for tokens.
- **Gate:** approved hero frames.

### Phase 1 — Hero vertical slice + motion foundation (2–4d) · 🥇 highest ROI
- Near-final **typography** + much larger hero headline (today the semantic h1 is only ~2.9rem vs a 14rem
  decorative marquee — hierarchy under-works).
- Add `gsap` + `@gsap/react`. **One-loop scroll**: `lenis.on('scroll', ScrollTrigger.update)` +
  `gsap.ticker.add(t => lenis.raf(t*1000))` + `gsap.ticker.lagSmoothing(0)`; remove the standalone rAF.
- One **pinned + scrubbed** hero narrative using the EXISTING icosahedron (no Meshy dependency yet).
- `SplitText`/`ScrambleText` on headings — **Thai = word/line reveal**, scramble only mono/EN labels.
- **Fix the preloader**: once-per-session (sessionStorage) or tie to real readiness with a hard timeout.
- **Reduced-motion = meaningful final state** (not slowed) via `gsap.matchMedia()`.
- **Gate:** desktop/mobile/reduced-motion screenshots at top/mid/end + route-away/back lifecycle test.

### Phase 2 — Production 3D (4–8 eng days + 2–10 asset-iteration days)
- Meshy robot → **validate raw rig/clips first** → optimize pipeline (a committed
  `gltf-transform` script: dedup/prune/simplify/Draco or Meshopt + KTX2 textures) → `gltfjsx --transform`.
- r3f `useGLTF`/`useAnimations`; clips **Idle / Assemble / CoreReveal / HeadTrack** driven by the scroll
  bridge + pointer.
- `<Environment>` HDR (Poly Haven CC0, **self-hosted**) + selective bloom **tuned WITH materials**
  (emissive/roughness), not bolted on last.
- **Transient state** bridge (ref/zustand) for scroll→camera/clip; **dispose** geometries/materials/
  textures on unmount; **GPU tiering** → static poster on low-tier/mobile.
- Keep an unoptimized source model outside the runtime dir; document the repro command.
- **Gate:** perf budget (below) + no GPU-mem growth over 5 `/lab`→route→`/lab` cycles.

### Phase 3 — Page-wide choreography (2–4d)
- Section staggers, animated node-graph connectors (SVG dash draw), stats count-up, CTA transition,
  hover/focus micro-motion. Scope the `.rv` replacement to `/lab` so other routes using `RevealObserver`
  are untouched.
- **Gate:** every effect maps to a narrative purpose + a motion budget (no "animation soup").

### Phase 4 — Optional ambient / card layer (2–5d) · spike ONE, ship only if it earns its cost
- Spike **one** of: Unicorn Studio reactive background / Rive cards / CSS-SVG. Unicorn = desktop-only,
  lazy-loaded, and **suspend/destroy its context when the r3f hero is active** (belt-and-braces on the
  multi-context concern). Skip if it competes with the robot for attention or blows the budget.
- **Gate:** A/B screenshots + measured perf delta.

### Phase 5 — Hardening + release (2–4d)
- Finalize font; visual-regression baselines; full a11y; `webglcontextlost` handling; CI matrix;
  Lighthouse/bundle budgets; cross-browser/device QA.

**Total: ~13–26 engineering days** (excludes robot generation/rig iteration).

## Acceptance gates (were missing)
**Performance:** mobile LCP ≤2.5s · INP ≤200ms · CLS ≤0.1 · hero ≥50fps desktop / ≥30fps mid mobile ·
optimized GLB ≤2MB · HDR ≤500KB · mobile poster ≤200KB · no render while offscreen/hidden/reduced-motion/
unmounted · no unbounded GPU-mem growth. Record initial critical JS vs lazy 3D chunks; reject unexplained
regressions.
**A11y:** reduced-motion → meaningful final states, not slowed · SplitText preserves one readable semantic
heading (fragments aria-hidden) · Thai split by line/word after `document.fonts.ready` · keyboard/visible-
focus/200%-zoom/contrast/no-scroll-trap · canvas stays decorative (HTML carries the narrative).
**Testing/CI:** unit on semantic output + pure timeline/state helpers (happy-dom can't validate motion) ·
Playwright deterministic checkpoints + screenshots at fixed scroll offsets (top/mid/end) · mobile-Chromium
+ reduced-motion + a WebKit smoke project · route-remount/resize/orientation/locale/fallback/simulated
`webglcontextlost` · **add PR CI** (`bun install --frozen-lockfile`, lint, unit, build, Playwright, upload
artifacts on failure) — none exists today.
**Asset governance:** record Meshy commercial rights + provenance, font desktop/web license, Poly Haven
URL/license, Unicorn terms/hosting, Rive rights. Keep source model + repro optimize command.

## GSAP integration contract (Phase 1 non-negotiables)
`lenis.on('scroll', ScrollTrigger.update)` · `gsap.ticker.add(t => lenis.raf(t*1000))` +
`lagSmoothing(0)` · `useGSAP({ scope })` reverted on unmount · `gsap.matchMedia()` for desktop/mobile/
reduced-motion · `ScrollTrigger.refresh()` ONLY after fonts + model dims settle · one owner for the
ticker; sections register timelines, never new loops.

## Decisions still needed from the dev
1. **Font**: buy a licensed variable display (e.g. PP Neue Montreal) + a Thai companion, or stay Space
   Grotesk for now? (blocks Phase 0/1 finalization)
2. **Robot**: generate via the in-harness **Meshy skill** now (needs a plan/credits), Tripo, or keep the
   procedural form until later?
3. **Ambient layer**: Unicorn Studio (fastest labs-look) vs an in-canvas r3f shader vs skip (Phase 4).

## First action (agreed by both reviewers)
The **Phase 1 hero vertical slice** (final-ish typography + bigger headline + one 3-state pinned GSAP
story on the existing icosahedron + Lenis↔ticker + reduced-motion). It validates composition, Thai
splitting, the whole GSAP/Lenis plumbing, mobile pin behavior, and gives the Meshy artist an exact target
— all before spending on the slow/risky 3D asset.
