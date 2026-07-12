import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { ProjectDetailContent } from '@/components/pages/project-detail-content';
import { projects } from '@/content/catalog';
import { getProjectBySlug } from '@/lib/projects-repo';
import { pageAlternates } from '@/lib/seo';

type Params = Promise<{ slug: string }>;

// Prerender the curated catalog; CMS-added slugs render on demand (dynamicParams).
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProjectBySlug(slug);
  if (!p) return { title: 'ไม่พบผลงาน — T4 Labs' };
  return {
    title: `${p.title} — ผลงาน T4 Labs`,
    description: p.description,
    openGraph: {
      title: p.title,
      description: p.description,
      type: 'article',
    },
    alternates: pageAlternates(`/projects/${slug}`),
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const p = await getProjectBySlug(slug);
  if (!p) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.title,
    description: p.description,
    keywords: [...p.tags, ...p.technologies].join(', '),
    ...(p.liveUrl ? { url: p.liveUrl } : {}),
    creator: { '@type': 'Organization', name: 'T4 Labs' },
  };

  return (
    <>
      <SiteNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="wrap">
        <ProjectDetailContent project={p} />
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
