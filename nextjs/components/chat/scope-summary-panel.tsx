'use client';

import { useEffect, useState } from 'react';
import { useChatSession } from './chat-session-context';
import { fetchScopeSummary, scopeSummaryLines, EMPTY_SCOPE_SUMMARY } from '@/lib/scope-summary';

/**
 * Floating scope-summary icon for the full /chat page (Requirement §5.4 / FR-08).
 * Auto-refreshes after every completed AI turn via ChatSessionContext — never
 * fabricates data, just reflects whatever the backend extracted from the real
 * conversation.
 */
export function ScopeSummaryPanel() {
  const { sessionId, turnCount } = useChatSession();
  const [summary, setSummary] = useState(EMPTY_SCOPE_SUMMARY);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    fetchScopeSummary(sessionId)
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch(() => {
        // Best-effort — leave the previous summary showing rather than erroring.
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, turnCount]);

  const lines = scopeSummaryLines(summary);

  return (
    <div className="scope-panel">
      <button
        type="button"
        className="scope-panel-toggle"
        aria-label="สรุปขอบเขตงาน"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        📄
      </button>
      {open && (
        <div className="scope-panel-body" role="dialog" aria-label="สรุปขอบเขตงาน">
          <div className="scope-panel-head">
            <h4>สรุปขอบเขตงาน</h4>
            <button
              type="button"
              className="scope-panel-close"
              aria-label="ปิด"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>
          {lines.length === 0 ? (
            <p className="t-meta">เริ่มพูดคุยกับ AI ระบบจะสรุปขอบเขตงานให้อัตโนมัติ</p>
          ) : (
            <dl className="scope-panel-list">
              {lines.map((l) => (
                <div key={l.label} className="scope-panel-row">
                  <dt className="t-meta">{l.label}</dt>
                  <dd>{l.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
