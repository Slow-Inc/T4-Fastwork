import { test, expect, describe, afterEach } from 'bun:test';
import { checkTurnstile, type TurnstileVerify } from './turnstile';

const ORIGINAL = process.env.TURNSTILE_SECRET;
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.TURNSTILE_SECRET;
  else process.env.TURNSTILE_SECRET = ORIGINAL;
});

const verify = (success: boolean): TurnstileVerify => async () => ({ success });

describe('checkTurnstile', () => {
  test('allows any request when no secret is configured (feature off)', async () => {
    delete process.env.TURNSTILE_SECRET;
    const r = await checkTurnstile({ token: null, verify: verify(false) });
    expect(r.ok).toBe(true);
  });

  test('rejects when a secret is configured but the token is missing', async () => {
    process.env.TURNSTILE_SECRET = 's';
    const r = await checkTurnstile({ token: null, verify: verify(true) });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('missing-token');
  });

  test('allows when the token verifies successfully', async () => {
    process.env.TURNSTILE_SECRET = 's';
    const r = await checkTurnstile({ token: 'tok', verify: verify(true) });
    expect(r.ok).toBe(true);
  });

  test('rejects when Cloudflare reports success=false', async () => {
    process.env.TURNSTILE_SECRET = 's';
    const r = await checkTurnstile({ token: 'tok', verify: verify(false) });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('failed');
  });
});
