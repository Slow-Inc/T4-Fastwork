import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { LlmService } from '../llm/llm.service';
import {
  RETRIEVAL_SERVICE,
  type RetrievalService,
} from '../rag/retrieval.service';
import { StreamMarkerParser, type CardRef } from './marker-parser';
import { buildSystemPrompt, type RetrievedItem } from './system-prompt';
import { buildChatMessages } from './build-messages';
import { ConversationLogService } from './conversation-log.service';
import type { ChatEvent, ChatInput } from './chat.types';

const MODEL = process.env.CUSTOM_OPENAI_MODEL ?? 'qwen3.6-35b-a3b';

/**
 * Orchestrates a chat turn: retrieve context → build the system prompt →
 * stream the LLM → parse markers into card events → wrap failures in a
 * graceful fallback → log the turn. Yields a typed event stream the transport
 * maps to SSE.
 */
@Injectable()
export class ChatService {
  constructor(
    private readonly llm: LlmService,
    @Inject(RETRIEVAL_SERVICE) private readonly retrieval: RetrievalService,
    private readonly log: ConversationLogService,
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

    // Prior turns so the assistant can follow up on context (#15). Tolerant:
    // returns [] without a DB, so a chat turn never depends on it.
    let history: Awaited<ReturnType<ConversationLogService['getRecentHistory']>> = [];
    if (input.sessionId) {
      history = await this.log.getRecentHistory(input.sessionId);
    }

    const parser = new StreamMarkerParser();
    let assistantText = '';
    const cards: CardRef[] = [];
    const absorb = function* (
      this: ChatService,
      events: ReturnType<StreamMarkerParser['push']>,
    ): Generator<ChatEvent> {
      for (const ev of events) {
        if (ev.type === 'text') {
          assistantText += ev.value;
          yield { type: 'token', text: ev.value };
        } else {
          cards.push(ev.card);
          yield { type: 'card', card: ev.card };
        }
      }
    }.bind(this);

    try {
      const stream = this.llm.streamChat(
        buildChatMessages(
          buildSystemPrompt({ language: input.language, retrieved }),
          history,
          input.message,
        ),
      );
      for await (const delta of stream) yield* absorb(parser.push(delta));
      yield* absorb(parser.flush());

      const latencyMs = Math.round(performance.now() - start);
      await this.log.logTurn({
        sessionId,
        language: input.language,
        userMessage: input.message,
        assistantText,
        cards,
        model: MODEL,
        latencyMs,
      });
      yield { type: 'done', latencyMs };
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
}
