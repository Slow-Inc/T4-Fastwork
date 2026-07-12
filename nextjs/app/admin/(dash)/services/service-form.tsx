'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createService, type ServiceFormState } from './actions';

const initial: ServiceFormState = {};

export function ServiceForm() {
  const [state, action, pending] = useActionState(createService, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="admin-form admin-inline-form">
      <div className="admin-form-row">
        <label className="field">
          <span className="t-meta">ลำดับที่</span>
          <input name="number" type="number" placeholder="1" />
        </label>
        <label className="field">
          <span className="t-meta">ชื่อบริการ *</span>
          <input name="title" required />
        </label>
      </div>
      <label className="field">
        <span className="t-meta">กลุ่มที่เหมาะ</span>
        <input name="target_audience" placeholder="startup, องค์กร …" />
      </label>
      <label className="field">
        <span className="t-meta">คำอธิบาย</span>
        <textarea name="description" rows={2} />
      </label>
      <input name="sort_order" type="hidden" defaultValue={0} />
      {state.error && <p className="field-err">{state.error}</p>}
      <button type="submit" className="btn" disabled={pending}>
        {pending ? 'กำลังบันทึก…' : '+ เพิ่มบริการ'}
      </button>
    </form>
  );
}
