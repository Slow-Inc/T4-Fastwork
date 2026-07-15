# PRD — Open WebUI-style app-shell for the /chat page (Universal Design)

Date: 2026-07-15. Epic. One PRD → the issues below.

## Why

`/chat` is the site's AI assistant and a showcase of T4's engineering. Today it is a single-session
page. To make a first-time visitor **instantly know how to use it** (Universal Design), we adopt the
**layout language of Open WebUI** — the sidebar app-shell, conversation history, empty-state
suggestions, message actions, and a rich composer — while keeping **our** visual system
(Editorial × Modern Swiss × Liquid Glass × **Visible Grid**). Familiar structure, bespoke skin →
the assistant feels both usable and clearly built by us.

Design research (both required reading before implementing):
- `docs/design/openwebui-layout-study.md` — the measured OWUI layout (every page, logged-in).
- `docs/design/expensive-minimalism.md` — our Visible-Grid Swiss build spec + tokens.
- Visual system of record: `nextjs/DESIGN.md`, `Requirement.MD` §14.

## What we adopt vs. skip

**Adopt (layout language):** collapsible **left sidebar** (New Chat + conversation history grouped by
recency + identity footer); **empty state** (centered identity + composer + `⚡ แนะนำ` suggestion
rows); **message action row** (copy, regenerate) on assistant turns; **user messages** as a subtle
right-aligned pill; **composer** with an **attach** control (image upload); a slim **top identity
strip**.

**Skip (OWUI product surface, not a showcase concern):** model selector / add-model, Folders,
Notes / Calendar / Archived, product Settings (Audio/Connections/Personalization), voice mode,
per-message 👍/👎/read-aloud.

**Style translation (our pillars, not OWUI's flat look):** hairline rails + `+` registration marks;
sidebar items mono-labelled + hairline "ledger" dividers; date-group headers = mono UPPERCASE tint
bands; ink primary buttons; the single orange accent rationed (new-chat dot, active item, send);
Liquid Glass only on the composer + any modal. All `rounded-lg`/subtle radius, no drop-shadows.

## Constraints

- **No user accounts** → conversation history is **client-side** (localStorage). Each conversation =
  `{ id, title, messages, sessionId, updatedAt }`. Migrate the current single `SHARED_CHAT_KEY`
  ('floating') conversation into the new store on first load (no data loss).
- The `/chat` page shares `ChatClient` with the floating popup — the sidebar is `/chat`-only; the
  popup stays the compact widget. Keep both working.
- Accessibility (WCAG AA, our DESIGN.md): ≥4.5:1 text, 2px offset focus rings, `prefers-reduced-motion`
  → instant, IME-safe input, keyboard-navigable sidebar/history.
- Mandatory: `bun run e2e` for every frontend change; TDD; bilingual issues/PRs.
- Relates to: image upload **#35** (folded into P4), interrupted-turn bug **#36** (separate).

## Deliverables (→ issues)

- **P0 — Conversation store.** A pure `lib/chat-conversations.ts` (list/create/switch/rename/delete/
  touch; recency-group helper `Yesterday/Previous 7 days/…`; migrate the `floating` key). Unit-tested.
- **P1 — `<ChatSidebar>` + app-shell.** Collapsible sidebar (New Chat, grouped history with active
  highlight + rename/delete, identity footer) wired into a `/chat` two-pane app-shell in Visible-Grid
  Swiss; collapse toggle; responsive (drawer on mobile). Reads/writes P0.
- **P2 — Empty-state + suggestions.** Centered identity + composer + a `⚡ แนะนำ` suggestion list
  (title + subtitle rows, from our quick-replies); clicking a row sends it. New-chat lands here.
- **P3 — Message actions.** An action row on assistant turns: **copy** + **regenerate** (resend the
  prior user turn) [+ optional edit-user-message]. Hover-reveal, keyboard-reachable.
- **P4 — Composer attach + image upload.** Add the `+` attach control → image picker/preview/send,
  wiring the vision-capable backend (subsumes **#35**).
- **P5 — Top identity strip + user pill.** A slim `ผู้ช่วย AI · T4 Labs` top strip; user turns get a
  subtle right-aligned pill.

## Acceptance (epic-level)

- [ ] A first-time visitor sees an OWUI-familiar shell (sidebar + history + suggestions + composer) and
      can start/switch/continue conversations without instruction.
- [ ] Everything is in our Visible-Grid Swiss style (rails, mono labels, hairlines, rationed orange,
      glass composer) — never OWUI's flat/branded look.
- [ ] History persists client-side; the existing conversation is migrated, not lost.
- [ ] Popup widget still works; `/chat` and popup share the active conversation.
- [ ] TDD unit coverage for the store + `bun run e2e` green (new cases: new-chat, switch, suggestion
      send, copy/regenerate).

## สรุปภาษาไทย

ยกเครื่อง `/chat` ให้ใช้ **layout แบบ Open WebUI** (sidebar + ประวัติบทสนทนา + empty-state suggestions +
ปุ่ม action ต่อข้อความ + composer แนบไฟล์ + top strip) เพื่อ **Universal Design** — เข้ามาครั้งแรกใช้เป็นทันที
— แต่คง**สไตล์ visible-grid Swiss** ของเรา (rails + `+` + mono label + tint band + ink button + orange
ประหยัด + glass เฉพาะ composer/modal). ไม่มี account → history เก็บ **localStorage** (migrate ของเดิม key
`floating` ไม่ให้หาย). ข้าม product feature ของ OWUI (model selector/Folders/Notes/Calendar/Settings/
voice/👍👎). แตกเป็น P0 store → P1 sidebar/app-shell → P2 empty-state → P3 message actions → P4 attach/
image (รวม #35) → P5 top strip/user pill. บังคับ TDD + `bun run e2e` + bilingual. เกี่ยวกับ #35, #36.
