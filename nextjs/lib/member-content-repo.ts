import 'server-only';
import { publicDb } from '@/lib/public-db';
import {
  team,
  teamProjects as staticTeamProjects,
  type TeamProject,
  type TeamCertificate,
  type TeamOrgProject,
} from '@/content/site';
import {
  mapDbMemberProject,
  mapDbMemberCertificate,
  mapDbTeamProject,
  type DbMemberProjectRow,
  type DbMemberCertificateRow,
  type DbTeamProjectRow,
} from '@/lib/member-content-map';

/**
 * Member/team showcase content read from the DB (Epic C foundation), migrated out
 * of the static `content/site.ts`. DB-first with the static team as fallback so a
 * bad deploy degrades to today's behaviour — mirrors `blog-repo`/`certificates-repo`.
 * RLS keeps drafts (cert status) / unselected repos out of the public read.
 */

function staticProjects(slug: string): TeamProject[] {
  return team.find((m) => m.slug === slug)?.projects ?? [];
}
function staticCertificates(slug: string): TeamCertificate[] {
  return team.find((m) => m.slug === slug)?.certificates ?? [];
}

export async function getMemberProjects(slug: string): Promise<TeamProject[]> {
  try {
    const supabase = publicDb();
    const { data, error } = await supabase
      .from('member_projects')
      .select('name,description,url,tech,year,members!inner(slug)')
      .eq('members.slug', slug)
      // Human order (sort_order) wins; AI display-rank orders the rest (nulls last).
      .order('sort_order', { ascending: true })
      .order('ai_rank', { ascending: true, nullsFirst: false });
    // Empty is a valid result (member curated to zero selected repos) — only a DB
    // error falls back to the static seed, not an intentionally-empty selection.
    if (error || !data) return staticProjects(slug);
    return (data as unknown as DbMemberProjectRow[]).map(mapDbMemberProject);
  } catch {
    return staticProjects(slug);
  }
}

export async function getMemberCertificates(
  slug: string,
): Promise<TeamCertificate[]> {
  try {
    const supabase = publicDb();
    const { data, error } = await supabase
      .from('member_certificates')
      .select('issuer,title,asset_webp,asset_pdf,asset_img,members!inner(slug)')
      .eq('members.slug', slug)
      .order('sort_order', { ascending: true })
      .order('ai_rank', { ascending: true, nullsFirst: false });
    // Empty is a valid result (member curated to zero selected repos) — only a DB
    // error falls back to the static seed, not an intentionally-empty selection.
    if (error || !data) return staticCertificates(slug);
    return (data as unknown as DbMemberCertificateRow[]).map(
      mapDbMemberCertificate,
    );
  } catch {
    return staticCertificates(slug);
  }
}

export async function getTeamProjects(): Promise<TeamOrgProject[]> {
  try {
    const supabase = publicDb();
    const { data, error } = await supabase
      .from('team_projects')
      .select('name,description,url,tech,year,contributors')
      // No admin pin for collaborative work — the AI display-rank (B5) leads;
      // unranked rows fall back to their seed order (sort_order).
      .order('ai_rank', { ascending: true, nullsFirst: false })
      .order('sort_order', { ascending: true });
    // Empty is a valid result (member curated to zero selected repos) — only a DB
    // error falls back to the static seed, not an intentionally-empty selection.
    if (error || !data) return staticTeamProjects;
    return (data as unknown as DbTeamProjectRow[]).map(mapDbTeamProject);
  } catch {
    return staticTeamProjects;
  }
}
