'use client';

import { useState } from 'react';
import { thinkingBoxLabel } from '@/lib/chat-message';
import { MarkdownContent } from '@/lib/markdown';

/**
 * The model's chain-of-thought, Open WebUI style. Collapsed by default in BOTH
 * states — while thinking it shows a spinner + "กำลังคิด…"; once the answer
 * starts it shows "💭 คิดอยู่ N วิ". Clicking expands the reasoning, rendered as
 * markdown (the model writes bold/lists/code). Renders nothing when there is no
 * reasoning (a non-thinking response).
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

  return (
    <div className={`chat-thinking-box${live ? ' is-live' : ''}`}>
      <button
        type="button"
        className="chat-thinking-summary"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {live ? (
          <span className="chat-thinking-spinner" aria-hidden="true" />
        ) : (
          <span aria-hidden="true">💭</span>
        )}{' '}
        {thinkingBoxLabel(live, durationMs)}{' '}
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="chat-thinking-body">
          <MarkdownContent source={reasoning} />
        </div>
      )}
    </div>
  );
}
