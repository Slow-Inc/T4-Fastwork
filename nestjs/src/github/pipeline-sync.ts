/**
 * Pipeline sync orchestration (#187+ / epic #185).
 * Plans via planProjectAutomationSync, then dispatches injected executors.
 * Pure orchestration — no Nest decorators here.
 */
import {
  captureTrigger,
  planProjectAutomationSync,
  type PlannedAction,
  type ProjectSyncState,
  type SyncActionKind,
  type SyncEvent,
} from './project-automation-sync';
import { summarizeSyncFailures } from './sync-health';

export interface PipelineStateLoader {
  loadByGithub(owner: string, repo: string): Promise<ProjectSyncState | null>;
}

/**
 * Per-action side effects. Controllers/modules wire real implementations;
 * unit tests inject fakes. Returning without throw = success.
 */
export interface PipelineActionExecutor {
  syncLiveUrl(state: ProjectSyncState, event: SyncEvent): Promise<void>;
  syncTaxonomy(state: ProjectSyncState, event: SyncEvent): Promise<void>;
  syncOverview(state: ProjectSyncState, event: SyncEvent): Promise<void>;
  regenCaseStudy(state: ProjectSyncState, event: SyncEvent): Promise<void>;
  autoPublish(state: ProjectSyncState, event: SyncEvent): Promise<void>;
  recaptureCover(state: ProjectSyncState, event: SyncEvent): Promise<void>;
  rank(state: ProjectSyncState, event: SyncEvent): Promise<void>;
  revalidate(state: ProjectSyncState, event: SyncEvent): Promise<void>;
}

/**
 * Records that a run REACHED a project — the input `isSyncUnhealthy` reads (#193).
 *
 * Separate from the executors because it is not one of the pipeline's actions: it happens once
 * per run regardless of what the plan contained. **Implementations must not throw** — a failed
 * bookkeeping write must never fail a sync that already did its work (see `PgPipelineSyncStore`).
 */
export interface PipelineSyncRecorder {
  recordSyncOutcome(
    projectId: number,
    atIso: string,
    error: string | null,
  ): Promise<void>;
}

/** Actions that may be planned but intentionally not executed yet (slice gating). */
export type DeferredActionSet = ReadonlySet<SyncActionKind>;

/**
 * The actions that call an LLM. Each costs seconds and tokens, and one event can plan all
 * three — against a 60s function budget (`nestjs/vercel.json`).
 */
export const LLM_ACTIONS: DeferredActionSet = new Set<SyncActionKind>([
  'sync_taxonomy',
  'sync_overview',
  'regen_case_study',
]);

/**
 * What a webhook defers. Nothing is enqueued anywhere: every LLM gate in the planner is
 * derived from the row's own state ("field empty AND owner = auto"), so the project row *is*
 * the queue, and the cron's `/github/generate-{taxonomy,overviews,case-studies}` endpoints —
 * each already capped at one per run — drain it (#199).
 */
export const WEBHOOK_DEFERRED_ACTIONS: DeferredActionSet = LLM_ACTIONS;

export interface PipelineActionFailure {
  action: SyncActionKind;
  error: string;
}

/**
 * Thrown by an executor to say "planned, but not attempted" rather than "attempted and failed" (#267).
 *
 * The loop below classifies by outcome, and an executor that swallows a non-dispatch and returns is
 * indistinguishable from one that succeeded — which is how `recapture_cover` came to be reported as
 * executed while the screenshot workflow token is parked. Throwing is how an action leaves `executed`;
 * throwing *this* is how it lands in `deferred` instead of `failed`, so a configuration gate does not
 * read as a permanent failure on every local run.
 */
export class ActionDeferredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActionDeferredError';
  }
}

export interface PipelineSyncResult {
  owner: string;
  repo: string;
  applied: boolean;
  found: boolean;
  plan: PlannedAction[];
  executed: SyncActionKind[];
  deferred: SyncActionKind[];
  /** Actions that threw. Reported, never fatal — see `runPipelineSync` (#200). */
  failed: PipelineActionFailure[];
}

const ACTION_ORDER: SyncActionKind[] = [
  'sync_live_url',
  'sync_taxonomy',
  'sync_overview',
  'regen_case_study',
  'auto_publish',
  'recapture_cover',
  'rank',
  'revalidate',
];

async function dispatch(
  action: SyncActionKind,
  executor: PipelineActionExecutor,
  state: ProjectSyncState,
  event: SyncEvent,
): Promise<void> {
  switch (action) {
    case 'sync_live_url':
      return executor.syncLiveUrl(state, event);
    case 'sync_taxonomy':
      return executor.syncTaxonomy(state, event);
    case 'sync_overview':
      return executor.syncOverview(state, event);
    case 'regen_case_study':
      return executor.regenCaseStudy(state, event);
    case 'auto_publish':
      return executor.autoPublish(state, event);
    case 'recapture_cover':
      return executor.recaptureCover(state, event);
    case 'rank':
      return executor.rank(state, event);
    case 'revalidate':
      return executor.revalidate(state, event);
  }
}

/**
 * Run the planner + optional apply. When `deferred` contains an action kind,
 * that action is listed in `deferred` and never dispatched (even on apply).
 */
export async function runPipelineSync(
  event: SyncEvent,
  opts: {
    apply: boolean;
    now?: number;
    deferred?: DeferredActionSet;
  },
  loader: PipelineStateLoader,
  executor: PipelineActionExecutor,
  recorder?: PipelineSyncRecorder,
): Promise<PipelineSyncResult> {
  const state = await loader.loadByGithub(event.owner, event.repo);
  if (!state) {
    return {
      owner: event.owner,
      repo: event.repo,
      applied: opts.apply,
      found: false,
      plan: [],
      executed: [],
      deferred: [],
      failed: [],
    };
  }

  const plan = planProjectAutomationSync(event, state, { now: opts.now });
  const deferredSet = opts.deferred ?? new Set<SyncActionKind>();
  const deferred: SyncActionKind[] = [];
  const executed: SyncActionKind[] = [];
  const failed: PipelineActionFailure[] = [];

  for (const kind of ACTION_ORDER) {
    if (!plan.some((p) => p.action === kind)) continue;
    if (deferredSet.has(kind)) {
      deferred.push(kind);
      continue;
    }
    if (!opts.apply) continue;
    // Each action is isolated: one throw must not cancel the ones after it. `revalidate` is
    // ordered last, so without this a single flaky call left the ISR cache stale forever even
    // though the change had already been persisted (#200).
    try {
      await dispatch(kind, executor, state, event);
      executed.push(kind);
    } catch (err) {
      // A gated action is not a failed one. Both leave `executed`, which is the point (#267).
      if (err instanceof ActionDeferredError) {
        deferred.push(kind);
      } else {
        failed.push({
          action: kind,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  // Record EVERY applied run, including one that planned nothing. The recorded timestamp means
  // "a run reached this project" — the distinction `isSyncUnhealthy` needs to tell a healthy quiet
  // repo from an unreached one. A recorder that only fired on change would repeat the blind spot
  // that made `github_snapshots.updated_at` unusable here: `syncResource` skips the upsert on a
  // 304 (`github.service.ts:100-102`), so that column tracks content changes, not runs (#193).
  // Awaited, not fire-and-forget: the serverless process can freeze the moment we return.
  if (opts.apply && recorder) {
    await recorder.recordSyncOutcome(
      state.id,
      new Date(opts.now ?? Date.now()).toISOString(),
      summarizeSyncFailures(failed),
    );
  }

  return {
    owner: event.owner,
    repo: event.repo,
    applied: opts.apply,
    found: true,
    plan,
    executed,
    deferred,
    failed,
  };
}

export { captureTrigger };
