import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { RETRIEVAL_SERVICE } from '../rag/retrieval.service';
import { DrizzleRetrievalService } from '../rag/drizzle-retrieval.service';
import { EmbeddingService } from '../ingestion/embedding.service';
import {
  RECAPTCHA_VERIFIER,
  GoogleRecaptchaVerifier,
} from '../security/recaptcha.verifier';
import { RecaptchaGuard } from '../security/recaptcha.guard';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ConversationLogService } from './conversation-log.service';
import { ScopeSummaryService } from './scope-summary.service';
import { ProjectContextService } from './project-context.service';

@Module({
  imports: [LlmModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    ConversationLogService,
    ScopeSummaryService,
    ProjectContextService,
    EmbeddingService,
    // Real pgvector retrieval (query → Jina embed → cosine search).
    { provide: RETRIEVAL_SERVICE, useClass: DrizzleRetrievalService },
    { provide: RECAPTCHA_VERIFIER, useClass: GoogleRecaptchaVerifier },
    RecaptchaGuard,
  ],
})
export class ChatModule {}
