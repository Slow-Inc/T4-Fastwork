/**
 * Client to the nestjs GitHub read API (ADR 0003, spec P4). Server-side only —
 * the team pages call this to overlay LIVE repo data (stars, description,
 * language, last push) on the curated `content/site.ts` identity. Any failure
 * (backend down, not deployed, network) returns `null` so the page falls back
 * to the static data and never blanks.
 *
 * Caching: Next revalidate + a per-login tag (webhook/refresh can bust it via
 * `revalidateTag(`gh:<login>`)`); Cloudflare adds the edge SWR layer.
 */
import {
  scheduleHeal,
  staleReposKeys,
  staleUserKeys,
  staleRepoDetailKeys,
} from './heal';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4100';

export interface LiveRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  pushed_at: string;
}

/** Extract the GitHub login from a profile URL (`https://github.com/<login>`). */
export function githubLogin(githubUrl: string | undefined): string | null {
  if (!githubUrl) return null;
  const m = githubUrl.match(/github\.com\/([^/?#]+)/i);
  return m ? m[1] : null;
}

/** Narrow the read-API payload (`{ data, stale } | null`) to a repo list. */
export function parseRepos(body: unknown): LiveRepo[] | null {
  const data = (body as { data?: unknown } | null)?.data;
  return Array.isArray(data) ? (data as LiveRepo[]) : null;
}

/** Fetch a member's live repos, or `null` on any failure (→ site.ts fallback). */
export async function getMemberLiveRepos(
  login: string,
): Promise<LiveRepo[] | null> {
  try {
    const res = await fetch(
      `${API_BASE}/github/repos/${encodeURIComponent(login)}`,
      { next: { revalidate: 60, tags: [`gh:${login}`] } },
    );
    if (!res.ok) return null;
    const body = await res.json();
    scheduleHeal(staleReposKeys(login, body)); // stale-while-heal (R4), post-response
    return parseRepos(body);
  } catch {
    return null;
  }
}

/** A member's live GitHub identity (spec 2026-07-14, P7). */
export interface LiveUser {
  login: string;
  avatarUrl: string | null;
  name: string | null;
  bio: string | null;
  /** Raw markdown of the profile README (`<login>/<login>` repo), or null. */
  profileReadme: string | null;
}

/** Narrow the `/github/users/:login` payload to a `LiveUser`, or null. */
export function parseUser(body: unknown): LiveUser | null {
  const b = body as
    | {
        profile?: { data?: { login?: string; avatar_url?: string; name?: string; bio?: string } | null } | null;
        readme?: { data?: { markdown?: string } | null } | null;
      }
    | null;
  const p = b?.profile?.data;
  if (!p || typeof p.login !== 'string') return null;
  return {
    login: p.login,
    avatarUrl: p.avatar_url ?? null,
    name: p.name ?? null,
    bio: p.bio ?? null,
    profileReadme: b?.readme?.data?.markdown ?? null,
  };
}

/** Live detail for one repo (project detail page, spec P6). */
export interface RepoDetail {
  contributors: {
    login: string;
    avatar_url: string;
    html_url: string;
    contributions: number;
  }[];
  pulls: { user: { login: string; avatar_url: string; html_url: string } | null }[];
  readme: string | null;
  /** GitHub language breakdown `{ language: bytes }` for the proportion donut. */
  languages: Record<string, number>;
}

/** Narrow the `/github/repos/:owner/:repo/detail` payload to a `RepoDetail`. */
export function parseRepoDetail(body: unknown): RepoDetail {
  const b = body as {
    contributors?: { data?: unknown } | null;
    pulls?: { data?: unknown } | null;
    readme?: { data?: { markdown?: string } | null } | null;
    languages?: { data?: unknown } | null;
  } | null;
  const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
  // Keep only positive numeric byte counts (a GitHub `/languages` map).
  const langs: Record<string, number> = {};
  const raw = b?.languages?.data;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [name, bytes] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof bytes === 'number' && bytes > 0) langs[name] = bytes;
    }
  }
  return {
    contributors: asArray(b?.contributors?.data) as RepoDetail['contributors'],
    pulls: asArray(b?.pulls?.data) as RepoDetail['pulls'],
    readme: b?.readme?.data?.markdown ?? null,
    languages: langs,
  };
}

/** Fetch a repo's contributors/pulls/README, or `null` on any failure. */
export async function getRepoDetail(
  owner: string,
  repo: string,
): Promise<RepoDetail | null> {
  try {
    const res = await fetch(
      `${API_BASE}/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/detail`,
      { next: { revalidate: 60, tags: [`gh:${owner}/${repo}`] } },
    );
    if (!res.ok) return null;
    const body = await res.json();
    scheduleHeal(staleRepoDetailKeys(owner, repo, body)); // stale-while-heal (R4)
    return parseRepoDetail(body);
  } catch {
    return null;
  }
}

/** Fetch a member's live profile + profile README, or `null` on any failure. */
export async function getMemberLiveUser(
  login: string,
): Promise<LiveUser | null> {
  try {
    const res = await fetch(
      `${API_BASE}/github/users/${encodeURIComponent(login)}`,
      { next: { revalidate: 60, tags: [`gh:${login}`] } },
    );
    if (!res.ok) return null;
    const body = await res.json();
    scheduleHeal(staleUserKeys(login, body)); // stale-while-heal (R4)
    return parseUser(body);
  } catch {
    return null;
  }
}

/**
 * Durable `/github/team` payload (org + members snapshots). Server-side only —
 * never hits GitHub. Returns `null` on any failure so Admin can fail safely.
 */
export async function getTeamSnapshotPayload(): Promise<unknown | null> {
  try {
    const res = await fetch(`${API_BASE}/github/team`, {
      next: { revalidate: 60, tags: ['gh:team'] },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
