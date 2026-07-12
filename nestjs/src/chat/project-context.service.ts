import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../database/schema';
import type { ProjectContextRecord } from './project-context';

type DB = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Fetches one project's full record by slug for deterministic grounding
 * (Requirement §5.4) — bypasses embedding search entirely so a project's own
 * detail page always resolves to itself, never a semantically-similar one.
 * Self-contained lazy pooler client (mirrors DrizzleRetrievalService /
 * ConversationLogService) so module boot never needs the DB; getBySlug()
 * returns null on any failure so a chat turn never depends on it.
 */
@Injectable()
export class ProjectContextService {
  private readonly logger = new Logger(ProjectContextService.name);
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

  async getBySlug(slug: string): Promise<ProjectContextRecord | null> {
    const db = this.getDb();
    if (!db) return null;

    try {
      const project = await db.query.projects.findFirst({
        where: eq(schema.projects.slug, slug),
      });
      if (!project) return null;

      const category = project.categoryId
        ? ((
            await db
              .select({ name: schema.categories.name })
              .from(schema.categories)
              .where(eq(schema.categories.id, project.categoryId))
          )[0]?.name ?? null)
        : null;

      const technologies = (
        await db
          .select({ name: schema.technologies.name })
          .from(schema.projectTechnologies)
          .innerJoin(
            schema.technologies,
            eq(schema.technologies.id, schema.projectTechnologies.technologyId),
          )
          .where(eq(schema.projectTechnologies.projectId, project.id))
      ).map((r) => r.name);

      const tags = (
        await db
          .select({ name: schema.tags.name })
          .from(schema.projectTags)
          .innerJoin(schema.tags, eq(schema.tags.id, schema.projectTags.tagId))
          .where(eq(schema.projectTags.projectId, project.id))
      ).map((r) => r.name);

      return {
        slug: project.slug,
        title: project.title,
        titleEn: project.titleEn,
        description: project.description,
        content: project.content,
        category,
        technologies,
        tags,
        liveUrl: project.liveUrl,
      };
    } catch (e) {
      this.logger.warn(`getBySlug(${slug}) failed: ${(e as Error).message}`);
      return null;
    }
  }
}
