import {
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { constantTimeEqual } from '../github/webhook-verify';
import { RankService } from './rank.service';

/**
 * Admin/cron trigger for the AI display-ranking (SECURITY BOUNDARY). Reuses the
 * `x-refresh-secret` / `GITHUB_REFRESH_SECRET` scheme (constant-time compared,
 * fail-closed) — the same cron/refresh path already runs on schedule, so ranking
 * can be recomputed alongside it or on demand.
 */
@Controller('rank')
export class RankController {
  constructor(private readonly rank: RankService) {}

  @Post('refresh')
  async refresh(
    @Headers('x-refresh-secret') secret: string | undefined,
  ): Promise<unknown> {
    const expected = process.env.GITHUB_REFRESH_SECRET;
    if (!expected || !constantTimeEqual(secret, expected)) {
      throw new UnauthorizedException();
    }
    await this.rank.refreshAll();
    return { ok: true };
  }
}
