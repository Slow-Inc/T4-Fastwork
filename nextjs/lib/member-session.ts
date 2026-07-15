import 'server-only';
import { createClient } from '@/lib/server';

export interface CurrentMember {
  slug: string;
  handle: string;
  role: string;
  roleEn: string;
  skills: string[];
  stack: string[];
  readmeVisible: boolean;
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
    .select('slug, handle, role, role_en, skills, stack, readme_visible')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    slug: data.slug,
    handle: data.handle,
    role: data.role,
    roleEn: data.role_en,
    skills: data.skills ?? [],
    stack: data.stack ?? [],
    readmeVisible: data.readme_visible ?? true,
  };
}

export interface EditableProject {
  id: number;
  name: string;
  url: string;
  tech: string[];
  year: number;
  selected: boolean;
}

/**
 * The current member's projects (Epic C / C3), ALL of them incl. unselected — via
 * the cookie client so the member's own-row RLS policy applies (the public read only
 * shows `selected`). For the project-selection UI. Empty when not a member.
 */
export async function getCurrentMemberProjects(): Promise<EditableProject[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: m } = await supabase
    .from('members')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (!m) return [];
  const { data, error } = await supabase
    .from('member_projects')
    .select('id, name, url, tech, year, selected')
    .eq('member_id', m.id)
    .order('sort_order', { ascending: true });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    url: r.url as string,
    tech: (r.tech as string[] | null) ?? [],
    year: r.year as number,
    selected: (r.selected as boolean | null) ?? true,
  }));
}

/** Whether someone is signed in (regardless of member status) — for the login page. */
export async function hasSession(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}
