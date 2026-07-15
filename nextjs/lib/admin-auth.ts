/**
 * Admin access gate (Requirement §10). A signed-in Supabase user is admitted only
 * if their email is on ADMIN_EMAILS (comma-separated). Fail-closed: an empty/unset
 * allowlist admits NOBODY — members can authenticate (GitHub OAuth), so admitting
 * everyone on an empty list would let any member reach /admin. Set ADMIN_EMAILS to
 * grant access.
 */
export function isAllowedAdmin(
  email: string | null | undefined,
  allowlist: string | undefined,
): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const list = (allowlist ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return false;
  return list.includes(normalized);
}
