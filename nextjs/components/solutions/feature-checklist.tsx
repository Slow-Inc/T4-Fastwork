interface Group {
  title: string;
  items: string[];
  titleEn?: string;
  itemsEn?: string[];
}

/** Feature Checklist — 6 accordion groups (Requirement §4.4.2), bilingual. */
export function FeatureChecklist({ groups, en = false }: { groups: Group[]; en?: boolean }) {
  return (
    <div className="checklist rv">
      {groups.map((g) => {
        const items = en && g.itemsEn ? g.itemsEn : g.items;
        return (
          <details key={g.title} className="checklist-group">
            <summary className="checklist-head">
              <span className="checklist-title">{en && g.titleEn ? g.titleEn : g.title}</span>
              <span className="t-meta">
                {items.length} {en ? 'items' : 'รายการ'}
              </span>
            </summary>
            <ul className="checklist-items">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
