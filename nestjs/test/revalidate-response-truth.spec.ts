/**
 * A revalidation that the frontend rejected must not report success (#272).
 *
 * `postProjectRevalidation` awaited the fetch and returned `true` without ever binding the response,
 * so 401/404/500 all read as done. The failure that matters is boring and total: rotate
 * `GITHUB_REFRESH_SECRET` in one Vercel project and not the other, and every revalidation 401s
 * forever while the ISR cache silently stops being invalidated. Every call site discards the boolean
 * with `void`, so a wrong boolean is not a wrong branch — it is a broken cache path that looks
 * healthy from every angle. Hence the second half: a real failure has to be findable in the log.
 *
 * New file rather than cases added to `revalidate.spec.ts` because that file carries uncommitted
 * formatting churn, and editing it would mix a reformat into this diff.
 */
import { afterEach, describe, expect, it, spyOn } from 'bun:test';
import { Logger } from '@nestjs/common';
import {
  postContentRevalidation,
  postProjectRevalidation,
} from '../src/revalidate/revalidate';
import { RevalidateService } from '../src/revalidate/revalidate.service';

function fetchReturning(status: number) {
  const calls: string[] = [];
  const fn = (url: string) => {
    calls.push(url);
    return Promise.resolve(new Response(null, { status }));
  };
  return { fn, calls };
}

const DEPS = (fn: (url: string) => Promise<Response>) => ({
  fetchImpl: fn as unknown as typeof fetch,
  frontendOrigin: 'https://t4labs.dev',
  secret: 's3cr3t',
});

describe('revalidation reports what the frontend actually answered (#272)', () => {
  it('returns false when the frontend rejects the secret (401)', async () => {
    const { fn, calls } = fetchReturning(401);
    expect(await postProjectRevalidation(DEPS(fn))).toBe(false);
    // It still attempted the call — the false means "rejected", not "skipped".
    expect(calls).toHaveLength(1);
  });

  it.each([[404], [500], [502]])(
    'returns false for a non-ok status (%i)',
    async (status: number) => {
      const { fn } = fetchReturning(status);
      expect(await postProjectRevalidation(DEPS(fn))).toBe(false);
    },
  );

  it('still returns true on 200', async () => {
    const { fn } = fetchReturning(200);
    expect(await postProjectRevalidation(DEPS(fn))).toBe(true);
  });

  it('applies the same truth to content revalidation', async () => {
    const bad = fetchReturning(401);
    expect(await postContentRevalidation(DEPS(bad.fn), 'faq')).toBe(false);
    const good = fetchReturning(200);
    expect(await postContentRevalidation(DEPS(good.fn), 'faq')).toBe(true);
  });
});

describe('RevalidateService makes a real failure findable (#272)', () => {
  const saved = process.env.GITHUB_REFRESH_SECRET;
  const savedOrigin = process.env.FRONTEND_ORIGIN;
  const savedFetch = globalThis.fetch;

  afterEach(() => {
    if (saved === undefined) delete process.env.GITHUB_REFRESH_SECRET;
    else process.env.GITHUB_REFRESH_SECRET = saved;
    if (savedOrigin === undefined) delete process.env.FRONTEND_ORIGIN;
    else process.env.FRONTEND_ORIGIN = savedOrigin;
    globalThis.fetch = savedFetch;
  });

  it('warns when a configured revalidation is rejected', async () => {
    process.env.GITHUB_REFRESH_SECRET = 's3cr3t';
    process.env.FRONTEND_ORIGIN = 'https://t4labs.dev';
    globalThis.fetch = (() =>
      Promise.resolve(new Response(null, { status: 401 }))) as typeof fetch;
    const warn = spyOn(Logger.prototype, 'warn');

    const ok = await new RevalidateService().revalidateProjects();

    expect(ok).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('stays silent when no secret is configured — that is the documented dev no-op', async () => {
    delete process.env.GITHUB_REFRESH_SECRET;
    const warn = spyOn(Logger.prototype, 'warn');

    const ok = await new RevalidateService().revalidateProjects();

    expect(ok).toBe(false);
    // A local run must not log a warning on every write, or the signal is worthless.
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
