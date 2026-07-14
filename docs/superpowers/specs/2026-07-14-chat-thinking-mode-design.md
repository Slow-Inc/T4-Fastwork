# Chat thinking-mode display (Open WebUI style) + leading-blank-line fix

**Date**: 2026-07-14
**Status**: Draft (design approved in chat; pending spec review)
**Scope**: `nestjs/src/llm/` + `nestjs/src/chat/` (surface reasoning, trim leading blank) · `nextjs/` chat client (thinking box)
**Tracker**: to be filed as a GitHub issue before the PR.

## Problem

1. The LLM gateway (9arm, `qwen3.6-35b-a3b`) streams its chain-of-thought in a
   separate OpenAI-compatible field `delta.reasoning_content`, *before* the answer
   in `delta.content`. `LlmService.streamChat` (`llm.service.ts:41`) reads **only**
   `delta.content`, so the reasoning is silently dropped — users never see the
   model think, unlike Open WebUI.
2. **Confirmed bug**: after reasoning ends, the `content` stream literally begins
   with `"content":"\n\n"` (verified against the live gateway). The current code
   accumulates that verbatim, so every assistant message renders with a **blank
   first line** (screenshot 2026-07-14).

## Goal

- Show the model's thinking in the chat UI **exactly like Open WebUI**: a live
  "กำลังคิด…" box streaming the reasoning, which auto-collapses to a single
  "💭 คิดอยู่ N วิ ▸" line (expandable) once the answer starts; persisted in the
  conversation history (sessionStorage) so re-opening shows the collapsed,
  re-expandable line. No thinking → no box.
- Remove the leading blank line from every assistant message.

## Architecture (seams, TDD each)

### 1. `LlmService.streamChat` — tagged deltas
Change the yield type from `string` to `LlmDelta = { kind: 'reasoning' | 'content'; value: string }`.
Read both `delta.reasoning_content` (→ `kind:'reasoning'`) and `delta.content`
(→ `kind:'content'`). Order is preserved (reasoning first, then content).
- **Seam**: the generator's yield type. Test with a mocked OpenAI stream emitting
  reasoning chunks then content chunks → assert two `kind`s in order.
- Callers of the old `string` generator (`chat.service.ts`) update to read `.kind`.
  `complete()` (non-streaming, scope-summary) is unchanged — it already reads
  `message.content`.

### 2. `ChatService.streamChat` — reasoning events + leading trim
- **Reasoning** deltas → `yield { type: 'reasoning', text }` **directly** (NOT
  through `StreamMarkerParser` — reasoning must not be scanned for `[[card]]`
  markers or logged as answer text).
- **Content** deltas → through `StreamMarkerParser` as today, then a
  **leading-trim gate**: strip leading whitespace/newlines until the first
  non-whitespace character of the answer has been emitted (`contentStarted` flag).
  This fixes the blank first line. Whitespace *within* the answer is untouched.
- Track reasoning timing: stamp `reasoningStartMs` on the first reasoning delta and
  compute `reasoningMs` when the first content delta arrives; include `reasoningMs`
  on the existing `done` event (`{ type:'done', latencyMs, reasoningMs? }`).
- `ConversationLogService.logTurn` is unchanged — reasoning is **not** persisted to
  the DB log (keeps the log small); it lives only in the client session history.
- **Seam**: the `ChatEvent` async generator. Test: a mocked LLM delta sequence
  `[reasoning "a", reasoning "b", content "\n\n", content "Hi", content "!"]` →
  events `[session, reasoning "a", reasoning "b", token "Hi", token "!", done{reasoningMs}]`
  (no leading blank token).

### 3. `chat.types.ts` + `chat.controller.ts`
- `ChatEvent` gains `{ type: 'reasoning'; text: string }` and `done` gains
  optional `reasoningMs`.
- The controller's event→SSE mapping emits `event: reasoning\ndata: {text}` frames
  (same shape as `token`).

### 4. Frontend — accumulate + render
- `sse-parser.ts` is generic (already handles arbitrary event names); the
  accumulation lives in the chat message layer.
- `chat-message.ts` (and/or `chat-client.tsx` reducer): the assistant message gains
  `reasoning: string` and `reasoningMs?: number`; a `reasoning` event appends to
  `reasoning`, `done` stamps `reasoningMs`.
- New `components/chat/thinking-box.tsx`: renders nothing when `reasoning` is empty;
  while streaming (no `reasoningMs` yet) shows an expanded "🧠 กำลังคิด…" box with
  the live reasoning (auto-scroll); once `reasoningMs` is set, collapses to a
  clickable "💭 คิดอยู่ {N} วิ ▸" that toggles open/closed. Rendered above the
  answer text in the assistant bubble.
- `chat-persist.ts`: the persisted message objects already round-trip their fields;
  ensure `reasoning`/`reasoningMs` are included so history shows the collapsed box.

## Testing

- **Backend unit**: `LlmService` tagged deltas (mock stream); `ChatService` reasoning
  events + leading-trim (the `\n\nHi!` → `Hi!` case) + `reasoningMs` on done.
- **Frontend unit**: message reducer accumulates `reasoning`; `ThinkingBox` renders
  the three states (empty→null, streaming→expanded live, done→collapsed toggle).
- **E2E** (`bun run e2e`): send a chat message; assert a thinking box appears and
  then collapses to "คิดอยู่", and the answer's first line is not blank. Covers both
  the floating popup and `/chat` (same `ChatClient`).

## Non-goals

- Persisting reasoning to the Postgres conversation log (client-only, like Open WebUI).
- A user setting to disable thinking display (always on when reasoning is present).
- Changing the model or enabling/disabling the model's thinking mode.

## Risks

- If a future model returns reasoning *interleaved* with content, the ordering
  assumption (all reasoning, then all content) weakens — the UI still works (box
  keeps appending) but the collapse timing keys off the first content token.
- Leading-trim must only trim *before* the first real char; a test pins that
  interior newlines/whitespace are preserved.
