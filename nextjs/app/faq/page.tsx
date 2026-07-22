import type { Metadata } from 'next';
import { pageAlternates } from '@/lib/seo';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { FaqContent } from '@/components/pages/faq-content';
import { getFaqs } from '@/lib/faqs-repo';

export const metadata: Metadata = {
  title: 'คำถามที่พบบ่อย (FAQ) — T4 Labs',
  description:
    'คำถามที่พบบ่อยเกี่ยวกับการจ้างทำเว็บไซต์ SaaS, Web App และ AI Product กับ T4 Labs — ระยะเวลา ราคา การชำระเงิน เทคโนโลยี และบริการหลังส่งมอบ',
  alternates: pageAlternates('/faq'),
};

export default async function FaqPage() {
  const faqs = await getFaqs();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <>
      <SiteNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="wrap">
        <FaqContent faqs={faqs} />
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
