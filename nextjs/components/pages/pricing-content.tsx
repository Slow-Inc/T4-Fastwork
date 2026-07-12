'use client';

import Link from 'next/link';
import { Breadcrumb } from '@/components/site/breadcrumb';
import { useLocale } from '@/i18n/locale-context';

const packages = [
  {
    name: 'MVP',
    taglineTh: 'สำหรับ startup ที่อยากทดสอบตลาดเร็ว',
    taglineEn: 'For startups validating the market fast',
    scopeTh: ['Landing / เว็บแอปหน้าหลัก', 'ฟีเจอร์หลัก 1–2 อย่าง', 'Responsive + SEO พื้นฐาน', 'Deploy พร้อมใช้งาน'],
    scopeEn: ['Landing / core web app', '1–2 core features', 'Responsive + baseline SEO', 'Deployed and live'],
    timelineTh: '2–4 สัปดาห์',
    timelineEn: '2–4 weeks',
    featured: false,
  },
  {
    name: 'Standard',
    taglineTh: 'เว็บแอป/ระบบที่มีหลังบ้านครบ',
    taglineEn: 'A web app/system with a full back office',
    scopeTh: ['ระบบ auth + สิทธิ์หลายระดับ', 'Dashboard + CRUD + รายงาน', 'ระบบ Admin จัดการเนื้อหา', 'Integration พื้นฐาน (LINE/Payment)'],
    scopeEn: ['Auth + multi-role access', 'Dashboard + CRUD + reports', 'Admin to manage content', 'Basic integrations (LINE/Payment)'],
    timelineTh: '1–2 เดือน',
    timelineEn: '1–2 months',
    featured: true,
  },
  {
    name: 'Enterprise',
    taglineTh: 'แพลตฟอร์มสเกลใหญ่ / AI Product',
    taglineEn: 'Large-scale platform / AI product',
    scopeTh: ['SaaS multi-tenant / AI + RAG', 'สถาปัตยกรรมสเกลได้', 'Integration ระบบเดิม (ERP/CRM)', 'ดูแล + SLA หลังส่งมอบ'],
    scopeEn: ['SaaS multi-tenant / AI + RAG', 'Scalable architecture', 'Legacy integration (ERP/CRM)', 'Support + SLA after delivery'],
    timelineTh: '2–4 เดือน+',
    timelineEn: '2–4 months+',
    featured: false,
  },
];

const included = {
  th: [
    'ออกแบบ UI/UX ให้เหมาะกับแบรนด์',
    'พัฒนา Full-Stack ด้วยสแตกสมัยใหม่',
    'Responsive ทุกอุปกรณ์ + SEO พื้นฐาน',
    'ส่งมอบโค้ดทั้งหมด (คุณเป็นเจ้าของ)',
    'ทดสอบและแก้ไขตามรอบที่ตกลง',
    'บริการดูแลหลังส่งมอบตามข้อตกลง',
  ],
  en: [
    'UI/UX design tailored to your brand',
    'Full-stack build on a modern stack',
    'Responsive on every device + baseline SEO',
    'All source code delivered (you own it)',
    'Testing and revisions per the agreement',
    'Post-delivery support as agreed',
  ],
};
const excluded = {
  th: [
    'ค่าโดเมนและ hosting รายปี',
    'ค่า API/บริการภายนอก (LLM, SMS, Payment fee)',
    'เนื้อหา/ภาพลิขสิทธิ์ (ถ้าลูกค้าไม่จัดหา)',
    'ฟีเจอร์นอกขอบเขตที่ตกลงไว้',
  ],
  en: [
    'Annual domain and hosting fees',
    'External API/service costs (LLM, SMS, payment fees)',
    'Licensed content/images (if not provided)',
    'Features outside the agreed scope',
  ],
};

export function PricingContent() {
  const { locale } = useLocale();
  const en = locale === 'en';
  const t = (th: string, e: string) => (en ? e : th);

  return (
    <section className="section section-page">
      <Breadcrumb items={[{ label: t('หน้าแรก', 'Home'), href: '/' }, { label: t('แนวทางราคา', 'Pricing') }]} />
      <div className="page-head rv">
        <div className="t-idx">Pricing</div>
        <h1>{t('แนวทางราคา', 'Pricing guide')}</h1>
        <p className="page-lead">
          {t(
            'ราคาจริงขึ้นกับขอบเขตงานและฟีเจอร์ — ด้านล่างคือกรอบแพ็กเกจไว้ใช้เทียบ ก่อนคุยรายละเอียด บอกงบหรือความต้องการมา เราประเมินให้ฟรี',
            'Real pricing depends on scope and features — below are package frames for comparison. Share a budget or needs and we’ll estimate for free.',
          )}
        </p>
      </div>

      <div className="pkg-grid rv">
        {packages.map((p) => (
          <div key={p.name} className={`pkg-card${p.featured ? ' pkg-featured' : ''}`}>
            {p.featured && <span className="badge badge-accent">{t('นิยมที่สุด', 'Most popular')}</span>}
            <h3 className="pkg-name">{p.name}</h3>
            <p className="pkg-tag">{en ? p.taglineEn : p.taglineTh}</p>
            <ul className="pkg-scope">
              {(en ? p.scopeEn : p.scopeTh).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="pkg-timeline t-meta">
              {t('ระยะเวลา ~ ', 'Timeline ~ ')}
              {en ? p.timelineEn : p.timelineTh}
            </div>
          </div>
        ))}
      </div>

      <div className="incl-grid rv">
        <div className="incl-col">
          <h2>{t('สิ่งที่รวมในราคา', 'What’s included')}</h2>
          <ul className="incl-list incl-yes">
            {(en ? included.en : included.th).map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
        <div className="incl-col">
          <h2>{t('สิ่งที่ไม่รวม', 'What’s not included')}</h2>
          <ul className="incl-list incl-no">
            {(en ? excluded.en : excluded.th).map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="pricing-terms rv">
        <p>
          {en ? (
            <>
              <b>Payment:</b> 100% via Fastwork — escrow protects both sides, funds released
              when work meets the agreement · <b>Ownership:</b> the site and code are yours on
              delivery · <b>Revisions:</b> stated clearly in the quote
            </>
          ) : (
            <>
              <b>การชำระเงิน:</b> ผ่าน Fastwork 100% — ระบบคุ้มครองทั้งสองฝ่าย
              เงินปล่อยเมื่องานเป็นไปตามที่ตกลง · <b>กรรมสิทธิ์:</b> เว็บและโค้ด
              เป็นของลูกค้าเมื่อส่งมอบ · <b>รอบแก้ไข:</b> ระบุชัดเจนตั้งแต่เสนอราคา
            </>
          )}
        </p>
      </div>

      <div className="faq-cta rv">
        <p>{t('อยากได้ตัวเลขที่แม่นขึ้น?', 'Want a sharper number?')}</p>
        <Link href="/chat" className="btn">
          {t('ประเมินงบกับ AI →', 'Estimate with AI →')}
        </Link>
      </div>
    </section>
  );
}
