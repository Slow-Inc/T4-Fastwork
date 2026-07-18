'use client';

import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

/**
 * Hero signature: an abstract faceted metal form (not a mascot). Restrained,
 * engineered, on-brand — a single orange rim light is the only accent. Lit-metal
 * (no external HDRI) so it ships self-contained. Slowly rotates; frozen under
 * prefers-reduced-motion. Client-only (imported with ssr:false) + a CSS fallback
 * covers pre-mount and WebGL-less clients, so there is never a hydration flash or
 * a hard crash.
 */
function Form({ animate }: { animate: boolean }) {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (!animate || !ref.current) return;
    ref.current.rotation.y += dt * 0.22;
    ref.current.rotation.x += dt * 0.07;
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.35, 0]} />
      <meshStandardMaterial
        color="#cbc7be"
        metalness={0.62}
        roughness={0.24}
        flatShading
      />
    </mesh>
  );
}

export function HeroScene() {
  // Client-only (imported ssr:false) + these never change after mount, so read
  // them once via lazy initializers — no effect, no cascading setState.
  const [webgl] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      return false;
    }
  });
  const [animate] = useState<boolean>(
    () =>
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  if (!webgl) return <div className="hero-scene-fallback" aria-hidden />;

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 4], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
      aria-hidden
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={2.3} />
      <directionalLight position={[-4, -2, -3]} intensity={0.7} color="#e8461b" />
      <Form animate={animate} />
    </Canvas>
  );
}
