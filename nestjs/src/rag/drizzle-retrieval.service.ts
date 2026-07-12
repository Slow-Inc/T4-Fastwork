import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../database/schema';
import { EmbeddingService } from '../ingestion/embedding.service';
import type { RetrievedItem } from '../chat/system-prompt';
import type { RetrievalService } from './retrieval.service';

const TOP_K = 5;
const THRESHOLD = 0.5; // cosine similarity cutoff (decision #4)

type DB = ReturnType<typeof drizzle<typeof schema>>;

interface Row {
  source_type: 'project' | 'service' | 'faq';
  source_id: number;
  slug: string | null;
  title: string | null;
  chunk_text: string;
}

/**
 * Real pgvector retrieval (#8). Embeds the query (Jina v3) then cosine-searches
 * `document_embeddings`, joining to `projects` for the card slug/title. The SQL
 * was verified live via the Supabase MCP. Self-contained lazy pooler client (no
 * DatabaseModule) so module boot never needs the DB — retrieve() returns [] if
 * the DB isn't configured, so chat degrades gracefully.
 */
@Injectable()
export class DrizzleRetrievalService implements RetrievalService {
  private db?: DB | null;

  constructor(private readonly embedding: EmbeddingService) {}

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

  async retrieve(query: string): Promise<RetrievedItem[]> {
    const db = this.getDb();
    if (!db) return [];

    const vec = await this.embedding.embed(query);
    const literal = `[${vec.join(',')}]`;

    const rows = (await db.execute(sql`
      SELECT de.source_type AS source_type,
             de.source_id   AS source_id,
             p.slug         AS slug,
             COALESCE(de.metadata->>'title', p.title) AS title,
             de.chunk_text  AS chunk_text
      FROM document_embeddings de
      LEFT JOIN projects p
        ON de.source_type = 'project' AND p.id = de.source_id
      WHERE (1 - (de.embedding <=> ${literal}::vector)) >= ${THRESHOLD}
      ORDER BY de.embedding <=> ${literal}::vector
      LIMIT ${TOP_K}
    `)) as unknown as Row[];

    return rows.map((r) => ({
      kind: r.source_type,
      ref: r.source_type === 'project' ? (r.slug ?? '') : String(r.source_id),
      title: r.title ?? '',
      summary: r.chunk_text,
    }));
  }
}
