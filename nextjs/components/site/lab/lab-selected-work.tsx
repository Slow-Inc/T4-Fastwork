'use client';

import Link from 'next/link';
import { useT } from '@/i18n/locale-context';
import { LabSectionHeader } from './lab-section';

export interface WorkItem {
  name: string;
  category: string;
  metrics: { label: string; value: string }[];
  href: string;
}

/** Selected work as portfolio spec-cells: category tag + name + a 2×2 metric
 *  grid + an arrow (the ChainGPT portfolio-card blueprint). Pure/presentational. */
export function LabSelectedWorkView({ items }: { items: WorkItem[] }) {
  return (
    <div className="lab-work-grid">
      {items.map((p, i) => (
        <Link
          key={p.name}
          href={p.href}
          className="lab-work-cell rv rv-down"
          style={{ transitionDelay: `${Math.min(i * 70, 480)}ms` }}
        >
          <span className="lab-work-tag">{p.category}</span>
          <h3 className="lab-work-name">{p.name}</h3>
          <dl className="lab-work-metrics">
            {p.metrics.map((m) => (
              <div key={m.label}>
                {/* term then description (correct <dl> semantics); CSS shows the
                    value on top visually via column-reverse. */}
                <dt>{m.label}</dt>
                <dd>{m.value}</dd>
              </div>
            ))}
          </dl>
          <span className="lab-work-arrow" aria-hidden>
            &rarr;
          </span>
        </Link>
      ))}
    </div>
  );
}

export function LabSelectedWork() {
  const yr = useT('ปี', 'Year');
  const stack = useT('สแตก', 'Stack');
  const type = useT('ประเภท', 'Type');
  const role = useT('บทบาท', 'Role');
  const items: WorkItem[] = [
    {
      name: 'MangaDock',
      category: useT('แพลตฟอร์ม', 'Platform'),
      href: '/projects/mangadock',
      metrics: [
        { label: yr, value: '2024' },
        { label: stack, value: 'Next · Nest' },
        { label: type, value: 'OCR · AI' },
        { label: role, value: 'Full-stack' },
      ],
    },
    {
      name: 'Hype Macro Store',
      category: useT('อีคอมเมิร์ซ', 'E-commerce'),
      href: '/projects',
      metrics: [
        { label: yr, value: '2023' },
        { label: stack, value: 'Next · TS' },
        { label: type, value: 'Storefront' },
        { label: role, value: 'Full-stack' },
      ],
    },
    {
      name: 'Home IoT System',
      category: useT('IoT', 'IoT'),
      href: '/projects',
      metrics: [
        { label: yr, value: '2023' },
        { label: stack, value: 'MQTT · TS' },
        { label: type, value: 'Realtime' },
        { label: role, value: 'Engineer' },
      ],
    },
    {
      name: 'T4 Assistant',
      category: useT('AI · RAG', 'AI · RAG'),
      href: '/chat',
      metrics: [
        { label: yr, value: '2026' },
        { label: stack, value: 'Nest · pgvector' },
        { label: type, value: 'RAG chat' },
        { label: role, value: 'AI eng' },
      ],
    },
  ];
  return (
    <section className="lab-section">
      <LabSectionHeader
        kicker={useT('ผลงานคัดสรร', 'Selected work')}
        title={useT(<>ผลงานล่าสุด</>, <>Recent work</>)}
      />
      <LabSelectedWorkView items={items} />
    </section>
  );
}
