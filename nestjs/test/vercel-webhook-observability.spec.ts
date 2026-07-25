/**
 * A rejected delivery must be visible from OUR logs, not only Vercel's (#218 AC4).
 *
 * The controller already warns on a parsed-but-unmappable deploy, but a signature that fails
 * verification returned 401 silently — so the one misconfiguration the setup script can produce (a
 * `VERCEL_WEBHOOK_SECRET` that does not match the webhook's) looked exactly like no deliveries at
 * all. "Nothing is arriving" and "everything is arriving and being rejected" are different problems.
 */
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Logger } from '@nestjs/common';
import { VercelWebhookController } from '../src/github/vercel-webhook.controller';

function fakeReqRes(raw: string) {
  const statusCodes: number[] = [];
  const req = { rawBody: Buffer.from(raw) } as never;
  const res = {
    status(code: number) {
      statusCodes.push(code);
      return this;
    },
    json() {
      return this;
    },
  } as never;
  return { req, res, statusCodes };
}

function controller(): VercelWebhookController {
  return new VercelWebhookController(
    undefined as never,
    undefined as never,
    undefined as never,
    { resolve: async () => null },
    undefined as never,
  );
}

describe('a rejected Vercel delivery is visible in our logs (#218)', () => {
  const prev = process.env.VERCEL_WEBHOOK_SECRET;
  const warns: string[] = [];
  let restore: (() => void) | null = null;

  beforeEach(() => {
    process.env.VERCEL_WEBHOOK_SECRET = 'topsecret';
    warns.length = 0;
    // Patching the prototype rather than `Logger.overrideLogger` on purpose: the override is
    // process-wide and would silence or capture logs for every other spec sharing this run,
    // depending on file order. This capture is restored in `afterEach`.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const original = Logger.prototype.warn;
    Logger.prototype.warn = function patched(message: unknown, ...rest) {
      warns.push(String(message));
      return original.call(this, message, ...rest);
    };
    restore = () => {
      Logger.prototype.warn = original;
    };
  });

  afterEach(() => {
    restore?.();
    if (prev === undefined) delete process.env.VERCEL_WEBHOOK_SECRET;
    else process.env.VERCEL_WEBHOOK_SECRET = prev;
  });

  it('warns when a delivery fails signature verification', async () => {
    const { req, res, statusCodes } = fakeReqRes(
      '{"type":"deployment.succeeded"}',
    );

    await controller().handle(req, res, 'not-the-right-signature');

    expect(statusCodes).toEqual([401]);
    expect(warns.join('\n')).toMatch(/signature/i);
  });

  it('never puts the secret or the presented signature in the log', async () => {
    // The log line is the thing an operator pastes into an issue. A secret that reaches it is a
    // secret that leaks, and echoing the presented signature would hand an attacker an oracle.
    const { req, res } = fakeReqRes('{"type":"deployment.succeeded"}');

    await controller().handle(req, res, 'deadbeefsignature');

    const logged = warns.join('\n');
    expect(logged).not.toContain('topsecret');
    expect(logged).not.toContain('deadbeefsignature');
  });
});
