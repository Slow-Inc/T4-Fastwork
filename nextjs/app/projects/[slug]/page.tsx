import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { FloatingChatProvider } from '@/components/site/floating-chat-context';
import { RevealObserver } from '@/components/site/reveal-observer';
import { ProjectDetailContent } from '@/components/pages/project-detail-content';
import { projects } from '@/content/catalog';
import { getProjectBySlug } from '@/lib/projects-repo';
import { getRepoDetail } from '@/lib/github';
import { team } from '@/content/site';
import { pageAlternates } from '@/lib/seo';

/** Team roster for contributor classification (login → /team slug). */
const roster = team.map((m) => ({ slug: m.slug, githubUrl: m.githubUrl }));

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

  // Live GitHub overlay when the project is repo-backed; null → static only.
  const detail = p.github
    ? await getRepoDetail(p.github.owner, p.github.repo)
    : null;

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
      <FloatingChatProvider>
        <div className="wrap">
          <ProjectDetailContent project={p} detail={detail} roster={roster} />
          <SiteFooter />
        </div>
        <ChatButton />
      </FloatingChatProvider>
      <RevealObserver />
    </>
  );
}
