/**
 * Every project writer must release the cached DATA, not just the rendered paths (#239).
 *
 * #238 put the unfiltered project list in the durable Data Cache under one tag. `revalidatePath`
 * alone does not touch that entry — the route re-renders and reads the same cached list back, so a
 * synced repo stays invisible until the 600 s ceiling expires. These tests pin the pairing: the
 * paths AND the tag, in both writer contexts, because the two contexts are allowed different Next
 * APIs (`updateTag` is Server-Action-only) and that difference is where a writer half-does it.
 */
import { beforeEach, describe, expect, it, mock } from 'bun:test';

const calls = {
  paths: [] as [string, string | undefined][],
  updated: [] as string[],
  revalidated: [] as [string, unknown][],
};

// `unstable_cache` is passed through rather than stubbed out: this mock is process-wide in bun, and
// `projects-repo` (imported by other specs) would break on an undefined export.
mock.module('next/cache', () => ({
  revalidatePath: (path: string, type?: string) => calls.paths.push([path, type]),
  updateTag: (tag: string) => calls.updated.push(tag),
  revalidateTag: (tag: string, profile: unknown) => calls.revalidated.push([tag, profile]),
  unstable_cache: <T>(fn: T) => fn,
}));

const { PROJECTS_CACHE_TAG } = await import('./revalidate');
const { revalidateProjectFromAction, revalidateProjectFromRouteHandler } = await import(
  './revalidate-project'
);

beforeEach(() => {
  calls.paths = [];
  calls.updated = [];
  calls.revalidated = [];
});

describe('revalidateProjectFromAction — the admin CMS writer', () => {
  it('revalidates the paths the actions revalidated before the helper existed', () => {
    // Behaviour-preserving on purpose: #239 adds the tag bust, it does not redraw the path set.
    revalidateProjectFromAction();
    expect(calls.paths.map((c) => c[0])).toEqual(['/admin/projects', '/projects']);
  });

  it('busts the cache tag with updateTag so the admin sees their own write', () => {
    // read-your-own-writes: `updateTag` expires the entry immediately, so the redirect back to the
    // dashboard re-reads fresh. `revalidateTag(tag, 'max')` would serve the admin the pre-write
    // list once more, which reads as "my edit did not save".
    revalidateProjectFromAction();
    expect(calls.updated).toEqual([PROJECTS_CACHE_TAG]);
    expect(calls.revalidated).toEqual([]);
  });

  it('appends caller-supplied paths without dropping the tag', () => {
    // The member-selection toggle also refreshes /admin/members (#180).
    revalidateProjectFromAction([{ path: '/admin/members' }]);
    expect(calls.paths.map((c) => c[0])).toEqual([
      '/admin/projects',
      '/projects',
      '/admin/members',
    ]);
    expect(calls.updated).toEqual([PROJECTS_CACHE_TAG]);
  });
});

describe('revalidateProjectFromRouteHandler — the cron / webhook / CI writer', () => {
  it('targets the one detail page when given a slug, and busts the tag', () => {
    const targets = revalidateProjectFromRouteHandler('demo-repo');
    expect(targets.map((t) => t.path)).toEqual(['/projects', '/projects/demo-repo']);
    expect(calls.paths.map((c) => c[0])).toEqual(['/projects', '/projects/demo-repo']);
    expect(calls.revalidated.map((c) => c[0])).toEqual([PROJECTS_CACHE_TAG]);
  });

  it('falls back to the dynamic detail template when no slug is given', () => {
    const targets = revalidateProjectFromRouteHandler(null);
    expect(targets.map((t) => t.path)).toEqual(['/projects', '/projects/[slug]']);
    expect(calls.revalidated.map((c) => c[0])).toEqual([PROJECTS_CACHE_TAG]);
  });

  it('passes a cache-life profile — the single-argument form is deprecated in Next 16', () => {
    // `revalidateTag(tag)` no longer type-checks (`profile` is required in the 16.2.10 .d.ts) and
    // the docs mark the one-arg behaviour for removal. The profile is what makes this a supported
    // call, so assert it explicitly rather than leaving it to a future type error.
    revalidateProjectFromRouteHandler('demo-repo');
    expect(calls.revalidated[0][1]).toBe('max');
  });

  it('does NOT use updateTag — it is Server-Action-only and throws in a Route Handler', () => {
    revalidateProjectFromRouteHandler('demo-repo');
    expect(calls.updated).toEqual([]);
  });
});
