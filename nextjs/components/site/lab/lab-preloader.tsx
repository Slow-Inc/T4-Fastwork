'use client';

import { useEffect, useState } from 'react';

/**
 * Intro preloader (ChainGPT labs 0:03–0:08): an orange full-bleed drench with a
 * big display counter racing 0→100, then a wipe reveal. It renders NOTHING on
 * the server / first client render (phase 'init'), then a mount effect starts it
 * — so there is no hydration mismatch and reduced-motion users never see it.
 * Unmounts once done so it never traps focus or scroll.
 */
type Phase = 'init' | 'count' | 'wipe' | 'done';

export function LabPreloader() {
  const [phase, setPhase] = useState<Phase>('init');
  const [count, setCount] = useState(0);

  // Decide on the client only (avoids SSR/hydration mismatch + honors motion).
  // Deferred into a timeout callback so the first paint stays 'init' (renders
  // null, matching the server) and to keep setState out of the effect body.
  useEffect(() => {
    const reduce =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const id = setTimeout(() => setPhase(reduce ? 'done' : 'count'), 0);
    return () => clearTimeout(id);
  }, []);

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

  if (phase === 'init' || phase === 'done') return null;
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
