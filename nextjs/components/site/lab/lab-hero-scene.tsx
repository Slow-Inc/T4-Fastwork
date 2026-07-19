'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import type { Group } from 'three';

/**
 * Prototype 3D signature (placeholder for a future bespoke, rigged GLB — see
 * `docs/design/chaingpt-teardown.md`). An emissive orange "core" caged in a
 * metallic wireframe icosahedron: idle-spins and tilts toward the cursor (the
 * labs "cursor-reactive 3D"). Frozen but still lit under prefers-reduced-motion.
 * Client-only (ssr:false) + a CSS fallback covers pre-mount / WebGL-less clients.
 * The render loop only runs while visible AND animating (frameloop switches to
 * 'demand' offscreen / under reduced motion, so it doesn't burn the GPU).
 */
function Form({ animate }: { animate: boolean }) {
  const ref = useRef<Group>(null);
  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    if (animate) g.rotation.y += dt * 0.18; // idle spin
    // whole-form tilt toward the pointer, damped (labs cursor-follow)
    const targetX = -state.pointer.y * 0.35;
    const factor = animate ? 0.06 : 0;
    g.rotation.x += (targetX - g.rotation.x) * factor;
  });
  return (
    <group ref={ref}>
      {/* Solid faceted crystal — occludes the marquee behind it (no see-through
          wireframe letting text bleed through) and glows on its own. */}
      <mesh>
        <icosahedronGeometry args={[1.35, 0]} />
        <meshStandardMaterial
          color="#e8461b"
          emissive="#e8461b"
          emissiveIntensity={0.6}
          metalness={0.45}
          roughness={0.28}
          flatShading
          toneMapped={false}
        />
      </mesh>
      {/* Thin chrome edge cage for a technical read, drawn over the solid form. */}
      <mesh scale={1.008}>
        <icosahedronGeometry args={[1.35, 0]} />
        <meshBasicMaterial color="#1b1b1b" wireframe transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

export function LabHeroScene() {
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
  const [visible, setVisible] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Pause the render loop when the hero scrolls out of view (it sits at the top
  // of a long page). setState happens in the observer callback, not the effect.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => setVisible(entries[0]?.isIntersecting ?? true),
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!webgl) return <div className="lab-hero-scene-fallback" aria-hidden />;

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%' }}>
      <Canvas
        // Only run continuously while visible + animating; otherwise 'demand'
        // renders solely on pointer/invalidate so the GPU idles when hidden.
        frameloop={animate && visible ? 'always' : 'demand'}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 4.2], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        eventSource={typeof document !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
        style={{ width: '100%', height: '100%' }}
        aria-hidden
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={2.2} />
        <directionalLight position={[-4, -2, -3]} intensity={0.8} color="#e8461b" />
        <pointLight position={[0, 0, 0]} intensity={1.6} color="#e8461b" distance={4} />
        <Form animate={animate} />
        <EffectComposer>
          {/* Tight glow on the crystal only — higher threshold + lower intensity
              so the orange doesn't wash the whole sector. */}
          <Bloom
            intensity={0.45}
            luminanceThreshold={0.5}
            luminanceSmoothing={0.2}
            radius={0.4}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
