import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LlmModule } from '../llm/llm.module';
import { LlmService } from '../llm/llm.service';
import { PgGenerateStore } from './pg-generate.store';
import {
  GithubGenerateController,
  GENERATE_STORE,
  GENERATE_CLIENT,
} from './github-generate.controller';
import type { LlmClient } from './github-generate';
import {
  buildGeneratePrompt,
  parseGeneratedContent,
} from './github-generate-client';

/**
 * Wires autonomous content generation (spec P3): the Postgres store (Drizzle
 * pooler) and the LLM client bound to `LlmService.complete` through the
 * prompt/parse adapter, behind the secret-guarded `POST /github/generate` trigger.
 * Mirrors RankModule. Add to AppModule.imports to activate.
 */
@Module({
  imports: [DatabaseModule, LlmModule],
  controllers: [GithubGenerateController],
  providers: [
    { provide: GENERATE_STORE, useClass: PgGenerateStore },
    {
      provide: GENERATE_CLIENT,
      useFactory:
        (llm: LlmService): LlmClient =>
        async (ctx) =>
          parseGeneratedContent(await llm.complete(buildGeneratePrompt(ctx))),
      inject: [LlmService],
    },
  ],
})
export class GithubGenerateModule {}
