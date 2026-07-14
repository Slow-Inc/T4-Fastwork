import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

/** A multimodal content part — text or an inline image (OpenAI vision format). */
export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  /** A plain string, or multimodal parts when the turn carries images (#42). */
  content: string | ContentPart[];
}

/**
 * A tagged stream delta: `reasoning` = the model's chain-of-thought
 * (`delta.reasoning_content`, streamed first), `content` = the answer
 * (`delta.content`). The chat layer routes these to the thinking box vs the
 * answer bubble.
 */
export interface LlmDelta {
  kind: 'reasoning' | 'content';
  value: string;
}

/**
 * Map one OpenAI-compatible stream chunk to a tagged delta, or null for
 * empty/role-only/finish chunks. `reasoning_content` is not in the SDK types
 * (a DeepSeek/Qwen extension), so it is read defensively.
 */
export function chunkToDelta(chunk: unknown): LlmDelta | null {
  const delta = (chunk as { choices?: { delta?: Record<string, unknown> }[] })
    ?.choices?.[0]?.delta;
  const reasoning = delta?.reasoning_content;
  if (typeof reasoning === 'string' && reasoning.length > 0) {
    return { kind: 'reasoning', value: reasoning };
  }
  const content = delta?.content;
  if (typeof content === 'string' && content.length > 0) {
    return { kind: 'content', value: content };
  }
  return null;
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
  private client?: OpenAI;
  private readonly model = process.env.CUSTOM_OPENAI_MODEL ?? 'qwen3.6-35b-a3b';

  // Lazy: the OpenAI SDK throws if the key is absent, so build the client on
  // first use (not at construction) — module boot must not depend on the key.
  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: process.env.CUSTOM_OPENAI_API_KEY,
        baseURL: process.env.CUSTOM_OPENAI_API_BASE,
      });
    }
    return this.client;
  }

  /**
   * Streams tagged deltas (reasoning then content) for the given conversation.
   * Reasoning deltas carry the model's chain-of-thought; content deltas carry
   * the answer.
   */
  async *streamChat(messages: ChatMessage[]): AsyncGenerator<LlmDelta> {
    const stream = await this.getClient().chat.completions.create({
      model: this.model,
      // Our ChatMessage is a simplified union; only user turns carry array
      // (multimodal) content. The SDK's per-role param types are stricter, so
      // cast at this boundary.
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunkToDelta(chunk);
      if (delta) yield delta;
    }
  }

  /** Non-streaming completion — for one-shot extraction calls (e.g. scope summary). */
  async complete(messages: ChatMessage[]): Promise<string> {
    const res = await this.getClient().chat.completions.create({
      model: this.model,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      stream: false,
    });
    return res.choices[0]?.message?.content ?? '';
  }
}
