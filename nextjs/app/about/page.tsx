import type { Metadata } from 'next';
import { pageAlternates } from '@/lib/seo';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { Certificates } from '@/components/site/certificates';
import { TeamSection } from '@/components/site/team-section';
import { AboutBlocks, AboutCta } from '@/components/pages/about-content';

export const metadata: Metadata = {
  title: 'เกี่ยวกับเรา — T4 Labs',
  description:
    'T4 Labs — ทีม Full-Stack + AI ที่รับสร้าง SaaS, Web Application และ AI Product ประสบการณ์ 7 ปี ทำมาแล้ว 21+ โปรเจกต์',
  alternates: pageAlternates('/about'),
};

export default function AboutPage() {
  return (
    <>
      <SiteNav />
      <div className="wrap">
        <AboutBlocks />
        <TeamSection />
        <Certificates />
        <AboutCta />
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
