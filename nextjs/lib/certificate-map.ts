import type { Certificate } from '@/content/site';

/**
 * Pure mapping between the DB certificates row shape and the Certificate view
 * model (Requirement §6.8). Kept free of server-only imports so it is
 * unit-testable.
 */
export interface DbCertificateRow {
  title: string;
  title_en?: string | null;
  issuer: string;
  issuer_logo?: string | null;
  issued_year?: number | null;
  thumbnail?: string | null;
  full_image?: string | null;
  verify_url?: string | null;
}

export function mapDbCertificate(row: DbCertificateRow): Certificate {
  return {
    title: row.title,
    titleEn: row.title_en ?? undefined,
    issuer: row.issuer,
    issuerLogo: row.issuer_logo ?? undefined,
    issuedYear: row.issued_year ?? undefined,
    thumbnail: row.thumbnail ?? undefined,
    fullImage: row.full_image ?? undefined,
    verifyUrl: row.verify_url ?? undefined,
  };
}

/** §4.7 requires full_image to support both images and PDF (rendered as a thumbnail link). */
export function isPdfUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.toLowerCase().split('?')[0].endsWith('.pdf');
}
