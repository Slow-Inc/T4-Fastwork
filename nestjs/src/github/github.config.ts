/**
 * Which GitHub accounts the portfolio pulls (ADR 0003). Mirrors the curated
 * team in `nextjs/content/site.ts` — the logins of members that have a public
 * GitHub, plus the org whose repos are the team's "team work". Kept as a small
 * server-side constant (not imported cross-app) so the fetch layer has no
 * dependency on the frontend package. Members without a GitHub (e.g. `_InI4`)
 * are omitted here and render from `site.ts` only.
 */
export const GITHUB_ORG = 'Slow-Inc';

export const GITHUB_MEMBERS: readonly string[] = [
  'Slowgers',
  'xenodeve',
  'akkanop-x',
  'ThanathornZDev',
  'CableMoMo2027',
];

/** Snapshot keys — the stable identity of a cached resource. */
export const snapshotKey = {
  memberRepos: (login: string) => `repos:${login}`,
  orgRepos: (org: string) => `org:${org}`,
  repoLanguages: (login: string, repo: string) => `languages:${login}/${repo}`,
};

/** GitHub REST URLs. `sort=pushed` surfaces recently active repos first. */
export const githubUrl = {
  userRepos: (login: string) =>
    `https://api.github.com/users/${login}/repos?per_page=100&sort=pushed`,
  orgRepos: (org: string) =>
    `https://api.github.com/orgs/${org}/repos?per_page=100&sort=pushed`,
  repoLanguages: (login: string, repo: string) =>
    `https://api.github.com/repos/${login}/${repo}/languages`,
};
