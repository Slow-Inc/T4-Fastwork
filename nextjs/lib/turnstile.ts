/** Cloudflare Turnstile gate for public forms (Requirement §4.1.10 / §5.2 / §9).
 * Turnstile is pass/fail (no reCAPTCHA-style score). */
export interface TurnstileResult {
  success: boolean;
}

export type TurnstileVerify = (token: string, secret: string) => Promise<TurnstileResult>;

export interface TurnstileCheckInput {
  token: string | null | undefined;
  verify: TurnstileVerify;
}

export interface TurnstileCheckResult {
  ok: boolean;
  reason?: 'missing-token' | 'failed';
}

/**
 * Feature-flagged: when `TURNSTILE_SECRET` is unset the check is a no-op
 * (dev/local), matching the nestjs chat guard's behavior.
 */
export async function checkTurnstile({
  token,
  verify,
}: TurnstileCheckInput): Promise<TurnstileCheckResult> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return { ok: true };

  if (!token) return { ok: false, reason: 'missing-token' };

  const { success } = await verify(token, secret);
  if (!success) return { ok: false, reason: 'failed' };

  return { ok: true };
}

export const verifyWithCloudflare: TurnstileVerify = async (token, secret) => {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = (await res.json()) as { success?: boolean };
  return { success: data.success ?? false };
};
