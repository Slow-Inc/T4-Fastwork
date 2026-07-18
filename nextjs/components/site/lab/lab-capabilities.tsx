'use client';

import { useT } from '@/i18n/locale-context';
import { LabSectionHeader } from './lab-section';

export interface Capability {
  no: string;
  title: string;
  desc: string;
}

/** Capabilities grid — numbered spec-cells (the "bordered technical cell" motif).
 *  Pure/presentational so it is unit-testable. */
export function LabCapabilitiesView({ items }: { items: Capability[] }) {
  return (
    <ul className="lab-cap-grid">
      {items.map((c, i) => (
        <li
          key={c.no}
          className="lab-cap-cell rv rv-down"
          style={{ transitionDelay: `${Math.min(i * 60, 480)}ms` }}
        >
          <span className="lab-cap-no">{c.no}</span>
          <h3 className="lab-cap-title">{c.title}</h3>
          <p className="lab-cap-desc">{c.desc}</p>
        </li>
      ))}
    </ul>
  );
}

export function LabCapabilities() {
  const items: Capability[] = [
    {
      no: '01',
      title: useT('เว็บแอป & SaaS', 'Web apps & SaaS'),
      desc: useT(
        'ตั้งแต่ MVP ถึงแพลตฟอร์มหลายผู้ใช้ — สถาปัตยกรรมที่สเกลได้',
        'From MVP to multi-tenant platforms — architecture that scales.',
      ),
    },
    {
      no: '02',
      title: useT('AI & RAG', 'AI & RAG'),
      desc: useT(
        'ผู้ช่วย AI, ค้นหาเชิงความหมาย และ RAG บนข้อมูลของคุณ',
        'AI assistants, semantic search, and RAG grounded in your data.',
      ),
    },
    {
      no: '03',
      title: useT('Backend & API', 'Backend & API'),
      desc: useT(
        'API ที่แข็งแรง, งาน realtime และ data layer ที่เชื่อถือได้',
        'Robust APIs, realtime workloads, and a dependable data layer.',
      ),
    },
    {
      no: '04',
      title: useT('Design & UX', 'Design & UX'),
      desc: useT(
        'อินเทอร์เฟซที่คมและวัดผลได้ ไม่ใช่แค่สวย',
        'Sharp, measurable interfaces — not just pretty ones.',
      ),
    },
    {
      no: '05',
      title: useT('Cloud & DevOps', 'Cloud & DevOps'),
      desc: useT(
        'CI/CD, การ deploy และ observability ที่ทำให้ทีมส่งงานได้เร็ว',
        'CI/CD, deploys, and observability that keep teams shipping.',
      ),
    },
    {
      no: '06',
      title: useT('Growth & Analytics', 'Growth & Analytics'),
      desc: useT(
        'วัดผล ทดลอง และต่อยอด — โตโดยไม่ต้องเปลี่ยนทีม',
        'Measure, experiment, and iterate — grow without switching teams.',
      ),
    },
  ];
  return (
    <section className="lab-section">
      <LabSectionHeader
        kicker={useT('สิ่งที่เราทำ', 'What we do')}
        title={useT(<>ความสามารถ</>, <>Capabilities</>)}
      />
      <LabCapabilitiesView items={items} />
    </section>
  );
}
