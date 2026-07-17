/**
 * RAG ingestion CLI (#7): `bun run db:ingest`. Thin wrapper over the callable
 * `runIngest` core (ingest-core.ts) — load content → chunk-by-entity → embed →
 * upsert into document_embeddings. Idempotent (clears embeddings first). Uses the
 * pooler (DATABASE_URL) + the embedding endpoint (Jina v3).
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../database/schema';
import { EmbeddingService } from './embedding.service';
import { runIngest } from './ingest-core';

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client, { schema });
  const embedder = new EmbeddingService();

  const { chunks, dim } = await runIngest(db, embedder);

  console.log('Ingested:', { chunks, dim });
  await client.end();
}

main().catch((e) => {
  console.error('INGEST FAILED:', e);
  process.exit(1);
});
