/**
 * Real PipelineActionExecutor wiring existing generate/fill/publish paths (#187–#190).
 */
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import {
  CaseStudySimpleService,
  type CaseStudySimpleStore,
  type CompletionLlm,
  type ReadmeReader,
} from './case-study-simple';
import {
  CASE_STUDY_LLM,
  CASE_STUDY_README,
  CASE_STUDY_SIMPLE_STORE,
} from './case-study-simple.controller';
import {
  TaxonomyGenerateService,
  type TaxonomyLlm,
  type TaxonomyReadmeReader,
  type TaxonomyStore,
} from './taxonomy-generate';
import {
  TAXONOMY_LLM,
  TAXONOMY_README,
  TAXONOMY_STORE,
} from './taxonomy-generate.controller';
import {
  ProjectOverviewService,
  type OverviewLlm,
  type OverviewReadmeReader,
  type OverviewStore,
} from './project-overview.service';
import {
  OVERVIEW_LLM,
  OVERVIEW_README,
  OVERVIEW_STORE,
} from './project-overview.controller';
import {
  runLiveUrlFill,
  type LiveUrlSnapshotReader,
  type LiveUrlStore,
} from './live-url-fill';
import { LIVE_URL_SNAPSHOTS, LIVE_URL_STORE } from './live-url.controller';
import { RevalidateService } from '../revalidate/revalidate.service';
import { RankService } from '../rank/rank.service';
import {
  ActionDeferredError,
  captureTrigger,
  type PipelineActionExecutor,
} from './pipeline-sync';
import type { ProjectSyncState, SyncEvent } from './project-automation-sync';
import { PgPipelineSyncStore } from './pg-pipeline-sync.store';
import {
  dispatchScreenshotWorkflow,
  type ScreenshotDispatchOpts,
} from './screenshot-dispatch';

@Injectable()
export class PipelineActionExecutorService implements PipelineActionExecutor {
  private readonly logger = new Logger(PipelineActionExecutorService.name);

  constructor(
    @Inject(LIVE_URL_STORE) private readonly liveUrlStore: LiveUrlStore,
    @Inject(LIVE_URL_SNAPSHOTS)
    private readonly liveUrlSnapshots: LiveUrlSnapshotReader,
    @Inject(TAXONOMY_STORE) private readonly taxonomyStore: TaxonomyStore,
    @Inject(TAXONOMY_README)
    private readonly taxonomyReadme: TaxonomyReadmeReader,
    @Inject(TAXONOMY_LLM) private readonly taxonomyLlm: TaxonomyLlm,
    @Inject(OVERVIEW_STORE) private readonly overviewStore: OverviewStore,
    @Inject(OVERVIEW_README)
    private readonly overviewReadme: OverviewReadmeReader,
    @Inject(OVERVIEW_LLM) private readonly overviewLlm: OverviewLlm,
    @Inject(CASE_STUDY_SIMPLE_STORE)
    private readonly caseStudyStore: CaseStudySimpleStore,
    @Inject(CASE_STUDY_README) private readonly caseStudyReadme: ReadmeReader,
    @Inject(CASE_STUDY_LLM) private readonly caseStudyLlm: CompletionLlm,
    private readonly pipelineStore: PgPipelineSyncStore,
    @Optional() private readonly revalidateService?: RevalidateService,
    @Optional() private readonly rankService?: RankService,
  ) {}

  async syncLiveUrl(state: ProjectSyncState): Promise<void> {
    if (state.liveUrl) return;
    // Only the project this event planned — a push must not trigger a bulk pass over unrelated
    // rows, which costs writes inside the 60s budget and staleness for the actions after it (#201).
    await runLiveUrlFill(this.liveUrlStore, this.liveUrlSnapshots, {
      apply: true,
      maxPerRun: 1,
      onlyProjectId: state.id,
    });
  }

  async syncTaxonomy(state: ProjectSyncState): Promise<void> {
    const svc = new TaxonomyGenerateService(
      this.taxonomyReadme,
      this.taxonomyLlm,
      this.taxonomyStore,
    );
    await svc.generateForProject({
      id: state.id,
      slug: state.slug,
      ghOwner: state.ghOwner,
      ghRepo: state.ghRepo,
      description: null,
      categoryId: state.categoryId,
      categoryOwner: state.categoryOwner,
      tagsOwner: state.tagsOwner,
      technologiesOwner: state.technologiesOwner,
      readmeSha: state.readmeSha,
    });
  }

  async syncOverview(state: ProjectSyncState): Promise<void> {
    const svc = new ProjectOverviewService(
      this.overviewReadme,
      this.overviewLlm,
      this.overviewStore,
    );
    await svc.generateForProject({
      id: state.id,
      slug: state.slug,
      ghOwner: state.ghOwner,
      ghRepo: state.ghRepo,
      description: null,
      overviewSummary: state.overviewSummary,
      overviewOwner: state.overviewOwner,
    });
  }

  async regenCaseStudy(state: ProjectSyncState): Promise<void> {
    const svc = new CaseStudySimpleService(
      this.caseStudyReadme,
      this.caseStudyLlm,
      this.caseStudyStore,
    );
    await svc.generateForProject({
      id: state.id,
      slug: state.slug,
      ghOwner: state.ghOwner,
      ghRepo: state.ghRepo,
      readmeSha: state.readmeSha,
      description: null,
      content: state.content,
      contentOwner: state.contentOwner,
    });
  }

  async autoPublish(state: ProjectSyncState): Promise<void> {
    await this.pipelineStore.publishGithubDraft(state.id);
  }

  /** Seam so tests can drive the dispatch outcome without reaching GitHub. */
  protected dispatchScreenshot(
    opts: ScreenshotDispatchOpts,
  ): Promise<{ dispatched: boolean; reason?: string }> {
    return dispatchScreenshotWorkflow(opts);
  }

  async recaptureCover(
    state: ProjectSyncState,
    event: SyncEvent,
  ): Promise<void> {
    const trigger = captureTrigger(event) ?? 'manual';
    const outcome = await this.dispatchScreenshot({
      slug: state.slug,
      force: event.force === true,
      trigger,
    });

    // A dispatch that did not happen must not be recorded. Recording it would start the
    // cooldown and suppress every retry of a failure nobody can see (#197).
    //
    // It must also not RETURN, because `runPipelineSync` counts a resolved executor as executed —
    // returning here is what reported a refused dispatch as done work (#267). Which of the two
    // non-dispatch reasons this is decides the bucket: a missing token is a configuration gate, an
    // API rejection is a failure somebody has to see.
    if (!outcome.dispatched) {
      const reason = outcome.reason ?? 'unknown';
      if (reason === 'no-token') {
        this.logger.warn(
          `screenshot dispatch not attempted for ${state.slug} (trigger ${trigger}): no dispatch ` +
            `token configured — reported as deferred, and the next event retries`,
        );
        throw new ActionDeferredError(
          `screenshot dispatch not attempted: ${reason}`,
        );
      }
      this.logger.error(
        `screenshot dispatch failed for ${state.slug} (trigger ${trigger}): ${reason} — ` +
          `recording nothing so the next event retries`,
      );
      throw new Error(`screenshot dispatch refused: ${reason}`);
    }

    // Only the dispatch timestamp (the cooldown input). `last_capture_trigger` belongs to the
    // worker and is written after a capture actually completes.
    await this.pipelineStore.recordCaptureDispatch(
      state.id,
      new Date().toISOString(),
    );
  }

  async rank(_state: ProjectSyncState): Promise<void> {
    if (!this.rankService) return;
    void this.rankService.refresh('projects').catch((err) => {
      this.logger.warn(`rank refresh failed: ${String(err)}`);
    });
  }

  async revalidate(state: ProjectSyncState): Promise<void> {
    void this.revalidateService?.revalidateProject(state.slug).catch(() => {});
    void this.revalidateService?.revalidateProjects().catch(() => {});
  }
}
