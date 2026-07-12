'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createFaq, type FaqFormState } from './actions';

const initial: FaqFormState = {};

export function FaqForm() {
  const [state, action, pending] = useActionState(createFaq, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="admin-form admin-inline-form">
      <label className="field">
        <span className="t-meta">คำถาม *</span>
        <input name="question" required />
      </label>
      <label className="field">
        <span className="t-meta">คำตอบ *</span>
        <textarea name="answer" rows={3} required />
      </label>
      <div className="admin-form-row">
        <label className="field">
          <span className="t-meta">หมวด</span>
          <input name="category" placeholder="pricing / scope …" />
        </label>
        <label className="field">
          <span className="t-meta">ลำดับ</span>
          <input name="sort_order" type="number" defaultValue={0} />
        </label>
      </div>
      {state.error && <p className="field-err">{state.error}</p>}
      <button type="submit" className="btn" disabled={pending}>
        {pending ? 'กำลังบันทึก…' : '+ เพิ่ม FAQ'}
      </button>
    </form>
  );
}
