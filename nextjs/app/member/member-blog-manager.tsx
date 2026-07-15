'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/client';
import { slugify } from '@/lib/slugify';
import type { EditableBlogPost } from '@/lib/member-session';

/**
 * Member blog authoring (Epic C / C4c, additive per D4). A member drafts an article;
 * RLS forces it to a draft (published_at null) scoped to their own author_id — only an
 * admin publishes it (via /admin/approvals). Members can edit/delete their own drafts;
 * once published it's admin-managed.
 */
export function MemberBlogManager({
  memberId,
  authorName,
  initial,
}: {
  memberId: number;
  authorName: string;
  initial: EditableBlogPost[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const title = String(fd.get('title') ?? '').trim();
    const slug = slugify(title);
    if (!title || !slug) {
      setMsg('กรอกหัวข้อบทความ');
      return;
    }
    const tags = String(fd.get('tags') ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    setPending(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.from('blog_posts').insert({
      author_id: memberId,
      author: authorName,
      slug,
      title,
      excerpt: String(fd.get('excerpt') ?? '').trim() || null,
      content: String(fd.get('content') ?? '').trim() || null,
      tags,
      read_time_min: 5,
      published_at: null,
    });
    setPending(false);
    if (error) {
      setMsg(error.message.includes('duplicate') ? 'มีบทความ slug นี้แล้ว — เปลี่ยนหัวข้อ' : 'บันทึกไม่สำเร็จ');
      return;
    }
    form.reset();
    setMsg('บันทึกร่างแล้ว — รอแอดมินอนุมัติ');
    router.refresh();
  }

  async function remove(id: number) {
    const supabase = createClient();
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    setMsg(error ? 'ลบไม่สำเร็จ (บทความที่เผยแพร่แล้วแอดมินจัดการ)' : 'ลบแล้ว');
    if (!error) router.refresh();
  }

  return (
    <div className="member-blog">
      {initial.length > 0 && (
        <ul className="member-cert-list">
          {initial.map((p) => (
            <li key={p.id} className="member-cert-item">
              <span className="member-cert-title">{p.title}</span>
              <span className={`member-cert-status member-cert-status-${p.published ? 'published' : 'draft'}`}>
                {p.published ? 'เผยแพร่แล้ว' : 'รออนุมัติ'}
              </span>
              {!p.published && (
                <button type="button" className="admin-del" onClick={() => remove(p.id)}>
                  ลบ
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="member-form">
        <label className="field">
          <span className="t-meta">หัวข้อบทความ</span>
          <input type="text" name="title" />
        </label>
        <label className="field">
          <span className="t-meta">คำโปรย</span>
          <input type="text" name="excerpt" />
        </label>
        <label className="field">
          <span className="t-meta">เนื้อหา (เว้นบรรทัดคู่ = ย่อหน้าใหม่)</span>
          <textarea name="content" rows={6} />
        </label>
        <label className="field">
          <span className="t-meta">แท็ก (คั่นด้วย ,)</span>
          <input type="text" name="tags" />
        </label>
        {msg && <p className="t-meta">{msg}</p>}
        <button type="submit" className="btn" disabled={pending}>
          {pending ? 'กำลังบันทึก…' : 'บันทึกร่างบทความ'}
        </button>
      </form>
    </div>
  );
}
