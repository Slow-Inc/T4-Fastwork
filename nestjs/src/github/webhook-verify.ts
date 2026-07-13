/**
 * GitHub webhook signature verification (ADR 0003, spec P3 — security boundary).
 *
 * GitHub signs each delivery with HMAC-SHA256 over the RAW request body and
 * sends it as `X-Hub-Signature-256: sha256=<hex>`. Verify BEFORE parsing or
 * acting on the payload. The comparison is constant-time (`timingSafeEqual`)
 * and length-guarded so it can never throw on a malformed signature.
 *
 * Callers MUST pass the raw body bytes/string exactly as received — parsing then
 * re-serializing the JSON changes the bytes and breaks the signature.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyGithubSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
  secret: string,
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;

  const expected = Buffer.from(
    'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex'),
  );
  const received = Buffer.from(signatureHeader);

  // timingSafeEqual throws on unequal lengths — guard first, still constant-time.
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

/**
 * Constant-time string compare for shared-secret checks (e.g. the refresh
 * endpoint's `x-refresh-secret` header). Length-guarded; empty/missing → false.
 */
export function constantTimeEqual(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
