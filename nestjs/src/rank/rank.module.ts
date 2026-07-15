import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LlmModule } from '../llm/llm.module';
import { LlmService } from '../llm/llm.service';
import { RankService, RANK_STORE, RANK_CLIENT } from './rank.service';
import { PgRankStore } from './pg-rank.store';
import { RankController } from './rank.controller';
import type { RankClient } from './rank';

/**
 * Wires the AI display-ranking: the Postgres store (over the Drizzle pooler) and
 * the LLM client bound to `LlmService.complete`, behind the secret-guarded
 * `POST /rank/refresh` trigger.
 */
@Module({
  imports: [DatabaseModule, LlmModule],
  controllers: [RankController],
  providers: [
    { provide: RANK_STORE, useClass: PgRankStore },
    {
      provide: RANK_CLIENT,
      useFactory:
        (llm: LlmService): RankClient =>
        (messages) =>
          llm.complete(messages),
      inject: [LlmService],
    },
    RankService,
  ],
  exports: [RankService],
})
export class RankModule {}
