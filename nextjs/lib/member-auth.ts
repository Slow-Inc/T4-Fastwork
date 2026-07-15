/**
 * Member access (Epic C / C2). A member logs in with GitHub (Supabase Auth); we
 * identify them by their GitHub login — matched against `members.github_login`,
 * NOT `handle` (they can differ, e.g. handle `xenodev` vs login `xenodeve`) and
 * NOT email (a member's GitHub email may be private). A user whose login isn't a
 * known member gets no member access. `githubLoginFromUser` is the pure seam.
 */

interface SupabaseUserLike {
  user_metadata?: Record<string, unknown> | null;
}

/** The lowercased GitHub login from a Supabase (GitHub-provider) user, or null. */
export function githubLoginFromUser(
  user: SupabaseUserLike | null | undefined,
): string | null {
  const meta = user?.user_metadata ?? {};
  const raw = meta.user_name ?? meta.preferred_username ?? meta.nickname;
  return typeof raw === 'string' && raw.trim().length > 0
    ? raw.trim().toLowerCase()
    : null;
}
