/**
 * Detect a published project row whose auto-filled fields never got filled (#222). Pure — no I/O.
 *
 * This is the check the sync-health predicates (#193) structurally cannot make. They ask "did a run
 * reach this project and did it fail", and the answer for #211 was yes-and-no: a webhook defers the
 * LLM actions on every run (`WEBHOOK_DEFERRED_ACTIONS`), deferral is not a failure, so the run
 * records clean while the page stays an empty shell. This invariant reads the row instead, so the
 * shell cannot hide behind a successful run — and it needs no new column and no migration, because
 * every field it reads already exists.
 */

import {
  authoritativeReadmeKeys,
  type ReadmeSnapshotState,
} from './missing-readme-backfill';

/** The auto-filled fields a visitor-facing project page depends on. */
export type IncompleteField = 'category' | 'content' | 'overview';

export interface ProjectCompleteness {
  slug: string;
  status: 'draft' | 'hidden' | 'published';
  source: 'github' | 'cms';
  categoryId: number | null;
  categoryOwner: 'auto' | 'human';
  content: string | null;
  contentOwner: 'auto' | 'human';
  overviewSummary: string | null;
  overviewOwner: 'auto' | 'human';
  /**
   * GitHub has no README for this repo, so the generators cannot fill `content` or `category` at
   * all — they return at `taxonomy-generate.ts:97` / `case-study-simple.ts:97`. Derived from #215's
   * negative-cache marker, not guessed from the row.
   */
  readmeMissing: boolean;
}

export interface IncompleteProject {
  slug: string;
  /** In a fixed order, so a report line for one project is stable between runs. */
  missing: IncompleteField[];
  /**
   * `no-readme` when the upstream file the generators need does not exist — nothing to fix in this
   * codebase. `never-reached` is the actionable one: the row *can* be filled and has not been.
   */
  reason: 'never-reached' | 'no-readme';
}

/** A project row as the store reads it — everything the invariant needs except the README verdict. */
export type CompletenessRow = Omit<ProjectCompleteness, 'readmeMissing'> & {
  ghOwner: string;
  ghRepo: string;
};

/**
 * Attach the README verdict from the snapshot states the missing-README backfill already reads
 * (`listReadmeSnapshotStates`), rather than a second query or a SQL join.
 *
 * Keys are compared case-insensitively: the key was built from whatever casing GitHub returned, and
 * a mismatch would report `never-reached` for a repo that simply has no README — sending someone to
 * look for a stalled queue that does not exist. No snapshot at all means the detail sync has not run
 * yet, and an **expired** marker means the backfill is about to re-check — both are unknown rather
 * than missing, so both stay `false`.
 */
export function resolveReadmeMissing(
  rows: readonly CompletenessRow[],
  states: readonly ReadmeSnapshotState[],
  now: Date = new Date(),
): ProjectCompleteness[] {
  // An EXPIRED marker is not evidence. #215 made it expire so the backfill re-checks the repo; if
  // this reader kept treating it as fact the two would disagree about the same row — and because a
  // `no-readme` row is excluded from the actionable count, the row #211 is about would be dropped
  // from the report meant to catch it. `authoritativeReadmeKeys` owns the TTL rule for both.
  const stillChecked = authoritativeReadmeKeys(states, now);
  const missingKeys = new Set(
    states
      .filter((s) => s.missing && stillChecked.has(s.key))
      .map((s) => s.key.toLowerCase()),
  );
  return rows.map(({ ghOwner, ghRepo, ...rest }) => ({
    ...rest,
    readmeMissing: missingKeys.has(
      `repo:${ghOwner}/${ghRepo}:readme`.toLowerCase(),
    ),
  }));
}

function isEmpty(value: string | null): boolean {
  return value == null || value.trim() === '';
}

/**
 * `null` when the row is fine or is not something a generator owes work on.
 *
 * Two exclusions, both deliberate: a **human-owned** empty field is an editorial decision, not a
 * defect (reporting it would train everyone to ignore the report), and a **draft or hidden** row is
 * expected to be incomplete while enrichment runs — the defect is a *published* page serving an
 * empty shell.
 */
export function incompleteProject(
  project: ProjectCompleteness,
): IncompleteProject | null {
  if (project.status !== 'published') return null;
  if (project.source !== 'github') return null;

  const missing: IncompleteField[] = [];
  if (project.categoryOwner === 'auto' && project.categoryId == null) {
    missing.push('category');
  }
  // `trim()` matches `shouldRegenCaseStudy` (`project-automation-sync.ts:126`); disagreeing with the
  // planner would report a row it considers filled, or hide one it is about to refill.
  if (project.contentOwner === 'auto' && isEmpty(project.content)) {
    missing.push('content');
  }
  if (project.overviewOwner === 'auto' && isEmpty(project.overviewSummary)) {
    missing.push('overview');
  }
  if (!missing.length) return null;

  return {
    slug: project.slug,
    missing,
    reason: project.readmeMissing ? 'no-readme' : 'never-reached',
  };
}

/** The incomplete subset, in input order. Empty means every published row is enriched. */
export function incompleteProjects(
  projects: readonly ProjectCompleteness[],
): IncompleteProject[] {
  const out: IncompleteProject[] = [];
  for (const p of projects) {
    const bad = incompleteProject(p);
    if (bad) out.push(bad);
  }
  return out;
}
