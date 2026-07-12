'use client';

import { useActionState } from 'react';
import { updateProject, type ProjectFormState } from '../../actions';
import { ImageUpload } from '@/components/admin/image-upload';

const initial: ProjectFormState = {};

interface ProjectValues {
  id: number;
  title: string;
  title_en: string | null;
  description: string | null;
  content: string | null;
  live_url: string | null;
  snapshot_image: string | null;
  is_featured: boolean;
  published_at: string | null;
}

export function EditProjectForm({ project }: { project: ProjectValues }) {
  const [state, action, pending] = useActionState(updateProject, initial);

  return (
    <form action={action} className="admin-form">
      <input type="hidden" name="id" value={project.id} />
      <label className="field">
        <span className="t-meta">ชื่อผลงาน *</span>
        <input name="title" defaultValue={project.title} required />
      </label>
      <label className="field">
        <span className="t-meta">ชื่อ (EN)</span>
        <input name="title_en" defaultValue={project.title_en ?? ''} />
      </label>
      <label className="field">
        <span className="t-meta">คำอธิบายสั้น</span>
        <input name="description" defaultValue={project.description ?? ''} />
      </label>
      <label className="field">
        <span className="t-meta">รายละเอียด</span>
        <textarea name="content" rows={5} defaultValue={project.content ?? ''} />
      </label>
      <label className="field">
        <span className="t-meta">ลิงก์เว็บจริง</span>
        <input name="live_url" type="url" defaultValue={project.live_url ?? ''} />
      </label>
      <ImageUpload name="snapshot_image" folder="projects" defaultUrl={project.snapshot_image ?? ''} />
      <label className="admin-check">
        <input type="checkbox" name="is_featured" defaultChecked={project.is_featured} />
        <span>แสดงเป็นผลงานแนะนำ (featured)</span>
      </label>
      <label className="admin-check">
        <input type="checkbox" name="published" defaultChecked={!!project.published_at} />
        <span>เผยแพร่</span>
      </label>
      {state.error && <p className="field-err">{state.error}</p>}
      <button type="submit" className="btn" disabled={pending}>
        {pending ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข'}
      </button>
    </form>
  );
}
