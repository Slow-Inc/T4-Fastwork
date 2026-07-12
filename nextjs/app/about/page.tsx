import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { Breadcrumb } from '@/components/site/breadcrumb';
import { Certificates } from '@/components/site/certificates';

export const metadata: Metadata = {
  title: 'เกี่ยวกับเรา — T4 Labs',
  description:
    'T4 Labs — ทีม Full-Stack + AI ที่รับสร้าง SaaS, Web Application และ AI Product ประสบการณ์กว่า 20 ปี ส่งมอบกว่า 500 โปรเจกต์',
};

const whatWeDo = [
  { title: 'SaaS Platform', desc: 'multi-tenant, subscription, admin & analytics ที่สเกลรองรับผู้ใช้จำนวนมาก' },
  { title: 'Web Application', desc: 'ระบบซับซ้อน — marketplace, booking, dashboard, internal tools พร้อม auth + realtime' },
  { title: 'AI Product', desc: 'chatbot, RAG, OCR/Document AI และ automation ที่ผสานเข้ากับ product จริง' },
  { title: 'Internal System', desc: 'ระบบหลังบ้าน, integration, เชื่อมต่อ ERP/CRM/LINE และ automation' },
];

const whyUs = [
  { title: 'ผลงานจริง', desc: 'ทุกเคสคืองานที่เราสร้างและดูแลจริง ไม่ใช่ template' },
  { title: 'คุยกับ dev ตรง', desc: 'คุยกับนักพัฒนาตัวจริง ไม่ผ่านคนกลาง เข้าใจโจทย์เทคนิคทันที' },
  { title: 'เน้นผลลัพธ์ธุรกิจ', desc: 'ออกแบบระบบเพื่อเป้าหมายธุรกิจ ไม่ใช่แค่ให้เสร็จ' },
  { title: 'ดูแลหลังส่งมอบ', desc: 'ส่งมอบแล้วยังดูแลต่อ ปรับแก้และให้คำปรึกษาตามที่ตกลง' },
];

const steps = [
  { n: '01', title: 'บอกความต้องการ', desc: 'เล่าโจทย์ผ่าน AI หรือ Fastwork' },
  { n: '02', title: 'ประเมินขอบเขต + ราคา', desc: 'สรุป scope และเสนอราคาชัดเจน' },
  { n: '03', title: 'ออกแบบและพัฒนา', desc: 'ออกแบบระบบ พัฒนา และรีวิวเป็นรอบ' },
  { n: '04', title: 'ส่งมอบ ทดสอบ ดูแลต่อ', desc: 'ส่งมอบพร้อมโค้ด และดูแลหลังใช้งาน' },
];

export default function AboutPage() {
  return (
    <>
      <SiteNav />
      <div className="wrap">
        <section className="section section-page">
          <Breadcrumb items={[{ label: 'หน้าแรก', href: '/' }, { label: 'เกี่ยวกับเรา' }]} />

          {/* Block 1 — headline */}
          <div className="page-head rv">
            <div className="t-idx">About</div>
            <h1>ทีม Full-Stack + AI ที่สร้างของจริง</h1>
            <p className="page-lead">
              T4 Labs คือพาร์ตเนอร์ด้านวิศวกรรมซอฟต์แวร์ — ประสบการณ์รวมกว่า 20 ปี
              ส่งมอบกว่า 500 โปรเจกต์ ตั้งแต่ Landing Page ไปจนถึงแพลตฟอร์มที่ซับซ้อนสูง
            </p>
          </div>

          {/* Block 2 — what we do */}
          <div className="about-block rv">
            <h2>สิ่งที่เราทำ</h2>
            <div className="about-grid">
              {whatWeDo.map((w) => (
                <div key={w.title} className="about-card">
                  <h3>{w.title}</h3>
                  <p>{w.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Block 3 — why choose us */}
          <div className="about-block rv">
            <h2>ทำไมต้องเลือกเรา</h2>
            <div className="about-grid">
              {whyUs.map((w) => (
                <div key={w.title} className="about-card">
                  <h3>{w.title}</h3>
                  <p>{w.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Block 4 — how we work */}
          <div className="about-block rv">
            <h2>ขั้นตอนการทำงาน</h2>
            <ol className="about-steps">
              {steps.map((s) => (
                <li key={s.n}>
                  <span className="t-idx">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Block 5 — certificates */}
        <Certificates />

        <section className="section">
          <div className="about-cta rv">
            <h2>พร้อมเริ่มโปรเจกต์แล้วหรือยัง?</h2>
            <div className="detail-cta" style={{ border: 'none', marginTop: 24, paddingTop: 0 }}>
              <Link href="/chat" className="btn">คุยกับ AI</Link>
              <Link href="/contact" className="btn ghost">ติดต่อจ้างงาน</Link>
              <Link href="/faq" className="btn ghost">ดู FAQ</Link>
            </div>
          </div>
        </section>
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
