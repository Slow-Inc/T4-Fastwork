'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/server';
import { assertAdmin } from '@/lib/admin-access';

/** Only these lookup tables may be edited here (guards against arbitrary table names). */
const TABLES = ['categories', 'technologies', 'tags'] as const;
type TaxTable = (typeof TABLES)[number];

function isTable(v: string): v is TaxTable {
  return (TABLES as readonly string[]).includes(v);
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export interface TermState {
  error?: string;
  ok?: boolean;
}

export async function createTerm(_prev: TermState, formData: FormData): Promise<TermState> {
  await assertAdmin();
  const table = formData.get('table')?.toString() ?? '';
  const name = formData.get('name')?.toString().trim() ?? '';
  if (!isTable(table)) return { error: 'ตารางไม่ถูกต้อง' };
  if (!name) return { error: 'ต้องมีชื่อ' };

  const row: Record<string, unknown> = { name, slug: slugify(name) };
  if (table === 'categories') {
    row.name_en = formData.get('name_en')?.toString() || null;
    row.sort_order = Number(formData.get('sort_order')) || 0;
  }

  const supabase = await createClient();
  const { error } = await supabase.from(table).insert(row);
  if (error) return { error: error.message.includes('duplicate') ? 'มีอยู่แล้ว' : 'บันทึกไม่สำเร็จ' };

  revalidatePath('/admin/taxonomy');
  return { ok: true };
}

export async function deleteTerm(formData: FormData) {
  await assertAdmin();
  const table = formData.get('table')?.toString() ?? '';
  const id = formData.get('id')?.toString();
  if (!isTable(table) || !id) return;
  const supabase = await createClient();
  await supabase.from(table).delete().eq('id', Number(id));
  revalidatePath('/admin/taxonomy');
}
