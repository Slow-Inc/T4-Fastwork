/**
 * Secret-guarded per-repo pipeline sync (#187 / epic #185).
 * POST /github/pipeline-sync — dry-run by default; apply:true executes.
 */
import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { constantTimeEqual } from './webhook-verify';
import { parseSafeGithubOwnerRepo } from './github.config';
import { DrizzleSnapshotStore } from './drizzle-snapshot.store';
import {
  runPipelineSync,
  type PipelineActionExecutor,
  type PipelineStateLoader,
} from './pipeline-sync';
import type { SyncEvent } from './project-automation-sync';

export const PIPELINE_STATE_LOADER = Symbol('PIPELINE_STATE_LOADER');
export const PIPELINE_ACTION_EXECUTOR = Symbol('PIPELINE_ACTION_EXECUTOR');

@Controller('github')
export class PipelineSyncController {
  constructor(
    private readonly store: DrizzleSnapshotStore,
    @Inject(PIPELINE_STATE_LOADER)
    private readonly loader: PipelineStateLoader,
    @Inject(PIPELINE_ACTION_EXECUTOR)
    private readonly executor: PipelineActionExecutor,
  ) {}

  @Post('pipeline-sync')
  async run(
    @Headers('x-refresh-secret') secret: string | undefined,
    @Body()
    body: {
      owner?: string;
      repo?: string;
      apply?: boolean;
      event?: Partial<SyncEvent>;
      force?: boolean;
    },
  ): Promise<unknown> {
    const expected = process.env.GITHUB_REFRESH_SECRET;
    if (!expected || !constantTimeEqual(secret, expected)) {
      throw new UnauthorizedException();
    }

    const parsed = parseSafeGithubOwnerRepo(body?.owner, body?.repo);
    if (!parsed) throw new BadRequestException('invalid owner or repo');

    const apply = body?.apply === true;
    const event: SyncEvent = {
      kind: body?.event?.kind ?? 'manual',
      owner: parsed.owner,
      repo: parsed.repo,
      headSha: body?.event?.headSha,
      isDefaultBranch: body?.event?.isDefaultBranch,
      deploymentId: body?.event?.deploymentId,
      target: body?.event?.target,
      force: body?.force === true || body?.event?.force === true,
    };

    const lock = `github-pipeline:${parsed.owner.toLowerCase()}/${parsed.repo.toLowerCase()}`;
    const outcome = await this.store.runExclusive(lock, () =>
      runPipelineSync({ ...event }, { apply }, this.loader, this.executor),
    );

    if (!outcome.ran) {
      return {
        owner: parsed.owner,
        repo: parsed.repo,
        skipped: true,
        applied: apply,
        plan: [],
        executed: [],
        deferred: [],
      };
    }
    return outcome.result;
  }
}
