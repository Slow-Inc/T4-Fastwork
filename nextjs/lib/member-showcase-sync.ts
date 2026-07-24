/**
 * Plan publish/unpublish of a personal showcase (`projects`) row when a member
 * toggles `member_projects.selected` (#178 / #179). Pure — no I/O.
 */
import { parseGithubUrl } from './member-repo-import';

export type ShowcaseProjectCandidate = {
  id: number;
  status: string;
  source: string;
  ownerType: string | null;
  ownerLogin: string | null;
  ghOwner: string | null;
  ghRepo: string | null;
  ghHtmlUrl: string | null;
};

export type ShowcaseSyncPlan =
  | { action: 'unpublish'; projectId: number }
  | { action: 'republish'; projectId: number }
  | { action: 'noop' };

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function identitiesMatch(
  memberLogin: string,
  memberRepoUrl: string,
  row: ShowcaseProjectCandidate,
): boolean {
  const login = norm(memberLogin);
  const rowOwner = row.ownerLogin ? norm(row.ownerLogin) : null;
  const rowGhOwner = row.ghOwner ? norm(row.ghOwner) : null;
  // Personal row must belong to this member.
  if (rowOwner !== login && rowGhOwner !== login) return false;

  const parsed = parseGithubUrl(memberRepoUrl);
  if (parsed && row.ghOwner && row.ghRepo) {
    if (
      norm(parsed.owner) === norm(row.ghOwner) &&
      norm(parsed.repo) === norm(row.ghRepo)
    ) {
      return true;
    }
  }
  if (row.ghHtmlUrl) {
    const a = parseGithubUrl(memberRepoUrl);
    const b = parseGithubUrl(row.ghHtmlUrl);
    if (
      a &&
      b &&
      norm(a.owner) === norm(b.owner) &&
      norm(a.repo) === norm(b.repo)
    ) {
      return true;
    }
  }
  return false;
}

function findMatch(
  memberGithubLogin: string,
  memberRepoUrl: string,
  projects: ShowcaseProjectCandidate[],
): ShowcaseProjectCandidate | null {
  for (const row of projects) {
    if (row.source !== 'github') continue;
    if (row.ownerType !== 'personal') continue;
    if (identitiesMatch(memberGithubLogin, memberRepoUrl, row)) return row;
  }
  return null;
}

/**
 * Decide whether toggling `selected` should change a personal showcase row.
 * Never creates rows; never targets team/org imports.
 */
export function planShowcaseSelectionSync(input: {
  selected: boolean;
  memberGithubLogin: string;
  memberRepoUrl: string;
  projects: ShowcaseProjectCandidate[];
}): ShowcaseSyncPlan {
  const match = findMatch(
    input.memberGithubLogin,
    input.memberRepoUrl,
    input.projects,
  );
  if (!match) return { action: 'noop' };

  if (!input.selected) {
    if (match.status === 'published') {
      return { action: 'unpublish', projectId: match.id };
    }
    return { action: 'noop' };
  }

  // selected === true
  if (match.status === 'published') return { action: 'noop' };
  return { action: 'republish', projectId: match.id };
}

export type MemberShowcaseSyncStore = {
  getMemberProject(
    id: number,
  ): Promise<{ id: number; url: string; memberId: number } | null>;
  getMemberGithubLogin(memberId: number): Promise<string | null>;
  listPersonalGithubProjects(): Promise<ShowcaseProjectCandidate[]>;
  setMemberProjectSelected(id: number, selected: boolean): Promise<void>;
  setProjectStatus(id: number, status: 'published' | 'hidden'): Promise<void>;
};

/**
 * Flip ``member_projects.selected`` then apply the showcase plan (#180).
 * Revalidate only when a project status actually changes.
 */
export async function applyMemberProjectSelectionToggle(input: {
  memberProjectId: number;
  selected: boolean;
  store: MemberShowcaseSyncStore;
  revalidate?: () => void;
}): Promise<
  | { ok: true; plan: ShowcaseSyncPlan }
  | { ok: false; error: string }
> {
  const mp = await input.store.getMemberProject(input.memberProjectId);
  if (!mp) return { ok: false, error: 'member project not found' };

  const login = await input.store.getMemberGithubLogin(mp.memberId);
  if (!login) return { ok: false, error: 'member has no github login' };

  const projects = await input.store.listPersonalGithubProjects();
  const plan = planShowcaseSelectionSync({
    selected: input.selected,
    memberGithubLogin: login,
    memberRepoUrl: mp.url,
    projects,
  });

  await input.store.setMemberProjectSelected(mp.id, input.selected);

  if (plan.action === 'unpublish') {
    await input.store.setProjectStatus(plan.projectId, 'hidden');
    input.revalidate?.();
  } else if (plan.action === 'republish') {
    await input.store.setProjectStatus(plan.projectId, 'published');
    input.revalidate?.();
  }

  return { ok: true, plan };
}

/** One-shot drift repair: personal published rows still selected=false (#182). */
export function planHistoricalShowcaseUnpublish(input: {
  memberRepos: {
    url: string;
    selected: boolean;
    memberGithubLogin: string;
  }[];
  projects: ShowcaseProjectCandidate[];
}): Extract<ShowcaseSyncPlan, { action: 'unpublish' }>[] {
  const out: Extract<ShowcaseSyncPlan, { action: 'unpublish' }>[] = [];
  const seen = new Set<number>();
  for (const mp of input.memberRepos) {
    if (mp.selected) continue;
    const plan = planShowcaseSelectionSync({
      selected: false,
      memberGithubLogin: mp.memberGithubLogin,
      memberRepoUrl: mp.url,
      projects: input.projects,
    });
    if (plan.action === 'unpublish' && !seen.has(plan.projectId)) {
      seen.add(plan.projectId);
      out.push(plan);
    }
  }
  return out;
}
