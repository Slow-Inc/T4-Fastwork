import { describe, it, expect, afterEach } from 'bun:test';
import { Test } from '@nestjs/testing';
import { GithubModule } from '../src/github/github.module';
import { GithubReadService } from '../src/github/github-read.service';
import { GithubWriteController } from '../src/github/github-write.controller';
import { DRIZZLE } from '../src/database/database.module';

/**
 * DI smoke: the whole module must resolve every provider/controller. This
 * catches wiring mistakes (missing/mis-injected providers) without a live DB —
 * the Drizzle client is created lazily and only connects on the first query.
 */
describe('GithubModule wiring', () => {
  let mod: Awaited<ReturnType<typeof compile>> | null = null;

  async function compile() {
    // Stub the DB client — the smoke validates github wiring, not a live
    // connection (DrizzleSnapshotStore only queries at request time).
    return Test.createTestingModule({ imports: [GithubModule] })
      .overrideProvider(DRIZZLE)
      .useValue({})
      .compile();
  }

  afterEach(async () => {
    if (mod) await mod.close();
    mod = null;
  });

  it('resolves the read service and the write controller', async () => {
    mod = await compile();
    expect(mod.get(GithubReadService)).toBeDefined();
    expect(mod.get(GithubWriteController)).toBeInstanceOf(GithubWriteController);
  });
});
