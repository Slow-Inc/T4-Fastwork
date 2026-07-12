import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { Breadcrumb } from '@/components/site/breadcrumb';
import { blogPosts } from '@/content/blog';
import { getPostBySlug } from '@/lib/blog-repo';

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPostBySlug(slug);
  if (!p) return { title: 'ไม่พบบทความ — T4 Labs' };
  return {
    title: `${p.title} — T4 Labs`,
    description: p.excerpt,
    openGraph: {
      title: p.title,
      description: p.excerpt,
      type: 'article',
      publishedTime: p.publishedAt,
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const p = await getPostBySlug(slug);
  if (!p) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.excerpt,
    datePublished: p.publishedAt,
    author: { '@type': 'Organization', name: p.author },
    keywords: p.tags.join(', '),
  };

  return (
    <>
      <SiteNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="wrap">
        <article className="section section-page blog-article">
          <Breadcrumb
            items={[
              { label: 'หน้าแรก', href: '/' },
              { label: 'บทความ', href: '/blog' },
              { label: p.title },
            ]}
          />
          <div className="blog-article-head rv">
            <div className="blog-card-tags">
              {p.tags.map((t) => (
                <span key={t} className="t-meta">{t}</span>
              ))}
            </div>
            <h1>{p.title}</h1>
            <div className="blog-meta t-meta">
              {p.author} · {p.publishedAt} · อ่าน {p.readTimeMin} นาที
            </div>
          </div>

          <div className="blog-body rv">
            <p className="blog-lead">{p.excerpt}</p>
            {p.content.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <div className="detail-cta rv">
            <Link href="/chat" className="btn">คุยโจทย์กับ AI</Link>
            <Link href="/blog" className="btn ghost">← บทความอื่น</Link>
          </div>
        </article>
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
