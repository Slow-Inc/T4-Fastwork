/**
 * Auto-curation for the project showcase (spec 2026-07-14, P2). Decides which
 * synced repos become portfolio entries — purely rule-based, no human — and
 * maps an eligible repo to a `draft` `projects` row (`source='github'`, every
 * field `auto`-owned) awaiting the one-time first-run approval.
 *
 * The rules live here as pure functions so they are trivially unit-tested and
 * tunable in one place; `CurateService` wires them to a durable store.
 */
import { GITHUB_ORG } from './github.config';

/** Subset of a GitHub repo object the curation rules read. */
export interface CurateRepo {
  name: string;
  owner: { login: string };
  html_url: string;
  description: string | null;
  fork: boolean;
  archived: boolean;
  private: boolean;
  stargazers_count: number;
  pushed_at: string;
  topics?: string[];
}

/** A draft `projects` row synthesised from a repo (all content fields auto). */
export interface DraftProject {
  slug: string;
  title: string;
  source: 'github';
  status: 'draft';
  ghOwner: string;
  ghRepo: string;
  ghHtmlUrl: string;
  ownerType: 'team' | 'personal';
  ownerLogin: string;
  titleOwner: 'auto';
  titleEnOwner: 'auto';
  descriptionOwner: 'auto';
  contentOwner: 'auto';
  categoryOwner: 'auto';
  tagsOwner: 'auto';
  technologiesOwner: 'auto';
}

export interface ProjectDraftStore {
  existsBySlug(slug: string): Promise<boolean>;
  insertDraft(row: DraftProject): Promise<void>;
}

const MAX_AGE_MONTHS = 18;
const JUNK_NAMES = /^(test|tests|scratch|tmp|temp|demo|sandbox|playground)$/i;

function isJunkName(repo: CurateRepo): boolean {
  if (JUNK_NAMES.test(repo.name)) return true;
  if (repo.name.startsWith('.')) return true; // .github, dotfiles
  if (repo.name.toLowerCase() === repo.owner.login.toLowerCase()) return true; // profile repo
  return false;
}

function monthsBetween(fromIso: string, now: Date): number {
  const from = new Date(fromIso).getTime();
  return (now.getTime() - from) / (1000 * 60 * 60 * 24 * 30.44);
}

/** True when a repo should surface as a portfolio entry (spec §Curation rules). */
export function isEligibleRepo(repo: CurateRepo, now: Date): boolean {
  if (repo.private || repo.fork || repo.archived) return false;
  if (isJunkName(repo)) return false;
  const hasContent =
    Boolean(repo.description) ||
    repo.stargazers_count > 0 ||
    (repo.topics?.length ?? 0) > 0;
  if (!hasContent) return false;
  if (monthsBetween(repo.pushed_at, now) > MAX_AGE_MONTHS) return false;
  return true;
}

/** `team` for the org's repos, `personal` for a member's own account. */
export function deriveOwnerType(login: string): 'team' | 'personal' {
  return login === GITHUB_ORG ? 'team' : 'personal';
}

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Map an eligible repo to a draft `projects` row (every field auto-owned). */
export function repoToDraftProject(repo: CurateRepo): DraftProject {
  return {
    slug: slugify(repo.name),
    title: repo.name,
    source: 'github',
    status: 'draft',
    ghOwner: repo.owner.login,
    ghRepo: repo.name,
    ghHtmlUrl: repo.html_url,
    ownerType: deriveOwnerType(repo.owner.login),
    ownerLogin: repo.owner.login,
    titleOwner: 'auto',
    titleEnOwner: 'auto',
    descriptionOwner: 'auto',
    contentOwner: 'auto',
    categoryOwner: 'auto',
    tagsOwner: 'auto',
    technologiesOwner: 'auto',
  };
}

export class CurateService {
  constructor(
    private readonly store: ProjectDraftStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /**
   * For each eligible, not-yet-tracked repo, insert a draft project. Returns the
   * slugs newly inserted (already-tracked and ineligible repos are skipped).
   */
  async curate(repos: CurateRepo[]): Promise<{ inserted: string[] }> {
    const now = this.now();
    const inserted: string[] = [];
    for (const repo of repos) {
      if (!isEligibleRepo(repo, now)) continue;
      const draft = repoToDraftProject(repo);
      if (await this.store.existsBySlug(draft.slug)) continue;
      await this.store.insertDraft(draft);
      inserted.push(draft.slug);
    }
    return { inserted };
  }
}
