import type { CardData } from '@/components/chat/inline-card';

/** An assistant message is an ordered list of text runs and inline cards. */
export type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'card'; card: CardData };

/** Append a streamed token, merging into the trailing text run if there is one. */
export function appendToken(parts: MessagePart[], text: string): MessagePart[] {
  const last = parts[parts.length - 1];
  if (last && last.type === 'text') {
    return [
      ...parts.slice(0, -1),
      { type: 'text', text: last.text + text },
    ];
  }
  return [...parts, { type: 'text', text }];
}

/** Append an inline card at the current stream position. */
export function appendCard(parts: MessagePart[], card: CardData): MessagePart[] {
  return [...parts, { type: 'card', card }];
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
    : 'ดูการคิดของ AI';
}

/** The thinking-box header label. While the model is thinking, "กำลังคิด…"
 * (shown next to a spinner, collapsed by default like Open WebUI); once done, the
 * "คิดอยู่ N วิ" summary. */
export function thinkingBoxLabel(live: boolean, durationMs?: number): string {
  return live ? 'กำลังคิด…' : thinkingSummaryLabel(durationMs);
}

export type ChatStatus = 'idle' | 'thinking' | 'streaming' | 'error';

/** A blinking typing cursor only belongs on the assistant's in-progress reply. */
export function shouldShowTypingCursor(
  role: 'user' | 'assistant',
  isLastMessage: boolean,
  status: ChatStatus,
): boolean {
  return role === 'assistant' && isLastMessage && status === 'streaming';
}
