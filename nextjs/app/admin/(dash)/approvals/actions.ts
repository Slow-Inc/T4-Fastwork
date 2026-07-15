'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/server';

/**
 * Approve / un-publish a member-authored certificate (Epic C / C4). The status change
 * goes through the SECURITY DEFINER RPC `admin_set_member_certificate_status`, which
 * bypasses the member column-grant (that withholds `status`) but is gated to admins by
 * `is_app_admin()` (the JWT email must be in app_admins). The /admin layout already
 * blocks non-admins; this is the DB-level second line.
 */
export async function setMemberCertStatus(formData: FormData) {
  const id = Number(formData.get('id'));
  const status = String(formData.get('status') ?? '');
  const slug = formData.get('slug')?.toString();
  if (!id || (status !== 'published' && status !== 'draft')) return;

  const supabase = await createClient();
  await supabase.rpc('admin_set_member_certificate_status', {
    p_id: id,
    p_status: status,
  });

  revalidatePath('/admin/approvals');
  if (slug) revalidatePath(`/team/${slug}`);
}

/**
 * Publish / unpublish a member-authored blog post (Epic C / C4c). Admins hold the
 * is_app_admin RLS policy on blog_posts, so a direct update of published_at is allowed
 * (members can't set it — their policies require published_at is null).
 */
export async function setBlogStatus(formData: FormData) {
  const id = Number(formData.get('id'));
  const publish = formData.get('publish') === '1';
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from('blog_posts')
    .update({ published_at: publish ? new Date().toISOString().slice(0, 10) : null })
    .eq('id', id);

  revalidatePath('/admin/approvals');
  revalidatePath('/blog');
}
