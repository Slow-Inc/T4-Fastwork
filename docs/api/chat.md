# Chat API — contract for the frontend

The AI chat assistant is served by the Nest.js backend (`nestjs/`). The frontend
chat UI (floating widget + `/chat` page) consumes this contract; it does **not**
talk to the LLM or database directly.

- Base URL: `http://localhost:4100` in dev (override with `PORT`); set via env in the frontend.
- CORS: the backend allows the frontend origin (`FRONTEND_ORIGIN`, default `http://localhost:3000`).

## `POST /chat/stream` — streaming chat (SSE)

Server-Sent Events over `POST` (not `EventSource`/GET — the body carries the
message). Consume with `fetch` + a `ReadableStream` reader, or a POST-capable SSE
client. `Content-Type: text/event-stream`.

### Request

```jsonc
{
  "message": "อยากได้ระบบ dashboard การเงินสำหรับ startup", // required
  "language": "th",        // "th" (default) | "en"
  "sessionId": "..."        // optional; omit on the first turn, then reuse the one returned
}
```

### Response — SSE event stream

Each frame is `event: <name>` + `data: <json>`. Event sequence:

| `event` | `data` | When |
|---------|--------|------|
| `session` | `{ "sessionId": "uuid" }` | Once, first. Persist and send back as `sessionId` on later turns. |
| `token` | `{ "text": "..." }` | Repeated. Append to the visible message as it streams. Markers are already stripped. |
| `card` | `{ "kind": "project", "slug": "fin-track" }` **or** `{ "kind": "service", "id": "1" }` | Mid-stream, when the assistant references a project/service. Render a card inline at that position; resolve details from your project/service data by `slug`/`id`. |
| `done` | `{ "latencyMs": 16615 }` | Once, last, on success. Close the stream. |
| `error` | `{ "message": "...", "fallbackText": "..." }` | On LLM/backend failure. Show `fallbackText` (localized) + a contact CTA; no `done` follows. |

### Example stream

```
event: session
data: {"sessionId":"0f3a1c0d-438a-4f1f-baae-c4b42bccccaa"}

event: token
data: {"text":"ทีม T4 Labs มีผลงาน "}

event: card
data: {"kind":"project","slug":"fin-track"}

event: token
data: {"text":" FinTrack — แดชบอร์ดจัดการการเงิน..."}

event: card
data: {"kind":"service","id":"1"}

event: done
data: {"latencyMs":16615}
```

### Client notes

- **Cards vs text ordering:** render events in arrival order — a `card` between two
  `token`s belongs at that position in the message.
- **Latency:** first `token` can currently lag several seconds (backend Thinking-Mode
  issue, tracked separately). Show a "กำลังคิด…/thinking…" indicator after `session`
  until the first `token`.
- **Errors:** treat a missing `done` + an `error` event as a failed turn; keep the
  partial text already shown and append the fallback.

## Not yet in this contract

- Auth / rate-limit / reCAPTCHA headers (guardrails, #12) — will add a required
  `recaptchaToken` field and document 429/403 responses.
- Non-streaming `POST /chat` fallback and `GET /chat/:sessionId` history — planned.
- `image` attachment field — pending a multimodal decision.
