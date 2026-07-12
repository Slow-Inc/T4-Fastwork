import type { CardRef } from './marker-parser';

export interface ChatInput {
  message: string;
  language: 'th' | 'en';
  sessionId?: string;
}

/** The SSE event stream the chat endpoint emits. */
export type ChatEvent =
  | { type: 'session'; sessionId: string }
  | { type: 'token'; text: string }
  | { type: 'card'; card: CardRef }
  | { type: 'done'; latencyMs: number }
  | { type: 'error'; message: string; fallbackText: string };
