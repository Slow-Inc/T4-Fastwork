import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { Breadcrumb } from '@/components/site/breadcrumb';
import { getProject, projects } from '@/content/catalog';

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return { title: 'ไม่พบผลงาน — T4 Labs' };
  return {
    title: `${p.title} — ผลงาน T4 Labs`,
    description: p.description,
    openGraph: {
      title: p.title,
      description: p.description,
      type: 'article',
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.title,
    description: p.description,
    keywords: [...p.tags, ...p.technologies].join(', '),
    ...(p.liveUrl ? { url: p.liveUrl } : {}),
    creator: { '@type': 'Organization', name: 'T4 Labs' },
  };

  return (
    <>
      <SiteNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="wrap">
        <article className="section section-page">
          <Breadcrumb
            items={[
              { label: 'หน้าแรก', href: '/' },
              { label: 'ผลงาน', href: '/projects' },
              { label: p.title },
            ]}
          />

          <div className="detail-head rv">
            <div className="t-idx">{p.category}</div>
            <h1>{p.title}</h1>
            <p className="page-lead">{p.description}</p>
          </div>

          <div className={`detail-shot tw t-${p.tone} rv`}>
            <span>{p.title}</span>
          </div>

          <div className="detail-grid">
            <div className="detail-content rv">
              {p.content.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <aside className="detail-meta rv">
              <div className="meta-block">
                <span className="t-meta">เทคโนโลยี</span>
                <ul className="chip-row">
                  {p.technologies.map((t) => (
                    <li key={t} className="chip">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="meta-block">
                <span className="t-meta">แท็ก</span>
                <ul className="chip-row">
                  {p.tags.map((t) => (
                    <li key={t} className="chip chip-muted">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="meta-block">
                <span className="t-meta">ปี</span>
                <p>{p.year}</p>
              </div>
              {p.liveUrl && (
                <a
                  href={p.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                >
                  ดูเว็บจริง ↗
                </a>
              )}
            </aside>
          </div>

          <div className="detail-cta rv">
            <Link href="/chat" className="btn">
              คุยกับ AI ดูงานคล้ายกัน
            </Link>
            <Link href="/contact" className="btn ghost">
              ติดต่อจ้างงาน
            </Link>
          </div>
        </article>
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
