/**
 * Recognise Postgres `undefined_column` so backend reads/writes can degrade to the
 * pre-migration shape instead of throwing (#198).
 *
 * Migrations land as a separate, explicitly-authorized production action, so the code is
 * always deployed first. The frontend already survives this via the
 * `PROJECT_SELECT_ATTEMPTS` ladder in `nextjs/lib/projects-select.ts`; this is the backend
 * half of the same idea — richer statement first, poorer statement on an unknown column.
 */
export function isMissingColumnError(err: unknown): boolean {
  const code = (err as { code?: unknown } | null)?.code;
  if (code === '42703') return true;
  const message = err instanceof Error ? err.message : String(err ?? '');
  return /column .* does not exist|unknown column|no such column/i.test(message);
}
