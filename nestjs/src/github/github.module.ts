/**
 * GitHub live-portfolio module (ADR 0003). Wires the READ path: the Supabase
 * snapshot store → the read service → the public GET controller.
 *
 * NOT yet imported by AppModule — like DatabaseModule, it stays out until a real
 * DATABASE_URL is set and the nestjs-on-Vercel deploy lands (prerequisite #17);
 * importing it early would make the whole app require the DB at boot. The write
 * path (refresh + webhook, secret-guarded — #20/#21) is added under
 * /security-review together with that wiring.
 */
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DrizzleSnapshotStore } from './drizzle-snapshot.store';
import { GithubReadService } from './github-read.service';
import { GithubController } from './github.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [GithubController],
  providers: [
    DrizzleSnapshotStore,
    {
      provide: GithubReadService,
      useFactory: (store: DrizzleSnapshotStore) => new GithubReadService(store),
      inject: [DrizzleSnapshotStore],
    },
  ],
  exports: [GithubReadService],
})
export class GithubModule {}
