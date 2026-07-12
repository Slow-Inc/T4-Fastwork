import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import {
  RETRIEVAL_SERVICE,
  StubRetrievalService,
} from '../rag/retrieval.service';
import {
  RECAPTCHA_VERIFIER,
  GoogleRecaptchaVerifier,
} from '../security/recaptcha.verifier';
import { RecaptchaGuard } from '../security/recaptcha.guard';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ConversationLogService } from './conversation-log.service';

@Module({
  imports: [LlmModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    ConversationLogService,
    // Placeholder retrieval until #8 lands the real pgvector impl.
    { provide: RETRIEVAL_SERVICE, useClass: StubRetrievalService },
    { provide: RECAPTCHA_VERIFIER, useClass: GoogleRecaptchaVerifier },
    RecaptchaGuard,
  ],
})
export class ChatModule {}
