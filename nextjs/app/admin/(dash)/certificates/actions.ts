'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/server';

export interface CertState {
  error?: string;
  ok?: boolean;
}

function revalidatePublic() {
  revalidatePath('/admin/certificates');
  revalidatePath('/');
  revalidatePath('/about');
}

export async function createCertificate(_prev: CertState, formData: FormData): Promise<CertState> {
  const title = formData.get('title')?.toString().trim() ?? '';
  const issuer = formData.get('issuer')?.toString().trim() ?? '';
  if (!title || !issuer) return { error: 'ต้องมีชื่อหลักสูตรและผู้ออก' };

  const supabase = await createClient();
  const { error } = await supabase.from('certificates').insert({
    title,
    issuer,
    issued_year: Number(formData.get('issued_year')) || null,
    is_featured: formData.get('is_featured') === 'on',
    sort_order: Number(formData.get('sort_order')) || 0,
  });
  if (error) return { error: 'บันทึกไม่สำเร็จ' };

  revalidatePublic();
  return { ok: true };
}

export async function deleteCertificate(formData: FormData) {
  const id = formData.get('id')?.toString();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from('certificates').delete().eq('id', Number(id));
  revalidatePublic();
}
