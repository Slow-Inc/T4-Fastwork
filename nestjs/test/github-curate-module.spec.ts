import { describe, it, expect } from 'bun:test';
import { Test } from '@nestjs/testing';
import { GithubCurateModule } from '../src/github/github-curate.module';
import { GithubCurateController } from '../src/github/github-curate.controller';
import { DRIZZLE } from '../src/database/database.module';

// DI smoke test: the module compiles with a stub DB (no live pooler), proving the
// PROJECT_DRAFT_STORE / SNAPSHOT_READER providers resolve and the controller wires.
describe('GithubCurateModule', () => {
  it('compiles and provides the curate controller', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GithubCurateModule],
    })
      .overrideProvider(DRIZZLE)
      .useValue({})
      .compile();

    expect(moduleRef.get(GithubCurateController)).toBeInstanceOf(
      GithubCurateController,
    );
  });
});
