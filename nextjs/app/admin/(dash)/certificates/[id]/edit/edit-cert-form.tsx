'use client';

import { useActionState } from 'react';
import { updateCertificate, type CertState } from '../../actions';
import { ImageUpload } from '@/components/admin/image-upload';

const initial: CertState = {};

interface CertValues {
  id: number;
  title: string;
  title_en: string | null;
  issuer: string;
  issued_year: number | null;
  issuer_logo: string | null;
  thumbnail: string | null;
  full_image: string | null;
  verify_url: string | null;
  is_featured: boolean;
  sort_order: number | null;
}

export function EditCertForm({ cert }: { cert: CertValues }) {
  const [state, action, pending] = useActionState(updateCertificate, initial);

  return (
    <form action={action} className="admin-form">
      <input type="hidden" name="id" value={cert.id} />
      <label className="field">
        <span className="t-meta">ชื่อหลักสูตร *</span>
        <input name="title" defaultValue={cert.title} required />
      </label>
      <label className="field">
        <span className="t-meta">ชื่อหลักสูตร (EN)</span>
        <input name="title_en" defaultValue={cert.title_en ?? ''} />
      </label>
      <div className="admin-form-row">
        <label className="field">
          <span className="t-meta">ผู้ออก *</span>
          <input name="issuer" defaultValue={cert.issuer} required />
        </label>
        <label className="field">
          <span className="t-meta">ปี</span>
          <input name="issued_year" type="number" defaultValue={cert.issued_year ?? ''} />
        </label>
      </div>
      <label className="field">
        <span className="t-meta">ลิงก์ตรวจสอบ (verify URL)</span>
        <input name="verify_url" type="url" defaultValue={cert.verify_url ?? ''} />
      </label>
      <ImageUpload name="issuer_logo" label="โลโก้ผู้ออก" folder="certificates" defaultUrl={cert.issuer_logo ?? ''} />
      <ImageUpload name="thumbnail" label="ภาพย่อสำหรับการ์ด" folder="certificates" defaultUrl={cert.thumbnail ?? ''} />
      <ImageUpload
        name="full_image"
        label="ไฟล์ใบเต็ม (ภาพ หรือ PDF)"
        folder="certificates"
        accept="image/*,application/pdf"
        defaultUrl={cert.full_image ?? ''}
      />
      <label className="admin-check">
        <input type="checkbox" name="is_featured" defaultChecked={cert.is_featured} />
        <span>แสดงบนหน้าแรกด้วย</span>
      </label>
      <label className="field">
        <span className="t-meta">ลำดับ (sort order)</span>
        <input name="sort_order" type="number" defaultValue={cert.sort_order ?? 0} />
      </label>
      {state.error && <p className="field-err">{state.error}</p>}
      {state.ok && <p className="t-meta">บันทึกแล้ว ✓</p>}
      <button type="submit" className="btn" disabled={pending}>
        {pending ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข'}
      </button>
    </form>
  );
}
