import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { LlmService } from '../llm/llm.service';
import {
  RETRIEVAL_SERVICE,
  type RetrievalService,
} from '../rag/retrieval.service';
import { StreamMarkerParser } from './marker-parser';
import { buildSystemPrompt, type RetrievedItem } from './system-prompt';
import type { ChatEvent, ChatInput } from './chat.types';

/**
 * Orchestrates a chat turn: retrieve context → build the system prompt →
 * stream the LLM → parse markers into card events → wrap failures in a
 * graceful fallback. Yields a typed event stream the transport maps to SSE.
 */
@Injectable()
export class ChatService {
  constructor(
    private readonly llm: LlmService,
    @Inject(RETRIEVAL_SERVICE) private readonly retrieval: RetrievalService,
  ) {}

  async *streamChat(input: ChatInput): AsyncGenerator<ChatEvent> {
    const sessionId = input.sessionId ?? randomUUID();
    yield { type: 'session', sessionId };
    const start = performance.now();

    let retrieved: RetrievedItem[] = [];
    try {
      retrieved = await this.retrieval.retrieve(input.message, input.language);
    } catch {
      retrieved = []; // retrieval failure → answer without grounded context
    }

    const parser = new StreamMarkerParser();
    try {
      const stream = this.llm.streamChat([
        {
          role: 'system',
          content: buildSystemPrompt({ language: input.language, retrieved }),
        },
        { role: 'user', content: input.message },
      ]);
      for await (const delta of stream) {
        for (const ev of parser.push(delta)) yield this.toEvent(ev);
      }
      for (const ev of parser.flush()) yield this.toEvent(ev);
      yield { type: 'done', latencyMs: Math.round(performance.now() - start) };
    } catch (e) {
      yield {
        type: 'error',
        message: (e as Error)?.message ?? 'LLM error',
        fallbackText:
          input.language === 'th'
            ? 'ขออภัย ระบบผู้ช่วย AI ไม่พร้อมใช้งานชั่วคราว กรุณาติดต่อทีมงานโดยตรง'
            : 'Sorry, the assistant is temporarily unavailable — please contact us directly.',
      };
    }
  }

  private toEvent(
    ev: ReturnType<StreamMarkerParser['push']>[number],
  ): ChatEvent {
    return ev.type === 'text'
      ? { type: 'token', text: ev.value }
      : { type: 'card', card: ev.card };
  }
}
