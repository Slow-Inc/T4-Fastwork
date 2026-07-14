'use client';

import { useState } from 'react';
import { thinkingSummaryLabel } from '@/lib/chat-message';

/**
 * The model's chain-of-thought, Open WebUI style. While the model is still
 * thinking (`live`), the reasoning streams expanded under a "กำลังคิด…" header.
 * Once the answer starts (`live=false`), it collapses to a clickable
 * "💭 คิดอยู่ N วิ" summary that toggles the reasoning open. Renders nothing when
 * there is no reasoning (a non-thinking response).
 */
export function ThinkingBox({
  reasoning,
  durationMs,
  live,
}: {
  reasoning: string;
  durationMs?: number;
  live: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!reasoning) return null;

  if (live) {
    return (
      <div className="chat-thinking-box is-live">
        <div className="chat-thinking-head">🧠 กำลังคิด…</div>
        <div className="chat-thinking-body">{reasoning}</div>
      </div>
    );
  }

  const label = thinkingSummaryLabel(durationMs);

  return (
    <div className="chat-thinking-box">
      <button
        type="button"
        className="chat-thinking-summary"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">💭</span> {label}{' '}
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="chat-thinking-body">{reasoning}</div>}
    </div>
  );
}
