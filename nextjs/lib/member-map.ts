import { type TeamMember } from '@/content/site';

/**
 * Pure `members` DB row → `TeamMember` mapper (Epic C / C5). Snake_case → camelCase;
 * null optionals (stack/education/githubUrl) are dropped so a DB-sourced member has
 * the same shape as the static one. Projects/certificates are attached separately by
 * the repo (they live in their own tables). No `server-only` import → unit-testable.
 */
export interface DbMemberRow {
  handle: string;
  slug: string;
  github_url: string | null;
  role: string;
  role_en: string;
  skills: string[] | null;
  stack: string[] | null;
  education: { program: string; institution: string } | null;
}

export function mapDbMember(row: DbMemberRow): TeamMember {
  const member: TeamMember = {
    handle: row.handle,
    slug: row.slug,
    role: row.role,
    roleEn: row.role_en,
    skills: row.skills ?? [],
  };
  if (row.github_url) member.githubUrl = row.github_url;
  if (row.stack) member.stack = row.stack;
  if (row.education) member.education = row.education;
  return member;
}
