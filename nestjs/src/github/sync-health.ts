/**
 * Detect a project whose showcase sync is stuck or failing (#193 / #185 S8). Pure — no I/O.
 *
 * `runPipelineSync` is fail-soft: it reports failed actions and never throws
 * (`pipeline-sync.ts:69`), which is right for a batch job but means a project can fail on every run
 * while every run returns a success-shaped result. These predicates make that reportable.
 *
 * ⚠️ **What this does NOT catch — and #211 is the example.** An action the planner *defers* is not a
 * failure, so a webhook that defers `sync_taxonomy` to the cron drain every single time
 * (`WEBHOOK_DEFERRED_ACTIONS`) records a clean run. The drain endpoints that then skip the repo —
 * `taxonomy-generate.controller.ts` / `case-study-simple.controller.ts` — are not pipeline runs and
 * record nothing here. So the #211 row (published, github-backed, no category, no content) reads
 * perfectly healthy through these predicates. Catching that class needs a *content-completeness*
 * invariant over the row itself, not a freshness timestamp. Do not read this file as covering it.
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
 * @param revisitIntervalMs How often a *single* project is expected to be RECORDED — **not** the
 *   cron period. Passing the 1-hour cron period would report almost every healthy project as stuck.
 *
 *   ⚠️ **`stuck` is not alertable yet.** Only `runPipelineSync` records (see
 *   `PipelineSyncRecorder`), and that runs on a push or a Vercel deploy — not on the hourly cron,
 *   whose `refreshAll` → `syncRepoDetail` path (`github-refresh.service.ts:162-169`) writes no
 *   project row. So a repo that simply has not been pushed to reads stale no matter how healthy it
 *   is, and an alert on `stuck` today would fire on every quiet project. The `error` and `never`
 *   reasons are unaffected. Wiring the cron path to record is the precondition for that alert.
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
  return failures
    .map((f) => `${f.action}: ${truncate(f.error, MAX_RECORDED_ERROR_CHARS)}`)
    .join('; ');
}

/**
 * Per-action budget for the recorded message. The action name is ours and always kept; the message
 * comes from an upstream (an LLM gateway, the GitHub API, the pooler) and is the untrusted part.
 *
 * 200 matches the existing cap on interpolated upstream text (`screenshot-dispatch.ts:59`). It is a
 * disclosure bound, not tidiness: no migration grants `public.projects` column-by-column, so anon
 * SELECT reaches every column, and once 0034 lands whatever an upstream returned in `err.message`
 * is world-readable through PostgREST. The actionable full text stays in the logs, which are not.
 */
const MAX_RECORDED_ERROR_CHARS = 200;

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
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
