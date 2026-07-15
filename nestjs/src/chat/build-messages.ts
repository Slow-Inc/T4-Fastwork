import type { ChatMessage, ContentPart } from '../llm/llm.service';

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Assemble the LLM message list for a turn (fixes the "no multi-turn memory"
 * bug, #15): system prompt, then the most recent conversation history, then the
 * new user message. History is capped to control token cost / latency. When
 * `images` are supplied (#42) the new user message becomes multimodal content
 * (text + one image_url part each) so the vision model can see them.
 */
export function buildChatMessages(
  systemPrompt: string,
  history: HistoryMessage[],
  userMessage: string,
  maxHistory = 10,
  images: string[] = [],
): ChatMessage[] {
  const recent = history
    .filter((m) => m.content && m.content.trim().length > 0)
    .slice(-maxHistory);
  const userContent: string | ContentPart[] =
    images.length > 0
      ? [
          { type: 'text', text: userMessage },
          ...images.map((url): ContentPart => ({
            type: 'image_url',
            image_url: { url },
          })),
        ]
      : userMessage;
  return [
    { role: 'system', content: systemPrompt },
    ...recent,
    { role: 'user', content: userContent },
  ];
}
