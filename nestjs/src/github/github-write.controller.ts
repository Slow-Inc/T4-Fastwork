/**
 * Write endpoints (ADR 0003, spec P2/P3 — SECURITY BOUNDARY). Both are
 * secret-authenticated and fail-closed (no secret configured → reject):
 *   - POST /github/refresh — cron-triggered; `x-refresh-secret` compared in
 *     constant time; wrapped in a single-flight advisory lock so overlapping
 *     crons never double-fetch GitHub.
 *   - POST /github/refresh/repo-detail — targeted one-repo detail sync (#143);
 *     same secret + per-repo single-flight; no org/member list or RAG re-ingest.
 *   - POST /github/webhook — GitHub delivery; HMAC-verified over the RAW body
 *     (needs `rawBody: true` in main.ts), deduplicated, then a targeted refresh.
 */
import {
  BadRequestException,
  Body,
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
import { GithubRefreshService } from './github-refresh.service';
import { GithubWebhookService } from './github-webhook.service';
import { GithubHealService } from './github-heal.service';
import { parseReadme } from './github-detail.service';
import { parseSafeGithubOwnerRepo, resolveHealTarget } from './github.config';
import { DrizzleSnapshotStore } from './drizzle-snapshot.store';
import { RagIngestService } from '../ingestion/rag-ingest.service';
import { RevalidateService } from '../revalidate/revalidate.service';
import { PgShowcaseRepoStore } from './pg-showcase-repos.store';
import { selectReposMissingReadme } from './missing-readme-backfill';

@Controller('github')
export class GithubWriteController {
  constructor(
    private readonly refresh: GithubRefreshService,
    private readonly webhook: GithubWebhookService,
    private readonly heal: GithubHealService,
    private readonly store: DrizzleSnapshotStore,
    private readonly rag: RagIngestService,
    private readonly revalidate: RevalidateService,
    private readonly projects: PgShowcaseRepoStore,
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
    if (outcome.ran && outcome.result.changed.length) {
      void this.rag.reingest().catch(() => {});
      // #92 — a changed sync mutates project rows directly; bust the public
      // pages' ISR cache so they reflect it without a redeploy (fire-and-forget,
      // fail-soft — a revalidate miss must not fail the refresh).
      void this.revalidate.revalidateProjects();
    }
    return outcome.ran
      ? outcome.result
      : { skipped: 'a refresh is already running' };
  }

  /**
   * One-repository detail snapshot refresh (#143). Fits the Vercel window by
   * skipping org/member lists and RAG re-ingestion; revalidates only the
   * matching published project slug when one exists.
   */
  @Post('refresh/repo-detail')
  async doRefreshRepoDetail(
    @Headers('x-refresh-secret') secret: string | undefined,
    @Query('owner') owner: string | undefined,
    @Query('repo') repo: string | undefined,
  ): Promise<unknown> {
    const expected = process.env.GITHUB_REFRESH_SECRET;
    if (!expected || !constantTimeEqual(secret, expected)) {
      throw new UnauthorizedException();
    }
    const parsed = parseSafeGithubOwnerRepo(owner, repo);
    if (!parsed) throw new BadRequestException('invalid owner or repo');

    const lock = `github-refresh-repo-detail:${parsed.owner.toLowerCase()}/${parsed.repo.toLowerCase()}`;
    const outcome = await this.store.runExclusive(lock, () =>
      this.refresh.refreshRepoDetail(parsed.owner, parsed.repo),
    );
    if (!outcome.ran) {
      return { skipped: 'a refresh for this repo is already running' };
    }

    const projectSlug = await this.projects.findPublishedSlugByGithub(
      parsed.owner,
      parsed.repo,
    );
    if (projectSlug) {
      void this.revalidate.revalidateProject(projectSlug).catch(() => {});
    }

    return {
      owner: parsed.owner,
      repo: parsed.repo,
      projectSlug,
      ...outcome.result,
    };
  }

  /**
   * Capped backfill of published GitHub projects missing a README snapshot
   * (#158). Dry-run by default; `apply: true` calls existing `refreshRepoDetail`
   * up to README_BACKFILL_MAX_PER_RUN (default 1).
   */
  @Post('refresh/missing-readme')
  async doRefreshMissingReadme(
    @Headers('x-refresh-secret') secret: string | undefined,
    @Body() body: { apply?: boolean } | undefined,
  ): Promise<{
    candidates: number;
    planned: number;
    synced: number;
    failed: number;
    applied: boolean;
    capped: boolean;
    repos: { owner: string; repo: string; slug: string }[];
  }> {
    const expected = process.env.GITHUB_REFRESH_SECRET;
    if (!expected || !constantTimeEqual(secret, expected)) {
      throw new UnauthorizedException();
    }
    const apply = body?.apply === true;
    const configured = Number(process.env.README_BACKFILL_MAX_PER_RUN);
    const maxPerRun =
      Number.isFinite(configured) && configured >= 1
        ? Math.floor(configured)
        : 1;

    const [candidates, existingKeys] = await Promise.all([
      this.projects.listPublishedGithubForReadmeBackfill(),
      this.projects.listExistingReadmeKeys(),
    ]);
    const planned = selectReposMissingReadme(
      candidates,
      existingKeys,
      maxPerRun,
    );
    const missingCount = selectReposMissingReadme(
      candidates,
      existingKeys,
    ).length;

    if (!apply) {
      return {
        candidates: missingCount,
        planned: planned.length,
        synced: 0,
        failed: 0,
        applied: false,
        capped: missingCount > planned.length,
        repos: planned,
      };
    }

    const outcome = await this.store.runExclusive(
      'github-refresh-missing-readme',
      async () => {
        let synced = 0;
        let failed = 0;
        for (const r of planned) {
          const summary = await this.refresh.refreshRepoDetail(r.owner, r.repo);
          if (summary.failed.length) failed++;
          else {
            synced++;
            void this.revalidate.revalidateProject(r.slug).catch(() => {});
          }
        }
        return { synced, failed };
      },
    );

    if (!outcome.ran) {
      return {
        candidates: missingCount,
        planned: planned.length,
        synced: 0,
        failed: 0,
        applied: true,
        capped: missingCount > planned.length,
        repos: planned,
      };
    }

    return {
      candidates: missingCount,
      planned: planned.length,
      synced: outcome.result.synced,
      failed: outcome.result.failed,
      applied: true,
      capped: missingCount > planned.length,
      repos: planned,
    };
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
