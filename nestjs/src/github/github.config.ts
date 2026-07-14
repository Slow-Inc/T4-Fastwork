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

/**
 * Repos whose detail (contributors, open PRs, README) the refresh fetches for
 * the project showcase (spec 2026-07-14, P6). Kept in sync with the GitHub-linked
 * projects in `nextjs/content/catalog.ts`. Once the CurateService flow populates
 * github-linked rows in the `projects` table, this is superseded by that query.
 */
export const GITHUB_SHOWCASE_REPOS: readonly { owner: string; repo: string }[] =
  [{ owner: GITHUB_ORG, repo: 'MangaDock' }];

/** Snapshot keys — the stable identity of a cached resource. */
export const snapshotKey = {
  memberRepos: (login: string) => `repos:${login}`,
  orgRepos: (org: string) => `org:${org}`,
  repoLanguages: (login: string, repo: string) => `languages:${login}/${repo}`,
  // Showcase detail resources (spec 2026-07-14, P1).
  repoContributors: (owner: string, repo: string) =>
    `repo:${owner}/${repo}:contributors`,
  repoPulls: (owner: string, repo: string) => `repo:${owner}/${repo}:pulls`,
  repoReadme: (owner: string, repo: string) => `repo:${owner}/${repo}:readme`,
  userProfile: (login: string) => `user:${login}`,
  userReadme: (login: string) => `user:${login}:readme`,
};

/** GitHub REST URLs. `sort=pushed` surfaces recently active repos first. */
export const githubUrl = {
  userRepos: (login: string) =>
    `https://api.github.com/users/${login}/repos?per_page=100&sort=pushed`,
  orgRepos: (org: string) =>
    `https://api.github.com/orgs/${org}/repos?per_page=100&sort=pushed`,
  repoLanguages: (login: string, repo: string) =>
    `https://api.github.com/repos/${login}/${repo}/languages`,
  // Showcase detail resources (spec 2026-07-14, P1).
  repoContributors: (owner: string, repo: string) =>
    `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`,
  repoPulls: (owner: string, repo: string) =>
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=100`,
  repoReadme: (owner: string, repo: string) =>
    `https://api.github.com/repos/${owner}/${repo}/readme`,
  userProfile: (login: string) => `https://api.github.com/users/${login}`,
  // The profile README lives in the special `<login>/<login>` repo.
  userReadme: (login: string) =>
    `https://api.github.com/repos/${login}/${login}/readme`,
};
