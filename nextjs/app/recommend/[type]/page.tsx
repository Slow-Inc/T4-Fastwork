import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { Breadcrumb } from '@/components/site/breadcrumb';
import { ProjectCard } from '@/components/projects/project-card';
import { InteractivePreview } from '@/components/solutions/interactive-preview';
import { FeatureChecklist } from '@/components/solutions/feature-checklist';
import {
  getSolutionDetail,
  solutionSlugs,
  featureGroups,
  previewScreens,
} from '@/content/solution-detail';
import { solutions } from '@/content/solutions';
import { filterProjects, projects } from '@/content/catalog';

type Params = Promise<{ type: string }>;

const FASTWORK_URL = 'https://fastwork.co';

export function generateStaticParams() {
  return solutionSlugs.map((type) => ({ type }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { type } = await params;
  const d = getSolutionDetail(type);
  if (!d) return { title: 'ไม่พบหน้านี้ — T4 Labs' };
  return {
    title: `${d.badge} — T4 Labs`,
    description: d.tagline,
    openGraph: { title: d.headline, description: d.tagline, type: 'website' },
  };
}

export default async function RecommendPage({ params }: { params: Params }) {
  const { type } = await params;
  const detail = getSolutionDetail(type);
  if (!detail) notFound();

  const inCategory = detail.portfolioCategory
    ? filterProjects({ category: detail.portfolioCategory })
    : projects.filter((p) => p.isFeatured);
  const pool = inCategory.length > 0 ? inCategory : projects.filter((p) => p.isFeatured);
  const highlight = pool.slice(0, 3);

  return (
    <>
      <SiteNav />
      <div className="wrap">
        {/* 1 — Hero */}
        <section className="section section-page">
          <Breadcrumb
            items={[
              { label: 'หน้าแรก', href: '/' },
              { label: 'โจทย์', href: '/#solutions' },
              { label: detail.badge },
            ]}
          />
          <div className="page-head rv">
            <div className="t-idx">{detail.badge}</div>
            <h1>{detail.headline}</h1>
            <p className="page-lead">{detail.tagline}</p>
            <div className="detail-cta" style={{ border: 'none', marginTop: 28, paddingTop: 0 }}>
              <Link href="/chat" className="btn">คุยกับ AI / ประเมินราคา</Link>
              <a href={FASTWORK_URL} target="_blank" rel="noopener noreferrer" className="btn ghost">
                ติดต่อผ่าน Fastwork ↗
              </a>
              <Link href="/projects" className="btn ghost">ดูผลงานที่เคยทำ</Link>
            </div>
          </div>
        </section>

        {/* 2 — Value proposition */}
        <section className="section">
          <h2 className="rv">โจทย์นี้ช่วยธุรกิจอย่างไร</h2>
          <div className="about-grid rv" style={{ marginTop: 28 }}>
            {detail.valueProps.map((v) => (
              <div key={v.title} className="about-card">
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3 — Portfolio highlight */}
        {highlight.length > 0 && (
          <section className="section">
            <div className="work-head rv">
              <h2>ผลงานที่เกี่ยวข้อง</h2>
              <Link href="/projects" className="pcard-link">ดูผลงานทั้งหมด →</Link>
            </div>
            <div className="pgrid rv" style={{ marginTop: 24 }}>
              {highlight.map((p) => (
                <ProjectCard key={p.slug} project={p} />
              ))}
            </div>
          </section>
        )}

        {/* 4 — Interactive preview */}
        <section className="section">
          <div className="page-head rv">
            <div className="t-idx">Preview</div>
            <h2>กดดูตัวอย่างระบบก่อนจ้าง</h2>
            <p className="page-lead">
              ลองกดดูหน้าจอตัวอย่างของระบบ — ทั้งฝั่งลูกค้าและฝั่ง Admin
            </p>
          </div>
          <div className="rv" style={{ marginTop: 28 }}>
            <InteractivePreview screens={previewScreens} />
          </div>
        </section>

        {/* 5 — Feature checklist */}
        <section className="section">
          <div className="page-head rv">
            <div className="t-idx">Features</div>
            <h2>เลือก scope ก่อนคุย</h2>
            <p className="page-lead">
              รายการคือแนวทางความสามารถของระบบ — ใช้เลือกฟีเจอร์ก่อนขอใบเสนอราคา
            </p>
          </div>
          <div style={{ marginTop: 28 }}>
            <FeatureChecklist groups={featureGroups} />
          </div>
        </section>

        {/* 7 — CTA */}
        <section className="section">
          <div className="about-cta rv">
            <h2>พร้อมเริ่มโจทย์นี้แล้วหรือยัง?</h2>
            <div className="detail-cta" style={{ border: 'none', marginTop: 24, paddingTop: 0 }}>
              <a href={FASTWORK_URL} target="_blank" rel="noopener noreferrer" className="btn">
                ติดต่อ Fastwork ↗
              </a>
              <Link href="/chat" className="btn ghost">คุยกับ AI</Link>
            </div>
          </div>
        </section>

        {/* 8 — Solution navigation footer */}
        <section className="section">
          <span className="t-meta">โจทย์อื่น</span>
          <div className="soln-nav rv">
            {solutions.map((s) => (
              <Link
                key={s.slug}
                href={`/recommend/${s.slug}`}
                className={`soln-nav-item${s.slug === type ? ' is-active' : ''}`}
              >
                {s.title}
              </Link>
            ))}
          </div>
        </section>

        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
