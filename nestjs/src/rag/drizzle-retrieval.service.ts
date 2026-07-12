import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import { EmbeddingService } from '../ingestion/embedding.service';
import type { RetrievedItem } from '../chat/system-prompt';
import type { RetrievalService } from './retrieval.service';

const TOP_K = 5;
const THRESHOLD = 0.5; // cosine similarity cutoff (decision #4)

interface Row {
  source_type: 'project' | 'service' | 'faq';
  source_id: number;
  slug: string | null;
  title: string | null;
  chunk_text: string;
}

/**
 * Real pgvector retrieval (#8). The cosine query below was verified live via the
 * Supabase MCP against the real schema (dummy vectors: nearest ranked first,
 * below-threshold filtered). Not yet wired in ChatModule — needs the DB pooler
 * password (app connection) + bge-m3 (#14) to run. Swap StubRetrievalService for
 * this once both clear.
 */
@Injectable()
export class DrizzleRetrievalService implements RetrievalService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly embedding: EmbeddingService,
  ) {}

  async retrieve(query: string): Promise<RetrievedItem[]> {
    const vec = await this.embedding.embed(query);
    const literal = `[${vec.join(',')}]`;

    const rows = (await this.db.execute(sql`
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
      // project cards cite by slug; services/faqs by their numeric id
      ref: r.source_type === 'project' ? (r.slug ?? '') : String(r.source_id),
      title: r.title ?? '',
      summary: r.chunk_text,
    }));
  }
}
