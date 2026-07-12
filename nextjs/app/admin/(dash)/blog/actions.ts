'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/server';

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
  redirect('/admin/blog');
}

export async function deletePost(formData: FormData) {
  const id = formData.get('id')?.toString();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from('blog_posts').delete().eq('id', Number(id));
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
}
