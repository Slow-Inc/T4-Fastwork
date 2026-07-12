import Link from 'next/link';
import { featuredProjects } from '@/content/projects';

/** Homepage "Selected work" editorial gallery (Requirement §4.1.4/§4.1.5). */
export function ProjectGallery() {
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
        {featuredProjects.map((p) => (
          <Link key={p.slug} href={`/projects/${p.slug}`} className={`proj p-${p.size}`}>
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
