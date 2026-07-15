# DESIGN.md: T4 Labs

The visual system. Register: **brand** (design IS the product). Concept:
**Editorial Minimalism × Modern Swiss × Liquid Glass × Visible Grid**. Deep dive + reference research
(6 real visible-grid Swiss sites, measured): `../docs/design/expensive-minimalism.md`. Functional spec: `../Requirement.MD` §14.

## Design Summary

Warm off-white canvas, near-black ink, **one** signal-orange accent used sparingly. The design is carried by a
**visible hairline grid** (vertical rails framing a centered column + full-bleed horizontal rules + `+` registration
marks), high-contrast **grotesque display + mono labels** typography, generous negative space, and exact Swiss
alignment. **Elevation is by hairline + whitespace, never drop-shadow.** **Liquid Glass** (frosted, specular) appears
only on floating layers — nav, floating chat popup, the pinned composer, modals. Recreate: precise, quiet, engineered,
premium-by-detail; never AI-slop, never glassmorphism-everywhere.

## Design Tokens

### Colors (light; a Charcoal/dark variant swaps the same tokens — Requirement §14.2)

| Role | Value | Use |
|---|---|---|
| `--paper` | `#F4F2ED` | canvas (warm off-white, not pure white) |
| `--paper-deep` | `~#EDEBE4` | recessed panel / date-group tint band |
| `--ink` | `#131311` | primary text, dark hairlines |
| `--muted` | `#6B6862` | secondary body, captions |
| `--faint` | `#9A968D` | metadata, faint labels |
| `--line` | `rgba(19,19,17,.10)` | **hairline — grid rails, full-bleed rules, borders** (soft `.06–.08`) |
| `--accent` | `#E8461B` | **single accent** — index number, send button, assistant-identity token, live/caret, link, ONE CTA. Nowhere else. |
| glass tint | `rgba(244,242,237,.6)` + `blur(20–24px) saturate(150%)` | **floating layers only** |

Contrast: body & placeholder ≥ 4.5:1. Hierarchy by **opacity/value** (ink 100 / 70 / 45%), never a second hue.

### Typography (Requirement §14.3 — 4 tiers, high contrast)

- **Display / Heading** — grotesque (Space Grotesk), `clamp` large, **tight tracking** (−0.02…−0.04em), weight 600, line-height ~1.0–1.1.
- **Body** — neo-grotesque sans (Inter-class), 15–16px, line-height 1.6.
- **Label** — **mono (JetBrains Mono)**, 12px, **UPPERCASE**, letter-spacing .14–.2em, ink — nav, section tags, turn labels.
- **Metadata** — mono, 11px, UPPERCASE, faint, letter-spacing .12em — index `01/02`, timestamps, model, token counts.
- Thai (IBM Plex Sans Thai / Anuphan) paired with extra leading. Big display jumps hard from small body — that contrast IS the Swiss look.

### Spacing & Layout

- **4px base, 8px rhythm.** Scale 4/8/16/24/48/96.
- Conversation/content column **~900px** centered; site max-width 1280–1440; wide outer margins (rails live there).
- **Radius: subtle, not zero** — cards/composer `8px` (`--r-card`), chips `6px`, **send button + avatars circular** (`9999px`), **grid rails/rules stay square**. (Research: the reference sites measure 8–16px, not `rounded-none`; only marketing *inputs* go 0px.)
- **Shadow: none** (or `shadow-xs` = `0 1px 2px rgba(19,19,17,.05)` max). Separate with 1px `--line` + whitespace.

### The Visible Grid (signature)

- **Vertical rails** — `border-inline: 1px solid var(--line)` on the centered column, full height.
- **Full-bleed horizontal rules** — `::before/::after { content:""; position:absolute; height:1px; width:200vw; left:-100vw; background:var(--line); z-index:-1 }` at section/turn boundaries.
- **`+` registration marks** at rail × rule intersections (small mono/accent `+`), 4–6 per screen, only at real macro joints.
- **Optional crosshatch field** (empty/hero only): 8px-pitch `linear-gradient` at ink/accent 5–8% + `mask-image: radial-gradient(circle,#000 25%,transparent 72%)` edge-fade.

## Components

- **Buttons** — primary = **ink** fill, paper text (send = circular ink `→`); secondary = paper + 1px `--line`; ghost = text + `→`. `rounded-lg`/pill, no shadow. Accent is NOT a button fill (keep orange scarce).
- **Composer (Liquid Glass)** — pinned bottom, `rounded-lg`, **frosted glass** (`backdrop-filter: blur(20px) saturate(150%)`, glass tint, hairline + faint specular top border) — the one glass moment on the chat surface; transparent input inside; circular ink send.
- **Chat turns — NO bubbles.** Flat rows separated by full-bleed hairline rules. A **mono label** leads: assistant `ผู้ช่วย AI` **in accent** + live dot; user `คุณ` muted, right-aligned. Body Space-Grotesk/ sans; optional trailing **mono metadata** (model · thinking time). Date groups use a `--paper-deep` **tint band**, not a heavy divider.
- **Thinking/streaming** — mechanical: mono `กำลังคิด` + **accent block caret** blinking `steps()` (or loading-dots), inside a hairline box with corner ticks. Done → `💭 คิดอยู่ N วิ` collapsible.
- **Cards / data-grid cells** — hairline-bordered `rounded-lg`, icon/label, `--line` dividers, no shadow (chanhdai/entire pattern). Quick-replies = mono UPPERCASE hairline chips.
- **Code block** — filename/lang header + copy button, mono, muted syntax highlight, `rounded-lg`, hairline.
- **Labels/badges** — mono UPPERCASE in a hairline `rounded-md` box; index `01/02`; `FIG.00x`-style captions; `● live` status dot (accent/green).
- **Nav (Liquid Glass)** — sticky frosted pill; **footer** — mono key-value list + large outline wordmark closer.

## Motion (Requirement §14.6)

Subtle, 150–300ms ease-out. Hover = grey wash `rgba(19,19,17,.035)` / opacity step, no bounce. Focus = 2px offset ring. Streaming = mechanical caret / loading-dots. **`prefers-reduced-motion` → instant.** Grid lines are static (never draw-in).

## Content Style

Direct, short, warm; Thai + English. Mono for labels/metadata/system text; `01/02` index numbering; let the work and the numbers speak. No hype, no filler, no stock imagery.

## Rerun Inputs
workflow: manual (distilled from Requirement.MD §14 + docs/design/expensive-minimalism.md)
source: T4 Labs design system + 6-site visible-grid research
output: DESIGN.md
