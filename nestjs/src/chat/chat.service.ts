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
import { ProjectContextService } from './project-context.service';
import type { ProjectContextRecord } from './project-context';
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
    private readonly projectContext: ProjectContextService,
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

    // Deterministic grounding for a project the visitor is already viewing
    // (#5.4) — independent of whether semantic retrieval above surfaced it.
    let activeProject: ProjectContextRecord | undefined;
    if (input.projectSlug) {
      try {
        activeProject =
          (await this.projectContext.getBySlug(input.projectSlug)) ?? undefined;
      } catch {
        activeProject = undefined;
      }
    }

    // Prior turns so the assistant can follow up on context (#15). Tolerant:
    // returns [] without a DB, so a chat turn never depends on it.
    let history: Awaited<
      ReturnType<ConversationLogService['getRecentHistory']>
    > = [];
    if (input.sessionId) {
      history = await this.log.getRecentHistory(input.sessionId);
    }

    const parser = new StreamMarkerParser();
    let assistantText = '';
    const cards: CardRef[] = [];
    // Leading-trim gate: the answer content arrives with leading "\n\n" after the
    // model's reasoning (verified against the gateway) — strip whitespace until
    // the first real character so no message renders with a blank first line.
    let contentStarted = false;
    const absorb = function* (
      this: ChatService,
      events: ReturnType<StreamMarkerParser['push']>,
    ): Generator<ChatEvent> {
      for (const ev of events) {
        if (ev.type === 'text') {
          let value = ev.value;
          if (!contentStarted) {
            value = value.replace(/^\s+/, '');
            if (value === '') continue; // whitespace-only prefix — drop it
            contentStarted = true;
          }
          assistantText += value;
          yield { type: 'token', text: value };
        } else {
          cards.push(ev.card);
          yield { type: 'card', card: ev.card };
        }
      }
    }.bind(this);

    let reasoningStart: number | undefined;
    let reasoningMs: number | undefined;

    try {
      const stream = this.llm.streamChat(
        buildChatMessages(
          buildSystemPrompt({
            language: input.language,
            retrieved,
            activeProject,
          }),
          history,
          input.message,
        ),
      );
      for await (const delta of stream) {
        if (delta.kind === 'reasoning') {
          if (reasoningStart === undefined) reasoningStart = performance.now();
          yield { type: 'reasoning', text: delta.value };
        } else {
          // First answer token ends the thinking phase — stamp its duration.
          if (reasoningStart !== undefined && reasoningMs === undefined) {
            reasoningMs = Math.round(performance.now() - reasoningStart);
          }
          yield* absorb(parser.push(delta.value));
        }
      }
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
      yield { type: 'done', latencyMs, reasoningMs };
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
