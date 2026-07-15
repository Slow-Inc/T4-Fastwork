import {
  type TeamProject,
  type TeamCertificate,
  type TeamOrgProject,
} from '@/content/site';

/**
 * Pure DB-row → view-model mappers for the member-scoped content migrated out of
 * the static `content/site.ts` (Epic C foundation). Snake_case DB → camelCase view
 * models, mirroring `certificate-map.ts` / `blog-repo.mapDbPost`. No `server-only`
 * imports so they stay unit-testable.
 */

export interface DbMemberProjectRow {
  name: string;
  description: string | null;
  url: string;
  tech: string[] | null;
  year: number;
}

export function mapDbMemberProject(row: DbMemberProjectRow): TeamProject {
  return {
    name: row.name,
    description: row.description ?? '',
    url: row.url,
    tech: row.tech ?? [],
    year: row.year,
  };
}

export interface DbMemberCertificateRow {
  issuer: string;
  title: string;
  asset_webp: string | null;
  asset_pdf: string | null;
  asset_img: string | null;
}

export function mapDbMemberCertificate(
  row: DbMemberCertificateRow,
): TeamCertificate {
  const cert: TeamCertificate = { issuer: row.issuer, title: row.title };
  // The display image (webp) is what makes a cert renderable; without it the
  // lightbox has nothing to show, so we leave `asset` undefined (matches the
  // static shape where imageless certs carry no asset).
  if (row.asset_webp) {
    cert.asset = {
      webp: row.asset_webp,
      ...(row.asset_pdf ? { pdf: row.asset_pdf } : {}),
      ...(row.asset_img ? { img: row.asset_img } : {}),
    };
  }
  return cert;
}

export interface DbTeamProjectRow extends DbMemberProjectRow {
  contributors: string[] | null;
}

export function mapDbTeamProject(row: DbTeamProjectRow): TeamOrgProject {
  return {
    ...mapDbMemberProject(row),
    contributors: row.contributors ?? [],
  };
}
