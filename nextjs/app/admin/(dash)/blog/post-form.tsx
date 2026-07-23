'use client';

import { useActionState, useState } from 'react';
import { createPost, type PostFormState } from './actions';
import { markdownFileToPostFields } from '@/lib/markdown-upload';

const initial: PostFormState = {};

export function PostForm() {
  const [state, action, pending] = useActionState(createPost, initial);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [readTime, setReadTime] = useState('5');
  const [fileHint, setFileHint] = useState<string | null>(null);

  async function onMarkdownChosen(file: File | null) {
    setFileHint(null);
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = markdownFileToPostFields(text, file.name);
      setTitle(parsed.title);
      setSlug(parsed.slug);
      setExcerpt(parsed.excerpt);
      setContent(parsed.content);
      setReadTime(String(parsed.readTimeMin));
      setFileHint(`เติมจาก ${file.name} — เซิร์ฟเวอร์จะ parse ไฟล์อีกครั้งตอนบันทึก`);
    } catch (err) {
      setFileHint(err instanceof Error ? err.message : 'อ่านไฟล์ไม่สำเร็จ');
    }
  }

  return (
    <form action={action} className="admin-form">
      <label className="field">
        <span className="t-meta">อัปโหลด Markdown (.md)</span>
        <input
          name="markdown"
          type="file"
          accept=".md,text/markdown,text/plain"
          onChange={(e) => {
            const input = e.currentTarget;
            void onMarkdownChosen(input.files?.[0] ?? null).finally(() => {
              // Clear so submit uses the (possibly edited) form fields; the
              // server still accepts a live File when present (no-JS / API).
              input.value = '';
            });
          }}
        />
        {fileHint && <span className="t-meta">{fileHint}</span>}
      </label>
      <label className="field">
        <span className="t-meta">หัวข้อ *</span>
        <input
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="field">
        <span className="t-meta">slug (เว้นว่างให้สร้างอัตโนมัติ)</span>
        <input
          name="slug"
          placeholder="my-post"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
      </label>
      <label className="field">
        <span className="t-meta">คำโปรย</span>
        <input name="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
      </label>
      <label className="field">
        <span className="t-meta">เนื้อหา (Markdown หรือเว้นบรรทัดคู่ = ย่อหน้า)</span>
        <textarea
          name="content"
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </label>
      <div className="admin-form-row">
        <label className="field">
          <span className="t-meta">เวลาอ่าน (นาที)</span>
          <input
            name="read_time_min"
            type="number"
            value={readTime}
            onChange={(e) => setReadTime(e.target.value)}
          />
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
