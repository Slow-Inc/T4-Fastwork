/**
 * GitHub live-portfolio module (ADR 0003). Wires the full data/API layer:
 *   - store: DrizzleSnapshotStore over `github_snapshots`
 *   - read:  GithubReadService → public GET controller (SWR cache headers)
 *   - write: GithubFetcher → GithubSnapshotService → GithubRefreshService,
 *            plus the webhook path (verify → dedup → SnapshotOwnerRefresher),
 *            behind secret-authenticated POST endpoints.
 *
 * Requires a real DATABASE_URL (Supabase Supavisor pooler) — imported by
 * AppModule now that the DB is configured. The GitHub token + endpoint secrets
 * are read from env at construction (fail-closed when unset).
 */
import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DrizzleSnapshotStore } from './drizzle-snapshot.store';
import { PgShowcaseRepoStore } from './pg-showcase-repos.store';
import { GithubFetcher, GithubSnapshotService } from './github.service';
import { GithubDetailService } from './github-detail.service';
import { GithubHealService } from './github-heal.service';
import {
  GithubRefreshService,
  SnapshotOwnerRefresher,
} from './github-refresh.service';
import { GithubWebhookService } from './github-webhook.service';
import { GithubReadService } from './github-read.service';
import { GithubController } from './github.controller';
import { GithubWriteController } from './github-write.controller';
import { RagIngestService } from '../ingestion/rag-ingest.service';
import { RevalidateModule } from '../revalidate/revalidate.module';
import { PipelineSyncModule } from './pipeline-sync.module';
import { PipelinePushRunner } from './pipeline-push-runner';
import { PgPipelineSyncStore } from './pg-pipeline-sync.store';

@Module({
  imports: [
    DatabaseModule,
    RevalidateModule,
    forwardRef(() => PipelineSyncModule),
  ],
  controllers: [GithubController, GithubWriteController],
  providers: [
    DrizzleSnapshotStore,
    PgShowcaseRepoStore,
    {
      provide: GithubFetcher,
      useFactory: () => new GithubFetcher(globalThis.fetch),
    },
    {
      provide: GithubSnapshotService,
      useFactory: (fetcher: GithubFetcher, store: DrizzleSnapshotStore) =>
        new GithubSnapshotService(fetcher, store),
      inject: [GithubFetcher, DrizzleSnapshotStore],
    },
    {
      provide: GithubDetailService,
      useFactory: (syncer: GithubSnapshotService) =>
        new GithubDetailService(syncer),
      inject: [GithubSnapshotService],
    },
    {
      provide: GithubHealService,
      useFactory: (
        syncer: GithubSnapshotService,
        store: DrizzleSnapshotStore,
      ) => new GithubHealService(syncer, store),
      inject: [GithubSnapshotService, DrizzleSnapshotStore],
    },
    {
      provide: GithubRefreshService,
      useFactory: (
        syncer: GithubSnapshotService,
        detail: GithubDetailService,
        showcaseRepos: PgShowcaseRepoStore,
        // #223 — the hourly detail loop records that it reached each repo. Without it only pushes
        // and Vercel deploys record, so a repo nobody pushed to reads stale however healthy it is.
        outcomes: PgPipelineSyncStore,
      ) =>
        new GithubRefreshService(
          syncer,
          undefined,
          undefined,
          detail,
          undefined,
          showcaseRepos,
          outcomes,
        ),
      inject: [
        GithubSnapshotService,
        GithubDetailService,
        PgShowcaseRepoStore,
        PgPipelineSyncStore,
      ],
    },
    {
      provide: SnapshotOwnerRefresher,
      useFactory: (syncer: GithubSnapshotService) =>
        new SnapshotOwnerRefresher(syncer),
      inject: [GithubSnapshotService],
    },
    {
      provide: GithubWebhookService,
      useFactory: (
        store: DrizzleSnapshotStore,
        refresher: SnapshotOwnerRefresher,
        pipeline: PipelinePushRunner,
      ) =>
        new GithubWebhookService(
          process.env.GITHUB_WEBHOOK_SECRET ?? '',
          store,
          refresher,
          pipeline,
        ),
      inject: [
        DrizzleSnapshotStore,
        SnapshotOwnerRefresher,
        PipelinePushRunner,
      ],
    },
    {
      provide: GithubReadService,
      useFactory: (store: DrizzleSnapshotStore) => new GithubReadService(store),
      inject: [DrizzleSnapshotStore],
    },
    // #60 — re-ingest RAG when a refresh changes GitHub-sourced content.
    RagIngestService,
  ],
  exports: [GithubReadService, DrizzleSnapshotStore],
})
export class GithubModule {}
