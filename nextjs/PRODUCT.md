# Product

## Register

brand

## Users

Prospective **clients** — founders, CTOs, VP Eng — evaluating whether to hire **T4 Labs** to build software for them, plus visitors funneling toward the AI chat assistant and the contact/hire flow. Their context: judging an agency's engineering credibility and taste in seconds, often technically literate.

## Product Purpose

T4 Labs' agency/portfolio + hire-us **showcase** (Bigzweb-style): a project/portfolio grid with category+tech filtering, an **AI chat assistant** (RAG over T4's real projects/services/FAQ) that recommends matching case studies, a bilingual (TH/EN) blog, an admin/CMS, and lead-gen flows. Success = a technical buyer thinks *"these people can build my product"* and contacts us. **Design IS the product** — the site's craft is the sales pitch. Full functional spec: `../Requirement.MD`.

## Brand Personality

Confident · professional · minimal · smart · modern · approachable — **without trying too hard**. Voice: direct and short ("We build products that scale," not "We are passionate about leveraging…"); let the work speak. Warm off-white, light humor OK. Premium comes from **small details, not big gimmicks**. (Requirement §14.0.)

## Anti-references

Generic "AI slop" (fluffy, no POV); template landing pages; **glassmorphism everywhere**; drop-shadow-heavy card grids; identical 3-card rows; a tiny uppercase eyebrow above *every* section; gradient text; multi-color palettes; loud/showy animation; stock photos or generic dashboard mockups.

## Design Principles

- **Editorial Minimalism × Modern Swiss × Liquid Glass × Visible Grid** (Requirement §14.1). Full research + build spec: `docs/design/expensive-minimalism.md` (repo root).
- **Premium = precision, not decoration.** A visible hairline grid + exact alignment + typography carry the design. **Elevation by hairline + negative space, never drop-shadow.**
- **One accent only** (`#E8461B`), **rationed hard** — identity / live / link / one deliberate CTA. Everything else ink-on-paper.
- **Liquid Glass on floating layers only** — nav, floating chat widget/popup, the pinned composer bar, modals. Content surfaces (cards, message rows) are hairline + solid, not glass (Requirement §14.5).
- **Show, don't tell** — real projects/stats, no stock/mockup filler.
- **Practice what you preach** — the site must be as well-engineered as the work it sells.

## Accessibility & Inclusion

WCAG AA: body & placeholder text ≥ 4.5:1, large/bold ≥ 3:1. Bilingual TH/EN (Thai needs extra leading). `prefers-reduced-motion` honored — all motion degrades to instant. Keyboard-first: 2px offset focus rings, never remove the default outline without a replacement. IME-safe text input (Thai/CJK composition).
