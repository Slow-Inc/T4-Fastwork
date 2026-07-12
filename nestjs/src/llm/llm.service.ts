import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Thin adapter over any OpenAI-compatible chat endpoint (here: the 9arm gateway).
 * Kept behind this interface so the provider can be swapped/fallen back to
 * without touching callers. Streams raw text deltas; marker parsing and RAG
 * live elsewhere.
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client = new OpenAI({
    apiKey: process.env.CUSTOM_OPENAI_API_KEY,
    baseURL: process.env.CUSTOM_OPENAI_API_BASE,
  });
  private readonly model = process.env.CUSTOM_OPENAI_MODEL ?? 'qwen3.6-35b-a3b';

  /** Streams assistant text deltas for the given conversation. */
  async *streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}
