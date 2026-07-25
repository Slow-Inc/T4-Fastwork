/**
 * Bridge GithubWebhookService → runPipelineSync (#192).
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { DrizzleSnapshotStore } from './drizzle-snapshot.store';
import {
  runPipelineSync,
  type PipelineActionExecutor,
  type PipelineStateLoader,
  WEBHOOK_DEFERRED_ACTIONS,
} from './pipeline-sync';
import type { PushPipelineRunner } from './github-webhook.service';
import {
  PIPELINE_ACTION_EXECUTOR,
  PIPELINE_STATE_LOADER,
} from './pipeline-sync.controller';
import type { SyncEvent } from './project-automation-sync';
import type { PipelineSyncResult } from './pipeline-sync';

/** What happened to one push. `ran: false` always carries a reason (#200). */
export type PushRunOutcome =
  | { ran: true; result: PipelineSyncResult }
  | { ran: false; reason: string };

@Injectable()
export class PipelinePushRunner implements PushPipelineRunner {
  private readonly logger = new Logger(PipelinePushRunner.name);

  constructor(
    private readonly store: DrizzleSnapshotStore,
    @Inject(PIPELINE_STATE_LOADER)
    private readonly loader: PipelineStateLoader,
    @Inject(PIPELINE_ACTION_EXECUTOR)
    private readonly executor: PipelineActionExecutor,
  ) {}

  async runPush(event: SyncEvent): Promise<PushRunOutcome> {
    const id = `${event.owner}/${event.repo}`;
    const lock = `github-pipeline:${event.owner.toLowerCase()}/${event.repo.toLowerCase()}`;
    try {
      // LLM actions are deferred to the cron's capped drain endpoints — a webhook must answer
      // inside the 60s function budget and must not spend it on three model calls (#199).
      const outcome = await this.store.runExclusive(lock, () =>
        runPipelineSync(
          event,
          { apply: true, deferred: WEBHOOK_DEFERRED_ACTIONS },
          this.loader,
          this.executor,
        ),
      );

      // Losing the lock is a real answer ("another run has it"), not nothing. Reporting it is
      // what makes "nothing to do" distinguishable from "silently thrown away" (#200).
      if (!outcome.ran) {
        this.logger.log(`pipeline push skipped for ${id}: lock held elsewhere`);
        return { ran: false, reason: 'lock-held' };
      }

      for (const f of outcome.result.failed) {
        this.logger.error(`pipeline push ${id}: ${f.action} failed — ${f.error}`);
      }
      return { ran: true, result: outcome.result };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.error(`pipeline push failed for ${id}: ${reason}`);
      return { ran: false, reason };
    }
  }
}
