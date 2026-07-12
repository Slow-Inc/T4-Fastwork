/** reCAPTCHA v3 gate for public forms (Requirement §4.1.10 / §5.2 / §9). */
export interface RecaptchaResult {
  success: boolean;
  score: number;
}

export type RecaptchaVerify = (token: string, secret: string) => Promise<RecaptchaResult>;

export interface RecaptchaCheckInput {
  token: string | null | undefined;
  verify: RecaptchaVerify;
  minScore?: number;
}

export interface RecaptchaCheckResult {
  ok: boolean;
  reason?: 'missing-token' | 'low-score';
}

/**
 * Feature-flagged: when `RECAPTCHA_SECRET` is unset the check is a no-op
 * (dev/local), matching the nestjs chat guard's behavior.
 */
export async function checkRecaptcha({
  token,
  verify,
  minScore = 0.5,
}: RecaptchaCheckInput): Promise<RecaptchaCheckResult> {
  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) return { ok: true };

  if (!token) return { ok: false, reason: 'missing-token' };

  const { success, score } = await verify(token, secret);
  if (!success || score < minScore) return { ok: false, reason: 'low-score' };

  return { ok: true };
}

export const verifyRecaptchaWithGoogle: RecaptchaVerify = async (token, secret) => {
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = (await res.json()) as { success?: boolean; score?: number };
  return { success: data.success ?? false, score: data.score ?? 0 };
};
