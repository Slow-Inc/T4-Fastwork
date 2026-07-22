import {
  Body,
  Controller,
  Headers,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { constantTimeEqual } from './webhook-verify';
import { CurateService, type ProjectDraftStore } from './github-curate';
import {
  collectReposFromSnapshots,
  type SnapshotReadPort,
} from './github-curate-run';

export const PROJECT_DRAFT_STORE = Symbol('PROJECT_DRAFT_STORE');
export const SNAPSHOT_READER = Symbol('SNAPSHOT_READER');

/**
 * Admin/cron trigger for repo → draft-project curation (SECURITY BOUNDARY, spec
 * P2). Same `x-refresh-secret` / `GITHUB_REFRESH_SECRET` scheme as /github/refresh
 * and /github/generate (constant-time, fail-closed).
 *
 * **Dry-run by default** — reads the cached org + member repo snapshots, scores
 * them, and returns the slugs that WOULD become draft projects, WITHOUT writing.
 * `apply: true` persists the drafts (source='github', every field auto-owned)
 * awaiting the one-time first-run approval.
 */
@Controller('github')
export class GithubCurateController {
  constructor(
    @Inject(PROJECT_DRAFT_STORE) private readonly store: ProjectDraftStore,
    @Inject(SNAPSHOT_READER) private readonly snapshots: SnapshotReadPort,
  ) {}

  @Post('curate')
  async curate(
    @Headers('x-refresh-secret') secret: string | undefined,
    @Body() body: { apply?: boolean } | undefined,
  ): Promise<{ candidates: number; inserted: string[]; applied: boolean }> {
    const expected = process.env.GITHUB_REFRESH_SECRET;
    if (!expected || !constantTimeEqual(secret, expected)) {
      throw new UnauthorizedException();
    }

    const apply = Boolean(body?.apply);
    const repos = await collectReposFromSnapshots(this.snapshots);
    // Dry-run: existsBySlug still hits the real store (so `inserted` is genuinely
    // new slugs), but insertDraft is a no-op — the admin reviews what WOULD be
    // drafted before `apply:true` persists it. Mirrors GithubGenerateController.
    const store: ProjectDraftStore = apply
      ? this.store
      : {
          existsBySlug: (s) => this.store.existsBySlug(s),
          insertDraft: async () => {},
        };
    const res = await new CurateService(store).curate(repos);
    return { candidates: repos.length, inserted: res.inserted, applied: apply };
  }
}
