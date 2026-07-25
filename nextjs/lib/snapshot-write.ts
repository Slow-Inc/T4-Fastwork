/**
 * Persist a captured cover for the screenshot worker (#205, completing #198).
 *
 * Split out of `scripts/screenshot-projects.ts` because that script runs `main()` on import and
 * so cannot be unit-tested: its `.update()` never checked `error`, so before migration 0032
 * PostgREST rejected the whole patch over `last_capture_trigger` and `snapshot_image` was lost
 * with it — while the worker logged the capture as a success.
 */
import { isMissingProjectColumnError } from './projects-select';

type WriteError = { code?: string; message?: string } | null;

/** The narrow slice of a Supabase client this needs — the Action script has no typed schema. */
export type SnapshotWriteDb = {
  from(table: string): {
    update(patch: Record<string, string>): {
      eq(column: string, value: number): PromiseLike<{ error: WriteError }>;
    };
  };
};

export type SnapshotWriteResult =
  | { ok: true; degraded: boolean }
  | { ok: false; error: WriteError };

/**
 * Writes `snapshot_image` (plus `last_capture_trigger` when given). If only the trigger column
 * is missing, retries without it — the image is the thing users see, so it must still land.
 * `degraded` is true when the trigger could not be recorded.
 */
export async function writeSnapshotImage(
  db: SnapshotWriteDb,
  id: number,
  url: string,
  trigger?: string,
): Promise<SnapshotWriteResult> {
  const withTrigger = await update(db, id, { snapshot_image: url, ...(trigger ? { last_capture_trigger: trigger } : {}) });
  if (!withTrigger) return { ok: true, degraded: false };
  if (!trigger || !isMissingProjectColumnError(withTrigger)) {
    return { ok: false, error: withTrigger };
  }

  const imageOnly = await update(db, id, { snapshot_image: url });
  if (imageOnly) return { ok: false, error: imageOnly };
  return { ok: true, degraded: true };
}

async function update(
  db: SnapshotWriteDb,
  id: number,
  patch: Record<string, string>,
): Promise<WriteError> {
  const res = await db.from('projects').update(patch).eq('id', id);
  return res?.error ?? null;
}
