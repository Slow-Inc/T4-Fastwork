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
 * How many cadences a project may go unsynced before it counts as stuck.
 *
 * Three, because GitHub Actions schedules drift by tens of minutes and the detail sync rotates a
 * budget of repos per run — one or two missed runs is normal, so alerting there would cry wolf and
 * train everyone to ignore the signal.
 */
export const STUCK_AFTER_CADENCES = 3;

/**
 * `null` when the project looks healthy. An error outranks staleness: a stale-and-failing project
 * should be reported by the cause someone can act on, not by its age.
 */
export function isSyncUnhealthy(
  project: ProjectSyncHealth,
  cadenceMs: number,
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
  if (ageMs > cadenceMs * STUCK_AFTER_CADENCES) {
    const hours = Math.floor(ageMs / 3_600_000);
    return { slug: project.slug, reason: 'stuck', detail: `${hours}h stale` };
  }
  return null;
}

/** The unhealthy subset, in input order. Empty means a quiet run stays quiet. */
export function unhealthyProjects(
  projects: readonly ProjectSyncHealth[],
  cadenceMs: number,
  now: Date = new Date(),
): UnhealthyProject[] {
  const out: UnhealthyProject[] = [];
  for (const p of projects) {
    const bad = isSyncUnhealthy(p, cadenceMs, now);
    if (bad) out.push(bad);
  }
  return out;
}
