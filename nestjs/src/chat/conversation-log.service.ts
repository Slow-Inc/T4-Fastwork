import { Injectable, Logger } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, desc } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from '../database/schema';
import type { CardRef } from './marker-parser';
import type { HistoryMessage } from './build-messages';

export interface LogTurnInput {
  sessionId: string;
  language: 'th' | 'en';
  ipHash?: string;
  userMessage: string;
  assistantText: string;
  cards: CardRef[];
  model: string;
  latencyMs: number;
}

type DB = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Persists each chat turn (Requirement §5.2). Self-contained + tolerant: builds
 * its own lazy pooler client and no-ops when DATABASE_URL isn't a real
 * connection (tests / before the password is set), so it never blocks a chat.
 * IP is hashed by the caller; raw IP is never stored.
 */
@Injectable()
export class ConversationLogService {
  private readonly logger = new Logger(ConversationLogService.name);
  private db?: DB | null;

  private getDb(): DB | null {
    if (this.db === undefined) {
      const url = process.env.DATABASE_URL;
      this.db =
        !url || url.includes('[YOUR-PASSWORD]')
          ? null
          : drizzle(postgres(url, { prepare: false }), { schema });
    }
    return this.db;
  }

  /**
   * Prior turns for a session, chronological (fixes #15 — chat memory). Returns
   * [] when there's no DB or no history, so a chat turn never depends on it.
   */
  async getRecentHistory(sessionId: string, limit = 10): Promise<HistoryMessage[]> {
    const db = this.getDb();
    if (!db) return [];
    try {
      const conv = await db.query.conversations.findFirst({
        where: eq(schema.conversations.sessionId, sessionId),
      });
      if (!conv) return [];
      const rows = await db
        .select({
          role: schema.messages.role,
          content: schema.messages.content,
        })
        .from(schema.messages)
        .where(eq(schema.messages.conversationId, conv.id))
        .orderBy(desc(schema.messages.createdAt))
        .limit(limit);
      return rows
        .reverse()
        .map((r) => ({ role: r.role as 'user' | 'assistant', content: r.content }));
    } catch (e) {
      this.logger.warn(`getRecentHistory failed: ${(e as Error).message}`);
      return [];
    }
  }

  async logTurn(input: LogTurnInput): Promise<void> {
    const db = this.getDb();
    if (!db) return; // logging disabled without a real DB

    try {
      const [conv] = await db
        .insert(schema.conversations)
        .values({
          sessionId: input.sessionId,
          language: input.language,
          ipHash: input.ipHash,
        })
        .onConflictDoUpdate({
          target: schema.conversations.sessionId,
          set: { language: input.language },
        })
        .returning();

      if (!conv) return;

      await db.insert(schema.messages).values([
        { conversationId: conv.id, role: 'user', content: input.userMessage },
        {
          conversationId: conv.id,
          role: 'assistant',
          content: input.assistantText,
          cards: input.cards,
          model: input.model,
          latencyMs: input.latencyMs,
        },
      ]);
    } catch (e) {
      // Never let logging break a chat turn.
      this.logger.warn(`logTurn failed: ${(e as Error).message}`);
    }
  }
}
