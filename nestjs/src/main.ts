import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { parseAllowedOrigins } from './cors-origins';

async function bootstrap() {
  // `rawBody` preserves the exact bytes for GitHub webhook HMAC verification.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Inline chat images (#42) are base64 data URLs — well over the 100kb express
  // default. Cap generously (the image guard bounds count + per-image size).
  app.useBodyParser('json', { limit: '12mb' });

  // Allow the Next.js frontend(s) to call this API (chat SSE etc.). Supports a
  // comma-separated FRONTEND_ORIGIN so multiple domains work (e.g. t4labs.dev +
  // the legacy t4labs.co during a domain migration + the Vercel URL).
  app.enableCors({
    origin: parseAllowedOrigins(process.env.FRONTEND_ORIGIN),
    credentials: true,
  });

  // Backend runs on 4100 (Next.js frontend uses 3000; 4000 is taken by another
  // local project on this machine). Override with the PORT env var.
  await app.listen(process.env.PORT ?? 4100);
}
void bootstrap();
