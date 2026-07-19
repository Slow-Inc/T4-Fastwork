'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Center,
  ContactShadows,
  Environment,
  Lightformer,
  useGLTF,
} from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import type { Group, Object3D, Vector3 } from 'three';

const MODEL = '/lab/robot.glb';
useGLTF.preload(MODEL);

/**
 * /lab hero 3D signature — a bespoke stylized "labs" robot built in Blender
 * (chrome body + emissive orange AI core), exported as a per-part GLB so each
 * piece can be animated. On mount the parts converge from an exploded state
 * ("ประกอบร่าง"), then the head turns to follow the cursor (the ChainGPT
 * "model faces you" effect) over a gentle idle float. Lit by a procedural
 * Lightformer environment (real chrome reflections, no external HDR/CDN),
 * grounded with contact shadows, and the core/antenna glow drives Bloom.
 * Frozen-but-lit under prefers-reduced-motion; render loop pauses off-screen.
 */
function Robot({ animate }: { animate: boolean }) {
  const { scene } = useGLTF(MODEL);
  // Clone so animating node transforms never mutates the cached GLTF (safe on
  // remount / React StrictMode double-invoke).
  const root = useMemo(() => scene.clone(true), [scene]);
  const head = useRef<Object3D | null>(null);
  const groupRef = useRef<Group>(null);
  const started = useRef(false);
  const introT = useRef(0);

  useEffect(() => {
    head.current = root.getObjectByName('Robot_Head') ?? null;
  }, [root]);

  useFrame((state, dt) => {
    // First frame: cache each part's rest pose and blow it out into an exploded
    // start pose (radially from the local origin, lifted up) to converge from.
    if (!started.current) {
      started.current = true;
      root.children.forEach((c, i) => {
        const rest = c.position.clone();
        c.userData.rest = rest;
        if (animate) {
          const start = rest.clone().multiplyScalar(2.3) as Vector3;
          start.y += 1.1 + (i % 3) * 0.35;
          c.userData.start = start;
          c.position.copy(start);
        }
      });
    }

    if (animate && introT.current < 1) {
      introT.current = Math.min(1, introT.current + dt / 1.4);
      const e = 1 - Math.pow(1 - introT.current, 3); // easeOutCubic
      root.children.forEach((c) => {
        if (c.userData.start && c.userData.rest) {
          c.position.lerpVectors(c.userData.start, c.userData.rest, e);
        }
      });
    }

    const g = groupRef.current;
    if (g && animate) {
      const t = state.clock.elapsedTime;
      g.position.y = Math.sin(t * 1.1) * 0.05; // idle float
      g.rotation.y += (state.pointer.x * 0.22 - g.rotation.y) * 0.04; // body lean
    }

    // Head turns to face the cursor once assembled (damped).
    if (head.current && animate) {
      const ty = state.pointer.x * 0.7;
      const tx = -state.pointer.y * 0.35;
      head.current.rotation.y += (ty - head.current.rotation.y) * 0.08;
      head.current.rotation.x += (tx - head.current.rotation.x) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <Center>
        <primitive object={root} />
      </Center>
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
        frameloop={animate && visible ? 'always' : 'demand'}
        dpr={[1, 1.8]}
        camera={{ position: [0.4, 0.5, 5.4], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        eventSource={typeof document !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
        style={{ width: '100%', height: '100%' }}
        aria-hidden
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[4, 6, 4]} intensity={1.6} />
        <pointLight position={[0, 0.2, 1.5]} intensity={2.2} color="#ff6a2b" distance={4} />
        <Suspense fallback={null}>
          <Robot animate={animate} />
          {/* Procedural studio environment — chrome reflections with no HDR file. */}
          <Environment resolution={256} frames={1}>
            <Lightformer intensity={2.4} position={[0, 3, 3]} scale={[7, 3, 1]} />
            <Lightformer
              intensity={2}
              position={[-4, 1, -2]}
              scale={[4, 5, 1]}
              color="#e8461b"
            />
            <Lightformer intensity={1.6} position={[4, 2, 2]} scale={[3, 4, 1]} />
            <Lightformer intensity={1} position={[0, -3, 1]} scale={[6, 2, 1]} />
          </Environment>
        </Suspense>
        <ContactShadows
          position={[0, -1.05, 0]}
          scale={5}
          blur={2.6}
          opacity={0.45}
          far={2.6}
          color="#2a1712"
        />
        <EffectComposer>
          <Bloom
            intensity={0.62}
            luminanceThreshold={0.62}
            luminanceSmoothing={0.22}
            radius={0.45}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
