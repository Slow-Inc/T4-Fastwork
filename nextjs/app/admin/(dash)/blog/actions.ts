'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/server';
import { assertAdmin } from '@/lib/admin-access';
import { contentRevalidationTargets } from '@/lib/revalidate';

function revalidatePublicBlog() {
  for (const target of contentRevalidationTargets('blog')) revalidatePath(target.path, target.type);
}

export interface PostFormState {
  error?: string;
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function createPost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  await assertAdmin();
  const title = formData.get('title')?.toString().trim() ?? '';
  const slug = (formData.get('slug')?.toString().trim() || slugify(title)) ?? '';
  if (!title || !slug) return { error: 'ต้องมีชื่อและ slug' };

  const tags = (formData.get('tags')?.toString() ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const published = formData.get('published') === 'on';

  const supabase = await createClient();
  const { error } = await supabase.from('blog_posts').insert({
    slug,
    title,
    excerpt: formData.get('excerpt')?.toString() || null,
    content: formData.get('content')?.toString() || null,
    tags,
    read_time_min: Number(formData.get('read_time_min')) || 5,
    published_at: published ? new Date().toISOString().slice(0, 10) : null,
  });
  if (error) return { error: error.message.includes('duplicate') ? 'slug นี้มีอยู่แล้ว' : 'บันทึกไม่สำเร็จ' };

  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  revalidatePublicBlog();
  redirect('/admin/blog');
}

export async function updatePost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  await assertAdmin();
  const id = Number(formData.get('id'));
  const title = formData.get('title')?.toString().trim() ?? '';
  const slug = (formData.get('slug')?.toString().trim() || slugify(title)) ?? '';
  if (!id) return { error: 'ไม่พบบทความ' };
  if (!title || !slug) return { error: 'ต้องมีชื่อและ slug' };

  const tags = (formData.get('tags')?.toString() ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const published = formData.get('published') === 'on';
  // Preserve the original publish date when the post was already published — only
  // stamp today when it's a draft→publish transition; clear it when unpublishing.
  const currentPublishedAt =
    formData.get('current_published_at')?.toString().trim() || null;
  const publishedAt = published
    ? (currentPublishedAt ?? new Date().toISOString().slice(0, 10))
    : null;

  const supabase = await createClient();
  const { error } = await supabase
    .from('blog_posts')
    .update({
      slug,
      title,
      excerpt: formData.get('excerpt')?.toString() || null,
      content: formData.get('content')?.toString() || null,
      tags,
      read_time_min: Number(formData.get('read_time_min')) || 5,
      published_at: publishedAt,
    })
    .eq('id', id);
  if (error) return { error: error.message.includes('duplicate') ? 'slug นี้มีอยู่แล้ว' : 'บันทึกไม่สำเร็จ' };

  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  revalidatePublicBlog();
  redirect('/admin/blog');
}

export async function deletePost(formData: FormData) {
  await assertAdmin();
  const id = formData.get('id')?.toString();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from('blog_posts').delete().eq('id', Number(id));
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  revalidatePublicBlog();
}
