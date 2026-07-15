import 'server-only';
import { createClient } from '@/lib/server';
import { isAllowedAdmin } from '@/lib/admin-auth';

export interface AdminSession {
  /** A label for the signed-in admin (member handle, or email for the fallback). */
  display: string | null;
  isAdmin: boolean;
}

/**
 * Unified admin gate (Epic C). Two paths into /admin:
 *  - **Primary (GitHub):** the signed-in user is a member flagged `is_admin`.
 *  - **Fallback (break-glass):** their email is on ADMIN_EMAILS (email/password login).
 * So the team logs in once with GitHub and admins reach the CMS; the old email login
 * still works if configured. Fail-closed elsewhere (empty ADMIN_EMAILS + no flag = no).
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
    .select('is_admin, handle')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (data?.is_admin === true) {
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
