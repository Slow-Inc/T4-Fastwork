import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PgMemberProjectStore } from './pg-member-project-store';
import { DrizzleSnapshotStore } from './drizzle-snapshot.store';
import {
  GithubMemberSyncController,
  MEMBER_PROJECT_STORE,
  MEMBER_SNAPSHOT_READER,
} from './github-member-sync.controller';

/**
 * Wires the member-projects sync (B4): the Postgres member/project store + the snapshot
 * reader (both over the Drizzle pooler, RLS-bypassing) behind the secret-guarded
 * `POST /github/sync-member-projects` trigger (dry-run by default). Mirrors
 * GithubCurateModule. Add to AppModule.imports to activate.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [GithubMemberSyncController],
  providers: [
    { provide: MEMBER_PROJECT_STORE, useClass: PgMemberProjectStore },
    { provide: MEMBER_SNAPSHOT_READER, useClass: DrizzleSnapshotStore },
  ],
})
export class GithubMemberSyncModule {}
