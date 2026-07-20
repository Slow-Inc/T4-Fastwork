import type { Metadata } from 'next';
import { pageAlternates } from '@/lib/seo';
import { V3Shell } from '@/components/site/v3/v3-shell';
import { Breadcrumb } from '@/components/site/breadcrumb';

export const metadata: Metadata = {
  title: 'พันธมิตร — T4 Labs',
  description: 'พันธมิตรและเทคโนโลยีที่ T4 Labs ทำงานร่วมด้วยในการส่งมอบผลิตภัณฑ์',
  alternates: pageAlternates('/bw'),
};

/**
 * §14.16 forbids decorative filler, and a grid of bare logos-as-text is exactly
 * that. Each partner now states the job it does in our stack — the same
 * information density as the home's schematic, and it answers the question a
 * visitor actually has ("what do they use it for?").
 */
const partners = [
  { name: 'Supabase', role: 'Postgres · Auth · Storage · pgvector' },
  { name: 'Vercel', role: 'Deploy · edge network · preview builds' },
  { name: 'Cloudflare', role: 'DNS · CDN · bot protection' },
  { name: 'NVIDIA', role: 'GPU inference สำหรับงาน AI' },
  { name: 'OpenAI', role: 'LLM gateway สำหรับผู้ช่วย AI + RAG' },
  { name: 'Fastwork', role: 'สัญญาจ้าง + ระบบชำระเงินที่คุ้มครองสองฝั่ง' },
  { name: 'PostgreSQL', role: 'ฐานข้อมูลหลักของทุกโปรเจกต์' },
  { name: 'Next.js', role: 'App Router · SSR/ISR · React 19' },
];

export default function PartnersPage() {
  return (
    <V3Shell blueprint="quiet">
      <main className="lab4-shell">
        <section className="lab4-section">
          <Breadcrumb items={[{ label: 'หน้าแรก', href: '/' }, { label: 'พันธมิตร' }]} />
          <header className="lab4-sec-head">
            <span className="lab4-coord" data-rv>
              00 — PARTNERS
            </span>
            <h1 data-rv data-rv-d="1">
              เครื่องมือที่เราไว้ใจ
              <span className="soft"> และใช้ส่งมอบงานจริง</span>
            </h1>
          </header>
          <ul className="v3-rows" data-rv data-rv-d="2">
            {partners.map((p, i) => (
              <li key={p.name} className="v3-row">
                <span className="no">{String(i + 1).padStart(2, '0')}</span>
                <span className="t">{p.name}</span>
                <span className="d">{p.role}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </V3Shell>
  );
}
