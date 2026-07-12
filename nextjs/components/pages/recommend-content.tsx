'use client';

import Link from 'next/link';
import { Breadcrumb } from '@/components/site/breadcrumb';
import { ProjectCard } from '@/components/projects/project-card';
import { InteractivePreview } from '@/components/solutions/interactive-preview';
import { FeatureChecklist } from '@/components/solutions/feature-checklist';
import {
  featureGroups,
  previewScreens,
  type SolutionDetail,
} from '@/content/solution-detail';
import { solutions } from '@/content/solutions';
import type { Project } from '@/content/catalog';
import { useLocale } from '@/i18n/locale-context';

const FASTWORK_URL = 'https://fastwork.co';

export function RecommendContent({
  detail,
  highlight,
  type,
}: {
  detail: SolutionDetail;
  highlight: Project[];
  type: string;
}) {
  const { locale } = useLocale();
  const en = locale === 'en';
  const t = (th: string, e: string) => (en ? e : th);
  const badge = en ? detail.badgeEn : detail.badge;

  return (
    <>
      <section className="section section-page">
        <Breadcrumb
          items={[
            { label: t('หน้าแรก', 'Home'), href: '/' },
            { label: t('โจทย์', 'Solutions'), href: '/#solutions' },
            { label: badge },
          ]}
        />
        <div className="page-head rv">
          <div className="t-idx">{badge}</div>
          <h1>{en ? detail.headlineEn : detail.headline}</h1>
          <p className="page-lead">{en ? detail.taglineEn : detail.tagline}</p>
          <div className="detail-cta" style={{ border: 'none', marginTop: 28, paddingTop: 0 }}>
            <Link href="/chat" className="btn">{t('คุยกับ AI / ประเมินราคา', 'Talk to AI / get a quote')}</Link>
            <a href={FASTWORK_URL} target="_blank" rel="noopener noreferrer" className="btn ghost">
              {t('ติดต่อผ่าน Fastwork ↗', 'Contact via Fastwork ↗')}
            </a>
            <Link href="/projects" className="btn ghost">{t('ดูผลงานที่เคยทำ', 'See past work')}</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="rv">{t('โจทย์นี้ช่วยธุรกิจอย่างไร', 'How this helps your business')}</h2>
        <div className="about-grid rv" style={{ marginTop: 28 }}>
          {detail.valueProps.map((v) => (
            <div key={v.title} className="about-card">
              <h3>{en ? v.titleEn : v.title}</h3>
              <p>{en ? v.descEn : v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {highlight.length > 0 && (
        <section className="section">
          <div className="work-head rv">
            <h2>{t('ผลงานที่เกี่ยวข้อง', 'Related work')}</h2>
            <Link href="/projects" className="pcard-link">{t('ดูผลงานทั้งหมด →', 'View all work →')}</Link>
          </div>
          <div className="pgrid rv" style={{ marginTop: 24 }}>
            {highlight.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="page-head rv">
          <div className="t-idx">Preview</div>
          <h2>{t('กดดูตัวอย่างระบบก่อนจ้าง', 'Click through the system before hiring')}</h2>
          <p className="page-lead">
            {t('ลองกดดูหน้าจอตัวอย่างของระบบ — ทั้งฝั่งลูกค้าและฝั่ง Admin', 'Click through example screens — both client and admin sides.')}
          </p>
        </div>
        <div className="rv" style={{ marginTop: 28 }}>
          <InteractivePreview screens={previewScreens} en={en} />
        </div>
      </section>

      <section className="section">
        <div className="page-head rv">
          <div className="t-idx">Features</div>
          <h2>{t('เลือก scope ก่อนคุย', 'Pick your scope first')}</h2>
          <p className="page-lead">
            {t('รายการคือแนวทางความสามารถของระบบ — ใช้เลือกฟีเจอร์ก่อนขอใบเสนอราคา', 'These are capability guides — use them to choose features before a quote.')}
          </p>
        </div>
        <div style={{ marginTop: 28 }}>
          <FeatureChecklist groups={featureGroups} en={en} />
        </div>
      </section>

      <section className="section">
        <div className="about-cta rv">
          <h2>{t('พร้อมเริ่มโจทย์นี้แล้วหรือยัง?', 'Ready to start this?')}</h2>
          <div className="detail-cta" style={{ border: 'none', marginTop: 24, paddingTop: 0 }}>
            <a href={FASTWORK_URL} target="_blank" rel="noopener noreferrer" className="btn">
              {t('ติดต่อ Fastwork ↗', 'Contact Fastwork ↗')}
            </a>
            <Link href="/chat" className="btn ghost">{t('คุยกับ AI', 'Talk to AI')}</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <span className="t-meta">{t('โจทย์อื่น', 'Other solutions')}</span>
        <div className="soln-nav rv">
          {solutions.map((s) => (
            <Link
              key={s.slug}
              href={`/recommend/${s.slug}`}
              className={`soln-nav-item${s.slug === type ? ' is-active' : ''}`}
            >
              {en ? s.titleEn : s.title}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
