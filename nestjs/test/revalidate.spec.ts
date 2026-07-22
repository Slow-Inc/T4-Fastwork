import { describe, it, expect } from 'bun:test';
import {
  postContentRevalidation,
  postProjectRevalidation,
} from '../src/revalidate/revalidate';

function mockFetch() {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fn = (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return Promise.resolve(new Response(null, { status: 200 }));
  };
  return { fn, calls };
}

describe('postProjectRevalidation (#92 backend → frontend revalidate)', () => {
  it('POSTs the frontend /api/revalidate with the shared secret header', async () => {
    const { fn, calls } = mockFetch();
    const ok = await postProjectRevalidation({
      fetchImpl: fn,
      frontendOrigin: 'https://t4labs.dev',
      secret: 's3cr3t',
    });
    expect(ok).toBe(true);
    expect(calls.length).toBe(1);
    expect(calls[0].url).toBe('https://t4labs.dev/api/revalidate');
    expect(calls[0].init?.method).toBe('POST');
    expect(
      (calls[0].init?.headers as Record<string, string>)['x-refresh-secret'],
    ).toBe('s3cr3t');
  });

  it('targets the FIRST origin of a comma-separated FRONTEND_ORIGIN (the primary site)', async () => {
    const { fn, calls } = mockFetch();
    await postProjectRevalidation({
      fetchImpl: fn,
      frontendOrigin:
        'https://t4labs.dev, https://t4labs.co, https://x.vercel.app',
      secret: 's',
    });
    expect(calls[0].url).toBe('https://t4labs.dev/api/revalidate');
  });

  it('is a no-op (no fetch) when the secret is unset — fail-soft', async () => {
    const { fn, calls } = mockFetch();
    const ok = await postProjectRevalidation({
      fetchImpl: fn,
      frontendOrigin: 'https://t4labs.dev',
      secret: undefined,
    });
    expect(ok).toBe(false);
    expect(calls.length).toBe(0);
  });

  it('swallows a fetch failure and returns false (never throws — a miss must not fail the write)', async () => {
    const fn = (() =>
      Promise.reject(new Error('network'))) as unknown as typeof fetch;
    const ok = await postProjectRevalidation({
      fetchImpl: fn,
      frontendOrigin: 'https://t4labs.dev',
      secret: 's',
    });
    expect(ok).toBe(false);
  });
});

describe('postContentRevalidation', () => {
  it('posts the content kind to the frontend allowlist endpoint', async () => {
    const { fn, calls } = mockFetch();
    const ok = await postContentRevalidation(
      { fetchImpl: fn, frontendOrigin: 'https://t4labs.dev', secret: 's' },
      'certificate',
    );
    expect(ok).toBe(true);
    expect(calls[0].url).toBe(
      'https://t4labs.dev/api/revalidate?kind=certificate',
    );
  });
});
