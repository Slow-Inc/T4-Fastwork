/**
 * Promote a Slow-Inc organization repo (from the durable `/github/team` org
 * snapshot) into a published `projects` row. Pure mapping + catalogue validation
 * so Admin Server Actions never trust browser owner/repo fields as truth —
 * they re-resolve against the snapshot first. Mirrors `member-repo-import.ts`
 * but binds team ownership (`owner_type='team'`, `owner_login=Slow-Inc`).
 */
import { slugifyRepo } from './member-repo-import';

/** Canonical org login for team-owned showcase imports (mirrors nest GITHUB_ORG). */
export const SLOW_INC_ORG = 'Slow-Inc';

export interface OrgRepoInput {
  name: string;
  htmlUrl: string;
  description: string | null;
}

export interface OrgProjectInsert {
  slug: string;
  title: string;
  description: string | null;
  source: 'github';
  status: 'published';
  published_at: string;
  gh_owner: string;
  gh_repo: string;
  gh_html_url: string;
  owner_type: 'team';
  owner_login: string;
  is_featured: false;
}

export interface ExistingProjectIdentity {
  slug: string;
  ghOwner: string | null;
  ghRepo: string | null;
}

function sameIdentity(
  aOwner: string,
  aRepo: string,
  bOwner: string | null,
  bRepo: string | null,
): boolean {
  if (!bOwner || !bRepo) return false;
  return (
    aOwner.toLowerCase() === bOwner.toLowerCase() &&
    aRepo.toLowerCase() === bRepo.toLowerCase()
  );
}

/** Map a Slow-Inc org repo to a published team-owned github-sourced project row. */
export function orgRepoToProjectInsert(
  repo: OrgRepoInput,
  nowIso: string,
  org: string = SLOW_INC_ORG,
): OrgProjectInsert {
  return {
    slug: slugifyRepo(repo.name),
    title: repo.name,
    description: repo.description,
    source: 'github',
    status: 'published',
    published_at: nowIso,
    gh_owner: org,
    gh_repo: repo.name,
    gh_html_url: repo.htmlUrl,
    owner_type: 'team',
    owner_login: org,
    is_featured: false,
  };
}

/**
 * Org repos not yet represented in `projects` — de-duped by slug and by
 * canonical `gh_owner`/`gh_repo` so retry / import-all stay idempotent.
 */
export function availableOrgReposToImport(
  orgRepos: OrgRepoInput[],
  existing: ExistingProjectIdentity[],
): OrgRepoInput[] {
  const takenSlugs = new Set(existing.map((p) => p.slug));
  const seen = new Set<string>();
  return orgRepos.filter((repo) => {
    const slug = slugifyRepo(repo.name);
    if (takenSlugs.has(slug) || seen.has(slug)) return false;
    const alreadyBound = existing.some((p) =>
      sameIdentity(SLOW_INC_ORG, repo.name, p.ghOwner, p.ghRepo),
    );
    if (alreadyBound) return false;
    seen.add(slug);
    return true;
  });
}

/** Bulk path: map the missing set to published team insert rows (empty = no-op). */
export function orgReposToBulkInserts(
  catalogue: OrgRepoInput[],
  existing: ExistingProjectIdentity[],
  nowIso: string,
  org: string = SLOW_INC_ORG,
): OrgProjectInsert[] {
  return availableOrgReposToImport(catalogue, existing).map((repo) =>
    orgRepoToProjectInsert(repo, nowIso, org),
  );
}

function narrowOrgRepo(raw: unknown, expectedOrg: string): OrgRepoInput | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const owner = r.owner as { login?: unknown } | undefined;
  if (
    typeof r.name !== 'string' ||
    typeof r.html_url !== 'string' ||
    !owner ||
    typeof owner.login !== 'string'
  ) {
    return null;
  }
  if (owner.login.toLowerCase() !== expectedOrg.toLowerCase()) return null;
  return {
    name: r.name,
    htmlUrl: r.html_url,
    description: typeof r.description === 'string' ? r.description : null,
  };
}

/**
 * Server-side catalogue check: only return a repo when the requested identity
 * appears in the Slow-Inc org snapshot. Forged form fields fail closed.
 */
export function resolveOrgRepoFromSnapshot(
  snapshotData: unknown,
  owner: string,
  repo: string,
  expectedOrg: string = SLOW_INC_ORG,
): OrgRepoInput | null {
  if (owner.toLowerCase() !== expectedOrg.toLowerCase()) return null;
  if (!Array.isArray(snapshotData)) return null;
  for (const raw of snapshotData) {
    const narrowed = narrowOrgRepo(raw, expectedOrg);
    if (!narrowed) continue;
    if (narrowed.name.toLowerCase() === repo.toLowerCase()) return narrowed;
  }
  return null;
}

/**
 * Narrow `/github/team` JSON to Slow-Inc org repos. `null` = missing/malformed
 * snapshot (Admin must show a safe empty/error state, never invent repos).
 */
export function parseOrgReposFromTeamPayload(
  body: unknown,
  expectedOrg: string = SLOW_INC_ORG,
): OrgRepoInput[] | null {
  if (!body || typeof body !== 'object') return null;
  const org = (body as { org?: unknown }).org;
  if (!org || typeof org !== 'object') return null;
  const data = (org as { data?: unknown }).data;
  if (!Array.isArray(data)) return null;
  const out: OrgRepoInput[] = [];
  for (const raw of data) {
    const narrowed = narrowOrgRepo(raw, expectedOrg);
    if (narrowed) out.push(narrowed);
  }
  return out;
}
