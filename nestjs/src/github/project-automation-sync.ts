/**
 * Pure planner for event-driven project showcase sync (#186 / epic #185).
 * No DB/HTTP — S2+ wire executors against PlannedAction[].
 */

import { needsCoverCapture } from './capture-eligibility';

export type SyncEventKind = 'github_push' | 'vercel_deploy' | 'manual';

export interface SyncEvent {
  kind: SyncEventKind;
  owner: string;
  repo: string;
  headSha?: string;
  isDefaultBranch?: boolean;
  deploymentId?: string;
  target?: 'production' | 'preview';
  force?: boolean;
}

export interface ProjectSyncState {
  id: number;
  slug: string;
  status: 'draft' | 'published' | 'hidden';
  source: 'cms' | 'github';
  isPublicRepo: boolean;
  ghOwner: string;
  ghRepo: string;
  liveUrl: string | null;
  snapshotImage: string | null;
  readmeSha: string | null;
  snapshotReadmeSha: string | null;
  content: string | null;
  contentOwner: 'auto' | 'human';
  categoryId: number | null;
  categoryOwner: 'auto' | 'human';
  tagsOwner: 'auto' | 'human';
  technologiesOwner: 'auto' | 'human';
  overviewSummary: string | null;
  overviewOwner: 'auto' | 'human';
  /** Trigger of the last COMPLETED capture — worker-written, never written at dispatch (#197). */
  lastCaptureTrigger: string | null;
  /** When Nest last dispatched a capture; the cooldown input. */
  lastCaptureDispatchAt: string | null;
}

export type SyncActionKind =
  | 'sync_live_url'
  | 'sync_taxonomy'
  | 'sync_overview'
  | 'regen_case_study'
  | 'recapture_cover'
  | 'auto_publish'
  | 'rank'
  | 'revalidate';

export interface PlannedAction {
  action: SyncActionKind;
  reason: string;
}

export interface PlanOptions {
  now?: number;
  recaptureCooldownMs?: number;
}

const DEFAULT_RECAPTURE_COOLDOWN_MS = 120_000;

const CONTENT_CHANGE_ACTIONS = new Set<SyncActionKind>([
  'sync_taxonomy',
  'sync_overview',
  'regen_case_study',
  'auto_publish',
]);

const PERSISTED_CHANGE_ACTIONS = new Set<SyncActionKind>([
  'sync_live_url',
  'sync_taxonomy',
  'sync_overview',
  'regen_case_study',
  'recapture_cover',
  'auto_publish',
]);

/** Generalized idempotency key for cover recapture. */
export function captureTrigger(event: SyncEvent): string | null {
  if (event.kind === 'vercel_deploy') {
    if (!event.deploymentId) return null;
    return `deploy:${event.deploymentId}`;
  }
  if (event.kind === 'github_push') {
    if (!event.headSha) return null;
    return `push:${event.headSha}`;
  }
  return 'manual';
}

function isNonDefaultPush(event: SyncEvent): boolean {
  return event.kind === 'github_push' && event.isDefaultBranch === false;
}

function overviewEmpty(state: ProjectSyncState): boolean {
  return state.overviewSummary == null || state.overviewSummary.trim() === '';
}

function shouldSyncLiveUrl(state: ProjectSyncState): boolean {
  return state.liveUrl == null;
}

function shouldSyncTaxonomy(state: ProjectSyncState): boolean {
  return state.categoryOwner === 'auto' && state.categoryId == null;
}

function shouldSyncOverview(state: ProjectSyncState): boolean {
  return state.overviewOwner === 'auto' && overviewEmpty(state);
}

function shouldRegenCaseStudy(
  event: SyncEvent,
  state: ProjectSyncState,
): boolean {
  if (isNonDefaultPush(event)) return false;
  if (state.contentOwner !== 'auto') return false;
  if (state.snapshotReadmeSha == null) return false;
  if (state.readmeSha !== state.snapshotReadmeSha) return true;
  const empty = state.content == null || state.content.trim() === '';
  return empty;
}

function shouldAutoPublish(state: ProjectSyncState): boolean {
  return (
    state.source === 'github' && state.status === 'draft' && state.isPublicRepo
  );
}

function shouldRecaptureCover(
  event: SyncEvent,
  state: ProjectSyncState,
  opts?: PlanOptions,
): boolean {
  if (event.kind === 'vercel_deploy' && event.target !== 'production') {
    return false;
  }
  if (isNonDefaultPush(event)) return false;

  // Same predicate the Action-side worker uses to select rows, so the two processes cannot
  // disagree about what needs capturing (#197). `force` short-circuits it, matching the
  // worker's long-standing behavior.
  if (
    !needsCoverCapture({
      hasCover: state.snapshotImage != null,
      lastCompletedTrigger: state.lastCaptureTrigger,
      incomingTrigger: captureTrigger(event),
      force: event.force === true,
    })
  ) {
    return false;
  }

  if (state.snapshotImage == null) return true;
  if (event.force) return true;

  const cooldown = opts?.recaptureCooldownMs ?? DEFAULT_RECAPTURE_COOLDOWN_MS;
  const now = opts?.now ?? Date.now();
  if (state.lastCaptureDispatchAt == null) return true;
  const last = Date.parse(state.lastCaptureDispatchAt);
  if (!Number.isFinite(last)) return true;
  return now - last > cooldown;
}

export function planProjectAutomationSync(
  event: SyncEvent,
  state: ProjectSyncState,
  opts?: PlanOptions,
): PlannedAction[] {
  const plan: PlannedAction[] = [];

  if (shouldSyncLiveUrl(state)) {
    plan.push({
      action: 'sync_live_url',
      reason: 'live_url is null (fill-when-null only)',
    });
  }

  if (shouldSyncTaxonomy(state)) {
    plan.push({
      action: 'sync_taxonomy',
      reason: 'category empty and category_owner=auto',
    });
  }

  if (shouldSyncOverview(state)) {
    plan.push({
      action: 'sync_overview',
      reason: 'overview empty and overview_owner=auto',
    });
  }

  if (shouldRegenCaseStudy(event, state)) {
    plan.push({
      action: 'regen_case_study',
      reason:
        state.readmeSha !== state.snapshotReadmeSha
          ? 'README sha changed and content_owner=auto'
          : 'content empty and content_owner=auto',
    });
  }

  if (shouldAutoPublish(state)) {
    plan.push({
      action: 'auto_publish',
      reason: 'public github draft eligible for auto-publish (ADR 0011)',
    });
  }

  if (shouldRecaptureCover(event, state, opts)) {
    plan.push({
      action: 'recapture_cover',
      reason:
        state.snapshotImage == null
          ? 'snapshot_image is null'
          : 'capture trigger changed and cooldown elapsed',
    });
  }

  const kinds = new Set(plan.map((a) => a.action));
  if ([...kinds].some((a) => CONTENT_CHANGE_ACTIONS.has(a))) {
    plan.push({
      action: 'rank',
      reason: 'content changed; refresh display rank',
    });
  }
  if ([...kinds].some((a) => PERSISTED_CHANGE_ACTIONS.has(a))) {
    plan.push({
      action: 'revalidate',
      reason: 'persisted change; bust ISR cache',
    });
  }

  return plan;
}
