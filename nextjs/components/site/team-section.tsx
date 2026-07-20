import { getTeamMembers } from '@/lib/members-repo';
import { getTeamProjects } from '@/lib/member-content-repo';
import { TeamSectionClient } from './team-section-client';

/** /about + home "Team" (Requirement §4.6) — real roster from github.com/Slow-Inc.
 * Async server wrapper: fetches the roster + collaborative projects DB-first (static
 * fallback), then hands them to the client boundary for the locale switch (Epic C / C5). */
export async function TeamSection({ idx = '07 — Team' }: { idx?: string } = {}) {
  const [members, projects] = await Promise.all([getTeamMembers(), getTeamProjects()]);
  return <TeamSectionClient members={members} projects={projects} idx={idx} />;
}
