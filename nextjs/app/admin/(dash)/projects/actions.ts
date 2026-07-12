'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/server';

export interface ProjectFormState {
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

export async function createProject(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const title = formData.get('title')?.toString().trim() ?? '';
  const slug = (formData.get('slug')?.toString().trim() || slugify(title)) ?? '';
  if (!title || !slug) return { error: 'ต้องมีชื่อและ slug' };

  const published = formData.get('published') === 'on';
  const supabase = await createClient();
  const { error } = await supabase.from('projects').insert({
    slug,
    title,
    title_en: formData.get('title_en')?.toString() || null,
    description: formData.get('description')?.toString() || null,
    content: formData.get('content')?.toString() || null,
    live_url: formData.get('live_url')?.toString() || null,
    is_featured: formData.get('is_featured') === 'on',
    published_at: published ? new Date().toISOString() : null,
  });

  if (error) {
    return { error: error.message.includes('duplicate') ? 'slug นี้มีอยู่แล้ว' : 'บันทึกไม่สำเร็จ' };
  }

  revalidatePath('/admin/projects');
  revalidatePath('/projects');
  redirect('/admin/projects');
}

export async function deleteProject(formData: FormData) {
  const id = formData.get('id')?.toString();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from('projects').delete().eq('id', Number(id));
  revalidatePath('/admin/projects');
  revalidatePath('/projects');
}
