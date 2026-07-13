import { describe, it, expect, afterEach } from 'bun:test';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { TurnstileGuard } from '../src/security/turnstile.guard';
import type { TurnstileVerifier } from '../src/security/turnstile.verifier';

function ctx(body: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ body }) }),
  } as unknown as ExecutionContext;
}

const verifier = (success: boolean): TurnstileVerifier => ({
  verify: async () => ({ success }),
});

const ORIGINAL = process.env.TURNSTILE_SECRET;
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.TURNSTILE_SECRET;
  else process.env.TURNSTILE_SECRET = ORIGINAL;
});

describe('TurnstileGuard', () => {
  it('allows any request when no secret is configured (feature off)', async () => {
    delete process.env.TURNSTILE_SECRET;
    const guard = new TurnstileGuard(verifier(false)); // verifier never consulted
    expect(await guard.canActivate(ctx({}))).toBe(true);
  });

  it('allows when the token verifies successfully', async () => {
    process.env.TURNSTILE_SECRET = 's';
    const guard = new TurnstileGuard(verifier(true));
    expect(await guard.canActivate(ctx({ turnstileToken: 'tok' }))).toBe(true);
  });

  it('rejects when verification fails', async () => {
    process.env.TURNSTILE_SECRET = 's';
    const guard = new TurnstileGuard(verifier(false));
    await expect(
      guard.canActivate(ctx({ turnstileToken: 'tok' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when the token is missing', async () => {
    process.env.TURNSTILE_SECRET = 's';
    const guard = new TurnstileGuard(verifier(true));
    await expect(guard.canActivate(ctx({}))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
