import type { CardRef } from './marker-parser';

export interface ChatInput {
  message: string;
  language: 'th' | 'en';
  sessionId?: string;
  /** Set when the visitor is chatting from a project's detail page (§5.4). */
  projectSlug?: string;
  /** Inline images (sanitized `data:image/*;base64` URLs) for the vision model
   * (#42). Not persisted to the conversation log — only the text is. */
  images?: string[];
}

/** The SSE event stream the chat endpoint emits. */
export type ChatEvent =
  | { type: 'session'; sessionId: string }
  | { type: 'reasoning'; text: string }
  | { type: 'token'; text: string }
  | { type: 'card'; card: CardRef }
  | { type: 'done'; latencyMs: number; reasoningMs?: number }
  | { type: 'error'; message: string; fallbackText: string };
