import type { Lab4Solution } from '@/components/site/lab4/lab4-solution-selector';
import type { Lab4ProcessStep, Lab4StackNode } from '@/components/site/lab4/lab4-schematic';
import type { Lab4Service } from '@/components/site/lab4/lab4-services';

/**
 * v3 home content (requirement3.md §14) — shared by the live home
 * (app/page.tsx) and the /lab4 prototype it graduated from, so the two
 * can never drift while the prototype remains the reference.
 */

export const TRUST = [
  { n: '5', unit: 'ปี', label: 'ประสบการณ์ทีม' },
  { n: '21', unit: '+', label: 'โปรเจกต์ที่ส่งมอบ' },
  { n: '7', unit: '', label: 'ใบรับรองของทีม' },
];

export const SOLUTIONS: Lab4Solution[] = [
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
export const STACK: Lab4StackNode[] = [
  { id: 'client', label: 'CLIENT', tech: 'Next.js', desc: 'App Router · SSG/ISR' },
  { id: 'edge', label: 'EDGE', tech: 'Cloudflare', desc: 'CDN · WAF · cache' },
  { id: 'api', label: 'API', tech: 'Nest.js', desc: 'business logic · SSE' },
  { id: 'data', label: 'DATA', tech: 'Supabase · pgvector', desc: 'Postgres · RLS · embeddings' },
  { id: 'ai', label: 'AI', tech: 'LLM · RAG', desc: 'ตอบโดยอ้างอิงผลงานจริง', href: '/chat' },
];

export const PROCESS: Lab4ProcessStep[] = [
  { no: '01', title: 'Discovery', desc: 'เข้าใจโจทย์ธุรกิจและ requirement' },
  { no: '02', title: 'Architecture', desc: 'ออกแบบระบบ, data model, ขอบเขต' },
  { no: '03', title: 'Build', desc: 'Agile · TDD · code review ทุก PR' },
  { no: '04', title: 'Ship', desc: 'CI/CD · staging ก่อน production' },
  { no: '05', title: 'Scale', desc: 'monitor, optimize, ดูแลหลังส่งมอบ' },
];

export const SERVICES: Lab4Service[] = [
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
