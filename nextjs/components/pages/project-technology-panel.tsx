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

export function ProjectTechnologyPanel({
  technologies,
  technologyDetails,
  tags,
  languages,
  en = false,
}: Props) {
  const items: TechItem[] =
    technologyDetails && technologyDetails.length > 0
      ? technologyDetails
      : technologies.map((name) => ({ name }));

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
          {tags.map((tag) => (
            <li key={tag} className="chip chip-muted">
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
