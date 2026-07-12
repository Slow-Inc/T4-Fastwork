'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createCertificate, type CertState } from './actions';

const initial: CertState = {};

export function CertForm() {
  const [state, action, pending] = useActionState(createCertificate, initial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="admin-form admin-inline-form">
      <label className="field">
        <span className="t-meta">ชื่อหลักสูตร *</span>
        <input name="title" required />
      </label>
      <div className="admin-form-row">
        <label className="field">
          <span className="t-meta">ผู้ออก *</span>
          <input name="issuer" required />
        </label>
        <label className="field">
          <span className="t-meta">ปี</span>
          <input name="issued_year" type="number" placeholder="2025" />
        </label>
      </div>
      <label className="admin-check">
        <input type="checkbox" name="is_featured" />
        <span>แสดงบนหน้าแรกด้วย</span>
      </label>
      <input type="hidden" name="sort_order" defaultValue={0} />
      {state.error && <p className="field-err">{state.error}</p>}
      <button type="submit" className="btn" disabled={pending}>
        {pending ? 'กำลังบันทึก…' : '+ เพิ่มใบรับรอง'}
      </button>
    </form>
  );
}
