import { LanguageDonut } from '@/components/site/language-donut';

interface TechItem {
  name: string;
  usedFor?: string;
  usedForEn?: string;
}

interface Props {
  technologies: string[];
  /** When present, prefer these over bare `technologies` names for used-for lines. */
  technologyDetails?: TechItem[];
  tags: string[];
  languages?: Record<string, number>;
  en?: boolean;
}

function hasUsedFor(item: TechItem): boolean {
  return Boolean(item.usedFor || item.usedForEn);
}

/** Keep first occurrence; upgrade if a later duplicate carries used-for copy. */
function dedupeTechItems(items: TechItem[]): TechItem[] {
  const byName = new Map<string, TechItem>();
  for (const item of items) {
    const existing = byName.get(item.name);
    if (!existing) {
      byName.set(item.name, item);
      continue;
    }
    if (!hasUsedFor(existing) && hasUsedFor(item)) {
      byName.set(item.name, item);
    }
  }
  return [...byName.values()];
}

function dedupeNames(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    if (seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

export function ProjectTechnologyPanel({
  technologies,
  technologyDetails,
  tags,
  languages,
  en = false,
}: Props) {
  const items: TechItem[] = dedupeTechItems(
    technologyDetails && technologyDetails.length > 0
      ? technologyDetails
      : technologies.map((name) => ({ name })),
  );
  const uniqueTags = dedupeNames(tags);

  return (
    <>
      <div className="meta-block">
        <span className="t-meta">
          {en ? 'Technology stack' : 'เทคโนโลยีที่ใช้'}
        </span>
        <ul className="chip-row tech-used-for-list">
          {items.map((tech) => {
            const blurb =
              en && tech.usedForEn ? tech.usedForEn : tech.usedFor;
            return (
              <li key={tech.name} className="chip tech-used-for-item">
                <span className="tech-used-for-item__name">{tech.name}</span>
                {blurb ? (
                  <span className="tech-used-for-item__blurb">{blurb}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
        {languages && Object.keys(languages).length > 0 && (
          <div className="meta-langs">
            <span className="t-meta">
              {en ? 'Language mix' : 'สัดส่วนภาษา'}
            </span>
            <LanguageDonut languages={languages} en={en} />
          </div>
        )}
      </div>
      <div className="meta-block">
        <span className="t-meta">{en ? 'Tags' : 'แท็ก'}</span>
        <ul className="chip-row">
          {uniqueTags.map((tag) => (
            <li key={tag} className="chip chip-muted">
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
