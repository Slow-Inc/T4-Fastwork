'use client';

import { useActionState } from 'react';
import { createPost, type PostFormState } from './actions';

const initial: PostFormState = {};

export function PostForm() {
  const [state, action, pending] = useActionState(createPost, initial);

  return (
    <form action={action} className="admin-form">
      <label className="field">
        <span className="t-meta">หัวข้อ *</span>
        <input name="title" required />
      </label>
      <label className="field">
        <span className="t-meta">slug (เว้นว่างให้สร้างอัตโนมัติ)</span>
        <input name="slug" placeholder="my-post" />
      </label>
      <label className="field">
        <span className="t-meta">คำโปรย</span>
        <input name="excerpt" />
      </label>
      <label className="field">
        <span className="t-meta">เนื้อหา (เว้นบรรทัดคู่ = ย่อหน้าใหม่)</span>
        <textarea name="content" rows={8} />
      </label>
      <div className="admin-form-row">
        <label className="field">
          <span className="t-meta">เวลาอ่าน (นาที)</span>
          <input name="read_time_min" type="number" defaultValue={5} />
        </label>
        <label className="field">
          <span className="t-meta">แท็ก (คั่นด้วย ,)</span>
          <input name="tags" placeholder="AI, SEO" />
        </label>
      </div>
      <label className="admin-check">
        <input type="checkbox" name="published" defaultChecked />
        <span>เผยแพร่ทันที</span>
      </label>
      {state.error && <p className="field-err">{state.error}</p>}
      <button type="submit" className="btn" disabled={pending}>
        {pending ? 'กำลังบันทึก…' : 'บันทึกบทความ'}
      </button>
    </form>
  );
}
