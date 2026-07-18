import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

async function bootstrap() {
  // `rawBody` preserves the exact bytes for GitHub webhook HMAC verification.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Shared config (CORS allow-list + 12mb JSON limit for inline images). The
  // SAME call runs in api/index.ts so prod (which runs that, not this) matches.
  configureApp(app);

  // Backend runs on 4100 (Next.js frontend uses 3000; 4000 is taken by another
  // local project on this machine). Override with the PORT env var.
  await app.listen(process.env.PORT ?? 4100);
}
void bootstrap();
