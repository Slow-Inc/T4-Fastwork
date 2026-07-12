'use client';

import { useActionState } from 'react';
import { createProject, type ProjectFormState } from '../actions';
import { ImageUpload } from '@/components/admin/image-upload';

const initial: ProjectFormState = {};

export function ProjectForm() {
  const [state, action, pending] = useActionState(createProject, initial);

  return (
    <form action={action} className="admin-form">
      <label className="field">
        <span className="t-meta">ชื่อผลงาน *</span>
        <input name="title" required />
      </label>
      <label className="field">
        <span className="t-meta">slug (เว้นว่างให้สร้างอัตโนมัติ)</span>
        <input name="slug" placeholder="my-project" />
      </label>
      <label className="field">
        <span className="t-meta">ชื่อ (EN)</span>
        <input name="title_en" />
      </label>
      <label className="field">
        <span className="t-meta">คำอธิบายสั้น</span>
        <input name="description" />
      </label>
      <label className="field">
        <span className="t-meta">รายละเอียด</span>
        <textarea name="content" rows={5} />
      </label>
      <label className="field">
        <span className="t-meta">ลิงก์เว็บจริง</span>
        <input name="live_url" type="url" placeholder="https://…" />
      </label>
      <ImageUpload name="snapshot_image" folder="projects" />
      <label className="admin-check">
        <input type="checkbox" name="is_featured" />
        <span>แสดงเป็นผลงานแนะนำ (featured)</span>
      </label>
      <label className="admin-check">
        <input type="checkbox" name="published" defaultChecked />
        <span>เผยแพร่ทันที</span>
      </label>
      {state.error && <p className="field-err">{state.error}</p>}
      <button type="submit" className="btn" disabled={pending}>
        {pending ? 'กำลังบันทึก…' : 'บันทึกผลงาน'}
      </button>
    </form>
  );
}
