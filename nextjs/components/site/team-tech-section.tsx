import { getTeamTechnologies } from '@/lib/members-repo';
import { TeamTechCarousel } from './team-tech-carousel';

/**
 * Async server wrapper for the home tech carousel — fetches the team tech union
 * DB-first (falls back to static). Keeps `TeamTechCarousel` pure/presentational.
 */
export async function TeamTechSection() {
  const techs = await getTeamTechnologies();
  return <TeamTechCarousel techs={techs} />;
}
