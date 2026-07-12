'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChatClient } from '@/components/chat/chat-client';

/** Floating AI chat widget (Requirement §4.1.11 / §5.1): a button that opens an
 * inline chat panel; a full-page link is offered inside for more room. */
export function ChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="chat"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <i />
        {open ? 'ปิด' : 'Ask T4 AI'}
      </button>

      {open && (
        <div className="chat-panel" role="dialog" aria-label="ผู้ช่วย AI">
          <div className="chat-panel-head">
            <span className="t-meta">T4 AI Assistant</span>
            <Link href="/chat" className="chat-panel-expand t-meta">
              เปิดเต็มหน้า ↗
            </Link>
          </div>
          <ChatClient />
        </div>
      )}
    </>
  );
}
