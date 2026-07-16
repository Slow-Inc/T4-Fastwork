/**
 * Pure helpers for the app_admins allowlist reconcile (used by
 * `seed-app-admins.ts`). Kept in their own module so tests import them without
 * running the script's top-level `main()`, and without an `import.meta` guard
 * (the Nest CommonJS build rejects `import.meta`).
 */

/** Parse a comma-separated ADMIN_EMAILS value into a normalized (trim + lowercase),
 * blank-free list. */
export function parseAdminEmails(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Diff the current app_admins set against the desired ADMIN_EMAILS set. Both sides
 * are normalized. Returns the emails to insert (newly desired) and to delete (stale —
 * present now but no longer desired). Pure. */
export function reconcileAdmins(
  current: string[],
  desired: string[],
): { toInsert: string[]; toDelete: string[] } {
  const norm = (e: string) => e.trim().toLowerCase();
  const cur = new Set(current.map(norm).filter(Boolean));
  const des = new Set(desired.map(norm).filter(Boolean));
  return {
    toInsert: [...des].filter((e) => !cur.has(e)),
    toDelete: [...cur].filter((e) => !des.has(e)),
  };
}
