import 'server-only';
import { createClient } from '@/lib/server';
import { isAllowedAdmin } from '@/lib/admin-auth';

export interface AdminSession {
  /** A label for the signed-in admin (member handle, or email for the fallback). */
  display: string | null;
  isAdmin: boolean;
}

/**
 * Unified admin gate (Epic C; flattened 2026-07-22 — mirrors DB `is_app_admin()`, 0023).
 * The team is flat: every linked team member is a full admin. Two paths into /admin:
 *  - **Primary (GitHub):** the signed-in user is a linked member (has a `members` row whose
 *    `auth_user_id` matches — the allowlist enforced by `link_current_member`, 0005). The
 *    old `is_admin` flag is no longer consulted (it's vestigial; the team has no member/
 *    admin split).
 *  - **Fallback (break-glass):** their email is on ADMIN_EMAILS (email/password login).
 * Fail-closed elsewhere (not linked + empty ADMIN_EMAILS = no). This is defense-in-depth
 * only — the DB RLS + is_app_admin() is the real authority (ADR 0007).
 */
export async function getAdminSession(): Promise<AdminSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { display: null, isAdmin: false };

  if (isAllowedAdmin(user.email, process.env.ADMIN_EMAILS)) {
    return { display: user.email ?? 'admin', isAdmin: true };
  }

  const { data } = await supabase
    .from('members')
    .select('handle')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (data) {
    return { display: data.handle ?? user.email ?? 'admin', isAdmin: true };
  }
  return { display: user.email ?? null, isAdmin: false };
}

/**
 * Guard for admin **Server Actions** (Epic C). The /admin layout only gates page
 * rendering; a Server Action is a separately-callable POST endpoint, so a signed-in
 * non-admin (members can GitHub-login) could invoke it directly. The RLS-backed tables
 * (members/blog_posts/member_*) reject that, but projects/services/faqs/certificates/
 * taxonomy have no RLS — so every admin mutation must re-assert admin itself. Throws
 * when not an admin.
 */
export async function assertAdmin(): Promise<void> {
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) throw new Error('unauthorized: admin only');
}
