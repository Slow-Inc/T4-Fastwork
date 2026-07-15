'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/server';
import { assertAdmin } from '@/lib/admin-access';

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
  await assertAdmin();
  const title = formData.get('title')?.toString().trim() ?? '';
  const issuer = formData.get('issuer')?.toString().trim() ?? '';
  if (!title || !issuer) return { error: 'ต้องมีชื่อหลักสูตรและผู้ออก' };

  const supabase = await createClient();
  const { error } = await supabase.from('certificates').insert({
    title,
    title_en: formData.get('title_en')?.toString().trim() || null,
    issuer,
    issuer_logo: formData.get('issuer_logo')?.toString().trim() || null,
    issued_year: Number(formData.get('issued_year')) || null,
    thumbnail: formData.get('thumbnail')?.toString().trim() || null,
    full_image: formData.get('full_image')?.toString().trim() || null,
    verify_url: formData.get('verify_url')?.toString().trim() || null,
    is_featured: formData.get('is_featured') === 'on',
    sort_order: Number(formData.get('sort_order')) || 0,
  });
  if (error) return { error: 'บันทึกไม่สำเร็จ' };

  revalidatePublic();
  return { ok: true };
}

export async function updateCertificate(_prev: CertState, formData: FormData): Promise<CertState> {
  await assertAdmin();
  const id = Number(formData.get('id'));
  const title = formData.get('title')?.toString().trim() ?? '';
  const issuer = formData.get('issuer')?.toString().trim() ?? '';
  if (!id) return { error: 'ไม่พบใบรับรอง' };
  if (!title || !issuer) return { error: 'ต้องมีชื่อหลักสูตรและผู้ออก' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('certificates')
    .update({
      title,
      title_en: formData.get('title_en')?.toString().trim() || null,
      issuer,
      issuer_logo: formData.get('issuer_logo')?.toString().trim() || null,
      issued_year: Number(formData.get('issued_year')) || null,
      thumbnail: formData.get('thumbnail')?.toString().trim() || null,
      full_image: formData.get('full_image')?.toString().trim() || null,
      verify_url: formData.get('verify_url')?.toString().trim() || null,
      is_featured: formData.get('is_featured') === 'on',
      sort_order: Number(formData.get('sort_order')) || 0,
    })
    .eq('id', id);
  if (error) return { error: 'บันทึกไม่สำเร็จ' };

  revalidatePublic();
  return { ok: true };
}

export async function deleteCertificate(formData: FormData) {
  await assertAdmin();
  const id = formData.get('id')?.toString();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from('certificates').delete().eq('id', Number(id));
  revalidatePublic();
}
