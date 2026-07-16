/**
 * Pure streaming-persistence core for the chat client (#36).
 *
 * The bug: `streamAssistant` used to fold each SSE event into React state
 * (`setMessages`) and rely on a `useEffect` to persist. When the surface switches
 * (popup ↔ /chat) mid-stream the streaming instance unmounts, `setMessages` becomes
 * a no-op, the persist effect stops firing, and tokens streamed after unmount were
 * lost → a blank/partial assistant turn on the other surface.
 *
 * The fix (loop-owned persistence): the streaming loop keeps its own `Message`
 * accumulator and folds each event through `reduceAssistant` (pure), then persists
 * the full array itself — independent of React mount. This module is that pure core
 * so it is unit-tested here (the component wiring stays a thin call site).
 */
import type { CardData } from "@/components/chat/inline-card";
import { appendCard, appendToken, type Message } from "./chat-message";

/** A folded SSE event from the chat stream. `at` on a token is the timestamp used
 * to stamp the thinking duration at the first answer token. */
export type StreamEvent =
  | { kind: "reasoning"; text: string }
  | { kind: "token"; text: string; at: number }
  | { kind: "card"; card: CardData }
  | { kind: "error"; text: string };

/**
 * Fold one stream event into the assistant message (pure — returns a new Message,
 * never mutates the input). Mirrors exactly what the client used to do inline, so
 * the loop can own the accumulator and persist it regardless of mount state.
 *
 * @param reasoningStartedAt when the reasoning phase began (ms); used once, at the
 * first answer token, to stamp `reasoningMs`.
 */
export function reduceAssistant(
  assistant: Message,
  ev: StreamEvent,
  reasoningStartedAt?: number,
): Message {
  switch (ev.kind) {
    case "reasoning":
      return { ...assistant, reasoning: (assistant.reasoning ?? "") + ev.text };
    case "token":
      return {
        ...assistant,
        parts: appendToken(assistant.parts, ev.text),
        reasoningMs:
          assistant.reasoningMs ??
          (reasoningStartedAt !== undefined
            ? ev.at - reasoningStartedAt
            : undefined),
      };
    case "card":
      return { ...assistant, parts: appendCard(assistant.parts, ev.card) };
    case "error":
      return { ...assistant, parts: appendToken(assistant.parts, ev.text) };
  }
}

/** Strip inline base64 images from every turn before persisting (quota) — keep only
 * the text of each turn. Pure. */
export function toPersistable(messages: Message[]): Message[] {
  return messages.map((m) => (m.images ? { ...m, images: undefined } : m));
}
