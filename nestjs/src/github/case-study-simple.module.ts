import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LlmModule } from '../llm/llm.module';
import { LlmService } from '../llm/llm.service';
import { GithubModule } from './github.module';
import { GithubReadService } from './github-read.service';
import { PgCaseStudySimpleStore } from './pg-case-study-simple.store';
import {
  CaseStudySimpleController,
  CASE_STUDY_README,
  CASE_STUDY_LLM,
  CASE_STUDY_SIMPLE_STORE,
} from './case-study-simple.controller';

/**
 * Wires the simplified case-study generator (ADR 0013): the Postgres store
 * (Drizzle pooler) + the README reader (GithubReadService) + the LLM
 * (LlmService), behind the secret-guarded `POST /github/generate-case-studies`
 * trigger. Mirrors GithubGenerateModule. Registered in AppModule.imports.
 */
@Module({
  imports: [DatabaseModule, LlmModule, GithubModule],
  controllers: [CaseStudySimpleController],
  providers: [
    PgCaseStudySimpleStore,
    { provide: CASE_STUDY_SIMPLE_STORE, useExisting: PgCaseStudySimpleStore },
    { provide: CASE_STUDY_README, useExisting: GithubReadService },
    { provide: CASE_STUDY_LLM, useExisting: LlmService },
  ],
})
export class CaseStudySimpleModule {}
