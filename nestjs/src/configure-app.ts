import type { NestExpressApplication } from '@nestjs/platform-express';
import { parseAllowedOrigins } from './cors-origins';

/**
 * JSON body limit. Inline chat images (#42) are base64 data URLs, far over the
 * 100kb Express default; the per-image guard bounds count + size downstream.
 */
export const JSON_BODY_LIMIT = '12mb';

/**
 * Shared runtime config applied to BOTH entrypoints — `src/main.ts` (local
 * `bun run start`) and `api/index.ts` (the Vercel serverless handler that actually
 * runs in prod). Keeping it in one place is deliberate: prod runs `api/index.ts`,
 * NOT `main.ts`, so any bootstrap config that lived only in `main.ts` silently
 * broke in prod — the CORS allow-list (#94/#96) and the 12mb body limit (#103,
 * image chat 413) were both this exact drift. Call this right after
 * `NestFactory.create(...)` in each entrypoint.
 */
export function configureApp(app: NestExpressApplication): void {
  // Multi-origin CORS: FRONTEND_ORIGIN is a comma-separated allow-list so the
  // frontend domain(s) can call the API (chat SSE etc.).
  app.enableCors({
    origin: parseAllowedOrigins(process.env.FRONTEND_ORIGIN),
    credentials: true,
  });
  // Raise the JSON limit for inline base64 images (#42) — without this the
  // serverless handler falls back to the 100kb default and 413s image chats.
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
}
