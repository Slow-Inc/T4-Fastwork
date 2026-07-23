/**
 * Admin/cron trigger for #157 — fill null `projects.live_url` from GitHub
 * homepage in list snapshots. Secret-guarded; dry-run by default; `apply: true`
 * persists. No LLM — default cap is higher than overview gens.
 */
import {
  Body,
  Controller,
  Headers,
  Inject,
  Optional,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { constantTimeEqual } from './webhook-verify';
import { RevalidateService } from '../revalidate/revalidate.service';
import {
  runLiveUrlFill,
  type LiveUrlSnapshotReader,
  type LiveUrlStore,
} from './live-url-fill';

export const LIVE_URL_STORE = Symbol('LIVE_URL_STORE');
export const LIVE_URL_SNAPSHOTS = Symbol('LIVE_URL_SNAPSHOTS');

@Controller('github')
export class LiveUrlController {
  constructor(
    @Inject(LIVE_URL_STORE) private readonly store: LiveUrlStore,
    @Inject(LIVE_URL_SNAPSHOTS)
    private readonly snapshots: LiveUrlSnapshotReader,
    @Optional()
    @Inject(RevalidateService)
    private readonly revalidate?: RevalidateService,
  ) {}

  @Post('fill-live-urls')
  async run(
    @Headers('x-refresh-secret') secret: string | undefined,
    @Body() body: { apply?: boolean },
  ): Promise<{
    candidates: number;
    filled: number;
    applied: boolean;
    capped: boolean;
  }> {
    const expected = process.env.GITHUB_REFRESH_SECRET;
    if (!expected || !constantTimeEqual(secret, expected)) {
      throw new UnauthorizedException();
    }
    const apply = body?.apply === true;
    const configured = Number(process.env.LIVE_URL_MAX_PER_RUN);
    const maxPerRun =
      Number.isFinite(configured) && configured >= 1
        ? Math.floor(configured)
        : 50;

    const result = await runLiveUrlFill(this.store, this.snapshots, {
      apply,
      maxPerRun,
    });
    if (apply && result.filled > 0) {
      void this.revalidate?.revalidateProjects();
    }
    return {
      candidates: result.candidates,
      filled: result.filled,
      applied: result.applied,
      capped: result.capped,
    };
  }
}
