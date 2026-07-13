'use client';

import Link from 'next/link';
import { Breadcrumb } from '@/components/site/breadcrumb';
import type { BlogPost } from '@/content/blog';
import { useLocale } from '@/i18n/locale-context';
import { staggerDelay } from '@/lib/stagger';

export function BlogListContent({ posts, q }: { posts: BlogPost[]; q?: string }) {
  const { locale } = useLocale();
  const en = locale === 'en';
  const t = (th: string, e: string) => (en ? e : th);

  return (
    <section className="section section-page">
      <Breadcrumb items={[{ label: t('หน้าแรก', 'Home'), href: '/' }, { label: t('บทความ', 'Blog') }]} />
      <div className="page-head rv">
        <div className="t-idx">Blog</div>
        <h1>{t('บทความ', 'Blog')}</h1>
        <p className="page-lead">
          {t(
            'มุมมองเชิงลึกเรื่องการสร้างผลิตภัณฑ์ดิจิทัล เว็บ AI และการเติบโตของธุรกิจ',
            'In-depth takes on building digital products, web, AI and business growth.',
          )}
        </p>
      </div>

      <form method="get" action="/blog" className="blog-search rv rv-down">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder={t('ค้นหาบทความ…', 'Search articles…')}
          aria-label={t('ค้นหาบทความ', 'Search articles')}
        />
        <button type="submit" className="filter-submit">{t('ค้นหา', 'Search')}</button>
      </form>

      {posts.length > 0 ? (
        <div className="blog-grid">
          {posts.map((p, i) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="blog-card rv rv-down"
              style={{ transitionDelay: staggerDelay(i) }}
            >
              <div className="blog-card-tags">
                {p.tags.map((tag) => (
                  <span key={tag} className="t-meta">{tag}</span>
                ))}
              </div>
              <h3>{en && p.titleEn ? p.titleEn : p.title}</h3>
              <p className="blog-excerpt">{en && p.excerptEn ? p.excerptEn : p.excerpt}</p>
              <div className="blog-meta t-meta">
                {p.publishedAt} · {t('อ่าน', 'read')} {p.readTimeMin} {t('นาที', 'min')} · {p.views} views
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state rv rv-down">
          <p>{t('ไม่พบบทความที่ตรงกับคำค้น', 'No articles match your search')}</p>
          <Link href="/blog" className="pcard-link">{t('ดูบทความทั้งหมด', 'View all articles')}</Link>
        </div>
      )}
    </section>
  );
}
