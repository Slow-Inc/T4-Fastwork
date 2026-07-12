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

export type ChatStatus = 'idle' | 'thinking' | 'streaming' | 'error';

/** A blinking typing cursor only belongs on the assistant's in-progress reply. */
export function shouldShowTypingCursor(
  role: 'user' | 'assistant',
  isLastMessage: boolean,
  status: ChatStatus,
): boolean {
  return role === 'assistant' && isLastMessage && status === 'streaming';
}
