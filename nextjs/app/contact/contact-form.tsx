'use client';

import { useActionState } from 'react';
import { submitContact, type ContactState } from './actions';
import { useLocale } from '@/i18n/locale-context';

const initial: ContactState = { status: 'idle' };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContact, initial);
  const { locale } = useLocale();
  const en = locale === 'en';
  const t = (th: string, e: string) => (en ? e : th);

  const projectTypes = [
    { value: '', label: t('เลือกประเภทงาน (ไม่บังคับ)', 'Project type (optional)') },
    { value: 'saas', label: 'SaaS Platform' },
    { value: 'webapp', label: 'Web Application' },
    { value: 'ai-product', label: 'AI Product' },
    { value: 'mvp', label: 'MVP for Startup' },
    { value: 'internal-system', label: 'Internal System / Automation' },
    { value: 'other', label: t('อื่นๆ / ปรึกษาโจทย์', 'Something else') },
  ];

  if (state.status === 'success') {
    return (
      <div className="contact-success rv" role="status">
        <h3>{t('ได้รับข้อความแล้ว ขอบคุณครับ 🙏', 'Got your message — thank you 🙏')}</h3>
        <p>
          {t(
            'ทีม T4 Labs จะติดต่อกลับโดยเร็ว — หรือคุยกับผู้ช่วย AI ได้เลยระหว่างรอ',
            'The T4 Labs team will get back to you shortly — or chat with the AI while you wait.',
          )}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="contact-form rv" noValidate>
      <label className="field">
        <span className="t-meta">{t('ชื่อ *', 'Name *')}</span>
        <input name="name" type="text" required aria-invalid={!!state.errors?.name} />
        {state.errors?.name && <span className="field-err">{state.errors.name}</span>}
      </label>

      <label className="field">
        <span className="t-meta">{t('อีเมล *', 'Email *')}</span>
        <input name="email" type="email" required aria-invalid={!!state.errors?.email} />
        {state.errors?.email && <span className="field-err">{state.errors.email}</span>}
      </label>

      <label className="field">
        <span className="t-meta">{t('ประเภทงาน', 'Project type')}</span>
        <select name="projectType" defaultValue="">
          {projectTypes.map((pt) => (
            <option key={pt.value} value={pt.value}>
              {pt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="t-meta">{t('เล่าโจทย์ของคุณ *', 'Tell us about your project *')}</span>
        <textarea name="message" rows={5} required aria-invalid={!!state.errors?.message} />
        {state.errors?.message && <span className="field-err">{state.errors.message}</span>}
      </label>

      {state.message && <p className="field-err">{state.message}</p>}

      <button type="submit" className="btn" disabled={pending}>
        {pending ? t('กำลังส่ง…', 'Sending…') : t('ส่งข้อความ', 'Send message')}
      </button>
    </form>
  );
}
