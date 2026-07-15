'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/client';
import { parseTechList } from '@/lib/member-auth';

interface Initial {
  skills: string[];
  stack: string[];
  readmeVisible: boolean;
}

/**
 * Member self-edit (Epic C / C3) — skills, tech stack, and README visibility. RLS
 * scopes the write to the member's own row; editing stack flips its provenance to
 * 'human' (a DB trigger) so GitHub sync won't overwrite it, and re-feeds the home
 * tech carousel. Comma-separated input → clean list via `parseTechList`.
 */
export function MemberProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [skills, setSkills] = useState(initial.skills.join(', '));
  const [stack, setStack] = useState(initial.stack.join(', '));
  const [readmeVisible, setReadmeVisible] = useState(initial.readmeVisible);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMsg(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMsg('เซสชันหมดอายุ — เข้าสู่ระบบใหม่');
      setPending(false);
      return;
    }
    const { error } = await supabase
      .from('members')
      .update({
        skills: parseTechList(skills),
        stack: parseTechList(stack),
        readme_visible: readmeVisible,
      })
      .eq('auth_user_id', user.id);
    setPending(false);
    setMsg(error ? 'บันทึกไม่สำเร็จ' : 'บันทึกแล้ว ✓');
    if (!error) router.refresh();
  }

  return (
    <form onSubmit={save} className="member-form">
      <label className="field">
        <span className="t-meta">Skills (คั่นด้วยคอมมา)</span>
        <input value={skills} onChange={(e) => setSkills(e.target.value)} />
      </label>
      <label className="field">
        <span className="t-meta">Tech stack (คั่นด้วยคอมมา)</span>
        <input value={stack} onChange={(e) => setStack(e.target.value)} />
      </label>
      <label className="field field-row">
        <input
          type="checkbox"
          checked={readmeVisible}
          onChange={(e) => setReadmeVisible(e.target.checked)}
        />
        <span className="t-meta">แสดง GitHub README บนโปรไฟล์</span>
      </label>
      {msg && <p className="t-meta">{msg}</p>}
      <button type="submit" className="btn" disabled={pending}>
        {pending ? 'กำลังบันทึก…' : 'บันทึก'}
      </button>
    </form>
  );
}
