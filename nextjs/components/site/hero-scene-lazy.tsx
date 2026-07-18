'use client';

import dynamic from 'next/dynamic';

/**
 * Client-only, code-split loader for the 3D hero scene. `ssr: false` keeps three
 * out of the server bundle + avoids any hydration mismatch; the loading state is
 * the same CSS fallback the scene itself shows for WebGL-less clients, so the hero
 * never flashes empty.
 */
export const HeroSceneLazy = dynamic(
  () => import('./hero-scene').then((m) => m.HeroScene),
  {
    ssr: false,
    loading: () => <div className="hero-scene-fallback" aria-hidden />,
  },
);
