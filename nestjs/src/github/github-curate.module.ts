import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PgProjectDraftStore } from './pg-project-draft-store';
import { DrizzleSnapshotStore } from './drizzle-snapshot.store';
import {
  GithubCurateController,
  PROJECT_DRAFT_STORE,
  SNAPSHOT_READER,
} from './github-curate.controller';

/**
 * Wires GitHub-repo → draft-project curation (spec P2): the Postgres draft store
 * and the snapshot reader (both over the Drizzle pooler, which bypasses RLS)
 * behind the secret-guarded `POST /github/curate` trigger (dry-run by default).
 * Mirrors GithubGenerateModule. Add to AppModule.imports to activate.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [GithubCurateController],
  providers: [
    { provide: PROJECT_DRAFT_STORE, useClass: PgProjectDraftStore },
    { provide: SNAPSHOT_READER, useClass: DrizzleSnapshotStore },
  ],
})
export class GithubCurateModule {}
