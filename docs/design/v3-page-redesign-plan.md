# v3 redesign plan — every page except Home

**Scope:** all production pages *except* `/` (already swapped to the lab4 v3
composition, commit `e8a65e6`). Source of truth: `requirement3.md` §14 + §4.
Tracked by [#110](https://github.com/Slow-Inc/T4-Fastwork/issues/110); the
graduation decision is [ADR 0011](../adr/0011-t4bot-graduates-to-live-site.md).

Written 2026-07-20 after a full audit of the existing pages, their components,
their data sources, and the e2e contract each one carries.

---

## 1. The finding that shapes everything

**The redesign is NOT ten CSS rewrites.** Two things already landed that
change the cost structure:

1. **The dark-token bridge** (`.lab4[data-lab4-theme='dark']` remaps the 8 root
   tokens). Every existing page's CSS is written against `--paper` / `--ink` /
   `--accent` / `--line`. The moment a page renders inside the v3 shell, its
   existing styling becomes theme-aware **for free**. Verified on Home: SDLC,
   team directory, certificates and the featured carousel all flipped to dark
   with zero per-component CSS.
2. **The robot stage is marker-driven** — a page opts in by rendering
   `[data-l4-zone]` markers. No page needs bespoke 3D code.

So the per-page work is **composition and hierarchy**, not a token migration.
What each page actually needs is: wrap in the shell, then fix the specific
places where it violates §14 (uniform card grids, missing evidence, weak
hierarchy, absent states).

### The one architectural prerequisite

The v3 shell currently lives **inline in `app/page.tsx`** — the theme div, the
pre-paint script, the blueprint field, the theme toggle, the wordmark band.
Copy-pasting that into 12 more pages is the single worst thing we could do
(12 copies of a hydration-sensitive inline script).

**Extract `components/site/v3/site-shell.tsx` first.** Everything else in this
plan assumes it exists:

```
<V3Shell blueprint="visible|quiet|invisible" footerRobot={false}>
  {page content}
</V3Shell>
```
It owns: the `.lab4` themed div + `suppressHydrationWarning`, the pre-paint
theme script, `.lab4-field`, `SiteNav` + the floating theme switch, the
oversized-wordmark footer band + `SiteFooter`, `ChatButton`, `RevealObserver`.
`app/page.tsx` should be refactored onto it in the same pass so there is exactly
one implementation.

---

## 2. Three governing rules, applied per page

### 2.1 Blueprint visibility (§14.5) — decides the "loudness" of each page

| Level | Pages / zones |
|---|---|
| **Visible** | `/projects` list head (catalog workbench), `/projects/[slug]` hero, `/recommend/*` hero + preview |
| **Quiet** | `/about`, `/team/[slug]`, `/pricing-guide`, `/contact`, `/blog` index, `/bw` |
| **Invisible** | `/blog/[slug]` body, `/faq` answers, `/privacy`, `/terms`, form fields, `/member`, `/admin` |

This is a real decision, not decoration: it stops every page from shouting and
gives long-form reading pages the calm §14.4 demands.

### 2.2 Robot policy (§14.2.1 + §14.10) — the constraint people get wrong

§14.10 is explicit: **the 3D robot in the footer is Home-only**; other pages use
a static render. §14.2.1 adds: the robot may appear at *micro* level elsewhere
(icon, cursor hint, empty state) but must never be a full 3D scene in every
section, and it must always have a job.

So:

| Page | Robot |
|---|---|
| `/` | full WebGL stage, 5 zones (shipped) |
| `/chat` | **the avatar** — identity strip + empty state (§5.4 says it is the same character). Static render or one small canvas; this is the strongest on-brand use left |
| `/projects` | static, **empty-state only** ("ไม่พบผลงาน" → robot shrug) |
| `/projects/[slug]` | static, beside the "ถามรายละเอียดผลงานนี้กับ AI" CTA |
| `/contact` | static, beside the form (receptionist read) |
| everything else | wordmark-footer static render only |

**Prerequisite deliverable:** 3 static robot renders (neutral / point / shrug),
transparent PNG @2x, rendered from `prototypes/t4bot/t4bot-v3-noeyes.blend` with
the same lighting rig as the web stage, parked in `public/brand/`. Cheap to
produce (Blender MCP is wired) and it unblocks 6 pages.

### 2.3 The Home/About duplication now has to be resolved

The home swap put SDLC + team + certificates on Home. `/about` carries the
*same three sections from the same components*. §14.3 already rules on this:

> ทุกหัวข้อบน Home เป็น "บทสรุป" ที่มีลิงก์ **กดเข้าไปอ่านต่อในหน้าแยก**

**Decision needed from the dev, with a recommendation:** Home keeps *summary*
versions (SDLC as 6 compact rows, team as a 6-row directory, certs as a count +
top-3 strip) each linking onward; `/about` and `/team/[slug]` carry the full
treatment. Guard: the e2e asserts the full SDLC phase headings and
`.team-dir-item === 6` on **`/about`** (not Home), so trimming Home is safe;
trimming About is not.

---

## 3. Page-by-page

Effort is relative: **S** = restyle within the shell, **M** = recomposition,
**L** = new structure/behavior.

### Tier 1 — conversion surfaces (do first)

#### `/projects` — the catalog **[L]**

*Today:* breadcrumb → page head → filter bar (search + 3 native `<select>`) →
result count → uniform card grid. Hardcoded Thai (the only non-bilingual
surface in the site).

*What's actually wrong:*
- **§4.2 requires pagination (~12/page) — it does not exist.** Every published
  project renders at once. This is a functional gap, not a visual one, and it
  gets worse as the catalog grows (the spec references ~113 items).
- §14.10 says project cards should differ in **crop/scale/span by importance**.
  We already compute `ai_rank` (ADR 0008) and merely *sort* by it — feeding rank
  into span/scale turns an existing system into visual hierarchy for almost no
  new machinery. This is the highest-leverage single change on the site.
- Three generic selects read like a WordPress archive, not a lab workbench.

*Redesign:* blueprint **visible** at the head; filter becomes a Swiss control
bar — mono axis labels (`CATEGORY / TECH / TAG`), chips as toggles that write
the same query params, keeping the `?tech=` deep-link contract; rank-driven
asymmetric grid (rank 1–3 = wide/tall, rest = standard); result count as a
coordinate readout; robot shrug in the empty state; add pagination.

*Must not break:* `?tech=` query contract (Home's `#tech .tech-chip` hrefs are
e2e-asserted), `.breadcrumb` never `position: fixed`, visible `h1`.
*Also fix here:* the hardcoded-Thai locale gap.

#### `/projects/[slug]` — case study **[M]**

*Today:* head → single hero shot → 2-col content/meta → contributors → live
README → CTA row. It already carries the best evidence on the site (live GitHub
stars, real contributors, real README, live-site preview overlay).

*Redesign:* lean into §14.11/§14.12 — present the meta sidebar as an
**instrument panel** (spec table with hairlines + mono keys, like the lab4 hero
meta blocks), give the hero shot real editorial scale with a caption, and treat
contributors as credited humans rather than chips. Leave a slot for the
AI-authored case-study body (ADR 0009) rather than designing around today's
paragraph array. Robot static beside the ask-AI CTA.
*Gap vs §4.3:* gallery/video support (today: one image).

*Must not break:* the exact label `ถามรายละเอียดผลงานนี้กับ AI`, its
**in-place** behavior (no navigation), `.chat-panel` / `.chat-project-banner`
class names, `.owner-chip` containing "T4 Labs".

#### `/chat` — the AI, with a face **[M]**

*Today:* nav → head → the Open WebUI-style app shell. No footer (deliberate).

*Redesign:* this is where §5.4 pays off — **the robot becomes the assistant's
avatar** in the identity strip and the empty state, so the character that greets
you on Home is the one answering. Apply §14.6 properly (the chat surface is
exactly the "interface floating over content" glass is *for*), and §14.10's chat
state list is a checklist to audit against: closed / greeting / open / thinking /
streaming / error / reconnect, plus the required "AI may be wrong" disclosure.

*Must not break:* the substantial chat e2e suite (sidebar, rename/delete,
suggestions, markdown, image attach, busy-state send-lock, popup↔page shared
conversation).

#### `/contact` — lead capture **[S–M]**

*Today:* 2-col form + two aside cards. Functionally complete (server action,
validation, Turnstile flag, Supabase leads).

*Redesign:* glass form card on a quiet blueprint; §14.10 + §14.15 require the
**full state inventory** — default, focus, filled, valid, invalid, loading,
disabled, success — and errors must never clear what was typed. Static robot
beside the form as the "someone is actually here" cue. Make the Fastwork card
visually the trust anchor (it is the money path).

*Must not break:* `form.contact-form` with `input[name=name]`,
`input[name=email]`, `textarea[name=message]`; `.cf-turnstile` absent when the
key is unset.

### Tier 2 — credibility

#### `/about` **[M]**
Becomes the **full** version of what Home summarizes (see 2.3). Blocks 1–4 are
generic card grids today — §14.10 says differentiate by density/span, not by
repeating four identical cards. The SDLC list is already the most on-brand thing
on the page (big mono numerals, editorial column) — make it the page's spine.
*Must not break:* the six exact SDLC phase headings, `ทีมที่ลงมือสร้างจริง`,
`.team-dir-item === 6`, the `.crow` → `.tm-modal` lightbox contract, and the
claims guard (no `20 ปี` / `20+` / `500`; must contain `21+`).

#### `/team/[slug]` **[S–M]**
Already Swiss-ish (numbered 01–05 blocks). Needs: hero treatment for the avatar,
the cert lightbox restyled as glass, live GitHub stars presented as data rather
than an afterthought. §14.12 rule to respect: never merge one member's
certificates or skills into another's.
*Must not break:* `.tech-ico` visible, `.tm-cert-open` → `.tm-modal` +
`.tm-modal-img` + Supabase-hosted PDF link + Escape-to-close, and the
full-viewport modal geometry assertions.

#### `/pricing-guide` **[M]**
Three equal package cards are exactly the uniform-grid anti-pattern §14.10 calls
out for service tiers. Rebuild as a **ladder/axis** (the lab4 services ladder is
the reference implementation, already in the codebase). Keep the include/exclude
columns — honest scoping is a trust asset — and label estimates as estimates per
§14.12.

#### `/faq` **[S]**
Structurally fine. Blueprint **invisible** behind answers, mono numbering on
questions, keep the native `<details>` semantics.
*Must not break:* `.faq-a` non-zero `transitionDuration`, per-item stagger
(`[0] === "0s"`, `[1] !== [0]`), hidden-until-clicked.

### Tier 3 — content

#### `/blog` index **[M]** and `/blog/[slug]` **[M]**
The index is a uniform card grid; an **editorial index** (numbered rows,
hairlines, date/read-time as metadata columns) is both more on-brand and better
at scale. The article page is the site's only long-form surface and currently
renders a plain `string[]` of paragraphs — it needs a real reading treatment:
45–75ch measure (§14.3), invisible blueprint, proper heading scale. Note the
article body has **no markdown renderer** (unlike project READMEs); if posts are
ever authored richer, that is a content-model change, not a styling one.

#### `/recommend/[type]` **[M]**
Six SEO/ad landing pages off one template — worth real polish. It borrows
`.about-grid` / `.about-cta` from About, so About's redesign ripples here:
decide whether they share components or fork. The interactive preview and
feature checklist are genuine assets; §14.10 requires the preview to keep a
static fallback and keyboard/touch navigation.

### Tier 4 — legal / minor

#### `/privacy` + `/terms` **[S]** — 🔴 **fix a live bug while you're there**
Both pages mark their content `.rv` (which is `opacity: 0` by default) but never
mount `RevealObserver`, so **the entire body of both pages is invisible in a
real browser** — verified today at `opacity: 0`, screenshot shows an empty page.
The e2e smoke test passes because Playwright's `toBeVisible()` ignores opacity.
Fix: either mount the observer or drop the `.rv` classes; then add an e2e
opacity assertion so the class of bug cannot recur. They are also TH-only while
everything else is bilingual.

#### `/bw` (partners) **[S]** — shell + a mono list. Trivial.

### Tier 5 — private surfaces

`/member/**`, `/admin/**`, `/member/login`, `/admin/login` are `noindex`
utility. They should inherit the v3 **tokens** (so they don't look like a
different product) but none of the theatrics — no robot, no marquee, invisible
blueprint. Admin density beats brand expression here. Lowest priority.

---

## 4. Shared work, in dependency order

1. **`V3Shell`** — extract from `app/page.tsx`, refactor Home onto it. *Blocks everything.*
2. **Static robot renders** → `public/brand/` (neutral / point / shrug). *Blocks 6 pages.*
3. **`SiteFooter` v3** — oversized wordmark band + static robot, on every page.
4. **`Breadcrumb` v3** — mono/coordinate styling; on 9 pages. Must stay non-fixed.
5. **Shared primitives** — the section head (`lab4-coord` + h2 + note) and the
   card/row treatments already exist in the lab4 CSS block; promote them out of
   `.lab4-*` naming as they get reused, or accept the prefix as the v3 namespace.
6. **Per-page dark pass** — the token bridge makes pages *work* in dark, not
   *designed* for dark. Each page needs a contrast check (WCAG AA per §14.14),
   especially images, badges, and the certificate thumbnails.

---

## 5. Suggested sequencing

| Phase | Contents | Why this order |
|---|---|---|
| **P0** | `V3Shell` + static robots + footer/breadcrumb v3 | Everything downstream depends on it; also the only phase that touches Home again |
| **P1** | `/projects` + `/projects/[slug]` | Highest traffic, biggest gap (pagination, rank-driven hierarchy), strongest evidence |
| **P2** | `/chat` + `/contact` | Conversion + the robot-as-avatar payoff |
| **P3** | `/about` + `/team/[slug]` + Home summary trim | Resolve the duplication as one editorial decision |
| **P4** | `/pricing-guide` + `/faq` + `/blog` ×2 + `/recommend` | Long tail, template-heavy |
| **P5** | `/privacy` + `/terms` (+ bug fix) + `/bw` + member/admin tokens | Cleanup |

Each phase ships behind the same gate: `bun run e2e` green, both themes
screenshotted, dev OK on localhost before merge.

---

## 6. Guardrails

- **The e2e contract is the spec's teeth.** Every page section above lists what
  it must not break; the selectors are load-bearing product behavior, not test
  implementation details.
- **§14.16 anti-slop:** no decorative 3D without a job, no fake coordinates or
  fabricated status readouts to fill space, no stock photography, label every
  sample/estimate as such.
- **§14.14:** WCAG AA in *both* themes, reduced-motion honored, and the pages
  must stay readable with 3D and animation disabled.
- **Do not let the visual redesign reorder the §14.3 editorial sequence** or
  drop states (error, empty, loading) that exist today.

---

## 7. Open questions for the dev

1. **Home vs About duplication** — trim Home to summaries + links (recommended,
   and what §14.3 says), or keep both full?
2. **`/projects` pagination** — pages of 12 (spec default) or infinite scroll?
   Affects the grid design directly.
3. **Blog content model** — do articles stay plain paragraphs, or move to
   markdown? Changes how much the article redesign can offer.
4. **Dark or light as the site default** for first-time visitors? Home currently
   follows the OS preference; the old site was light-only, so this is a brand
   decision, not a technical one.
