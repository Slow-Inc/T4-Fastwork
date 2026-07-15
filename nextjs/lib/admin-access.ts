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
