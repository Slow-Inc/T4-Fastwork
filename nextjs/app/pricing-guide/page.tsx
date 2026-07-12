import type { Metadata } from 'next';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { PricingContent } from '@/components/pages/pricing-content';

export const metadata: Metadata = {
  title: 'แนวทางราคา — T4 Labs',
  description:
    'แนวทางราคาการจ้างทำเว็บไซต์และระบบกับ T4 Labs — แพ็กเกจ MVP / Standard / Enterprise สิ่งที่รวม ระยะเวลา และเงื่อนไขการชำระเงินผ่าน Fastwork',
};

export default function PricingGuidePage() {
  return (
    <>
      <SiteNav />
      <div className="wrap">
        <PricingContent />
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
