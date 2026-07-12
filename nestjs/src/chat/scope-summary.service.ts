import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { ConversationLogService } from './conversation-log.service';
import { buildScopeSummaryMessages } from './scope-summary-prompt';
import { parseScopeSummaryResponse } from './scope-summary-parser';
import { EMPTY_SCOPE_SUMMARY, type ScopeSummary } from './scope-summary.types';

/**
 * Extracts a structured project-scope summary from a session's chat history
 * (Requirement §5.4 / FR-08). One-shot, non-streaming — separate from the
 * main chat turn so it never delays the user's next reply.
 */
@Injectable()
export class ScopeSummaryService {
  private readonly logger = new Logger(ScopeSummaryService.name);

  constructor(
    private readonly llm: LlmService,
    private readonly log: ConversationLogService,
  ) {}

  async summarize(sessionId: string): Promise<ScopeSummary> {
    const history = await this.log.getRecentHistory(sessionId);
    if (history.length === 0) return { ...EMPTY_SCOPE_SUMMARY };

    try {
      const raw = await this.llm.complete(buildScopeSummaryMessages(history));
      return parseScopeSummaryResponse(raw);
    } catch (e) {
      this.logger.warn(
        `scope summary extraction failed: ${(e as Error).message}`,
      );
      return { ...EMPTY_SCOPE_SUMMARY };
    }
  }
}
