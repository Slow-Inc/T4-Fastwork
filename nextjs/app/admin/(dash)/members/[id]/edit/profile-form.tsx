'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/client';
import { parseTechList } from '@/lib/member-auth';

interface Initial {
  skills: string[];
  stack: string[];
  readmeVisible: boolean;
  readmeOverride: string;
}

/**
 * Admin edit of a member's profile — skills, tech stack, README visibility + override.
 * Writes members.{skills,stack,readme_visible,readme_override} for the TARGET member id;
 * RLS (0024 team policy) lets any admin edit any member's profile content while the column
 * grant keeps identity columns unwritable. Editing stack flips its provenance to 'human'
 * (a DB trigger) so GitHub sync won't overwrite it. Input: one item per line via `parseTechList`.
 */
export function MemberProfileForm({
  memberId,
  initial,
}: {
  memberId: number;
  initial: Initial;
}) {
  const router = useRouter();
  const [skills, setSkills] = useState(initial.skills.join('\n'));
  const [stack, setStack] = useState(initial.stack.join('\n'));
  const [readmeVisible, setReadmeVisible] = useState(initial.readmeVisible);
  const [readmeOverride, setReadmeOverride] = useState(initial.readmeOverride);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from('members')
      .update({
        skills: parseTechList(skills),
        stack: parseTechList(stack),
        readme_visible: readmeVisible,
        readme_override: readmeOverride.trim() || null,
      })
      .eq('id', memberId);
    setPending(false);
    setMsg(error ? 'บันทึกไม่สำเร็จ' : 'บันทึกแล้ว ✓');
    if (!error) router.refresh();
  }

  return (
    <form onSubmit={save} className="member-form">
      <label className="field">
        <span className="t-meta">Skills (บรรทัดละ 1 รายการ)</span>
        <textarea
          rows={4}
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />
      </label>
      <label className="field">
        <span className="t-meta">Tech stack (บรรทัดละ 1 รายการ)</span>
        <textarea
          rows={8}
          value={stack}
          onChange={(e) => setStack(e.target.value)}
        />
      </label>
      <label className="field field-row">
        <input
          type="checkbox"
          checked={readmeVisible}
          onChange={(e) => setReadmeVisible(e.target.checked)}
        />
        <span className="t-meta">แสดง README บนโปรไฟล์</span>
      </label>
      <label className="field">
        <span className="t-meta">
          README ของฉัน (Markdown — เว้นว่างเพื่อใช้ README จาก GitHub)
        </span>
        <textarea
          rows={6}
          value={readmeOverride}
          onChange={(e) => setReadmeOverride(e.target.value)}
        />
      </label>
      {msg && <p className="t-meta">{msg}</p>}
      <button type="submit" className="btn" disabled={pending}>
        {pending ? 'กำลังบันทึก…' : 'บันทึก'}
      </button>
    </form>
  );
}
