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
  Query,
  Req,
  Res,
  UnauthorizedException,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { constantTimeEqual } from './webhook-verify';
import {
  GithubRefreshService,
  type RefreshSummary,
} from './github-refresh.service';
import { GithubWebhookService } from './github-webhook.service';
import { GithubHealService } from './github-heal.service';
import { parseReadme } from './github-detail.service';
import { resolveHealTarget } from './github.config';
import { DrizzleSnapshotStore } from './drizzle-snapshot.store';
import { RagIngestService } from '../ingestion/rag-ingest.service';

@Controller('github')
export class GithubWriteController {
  constructor(
    private readonly refresh: GithubRefreshService,
    private readonly webhook: GithubWebhookService,
    private readonly heal: GithubHealService,
    private readonly store: DrizzleSnapshotStore,
    private readonly rag: RagIngestService,
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
    // #60 — when a refresh changed GitHub-sourced content, re-embed so chat/RAG
    // reflects it. Fire-and-forget (the re-embed is heavy + single-flight); the
    // refresh response returns promptly. Delta-gated on the refresh reporting a
    // change (coarse: any change → re-ingest; per-published-project gating is a
    // follow-up).
    if (outcome.ran && (outcome.result as RefreshSummary)?.changed?.length) {
      void this.rag.reingest().catch(() => {});
    }
    return outcome.ran
      ? outcome.result
      : { skipped: 'a refresh is already running' };
  }

  /**
   * Stale-while-heal trigger (ADR 0004, R1). Called by the Next.js server
   * `after()` when a page reads a stale snapshot. Secret-guarded (the caller is
   * the frontend server, not the browser). Single-flight + ETag/304 keep it
   * cheap; a successful upsert is what Supabase Realtime pushes to viewers.
   */
  @Post('heal')
  async doHeal(
    @Headers('x-refresh-secret') secret: string | undefined,
    @Query('key') key: string | undefined,
  ): Promise<unknown> {
    const expected = process.env.GITHUB_REFRESH_SECRET;
    if (!expected || !constantTimeEqual(secret, expected)) {
      throw new UnauthorizedException();
    }
    const target = key ? resolveHealTarget(key) : null;
    if (!target)
      return { healing: false, changed: false, skipped: 'unhealable key' };
    return this.heal.heal(
      key!,
      target.url,
      target.readme ? { map: parseReadme } : undefined,
    );
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
