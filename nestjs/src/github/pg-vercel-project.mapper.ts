/**
 * Resolve Vercel deployment → GitHub showcase project via live_url host match.
 */
import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import type { VercelProjectMapper } from './vercel-webhook.controller';

function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    const withProto = url.includes('://') ? url : `https://${url}`;
    return new URL(withProto).hostname.toLowerCase();
  } catch {
    return null;
  }
}

@Injectable()
export class PgVercelProjectMapper implements VercelProjectMapper {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async resolve(deployment: {
    url: string | null;
    name: string | null;
  }): Promise<{ owner: string; repo: string } | null> {
    const host = hostOf(deployment.url);
    if (!host) return null;

    const rows = (await this.db.execute(
      sql`select gh_owner, gh_repo, live_url
            from projects
           where source = 'github'
             and status = 'published'
             and gh_owner is not null
             and gh_repo is not null
             and live_url is not null`,
    )) as Array<Record<string, unknown>>;

    for (const r of rows) {
      const live = typeof r.live_url === 'string' ? r.live_url : null;
      const liveHost = hostOf(live);
      if (liveHost && liveHost === host) {
        return { owner: String(r.gh_owner), repo: String(r.gh_repo) };
      }
    }
    return null;
  }
}
