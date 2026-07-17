import type { CardData } from "@/components/chat/inline-card";

/** An assistant message is an ordered list of text runs and inline cards. */
export type MessagePart =
  { type: "text"; text: string } | { type: "card"; card: CardData };

/** A chat turn. Lives here (the message model) rather than in the client
 * component so pure modules (persistence, the stream reducer) can share it. */
export interface Message {
  role: "user" | "assistant";
  parts: MessagePart[];
  /** The model's chain-of-thought (Open WebUI style), accumulated from reasoning
   * events; shown in a collapsible box above the answer. */
  reasoning?: string;
  /** Thinking duration (reasoning start → first answer token), ms. */
  reasoningMs?: number;
  /** Inline images (data URLs) attached to a user turn (#42). Rendered in the
   * turn; NOT persisted (stripped before storage to keep it lean). */
  images?: string[];
}

/** Append a streamed token, merging into the trailing text run if there is one. */
export function appendToken(parts: MessagePart[], text: string): MessagePart[] {
  const last = parts[parts.length - 1];
  if (last && last.type === "text") {
    return [...parts.slice(0, -1), { type: "text", text: last.text + text }];
  }
  return [...parts, { type: "text", text }];
}

/** Append an inline card at the current stream position. */
export function appendCard(
  parts: MessagePart[],
  card: CardData,
): MessagePart[] {
  return [...parts, { type: "card", card }];
}

/** "N วิ" — whole-second thinking duration for the collapsed thinking summary. */
export function formatThinkingDuration(ms: number): string {
  return `${Math.round(ms / 1000)} วิ`;
}

/** Collapsed thinking-summary label: "คิดอยู่ N วิ", or a generic prompt if the
 * duration is unknown. */
export function thinkingSummaryLabel(durationMs?: number): string {
  return durationMs !== undefined
    ? `คิดอยู่ ${formatThinkingDuration(durationMs)}`
    : "ดูการคิดของ AI";
}

/** The thinking-box header label. While the model is thinking, "กำลังคิด…"
 * (shown next to a spinner, collapsed by default like Open WebUI); once done, the
 * "คิดอยู่ N วิ" summary. */
export function thinkingBoxLabel(live: boolean, durationMs?: number): string {
  return live ? "กำลังคิด…" : thinkingSummaryLabel(durationMs);
}

export type ChatStatus = "idle" | "thinking" | "streaming" | "error";

/**
 * Whether the composer may send now. You can keep typing while the assistant is
 * responding (`busy`), but sending is blocked until it finishes; otherwise there
 * must be non-empty text or at least one attachment.
 */
export function canSendMessage(
  busy: boolean,
  text: string,
  attachmentCount: number,
): boolean {
  if (busy) return false;
  return text.trim().length > 0 || attachmentCount > 0;
}

/** A blinking typing cursor only belongs on the assistant's in-progress reply. */
export function shouldShowTypingCursor(
  role: "user" | "assistant",
  isLastMessage: boolean,
  status: ChatStatus,
): boolean {
  return role === "assistant" && isLastMessage && status === "streaming";
}
