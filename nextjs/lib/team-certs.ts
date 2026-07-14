import { team, type Certificate } from '@/content/site';

/**
 * Aggregate the real, image-backed certificates from every team member into the
 * home/about `Certificate` shape (spec 2026-07-14, P8 fix). The org-level
 * `certificates` list in `site.ts` carries only issuer+title (no asset), so the
 * home/about lightbox rendered a blank box. The per-member `TeamCertificate`s
 * DO have the real files under `public/certificates/<member>/…` — this maps
 * them (deduped by issuer+title) so home/about show the exact same images as
 * the individual `/team/[slug]` pages. Certs without an asset are skipped.
 */
export function teamCertificates(): Certificate[] {
  const seen = new Set<string>();
  const out: Certificate[] = [];
  for (const member of team) {
    for (const c of member.certificates ?? []) {
      if (!c.asset) continue;
      const key = `${c.issuer}|${c.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        issuer: c.issuer,
        title: c.title,
        // webp is always present and is an image (never a PDF), so the home
        // lightbox previews it directly.
        thumbnail: c.asset.webp,
        fullImage: c.asset.webp,
      });
    }
  }
  return out;
}
