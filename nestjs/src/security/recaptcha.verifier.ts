import { Injectable } from '@nestjs/common';

export interface RecaptchaResult {
  success: boolean;
  score: number;
}

export interface RecaptchaVerifier {
  verify(token: string): Promise<RecaptchaResult>;
}

export const RECAPTCHA_VERIFIER = Symbol('RECAPTCHA_VERIFIER');

/** Verifies a reCAPTCHA v3 token against Google's siteverify endpoint. */
@Injectable()
export class GoogleRecaptchaVerifier implements RecaptchaVerifier {
  async verify(token: string): Promise<RecaptchaResult> {
    const secret = process.env.RECAPTCHA_SECRET ?? '';
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success?: boolean; score?: number };
    return { success: data.success ?? false, score: data.score ?? 0 };
  }
}
