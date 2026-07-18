import { describe, it, expect } from 'bun:test';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { configureApp, JSON_BODY_LIMIT } from '../src/configure-app';

// configureApp is the ONE place both entrypoints (src/main.ts local + api/index.ts
// on Vercel) get their runtime config, so prod (which runs api/index.ts) can't
// drift from main.ts — the root cause of both the CORS bug (#94/#96) and the image
// 413 (#103). We pass a structural spy and assert the two calls it must make.
function spyApp() {
  const calls = {
    bodyParser: [] as { type: string; opts: unknown }[],
    cors: [] as unknown[],
  };
  const app = {
    useBodyParser: (type: string, opts: unknown) => {
      calls.bodyParser.push({ type, opts });
      return app;
    },
    enableCors: (opts: unknown) => {
      calls.cors.push(opts);
    },
  };
  return { app: app as unknown as NestExpressApplication, calls };
}

describe('configureApp — shared bootstrap for main.ts + api/index.ts', () => {
  it('raises the JSON body limit to 12mb (inline base64 images, #42)', () => {
    const { app, calls } = spyApp();
    configureApp(app);
    expect(calls.bodyParser).toEqual([
      { type: 'json', opts: { limit: '12mb' } },
    ]);
    expect(JSON_BODY_LIMIT).toBe('12mb');
  });

  it('enables CORS with the parsed multi-origin allow-list', () => {
    process.env.FRONTEND_ORIGIN = 'https://t4labs.dev,https://t4labs.co';
    const { app, calls } = spyApp();
    configureApp(app);
    expect(calls.cors[0]).toEqual({
      origin: ['https://t4labs.dev', 'https://t4labs.co'],
      credentials: true,
    });
  });
});
