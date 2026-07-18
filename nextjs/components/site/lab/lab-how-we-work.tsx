'use client';

import { useT } from '@/i18n/locale-context';
import { LabSectionHeader } from './lab-section';

export interface WorkStep {
  no: string;
  title: string;
  desc: string;
}

/** "How we work" as a connected node row (the ChainGPT ecosystem-graph motif,
 *  simplified to a linear process): spec-cell nodes joined by connectors, each
 *  revealing in sequence. Pure/presentational. */
export function LabHowWeWorkView({ steps }: { steps: WorkStep[] }) {
  return (
    <ol className="lab-flow">
      {steps.map((s, i) => (
        <li
          key={s.no}
          className="lab-flow-node rv rv-down"
          style={{ transitionDelay: `${Math.min(i * 90, 540)}ms` }}
        >
          <span className="lab-flow-no">{s.no}</span>
          <h3 className="lab-flow-title">{s.title}</h3>
          <p className="lab-flow-desc">{s.desc}</p>
        </li>
      ))}
    </ol>
  );
}

export function LabHowWeWork() {
  const steps: WorkStep[] = [
    {
      no: '01',
      title: useT('ค้นหา', 'Discover'),
      desc: useT('เข้าใจปัญหา ขอบเขต และเป้าหมายจริง', 'Frame the problem, scope, and real goals.'),
    },
    {
      no: '02',
      title: useT('ออกแบบ', 'Design'),
      desc: useT('สถาปัตยกรรม + UX ก่อนเขียนโค้ด', 'Architecture + UX before a line of code.'),
    },
    {
      no: '03',
      title: useT('สร้าง', 'Build'),
      desc: useT('TDD, ส่งเป็นชิ้นเล็ก, เห็นของเร็ว', 'TDD, small increments, fast to something real.'),
    },
    {
      no: '04',
      title: useT('ส่งขึ้นจริง', 'Ship'),
      desc: useT('CI/CD + verify ทุกครั้งบนของจริง', 'CI/CD with end-to-end verification every time.'),
    },
    {
      no: '05',
      title: useT('สเกล', 'Scale'),
      desc: useT('วัดผล ปรับ และต่อยอดหลังส่งมอบ', 'Measure, tune, and iterate after launch.'),
    },
  ];
  return (
    <section className="lab-section">
      <LabSectionHeader
        kicker={useT('กระบวนการ', 'The process')}
        title={useT(<>เราทำงานยังไง</>, <>How we work</>)}
      />
      <LabHowWeWorkView steps={steps} />
    </section>
  );
}
