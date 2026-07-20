'use client';

import { useSyncExternalStore } from 'react';

// same store pattern as the theme switch: the .lab4 root's attribute IS the
// state, set before paint by the shell's inline script
const root = () => document.querySelector<HTMLElement>('.lab4');

function subscribe(onChange: () => void) {
  const el = root();
  if (!el) return () => {};
  const mo = new MutationObserver(onChange);
  mo.observe(el, { attributes: true, attributeFilter: ['data-lab4-bot'] });
  return () => mo.disconnect();
}
const getSnapshot = (): boolean => root()?.dataset.lab4Bot !== 'off';
const getServerSnapshot = (): boolean => true;

/** Whether the mascot may render at all — respected by every robot surface. */
export function useBotEnabled(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * The mascot's off switch. The T4 Bot is deliberately everywhere (§14.2.1), and
 * the thing that separates "brand character" from "annoying" is that leaving is
 * always one click away. Hiding it removes both the live stage and the static
 * footer renders, site-wide, persisted.
 */
export function BotToggle() {
  const on = useBotEnabled();

  const toggle = () => {
    const next = on ? 'off' : 'on';
    const el = root();
    if (el) el.dataset.lab4Bot = next;
    try {
      localStorage.setItem('lab4-bot', next);
    } catch {
      /* private mode — preference just won't persist */
    }
  };

  return (
    <button
      type="button"
      className="lab4-bot-btn"
      aria-pressed={!on}
      aria-label={on ? 'ซ่อนหุ่น T4 Bot' : 'แสดงหุ่น T4 Bot'}
      onClick={toggle}
    >
      <span className="ic" aria-hidden>
        {on ? '◉' : '○'}
      </span>
      <span className="tx" aria-hidden>
        BOT
      </span>
    </button>
  );
}
