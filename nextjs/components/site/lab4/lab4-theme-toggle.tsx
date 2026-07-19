'use client';

import { useSyncExternalStore } from 'react';

type Lab4Theme = 'dark' | 'light';

// the .lab4 root's data-lab4-theme attribute IS the store — an inline script
// inside the div sets it before paint (localStorage → prefers-color-scheme)
const root = () => document.querySelector<HTMLElement>('.lab4');

function subscribe(onChange: () => void) {
  const el = root();
  if (!el) return () => {};
  const mo = new MutationObserver(onChange);
  mo.observe(el, { attributes: true, attributeFilter: ['data-lab4-theme'] });
  return () => mo.disconnect();
}
const getSnapshot = (): Lab4Theme =>
  root()?.dataset.lab4Theme === 'light' ? 'light' : 'dark';
const getServerSnapshot = (): Lab4Theme => 'dark';

/**
 * Dark ↔ Light Labs-grade switch (requirement3.md §14.7 — both themes are
 * first-class). Flipping the attribute swaps the whole token set; the robot
 * stage watches the same attribute for its scene lighting.
 */
export function Lab4ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next: Lab4Theme = theme === 'light' ? 'dark' : 'light';
    const el = root();
    if (el) el.dataset.lab4Theme = next;
    try {
      localStorage.setItem('lab4-theme', next);
    } catch {
      /* private mode — theme just won't persist */
    }
  };

  return (
    <button
      type="button"
      className="lab4-theme-btn"
      aria-pressed={theme === 'light'}
      aria-label={theme === 'light' ? 'สลับเป็นโหมดมืด' : 'สลับเป็นโหมดสว่าง'}
      onClick={toggle}
    >
      <span className="ic" aria-hidden>
        {theme === 'light' ? '◐' : '◑'}
      </span>
      <span className="tx" aria-hidden>
        {theme === 'light' ? 'DARK' : 'LIGHT'}
      </span>
    </button>
  );
}
