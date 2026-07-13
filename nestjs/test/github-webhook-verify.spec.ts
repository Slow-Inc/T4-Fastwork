import { describe, it, expect } from 'bun:test';
import { createHmac } from 'node:crypto';
import { verifyGithubSignature } from '../src/github/webhook-verify';

const SECRET = 'shhh-webhook-secret';

function sign(body: string, secret: string): string {
  return 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
}

describe('verifyGithubSignature', () => {
  const body = JSON.stringify({ action: 'push', repo: 'Slow-Inc/x' });

  it('accepts a correct sha256 signature over the raw body', () => {
    expect(verifyGithubSignature(body, sign(body, SECRET), SECRET)).toBe(true);
  });

  it('rejects when the body was tampered with', () => {
    const sig = sign(body, SECRET);
    expect(verifyGithubSignature(body + 'x', sig, SECRET)).toBe(false);
  });

  it('rejects a signature made with the wrong secret', () => {
    expect(verifyGithubSignature(body, sign(body, 'other'), SECRET)).toBe(
      false,
    );
  });

  it('rejects a missing or empty signature header', () => {
    expect(verifyGithubSignature(body, null, SECRET)).toBe(false);
    expect(verifyGithubSignature(body, '', SECRET)).toBe(false);
    expect(verifyGithubSignature(body, undefined, SECRET)).toBe(false);
  });

  it('rejects a malformed header without the sha256= prefix', () => {
    const hex = createHmac('sha256', SECRET).update(body).digest('hex');
    expect(verifyGithubSignature(body, hex, SECRET)).toBe(false);
  });

  it('does not throw on a length-mismatched signature (constant-time guard)', () => {
    expect(verifyGithubSignature(body, 'sha256=deadbeef', SECRET)).toBe(false);
  });
});
