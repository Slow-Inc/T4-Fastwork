import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LlmModule } from '../llm/llm.module';
import { LlmService } from '../llm/llm.service';
import { PgCaseStudyStore } from './pg-case-study.store';
import {
  CaseStudyGenerateService,
  CASE_STUDY_STORE,
  CASE_STUDY_LLM,
} from './github-case-study-persist';
import type { LlmComplete } from './github-case-study-client';

/**
 * Wires P2 case-study persistence (#81 · ADR 0009 D2/D3): the Postgres store over
 * the Drizzle pooler + the LLM `complete` binding (mirrors RankModule), behind the
 * idempotent CaseStudyGenerateService. No controller yet — the service is exported
 * for the P3 trigger/worker (#66) + an operator dry-run endpoint to consume; it is
 * inert until then (same as the pure core shipped in #65).
 */
@Module({
  imports: [DatabaseModule, LlmModule],
  providers: [
    { provide: CASE_STUDY_STORE, useClass: PgCaseStudyStore },
    {
      provide: CASE_STUDY_LLM,
      useFactory:
        (llm: LlmService): LlmComplete =>
        (messages) =>
          llm.complete(messages),
      inject: [LlmService],
    },
    CaseStudyGenerateService,
  ],
  exports: [CaseStudyGenerateService],
})
export class CaseStudyModule {}
