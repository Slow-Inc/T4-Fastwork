/**
 * Seeds the real portfolio content (#6). Run: `bun run db:seed`.
 * Idempotent — clears the content tables (FK-safe order) then re-inserts.
 * Connects via the Supavisor pooler (DATABASE_URL, prepare:false).
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import * as data from './seed-data';

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client, { schema });

  // Clear in FK-safe order.
  await db.delete(schema.projectTags);
  await db.delete(schema.projectTechnologies);
  await db.delete(schema.documentEmbeddings);
  await db.delete(schema.projects);
  await db.delete(schema.faqs);
  await db.delete(schema.services);
  await db.delete(schema.tags);
  await db.delete(schema.technologies);
  await db.delete(schema.categories);

  const cats = await db
    .insert(schema.categories)
    .values(data.categories.map((c) => ({ ...c })))
    .returning();
  const catId = new Map(cats.map((c) => [c.slug, c.id]));

  const techs = await db
    .insert(schema.technologies)
    .values(data.technologies.map((t) => ({ ...t })))
    .returning();
  const techId = new Map(techs.map((t) => [t.slug, t.id]));

  const tagRows = await db
    .insert(schema.tags)
    .values(data.tags.map((t) => ({ ...t })))
    .returning();
  const tagId = new Map(tagRows.map((t) => [t.slug, t.id]));

  await db.insert(schema.services).values(data.services.map((s) => ({ ...s })));
  await db.insert(schema.faqs).values(data.faqs.map((f) => ({ ...f })));

  for (const p of data.projects) {
    const [row] = await db
      .insert(schema.projects)
      .values({
        slug: p.slug,
        title: p.title,
        titleEn: p.titleEn,
        description: p.description,
        content: p.content,
        categoryId: catId.get(p.categorySlug),
        businessTypes: [...p.businessTypes],
        isFeatured: p.isFeatured,
        liveUrl: p.liveUrl,
        sortOrder: p.sortOrder,
      })
      .returning();

    if (row) {
      await db.insert(schema.projectTechnologies).values(
        p.techSlugs
          .map((s) => techId.get(s))
          .filter((id): id is number => id != null)
          .map((technologyId) => ({ projectId: row.id, technologyId })),
      );
      await db.insert(schema.projectTags).values(
        p.tagSlugs
          .map((s) => tagId.get(s))
          .filter((id): id is number => id != null)
          .map((tagId2) => ({ projectId: row.id, tagId: tagId2 })),
      );
    }
  }

  console.log('Seeded:', {
    categories: cats.length,
    technologies: techs.length,
    tags: tagRows.length,
    services: data.services.length,
    faqs: data.faqs.length,
    projects: data.projects.length,
  });
  await client.end();
}

main().catch((e) => {
  console.error('SEED FAILED:', e);
  process.exit(1);
});
