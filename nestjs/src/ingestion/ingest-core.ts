/**
 * Callable RAG ingestion core (#30/#60). Extracted from the `bun run db:ingest`
 * script so it can be invoked programmatically (e.g. re-ingest when a GitHub
 * snapshot changes) — not just from the CLI. Behaviour is unchanged: load
 * published content → chunk-by-entity → embed → replace document_embeddings.
 *
 * Idempotent: clears embeddings first, then re-inserts. Uses the injected Drizzle
 * db (pooler) + the embedding endpoint (Jina v3).
 */
import { eq } from 'drizzle-orm';
import type { DrizzleDB } from '../database/database.module';
import * as schema from '../database/schema';
import { chunkProject, chunkService, chunkFaq, type Chunk } from './chunking';
import type { EmbeddingService } from './embedding.service';

export interface IngestResult {
  chunks: number;
  dim: number | undefined;
}

/** Load → chunk → embed → replace document_embeddings. Only PUBLISHED projects
 * feed the chat's RAG — never an auto-discovered GitHub draft awaiting approval. */
export async function runIngest(
  db: DrizzleDB,
  embedder: EmbeddingService,
): Promise<IngestResult> {
  const chunks: Chunk[] = [];

  const projects = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.status, 'published'));
  for (const p of projects) {
    const category = p.categoryId
      ? (
          await db
            .select({ name: schema.categories.name })
            .from(schema.categories)
            .where(eq(schema.categories.id, p.categoryId))
        )[0]?.name
      : undefined;

    const tagNames = (
      await db
        .select({ name: schema.tags.name })
        .from(schema.projectTags)
        .innerJoin(schema.tags, eq(schema.tags.id, schema.projectTags.tagId))
        .where(eq(schema.projectTags.projectId, p.id))
    ).map((r) => r.name);

    const techNames = (
      await db
        .select({ name: schema.technologies.name })
        .from(schema.projectTechnologies)
        .innerJoin(
          schema.technologies,
          eq(schema.technologies.id, schema.projectTechnologies.technologyId),
        )
        .where(eq(schema.projectTechnologies.projectId, p.id))
    ).map((r) => r.name);

    chunks.push(
      ...chunkProject({
        id: p.id,
        title: p.title,
        titleEn: p.titleEn ?? undefined,
        description: p.description ?? undefined,
        content: p.content ?? undefined,
        category,
        tags: tagNames,
        technologies: techNames,
      }),
    );
  }

  for (const s of await db.select().from(schema.services)) {
    chunks.push(
      ...chunkService({
        id: s.id,
        title: s.title,
        targetAudience: s.targetAudience ?? undefined,
        description: s.description ?? undefined,
      }),
    );
  }

  for (const f of await db.select().from(schema.faqs)) {
    chunks.push(
      ...chunkFaq({
        id: f.id,
        question: f.question,
        answer: f.answer,
        category: f.category ?? undefined,
      }),
    );
  }

  const vectors = await embedder.embedMany(chunks.map((c) => c.text));

  const rows = chunks.map((c, i) => ({
    sourceType: c.sourceType,
    sourceId: c.sourceId,
    chunkIndex: c.chunkIndex,
    chunkText: c.text,
    embedding: vectors[i],
    metadata: c.metadata,
  }));

  // Replace atomically (#74): the delete happens only AFTER the load + embed above
  // succeed, and inside one transaction with the insert. A transient embedding-API
  // failure now leaves the existing embeddings intact instead of blanking the chat's
  // RAG; an insert failure rolls the delete back.
  await db.transaction(async (tx) => {
    await tx.delete(schema.documentEmbeddings);
    if (rows.length > 0) await tx.insert(schema.documentEmbeddings).values(rows);
  });

  return { chunks: chunks.length, dim: vectors[0]?.length };
}
