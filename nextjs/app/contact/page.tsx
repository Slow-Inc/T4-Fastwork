import type { Metadata } from 'next';
import { pageAlternates } from '@/lib/seo';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { ContactContent } from '@/components/pages/contact-content';

export const metadata: Metadata = {
  title: 'ติดต่อเรา — T4 Labs',
  description:
    'ติดต่อ T4 Labs เพื่อปรึกษาโจทย์และประเมินราคา — ส่งข้อความถึงทีม หรือจ้างงานผ่าน Fastwork ที่คุ้มครองการชำระเงินทั้งสองฝ่าย',
  alternates: pageAlternates('/contact'),
};

export default function ContactPage() {
  return (
    <>
      <SiteNav />
      <div className="wrap">
        <ContactContent />
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
