import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { BlogArticleContent } from '@/components/pages/blog-article-content';
import { blogPosts } from '@/content/blog';
import { getPostBySlug } from '@/lib/blog-repo';
import { pageAlternates } from '@/lib/seo';

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
    alternates: pageAlternates(`/blog/${slug}`),
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
        <BlogArticleContent post={p} />
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
