/**
 * Promote a member's SELECTED GitHub repo (member_projects, shown on their /team
 * profile) into a `projects` row for the main showcase (/projects). Pure mapping +
 * de-dup so it's unit-tested; the admin server action wires it to the DB. The imported
 * row is a full CMS project the admin can enrich (category / screenshot / case study).
 */
import { normalizeHomepageToLiveUrl } from './live-url';

export interface MemberRepoInput {
  name: string;
  url: string; // the repo html_url, e.g. https://github.com/owner/repo
  description: string | null;
  ownerLogin: string | null; // the member's github_login
  /** Optional GitHub Website; when absent, Nest fill-live-urls backfills later. */
  homepage?: string | null;
}

export interface ProjectInsert {
  slug: string;
  title: string;
  description: string | null;
  source: 'github';
  status: 'published';
  published_at: string; // ISO
  gh_owner: string | null;
  gh_repo: string | null;
  gh_html_url: string;
  live_url: string | null;
  owner_type: 'personal';
  owner_login: string | null;
  is_featured: false;
}

export function slugifyRepo(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Parse owner/repo out of a github repo URL; null if it isn't one. */
export function parseGithubUrl(
  url: string,
): { owner: string; repo: string } | null {
  const m = url.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/i, '') };
}

/** Map a selected member repo to a published github-sourced projects row. */
export function memberRepoToProjectInsert(
  mp: MemberRepoInput,
  nowIso: string,
): ProjectInsert {
  const gh = parseGithubUrl(mp.url);
  return {
    slug: slugifyRepo(mp.name),
    title: mp.name,
    description: mp.description,
    source: 'github',
    status: 'published',
    published_at: nowIso,
    gh_owner: gh?.owner ?? mp.ownerLogin ?? null,
    gh_repo: gh?.repo ?? null,
    gh_html_url: mp.url,
    live_url: normalizeHomepageToLiveUrl(mp.homepage),
    owner_type: 'personal',
    owner_login: mp.ownerLogin,
    is_featured: false,
  };
}

/** The member repos not yet promoted to a project — de-duped by slug against the
 *  slugs already in `projects` (so re-import is a no-op / import-all is idempotent). */
export function availableToImport(
  memberRepos: MemberRepoInput[],
  existingProjectSlugs: string[],
): MemberRepoInput[] {
  const taken = new Set(existingProjectSlugs);
  const seen = new Set<string>();
  return memberRepos.filter((mp) => {
    const slug = slugifyRepo(mp.name);
    if (taken.has(slug) || seen.has(slug)) return false;
    seen.add(slug);
    return true;
  });
}
