/**
 * RAG ingestion (#7): load content → chunk-by-entity → embed → upsert into
 * document_embeddings. Run: `bun run db:ingest`. Idempotent (clears embeddings
 * first). Uses the pooler (DATABASE_URL) + the embedding endpoint (Jina v3).
 */
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../database/schema';
import { chunkProject, chunkService, chunkFaq, type Chunk } from './chunking';
import { EmbeddingService } from './embedding.service';

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client, { schema });
  const embedder = new EmbeddingService();

  await db.delete(schema.documentEmbeddings);

  const chunks: Chunk[] = [];

  const projects = await db.select().from(schema.projects);
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

  console.log(`Embedding ${chunks.length} chunks…`);
  const vectors = await embedder.embedMany(chunks.map((c) => c.text));

  await db.insert(schema.documentEmbeddings).values(
    chunks.map((c, i) => ({
      sourceType: c.sourceType,
      sourceId: c.sourceId,
      chunkIndex: c.chunkIndex,
      chunkText: c.text,
      embedding: vectors[i]!,
      metadata: c.metadata,
    })),
  );

  console.log('Ingested:', {
    chunks: chunks.length,
    dim: vectors[0]?.length,
  });
  await client.end();
}

main().catch((e) => {
  console.error('INGEST FAILED:', e);
  process.exit(1);
});
