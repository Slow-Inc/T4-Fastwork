import type { Metadata } from 'next';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { Breadcrumb } from '@/components/site/breadcrumb';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'ติดต่อเรา — T4 Labs',
  description:
    'ติดต่อ T4 Labs เพื่อปรึกษาโจทย์และประเมินราคา — ส่งข้อความถึงทีม หรือจ้างงานผ่าน Fastwork ที่คุ้มครองการชำระเงินทั้งสองฝ่าย',
};

const FASTWORK_URL = 'https://fastwork.co';

export default function ContactPage() {
  return (
    <>
      <SiteNav />
      <div className="wrap">
        <section className="section section-page">
          <Breadcrumb items={[{ label: 'หน้าแรก', href: '/' }, { label: 'ติดต่อเรา' }]} />
          <div className="page-head rv">
            <div className="t-idx">Contact</div>
            <h1>คุยโจทย์กับเรา</h1>
            <p className="page-lead">
              เล่าโจทย์มาได้เลย เราประเมินขอบเขตและราคาให้ฟรี — หรือจ้างงานตรงผ่าน
              Fastwork ที่คุ้มครองการชำระเงินทั้งสองฝ่าย
            </p>
          </div>

          <div className="contact-grid">
            <ContactForm />

            <aside className="contact-aside rv">
              <div className="contact-card">
                <h3>จ้างผ่าน Fastwork</h3>
                <p>
                  ชำระเงินปลอดภัยผ่านระบบ Fastwork เงินปล่อยเมื่องานเป็นไปตามที่ตกลง
                </p>
                <a
                  href={FASTWORK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                >
                  เปิด Fastwork ↗
                </a>
              </div>
              <div className="contact-card">
                <h3>อยากประเมินเร็ว?</h3>
                <p>คุยกับผู้ช่วย AI เพื่อดูเคสงานที่ใกล้เคียงและงบเบื้องต้นทันที</p>
                <a href="/chat" className="btn ghost">
                  คุยกับ AI
                </a>
              </div>
            </aside>
          </div>
        </section>
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
