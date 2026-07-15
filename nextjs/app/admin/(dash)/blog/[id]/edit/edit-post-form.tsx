'use client';

import { useActionState } from 'react';
import { updatePost, type PostFormState } from '../../actions';

const initial: PostFormState = {};

interface PostValues {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  read_time_min: number | null;
  tags: string[] | null;
  published_at: string | null;
}

export function EditPostForm({ post }: { post: PostValues }) {
  const [state, action, pending] = useActionState(updatePost, initial);

  return (
    <form action={action} className="admin-form">
      <input type="hidden" name="id" value={post.id} />
      <input type="hidden" name="current_published_at" value={post.published_at ?? ''} />
      <label className="field">
        <span className="t-meta">หัวข้อ *</span>
        <input name="title" defaultValue={post.title} required />
      </label>
      <label className="field">
        <span className="t-meta">slug</span>
        <input name="slug" defaultValue={post.slug} />
      </label>
      <label className="field">
        <span className="t-meta">คำโปรย</span>
        <input name="excerpt" defaultValue={post.excerpt ?? ''} />
      </label>
      <label className="field">
        <span className="t-meta">เนื้อหา (เว้นบรรทัดคู่ = ย่อหน้าใหม่)</span>
        <textarea name="content" rows={8} defaultValue={post.content ?? ''} />
      </label>
      <div className="admin-form-row">
        <label className="field">
          <span className="t-meta">เวลาอ่าน (นาที)</span>
          <input name="read_time_min" type="number" defaultValue={post.read_time_min ?? 5} />
        </label>
        <label className="field">
          <span className="t-meta">แท็ก (คั่นด้วย ,)</span>
          <input name="tags" defaultValue={(post.tags ?? []).join(', ')} />
        </label>
      </div>
      <label className="admin-check">
        <input type="checkbox" name="published" defaultChecked={!!post.published_at} />
        <span>เผยแพร่</span>
      </label>
      {state.error && <p className="field-err">{state.error}</p>}
      <button type="submit" className="btn" disabled={pending}>
        {pending ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข'}
      </button>
    </form>
  );
}
