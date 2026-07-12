import Link from 'next/link';
import type { Project } from '@/content/catalog';

/** Featured projects carousel (Requirement §4.1.4) — CSS scroll-snap track, no
 * JS needed; scrolls horizontally with snap points. */
export function FeaturedCarousel({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <section id="featured" className="section">
      <div className="work-head rv">
        <h2>Featured</h2>
        <div style={{ textAlign: 'right' }}>
          <div className="t-idx">01 — Featured</div>
          <div className="t-meta" style={{ marginTop: 6 }}>
            เลื่อนเพื่อดูเพิ่ม →
          </div>
        </div>
      </div>
      <div className="carousel-track rv">
        {projects.map((p) => (
          <Link key={p.slug} href={`/projects/${p.slug}`} className="carousel-slide">
            <div className={`carousel-shot tw t-${p.tone}`}>
              <span>{p.title}</span>
            </div>
            <div className="carousel-cap">
              <span className="pnm">{p.title}</span>
              <span className="t-meta">{p.category}</span>
            </div>
            <p className="carousel-desc">{p.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
