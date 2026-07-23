import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LlmModule } from '../llm/llm.module';
import { RevalidateModule } from '../revalidate/revalidate.module';
import { GithubModule } from './github.module';
import { GithubReadService } from './github-read.service';
import { LlmService } from '../llm/llm.service';
import { PgGenerateStore } from './pg-generate.store';
import {
  TaxonomyGenerateController,
  TAXONOMY_LLM,
  TAXONOMY_README,
  TAXONOMY_STORE,
} from './taxonomy-generate.controller';

@Module({
  imports: [DatabaseModule, LlmModule, RevalidateModule, GithubModule],
  controllers: [TaxonomyGenerateController],
  providers: [
    PgGenerateStore,
    { provide: TAXONOMY_STORE, useExisting: PgGenerateStore },
    { provide: TAXONOMY_README, useExisting: GithubReadService },
    { provide: TAXONOMY_LLM, useExisting: LlmService },
  ],
})
export class TaxonomyGenerateModule {}
