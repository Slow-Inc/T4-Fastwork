import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { RevalidateModule } from '../revalidate/revalidate.module';
import { GithubModule } from './github.module';
import {
  LiveUrlController,
  LIVE_URL_SNAPSHOTS,
  LIVE_URL_STORE,
} from './live-url.controller';
import { PgLiveUrlStore } from './pg-live-url.store';
import { LiveUrlSnapshotAdapter } from './live-url-snapshot.adapter';

@Module({
  imports: [DatabaseModule, RevalidateModule, forwardRef(() => GithubModule)],
  controllers: [LiveUrlController],
  providers: [
    PgLiveUrlStore,
    LiveUrlSnapshotAdapter,
    { provide: LIVE_URL_STORE, useExisting: PgLiveUrlStore },
    { provide: LIVE_URL_SNAPSHOTS, useExisting: LiveUrlSnapshotAdapter },
  ],
  exports: [LIVE_URL_STORE, LIVE_URL_SNAPSHOTS, PgLiveUrlStore],
})
export class LiveUrlModule {}
