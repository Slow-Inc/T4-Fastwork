import 'server-only';
import { publicDb } from '@/lib/public-db';
import { certificates as staticCertificates, type Certificate } from '@/content/site';
import { mapDbCertificate, type DbCertificateRow } from '@/lib/certificate-map';

/**
 * Certificates read from the DB (Requirement §4.7 / §6.8), cookieless so the
 * about/home pages stay static/ISR. Falls back to the static list on any error.
 */
export async function getCertificates(): Promise<Certificate[]> {
  try {
    const supabase = publicDb();
    const { data, error } = await supabase
      .from('certificates')
      .select('title, title_en, issuer, issuer_logo, issued_year, thumbnail, full_image, verify_url')
      .order('sort_order', { ascending: true });
    if (error || !data || data.length === 0) return staticCertificates;
    return (data as DbCertificateRow[]).map(mapDbCertificate);
  } catch {
    return staticCertificates;
  }
}
