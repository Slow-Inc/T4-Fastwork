---
tags:
  - frontend
  - chat
  - testing
description: The T4 chat SSE card payload is emitted directly, then forwarded unchanged to InlineCard.
source: Validated during Wave 1 T1.2 implementation
---

# Frontend SSE Card Contract

The Nest chat controller emits a `card` SSE event whose `data` is the card object itself:
`{ kind, id/slug, title?, description? }`. The Next chat client forwards that object directly to
`InlineCard`; there is no extra `{ card: ... }` wrapper on the wire.

## Prevention rule

When extending card fields, update the backend `ChatEvent`/controller, the frontend `CardData`,
and a browser test using the direct payload shape in the same change. A nested fixture can render
an empty card while the real endpoint remains correctly shaped.

## Evidence

- Source path: `nestjs/src/chat/chat.controller.ts` sends `send('card', ev.card)`.
- Source path: `nextjs/components/chat/chat-client.tsx` casts `ev.data` directly to `CardData`.
- Wave 1 verification: the direct-payload Playwright card test passed after a nested-payload fixture
  was corrected; backend unit coverage also verified title/description enrichment.
