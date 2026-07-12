'use client';

import Link from 'next/link';
import { Breadcrumb } from '@/components/site/breadcrumb';
import type { BlogPost } from '@/content/blog';
import { useLocale } from '@/i18n/locale-context';

export function BlogArticleContent({ post: p }: { post: BlogPost }) {
  const { locale } = useLocale();
  const en = locale === 'en';
  const t = (th: string, e: string) => (en ? e : th);
  const title = en && p.titleEn ? p.titleEn : p.title;
  const excerpt = en && p.excerptEn ? p.excerptEn : p.excerpt;
  const content = en && p.contentEn ? p.contentEn : p.content;

  return (
    <article className="section section-page blog-article">
      <Breadcrumb
        items={[
          { label: t('หน้าแรก', 'Home'), href: '/' },
          { label: t('บทความ', 'Blog'), href: '/blog' },
          { label: title },
        ]}
      />
      <div className="blog-article-head rv">
        <div className="blog-card-tags">
          {p.tags.map((tag) => (
            <span key={tag} className="t-meta">{tag}</span>
          ))}
        </div>
        <h1>{title}</h1>
        <div className="blog-meta t-meta">
          {p.author} · {p.publishedAt} · {t('อ่าน', 'read')} {p.readTimeMin} {t('นาที', 'min')}
        </div>
      </div>

      <div className="blog-body rv">
        <p className="blog-lead">{excerpt}</p>
        {content.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <div className="detail-cta rv">
        <Link href="/chat" className="btn">{t('คุยโจทย์กับ AI', 'Talk to AI')}</Link>
        <Link href="/blog" className="btn ghost">{t('← บทความอื่น', '← More articles')}</Link>
      </div>
    </article>
  );
}
