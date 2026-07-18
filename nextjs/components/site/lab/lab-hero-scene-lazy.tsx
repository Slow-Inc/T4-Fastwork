'use client';

import dynamic from 'next/dynamic';

/** Code-split the r3f scene (ssr:false) so three.js never runs on the server and
 *  there is no hydration flash; a CSS fallback holds the space until it mounts. */
export const LabHeroSceneLazy = dynamic(
  () => import('./lab-hero-scene').then((m) => m.LabHeroScene),
  {
    ssr: false,
    loading: () => <div className="lab-hero-scene-fallback" aria-hidden />,
  },
);
