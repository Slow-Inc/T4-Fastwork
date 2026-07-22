'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/server';
import { assertAdmin } from '@/lib/admin-access';
import { contentRevalidationTargets } from '@/lib/revalidate';

function revalidatePublicServices() {
  for (const target of contentRevalidationTargets('service')) revalidatePath(target.path, target.type);
}

export interface ServiceFormState {
  error?: string;
  ok?: boolean;
}

export async function createService(
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  await assertAdmin();
  const title = formData.get('title')?.toString().trim() ?? '';
  if (!title) return { error: 'ต้องมีชื่อบริการ' };

  const supabase = await createClient();
  const { error } = await supabase.from('services').insert({
    title,
    number: Number(formData.get('number')) || null,
    target_audience: formData.get('target_audience')?.toString() || null,
    description: formData.get('description')?.toString() || null,
    sort_order: Number(formData.get('sort_order')) || 0,
  });
  if (error) return { error: 'บันทึกไม่สำเร็จ' };

  revalidatePath('/admin/services');
  revalidatePublicServices();
  return { ok: true };
}

export async function deleteService(formData: FormData) {
  await assertAdmin();
  const id = formData.get('id')?.toString();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from('services').delete().eq('id', Number(id));
  revalidatePath('/admin/services');
  revalidatePublicServices();
}
