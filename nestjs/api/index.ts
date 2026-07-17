/**
 * Vercel Node serverless entry for the Nest.js backend (ADR 0001, prereq #17).
 * A single catch-all function boots the Nest app once per warm instance over its
 * Express adapter and forwards every request to it; `vercel.json` routes all
 * paths here. Mind SSE `maxDuration` for the chat stream (set per Vercel plan).
 *
 * Local dev still uses `src/main.ts` (`bun run start`); this file is only the
 * serverless handler.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { parseAllowedOrigins } from '../src/cors-origins';

type ExpressLike = (req: IncomingMessage, res: ServerResponse) => void;

let cached: ExpressLike | null = null;

async function bootstrapServer(): Promise<ExpressLike> {
  if (cached) return cached;
  const app = await NestFactory.create(AppModule, { rawBody: true });
  // Same multi-origin CORS as src/main.ts — THIS is the handler Vercel runs in
  // prod (main.ts only runs for local `bun run start`), so the allow-list must
  // live here too or a comma-separated FRONTEND_ORIGIN is treated as one origin.
  app.enableCors({
    origin: parseAllowedOrigins(process.env.FRONTEND_ORIGIN),
    credentials: true,
  });
  await app.init();
  cached = app.getHttpAdapter().getInstance() as ExpressLike;
  return cached;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const server = await bootstrapServer();
  server(req, res);
}
