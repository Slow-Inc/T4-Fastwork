'use client';

import { useEffect, useState } from 'react';

/**
 * Intro preloader (ChainGPT labs 0:03–0:08): an orange full-bleed drench with a
 * big display counter racing 0→100, then a wipe reveal. Skipped entirely under
 * prefers-reduced-motion. Client-only; unmounts once done so it never traps focus
 * or scroll. Deterministic count (no timers-in-render) keeps it flake-free.
 */
type Phase = 'count' | 'wipe' | 'done';

export function LabPreloader() {
  const [phase, setPhase] = useState<Phase>(() =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ? 'done'
      : 'count',
  );
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (phase !== 'count') return;
    let n = 0;
    const id = setInterval(() => {
      n = Math.min(100, n + 4);
      setCount(n);
      if (n >= 100) {
        clearInterval(id);
        setTimeout(() => setPhase('wipe'), 260);
      }
    }, 28);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'wipe') return;
    const t = setTimeout(() => setPhase('done'), 720);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === 'done') return null;
  return (
    <div
      className={`lab-preloader${phase === 'wipe' ? ' is-wiping' : ''}`}
      aria-hidden="true"
    >
      <span className="lab-preloader-count">
        {String(count).padStart(3, '0')}
      </span>
    </div>
  );
}
