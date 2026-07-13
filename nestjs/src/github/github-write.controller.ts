/**
 * Write endpoints (ADR 0003, spec P2/P3 — SECURITY BOUNDARY). Both are
 * secret-authenticated and fail-closed (no secret configured → reject):
 *   - POST /github/refresh — cron-triggered; `x-refresh-secret` compared in
 *     constant time; wrapped in a single-flight advisory lock so overlapping
 *     crons never double-fetch GitHub.
 *   - POST /github/webhook — GitHub delivery; HMAC-verified over the RAW body
 *     (needs `rawBody: true` in main.ts), deduplicated, then a targeted refresh.
 */
import {
  Controller,
  Headers,
  Post,
  Req,
  Res,
  UnauthorizedException,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { constantTimeEqual } from './webhook-verify';
import { GithubRefreshService } from './github-refresh.service';
import { GithubWebhookService } from './github-webhook.service';
import { DrizzleSnapshotStore } from './drizzle-snapshot.store';

@Controller('github')
export class GithubWriteController {
  constructor(
    private readonly refresh: GithubRefreshService,
    private readonly webhook: GithubWebhookService,
    private readonly store: DrizzleSnapshotStore,
  ) {}

  @Post('refresh')
  async doRefresh(
    @Headers('x-refresh-secret') secret: string | undefined,
  ): Promise<unknown> {
    const expected = process.env.GITHUB_REFRESH_SECRET;
    if (!expected || !constantTimeEqual(secret, expected)) {
      throw new UnauthorizedException();
    }
    const outcome = await this.store.runExclusive('github-refresh', () =>
      this.refresh.refreshAll(),
    );
    return outcome.ran
      ? outcome.result
      : { skipped: 'a refresh is already running' };
  }

  @Post('webhook')
  async doWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
    @Headers('x-hub-signature-256') sig: string | undefined,
    @Headers('x-github-delivery') delivery: string | undefined,
  ): Promise<void> {
    const raw = req.rawBody ? req.rawBody.toString('utf8') : '';
    const r = await this.webhook.handle(raw, sig, delivery);
    res.status(r.code).json({ action: r.action });
  }
}
