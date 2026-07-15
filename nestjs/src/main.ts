import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  // `rawBody` preserves the exact bytes for GitHub webhook HMAC verification.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Inline chat images (#42) are base64 data URLs — well over the 100kb express
  // default. Cap generously (the image guard bounds count + per-image size).
  app.useBodyParser('json', { limit: '12mb' });

  // Allow the Next.js frontend to call this API (chat SSE etc.).
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  // Backend runs on 4100 (Next.js frontend uses 3000; 4000 is taken by another
  // local project on this machine). Override with the PORT env var.
  await app.listen(process.env.PORT ?? 4100);
}
void bootstrap();
