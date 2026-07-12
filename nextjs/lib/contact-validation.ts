/** Pure validation for the contact/lead form (Requirement §4.6 / §6.7). */
export interface ContactInput {
  name?: string;
  email?: string;
  projectType?: string;
  message?: string;
}

export interface ContactValue {
  name: string;
  email: string;
  projectType: string;
  message: string;
}

export type ContactResult =
  | { ok: true; value: ContactValue }
  | { ok: false; errors: Partial<Record<keyof ContactValue, string>> };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(input: ContactInput): ContactResult {
  const name = (input.name ?? '').trim();
  const email = (input.email ?? '').trim();
  const projectType = (input.projectType ?? '').trim();
  const message = (input.message ?? '').trim();

  const errors: Partial<Record<keyof ContactValue, string>> = {};
  if (!name) errors.name = 'กรุณากรอกชื่อ';
  if (!EMAIL.test(email)) errors.email = 'อีเมลไม่ถูกต้อง';
  if (message.length < 5) errors.message = 'กรุณาอธิบายโจทย์อย่างน้อย 5 ตัวอักษร';

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { name, email, projectType, message } };
}
