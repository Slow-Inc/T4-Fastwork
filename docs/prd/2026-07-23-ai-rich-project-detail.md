# PRD — AI-rich project detail + human-authored blog

**Epic:** [Slow-Inc/T4-Fastwork#127](https://github.com/Slow-Inc/T4-Fastwork/issues/127) · **Date:** 2026-07-23 · **Status:** approved (dev vision) · **Delivery:** build-first (no red-TDD per dev), verify visually + `bun run e2e`.

## 1. Problem / intent

The activated case-study generator (ADR 0013) currently publishes AI content as **/blog posts**. The dev wants that AI content to instead be the **deep detail of each project** (a tab on the project page), and **/blog** to become **human-authored** (Markdown upload). Each project page should read like an AI-summarised, GitHub-sourced case study: an overview card, the deep-detail narrative, the tech stack **with explanations + a language-proportion graph**, tags, the GitHub/live URLs, and a **per-project AI chat**.

Reference: the dev's two screenshots — (1) the chat's structured project overview (ภาพรวม / สรุป 30 วินาที / เหมาะกับใคร), (2) a "เทคโนโลยีที่ใช้" section = AI description + tech chips + a donut.

## 2. Goals

- Move the AI case study from /blog into the project detail as a **deep-detail tab** (content already mirrored to `projects.content`).
- Show, per project: **AI overview card**, **tech stack + per-tech "used for" descriptions**, **language-proportion donut** (GitHub `/languages`), **tags**, **GitHub + live URLs**.
- Embed a **per-project AI chat** (reuse the existing `?project=<slug>` grounding).
- Make **/blog human-authored**: **Markdown upload → blog post** (admin first); hide `kind='case_study'` from /blog.

## 3. Non-goals (this epic)

- Member (non-admin) Markdown authoring — admin-only first (member draft→approve is a follow-up).
- Rewriting the chat engine — only embedding/wiring the existing project-grounded chat.
- Multi-audience case studies (dropped in ADR 0013).

## 4. Decisions (locked by the dev — "ทำเลว, decide the defaults")

1. **AI overview card** = a **structured** AI summary per project (overview / 30-sec highlights / good-for), generated alongside the case study; distinct from the free-form deep-detail narrative.
2. **Per-tech "used for" descriptions** = AI-generated (auto, `owner='auto'`-guarded), admin-editable.
3. **Donut** = **language proportions from GitHub** (`/repos/{o}/{r}/languages`), not tech.
4. **Markdown upload** = **admin** first.
5. **`blog_posts` case_study rows** = kept as a backing store; the tab reads `projects.content`; case_study hidden from /blog.

## 5. Data sources (mostly already present)

| Widget | Source | Status |
|---|---|---|
| Deep-detail tab | `projects.content` (generator mirror) | ✅ present |
| Tech chips / tags | `project_technologies` / `project_tags` M2M | ✅ present |
| GitHub / live URL | `gh_html_url` / `live_url` | ✅ present |
| Language donut | GitHub `/languages` snapshot | 🔶 backend sync + expose (this epic) |
| AI overview card | new structured generation | 🔶 new |
| Per-tech descriptions | new AI generation, owner-guarded | 🔶 new |
| Per-project chat | `/chat?project=<slug>` grounding + floating widget | ✅ present, embed |

## 6. Deliverables → issues (one PR each, referencing its issue)

- **D1 — Language-proportion donut** (backend sync + expose `/languages`; frontend SVG donut in the tech section).
- **D2 — Tabbed project-detail layout** (overview / deep-detail / tech), deep-detail = `projects.content`.
- **D3 — Structured AI overview card** (generation → new fields; render in the overview tab, Image #1 style).
- **D4 — Per-tech "used for" descriptions** (AI auto, owner-guarded, admin-editable; render in the tech tab, Image #2 style).
- **D5 — Embed per-project AI chat** in the detail page.
- **D6 — /blog human-authored** (hide `kind='case_study'`; admin Markdown-upload authoring).

## 7. Sequencing

D1 + D2 are independent and can land first (grounded, visible). D3/D4 depend on new generation (do after D2's shell exists). D5 reuses existing chat. D6 is independent; do it once D2 gives the deep-detail a home so nothing goes invisible.

## 8. Acceptance (per deliverable, verified in the running app)

Each deliverable: `bun run e2e` green (add a case where it adds UI), the widget renders on a real repo-backed project (`/projects/<slug>`) on prod after deploy, and no console/hydration errors. Any prod DB write (new generation fields, seeds) STOPs for explicit authz per CLAUDE.md.
