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
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';

type ExpressLike = (req: IncomingMessage, res: ServerResponse) => void;

let cached: ExpressLike | null = null;

async function bootstrapServer(): Promise<ExpressLike> {
  if (cached) return cached;
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  // THIS is the handler Vercel runs in prod (main.ts only runs for local
  // `bun run start`), so it needs the exact same config — the shared configureApp
  // applies the CORS allow-list (#94/#96) AND the 12mb JSON limit for inline
  // images (#103): without the latter, image chats 413 at the 100kb default.
  configureApp(app);
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
