import type { Metadata } from 'next';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { Breadcrumb } from '@/components/site/breadcrumb';

export const metadata: Metadata = {
  title: 'พันธมิตร — T4 Labs',
  description: 'พันธมิตรและเทคโนโลยีที่ T4 Labs ทำงานร่วมด้วยในการส่งมอบผลิตภัณฑ์',
};

const partners = [
  'Supabase',
  'Vercel',
  'Cloudflare',
  'NVIDIA',
  'OpenAI',
  'Fastwork',
  'PostgreSQL',
  'Next.js',
];

export default function PartnersPage() {
  return (
    <>
      <SiteNav />
      <div className="wrap">
        <section className="section section-page">
          <Breadcrumb items={[{ label: 'หน้าแรก', href: '/' }, { label: 'พันธมิตร' }]} />
          <div className="page-head rv">
            <div className="t-idx">Partners</div>
            <h1>พันธมิตรและเทคโนโลยี</h1>
            <p className="page-lead">
              เครื่องมือและแพลตฟอร์มที่เราไว้ใจและใช้ส่งมอบงานจริงให้ลูกค้า
            </p>
          </div>
          <div className="partner-grid rv">
            {partners.map((p) => (
              <div key={p} className="partner-cell">
                {p}
              </div>
            ))}
          </div>
        </section>
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
