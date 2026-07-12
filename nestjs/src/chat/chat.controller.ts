import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { RecaptchaGuard } from '../security/recaptcha.guard';
import { ChatService } from './chat.service';

class ChatRequestDto {
  message!: string;
  language?: 'th' | 'en';
  sessionId?: string;
  recaptchaToken?: string;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  /**
   * SSE streaming chat. POST (fetch-based SSE) rather than GET/EventSource so
   * the body carries the message. Emits: session, token, card, done, error.
   * Rate-limited globally; reCAPTCHA-gated when RECAPTCHA_SECRET is set.
   */
  @UseGuards(RecaptchaGuard)
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
      })) {
        switch (ev.type) {
          case 'session':
            send('session', { sessionId: ev.sessionId });
            break;
          case 'token':
            send('token', { text: ev.text });
            break;
          case 'card':
            send('card', ev.card);
            break;
          case 'done':
            send('done', { latencyMs: ev.latencyMs });
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
}
