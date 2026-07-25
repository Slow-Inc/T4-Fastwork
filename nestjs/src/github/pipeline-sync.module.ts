import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { RevalidateModule } from '../revalidate/revalidate.module';
import { RankModule } from '../rank/rank.module';
import { GithubModule } from './github.module';
import { LiveUrlModule } from './live-url.module';
import { TaxonomyGenerateModule } from './taxonomy-generate.module';
import { ProjectOverviewModule } from './project-overview.module';
import { CaseStudySimpleModule } from './case-study-simple.module';
import {
  PipelineSyncController,
  PIPELINE_ACTION_EXECUTOR,
  PIPELINE_STATE_LOADER,
  PIPELINE_SYNC_RECORDER,
} from './pipeline-sync.controller';
import { PipelineActionExecutorService } from './pipeline-action-executor.service';
import { PgPipelineSyncStore } from './pg-pipeline-sync.store';
import { PipelinePushRunner } from './pipeline-push-runner';
import {
  VercelWebhookController,
  VERCEL_PROJECT_MAPPER,
} from './vercel-webhook.controller';
import { PgVercelProjectMapper } from './pg-vercel-project.mapper';

@Module({
  imports: [
    DatabaseModule,
    RevalidateModule,
    RankModule,
    forwardRef(() => GithubModule),
    LiveUrlModule,
    TaxonomyGenerateModule,
    ProjectOverviewModule,
    CaseStudySimpleModule,
  ],
  controllers: [PipelineSyncController, VercelWebhookController],
  providers: [
    PgPipelineSyncStore,
    PipelineActionExecutorService,
    PgVercelProjectMapper,
    PipelinePushRunner,
    { provide: PIPELINE_STATE_LOADER, useExisting: PgPipelineSyncStore },
    // Same store: it already owns the row this records against (#193).
    { provide: PIPELINE_SYNC_RECORDER, useExisting: PgPipelineSyncStore },
    {
      provide: PIPELINE_ACTION_EXECUTOR,
      useExisting: PipelineActionExecutorService,
    },
    { provide: VERCEL_PROJECT_MAPPER, useExisting: PgVercelProjectMapper },
  ],
  exports: [
    PgPipelineSyncStore,
    PipelineActionExecutorService,
    PipelinePushRunner,
    PIPELINE_STATE_LOADER,
    PIPELINE_ACTION_EXECUTOR,
    PIPELINE_SYNC_RECORDER,
  ],
})
export class PipelineSyncModule {}
