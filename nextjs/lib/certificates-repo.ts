import 'server-only';
import { publicDb } from '@/lib/public-db';
import { type Certificate } from '@/content/site';
import { teamCertificates } from '@/lib/team-certs';
import { mapDbCertificate, type DbCertificateRow } from '@/lib/certificate-map';

/**
 * Certificates read from the DB (Requirement §4.7 / §6.8), cookieless so the
 * about/home pages stay static/ISR. Falls back to the real, image-backed team
 * certificates (`teamCertificates()`) — NOT the imageless org list — so the
 * home/about lightbox always shows a real certificate image, matching the
 * per-member team pages (spec P8 fix).
 */
export async function getCertificates(): Promise<Certificate[]> {
  const fallback = teamCertificates();
  try {
    const supabase = publicDb();
    const { data, error } = await supabase
      .from('certificates')
      .select('title, title_en, issuer, issuer_logo, issued_year, thumbnail, full_image, verify_url, is_featured')
      // Featured pins win, then human sort_order, then AI display-rank (nulls last).
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('ai_rank', { ascending: true, nullsFirst: false });
    if (error || !data || data.length === 0) return fallback;
    const mapped = (data as DbCertificateRow[]).map(mapDbCertificate);
    // Guard: if the DB rows carry no image at all, the lightbox would render a
    // blank box — prefer the image-backed team certs instead.
    return mapped.some((c) => c.thumbnail || c.fullImage) ? mapped : fallback;
  } catch {
    return fallback;
  }
}
