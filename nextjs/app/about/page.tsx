import type { Metadata } from 'next';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { Certificates } from '@/components/site/certificates';
import { AboutBlocks, AboutCta } from '@/components/pages/about-content';

export const metadata: Metadata = {
  title: 'เกี่ยวกับเรา — T4 Labs',
  description:
    'T4 Labs — ทีม Full-Stack + AI ที่รับสร้าง SaaS, Web Application และ AI Product ประสบการณ์กว่า 20 ปี ส่งมอบกว่า 500 โปรเจกต์',
};

export default function AboutPage() {
  return (
    <>
      <SiteNav />
      <div className="wrap">
        <AboutBlocks />
        <Certificates />
        <AboutCta />
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
