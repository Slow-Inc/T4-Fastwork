import { describe, it, expect, beforeEach } from 'bun:test';

// The public SEO surfaces (sitemap, robots, canonical metadata) read
// NEXT_PUBLIC_SITE_URL, falling back to a hard-coded default when it is
// unset. Prod (Vercel) and local (.env.local) both set the env explicitly,
// so this test pins the *fallback* — the value a fresh checkout / CI without
// the env would emit — to the live custom domain, never the legacy one.
//
// The module-level SITE_URL const is captured at import time, so we delete
// the env var before a fresh dynamic import to exercise the fallback path.
// robots/sitemap are imported nowhere else in the test suite, so no cached
// (env-set) evaluation can leak in.
describe('default site URL (NEXT_PUBLIC_SITE_URL unset)', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it('robots points the sitemap at the live domain', async () => {
    const robots = (await import('./robots')).default;
    expect(robots().sitemap).toBe('https://t4labs.dev/sitemap.xml');
  });

  it('every sitemap entry is under the live domain', async () => {
    // Exercises the pure shaper, not the Next.js entry point: the property under test is the
    // SITE_URL fallback, and the default export awaits two database reads to obtain slugs it then
    // hands to this same function. Calling the wrapper made this the only test in either workspace
    // that needed a reachable Supabase — it threw with no env and timed out with a dummy URL (#277).
    const { sitemapEntries } = await import('./sitemap');
    const urls = sitemapEntries(['a-project'], ['a-post']).map((e) => e.url);

    expect(urls.length).toBeGreaterThan(0);
    // The dynamic entries must be present, or this would pass on the static paths alone while
    // silently proving nothing about the project and blog URLs.
    expect(urls).toContain('https://t4labs.dev/projects/a-project');
    expect(urls).toContain('https://t4labs.dev/blog/a-post');
    for (const url of urls) {
      expect(url.startsWith('https://t4labs.dev')).toBe(true);
    }
  });
});
