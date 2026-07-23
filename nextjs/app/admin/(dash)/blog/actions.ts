'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/server';
import { assertAdmin } from '@/lib/admin-access';
import { contentRevalidationTargets } from '@/lib/revalidate';
import { markdownFileToPostFields } from '@/lib/markdown-upload';

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

async function fieldsFromForm(formData: FormData): Promise<
  | {
      title: string;
      slug: string;
      excerpt: string | null;
      content: string | null;
      tags: string[];
      read_time_min: number;
      published: boolean;
    }
  | { error: string }
> {
  const file = formData.get('markdown');
  if (file instanceof File && file.size > 0) {
    const name = file.name || 'post.md';
    // Require a .md suffix — do not trust an empty MIME type (browsers often omit it).
    if (!/\.md$/i.test(name)) {
      return { error: 'อัปโหลดได้เฉพาะไฟล์ .md' };
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      return { error: 'อ่านไฟล์ Markdown ไม่สำเร็จ' };
    }
    try {
      const parsed = markdownFileToPostFields(text, name);
      const title = formData.get('title')?.toString().trim() || parsed.title;
      const slug =
        formData.get('slug')?.toString().trim() || slugify(parsed.slug) || parsed.slug;
      if (!title || !slug) return { error: 'ต้องมีชื่อและ slug' };
      const tags = (formData.get('tags')?.toString() ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const published = formData.get('published') === 'on';
      const readOverride = Number(formData.get('read_time_min'));
      return {
        title,
        slug,
        excerpt: formData.get('excerpt')?.toString().trim() || parsed.excerpt || null,
        content: parsed.content,
        tags,
        read_time_min: Number.isFinite(readOverride) && readOverride > 0 ? readOverride : parsed.readTimeMin,
        published,
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'ไฟล์ Markdown ไม่ถูกต้อง' };
    }
  }

  const title = formData.get('title')?.toString().trim() ?? '';
  const slug = (formData.get('slug')?.toString().trim() || slugify(title)) ?? '';
  if (!title || !slug) return { error: 'ต้องมีชื่อและ slug' };
  const tags = (formData.get('tags')?.toString() ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  return {
    title,
    slug,
    excerpt: formData.get('excerpt')?.toString() || null,
    content: formData.get('content')?.toString() || null,
    tags,
    read_time_min: Number(formData.get('read_time_min')) || 5,
    published: formData.get('published') === 'on',
  };
}

export async function createPost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  await assertAdmin();
  const fields = await fieldsFromForm(formData);
  if ('error' in fields) return { error: fields.error };

  const supabase = await createClient();
  const { error } = await supabase.from('blog_posts').insert({
    slug: fields.slug,
    title: fields.title,
    excerpt: fields.excerpt,
    content: fields.content,
    tags: fields.tags,
    read_time_min: fields.read_time_min,
    published_at: fields.published ? new Date().toISOString().slice(0, 10) : null,
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
