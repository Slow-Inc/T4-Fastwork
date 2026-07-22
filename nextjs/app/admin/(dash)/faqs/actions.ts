'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/server';
import { assertAdmin } from '@/lib/admin-access';
import { contentRevalidationTargets } from '@/lib/revalidate';

function revalidatePublicFaq() {
  for (const target of contentRevalidationTargets('faq')) revalidatePath(target.path, target.type);
}

export interface FaqFormState {
  error?: string;
  ok?: boolean;
}

export async function createFaq(
  _prev: FaqFormState,
  formData: FormData,
): Promise<FaqFormState> {
  await assertAdmin();
  const question = formData.get('question')?.toString().trim() ?? '';
  const answer = formData.get('answer')?.toString().trim() ?? '';
  if (!question || !answer) return { error: 'ต้องมีคำถามและคำตอบ' };

  const supabase = await createClient();
  const { error } = await supabase.from('faqs').insert({
    question,
    answer,
    category: formData.get('category')?.toString() || null,
    sort_order: Number(formData.get('sort_order')) || 0,
  });
  if (error) return { error: 'บันทึกไม่สำเร็จ' };

  revalidatePath('/admin/faqs');
  revalidatePublicFaq();
  return { ok: true };
}

export async function deleteFaq(formData: FormData) {
  await assertAdmin();
  const id = formData.get('id')?.toString();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from('faqs').delete().eq('id', Number(id));
  revalidatePath('/admin/faqs');
  revalidatePublicFaq();
}
