import Link from 'next/link';
import type { Project } from '@/content/catalog';

export interface GalleryItem {
  slug: string;
  name: string;
  caption: string;
  tag: string;
  tone: Project['tone'];
  size: 'a' | 'b' | 'c' | 'd';
}

const sizes: GalleryItem['size'][] = ['a', 'b', 'c', 'd'];

export function galleryItems(projects: Project[]): GalleryItem[] {
  return projects.slice(0, 4).map((project, index) => ({
    slug: project.slug,
    name: project.title,
    caption: `${project.title} — ${project.description}`.slice(0, 60),
    tag: project.category || project.technologies[0] || '',
    tone: project.tone,
    size: sizes[index]!,
  }));
}

/** Homepage "Selected work" editorial gallery (Requirement §4.1.4/§4.1.5). When an AI
 * display-rank map is given (B5), the projects fill the mosaic best-first — the tile
 * SIZES stay by grid position so the composition is preserved, only the items reorder. */
export function ProjectGallery({ items: projects }: { items: Project[] }) {
  const items = galleryItems(projects);
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
        {items.map((p) => (
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
