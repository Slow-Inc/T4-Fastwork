'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChatClient } from '@/components/chat/chat-client';
import { useFloatingChat } from './floating-chat-context';

/** Floating AI chat widget (Requirement §4.1.11 / §5.1): a button that opens an
 * inline chat panel; a full-page link is offered inside for more room.
 * A page wrapped in FloatingChatProvider (e.g. a project detail page) can
 * force this open pre-loaded with project context (§5.5 / FR-09). */
export function ChatButton() {
  const [open, setOpen] = useState(false);
  // Keeps the panel mounted through its collapse animation on close.
  const [exiting, setExiting] = useState(false);
  const { request } = useFloatingChat();
  const [handledNonce, setHandledNonce] = useState<number | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const prevWidth = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // The label toggles between "Ask T4 AI" and "ปิด", which changes the button's
  // (content-driven) width. Content changes don't fire a CSS transition, so animate
  // the width from the previous to the new value with the Web Animations API — before
  // paint (useLayoutEffect) so there's no flash of the new size.
  useLayoutEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const target = btn.offsetWidth;
    const prev = prevWidth.current;
    prevWidth.current = target;
    if (prev == null || prev === target) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    btn.animate(
      [{ width: `${prev}px` }, { width: `${target}px` }],
      { duration: 280, easing: 'cubic-bezier(0.2, 0.8, 0.25, 1)' },
    );
  }, [open]);

  // The panel's height grows as messages are added (content-driven auto height,
  // which no CSS transition can catch). Watch it with a ResizeObserver and tween each
  // height change with the Web Animations API so the panel stretches instead of jumping.
  // Resizes caused by our own height animation are ignored to avoid a feedback loop.
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let prev = el.offsetHeight;
    let anim: Animation | null = null;
    const ro = new ResizeObserver(() => {
      if (anim) return;
      const h = el.offsetHeight;
      if (h === prev) return;
      const from = prev;
      prev = h;
      anim = el.animate(
        [{ height: `${from}px` }, { height: `${h}px` }],
        { duration: 240, easing: 'cubic-bezier(0.2, 0.8, 0.25, 1)' },
      );
      const done = () => {
        anim = null;
        prev = el.offsetHeight;
      };
      anim.onfinish = done;
      anim.oncancel = done;
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      anim?.cancel();
    };
  }, [open, exiting]);

  // A fresh request (even for the same project) reopens the panel. Adjusting
  // state during render (React's documented pattern for resetting state in
  // response to a prop/context change) instead of in an effect, so it takes
  // effect in the same render rather than cascading an extra one.
  if (request && request.nonce !== handledNonce) {
    setHandledNonce(request.nonce);
    setExiting(false);
    setOpen(true);
  }

  const toggle = () => {
    if (open) {
      setOpen(false);
      // Play the collapse animation before unmounting, unless motion is reduced.
      if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) setExiting(true);
    } else {
      setExiting(false);
      setOpen(true);
    }
  };

  const showPanel = open || exiting;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="chat"
        aria-expanded={open}
        onClick={toggle}
      >
        <i />
        {open ? 'ปิด' : 'Ask T4 AI'}
      </button>

      {showPanel && (
        <div
          ref={panelRef}
          className={`chat-panel${exiting ? ' chat-panel-exit' : ''}`}
          role="dialog"
          aria-label="ผู้ช่วย AI"
          onAnimationEnd={(e) => {
            if (exiting && e.target === e.currentTarget) setExiting(false);
          }}
        >
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
