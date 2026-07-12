import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import {
  RETRIEVAL_SERVICE,
  StubRetrievalService,
} from '../rag/retrieval.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [LlmModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    // Placeholder retrieval until #8 lands the real pgvector impl.
    { provide: RETRIEVAL_SERVICE, useClass: StubRetrievalService },
  ],
})
export class ChatModule {}
