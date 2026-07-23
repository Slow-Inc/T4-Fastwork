import { LanguageDonut } from '@/components/site/language-donut';

interface Props {
  technologies: string[];
  tags: string[];
  languages?: Record<string, number>;
  en?: boolean;
}

export function ProjectTechnologyPanel({
  technologies,
  tags,
  languages,
  en = false,
}: Props) {
  return (
    <>
      <div className="meta-block">
        <span className="t-meta">
          {en ? 'Technology stack' : 'เทคโนโลยีที่ใช้'}
        </span>
        <ul className="chip-row">
          {technologies.map((tech) => (
            <li key={tech} className="chip">
              {tech}
            </li>
          ))}
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
