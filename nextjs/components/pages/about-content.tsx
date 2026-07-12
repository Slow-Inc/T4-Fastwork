'use client';

import Link from 'next/link';
import { Breadcrumb } from '@/components/site/breadcrumb';
import { useLocale } from '@/i18n/locale-context';

const whatWeDo = [
  { title: 'SaaS Platform', th: 'multi-tenant, subscription, admin & analytics ที่สเกลรองรับผู้ใช้จำนวนมาก', en: 'multi-tenant, subscription, admin & analytics that scale to many users' },
  { title: 'Web Application', th: 'ระบบซับซ้อน — marketplace, booking, dashboard, internal tools พร้อม auth + realtime', en: 'complex systems — marketplace, booking, dashboards, internal tools with auth + realtime' },
  { title: 'AI Product', th: 'chatbot, RAG, OCR/Document AI และ automation ที่ผสานเข้ากับ product จริง', en: 'chatbot, RAG, OCR/Document AI and automation woven into a real product' },
  { title: 'Internal System', th: 'ระบบหลังบ้าน, integration, เชื่อมต่อ ERP/CRM/LINE และ automation', en: 'back-office systems, integrations with ERP/CRM/LINE and automation' },
];

const whyUs = [
  { th: ['ผลงานจริง', 'ทุกเคสคืองานที่เราสร้างและดูแลจริง ไม่ใช่ template'], en: ['Real work', 'Every case is something we actually built and maintain — not a template'] },
  { th: ['คุยกับ dev ตรง', 'คุยกับนักพัฒนาตัวจริง ไม่ผ่านคนกลาง เข้าใจโจทย์เทคนิคทันที'], en: ['Talk to devs directly', 'Speak with the real engineers — no middlemen, technical intent understood instantly'] },
  { th: ['เน้นผลลัพธ์ธุรกิจ', 'ออกแบบระบบเพื่อเป้าหมายธุรกิจ ไม่ใช่แค่ให้เสร็จ'], en: ['Outcome-focused', 'We design systems for business goals, not just to ship'] },
  { th: ['ดูแลหลังส่งมอบ', 'ส่งมอบแล้วยังดูแลต่อ ปรับแก้และให้คำปรึกษาตามที่ตกลง'], en: ['Post-launch care', 'We keep supporting after delivery — tweaks and advice as agreed'] },
];

const steps = [
  { n: '01', th: ['บอกความต้องการ', 'เล่าโจทย์ผ่าน AI หรือ Fastwork'], en: ['Tell us the goal', 'Share it via the AI or Fastwork'] },
  { n: '02', th: ['ประเมินขอบเขต + ราคา', 'สรุป scope และเสนอราคาชัดเจน'], en: ['Scope + quote', 'Clear scope and a firm price'] },
  { n: '03', th: ['ออกแบบและพัฒนา', 'ออกแบบระบบ พัฒนา และรีวิวเป็นรอบ'], en: ['Design & build', 'Architect, build and review in rounds'] },
  { n: '04', th: ['ส่งมอบ ทดสอบ ดูแลต่อ', 'ส่งมอบพร้อมโค้ด และดูแลหลังใช้งาน'], en: ['Ship, test, support', 'Delivered with code, supported after launch'] },
];

// The real engineering SDLC the team runs on every project — distinct from
// `steps` above (the client-facing journey), this is the internal process
// (Requirement §4.6), included for CTO/technical-founder credibility.
const sdlc = [
  {
    n: '01',
    th: [
      'วิเคราะห์ความต้องการ (Requirement Analysis)',
      'เก็บ requirement จริงจากลูกค้า แปลงเป็น user story และประเมินขอบเขต/ความเสี่ยงทางเทคนิคก่อนเริ่มงาน',
    ],
    en: [
      'Requirement Analysis',
      'Gather real requirements, turn them into user stories, and assess scope and technical risk before work begins',
    ],
  },
  {
    n: '02',
    th: [
      'ออกแบบระบบ (Design & Architecture)',
      'ออกแบบสถาปัตยกรรม data model และ UI/UX ให้ชัดเจนก่อนลงมือเขียนโค้ดจริง',
    ],
    en: [
      'Design & Architecture',
      'Design the system architecture, data model, and UI/UX clearly before writing real code',
    ],
  },
  {
    n: '03',
    th: [
      'พัฒนา (Development)',
      'พัฒนาแบบ Agile เป็นรอบสั้น ๆ เขียนเทสต์ก่อนโค้ด (TDD) สำหรับ logic ที่สำคัญ และรีวิวโค้ดทุก pull request',
    ],
    en: [
      'Development',
      'Build in short Agile iterations, test-first (TDD) for critical logic, and code review on every pull request',
    ],
  },
  {
    n: '04',
    th: [
      'ทดสอบ (Testing & QA)',
      'Unit test และ end-to-end test (Playwright) ก่อน merge ทุกครั้ง พร้อม UAT ร่วมกับลูกค้าก่อนส่งมอบ',
    ],
    en: [
      'Testing & QA',
      'Unit and end-to-end tests (Playwright) before every merge, plus UAT with the client before delivery',
    ],
  },
  {
    n: '05',
    th: [
      'ส่งขึ้นระบบจริง (Deployment)',
      'Deploy ผ่าน CI/CD ขึ้น staging ก่อนแล้วค่อยขึ้น production พร้อมแผน rollback หากเกิดปัญหา',
    ],
    en: [
      'Deployment',
      'Deploy via CI/CD to staging first, then production, with a rollback plan ready if something goes wrong',
    ],
  },
  {
    n: '06',
    th: [
      'ดูแลหลังส่งมอบ (Maintenance & Support)',
      'ติดตามการทำงานของระบบจริง แก้ไขบั๊ก และเพิ่มฟีเจอร์ตาม feedback ตามที่ตกลงกันไว้',
    ],
    en: [
      'Maintenance & Support',
      'Monitor the live system, fix bugs, and add features based on feedback as agreed',
    ],
  },
];

export function AboutBlocks() {
  const { locale } = useLocale();
  const en = locale === 'en';
  const t = (th: string, e: string) => (en ? e : th);

  return (
        <section className="section section-page">
          <Breadcrumb items={[{ label: t('หน้าแรก', 'Home'), href: '/' }, { label: t('เกี่ยวกับเรา', 'About') }]} />

          <div className="page-head rv">
            <div className="t-idx">About</div>
            <h1>{t('ทีม Full-Stack + AI ที่สร้างของจริง', 'A Full-Stack + AI team that ships real products')}</h1>
            <p className="page-lead">
              {t(
                'T4 Labs คือพาร์ตเนอร์ด้านวิศวกรรมซอฟต์แวร์ — ประสบการณ์รวมกว่า 20 ปี ส่งมอบกว่า 500 โปรเจกต์ ตั้งแต่ Landing Page ไปจนถึงแพลตฟอร์มที่ซับซ้อนสูง',
                'T4 Labs is a software engineering partner — 20+ years combined, 500+ projects shipped, from landing pages to high-complexity platforms.',
              )}
            </p>
          </div>

          <div className="about-block rv">
            <h2>{t('สิ่งที่เราทำ', 'What we do')}</h2>
            <div className="about-grid">
              {whatWeDo.map((w) => (
                <div key={w.title} className="about-card">
                  <h3>{w.title}</h3>
                  <p>{en ? w.en : w.th}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="about-block rv">
            <h2>{t('ทำไมต้องเลือกเรา', 'Why choose us')}</h2>
            <div className="about-grid">
              {whyUs.map((w) => {
                const [title, desc] = en ? w.en : w.th;
                return (
                  <div key={title} className="about-card">
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="about-block rv">
            <h2>{t('ขั้นตอนการทำงาน', 'How we work')}</h2>
            <ol className="about-steps">
              {steps.map((s) => {
                const [title, desc] = en ? s.en : s.th;
                return (
                  <li key={s.n}>
                    <span className="t-idx">{s.n}</span>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="about-block rv">
            <h2>{t('SDLC ที่เราใช้จริง', 'The SDLC we actually run')}</h2>
            <p className="t-body about-sdlc-lead">
              {t(
                'ไม่ใช่แค่ทฤษฎี — นี่คือขั้นตอนวิศวกรรมซอฟต์แวร์ (Software Development Life Cycle) ที่ทีมใช้จริงในทุกโปรเจกต์',
                'Not just theory — this is the real Software Development Life Cycle the team runs on every project.',
              )}
            </p>
            <ol className="about-steps">
              {sdlc.map((s) => {
                const [title, desc] = en ? s.en : s.th;
                return (
                  <li key={s.n}>
                    <span className="t-idx">{s.n}</span>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
  );
}

export function AboutCta() {
  const { locale } = useLocale();
  const en = locale === 'en';
  const t = (th: string, e: string) => (en ? e : th);
  return (
    <section className="section">
      <div className="about-cta rv">
        <h2>{t('พร้อมเริ่มโปรเจกต์แล้วหรือยัง?', 'Ready to start a project?')}</h2>
        <div className="detail-cta" style={{ border: 'none', marginTop: 24, paddingTop: 0 }}>
          <Link href="/chat" className="btn">{t('คุยกับ AI', 'Talk to AI')}</Link>
          <Link href="/contact" className="btn ghost">{t('ติดต่อจ้างงาน', 'Hire us')}</Link>
          <Link href="/faq" className="btn ghost">{t('ดู FAQ', 'View FAQ')}</Link>
        </div>
      </div>
    </section>
  );
}
