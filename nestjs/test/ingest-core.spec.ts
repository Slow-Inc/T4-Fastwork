import { describe, it, expect } from 'bun:test';
import { runIngest } from '../src/ingestion/ingest-core';
import type { DrizzleDB } from '../src/database/database.module';
import type { EmbeddingService } from '../src/ingestion/embedding.service';

/** A chainable Drizzle stub whose every read resolves to `[]` (no content →
 * no chunks), so a test can drive `runIngest`'s control flow without a real DB. */
function emptyQuery(): unknown {
  const q: Record<string, unknown> = {
    from: () => q,
    where: () => q,
    innerJoin: () => q,
    then: (resolve: (v: unknown[]) => void) => resolve([]),
  };
  return q;
}

function fakeDb() {
  const calls = { deleted: 0, inserted: null as unknown };
  const db = {
    delete: () => {
      calls.deleted++;
      return Promise.resolve();
    },
    select: () => emptyQuery(),
    insert: () => ({
      values: (rows: unknown) => {
        calls.inserted = rows;
        return Promise.resolve();
      },
    }),
    transaction: async (cb: (tx: unknown) => Promise<void>) => cb(db),
  };
  return { db: db as unknown as DrizzleDB, calls };
}

const throwingEmbedder = {
  embedMany: async () => {
    throw new Error('embed endpoint down');
  },
} as unknown as EmbeddingService;

describe('runIngest (#74 — atomic replace)', () => {
  it('does not delete existing embeddings when embedding fails', async () => {
    const { db, calls } = fakeDb();
    await expect(runIngest(db, throwingEmbedder)).rejects.toThrow(
      'embed endpoint down',
    );
    // The old embeddings must survive a failed re-embed — otherwise a transient
    // embedding-API outage after a GitHub refresh leaves the chat's RAG empty.
    expect(calls.deleted).toBe(0);
  });

  it('replaces through a transaction on success (delete goes via the tx path)', async () => {
    const { db, calls } = fakeDb();
    const okEmbedder = {
      embedMany: async (texts: string[]) => texts.map(() => [0.1]),
    } as unknown as EmbeddingService;
    const res = await runIngest(db, okEmbedder);
    expect(calls.deleted).toBe(1); // delete happened — but inside db.transaction now
    expect(res.chunks).toBe(0);
  });
});
