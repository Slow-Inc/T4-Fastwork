import type { MetadataRoute } from 'next';
import { getAllProjects } from '@/lib/projects-repo';
import { getPosts } from '@/lib/blog-repo';
import { solutionSlugs } from '@/content/solution-detail';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://t4labs.dev';

/**
 * The URL shape of the sitemap, separated from the two database reads so it can be tested without
 * one (#277). Before this split, `app/site-url.test.ts` was the only test in either workspace that
 * needed a reachable Supabase: with no env it threw, and with a dummy URL it waited on ECONNREFUSED
 * until the 5s timeout. The property that test exists to pin — every entry carries the fallback
 * SITE_URL — is a property of this function and needs no I/O at all.
 */
export function sitemapEntries(
  projectSlugs: string[],
  postSlugs: string[],
): MetadataRoute.Sitemap {
  const staticPaths = [
    '',
    '/projects',
    '/chat',
    '/about',
    '/faq',
    '/pricing-guide',
    '/contact',
    '/blog',
  ];

  const staticEntries = staticPaths.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: 'monthly' as const,
    priority: path === '' ? 1 : 0.7,
  }));

  const projectEntries = projectSlugs.map((slug) => ({
    url: `${SITE_URL}/projects/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const solutionEntries = solutionSlugs.map((slug) => ({
    url: `${SITE_URL}/recommend/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const blogEntries = postSlugs.map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticEntries, ...projectEntries, ...solutionEntries, ...blogEntries];
}

/** Next.js entry point: the two reads, then the pure shaping above. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([getAllProjects(), getPosts()]);
  return sitemapEntries(
    projects.map((p) => p.slug),
    posts.map((p) => p.slug),
  );
}
