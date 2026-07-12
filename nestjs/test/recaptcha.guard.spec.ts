import { describe, it, expect, afterEach } from 'bun:test';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { RecaptchaGuard } from '../src/security/recaptcha.guard';
import type { RecaptchaVerifier } from '../src/security/recaptcha.verifier';

function ctx(body: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ body }) }),
  } as unknown as ExecutionContext;
}

const verifier = (score: number, success = true): RecaptchaVerifier => ({
  verify: async () => ({ success, score }),
});

const ORIGINAL = process.env.RECAPTCHA_SECRET;
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.RECAPTCHA_SECRET;
  else process.env.RECAPTCHA_SECRET = ORIGINAL;
});

describe('RecaptchaGuard', () => {
  it('allows any request when no secret is configured (feature off)', async () => {
    delete process.env.RECAPTCHA_SECRET;
    const guard = new RecaptchaGuard(verifier(0)); // verifier never consulted
    expect(await guard.canActivate(ctx({}))).toBe(true);
  });

  it('allows when the token verifies above the score threshold', async () => {
    process.env.RECAPTCHA_SECRET = 's';
    const guard = new RecaptchaGuard(verifier(0.9));
    expect(
      await guard.canActivate(ctx({ recaptchaToken: 'tok' })),
    ).toBe(true);
  });

  it('rejects when the score is below the threshold', async () => {
    process.env.RECAPTCHA_SECRET = 's';
    const guard = new RecaptchaGuard(verifier(0.1));
    await expect(
      guard.canActivate(ctx({ recaptchaToken: 'tok' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when the token is missing', async () => {
    process.env.RECAPTCHA_SECRET = 's';
    const guard = new RecaptchaGuard(verifier(0.9));
    await expect(guard.canActivate(ctx({}))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
