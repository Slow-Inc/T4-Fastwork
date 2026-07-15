import 'server-only';
import { publicDb } from '@/lib/public-db';
import { team, deriveTeamTechnologies, type TeamMember } from '@/content/site';
import { mapDbMember, type DbMemberRow } from '@/lib/member-map';
import {
  getMemberProjects,
  getMemberCertificates,
} from '@/lib/member-content-repo';

const MEMBER_SELECT =
  'handle,slug,github_url,role,role_en,skills,stack,education,readme_visible';

/**
 * Team tech union from the `members` DB table (`members.stack`) — the home tech
 * carousel's source (#44). DB-first with the static `team` as fallback (matches
 * the projects/blog repos). Once members become self-editable (Epic C), the
 * carousel reflects their edits with no component change.
 */
export async function getTeamTechnologies(): Promise<string[]> {
  const fallback = deriveTeamTechnologies(team);
  try {
    const supabase = publicDb();
    const { data, error } = await supabase.from('members').select('stack');
    if (error || !data || data.length === 0) return fallback;
    return deriveTeamTechnologies(
      (data as { stack: string[] | null }[]).map((r) => ({
        stack: r.stack ?? [],
      })),
    );
  } catch {
    return fallback;
  }
}

/**
 * The team roster from the `members` DB table (Epic C / C5), ordered by sort_order.
 * Profiles only (projects/certs are attached per-member by `getMemberBySlug`).
 * DB-first with the static `team` as fallback. Source for the home/about roster and
 * `/team` static params.
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const supabase = publicDb();
    const { data, error } = await supabase
      .from('members')
      .select(MEMBER_SELECT)
      .order('sort_order', { ascending: true });
    if (error || !data || data.length === 0) return team;
    return (data as unknown as DbMemberRow[]).map(mapDbMember);
  } catch {
    return team;
  }
}

/**
 * One member by slug with their projects + certificates attached from the
 * member-scoped tables (Epic C / C5). DB-first; the static team is the fallback for
 * the whole record so a bad deploy degrades to today's behaviour.
 */
export async function getMemberBySlug(
  slug: string,
): Promise<TeamMember | undefined> {
  const fallback = () => team.find((m) => m.slug === slug);
  try {
    const supabase = publicDb();
    const { data, error } = await supabase
      .from('members')
      .select(MEMBER_SELECT)
      .eq('slug', slug)
      .maybeSingle();
    if (error || !data) return fallback();
    const member = mapDbMember(data as unknown as DbMemberRow);
    const [projects, certificates] = await Promise.all([
      getMemberProjects(slug),
      getMemberCertificates(slug),
    ]);
    if (projects.length) member.projects = projects;
    if (certificates.length) member.certificates = certificates;
    return member;
  } catch {
    return fallback();
  }
}
