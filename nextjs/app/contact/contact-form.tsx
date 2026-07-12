'use client';

import { useActionState } from 'react';
import { submitContact, type ContactState } from './actions';

const initial: ContactState = { status: 'idle' };

const projectTypes = [
  { value: '', label: 'เลือกประเภทงาน (ไม่บังคับ)' },
  { value: 'saas', label: 'SaaS Platform' },
  { value: 'webapp', label: 'Web Application' },
  { value: 'ai-product', label: 'AI Product' },
  { value: 'mvp', label: 'MVP for Startup' },
  { value: 'internal-system', label: 'Internal System / Automation' },
  { value: 'other', label: 'อื่นๆ / ปรึกษาโจทย์' },
];

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContact, initial);

  if (state.status === 'success') {
    return (
      <div className="contact-success rv" role="status">
        <h3>ได้รับข้อความแล้ว ขอบคุณครับ 🙏</h3>
        <p>ทีม T4 Labs จะติดต่อกลับโดยเร็ว — หรือคุยกับผู้ช่วย AI ได้เลยระหว่างรอ</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="contact-form rv" noValidate>
      <label className="field">
        <span className="t-meta">ชื่อ *</span>
        <input name="name" type="text" required aria-invalid={!!state.errors?.name} />
        {state.errors?.name && <span className="field-err">{state.errors.name}</span>}
      </label>

      <label className="field">
        <span className="t-meta">อีเมล *</span>
        <input name="email" type="email" required aria-invalid={!!state.errors?.email} />
        {state.errors?.email && <span className="field-err">{state.errors.email}</span>}
      </label>

      <label className="field">
        <span className="t-meta">ประเภทงาน</span>
        <select name="projectType" defaultValue="">
          {projectTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="t-meta">เล่าโจทย์ของคุณ *</span>
        <textarea name="message" rows={5} required aria-invalid={!!state.errors?.message} />
        {state.errors?.message && <span className="field-err">{state.errors.message}</span>}
      </label>

      {state.message && <p className="field-err">{state.message}</p>}

      <button type="submit" className="btn" disabled={pending}>
        {pending ? 'กำลังส่ง…' : 'ส่งข้อความ'}
      </button>
    </form>
  );
}
