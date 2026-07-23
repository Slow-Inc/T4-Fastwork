import { Injectable } from '@nestjs/common';
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
 */
@Injectable()
export class RevalidateService {
  async revalidateProjects(): Promise<boolean> {
    return postProjectRevalidation({
      fetchImpl: globalThis.fetch,
      frontendOrigin: process.env.FRONTEND_ORIGIN,
      secret: process.env.GITHUB_REFRESH_SECRET,
    });
  }

  /** Revalidate `/projects` + one detail page (#143). */
  async revalidateProject(slug: string): Promise<boolean> {
    return postProjectRevalidation(
      {
        fetchImpl: globalThis.fetch,
        frontendOrigin: process.env.FRONTEND_ORIGIN,
        secret: process.env.GITHUB_REFRESH_SECRET,
      },
      slug,
    );
  }

  async revalidateContent(kind: ContentRevalidationKind): Promise<boolean> {
    return postContentRevalidation(
      {
        fetchImpl: globalThis.fetch,
        frontendOrigin: process.env.FRONTEND_ORIGIN,
        secret: process.env.GITHUB_REFRESH_SECRET,
      },
      kind,
    );
  }
}
