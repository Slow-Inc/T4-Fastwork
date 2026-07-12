import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { Breadcrumb } from '@/components/site/breadcrumb';

export const metadata: Metadata = {
  title: 'แนวทางราคา — T4 Labs',
  description:
    'แนวทางราคาการจ้างทำเว็บไซต์และระบบกับ T4 Labs — แพ็กเกจ MVP / Standard / Enterprise สิ่งที่รวม ระยะเวลา และเงื่อนไขการชำระเงินผ่าน Fastwork',
};

const packages = [
  {
    name: 'MVP',
    tagline: 'สำหรับ startup ที่อยากทดสอบตลาดเร็ว',
    scope: ['Landing / เว็บแอปหน้าหลัก', 'ฟีเจอร์หลัก 1–2 อย่าง', 'Responsive + SEO พื้นฐาน', 'Deploy พร้อมใช้งาน'],
    timeline: '2–4 สัปดาห์',
    featured: false,
  },
  {
    name: 'Standard',
    tagline: 'เว็บแอป/ระบบที่มีหลังบ้านครบ',
    scope: ['ระบบ auth + สิทธิ์หลายระดับ', 'Dashboard + CRUD + รายงาน', 'ระบบ Admin จัดการเนื้อหา', 'Integration พื้นฐาน (LINE/Payment)'],
    timeline: '1–2 เดือน',
    featured: true,
  },
  {
    name: 'Enterprise',
    tagline: 'แพลตฟอร์มสเกลใหญ่ / AI Product',
    scope: ['SaaS multi-tenant / AI + RAG', 'สถาปัตยกรรมสเกลได้', 'Integration ระบบเดิม (ERP/CRM)', 'ดูแล + SLA หลังส่งมอบ'],
    timeline: '2–4 เดือน+',
    featured: false,
  },
];

const included = [
  'ออกแบบ UI/UX ให้เหมาะกับแบรนด์',
  'พัฒนา Full-Stack ด้วยสแตกสมัยใหม่',
  'Responsive ทุกอุปกรณ์ + SEO พื้นฐาน',
  'ส่งมอบโค้ดทั้งหมด (คุณเป็นเจ้าของ)',
  'ทดสอบและแก้ไขตามรอบที่ตกลง',
  'บริการดูแลหลังส่งมอบตามข้อตกลง',
];
const excluded = [
  'ค่าโดเมนและ hosting รายปี',
  'ค่า API/บริการภายนอก (LLM, SMS, Payment fee)',
  'เนื้อหา/ภาพลิขสิทธิ์ (ถ้าลูกค้าไม่จัดหา)',
  'ฟีเจอร์นอกขอบเขตที่ตกลงไว้',
];

export default function PricingGuidePage() {
  return (
    <>
      <SiteNav />
      <div className="wrap">
        <section className="section section-page">
          <Breadcrumb items={[{ label: 'หน้าแรก', href: '/' }, { label: 'แนวทางราคา' }]} />
          <div className="page-head rv">
            <div className="t-idx">Pricing</div>
            <h1>แนวทางราคา</h1>
            <p className="page-lead">
              ราคาจริงขึ้นกับขอบเขตงานและฟีเจอร์ — ด้านล่างคือกรอบแพ็กเกจไว้ใช้เทียบ
              ก่อนคุยรายละเอียด บอกงบหรือความต้องการมา เราประเมินให้ฟรี
            </p>
          </div>

          <div className="pkg-grid rv">
            {packages.map((p) => (
              <div key={p.name} className={`pkg-card${p.featured ? ' pkg-featured' : ''}`}>
                {p.featured && <span className="badge badge-accent">นิยมที่สุด</span>}
                <h3 className="pkg-name">{p.name}</h3>
                <p className="pkg-tag">{p.tagline}</p>
                <ul className="pkg-scope">
                  {p.scope.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <div className="pkg-timeline t-meta">ระยะเวลา ~ {p.timeline}</div>
              </div>
            ))}
          </div>

          <div className="incl-grid rv">
            <div className="incl-col">
              <h2>สิ่งที่รวมในราคา</h2>
              <ul className="incl-list incl-yes">
                {included.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
            <div className="incl-col">
              <h2>สิ่งที่ไม่รวม</h2>
              <ul className="incl-list incl-no">
                {excluded.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pricing-terms rv">
            <p>
              <b>การชำระเงิน:</b> ผ่าน Fastwork 100% — ระบบคุ้มครองทั้งสองฝ่าย
              เงินปล่อยเมื่องานเป็นไปตามที่ตกลง · <b>กรรมสิทธิ์:</b> เว็บและโค้ด
              เป็นของลูกค้าเมื่อส่งมอบ · <b>รอบแก้ไข:</b> ระบุชัดเจนตั้งแต่เสนอราคา
            </p>
          </div>

          <div className="faq-cta rv">
            <p>อยากได้ตัวเลขที่แม่นขึ้น?</p>
            <Link href="/chat" className="btn">ประเมินงบกับ AI →</Link>
          </div>
        </section>
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
