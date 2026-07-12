import type { ChatMessage } from '../llm/llm.service';

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Assemble the LLM message list for a turn (fixes the "no multi-turn memory"
 * bug, #15): system prompt, then the most recent conversation history, then the
 * new user message. History is capped to control token cost / latency.
 */
export function buildChatMessages(
  systemPrompt: string,
  history: HistoryMessage[],
  userMessage: string,
  maxHistory = 10,
): ChatMessage[] {
  const recent = history
    .filter((m) => m.content && m.content.trim().length > 0)
    .slice(-maxHistory);
  return [
    { role: 'system', content: systemPrompt },
    ...recent,
    { role: 'user', content: userMessage },
  ];
}
