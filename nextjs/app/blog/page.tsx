import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { Breadcrumb } from '@/components/site/breadcrumb';
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
        <section className="section section-page">
          <Breadcrumb items={[{ label: 'หน้าแรก', href: '/' }, { label: 'บทความ' }]} />
          <div className="page-head rv">
            <div className="t-idx">Blog</div>
            <h1>บทความ</h1>
            <p className="page-lead">
              มุมมองเชิงลึกเรื่องการสร้างผลิตภัณฑ์ดิจิทัล เว็บ AI และการเติบโตของธุรกิจ
            </p>
          </div>

          <form method="get" action="/blog" className="blog-search rv">
            <input
              type="search"
              name="q"
              defaultValue={q ?? ''}
              placeholder="ค้นหาบทความ…"
              aria-label="ค้นหาบทความ"
            />
            <button type="submit" className="filter-submit">ค้นหา</button>
          </form>

          {posts.length > 0 ? (
            <div className="blog-grid rv">
              {posts.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="blog-card">
                  <div className="blog-card-tags">
                    {p.tags.map((t) => (
                      <span key={t} className="t-meta">{t}</span>
                    ))}
                  </div>
                  <h3>{p.title}</h3>
                  <p className="blog-excerpt">{p.excerpt}</p>
                  <div className="blog-meta t-meta">
                    {p.publishedAt} · อ่าน {p.readTimeMin} นาที · {p.views} views
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state rv">
              <p>ไม่พบบทความที่ตรงกับคำค้น</p>
              <Link href="/blog" className="pcard-link">ดูบทความทั้งหมด</Link>
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
