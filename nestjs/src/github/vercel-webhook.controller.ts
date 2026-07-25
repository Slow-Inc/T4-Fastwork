/**
 * Vercel deployment.succeeded → pipeline recapture (#191 / epic #185).
 * Production-only; HMAC via x-vercel-signature; dedupe by deployment id.
 */
import {
  Controller,
  Headers,
  Inject,
  Logger,
  Post,
  Req,
  Res,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { DrizzleSnapshotStore } from './drizzle-snapshot.store';
import {
  runPipelineSync,
  WEBHOOK_DEFERRED_ACTIONS,
  type PipelineActionExecutor,
  type PipelineStateLoader,
  type PipelineSyncRecorder,
} from './pipeline-sync';
import {
  PIPELINE_ACTION_EXECUTOR,
  PIPELINE_STATE_LOADER,
  PIPELINE_SYNC_RECORDER,
} from './pipeline-sync.controller';
import type { SyncEvent } from './project-automation-sync';

export function verifyVercelSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
  secret: string,
): boolean {
  if (!secret || !signatureHeader) return false;
  const expected = createHmac('sha1', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function parseVercelDeployEvent(rawBody: string): {
  deploymentId: string;
  target: 'production' | 'preview' | 'other';
  url: string | null;
  /** From `deployment.meta` — the only exact project identifier in the payload (#204). */
  githubOwner: string | null;
  githubRepo: string | null;
} | null {
  try {
    const payload = JSON.parse(rawBody) as {
      type?: string;
      payload?: {
        deployment?: {
          id?: string;
          url?: string;
          name?: string;
          meta?: {
            githubCommitOrg?: string;
            githubCommitRepo?: string;
          };
        };
        target?: string;
      };
    };
    if (payload.type && payload.type !== 'deployment.succeeded') return null;
    const deploymentId = payload.payload?.deployment?.id;
    if (!deploymentId || typeof deploymentId !== 'string') return null;
    const rawTarget = payload.payload?.target;
    const target =
      rawTarget === 'production'
        ? 'production'
        : rawTarget === 'preview'
          ? 'preview'
          : 'other';
    const meta = payload.payload?.deployment?.meta;
    const str = (v: unknown): string | null =>
      typeof v === 'string' && v.trim() !== '' ? v : null;
    return {
      deploymentId,
      target,
      url: str(payload.payload?.deployment?.url),
      githubOwner: str(meta?.githubCommitOrg),
      githubRepo: str(meta?.githubCommitRepo),
    };
  } catch {
    return null;
  }
}

/** Map a Vercel deployment to a showcase github owner/repo — git metadata first, host second. */
export interface VercelProjectMapper {
  resolve(deployment: {
    url: string | null;
    githubOwner: string | null;
    githubRepo: string | null;
  }): Promise<{ owner: string; repo: string } | null>;
}

export const VERCEL_PROJECT_MAPPER = Symbol('VERCEL_PROJECT_MAPPER');

@Controller('vercel')
export class VercelWebhookController {
  private readonly logger = new Logger(VercelWebhookController.name);

  constructor(
    private readonly store: DrizzleSnapshotStore,
    @Inject(PIPELINE_STATE_LOADER)
    private readonly loader: PipelineStateLoader,
    @Inject(PIPELINE_ACTION_EXECUTOR)
    private readonly executor: PipelineActionExecutor,
    @Inject(VERCEL_PROJECT_MAPPER)
    private readonly mapper: VercelProjectMapper,
    @Inject(PIPELINE_SYNC_RECORDER)
    private readonly recorder: PipelineSyncRecorder,
  ) {}

  @Post('webhook')
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
    @Headers('x-vercel-signature') sig: string | undefined,
  ): Promise<void> {
    const secret = process.env.VERCEL_WEBHOOK_SECRET ?? '';
    const raw = req.rawBody ? req.rawBody.toString('utf8') : '';

    if (!secret) {
      res.status(503).json({ action: 'not-configured' });
      return;
    }
    if (!verifyVercelSignature(raw, sig, secret)) {
      res.status(401).json({ action: 'invalid-signature' });
      return;
    }

    const parsed = parseVercelDeployEvent(raw);
    if (!parsed) {
      res.status(200).json({ action: 'ignored' });
      return;
    }
    if (parsed.target !== 'production') {
      res.status(200).json({ action: 'ignored-non-production' });
      return;
    }

    const dedupeKey = `vercel-deploy:${parsed.deploymentId}`;
    if (await this.store.seenBefore(dedupeKey)) {
      res.status(200).json({ action: 'duplicate' });
      return;
    }

    const mapped = await this.mapper.resolve({
      url: parsed.url,
      githubOwner: parsed.githubOwner,
      githubRepo: parsed.githubRepo,
    });
    if (!mapped) {
      // Warn, not silence: an unresolvable deploy used to look identical to a healthy no-op,
      // which is how host-only matching hid the fact that it never matched anything (#204).
      this.logger.warn(
        `deployment ${parsed.deploymentId} not mapped to a showcase repo ` +
          `(url=${parsed.url ?? 'none'}, repo=${parsed.githubOwner ?? '?'}/${parsed.githubRepo ?? '?'})`,
      );
      res.status(200).json({ action: 'ignored-unmapped' });
      return;
    }

    const event: SyncEvent = {
      kind: 'vercel_deploy',
      owner: mapped.owner,
      repo: mapped.repo,
      deploymentId: parsed.deploymentId,
      target: 'production',
    };

    const lock = `github-pipeline:${mapped.owner.toLowerCase()}/${mapped.repo.toLowerCase()}`;
    // `seenBefore` above is an atomic claim, so two concurrent deliveries of the same id cannot
    // both run. But a claim that then FAILS must not stand, or Vercel's redelivery is deduped
    // away and that production deployment is lost permanently — so release it on failure (#200).
    try {
      // Same budget as the push path: cheap actions inline, LLM work drained by the cron (#199).
      await this.store.runExclusive(lock, () =>
        runPipelineSync(
          event,
          { apply: true, deferred: WEBHOOK_DEFERRED_ACTIONS },
          this.loader,
          this.executor,
          this.recorder,
        ),
      );
    } catch (err) {
      await this.store.forget(dedupeKey).catch(() => {});
      throw err;
    }

    res.status(202).json({
      action: `pipeline:${mapped.owner}/${mapped.repo}`,
      deploymentId: parsed.deploymentId,
    });
  }
}
