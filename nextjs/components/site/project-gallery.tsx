import Link from 'next/link';
import { featuredProjects } from '@/content/projects';
import { orderByRank } from '@/lib/project-rank';

/** Homepage "Selected work" editorial gallery (Requirement §4.1.4/§4.1.5). When an AI
 * display-rank map is given (B5), the projects fill the mosaic best-first — the tile
 * SIZES stay by grid position so the composition is preserved, only the items reorder. */
export function ProjectGallery({ order }: { order?: Map<string, number> }) {
  const sizes = featuredProjects.map((p) => p.size); // positional mosaic sizes
  const items = order ? orderByRank(featuredProjects, order) : featuredProjects;
  return (
    <section id="work" className="section">
      <div className="work-head rv">
        <h2>Selected work</h2>
        <div style={{ textAlign: 'right' }}>
          <div className="t-idx">02 — Portfolio</div>
          <div className="t-meta" style={{ marginTop: 6 }}>
            2024 — 2026
          </div>
        </div>
      </div>
      <div className="gal rv">
        {items.map((p, i) => (
          <Link key={p.slug} href={`/projects/${p.slug}`} className={`proj p-${sizes[i]}`}>
            <div className={`shot tw t-${p.tone}`}>
              <span>{p.name}</span>
            </div>
            <div className="pcap">
              <span className="pnm">{p.caption}</span>
              <span className="t-meta">{p.tag}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
