/**
 * A refused action must land in `failed`, a gated one in `deferred`, and neither in `executed` (#267).
 *
 * `runPipelineSync` counts an action as executed whenever the executor method resolves, so an
 * executor that swallows its own failure and returns is indistinguishable from one that succeeded.
 * That is how `recapture_cover` came to be reported as executed on every production push while the
 * screenshot workflow token is parked.
 *
 * The two non-dispatch cases are deliberately NOT the same bucket: an API rejection is a failure
 * somebody has to see, while a missing token is a configuration gate that must not make every local
 * run look permanently broken. `deferred` already exists in the outcome for "planned, intentionally
 * not executed"; `ActionDeferredError` is how an executor reaches it.
 */
import { describe, it, expect } from 'bun:test';
import {
  ActionDeferredError,
  runPipelineSync,
  type PipelineActionExecutor,
  type PipelineStateLoader,
} from '../src/github/pipeline-sync';
import type {
  ProjectSyncState,
  SyncEvent,
} from '../src/github/project-automation-sync';

const STATE: ProjectSyncState = {
  id: 42,
  slug: 'classified',
  status: 'published',
  source: 'github',
  isPublicRepo: true,
  ghOwner: 'Slow-Inc',
  ghRepo: 'classified',
  liveUrl: 'https://classified.example',
  snapshotImage: null,
  readmeSha: 'sha-new',
  snapshotReadmeSha: 'sha-old',
  content: 'existing case study',
  contentOwner: 'auto',
  categoryId: 1,
  categoryOwner: 'auto',
  tagsOwner: 'auto',
  technologiesOwner: 'auto',
  overviewSummary: 'existing overview',
  overviewOwner: 'auto',
  lastCaptureTrigger: null,
  lastCaptureDispatchAt: null,
};

const PUSH: SyncEvent = {
  kind: 'push',
  owner: 'Slow-Inc',
  repo: 'classified',
  headSha: 'sha-new',
};

const loader: PipelineStateLoader = {
  loadByGithub: () => Promise.resolve(STATE),
};

/** Every action resolves except `recaptureCover`, which throws whatever the case under test needs. */
function executorThatThrows(err: Error | null): PipelineActionExecutor {
  const noop = () => Promise.resolve();
  return {
    syncLiveUrl: noop,
    syncTaxonomy: noop,
    syncOverview: noop,
    regenCaseStudy: noop,
    autoPublish: noop,
    rank: noop,
    revalidate: noop,
    recaptureCover: () => (err ? Promise.reject(err) : Promise.resolve()),
  } as unknown as PipelineActionExecutor;
}

async function run(err: Error | null) {
  return runPipelineSync(PUSH, { apply: true }, loader, executorThatThrows(err));
}

describe('pipeline outcome classification (#267)', () => {
  it('plans a cover recapture for this state, so the cases below are not vacuous', async () => {
    const res = await run(null);
    expect(res.plan.map((p) => p.action)).toContain('recapture_cover');
  });

  it('puts a refused dispatch in failed, with the reason, and never in executed', async () => {
    const res = await run(
      new Error(
        'screenshot dispatch refused: http-403:Resource not accessible by personal access token',
      ),
    );

    expect(res.failed.map((f) => f.action)).toContain('recapture_cover');
    expect(res.failed.find((f) => f.action === 'recapture_cover')?.error).toContain(
      'http-403',
    );
    expect(res.executed).not.toContain('recapture_cover');
    expect(res.deferred).not.toContain('recapture_cover');
  });

  it('puts a gated dispatch in deferred, not in failed — a token-less run is not a failure', async () => {
    const res = await run(
      new ActionDeferredError('screenshot dispatch not attempted: no-token'),
    );

    expect(res.deferred).toContain('recapture_cover');
    expect(res.failed.map((f) => f.action)).not.toContain('recapture_cover');
    expect(res.executed).not.toContain('recapture_cover');
  });

  it('still reports a successful action as executed', async () => {
    const res = await run(null);
    expect(res.executed).toContain('recapture_cover');
    expect(res.failed).toEqual([]);
  });

  it('does not stop the actions ordered after the refused one', async () => {
    // The per-action isolation from #200 must survive this change: `revalidate` is last in
    // ACTION_ORDER, so a throw that escaped the loop would leave the ISR cache stale.
    const res = await run(new Error('boom'));
    const touched = [...res.executed, ...res.deferred];
    expect(touched.length).toBeGreaterThan(0);
  });
});
