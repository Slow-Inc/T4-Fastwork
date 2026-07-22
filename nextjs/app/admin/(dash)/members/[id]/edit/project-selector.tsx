'use client';

import { useState } from 'react';
import { createClient } from '@/lib/client';
import type { EditableProject } from '@/lib/member-session';

/**
 * Admin project-selection for a member — pick which GitHub-sourced repos show on that
 * member's public profile. Toggling writes `member_projects.selected` by row id; RLS
 * (0024 team policy) lets any admin toggle any member's rows and the column grant limits
 * the write to `selected`. The public `/team/[slug]` read filters `selected = true`, so a
 * deselect drops the repo from the profile. Optimistic UI, reverted on error.
 */
export function MemberProjectSelector({ initial }: { initial: EditableProject[] }) {
  const [projects, setProjects] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);

  async function toggle(id: number, selected: boolean) {
    setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, selected } : p)));
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from('member_projects')
      .update({ selected })
      .eq('id', id);
    if (error) {
      setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, selected: !selected } : p)));
      setMsg('บันทึกไม่สำเร็จ');
    } else {
      setMsg('บันทึกแล้ว ✓');
    }
  }

  if (projects.length === 0) {
    return <p className="t-meta">ยังไม่มีผลงานให้เลือก</p>;
  }

  return (
    <div className="member-projects-select">
      <ul className="member-proj-list">
        {projects.map((p) => (
          <li key={p.id} className="member-proj-item">
            <label className="field-row">
              <input
                type="checkbox"
                checked={p.selected}
                onChange={(e) => toggle(p.id, e.target.checked)}
              />
              <span className="member-proj-name">
                {p.name}
                <span className="t-meta"> · {p.year}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      {msg && <p className="t-meta">{msg}</p>}
    </div>
  );
}
