import { ProjectTechnologyPanel } from '@/components/pages/project-technology-panel';
import { ReadmeMarkdown } from '@/components/site/readme-markdown';
import type { Project } from '@/content/catalog';
import type { RepoDetail } from '@/lib/github';

export function ProjectBrief({
  project,
  detail,
  en,
}: {
  project: Project;
  detail?: RepoDetail | null;
  en: boolean;
}) {
  const t = (th: string, english: string) => (en ? english : th);
  const description =
    en && project.descriptionEn ? project.descriptionEn : project.description;
  const overview = project.overview;
  const summary = overview
    ? en && overview.summaryEn
      ? overview.summaryEn
      : overview.summary
    : description;
  const highlights = overview
    ? en && overview.highlightsEn
      ? overview.highlightsEn
      : overview.highlights
    : null;
  const goodFor = overview
    ? en && overview.goodForEn
      ? overview.goodForEn
      : overview.goodFor
    : null;
  const ownerLabel =
    project.ownerLabel ??
    (project.ownerType === 'personal' ? project.title : 'T4 Labs');

  return (
    <section
      className="project-brief rv"
      aria-labelledby="project-summary-heading"
    >
      <div className="project-brief__summary">
        <div className="project-brief__eyebrow">
          <span className="t-idx">{t('ภาพรวม', 'Overview')}</span>
          <span>{t('อ่านจบใน 30 วินาที', 'A 30-second read')}</span>
        </div>
        <h2 id="project-summary-heading">
          {t('สรุปโปรเจกต์', 'Project summary')}
        </h2>
        {overview ? (
          <div className="project-overview-card">
            <div>
              <h3 className="t-meta">{t('ภาพรวม', 'Overview')}</h3>
              <p className="project-brief__lead">{summary}</p>
            </div>
            <div>
              <h3 className="t-meta">{t('สรุป 30 วินาที', '30-second highlights')}</h3>
              <p>{highlights}</p>
            </div>
            <div>
              <h3 className="t-meta">{t('เหมาะกับใคร', 'Good for')}</h3>
              <p>{goodFor}</p>
            </div>
          </div>
        ) : (
          <p className="project-brief__lead">{description}</p>
        )}

        <dl className="project-facts">
          <div>
            <dt>{t('หมวดหมู่', 'Category')}</dt>
            <dd>{project.category}</dd>
          </div>
          <div>
            <dt>{t('ปี', 'Year')}</dt>
            <dd>{project.year}</dd>
          </div>
          <div>
            <dt>{t('ผู้ดูแลผลงาน', 'Ownership')}</dt>
            <dd>{ownerLabel}</dd>
          </div>
        </dl>

        <div className="project-brief__links">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              {t('ดูเว็บจริง ↗', 'Visit site ↗')}
            </a>
          )}
          {project.github && (
            <a
              href={`https://github.com/${project.github.owner}/${project.github.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn ghost"
            >
              {t('ดูบน GitHub ↗', 'View on GitHub ↗')}
            </a>
          )}
        </div>
      </div>

      <aside
        className="project-brief__technology"
        aria-label={t('ข้อมูลทางเทคนิค', 'Technical profile')}
      >
        <div className="project-brief__technical-heading">
          <span className="t-idx">
            {t('ข้อมูลทางเทคนิค', 'Technical profile')}
          </span>
          <span>{t('ข้อมูลจากโปรเจกต์และ GitHub', 'Project + GitHub data')}</span>
        </div>
        <ProjectTechnologyPanel
          technologies={project.technologies}
          technologyDetails={project.technologyDetails}
          tags={project.tags}
          languages={detail?.languages}
          en={en}
        />
      </aside>
    </section>
  );
}

function DisclosureHint({ en }: { en: boolean }) {
  return (
    <span className="project-disclosure__hint" aria-hidden="true">
      <span className="project-disclosure__when-closed">
        {en ? 'Open' : 'เปิดอ่าน'}
      </span>
      <span className="project-disclosure__when-open">
        {en ? 'Close' : 'ปิด'}
      </span>
    </span>
  );
}

export function ProjectDetailDisclosures({
  content,
  readme,
  en,
}: {
  content: string[];
  readme?: string | null;
  en: boolean;
}) {
  const t = (th: string, english: string) => (en ? english : th);

  return (
    <>
      <details className="project-disclosure rv">
        <summary>
          <span>
            <span className="t-idx">
              {t('รายละเอียดเพิ่มเติม', 'More detail')}
            </span>
            <strong>{t('รายละเอียดเชิงลึก', 'Deep detail')}</strong>
          </span>
          <DisclosureHint en={en} />
        </summary>
        <div className="detail-content">
          {content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </details>

      {readme && (
        <details className="detail-readme project-disclosure rv">
          <summary>
            <span>
              <span className="t-idx">
                {t('เอกสารต้นฉบับ', 'Source document')}
              </span>
              <strong>{t('รายละเอียด (README)', 'Details (README)')}</strong>
            </span>
            <DisclosureHint en={en} />
          </summary>
          <ReadmeMarkdown source={readme} />
        </details>
      )}
    </>
  );
}
