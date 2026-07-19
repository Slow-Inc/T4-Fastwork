'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Lightformer,
  useGLTF,
} from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { Group, Mesh } from 'three';

const MODEL = '/lab3/reactor.glb';
useGLTF.preload(MODEL);

const SIGNAL = '#ff6846';

/* ------------------------------------------------------------------ scene */
function ReactorScene() {
  const { scene } = useGLTF(MODEL);
  const group = useRef<Group>(null);
  const ringRef = useRef<Mesh>(null);

  // normalise: centre the reactor at the origin and fit it to ~2.6 units
  const { offset, fit } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    return {
      offset: centre.multiplyScalar(-1),
      fit: 2.6 / Math.max(size.x, size.y, size.z),
    };
  }, [scene]);

  // make sure the baked emissive core actually glows past the bloom threshold
  useMemo(() => {
    scene.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat?.emissiveMap || (mat?.emissive && mat.emissive.getHex() !== 0)) {
        mat.emissiveIntensity = Math.max(mat.emissiveIntensity ?? 1, 2.4);
      }
    });
  }, [scene]);

  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useFrame((state, dt) => {
    const g = group.current;
    const ring = ringRef.current;
    if (!g) return;
    if (reduced) {
      g.rotation.set(0.06, 0.6, 0);
      return;
    }
    const t = state.clock.elapsedTime;
    // ambient slow orbit + damped, angle-limited pointer follow (§14.2)
    const targetY = t * 0.22 + state.pointer.x * 0.28;
    const targetX = 0.06 - state.pointer.y * 0.12;
    g.rotation.y += (targetY - g.rotation.y) * Math.min(1, dt * 2.4);
    g.rotation.x += (targetX - g.rotation.x) * Math.min(1, dt * 2.4);
    g.position.y = Math.sin(t * 0.9) * 0.04;
    if (ring) {
      ring.rotation.z = -t * 0.4;
      ring.position.y = Math.sin(t * 0.9) * 0.04 + Math.sin(t * 0.5) * 0.06;
    }
  });

  return (
    <>
      <group ref={group} scale={fit}>
        <primitive object={scene} position={offset.toArray()} />
      </group>
      {/* signal trace ring — orbiting data path around the reactor waist */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.15, 0, 0]}>
        <torusGeometry args={[1.62, 0.008, 8, 128]} />
        <meshBasicMaterial color={SIGNAL} toneMapped={false} transparent opacity={0.85} />
      </mesh>
      <pointLight position={[0, 0.1, 0.6]} intensity={2.2} color={SIGNAL} distance={4} />
    </>
  );
}

export function Lab3HeroScene() {
  const [webgl] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      return false;
    }
  });
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

  if (!webgl) return <div className="lab3-scene-fallback" aria-hidden />;

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%' }}>
      <Canvas
        frameloop={visible ? 'always' : 'demand'}
        dpr={[1, 1.8]}
        camera={{ position: [0, 0.35, 5.2], fov: 36 }}
        gl={{ antialias: true, alpha: true }}
        eventSource={typeof document !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
        style={{ width: '100%', height: '100%' }}
        aria-hidden
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[4, 6, 3]} intensity={1.3} />
        <Suspense fallback={null}>
          <ReactorScene />
          <Environment resolution={256} frames={1}>
            <Lightformer intensity={2.2} position={[0, 3, 3]} scale={[7, 3, 1]} />
            <Lightformer intensity={1.4} position={[-4, 1, -2]} scale={[4, 5, 1]} color={SIGNAL} />
            <Lightformer intensity={1.5} position={[4, 2, 2]} scale={[3, 4, 1]} />
          </Environment>
        </Suspense>
        <ContactShadows position={[0, -1.45, 0]} scale={6} blur={2.8} opacity={0.5} far={3} color="#04110f" />
        <EffectComposer>
          <Bloom intensity={0.85} luminanceThreshold={0.55} luminanceSmoothing={0.2} radius={0.55} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
