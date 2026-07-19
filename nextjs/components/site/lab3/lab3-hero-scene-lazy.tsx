'use client';

import dynamic from 'next/dynamic';

/** Code-split the r3f reactor scene (ssr:false) so three.js never runs on the
 *  server; the CSS fallback holds the reserved space until it mounts. */
export const Lab3HeroSceneLazy = dynamic(
  () => import('./lab3-hero-scene').then((m) => m.Lab3HeroScene),
  {
    ssr: false,
    loading: () => <div className="lab3-scene-fallback" aria-hidden />,
  },
);
