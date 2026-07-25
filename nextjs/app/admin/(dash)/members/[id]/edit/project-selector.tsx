'use client';

import { useState, useTransition } from 'react';
import type { EditableProject } from '@/lib/member-session';
import { toggleMemberProjectSelection } from './actions';

/**
 * Admin project-selection for a member — pick which GitHub-sourced repos show on that
 * member's public profile. Toggling also syncs personal showcase rows on ผลงาน (#178):
 * deselect → unpublish matched personal project; reselect → republish. Team/org imports
 * are never touched. Server action owns the write (selected + optional status) + revalidate.
 */
export function MemberProjectSelector({ initial }: { initial: EditableProject[] }) {
  const [projects, setProjects] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: number, selected: boolean) {
    setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, selected } : p)));
    setMsg(null);
    startTransition(async () => {
      const res = await toggleMemberProjectSelection(id, selected);
      if (!res.ok) {
        setProjects((ps) =>
          ps.map((p) => (p.id === id ? { ...p, selected: !selected } : p)),
        );
        setMsg(res.error || 'บันทึกไม่สำเร็จ');
      } else {
        setMsg(
          selected
            ? 'บันทึกแล้ว ✓ (โปรไฟล์ + ผลงานถ้ามี)'
            : 'บันทึกแล้ว ✓ (นำออกจากโปรไฟล์ และซ่อนจากผลงานถ้ามี)',
        );
      }
    });
  }

  if (projects.length === 0) {
    return <p className="t-meta">ยังไม่มีผลงานให้เลือก</p>;
  }

  return (
    <div className="member-projects-select">
      <p className="t-meta" style={{ marginBottom: '0.75rem' }}>
        การเลือก/ยกเลิก repo มีผลทั้งโปรไฟล์สมาชิกและหน้าผลงาน (เฉพาะโปรเจกต์ส่วนตัวที่เคย
        import แล้ว — ไม่แตะผลงานทีม Slow-Inc)
      </p>
      <ul className="member-proj-list">
        {projects.map((p) => (
          <li key={p.id} className="member-proj-item">
            <label className="field-row">
              <input
                type="checkbox"
                checked={p.selected}
                disabled={pending}
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
