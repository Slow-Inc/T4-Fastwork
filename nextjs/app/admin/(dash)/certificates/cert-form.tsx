'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createCertificate, type CertState } from './actions';
import { ImageUpload } from '@/components/admin/image-upload';

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
      <label className="field">
        <span className="t-meta">ชื่อหลักสูตร (EN)</span>
        <input name="title_en" />
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
      <label className="field">
        <span className="t-meta">ลิงก์ตรวจสอบ (verify URL)</span>
        <input name="verify_url" type="url" placeholder="https://coursera.org/verify/..." />
      </label>
      <ImageUpload name="issuer_logo" label="โลโก้ผู้ออก" folder="certificates" />
      <ImageUpload name="thumbnail" label="ภาพย่อสำหรับการ์ด" folder="certificates" />
      <ImageUpload
        name="full_image"
        label="ไฟล์ใบเต็ม (ภาพ หรือ PDF)"
        folder="certificates"
        accept="image/*,application/pdf"
      />
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
