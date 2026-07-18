'use client';

import { useT } from '@/i18n/locale-context';

export interface Stat {
  value: string;
  label: string;
}

/** "By the numbers" band — big accent numerals over mono labels, in bordered
 *  cells. Pure/presentational. */
export function LabStatsView({ stats }: { stats: Stat[] }) {
  return (
    <div className="lab-stats">
      {stats.map((s) => (
        <div key={s.label} className="lab-stat rv rv-down">
          <span className="lab-stat-value">{s.value}</span>
          <span className="lab-stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export function LabStats() {
  const stats: Stat[] = [
    { value: '7', label: useT('ปีประสบการณ์', 'Years shipping') },
    { value: '21+', label: useT('โปรเจกต์ที่ส่งมอบ', 'Projects built') },
    { value: '6', label: useT('วิศวกรตัวจริง', 'Real engineers') },
    { value: '100%', label: useT('verify บนของจริง', 'Verified end-to-end') },
  ];
  return (
    <section
      className="lab-section lab-stats-section"
      aria-label={useT('ตัวเลขของเรา', 'By the numbers')}
    >
      <LabStatsView stats={stats} />
    </section>
  );
}
