import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import type { LiveUrlCandidate, LiveUrlStore } from './live-url-fill';

@Injectable()
export class PgLiveUrlStore implements LiveUrlStore {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listPublishedGithubNeedingLiveUrl(): Promise<LiveUrlCandidate[]> {
    const rows = (await this.db.execute(
      sql`select id, slug, gh_owner, gh_repo, live_url
          from projects
         where source = 'github'
           and status = 'published'
           and gh_owner is not null
           and gh_repo is not null
           and (live_url is null or btrim(live_url) = '')
         order by id`,
    )) as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      id: Number(r.id),
      slug: String(r.slug),
      ghOwner: String(r.gh_owner),
      ghRepo: String(r.gh_repo),
      liveUrl: typeof r.live_url === 'string' ? r.live_url : null,
    }));
  }

  async applyLiveUrl(id: number, liveUrl: string): Promise<void> {
    await this.db.execute(
      sql`update projects
             set live_url = ${liveUrl}
           where id = ${id}
             and (live_url is null or btrim(live_url) = '')`,
    );
  }
}
