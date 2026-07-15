import 'server-only';
import { createClient } from '@/lib/server';

export interface CurrentMember {
  slug: string;
  handle: string;
  role: string;
  roleEn: string;
}

/**
 * The member linked to the current Supabase session (Epic C / C2), or null when
 * not signed in or the signed-in GitHub user isn't a team member. Scoping is by
 * `auth_user_id` — a session only ever resolves to its own member row.
 */
export async function getCurrentMember(): Promise<CurrentMember | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('members')
    .select('slug, handle, role, role_en')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    slug: data.slug,
    handle: data.handle,
    role: data.role,
    roleEn: data.role_en,
  };
}

/** Whether someone is signed in (regardless of member status) — for the login page. */
export async function hasSession(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}
