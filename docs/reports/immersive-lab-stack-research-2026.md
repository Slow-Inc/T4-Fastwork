# `/lab` immersive-web stack recommendation (2026)

Research date: 2026-07-19. Sources are first-party documentation, repositories, and service pages.

## Executive recommendation

Keep **Next.js 16 + React 19 + Tailwind v4 + Lenis + react-three-fiber**. Add a small, coherent motion/rendering layer rather than changing frameworks:

```text
gsap + @gsap/react
@react-three/drei + @react-three/postprocessing
@rive-app/react-canvas (only for interactive card illustrations)
@gltf-transform/cli (development-time asset optimization)
```

The fastest credible route from the current prototype to an award-site feel is:

1. **GSAP choreography across the whole page** — ScrollTrigger pin/scrub timelines, SplitText/ScrambleText, and DrawSVG replace disconnected CSS transitions. This changes the page's rhythm, not just its decoration.
2. **One art-directed, rigged robot GLB with 2–4 excellent clips** — generate a concept/base in Meshy, then finish in Blender (or use Meshy's rig/animation directly for the first production pass). The object needs a transformation/idle story, not another turntable spin.
3. **Premium lighting and WebGL asset pipeline** — a self-hosted HDR/gainmap, controlled PBR/iridescent materials, selective bloom, and compressed GLB/KTX2 textures make the robot read as chrome rather than a game-engine placeholder.

Those three reinforce each other: ScrollTrigger drives camera/clip progress; the bespoke asset supplies identity; lighting/postprocessing makes the same asset look expensive. Typography and Rive are worthwhile polish, but neither substitutes for this hero system.

## Current baseline and gap

- `nextjs/components/site/lab/lab-hero-scene.tsx` already has good foundations: client-only Canvas, capped DPR, visibility-aware `frameloop`, WebGL fallback, reduced-motion handling, and pointer tilt. Its `Form` is still two procedural icosahedra with basic lights.
- `nextjs/components/site/lab/lab-hero-scene-lazy.tsx` already uses `dynamic(..., { ssr: false })`; preserve that boundary for Three, postprocessing, and GLB loaders.
- `nextjs/components/site/smooth-scroll.tsx` already uses `lenis`; do not replace it. When GSAP arrives, move Lenis onto GSAP's ticker instead of keeping two independent RAF loops.
- `nextjs/components/site/reveal-observer.tsx` and `.rv` are entrance-only enhancement. They cannot scrub, pin, sequence a narrative, or drive a Three animation mixer.
- `nextjs/components/site/lab/kinetic-marquee.tsx` plus `@keyframes lab-marquee` in `nextjs/app/globals.css` provides a loop, but not scroll velocity, per-character choreography, or section-to-section continuity.
- `.lab-flow-node::after` is a static 1px connector. The node graph needs a real SVG layer whose paths can draw and whose active nodes can sequence.

## 1. Scroll choreography: scrub, pin, reveal

**Add:** [GSAP](https://gsap.com/docs/v3/Installation/) (`gsap`) + [the official React hook](https://github.com/greensock/react) (`@gsap/react`), principally [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).

**Why this is the best fit:** ScrollTrigger directly supports `pin`, boolean/numeric `scrub`, velocity-aware `snap`, timeline labels, and refresh-aware layout measurement. IntersectionObserver is still useful for cheap visibility/pause decisions, but GSAP's own docs explicitly distinguish it from continuous position tracking. As of GSAP 3.13+, all plugins are available from the public npm package; the former private npm repository is obsolete.

**Concrete `/lab` mapping:**

- Create one client `LabMotionController` at the page/section level, using `useGSAP({ scope })`.
- Hero: pin `.lab-hero` for roughly 200–300vh; scrub camera dolly, robot root rotation, head aim weight, emissive core, and marquee parallax across labelled beats (`assemble`, `reveal-core`, `close-up`, `release`).
- Process: pin the graph while five nodes and connectors activate in sequence.
- Section titles/cards: replace `.rv` opacity-only entrances with masked line reveals and purposeful stagger; leave content visible in SSR/CSS and apply hidden states only after GSAP initializes.
- Use `gsap.matchMedia()`/CSS for `prefers-reduced-motion`; reduced motion should remove pin/scrub distances and reveal final states.

**Next.js/React effort:** medium (2–4 days for a coherent first pass). Both components must be client components, but their semantic markup can remain server-rendered. `@gsap/react` uses an isomorphic layout effect and automatically reverts animations/ScrollTriggers through `gsap.context()`.

**Gotchas:** GSAP and plugins increase the client chunk, so import/register only the plugins used in the `/lab` client boundary. Explicit registration prevents production tree-shaking from dropping plugins. Do not animate the pinned element itself; animate a nested stage. Ancestor transforms/`will-change` can break fixed pinning. Call `ScrollTrigger.refresh()` after fonts, GLB dimensions, or responsive layout settle. React cleanup is non-negotiable.

## 2. Huge kinetic, split, and scramble text

**Add:** GSAP's [SplitText](https://gsap.com/docs/v3/Plugins/SplitText/) and [ScrambleText](https://gsap.com/docs/v3/Plugins/ScrambleTextPlugin/) from the same `gsap` package.

**Why:** SplitText 3.13+ adds line/word/character splitting, clipping masks, responsive re-splitting after fonts or width changes, and automatic screen-reader attributes. ScrambleText provides the exact resolving terminal/technical title effect observed in the reference. Keeping both in GSAP means text beats share the ScrollTrigger master timelines.

**Concrete mapping:**

- Keep the two-copy CSS marquee for the always-running hero band; animate its playback speed/direction or track offset from scroll velocity rather than rebuilding a simple infinite loop in JavaScript.
- Apply SplitText to `.lab-sec-title` with `type: "lines,words"`, `mask: "lines"`, `autoSplit: true`; reveal words into place in `onSplit()`.
- Use ScrambleText only on short mono kickers, counters, or section labels. Scrambling every heading becomes noise and is expensive.
- For Thai, test phrase-by-phrase. Prefer line/word animation for Thai body/display copy and reserve character scrambling for controlled Latin/numeric labels; SplitText supports custom preparation/delimiters for non-Latin edge cases.

**Effort:** low–medium (1–2 days after the GSAP foundation).

**Gotchas:** splitting creates many DOM nodes. Split only what is animated and `revert()` after one-shot reveals where possible. Line splitting must wait for fonts or use `autoSplit` + animations returned from `onSplit`. Built-in ARIA hides split fragments, but nested links/semantic elements need a separate screen-reader copy. Avoid `text-wrap: balance` on split elements and keep a no-JS visible state.

## 3. Buttery smooth scroll

**Keep and integrate:** [Lenis](https://github.com/darkroomengineering/lenis) (`lenis`, already `^1.3.25`).

**Why:** Lenis remains a lightweight, maintained smooth-scroll layer designed for WebGL/parallax synchronization. Its official integration recipe for ScrollTrigger is explicit: `lenis.on('scroll', ScrollTrigger.update)`, call `lenis.raf(time * 1000)` from `gsap.ticker`, and set `gsap.ticker.lagSmoothing(0)`.

**Concrete mapping:** refactor `SmoothScroll` so there is one clock shared with GSAP, rather than Lenis's current independent `requestAnimationFrame`. Keep the existing route-scoped teardown and reduced-motion opt-out. Import Lenis's recommended CSS or verify the equivalent styles already exist.

**Effort:** low (half a day including regression checks).

**Gotchas:** do not stack Lenis with GSAP ScrollSmoother or another virtual scroller. Nested scroll regions, anchors, `position: sticky`, touch behavior, and browser history restoration require real-device testing. Lenis smooths input but does not create choreography; ScrollTrigger remains responsible for progress/pinning.

## 4. Bespoke rigged/animated robot GLB and how to obtain it

### Recommended production path

1. Develop a front/side/back character sheet with unmistakable T4 silhouette, orange-core mechanism, material callouts, and a neutral A/T pose.
2. Generate the base with **[Meshy](https://www.meshy.ai/features)**. Its current end-to-end pipeline includes text/image-to-3D, texture, auto-rig, animation, and rigged FBX/GLB export; the [animation product](https://www.meshy.ai/features/ai-animation-generator/) advertises GLB/FBX with skeletons and a large preset motion library. Use image-to-3D from the approved turnaround, not pure text-to-3D, for identity consistency.
3. Bring the result into **Blender** for topology/weight cleanup, separate head/chest mechanisms, material consolidation, clip naming, and art-directed clips. The key clips should be `Idle`, `Assemble`, `CoreReveal`, and optionally `HeadTrack`; generic walk/dance clips add no value.
4. If the generated skeleton is inadequate, use [Adobe Mixamo](https://www.mixamo.com/) for fast humanoid auto-rig/mocap blocking, then clean it in Blender. Mixamo is strong for conventional humanoid motion, not mechanical transformation rigs.
5. Export one GLB with the skeleton and clips; optimize it with glTF Transform before committing to `public/`.

**Why Meshy first:** among the named AI options, it currently provides the shortest verified path from concept to an actually rigged, animated GLB in one service. It is appropriate for the first production asset and for iteration. A specialist 3D artist is still the highest-confidence route for deformation, hard-surface topology, and a bespoke transformation mechanism.

### Alternatives and what they really yield

| Option | Verified output | Use it for | Limitation for this robot |
| --- | --- | --- | --- |
| [Tripo](https://www.tripo3d.ai/features/ai-auto-rigging) | Auto-rig; FBX or GLB with skeleton | Second AI candidate; compare silhouette/topology against Meshy | Still needs art direction and likely Blender cleanup |
| [Rodin / Hyper3D](https://hyper3d.ai/use-cases/animation) | High-detail PBR static meshes, topology controls, FBX/GLB; its own page says rigging/skinning/animation remain in Blender or Maya | Highest-interest base mesh when topology/PBR detail matters more than one-click animation | Not an end-to-end animated-robot result; dense defaults need remesh/decimation |
| [Spline](https://docs.spline.design/importing-content/import-animated-objects) | Imports skeletal animation in FBX/GLB/GLTF; AI generation and GLTF export are available on paid plans | No-code interaction prototypes or embedding an already animated asset | Not the preferred rig authoring/optimization pipeline; moving the hero from r3f would reduce code-level control |
| [Unicorn Studio](https://www.unicorn.studio/) | Authored interactive WebGL scenes/backgrounds | Rapid shader/background layer when there is no r3f scene | Not a robot generator or rigging tool; adds a proprietary runtime and another WebGL context. The popular `unicornstudio-react` package explicitly identifies itself as an unofficial wrapper |
| [Luma Genie](https://lumalabs.ai/series-b) | Fast generated 3D objects | Early shape ideation only | Current first-party material does not establish the rigged/animated GLB pipeline needed here; do not select it on brand recognition alone |
| [Sketchfab free models](https://sketchfab.com/features/free-3d-models) | Downloadable glTF/other formats; some models include skeleton/morph animation | Temporary production fallback or a legally reusable base | Check each asset: most free models are CC BY rather than CC0, topology can be web-hostile, and “robot” does not imply rigged |

For a genuinely no-attribution environment/texture/model source, [Poly Haven](https://polyhaven.com/license) makes all its assets CC0. It is excellent for HDRIs and materials, but not a reliable source of a bespoke rigged hero character.

**r3f integration:** `@react-three/drei`'s `useGLTF` + `useAnimations`, preload the GLB, map named clips through `AnimationMixer`, and have a small bridge component update mixer time/camera/rig weights from the GSAP timeline. Keep Three mutations inside refs/useFrame; do not set React state per scroll tick.

**Effort:** large for a bespoke result (roughly 1–3 weeks including asset iteration); medium (2–5 days) for an AI-generated, cleaned first pass.

**Gotchas:** service output/licensing terms and reference-image rights must be checked at purchase/export time. Require neutral pose, separated mechanical pieces, clean skin weights, named clips, PBR maps, and a web polygon/texture budget in the acceptance criteria. AI output is a base, not guaranteed final topology. Preserve attribution if the selected marketplace license requires it.

## 5. Premium r3f rendering and delivery

**Add:** [Drei](https://drei.docs.pmnd.rs/) (`@react-three/drei`), [React Postprocessing](https://github.com/pmndrs/react-postprocessing) (`@react-three/postprocessing`, with its `postprocessing` peer/dependency as required), and [glTF Transform CLI](https://gltf-transform.dev/cli) (`@gltf-transform/cli`, dev-time only).

**Rendering recipe:**

- Load/preload the robot with [`useGLTF`](https://drei.docs.pmnd.rs/loaders/gltf-use-gltf), which supports Draco and Meshopt and can attach a KTX2 loader.
- Self-host a 1K–2K studio HDRI or gainmap from [Poly Haven](https://polyhaven.com/hdris) and use [`<Environment files>`](https://drei.docs.pmnd.rs/staging/environment). Drei warns that environment presets rely on CDNs and are not intended for production; self-host the chosen asset. Its docs note gainmaps have the smallest footprint among supported environment formats.
- Use physically intentional materials: metal/rough PBR for chrome, `MeshPhysicalMaterial` clearcoat/iridescence for visor accents, and one `toneMapped={false}` emissive core.
- Add a restrained `<EffectComposer>` with selective [`Bloom`](https://react-postprocessing.docs.pmnd.rs/effects/bloom), subtle vignette/noise only if it survives A/B review. Bloom docs require HDR values above 1 and `toneMapped={false}` for deliberately glowing materials.
- Keep the existing `dpr={[1, 1.5]}`, offscreen pause, reduced-motion freeze, and fallback. Add adaptive DPR or a quality tier before adding expensive effects such as SSAO/DOF.

**Asset pipeline:** run `gltf-transform inspect` first, then deliberately apply `dedup`, `prune`, animation `resample`, `meshopt` or `draco`, texture resize, and KTX2/Basis (`etc1s` for color; consider `uastc` where quality such as normals demands it). The official CLI exposes Draco, Meshopt, KTX/Basis, simplification, draw-call joining, and animation resampling. Do not blindly use every optimization; validate the rig, normals, animation, and visual output after each export.

**Effort:** medium (2–4 days once the GLB exists).

**Gotchas:** HDR, KTX2 transcoders, Draco decoders, postprocessing, and the model are network/GPU costs, not just npm costs. Self-host decoder/transcoder files to avoid runtime CDN coupling. Draco often reduces transfer but adds decode work; Meshopt may be preferable for animated geometry. KTX2 support must be detected from the renderer. Postprocessing adds render passes; quality-tier it on mobile and avoid stacking every cinematic effect. Test WebGL context loss and the CSS fallback.

## 6. Animated node-graph connectors

**Add:** GSAP [DrawSVG](https://gsap.com/docs/v3/Plugins/DrawSVGPlugin/) from `gsap/DrawSVGPlugin`; no graph-layout library is needed for a fixed art-directed diagram.

**Why:** DrawSVG reveals SVG path/line/polyline strokes by controlling `stroke-dasharray` and `stroke-dashoffset`, and integrates with the same ScrollTrigger timeline. It supports staggered strokes and “live” length recalculation for the rare responsive path whose length changes.

**Concrete mapping:** replace `.lab-flow-node::after` with a semantic DOM-node layer plus an absolutely positioned, `aria-hidden` responsive SVG. Author one cubic Bézier path per connection. In the pinned process timeline: reveal node → draw outbound path → activate next node → pulse a small travelling marker. On mobile, switch to vertical paths rather than scaling a desktop graph into illegibility.

**Effort:** medium (1–2 days for the current five-node fixed graph).

**Gotchas:** DrawSVG affects strokes, not fills. Keep each connection as a single-segment path where practical. Responsive endpoints must be recomputed after resize/font load, followed by `ScrollTrigger.refresh()`. A hand-authored graph is far smaller and more controllable than React Flow/D3 for this fixed editorial use case. Under reduced motion, show all paths and nodes immediately.

## 7. Card micro-animations: Rive vs Lottie

**Primary choice:** [Rive React runtime](https://rive.app/docs/runtimes/react/react), normally `@rive-app/react-canvas` for a handful of simpler cards or `@rive-app/react-webgl2` when Rive Renderer-only features/quality are required.

**Why Rive here:** Rive state machines make a card react continuously to hover, pointer position, focus, selected state, and live data. The React runtime exposes hooks, playback, events, and dynamic text. Rive's runtime docs recommend WebGL2 for maximum quality/performance but explicitly warn about concurrent WebGL-context limits; many cards can share an offscreen renderer. Canvas has a smaller runtime and is a sensible default when the animation is simple.

**Use Lottie when:** the asset is a linear After Effects loop/one-shot with no meaningful state. The modern React package is [`@lottiefiles/dotlottie-react`](https://developers.lottiefiles.com/docs/dotlottie-player/dotlottie-react/) and accepts `.lottie` or JSON with playback controls. Airbnb's [`lottie-web`](https://github.com/airbnb/lottie/blob/master/web.md) supports SVG, Canvas, and HTML renderers.

**Decision for `/lab`:** use Rive on at most 2–4 high-value capability/project cards, with one shared visual system and focus/hover states. Use CSS/GSAP for simple arrows, masks, and image parallax. Do not add Lottie merely for ambient loops if Rive is already adopted.

**Effort:** code integration is low (0.5–1 day); authoring good `.riv` files is medium/high and designer-dependent.

**Gotchas:** both are client runtimes and should be lazy/visibility loaded. Rive adds WASM/runtime cost; `canvas-lite` removes features including text/layout/audio/scripting, so confirm asset needs. WebGL2 cards compete with the hero Canvas for browser context/GPU resources. Lottie JSON can be surprisingly large and DOM-heavy under the SVG renderer. Pause offscreen animations, size containers before mount, provide static fallbacks, and map reduced motion to a final frame.

## 8. Exact design fidelity: variable display fonts and tokens

**Font stack:** license and self-host **[PP Neue Montreal Variable](https://pangrampangram.com/products/neue-montreal)** for the Latin display voice (or commission/select a more ownable equivalent after a type trial), paired with a Thai variable family explicitly tested by the design team rather than silently falling back to a generic system face. Neue Montreal is a variable commercial family with WOFF2 and a wide weight range, but its published script coverage does not include Thai; bilingual fidelity therefore requires a deliberate Thai companion and optical size/weight matching.

Load local WOFF2 through [`next/font/local`](https://nextjs.org/docs/app/api-reference/components/font), expose CSS variables, and preload only the hero-critical face/axis range. Next's font module self-hosts and provides fallback adjustment to reduce layout shift.

**Tokens:** put the approved system in Tailwind v4 [`@theme`](https://tailwindcss.com/docs/theme):

- type families, fluid display/body/mono sizes, leading, tracking, weight axes;
- OKLCH paper/ink/accent/metal/glow colors;
- hairline widths, grid units, radii, spacing rhythm;
- motion durations/eases and section scroll lengths;
- z-index/canvas layers and quality breakpoints.

Tailwind v4 emits theme tokens as native CSS variables, so the identical color/easing values can be consumed by CSS, GSAP, Rive inputs, and r3f materials. This is more exact than scattering literals through `.lab-*`, TSX props, and Three materials.

**Effort:** medium (1–3 days for token migration after design approval; font selection/licensing can take longer).

**Gotchas:** font licensing is part of the implementation, not an afterthought. A Latin-only hero face produces obvious brand drift when locale switches to Thai. Variable fonts can still be heavy when glyph coverage is broad; subset only when the license/tooling permits and never omit required Thai glyphs. Wait for fonts before line splitting and refresh ScrollTrigger afterwards. Define a visual-regression matrix at representative desktop/mobile widths and both locales; “exact” is measurable only with reference captures.

## Suggested implementation sequence

1. Install `gsap @gsap/react`; build the shared ticker and one hero pin/scrub proof with the existing procedural form. This de-risks scroll architecture before asset work.
2. Build the SVG node-graph and text system on the same timelines. Establish reduced-motion and no-JS final states now.
3. In parallel, approve the robot character sheet and generate two Meshy/Tripo candidates. Select one, clean/rig/animate in Blender, and define performance acceptance criteria.
4. Add Drei, the optimized GLB, self-hosted HDR/gainmap, and selective bloom. Profile desktop and representative mobile hardware before raising quality.
5. Lock the bilingual type/token system; then author only the few Rive cards that materially benefit from stateful interaction.

## Acceptance checks

- `bun run build`, component tests, and the repository-required `bun run e2e` pass after each frontend slice.
- No hydration/console errors; semantic headings and content remain present before animation initialization.
- `prefers-reduced-motion` shows a complete, attractive composition without preloader, scrub, scramble, or perpetual animation.
- Verify desktop and mobile: scroll restoration, anchor navigation, touch momentum, pin release, viewport rotation, font swap, and locale switch.
- Profile transfer, main-thread time, GPU frame time, WebGL contexts, and memory. The hero should pause offscreen; Rive/Lottie cards should visibility-pause.
- Validate GLB clips/materials after every compression step and record asset license/source/attribution in the repository.

