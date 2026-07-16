import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import { EmbeddingService } from './embedding.service';
import { runIngest } from './ingest-core';

/**
 * Callable RAG re-ingestion (#60 — RAG grounded in fresh GitHub data). Wraps
 * `runIngest` so the refresh/heal path can re-embed content when a GitHub snapshot
 * changes, keeping chat answers current instead of tied to the last CLI ingest.
 *
 * Single-flight: a concurrent re-ingest is skipped (the full re-embed is heavy).
 * Full re-embed for now; per-source incremental re-ingest is a follow-up. Wire
 * `reingest()` into the refresh path (delta-gated on a changed readmeSha) to
 * activate — that integration + a live verification is the remaining step.
 */
@Injectable()
export class RagIngestService {
  private readonly logger = new Logger(RagIngestService.name);
  private running = false;

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async reingest(): Promise<{ ingested: boolean; chunks?: number }> {
    if (this.running) {
      this.logger.log('RAG re-ingest already in flight — skipping');
      return { ingested: false };
    }
    this.running = true;
    try {
      const res = await runIngest(this.db, new EmbeddingService());
      this.logger.log(
        `RAG re-ingested: ${res.chunks} chunks (dim ${res.dim ?? 'n/a'})`,
      );
      return { ingested: true, chunks: res.chunks };
    } finally {
      this.running = false;
    }
  }
}
