import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { TeamMemberContent } from '@/components/pages/team-member-content';
import { team } from '@/content/site';
import { pageAlternates } from '@/lib/seo';

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return team.map((m) => ({ slug: m.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const m = team.find((x) => x.slug === slug);
  if (!m) return { title: 'ไม่พบสมาชิกทีม — T4 Labs' };
  return {
    title: `${m.handle} — ทีม T4 Labs`,
    description: `${m.handle} · ${m.role} — โปรไฟล์ ผลงาน และใบรับรองของทีม T4 Labs`,
    alternates: pageAlternates(`/team/${slug}`),
  };
}

export default async function TeamMemberPage({ params }: { params: Params }) {
  const { slug } = await params;
  const m = team.find((x) => x.slug === slug);
  if (!m) notFound();

  return (
    <>
      <SiteNav />
      <div className="wrap">
        <TeamMemberContent member={m} />
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
