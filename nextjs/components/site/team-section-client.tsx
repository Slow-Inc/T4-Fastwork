'use client';

import { type TeamMember, type TeamOrgProject } from '@/content/site';
import { useLocale } from '@/i18n/locale-context';
import { TeamSectionView } from './team-section-view';

/** Client boundary: reads the locale (for the TH/EN switch) and renders the
 * hook-free {@link TeamSectionView} with the DB-sourced data handed down by the
 * server wrapper. */
export function TeamSectionClient({
  members,
  projects,
}: {
  members: TeamMember[];
  projects: TeamOrgProject[];
}) {
  const { locale } = useLocale();
  return <TeamSectionView en={locale === 'en'} members={members} projects={projects} />;
}
