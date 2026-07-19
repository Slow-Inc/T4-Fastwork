import type { Metadata } from 'next';
import { Lab4RobotStageLazy } from '@/components/site/lab4/lab4-robot-stage-lazy';
import { Lab4Fx } from '@/components/site/lab4/lab4-fx';
import { Lab4ThemeToggle } from '@/components/site/lab4/lab4-theme-toggle';
import { Lab4ResetButton } from '@/components/site/lab4/lab4-reset-button';
import {
  Lab4SolutionSelector,
  type Lab4Solution,
} from '@/components/site/lab4/lab4-solution-selector';
import {
  Lab4Schematic,
  type Lab4ProcessStep,
  type Lab4StackNode,
} from '@/components/site/lab4/lab4-schematic';
import { Lab4Services, type Lab4Service } from '@/components/site/lab4/lab4-services';
import { KineticMarquee } from '@/components/site/lab/kinetic-marquee';

export const metadata: Metadata = {
  title: 'Lab4 — v3 prototype: Robot storytelling × dual theme',
  robots: { index: false, follow: false },
};

// runs synchronously while the .lab4 div is parsed, so the first paint is
// already in the right theme; the attribute lives on the div (not <html>)
// and the div suppresses the expected server/client attribute difference
const THEME_INIT = `(function(){var el=document.currentScript.closest('.lab4');var t;try{t=localStorage.getItem('lab4-theme')}catch(e){}if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}el.dataset.lab4Theme=t})()`;

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

const SOLUTIONS: Lab4Solution[] = [
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
    title: 'เว็บไซต์ร้าน / โจทย์เฉพาะ',
    desc: 'อยากมีเว็บของตัวเองแต่ไม่รู้จะเริ่มยังไง — เล่าให้ทีมหรือ AI ฟังได้เลย',
    meta: 'CONSULT',
    span: 'narrow',
  },
];

// the real request path this very site runs on — the AI node opens the live
// chatbot (§14.18: the schematic is a door, not a poster)
const STACK: Lab4StackNode[] = [
  { id: 'client', label: 'CLIENT', tech: 'Next.js', desc: 'App Router · SSG/ISR' },
  { id: 'edge', label: 'EDGE', tech: 'Cloudflare', desc: 'CDN · WAF · cache' },
  { id: 'api', label: 'API', tech: 'Nest.js', desc: 'business logic · SSE' },
  { id: 'data', label: 'DATA', tech: 'Supabase · pgvector', desc: 'Postgres · RLS · embeddings' },
  { id: 'ai', label: 'AI', tech: 'LLM · RAG', desc: 'ตอบโดยอ้างอิงผลงานจริง', href: '/chat' },
];

const PROCESS: Lab4ProcessStep[] = [
  { no: '01', title: 'Discovery', desc: 'เข้าใจโจทย์ธุรกิจและ requirement' },
  { no: '02', title: 'Architecture', desc: 'ออกแบบระบบ, data model, ขอบเขต' },
  { no: '03', title: 'Build', desc: 'Agile · TDD · code review ทุก PR' },
  { no: '04', title: 'Ship', desc: 'CI/CD · staging ก่อน production' },
  { no: '05', title: 'Scale', desc: 'monitor, optimize, ดูแลหลังส่งมอบ' },
];

const SERVICES: Lab4Service[] = [
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

export default function Lab4Page() {
  return (
    <div className="lab4" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />

      {/* blueprint field — visible at the hero, fading to quiet below (§14.5) */}
      <div className="lab4-field" aria-hidden />

      {/* floating liquid-glass nav with the dual-theme switch (§14.6, §14.7) */}
      <nav className="lab4-nav lab4-glass" aria-label="Lab4">
        <span className="lab4-brand">
          <i aria-hidden />
          T4 Labs
          <em>LAB4 · V3 PROTOTYPE</em>
        </span>
        <div className="lab4-nav-links">
          {NAV.map((n) => (
            <a key={n.href} href={n.href}>
              {n.label}
            </a>
          ))}
        </div>
        <div className="lab4-nav-tools">
          <Lab4ThemeToggle />
          <a className="lab4-nav-cta" href="#contact">
            ติดต่อเรา
          </a>
        </div>
      </nav>

      <main className="lab4-shell">
        {/* ------------------------------------------------ 00 · hero thesis
            Storytelling zone 1, ChainGPT-labs structure: the kinetic band IS
            the only display-scale type (one dominant per viewport, §14.0);
            below it a Swiss table band — mono copy · robot · meta cells —
            closed by a full-width trust strip. */}
        <section className="lab4-hero">
          {/* display headline = the marquee itself; decorative (real h1 below) */}
          <div className="lab4-marquee">
            <KineticMarquee text="BUILDING TOMORROW —" />
          </div>

          <div className="lab4-hero-grid">
            <div className="lab4-hero-cell copy">
              <span className="lab4-coord" data-rv>
                <i aria-hidden />
                00 — POSITIONING
              </span>
              <h1 className="lab4-h1" data-rv data-rv-d="1">
                อยากมีเว็บแบบไหน เรา<em>สร้างได้</em> — ตั้งแต่หน้าเดียว
                ถึงระดับ product
              </h1>
              <p className="lab4-lead" data-rv data-rv-d="2">
                เว็บร้านค้า, SaaS, Web Application, AI Product —
                มาตรฐานวิศวกรรมเดียวกันทุกสเกล คุยกับ dev โดยตรง
                ไม่ต้องรู้ศัพท์เทคนิค
              </p>
              <div className="lab4-actions" data-rv data-rv-d="3">
                <a className="lab4-btn solid" href="#contact">
                  ติดต่อ / จ้างงาน <span className="arw">→</span>
                </a>
                <a className="lab4-btn ghost" href="/chat">
                  คุยกับ AI
                </a>
              </div>
            </div>

            {/* zone marker 1 — the robot's home cell; grab = drag-to-rotate */}
            <div
              className="lab4-stage"
              data-l4-zone="hero"
              data-l4-grab
              data-l4-scale="0.8"
            >
              <div className="lab4-scene-fallback" aria-hidden />
            </div>

            <div className="lab4-hero-cell meta">
              <div className="lab4-meta-block" data-rv>
                <span className="k">Brand character</span>
                <span className="v">
                  <i className="dot" />
                  T4 Bot v1 · 369 KB
                </span>
              </div>
              <div className="lab4-meta-block" data-rv data-rv-d="2">
                <span className="k">Interaction</span>
                <span className="v">DRAG TO ROTATE</span>
                <Lab4ResetButton />
              </div>
              <div className="lab4-meta-block grow" data-rv data-rv-d="3">
                <span className="k">Render</span>
                <span className="v">R3F · zone travel · dual theme</span>
              </div>
            </div>
          </div>

          {/* trust strip — the ChainGPT partners-row slot, filled with proof */}
          <dl className="lab4-trust" data-rv>
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
        </section>

        {/* ---------------------------------------------- 01 · solution index */}
        <section className="lab4-section" id="solutions">
          <header className="lab4-sec-head">
            <span className="lab4-coord" data-rv>
              01 — SOLUTIONS
            </span>
            <h2 data-rv data-rv-d="1">
              เริ่มจากโจทย์ของคุณ
              <span className="soft"> ไม่ใช่เทคโนโลยี</span>
            </h2>
          </header>
          <Lab4SolutionSelector items={SOLUTIONS} />
        </section>

        {/* ------------------------------------------- 02 · system schematic
            Storytelling zone 2: the robot docks beside the real request path
            and the AI node opens the live chatbot (§14.18) */}
        <section className="lab4-section" id="how">
          <header className="lab4-sec-head with-dock">
            <div>
              <span className="lab4-coord" data-rv>
                02 — HOW WE BUILD
              </span>
              <h2 data-rv data-rv-d="1">
                สถาปัตยกรรมชุดเดียวกับที่หน้านี้รันอยู่
              </h2>
              <p className="lab4-sec-note" data-rv data-rv-d="2">
                ไม่ใช่ diagram ประกอบ — นี่คือ request path จริงของระบบเรา
                กดที่ node AI เพื่อเปิดแชตบอทตัวจริงได้เลย
              </p>
            </div>
            {/* zone marker 2 — the robot leads the tour of the stack */}
            <div
              className="lab4-how-dock"
              data-l4-zone="how"
              data-l4-scale="0.75"
              data-l4-yaw="-0.35"
              aria-hidden
            />
          </header>
          <Lab4Schematic stack={STACK} process={PROCESS} />
        </section>

        {/* ------------------------------------------- 03 · services ladder */}
        <section className="lab4-section" id="services">
          <header className="lab4-sec-head">
            <span className="lab4-coord" data-rv>
              03 — SERVICES
            </span>
            <h2 data-rv data-rv-d="1">
              รับครบสเปกตรัม
              <span className="soft"> จากหน้าเดียว ถึงทั้งแพลตฟอร์ม</span>
            </h2>
          </header>
          <Lab4Services items={SERVICES} />
        </section>

        {/* --------------------------------------------------- 04 · closing */}
        <section className="lab4-section lab4-cta" id="contact">
          <span className="lab4-coord" data-rv>
            04 — CONTACT
          </span>
          <h2 data-rv data-rv-d="1">
            พร้อมเริ่มโปรเจกต์
            <br />
            แล้วหรือยัง?
          </h2>
          <div className="lab4-actions" data-rv data-rv-d="2">
            <a
              className="lab4-btn solid"
              href="https://fastwork.co"
              target="_blank"
              rel="noopener noreferrer"
            >
              จ้างผ่าน Fastwork <span className="arw">→</span>
            </a>
            <a className="lab4-btn ghost" href="/chat">
              ประเมินงบกับ AI
            </a>
          </div>
          <p className="lab4-cta-note" data-rv data-rv-d="3">
            ตอบไว · คุยกับ dev โดยตรง · ชำระผ่าน Fastwork ปลอดภัย
          </p>
        </section>
      </main>

      {/* Oversized Brand Wordmark footer — storytelling zone 3: the robot
          peeks over the wordmark to wave goodbye (§14.10) */}
      <footer className="lab4-footer">
        <div className="lab4-shell">
          <div className="lab4-wordmark-wrap">
            <div className="lab4-wordmark" aria-hidden>
              T4 LABS
            </div>
            <div
              className="lab4-foot-dock"
              data-l4-zone="footer"
              data-l4-scale="0.9"
              data-l4-yaw="0.25"
              data-l4-pitch="0.18"
              aria-hidden
            />
          </div>
          <div className="lab4-foot-row">
            <span className="lab4-foot-brand">T4 Labs</span>
            <span className="lab4-foot-meta">
              LAB4 — REQUIREMENT3 §14 · ROBOT STORYTELLING × DUAL THEME · INTERNAL
              PROTOTYPE
            </span>
          </div>
        </div>
      </footer>

      <Lab4Fx />
      <Lab4RobotStageLazy />
    </div>
  );
}
