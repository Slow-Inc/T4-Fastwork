/**
 * Admin access gate (Requirement §10). A signed-in Supabase user is admitted
 * only if their email is on ADMIN_EMAILS (comma-separated). If the allowlist is
 * empty, any authenticated user is admitted — set ADMIN_EMAILS in production.
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
  if (list.length === 0) return true;
  return list.includes(normalized);
}
