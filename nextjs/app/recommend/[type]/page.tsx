import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { RecommendContent } from '@/components/pages/recommend-content';
import { getSolutionDetail, solutionSlugs } from '@/content/solution-detail';
import { filterProjects, projects } from '@/content/catalog';
import { pageAlternates } from '@/lib/seo';

type Params = Promise<{ type: string }>;

export function generateStaticParams() {
  return solutionSlugs.map((type) => ({ type }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { type } = await params;
  const d = getSolutionDetail(type);
  if (!d) return { title: 'ไม่พบหน้านี้ — T4 Labs' };
  return {
    title: `${d.badge} — T4 Labs`,
    description: d.tagline,
    openGraph: { title: d.headline, description: d.tagline, type: 'website' },
    alternates: pageAlternates(`/recommend/${type}`),
  };
}

export default async function RecommendPage({ params }: { params: Params }) {
  const { type } = await params;
  const detail = getSolutionDetail(type);
  if (!detail) notFound();

  const inCategory = detail.portfolioCategory
    ? filterProjects({ category: detail.portfolioCategory })
    : projects.filter((p) => p.isFeatured);
  const pool = inCategory.length > 0 ? inCategory : projects.filter((p) => p.isFeatured);
  const highlight = pool.slice(0, 3);

  return (
    <>
      <SiteNav />
      <div className="wrap">
        <RecommendContent detail={detail} highlight={highlight} type={type} />
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
