import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import type { ProjectOverview } from './project-overview';
import type {
  OverviewProject,
  OverviewStore,
} from './project-overview.service';

/**
 * Postgres store for D3 AI overview cards (#130). Superuser pooler bypasses RLS.
 */
@Injectable()
export class PgOverviewStore implements OverviewStore {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listPublishedGithubProjects(): Promise<OverviewProject[]> {
    const rows = (await this.db.execute(
      sql`select id, slug, gh_owner, gh_repo, description,
                 overview_summary, overview_owner
          from projects
          where source = 'github'
            and status = 'published'
            and published_at is not null
            and gh_owner is not null
            and gh_repo is not null
          order by is_featured desc, published_at desc, id`,
    )) as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      id: Number(r.id),
      slug: String(r.slug),
      ghOwner: r.gh_owner == null ? null : String(r.gh_owner),
      ghRepo: r.gh_repo == null ? null : String(r.gh_repo),
      description: typeof r.description === 'string' ? r.description : null,
      overviewSummary:
        typeof r.overview_summary === 'string' ? r.overview_summary : null,
      overviewOwner: r.overview_owner === 'human' ? 'human' : 'auto',
    }));
  }

  async applyOverview(
    projectId: number,
    overview: ProjectOverview,
  ): Promise<void> {
    await this.db.execute(
      sql`update projects set
            overview_summary = case when overview_owner = 'auto' then ${overview.summary} else overview_summary end,
            overview_highlights = case when overview_owner = 'auto' then ${overview.highlights} else overview_highlights end,
            overview_good_for = case when overview_owner = 'auto' then ${overview.goodFor} else overview_good_for end,
            overview_summary_en = case when overview_owner = 'auto' then ${overview.summaryEn} else overview_summary_en end,
            overview_highlights_en = case when overview_owner = 'auto' then ${overview.highlightsEn} else overview_highlights_en end,
            overview_good_for_en = case when overview_owner = 'auto' then ${overview.goodForEn} else overview_good_for_en end,
            generated_at = case when overview_owner = 'auto' then now() else generated_at end
          where id = ${projectId} and source = 'github'`,
    );
  }
}
