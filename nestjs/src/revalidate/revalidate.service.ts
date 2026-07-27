import { Injectable, Logger } from '@nestjs/common';
import {
  postContentRevalidation,
  postProjectRevalidation,
  type ContentRevalidationKind,
} from './revalidate';

/**
 * Fire-and-forget bulk revalidation of the public project pages after a
 * direct-DB write (#92). Reads FRONTEND_ORIGIN (primary site) + the shared
 * GITHUB_REFRESH_SECRET from env; fail-soft when either is unset (dev / not yet
 * configured). Injected into the secret-guarded rank + GitHub write paths.
 *
 * Every caller discards the returned boolean with `void`, so an honest boolean alone cannot make a
 * failure visible — this class logs it instead (#272). Only when a secret IS configured: an unset
 * secret is the documented dev no-op, and warning on every local write would drown the one case that
 * matters — a secret rotated in one Vercel project, where the frontend 401s forever and the ISR cache
 * silently stops being busted.
 */
@Injectable()
export class RevalidateService {
  private readonly logger = new Logger(RevalidateService.name);

  private deps() {
    return {
      fetchImpl: globalThis.fetch,
      frontendOrigin: process.env.FRONTEND_ORIGIN,
      secret: process.env.GITHUB_REFRESH_SECRET,
    };
  }

  /** Warn only when the call was actually configured to succeed. */
  private report(target: string, ok: boolean): boolean {
    if (!ok && process.env.GITHUB_REFRESH_SECRET) {
      this.logger.warn(
        `revalidation rejected by the frontend for ${target} — the ISR cache was NOT busted. ` +
          `Check that GITHUB_REFRESH_SECRET matches on both Vercel projects.`,
      );
    }
    return ok;
  }

  async revalidateProjects(): Promise<boolean> {
    return this.report(
      '/projects (bulk)',
      await postProjectRevalidation(this.deps()),
    );
  }

  /** Revalidate `/projects` + one detail page (#143). */
  async revalidateProject(slug: string): Promise<boolean> {
    return this.report(
      `/projects/${slug}`,
      await postProjectRevalidation(this.deps(), slug),
    );
  }

  async revalidateContent(kind: ContentRevalidationKind): Promise<boolean> {
    return this.report(
      `content:${kind}`,
      await postContentRevalidation(this.deps(), kind),
    );
  }
}
