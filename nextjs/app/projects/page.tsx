import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { Breadcrumb } from '@/components/site/breadcrumb';
import { ProjectCard } from '@/components/projects/project-card';
import { FilterBar } from '@/components/projects/filter-bar';
import { filterProjectList, facetsFor, type ProjectFilter } from '@/content/catalog';
import { getAllProjects } from '@/lib/projects-repo';
import { pageAlternates } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'ผลงานของเรา — T4 Labs',
  description:
    'รวมผลงาน SaaS, Web Application และ AI Product ที่ T4 Labs ออกแบบและพัฒนา — กรองตามหมวดหมู่ เทคโนโลยี และแท็ก',
  alternates: pageAlternates('/projects'),
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const current: ProjectFilter = {
    q: one(sp.q),
    category: one(sp.category),
    tag: one(sp.tag),
    tech: one(sp.tech),
    featured: one(sp.featured) === '1',
  };
  const all = await getAllProjects();
  const facets = facetsFor(all);
  const results = filterProjectList(all, current);

  return (
    <>
      <SiteNav />
      <div className="wrap">
        <section className="section section-page">
          <Breadcrumb
            items={[{ label: 'หน้าแรก', href: '/' }, { label: 'ผลงาน' }]}
          />
          <div className="page-head rv">
            <h1>ผลงานของเรา</h1>
            <p className="page-lead">
              คัดผลงานจริงที่เราออกแบบและสร้าง — ตั้งแต่ Landing Page ไปจนถึง
              แพลตฟอร์มที่ซับซ้อนสูง กรองตามโจทย์ เทคโนโลยี หรือค้นหาได้เลย
            </p>
          </div>

          <FilterBar facets={facets} current={current} />

          <p className="result-count t-meta rv">
            {results.length} ผลงาน
          </p>

          {results.length > 0 ? (
            <div className="pgrid rv">
              {results.map((p) => (
                <ProjectCard key={p.slug} project={p} />
              ))}
            </div>
          ) : (
            <div className="empty-state rv">
              <p>ไม่พบผลงานที่ตรงกับตัวกรอง</p>
              <Link href="/projects" className="pcard-link">
                ล้างตัวกรอง
              </Link>
            </div>
          )}
        </section>
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
