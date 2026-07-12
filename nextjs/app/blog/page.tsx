import type { Metadata } from 'next';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { BlogListContent } from '@/components/pages/blog-list-content';
import { getPosts } from '@/lib/blog-repo';

export const metadata: Metadata = {
  title: 'บทความ — T4 Labs',
  description:
    'บทความเกี่ยวกับการพัฒนาเว็บ, AI, SaaS และการตลาดดิจิทัลจากทีม T4 Labs — เนื้อหาเชิงลึกสำหรับ founder และทีมเทค',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function BlogPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const posts = await getPosts(q);

  return (
    <>
      <SiteNav />
      <div className="wrap">
        <BlogListContent posts={posts} q={q} />
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
