'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChatClient } from '@/components/chat/chat-client';
import { useFloatingChat } from './floating-chat-context';

/** Floating AI chat widget (Requirement §4.1.11 / §5.1): a button that opens an
 * inline chat panel; a full-page link is offered inside for more room.
 * A page wrapped in FloatingChatProvider (e.g. a project detail page) can
 * force this open pre-loaded with project context (§5.5 / FR-09). */
export function ChatButton() {
  const [open, setOpen] = useState(false);
  const { request } = useFloatingChat();
  const [handledNonce, setHandledNonce] = useState<number | null>(null);

  // A fresh request (even for the same project) reopens the panel. Adjusting
  // state during render (React's documented pattern for resetting state in
  // response to a prop/context change) instead of in an effect, so it takes
  // effect in the same render rather than cascading an extra one.
  if (request && request.nonce !== handledNonce) {
    setHandledNonce(request.nonce);
    setOpen(true);
  }

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
          <ChatClient
            key={request?.nonce ?? 'default'}
            initialProjectSlug={request?.projectSlug}
            initialProjectTitle={request?.projectTitle}
          />
        </div>
      )}
    </>
  );
}
