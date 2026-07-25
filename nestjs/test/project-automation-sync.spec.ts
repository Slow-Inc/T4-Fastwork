import { describe, it, expect } from 'bun:test';
import {
  planProjectAutomationSync,
  type ProjectSyncState,
  type SyncEvent,
} from '../src/github/project-automation-sync';

function state(over: Partial<ProjectSyncState> = {}): ProjectSyncState {
  return {
    id: 1,
    slug: 'demo',
    status: 'published',
    source: 'github',
    isPublicRepo: true,
    ghOwner: 'Slow-Inc',
    ghRepo: 'Demo',
    liveUrl: 'https://demo.example',
    snapshotImage: 'https://cdn.example/cover.png',
    readmeSha: 'sha-old',
    snapshotReadmeSha: 'sha-new',
    content: 'existing case study',
    contentOwner: 'auto',
    categoryId: 10,
    categoryOwner: 'auto',
    tagsOwner: 'auto',
    technologiesOwner: 'auto',
    overviewSummary: 'overview already filled',
    overviewOwner: 'auto',
    lastCaptureTrigger: 'push:abc',
    lastCaptureDispatchAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

function push(over: Partial<SyncEvent> = {}): SyncEvent {
  return {
    kind: 'github_push',
    owner: 'Slow-Inc',
    repo: 'Demo',
    headSha: 'deadbeef',
    isDefaultBranch: true,
    ...over,
  };
}

describe('planProjectAutomationSync', () => {
  it('plans regen_case_study when README sha changed and content_owner=auto', () => {
    const plan = planProjectAutomationSync(push(), state());
    expect(plan.map((a) => a.action)).toContain('regen_case_study');
    const regen = plan.find((a) => a.action === 'regen_case_study');
    expect(regen?.reason.length).toBeGreaterThan(0);
  });

  it('skips regen_case_study when content_owner=human even if README sha changed', () => {
    const plan = planProjectAutomationSync(
      push(),
      state({ contentOwner: 'human' }),
    );
    expect(plan.map((a) => a.action)).not.toContain('regen_case_study');
  });

  it('skips regen_case_study when README sha unchanged and content is non-empty', () => {
    const plan = planProjectAutomationSync(
      push(),
      state({ readmeSha: 'same', snapshotReadmeSha: 'same' }),
    );
    expect(plan.map((a) => a.action)).not.toContain('regen_case_study');
  });

  it('plans recapture_cover on vercel production deploy when trigger differs (same live_url)', () => {
    const plan = planProjectAutomationSync(
      {
        kind: 'vercel_deploy',
        owner: 'Slow-Inc',
        repo: 'Demo',
        deploymentId: 'dpl_new',
        target: 'production',
      },
      state({
        readmeSha: 'same',
        snapshotReadmeSha: 'same',
        lastCaptureTrigger: 'deploy:dpl_old',
        lastCaptureDispatchAt: '2026-01-01T00:00:00.000Z',
      }),
      { now: Date.parse('2026-01-01T01:00:00.000Z') },
    );
    expect(plan.map((a) => a.action)).toContain('recapture_cover');
  });

  it('skips recapture_cover when trigger matches lastCaptureTrigger (idempotent)', () => {
    const plan = planProjectAutomationSync(
      {
        kind: 'vercel_deploy',
        owner: 'Slow-Inc',
        repo: 'Demo',
        deploymentId: 'dpl_same',
        target: 'production',
      },
      state({
        readmeSha: 'same',
        snapshotReadmeSha: 'same',
        lastCaptureTrigger: 'deploy:dpl_same',
        lastCaptureDispatchAt: '2026-01-01T00:00:00.000Z',
      }),
      { now: Date.parse('2026-01-01T01:00:00.000Z') },
    );
    expect(plan.map((a) => a.action)).not.toContain('recapture_cover');
  });

  it('skips recapture_cover within cooldown unless force', () => {
    const event = {
      kind: 'vercel_deploy' as const,
      owner: 'Slow-Inc',
      repo: 'Demo',
      deploymentId: 'dpl_new',
      target: 'production' as const,
    };
    const st = state({
      readmeSha: 'same',
      snapshotReadmeSha: 'same',
      lastCaptureTrigger: 'deploy:dpl_old',
      lastCaptureDispatchAt: '2026-01-01T00:59:00.000Z',
    });
    const now = Date.parse('2026-01-01T01:00:00.000Z'); // 60s later, cooldown=120s
    expect(
      planProjectAutomationSync(event, st, { now }).map((a) => a.action),
    ).not.toContain('recapture_cover');
    expect(
      planProjectAutomationSync({ ...event, force: true }, st, { now }).map(
        (a) => a.action,
      ),
    ).toContain('recapture_cover');
  });

  it('skips recapture_cover for vercel preview deploys', () => {
    const plan = planProjectAutomationSync(
      {
        kind: 'vercel_deploy',
        owner: 'Slow-Inc',
        repo: 'Demo',
        deploymentId: 'dpl_preview',
        target: 'preview',
      },
      state({
        readmeSha: 'same',
        snapshotReadmeSha: 'same',
        lastCaptureTrigger: 'deploy:old',
        lastCaptureDispatchAt: '2026-01-01T00:00:00.000Z',
      }),
      { now: Date.parse('2026-01-01T01:00:00.000Z') },
    );
    expect(plan.map((a) => a.action)).not.toContain('recapture_cover');
  });

  it('skips content and cover work for non-default-branch push', () => {
    const plan = planProjectAutomationSync(
      push({ isDefaultBranch: false, headSha: 'feature' }),
      state({
        lastCaptureTrigger: 'push:old',
        lastCaptureDispatchAt: '2026-01-01T00:00:00.000Z',
      }),
      { now: Date.parse('2026-01-01T01:00:00.000Z') },
    );
    expect(plan.map((a) => a.action)).not.toContain('regen_case_study');
    expect(plan.map((a) => a.action)).not.toContain('recapture_cover');
  });

  it('plans auto_publish for public github draft; skips hidden and private', () => {
    expect(
      planProjectAutomationSync(
        push(),
        state({
          status: 'draft',
          isPublicRepo: true,
          readmeSha: 'same',
          snapshotReadmeSha: 'same',
        }),
      ).map((a) => a.action),
    ).toContain('auto_publish');

    expect(
      planProjectAutomationSync(
        push(),
        state({
          status: 'hidden',
          isPublicRepo: true,
          readmeSha: 'same',
          snapshotReadmeSha: 'same',
        }),
      ).map((a) => a.action),
    ).not.toContain('auto_publish');

    expect(
      planProjectAutomationSync(
        push(),
        state({
          status: 'draft',
          isPublicRepo: false,
          readmeSha: 'same',
          snapshotReadmeSha: 'same',
        }),
      ).map((a) => a.action),
    ).not.toContain('auto_publish');
  });

  it('plans sync_live_url only when liveUrl is null', () => {
    expect(
      planProjectAutomationSync(
        push(),
        state({
          liveUrl: null,
          readmeSha: 'same',
          snapshotReadmeSha: 'same',
        }),
      ).map((a) => a.action),
    ).toContain('sync_live_url');

    expect(
      planProjectAutomationSync(
        push(),
        state({
          liveUrl: 'https://keep.me',
          readmeSha: 'same',
          snapshotReadmeSha: 'same',
        }),
      ).map((a) => a.action),
    ).not.toContain('sync_live_url');
  });

  it('orders actions and appends rank + revalidate after content changes', () => {
    const actions = planProjectAutomationSync(
      push({ headSha: 'newsha' }),
      state({
        status: 'draft',
        isPublicRepo: true,
        liveUrl: null,
        categoryId: null,
        overviewSummary: null,
        snapshotImage: null,
        readmeSha: 'old',
        snapshotReadmeSha: 'new',
        lastCaptureTrigger: null,
        lastCaptureDispatchAt: null,
      }),
    ).map((a) => a.action);

    expect(actions).toEqual([
      'sync_live_url',
      'sync_taxonomy',
      'sync_overview',
      'regen_case_study',
      'auto_publish',
      'recapture_cover',
      'rank',
      'revalidate',
    ]);
  });
});
