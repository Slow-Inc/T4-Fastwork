/**
 * The Nest -> Action cover-capture contract (#197).
 *
 * Nest dispatches the screenshot workflow; the Action boots ~30-60s later and re-reads the
 * project row to decide what to capture. Both sides therefore have to agree on what
 * `last_capture_trigger` MEANS. It means "the trigger of the last capture that actually
 * completed", so only the worker may write it. If Nest writes it at dispatch time the Action
 * compares the incoming trigger against the value Nest just wrote, finds them equal, and
 * captures nothing — which is exactly the epic's headline feature failing silently.
 */
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  planProjectAutomationSync,
  captureTrigger,
  type ProjectSyncState,
  type SyncEvent,
} from '../src/github/project-automation-sync';
import { PipelineActionExecutorService } from '../src/github/pipeline-action-executor.service';
import { ActionDeferredError } from '../src/github/pipeline-sync';
import type { ScreenshotDispatchOpts } from '../src/github/screenshot-dispatch';
import {
  selectSnapshotTargets,
  type SnapshotRow,
} from '../../nextjs/lib/snapshot-cover';

type DispatchOutcome = { dispatched: boolean; reason?: string };

/** Records every argument Nest hands to the store, so the test can assert what it wrote. */
class FakePipelineStore {
  readonly captureWrites: unknown[][] = [];
  async recordCaptureDispatch(...args: unknown[]): Promise<void> {
    this.captureWrites.push(args);
  }
}

/** Builds the executor without Nest DI; only the store and the dispatch seam are exercised. */
function makeExecutor(
  store: FakePipelineStore,
  outcome: DispatchOutcome,
): {
  executor: PipelineActionExecutorService;
  dispatched: ScreenshotDispatchOpts[];
} {
  const dispatched: ScreenshotDispatchOpts[] = [];
  const Ctor = PipelineActionExecutorService as unknown as new (
    ...args: unknown[]
  ) => PipelineActionExecutorService;
  class TestExecutor extends Ctor {
    protected dispatchScreenshot(
      opts: ScreenshotDispatchOpts,
    ): Promise<DispatchOutcome> {
      dispatched.push(opts);
      return Promise.resolve(outcome);
    }
  }
  const unusedDeps = Array.from({ length: 11 }, () => null);
  return { executor: new TestExecutor(...unusedDeps, store), dispatched };
}

const PUBLISHED_ROW: SnapshotRow = {
  id: 7,
  slug: 'covered-project',
  status: 'published',
  live_url: 'https://covered-project.example',
  snapshot_image: 'https://cdn.example/covered-project-old.png',
  last_capture_trigger: 'push:oldsha',
};

function stateFrom(row: SnapshotRow): ProjectSyncState {
  return {
    id: row.id,
    slug: row.slug,
    status: 'published',
    source: 'github',
    isPublicRepo: true,
    ghOwner: 'Slow-Inc',
    ghRepo: 'covered-project',
    liveUrl: row.live_url,
    snapshotImage: row.snapshot_image,
    readmeSha: 'sha-a',
    snapshotReadmeSha: 'sha-a',
    content: '# already written',
    contentOwner: 'human',
    categoryId: 3,
    categoryOwner: 'human',
    tagsOwner: 'human',
    technologiesOwner: 'human',
    overviewSummary: 'already written',
    overviewOwner: 'human',
    lastCaptureTrigger: row.last_capture_trigger ?? null,
    lastCaptureDispatchAt: null,
  };
}

const PUSH_EVENT: SyncEvent = {
  kind: 'github_push',
  owner: 'Slow-Inc',
  repo: 'covered-project',
  headSha: 'newsha',
  isDefaultBranch: true,
};

// The real dispatch helper reads tokens from the environment; clear them so nothing in this
// spec can reach the network even if the seam regresses.
const TOKEN_KEYS = ['SCREENSHOT_DISPATCH_TOKEN', 'GITHUB_TOKEN', 'GH_TOKEN'];
let savedTokens: Record<string, string | undefined> = {};

beforeEach(() => {
  savedTokens = {};
  for (const k of TOKEN_KEYS) {
    savedTokens[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of TOKEN_KEYS) {
    if (savedTokens[k] === undefined) delete process.env[k];
    else process.env[k] = savedTokens[k];
  }
});

describe('cover recapture: Nest -> Action contract (#197)', () => {
  it('still selects a project that already has a cover, after Nest has dispatched', async () => {
    const state = stateFrom(PUBLISHED_ROW);
    const trigger = captureTrigger(PUSH_EVENT);
    expect(trigger).toBe('push:newsha');

    // 1. The planner asks for a recapture: same live URL, new commit, existing cover.
    const plan = planProjectAutomationSync(PUSH_EVENT, state);
    expect(plan.map((a) => a.action)).toContain('recapture_cover');

    // 2. Nest dispatches successfully and records what it knows.
    const store = new FakePipelineStore();
    const { executor, dispatched } = makeExecutor(store, { dispatched: true });
    await executor.recaptureCover(state, PUSH_EVENT);
    expect(dispatched).toHaveLength(1);
    expect(dispatched[0]?.slug).toBe(PUBLISHED_ROW.slug);
    expect(dispatched[0]?.trigger).toBe(trigger);

    // Nest may record the dispatch timestamp, but must NOT claim the capture completed.
    const written = store.captureWrites.flat();
    expect(written).not.toContain(trigger);

    // 3. The Action boots later, re-reads the untouched row, and must still select it.
    const targets = selectSnapshotTargets([PUBLISHED_ROW], {
      slug: PUBLISHED_ROW.slug,
      trigger: trigger ?? undefined,
    });
    expect(targets).toHaveLength(1);
    expect(targets[0]?.slug).toBe(PUBLISHED_ROW.slug);
  });

  it('does not re-select once the worker has recorded that trigger as completed', () => {
    const trigger = 'push:newsha';
    const afterCapture: SnapshotRow = {
      ...PUBLISHED_ROW,
      snapshot_image: 'https://cdn.example/covered-project-new.png',
      last_capture_trigger: trigger,
    };
    expect(
      selectSnapshotTargets([afterCapture], {
        slug: afterCapture.slug,
        trigger,
      }),
    ).toHaveLength(0);
  });

  it('records nothing and reports a failure when the dispatch is rejected', async () => {
    const store = new FakePipelineStore();
    const { executor } = makeExecutor(store, {
      dispatched: false,
      reason: 'http-403:Resource not accessible by personal access token',
    });

    // It must throw, not return: `runPipelineSync` counts a resolved executor as executed, so
    // returning here reported the refused dispatch as done work (#267). This assertion previously
    // awaited a plain resolve, which is what pinned that defect in place.
    await expect(
      executor.recaptureCover(stateFrom(PUBLISHED_ROW), PUSH_EVENT),
    ).rejects.toThrow('http-403');

    // A 403 must not be recorded as a capture, otherwise the cooldown suppresses every retry.
    expect(store.captureWrites).toEqual([]);
  });

  it('reports a missing dispatch token as deferred, not as a failure', async () => {
    const store = new FakePipelineStore();
    const { executor } = makeExecutor(store, {
      dispatched: false,
      reason: 'no-token',
    });

    // A configuration gate is not a broken pipeline: every local run has no token, and reporting
    // that as a permanent failure would train everyone to ignore the signal.
    const err = await executor
      .recaptureCover(stateFrom(PUBLISHED_ROW), PUSH_EVENT)
      .then(() => null)
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ActionDeferredError);
    expect(store.captureWrites).toEqual([]);
  });

  it('records the dispatch when it succeeds, so the cooldown still works', async () => {
    const store = new FakePipelineStore();
    const { executor } = makeExecutor(store, { dispatched: true });

    await executor.recaptureCover(stateFrom(PUBLISHED_ROW), PUSH_EVENT);

    expect(store.captureWrites).toHaveLength(1);
    const args = store.captureWrites[0] ?? [];
    expect(args[0]).toBe(PUBLISHED_ROW.id);
    // An ISO timestamp is recorded for the cooldown; the trigger is not.
    expect(
      args.some((a) => typeof a === 'string' && !Number.isNaN(Date.parse(a))),
    ).toBe(true);
  });
});
