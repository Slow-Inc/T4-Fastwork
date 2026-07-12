'use server';

import { createClient } from '@/lib/server';
import { validateContact } from '@/lib/contact-validation';

export interface ContactState {
  status: 'idle' | 'success' | 'error';
  errors?: Partial<Record<'name' | 'email' | 'message', string>>;
  message?: string;
}

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const result = validateContact({
    name: formData.get('name')?.toString(),
    email: formData.get('email')?.toString(),
    projectType: formData.get('projectType')?.toString(),
    message: formData.get('message')?.toString(),
  });

  if (!result.ok) {
    return { status: 'error', errors: result.errors };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('leads').insert({
      name: result.value.name,
      email: result.value.email,
      project_type: result.value.projectType,
      message: result.value.message,
      source_page: '/contact',
    });
    if (error) throw error;
  } catch {
    return {
      status: 'error',
      message: 'ส่งข้อความไม่สำเร็จ กรุณาลองใหม่ หรือติดต่อผ่าน Fastwork',
    };
  }

  return { status: 'success' };
}
