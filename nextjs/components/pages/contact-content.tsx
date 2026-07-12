'use client';

import { usePathname } from 'next/navigation';
import { Breadcrumb } from '@/components/site/breadcrumb';
import { ContactForm } from '@/app/contact/contact-form';
import { useLocale } from '@/i18n/locale-context';
import { trackCtaClick } from '@/app/actions/track-cta';

const FASTWORK_URL = 'https://fastwork.co';

export function ContactContent() {
  const { locale } = useLocale();
  const en = locale === 'en';
  const t = (th: string, e: string) => (en ? e : th);
  const pathname = usePathname();

  return (
    <section className="section section-page">
      <Breadcrumb items={[{ label: t('หน้าแรก', 'Home'), href: '/' }, { label: t('ติดต่อเรา', 'Contact') }]} />
      <div className="page-head rv">
        <div className="t-idx">Contact</div>
        <h1>{t('คุยโจทย์กับเรา', 'Let’s talk about your project')}</h1>
        <p className="page-lead">
          {t(
            'เล่าโจทย์มาได้เลย เราประเมินขอบเขตและราคาให้ฟรี — หรือจ้างงานตรงผ่าน Fastwork ที่คุ้มครองการชำระเงินทั้งสองฝ่าย',
            'Tell us your goal and we’ll scope and quote it for free — or hire us directly on Fastwork with buyer protection for both sides.',
          )}
        </p>
      </div>

      <div className="contact-grid">
        <ContactForm />

        <aside className="contact-aside rv">
          <div className="contact-card">
            <h3>{t('จ้างผ่าน Fastwork', 'Hire via Fastwork')}</h3>
            <p>
              {t(
                'ชำระเงินปลอดภัยผ่านระบบ Fastwork เงินปล่อยเมื่องานเป็นไปตามที่ตกลง',
                'Secure payment through Fastwork — funds released when work meets the agreement.',
              )}
            </p>
            <a
              href={FASTWORK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              onClick={() => void trackCtaClick(pathname, 'contact-fastwork')}
            >
              {t('เปิด Fastwork ↗', 'Open Fastwork ↗')}
            </a>
          </div>
          <div className="contact-card">
            <h3>{t('อยากประเมินเร็ว?', 'Want a quick estimate?')}</h3>
            <p>
              {t(
                'คุยกับผู้ช่วย AI เพื่อดูเคสงานที่ใกล้เคียงและงบเบื้องต้นทันที',
                'Chat with the AI for similar cases and a ballpark budget instantly.',
              )}
            </p>
            <a href="/chat" className="btn ghost">
              {t('คุยกับ AI', 'Talk to AI')}
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}
