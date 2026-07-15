# Open WebUI layout study — for the T4 /chat "universal design" rebuild

Goal: make our `/chat` page's **layout** closely resemble Open WebUI (so a first-time visitor
instantly knows how to use it — Universal Design) while keeping our **style** (Editorial ×
Modern Swiss × Liquid Glass × Visible Grid — see `expensive-minimalism.md`). Studied live on a
logged-in instance (`chat.9arm.co`, OWUI 0.10.x) across every page.

## The app-shell (the thing that makes OWUI instantly recognizable)

Three zones:

1. **Left sidebar** (collapsible; `w-64`-ish; a "Close/Open Sidebar" toggle at its top-right):
   - Header: product logo/name + collapse toggle.
   - Primary nav (icon + label): **New Chat** (pencil), **Search**, **Notes**.
   - **Folders** section header (collapsible).
   - **Chats** section → the **conversation history**, **grouped by recency**: `Yesterday`,
     `Previous 7 days`, `Previous 30 days`, `June` … Each item = truncated title (+ optional
     leading emoji/●-unread) and a **relative time** right-aligned + faint (`3h`, `4d`, `1w`, `5w`);
     the active chat is highlighted with a `...` hover menu.
   - Footer: **user avatar + username** + a green "online" dot → opens the **user menu**.
2. **Top bar** (in the main area): **model selector** (`qwen3.6-35b-a3b ▾`) + `+` (new chat) +
   `Set as default`; right side: a Controls (sliders) button, an extra button, user avatar.
3. **Main area**: either the **empty state** or the **conversation**, plus the pinned composer.

## Empty state (new chat)

Centered, vertically middled: **model avatar + model name** (big), then the **composer card**, then
`⚡ Suggested` — a **list of suggestion rows**, each a **bold title + a muted subtitle**
("Show me a code snippet / of a website's sticky header"; "Give me ideas / for what to do with my
kids' art"; "Tell me a fun fact / about the Roman Empire"; …). Clicking a row sends it.

## Conversation view

Centered reading column, **no assistant bubbles**:
- **Assistant message** = an **avatar + bold model name** header row → an optional **stats/metadata
  row** (mono-ish: `↑8,130 · ↓122,942 · Σ131,072 · 🧠252,976 · ⏱28m 2s · ⚡73.1 t/s`) → a
  collapsible **`Thought for 28 minutes ▾`** (reasoning) → the **answer** (markdown) → a
  **`7 Sources` citation chip** → a **row of action icon-buttons**: edit ✎, copy ⧉, read-aloud 🔊,
  👍, 👎, play ▷, **regenerate ↻**.
- **User message** = a **small light-grey rounded pill, right-aligned** ("สวัสดี", "Hi") — subtle,
  not a heavy bubble.
- **Composer** (pinned bottom, centered, rounded-2xl, hairline): placeholder **"Send a Message"**;
  left controls **`+` (attach/More → Integrations, Available Skills)**, a tools/diamond icon, a
  count `◇ 1`; right controls **mic (Voice Input)** + a round black **voice-mode / send** button.

## Chrome: user menu, settings, content pages

- **User menu** (from the sidebar footer): Update your status · **Settings** · Archived Chats ·
  Notes · Calendar · Sign Out.
- **Settings** = a **centered glass modal**: a **left section-nav** (Search, General, Interface,
  Connections, Personalization, Audio, Data Controls, Account, About) + a right content pane
  (Theme ▾, Language ▾, Notifications, System Prompt textarea, Advanced Parameters "Show") + a
  bottom-right **Save** (ink pill) + an `✕` close.
- **Content pages** (e.g. `/notes`) share the shell + a **page-header pattern**: big title + count
  ("Notes 0") + a primary **`+ New` ink pill** (top-right), a search field, filter dropdowns
  (`All ▾`, `Write ▾`), a **view toggle** (`List ▾`), and a centered **empty state**
  ("No Notes / Create your first note…").

## What to adopt for OUR /chat (Universal Design), in our Visible-Grid Swiss style

**Adopt (the familiar OWUI shell):**
- **Left sidebar** app-shell: **New Chat** + **conversation history grouped by recency** + a footer
  identity. Our history is client-side (localStorage: a list of conversations, each = messages +
  backend sessionId) since we have no accounts — enough to feel like OWUI. Collapsible; on the
  marketing site it sits *below* the fixed T4 nav (or the nav collapses on /chat for a fuller shell).
- **Empty state** = centered "ผู้ช่วย AI" identity + composer + a **`⚡ แนะนำ` suggestion list**
  (reuse our quick-replies as title+subtitle rows).
- **Conversation** keeps our current visible-grid Swiss turns (mono identity label, no bubbles,
  hairline rules) **plus** an OWUI-style **message action row** (copy, regenerate) and the existing
  thinking box (already "Thought for N"-equivalent). User = right-aligned (add a subtle pill).
- **Composer** = our Liquid-Glass bar + **`+` attach** (wire to image upload #35), send.
- **Top strip** = a slim model/identity line (we have one assistant, so a static "ผู้ช่วย AI · T4 Labs").

**Translate to our tokens/pillars (not OWUI's flat look):** hairline rails + `+` marks stay; sidebar
items are mono-labelled, hairline-divided (the "ledger"); date-group headers are mono UPPERCASE tint
bands; ink primary buttons; single orange accent rationed (New-Chat dot, active item, send). Glass on
the composer + the (optional) settings modal only.

**Skip (OWUI product features not relevant to a showcase assistant):** model selector/add-model,
Folders, Notes/Calendar/Archived, Audio/Connections/Personalization settings, voice mode, per-message
👍/👎/read-aloud. Keep the *layout language*, drop the product surface.

**Scope note:** the sidebar + client-side multi-conversation history is a real feature (storage model
+ a `<ChatSidebar>` + new-chat/switch/delete) — larger than a CSS pass. Recommend a fresh issue/PRD.
