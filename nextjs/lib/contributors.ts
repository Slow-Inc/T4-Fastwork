/**
 * Classify a project's GitHub contributors for the detail page (spec
 * 2026-07-14, P6). Combines the merged contributors (contributors API) with
 * open-PR authors (not-yet-merged → `pending`), and tags each as a team member
 * (in the `site.ts` roster → links to `/team/[slug]`) or an external
 * contributor. Pure + server/client-agnostic so it is unit-tested directly.
 */
import { githubLogin } from './github';

export interface RawContributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export interface RawPull {
  user: { login: string; avatar_url: string; html_url: string } | null;
}

export interface RosterMember {
  slug: string;
  githubUrl?: string;
}

export interface ProjectContributor {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  contributions: number;
  status: 'merged' | 'pending';
  membership: 'team' | 'external';
  teamSlug?: string;
}

/** login (lowercased) → team slug, from the roster's GitHub profile URLs. */
function rosterIndex(roster: RosterMember[]): Map<string, string> {
  const idx = new Map<string, string>();
  for (const m of roster) {
    const login = githubLogin(m.githubUrl)?.toLowerCase();
    if (login) idx.set(login, m.slug);
  }
  return idx;
}

export function classifyContributors(
  contributors: RawContributor[],
  openPulls: RawPull[],
  roster: RosterMember[],
): ProjectContributor[] {
  const teamByLogin = rosterIndex(roster);

  const tag = (
    login: string,
    avatarUrl: string,
    htmlUrl: string,
    contributions: number,
    status: 'merged' | 'pending',
  ): ProjectContributor => {
    const teamSlug = teamByLogin.get(login.toLowerCase());
    return {
      login,
      avatarUrl,
      htmlUrl,
      contributions,
      status,
      membership: teamSlug ? 'team' : 'external',
      ...(teamSlug ? { teamSlug } : {}),
    };
  };

  const merged = contributors.map((c) =>
    tag(c.login, c.avatar_url, c.html_url, c.contributions, 'merged'),
  );
  merged.sort((a, b) => b.contributions - a.contributions);

  const mergedLogins = new Set(merged.map((c) => c.login.toLowerCase()));
  const seenPending = new Set<string>();
  const pending: ProjectContributor[] = [];
  for (const pr of openPulls) {
    const u = pr.user;
    if (!u) continue;
    const key = u.login.toLowerCase();
    if (mergedLogins.has(key) || seenPending.has(key)) continue;
    seenPending.add(key);
    pending.push(tag(u.login, u.avatar_url, u.html_url, 0, 'pending'));
  }

  return [...merged, ...pending];
}
