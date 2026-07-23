import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LlmModule } from '../llm/llm.module';
import { LlmService } from '../llm/llm.service';
import { RevalidateModule } from '../revalidate/revalidate.module';
import { PgTechUsedForStore } from './pg-tech-used-for.store';
import {
  TechUsedForController,
  TECH_USED_FOR_LLM,
  TECH_USED_FOR_STORE,
} from './tech-used-for.controller';

@Module({
  imports: [DatabaseModule, LlmModule, RevalidateModule],
  controllers: [TechUsedForController],
  providers: [
    PgTechUsedForStore,
    { provide: TECH_USED_FOR_STORE, useExisting: PgTechUsedForStore },
    { provide: TECH_USED_FOR_LLM, useExisting: LlmService },
  ],
})
export class TechUsedForModule {}
