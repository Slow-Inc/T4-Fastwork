import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LlmModule } from '../llm/llm.module';
import { RevalidateModule } from '../revalidate/revalidate.module';
import { GithubModule } from './github.module';
import { GithubReadService } from './github-read.service';
import { LlmService } from '../llm/llm.service';
import { PgOverviewStore } from './pg-overview.store';
import {
  ProjectOverviewController,
  OVERVIEW_LLM,
  OVERVIEW_README,
  OVERVIEW_STORE,
} from './project-overview.controller';

@Module({
  imports: [DatabaseModule, LlmModule, RevalidateModule, GithubModule],
  controllers: [ProjectOverviewController],
  providers: [
    PgOverviewStore,
    { provide: OVERVIEW_STORE, useExisting: PgOverviewStore },
    { provide: OVERVIEW_README, useExisting: GithubReadService },
    { provide: OVERVIEW_LLM, useExisting: LlmService },
  ],
})
export class ProjectOverviewModule {}
