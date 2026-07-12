import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { Breadcrumb } from '@/components/site/breadcrumb';
import { FaqAccordion } from '@/components/site/faq-accordion';
import { faqs } from '@/content/faqs';

export const metadata: Metadata = {
  title: 'คำถามที่พบบ่อย (FAQ) — T4 Labs',
  description:
    'คำถามที่พบบ่อยเกี่ยวกับการจ้างทำเว็บไซต์ SaaS, Web App และ AI Product กับ T4 Labs — ระยะเวลา ราคา การชำระเงิน เทคโนโลยี และบริการหลังส่งมอบ',
};

export default function FaqPage() {
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
        <section className="section section-page">
          <Breadcrumb items={[{ label: 'หน้าแรก', href: '/' }, { label: 'FAQ' }]} />
          <div className="page-head rv">
            <div className="t-idx">FAQ</div>
            <h1>คำถามที่พบบ่อย</h1>
            <p className="page-lead">
              รวมคำถามที่ลูกค้าถามบ่อยที่สุด — ถ้าไม่เจอคำตอบที่ต้องการ
              ลองถามผู้ช่วย AI ของเราได้เลย ตอบให้ทันที
            </p>
          </div>

          <FaqAccordion items={faqs} />

          <div className="faq-cta rv">
            <p>ยังไม่เจอคำตอบที่ต้องการ?</p>
            <Link href="/chat" className="btn">
              ไปถาม AI →
            </Link>
          </div>
        </section>
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
