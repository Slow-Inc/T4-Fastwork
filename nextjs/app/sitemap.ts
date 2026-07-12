import type { MetadataRoute } from 'next';
import { projects } from '@/content/catalog';
import { blogPosts } from '@/content/blog';
import { solutionSlugs } from '@/content/solution-detail';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://t4labs.co';

export default function sitemap(): MetadataRoute.Sitemap {
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

  const projectEntries = projects.map((p) => ({
    url: `${SITE_URL}/projects/${p.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const solutionEntries = solutionSlugs.map((slug) => ({
    url: `${SITE_URL}/recommend/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const blogEntries = blogPosts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticEntries, ...projectEntries, ...solutionEntries, ...blogEntries];
}
