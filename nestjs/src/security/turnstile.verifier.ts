import { Injectable } from '@nestjs/common';

export interface TurnstileResult {
  success: boolean;
}

export interface TurnstileVerifier {
  verify(token: string): Promise<TurnstileResult>;
}

export const TURNSTILE_VERIFIER = Symbol('TURNSTILE_VERIFIER');

/** Verifies a Cloudflare Turnstile token against the siteverify endpoint. */
@Injectable()
export class CloudflareTurnstileVerifier implements TurnstileVerifier {
  async verify(token: string): Promise<TurnstileResult> {
    const secret = process.env.TURNSTILE_SECRET ?? '';
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success?: boolean };
    return { success: data.success ?? false };
  }
}
