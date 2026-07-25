/**
 * Detect a project whose showcase sync is stuck or failing (#193 / #185 S8). Pure — no I/O.
 *
 * `runPipelineSync` is fail-soft: it reports failed actions and never throws
 * (`pipeline-sync.ts:69`), which is right for a batch job but means a project can fail on every run
 * while every run returns a success-shaped result. #211 was that defect found by hand, on a page a
 * visitor happened to open. These predicates make the same class of problem reportable.
 */

export interface ProjectSyncHealth {
  slug: string;
  /** Last run that reached this project; null when it has never been synced. */
  lastSyncedAt: Date | null;
  /** The last run's error for this project, or null when it succeeded. */
  lastSyncError: string | null;
}

export type UnhealthyReason = 'error' | 'stuck' | 'never';

export interface UnhealthyProject {
  slug: string;
  reason: UnhealthyReason;
  /** The recorded error for `error`; a human-readable age for the other reasons. */
  detail: string;
}

/**
 * How many expected revisits a project may miss before it counts as stuck.
 *
 * Three, because GitHub Actions schedules drift by tens of minutes — one or two missed revisits is
 * normal, and alerting there would train everyone to ignore the signal.
 */
export const STUCK_AFTER_REVISITS = 3;

/**
 * `null` when the project looks healthy. An error outranks staleness: a stale-and-failing project
 * should be reported by the cause someone can act on, not by its age.
 */
/**
 * @param revisitIntervalMs How often a *single* project is expected to be reached — **not** the cron
 *   period. `refreshAll` rotates a budget of 8 repos per hourly run over ~47 published github repos
 *   (`github-refresh.service.ts:47,53-62`), so a given project is revisited roughly every 6 hours.
 *   Passing the 1-hour cron period here would report almost every healthy project as stuck.
 */
export function isSyncUnhealthy(
  project: ProjectSyncHealth,
  revisitIntervalMs: number,
  now: Date = new Date(),
): UnhealthyProject | null {
  if (project.lastSyncError) {
    return {
      slug: project.slug,
      reason: 'error',
      detail: project.lastSyncError,
    };
  }
  if (!project.lastSyncedAt) {
    return { slug: project.slug, reason: 'never', detail: 'never synced' };
  }
  const ageMs = now.getTime() - project.lastSyncedAt.getTime();
  if (ageMs > revisitIntervalMs * STUCK_AFTER_REVISITS) {
    const hours = Math.floor(ageMs / 3_600_000);
    return { slug: project.slug, reason: 'stuck', detail: `${hours}h stale` };
  }
  return null;
}

/**
 * The `lastSyncError` value for one run's failures — `null` when nothing failed, so a run that
 * succeeds *clears* the column instead of leaving a fixed problem reported forever.
 *
 * Every failure is named, not just the first: the pipeline isolates actions so one throw does not
 * cancel the rest (`pipeline-sync.ts:150-161`), so a run can genuinely break in two unrelated
 * places and reporting one would hide the other behind the fix for it.
 *
 * Lives beside `isSyncUnhealthy` deliberately — this writes the column that predicate reads, and
 * separating the writer from the reader is how the two formats drift apart.
 */
export function summarizeSyncFailures(
  failures: readonly { action: string; error: string }[],
): string | null {
  if (!failures.length) return null;
  return failures.map((f) => `${f.action}: ${f.error}`).join('; ');
}

/** The unhealthy subset, in input order. Empty means a quiet run stays quiet. */
export function unhealthyProjects(
  projects: readonly ProjectSyncHealth[],
  revisitIntervalMs: number,
  now: Date = new Date(),
): UnhealthyProject[] {
  const out: UnhealthyProject[] = [];
  for (const p of projects) {
    const bad = isSyncUnhealthy(p, revisitIntervalMs, now);
    if (bad) out.push(bad);
  }
  return out;
}
