import type { FeatureGroup } from '@/content/solution-detail';

/** Feature Checklist — 6 accordion groups (Requirement §4.4.2). */
export function FeatureChecklist({ groups }: { groups: FeatureGroup[] }) {
  return (
    <div className="checklist rv">
      {groups.map((g) => (
        <details key={g.title} className="checklist-group">
          <summary className="checklist-head">
            <span className="checklist-title">{g.title}</span>
            <span className="t-meta">{g.items.length} รายการ</span>
          </summary>
          <ul className="checklist-items">
            {g.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
