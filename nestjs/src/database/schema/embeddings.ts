/**
 * RAG vector store. One row per chunk (chunk-by-entity, ~1-2 per source).
 * `embedding` is bge-m3's 1024-dim vector (decision #4). HNSW + cosine index
 * for similarity search; `metadata` carries type/category/tags for filtering.
 */
import {
  pgTable,
  serial,
  integer,
  text,
  varchar,
  jsonb,
  timestamp,
  vector,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const EMBEDDING_DIM = 1024;

export const documentEmbeddings = pgTable(
  'document_embeddings',
  {
    id: serial('id').primaryKey(),
    sourceType: varchar('source_type', { length: 16 }).notNull(), // 'project' | 'service' | 'faq'
    sourceId: integer('source_id').notNull(),
    chunkIndex: integer('chunk_index').notNull().default(0),
    chunkText: text('chunk_text').notNull(),
    embedding: vector('embedding', { dimensions: EMBEDDING_DIM }).notNull(),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('document_embeddings_hnsw_idx').using(
      'hnsw',
      t.embedding.op('vector_cosine_ops'),
    ),
    index('document_embeddings_source_idx').on(t.sourceType, t.sourceId),
  ],
);
