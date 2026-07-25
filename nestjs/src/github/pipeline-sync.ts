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
      failed.push({
        action: kind,
        error: err instanceof Error ? err.message : String(err),
      });
    }
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
