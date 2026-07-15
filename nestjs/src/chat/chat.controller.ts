import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { TurnstileGuard } from '../security/turnstile.guard';
import { ChatService } from './chat.service';
import { ScopeSummaryService } from './scope-summary.service';
import { sanitizeImages } from './image-guard';
import type { ScopeSummary } from './scope-summary.types';

class ChatRequestDto {
  message!: string;
  language?: 'th' | 'en';
  sessionId?: string;
  turnstileToken?: string;
  /** Set when the visitor is chatting from a project's detail page (§5.4). */
  projectSlug?: string;
  /** Inline images for the vision model (#42); sanitized before use. */
  images?: string[];
}

class ScopeSummaryRequestDto {
  sessionId!: string;
}

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly scopeSummary: ScopeSummaryService,
  ) {}

  /**
   * SSE streaming chat. POST (fetch-based SSE) rather than GET/EventSource so
   * the body carries the message. Emits: session, token, card, done, error.
   * Rate-limited globally; Turnstile-gated when TURNSTILE_SECRET is set.
   */
  @UseGuards(TurnstileGuard)
  @Post('stream')
  async stream(@Body() body: ChatRequestDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const send = (event: string, data: unknown) =>
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    try {
      for await (const ev of this.chat.streamChat({
        message: body.message,
        language: body.language === 'en' ? 'en' : 'th',
        sessionId: body.sessionId,
        projectSlug: body.projectSlug,
        images: sanitizeImages(body.images),
      })) {
        switch (ev.type) {
          case 'session':
            send('session', { sessionId: ev.sessionId });
            break;
          case 'reasoning':
            send('reasoning', { text: ev.text });
            break;
          case 'token':
            send('token', { text: ev.text });
            break;
          case 'card':
            send('card', ev.card);
            break;
          case 'done':
            send('done', {
              latencyMs: ev.latencyMs,
              reasoningMs: ev.reasoningMs,
            });
            break;
          case 'error':
            send('error', {
              message: ev.message,
              fallbackText: ev.fallbackText,
            });
            break;
        }
      }
    } finally {
      res.end();
    }
  }

  /** Extracts a project-scope summary from the session's history (§5.4 / FR-08). */
  @Post('scope-summary')
  async scopeSummaryFor(
    @Body() body: ScopeSummaryRequestDto,
  ): Promise<ScopeSummary> {
    if (!body.sessionId) throw new BadRequestException('sessionId is required');
    return this.scopeSummary.summarize(body.sessionId);
  }
}
