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
    return parseRepos(await res.json());
  } catch {
    return null;
  }
}
