/**
 * Resolve Vercel deployment → GitHub showcase project.
 *
 * Git metadata first (#204): a `deployment.succeeded` payload's `url` is the deployment's own
 * immutable host (`<project>-<hash>.vercel.app`), never the production alias, so comparing it to
 * a custom-domain `live_url` never matched and every delivery fell through as `ignored-unmapped`.
 * `deployment.meta.githubCommit{Org,Repo}` names the repo exactly. The host scan stays as a
 * fallback for deployments that carry no git metadata.
 */
import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import type { VercelProjectMapper } from './vercel-webhook.controller';

/** `gh_owner`/`gh_repo` are text columns, but a raw row is `unknown` — never stringify blindly. */
function textOf(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

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
    githubOwner: string | null;
    githubRepo: string | null;
  }): Promise<{ owner: string; repo: string } | null> {
    if (deployment.githubOwner && deployment.githubRepo) {
      // Still verified against the showcase: a deploy of some other repo must not enter the
      // pipeline just because Vercel told us its name.
      const byRepo = await this.byRepo(
        deployment.githubOwner,
        deployment.githubRepo,
      );
      return byRepo;
    }
    return await this.byLiveUrlHost(deployment.url);
  }

  private async byRepo(
    owner: string,
    repo: string,
  ): Promise<{ owner: string; repo: string } | null> {
    const rows = (await this.db.execute(
      sql`select gh_owner, gh_repo
            from projects
           where source = 'github'
             and status = 'published'
             and lower(gh_owner) = lower(${owner})
             and lower(gh_repo) = lower(${repo})
           limit 1`,
    )) as Array<Record<string, unknown>>;

    const row = rows[0];
    if (!row) return null;
    const resolved = { owner: textOf(row.gh_owner), repo: textOf(row.gh_repo) };
    return resolved.owner && resolved.repo ? resolved : null;
  }

  private async byLiveUrlHost(
    url: string | null,
  ): Promise<{ owner: string; repo: string } | null> {
    const host = hostOf(url);
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
        return { owner: textOf(r.gh_owner), repo: textOf(r.gh_repo) };
      }
    }
    return null;
  }
}
