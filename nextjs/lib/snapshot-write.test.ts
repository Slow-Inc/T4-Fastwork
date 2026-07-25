/**
 * The cover write must survive missing capture columns (#205, completing #198).
 * Pre-0032 the unchecked `.update()` in scripts/screenshot-projects.ts had the whole statement
 * rejected — so `snapshot_image` was lost too, while the worker logged a successful capture.
 */
import { describe, it, expect } from 'bun:test';
import { writeSnapshotImage } from './snapshot-write';

type Attempt = Record<string, string>;

/** A Supabase-shaped client that rejects any patch touching `missing`. */
function dbMissing(missing: string | null) {
  const attempts: Attempt[] = [];
  const db = {
    from: () => ({
      update: (patch: Attempt) => ({
        eq: () => {
          attempts.push(patch);
          if (missing && missing in patch) {
            return Promise.resolve({
              error: {
                code: 'PGRST204',
                message: `Could not find the '${missing}' column of 'projects'`,
              },
            });
          }
          return Promise.resolve({ error: null });
        },
      }),
    }),
  };
  return { db, attempts };
}

describe('writeSnapshotImage', () => {
  it('writes the image and the trigger when both columns exist', async () => {
    const { db, attempts } = dbMissing(null);

    const res = await writeSnapshotImage(db, 4, 'https://cdn/a.png', 'push:abc');

    expect(res).toEqual({ ok: true, degraded: false });
    expect(attempts).toEqual([
      { snapshot_image: 'https://cdn/a.png', last_capture_trigger: 'push:abc' },
    ]);
  });

  it('still persists snapshot_image when last_capture_trigger does not exist yet', async () => {
    const { db, attempts } = dbMissing('last_capture_trigger');

    const res = await writeSnapshotImage(db, 4, 'https://cdn/a.png', 'push:abc');

    expect(res).toEqual({ ok: true, degraded: true });
    expect(attempts).toHaveLength(2);
    expect(attempts[1]).toEqual({ snapshot_image: 'https://cdn/a.png' });
  });

  it('reports failure instead of success when the write really fails', async () => {
    const { db } = dbMissing('snapshot_image');

    const res = await writeSnapshotImage(db, 4, 'https://cdn/a.png', 'push:abc');

    expect(res.ok).toBe(false);
  });

  it('needs no retry when there is no trigger to drop', async () => {
    const { db, attempts } = dbMissing('last_capture_trigger');

    const res = await writeSnapshotImage(db, 4, 'https://cdn/a.png');

    expect(res).toEqual({ ok: true, degraded: false });
    expect(attempts).toEqual([{ snapshot_image: 'https://cdn/a.png' }]);
  });
});
