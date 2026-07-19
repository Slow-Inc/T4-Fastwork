import type { Metadata } from 'next';
import { Lab3HeroSceneLazy } from '@/components/site/lab3/lab3-hero-scene-lazy';
import { Lab3Fx } from '@/components/site/lab3/lab3-fx';
import {
  Lab3SolutionSelector,
  type Lab3Solution,
} from '@/components/site/lab3/lab3-solution-selector';
import {
  Lab3Schematic,
  type Lab3ProcessStep,
  type Lab3StackNode,
} from '@/components/site/lab3/lab3-schematic';
import { Lab3Services, type Lab3Service } from '@/components/site/lab3/lab3-services';

export const metadata: Metadata = {
  title: 'Lab3 — Layered Immersive Swiss System prototype',
  robots: { index: false, follow: false },
};

const NAV = [
  { label: 'โจทย์', href: '#solutions' },
  { label: 'How we build', href: '#how' },
  { label: 'บริการ', href: '#services' },
  { label: 'ติดต่อ', href: '#contact' },
];

const TRUST = [
  { n: '5', unit: 'ปี', label: 'ประสบการณ์ทีม' },
  { n: '21', unit: '+', label: 'โปรเจกต์ที่ส่งมอบ' },
  { n: '7', unit: '', label: 'ใบรับรองของทีม' },
];

const SOLUTIONS: Lab3Solution[] = [
  {
    type: 'saas',
    title: 'SaaS Platform',
    desc: 'multi-tenant, subscription, dashboard — สเกลรองรับผู้ใช้จำนวนมาก',
    meta: 'MULTI-TENANT · BILLING · ANALYTICS',
    span: 'wide',
  },
  {
    type: 'webapp',
    title: 'Web Application',
    desc: 'ระบบซับซ้อน — marketplace, booking, dashboard, internal tools',
    meta: 'AUTH · REALTIME · WORKFLOW',
    span: 'wide',
  },
  {
    type: 'ai-product',
    title: 'AI Product',
    desc: 'chatbot, RAG, OCR/Document AI, automation ผสานเข้ากับธุรกิจ',
    meta: 'LLM · RAG · PGVECTOR',
    span: 'wide',
  },
  {
    type: 'mvp',
    title: 'MVP for Startup',
    desc: 'สร้างเร็ว เพื่อ launch และระดมทุน',
    meta: 'SHIP FAST',
    span: 'narrow',
  },
  {
    type: 'internal-system',
    title: 'Internal System',
    desc: 'ระบบหลังบ้าน + เชื่อมต่อระบบเดิม',
    meta: 'ERP · CRM · LINE',
    span: 'narrow',
  },
  {
    type: 'other',
    title: 'อื่นๆ / โจทย์เฉพาะ',
    desc: 'ไม่แน่ใจ? เล่าโจทย์ให้ทีมหรือ AI ฟังได้เลย',
    meta: 'CONSULT',
    span: 'narrow',
  },
];

// the real request path this very site runs on — not a generic mockup (§14.18)
const STACK: Lab3StackNode[] = [
  { id: 'client', label: 'CLIENT', tech: 'Next.js', desc: 'App Router · SSG/ISR' },
  { id: 'edge', label: 'EDGE', tech: 'Cloudflare', desc: 'CDN · WAF · cache' },
  { id: 'api', label: 'API', tech: 'Nest.js', desc: 'business logic · SSE' },
  { id: 'data', label: 'DATA', tech: 'Supabase · pgvector', desc: 'Postgres · RLS · embeddings' },
  { id: 'ai', label: 'AI', tech: 'LLM · RAG', desc: 'ตอบโดยอ้างอิงผลงานจริง' },
];

const PROCESS: Lab3ProcessStep[] = [
  { no: '01', title: 'Discovery', desc: 'เข้าใจโจทย์ธุรกิจและ requirement' },
  { no: '02', title: 'Architecture', desc: 'ออกแบบระบบ, data model, ขอบเขต' },
  { no: '03', title: 'Build', desc: 'Agile · TDD · code review ทุก PR' },
  { no: '04', title: 'Ship', desc: 'CI/CD · staging ก่อน production' },
  { no: '05', title: 'Scale', desc: 'monitor, optimize, ดูแลหลังส่งมอบ' },
];

// ordered as a complexity ladder — Landing → full platform (§4.5)
const SERVICES: Lab3Service[] = [
  {
    no: '01',
    title: 'Landing Page / Marketing Site',
    desc: 'เว็บ launch โปรดักต์และแคมเปญ — เร็ว สวย โหลดไว SEO ดี',
    stack: 'Next.js · Tailwind',
    level: 1,
  },
  {
    no: '02',
    title: 'Mobile App',
    desc: 'iOS + Android จาก codebase เดียว',
    stack: 'Flutter · React Native',
    level: 2,
  },
  {
    no: '03',
    title: 'Web Application',
    desc: 'marketplace, booking, dashboard, internal tools — auth + realtime',
    stack: 'Next.js · Nest.js',
    level: 3,
  },
  {
    no: '04',
    title: 'AI Product / Integration',
    desc: 'chatbot, RAG, OCR/Document AI, automation ผสานเข้ากับ product',
    stack: 'LLM · pgvector',
    level: 4,
  },
  {
    no: '05',
    title: 'SaaS Platform',
    desc: 'multi-tenant, subscription/billing, admin & analytics',
    stack: 'Nest.js · Supabase',
    level: 5,
  },
  {
    no: '06',
    title: 'Customise / System Integration',
    desc: 'ระบบตามสั่ง, API, payment gateway, IoT (MQTT), เชื่อมระบบเดิม',
    stack: 'ตามสถาปัตยกรรมที่เหมาะ',
    level: 6,
  },
];

export default function Lab3Page() {
  return (
    <div className="lab3">
      {/* blueprint field — visible in the hero, fading to quiet below (§14.5) */}
      <div className="lab3-field" aria-hidden />

      {/* floating liquid-glass nav (§14.6, §14.10) */}
      <nav className="lab3-nav lab3-glass" aria-label="Lab3">
        <span className="lab3-brand">
          <i aria-hidden />
          T4 Labs
          <em>LAB3 · PROTOTYPE</em>
        </span>
        <div className="lab3-nav-links">
          {NAV.map((n) => (
            <a key={n.href} href={n.href}>
              {n.label}
            </a>
          ))}
        </div>
        <a className="lab3-nav-cta" href="#contact">
          ติดต่อเรา
        </a>
      </nav>

      <main className="lab3-shell">
        {/* ------------------------------------------------ 00 · hero thesis */}
        <section className="lab3-hero">
          <div className="lab3-hero-copy">
            <span className="lab3-coord" data-rv>
              00 — POSITIONING
            </span>
            <h1 className="lab3-h1" data-rv data-rv-d="1">
              สร้างซอฟต์แวร์
              <br />
              ระดับ <em>product</em>
              <br />
              ที่<span className="outline">สเกลได้จริง</span>
            </h1>
            <p className="lab3-lead" data-rv data-rv-d="2">
              T4 Labs เป็นพาร์ตเนอร์วิศวกรรมของ founder และองค์กร — รับตั้งแต่
              Landing Page ไปจนถึง SaaS, Web Application และ AI Product
              ที่ซับซ้อนสูง ออกแบบและส่งมอบด้วยมาตรฐานเดียวกับ product studio
            </p>
            <div className="lab3-actions" data-rv data-rv-d="3">
              <a className="lab3-btn solid" href="#contact">
                ติดต่อ / จ้างงาน <span className="arw">→</span>
              </a>
              <a className="lab3-btn ghost" href="/chat">
                คุยกับ AI
              </a>
            </div>
            <dl className="lab3-trust" data-rv data-rv-d="3">
              {TRUST.map((t) => (
                <div key={t.label}>
                  <dt>
                    {t.n}
                    <em>{t.unit}</em>
                  </dt>
                  <dd>{t.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* layer-1 anchor: the Product Reactor (§14.17.1) */}
          <div className="lab3-stage">
            <div className="lab3-scene">
              <Lab3HeroSceneLazy />
            </div>
            <div className="lab3-spec lab3-glass s1" data-rv>
              <span className="k">Signature object</span>
              <span className="v">
                <i className="dot" />
                Product Reactor
              </span>
            </div>
            <div className="lab3-spec lab3-glass s2" data-rv data-rv-d="2">
              <span className="k">Render</span>
              <span className="v">R3F · Draco · 873 KB</span>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------- 01 · solution index */}
        <section className="lab3-section" id="solutions">
          <header className="lab3-sec-head">
            <span className="lab3-coord" data-rv>
              01 — SOLUTIONS
            </span>
            <h2 data-rv data-rv-d="1">
              เริ่มจากโจทย์ธุรกิจของคุณ
              <span className="soft"> ไม่ใช่เทคโนโลยี</span>
            </h2>
          </header>
          <Lab3SolutionSelector items={SOLUTIONS} />
        </section>

        {/* ------------------------------------------- 02 · system schematic */}
        <section className="lab3-section" id="how">
          <header className="lab3-sec-head">
            <span className="lab3-coord" data-rv>
              02 — HOW WE BUILD
            </span>
            <h2 data-rv data-rv-d="1">
              สถาปัตยกรรมชุดเดียวกับที่เว็บหน้านี้รันอยู่
            </h2>
            <p className="lab3-sec-note" data-rv data-rv-d="2">
              ไม่ใช่ diagram ประกอบ — นี่คือ request path จริงของระบบเรา
            </p>
          </header>
          <Lab3Schematic stack={STACK} process={PROCESS} />
        </section>

        {/* ------------------------------------------- 03 · services ladder */}
        <section className="lab3-section" id="services">
          <header className="lab3-sec-head">
            <span className="lab3-coord" data-rv>
              03 — SERVICES
            </span>
            <h2 data-rv data-rv-d="1">
              รับครบสเปกตรัม
              <span className="soft"> จากหน้าเดียว ถึงทั้งแพลตฟอร์ม</span>
            </h2>
          </header>
          <Lab3Services items={SERVICES} />
        </section>

        {/* --------------------------------------------------- 04 · closing */}
        <section className="lab3-section lab3-cta" id="contact">
          <span className="lab3-coord" data-rv>
            04 — CONTACT
          </span>
          <h2 data-rv data-rv-d="1">
            พร้อมเริ่มโปรเจกต์
            <br />
            แล้วหรือยัง?
          </h2>
          <div className="lab3-actions" data-rv data-rv-d="2">
            <a className="lab3-btn solid" href="https://fastwork.co" target="_blank" rel="noopener noreferrer">
              จ้างผ่าน Fastwork <span className="arw">→</span>
            </a>
            <a className="lab3-btn ghost" href="/chat">
              ประเมินงบกับ AI
            </a>
          </div>
          <p className="lab3-cta-note" data-rv data-rv-d="3">
            ตอบไว · คุยกับ dev โดยตรง · ชำระผ่าน Fastwork ปลอดภัย
          </p>
        </section>
      </main>

      <footer className="lab3-footer">
        <div className="lab3-shell">
          <div className="lab3-wordmark" data-rv>
            T4 LABS
          </div>
          <span className="lab3-foot-meta">
            LAB3 — LAYERED IMMERSIVE SWISS SYSTEM · INTERNAL PROTOTYPE
          </span>
        </div>
      </footer>

      <Lab3Fx />
    </div>
  );
}
