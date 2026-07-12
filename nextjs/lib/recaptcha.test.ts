import { test, expect, describe, afterEach } from 'bun:test';
import { checkRecaptcha, type RecaptchaVerify } from './recaptcha';

const ORIGINAL = process.env.RECAPTCHA_SECRET;
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.RECAPTCHA_SECRET;
  else process.env.RECAPTCHA_SECRET = ORIGINAL;
});

const verify = (score: number, success = true): RecaptchaVerify => async () => ({ success, score });

describe('checkRecaptcha', () => {
  test('allows any request when no secret is configured (feature off)', async () => {
    delete process.env.RECAPTCHA_SECRET;
    const r = await checkRecaptcha({ token: null, verify: verify(0) });
    expect(r.ok).toBe(true);
  });

  test('rejects when a secret is configured but the token is missing', async () => {
    process.env.RECAPTCHA_SECRET = 's';
    const r = await checkRecaptcha({ token: null, verify: verify(0.9) });
    expect(r.ok).toBe(false);
  });

  test('allows when the token verifies above the score threshold', async () => {
    process.env.RECAPTCHA_SECRET = 's';
    const r = await checkRecaptcha({ token: 'tok', verify: verify(0.9) });
    expect(r.ok).toBe(true);
  });

  test('rejects when the score is below the threshold', async () => {
    process.env.RECAPTCHA_SECRET = 's';
    const r = await checkRecaptcha({ token: 'tok', verify: verify(0.1) });
    expect(r.ok).toBe(false);
  });

  test('rejects when Google reports success=false', async () => {
    process.env.RECAPTCHA_SECRET = 's';
    const r = await checkRecaptcha({ token: 'tok', verify: verify(0.9, false) });
    expect(r.ok).toBe(false);
  });
});
