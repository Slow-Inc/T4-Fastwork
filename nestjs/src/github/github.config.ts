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

/** GitHub login/org: alphanumeric + hyphen. Repo: also dot and underscore. */
const OWNER_RE = /^[A-Za-z0-9-]+$/;
const REPO_RE = /^[A-Za-z0-9._-]+$/;

/**
 * Validate owner/repo for targeted refresh (#143). Keeps api.github.com URL
 * shape fixed — rejects path/query injection characters. Returns null when
 * either segment is missing or unsafe.
 */
export function parseSafeGithubOwnerRepo(
  owner: string | undefined,
  repo: string | undefined,
): { owner: string; repo: string } | null {
  if (!owner || !repo) return null;
  if (!OWNER_RE.test(owner) || !REPO_RE.test(repo)) return null;
  return { owner, repo };
}

/**
 * Reverse a snapshot key to the GitHub URL that heals it (spec ADR 0004, R1).
 * `readme: true` means the payload is a `/readme` response that must be decoded
 * with `parseReadme` before storing. Returns `null` for keys that are not
 * healable from GitHub (e.g. webhook `delivery:` markers, unknown shapes).
 */
export function resolveHealTarget(
  key: string,
): { url: string; readme: boolean } | null {
  // Segment charsets (defense-in-depth): GitHub logins/orgs are alphanumeric +
  // hyphen; repo names also allow dot and underscore. Restricting to these keeps
  // path/query characters (`/`, `..`, `?`, `#`, space) out of the fixed
  // api.github.com URL, so nothing beyond the intended resource can be reached.
  const OWNER = '[A-Za-z0-9-]+';
  const REPO = '[A-Za-z0-9._-]+';
  // repo:<owner>/<repo>:<sub>
  const repo = key.match(
    new RegExp(`^repo:(${OWNER})/(${REPO}):(contributors|pulls|readme)$`),
  );
  if (repo) {
    const [, owner, name, sub] = repo;
    if (sub === 'contributors')
      return { url: githubUrl.repoContributors(owner, name), readme: false };
    if (sub === 'pulls')
      return { url: githubUrl.repoPulls(owner, name), readme: false };
    return { url: githubUrl.repoReadme(owner, name), readme: true };
  }
  // user:<login>:readme  (must test before the plain user: case)
  const userReadme = key.match(new RegExp(`^user:(${OWNER}):readme$`));
  if (userReadme)
    return { url: githubUrl.userReadme(userReadme[1]), readme: true };
  // user:<login>
  const user = key.match(new RegExp(`^user:(${OWNER})$`));
  if (user) return { url: githubUrl.userProfile(user[1]), readme: false };
  // repos:<login>
  const repos = key.match(new RegExp(`^repos:(${OWNER})$`));
  if (repos) return { url: githubUrl.userRepos(repos[1]), readme: false };
  // org:<org>
  const org = key.match(new RegExp(`^org:(${OWNER})$`));
  if (org) return { url: githubUrl.orgRepos(org[1]), readme: false };
  return null;
}
