'use client';

import Link from 'next/link';
import { Breadcrumb } from '@/components/site/breadcrumb';
import { FaqAccordion } from '@/components/site/faq-accordion';
import type { Faq } from '@/content/faqs';
import { useLocale } from '@/i18n/locale-context';

export function FaqContent({ faqs }: { faqs: Faq[] }) {
  const { locale } = useLocale();
  const en = locale === 'en';
  const t = (th: string, e: string) => (en ? e : th);

  return (
    <section className="section section-page">
      <Breadcrumb items={[{ label: t('หน้าแรก', 'Home'), href: '/' }, { label: 'FAQ' }]} />
      <div className="page-head rv">
        <div className="t-idx">FAQ</div>
        <h1>{t('คำถามที่พบบ่อย', 'Frequently asked questions')}</h1>
        <p className="page-lead">
          {t(
            'รวมคำถามที่ลูกค้าถามบ่อยที่สุด — ถ้าไม่เจอคำตอบที่ต้องการ ลองถามผู้ช่วย AI ของเราได้เลย ตอบให้ทันที',
            'The questions clients ask most — if you don’t find your answer, ask our AI assistant for an instant reply.',
          )}
        </p>
      </div>

      <FaqAccordion items={faqs} en={en} />

      <div className="faq-cta rv">
        <p>{t('ยังไม่เจอคำตอบที่ต้องการ?', 'Didn’t find your answer?')}</p>
        <Link href="/chat" className="btn">
          {t('ไปถาม AI →', 'Ask the AI →')}
        </Link>
      </div>
    </section>
  );
}
