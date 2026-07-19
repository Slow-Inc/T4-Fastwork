'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, useGLTF } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { Group } from 'three';

/**
 * The T4 Bot stage (requirement3.md §14.2.1 — Brand Robot Character &
 * Visual Storytelling). ONE fixed full-viewport canvas; the robot travels
 * between the page's [data-l4-zone] markers as you scroll, so the hand-off
 * between storytelling zones is continuous (seam rule) instead of one canvas
 * per section. Interactions: damped cursor-follow, drag-to-rotate on the
 * hero stage ([data-l4-grab]), and a reset via the `lab4-robot-reset` event.
 *
 * Model: /lab/robot-head.glb — a STAND-IN for the final Eve-inspired T4 Bot
 * (pending an approved character sheet; see §13 open questions).
 */
const MODEL = '/lab/robot-head.glb';
useGLTF.preload(MODEL);

const SIGNAL_DARK = '#ff6846';
const SIGNAL_LIGHT = '#e8461b';
const FACE = { x: 0, y: 0.4, z: 0.52 };
const FACE_SIZE = { w: 0.82, h: 0.74 };
const CAM_Z = 7;
const FOV = 38;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/* --------------------------------------------------- expressive eye screen */
const EYES_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Always-on friendly eyes (blink + faint pixel shimmer) — the boot loop from
// /lab is dropped; the character reads as "awake" the whole journey.
const EYES_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  float rbox(vec2 p, vec2 b, float r){
    vec2 d = abs(p) - b + r;
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
  }

  void main(){
    vec2 uv = vUv;
    vec2 cp = (uv - 0.5) * 2.0;
    if (rbox(cp, vec2(0.94, 0.94), 0.34) > 0.0) discard;

    vec2 grid = vec2(24.0, 20.0);
    vec2 cell = floor(uv * grid);
    vec2 cuv = fract(uv * grid);
    float rnd = hash(cell);
    float gap = step(0.08, cuv.x) * step(0.08, cuv.y) * step(cuv.x, 0.92) * step(cuv.y, 0.92);

    // blink ~ every 4.5s, quick double-ease
    float bl = fract(uTime / 4.5);
    float blink = 1.0 - smoothstep(0.94, 0.955, bl) * (1.0 - smoothstep(0.975, 0.99, bl));
    float eyeH = 0.08 * blink + 0.008;

    float e1 = rbox(uv - vec2(0.37, 0.52), vec2(0.05, eyeH), 0.04);
    float e2 = rbox(uv - vec2(0.63, 0.52), vec2(0.05, eyeH), 0.04);
    float eye = 1.0 - smoothstep(-0.01, 0.02, min(e1, e2));

    vec3 bg = vec3(0.015, 0.015, 0.02);
    vec3 orange = vec3(0.98, 0.34, 0.10);
    vec3 col = bg;
    col += orange * gap * 0.05 * (0.6 + 0.4 * sin(uTime * 2.0 + rnd * 30.0));
    col += mix(vec3(1.0), orange, 0.12) * eye * 1.6;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// module singleton — this client-only chunk never runs on the server, only
// one robot exists, and the per-frame uTime mutation must live outside render
const EYES_MATERIAL = new THREE.ShaderMaterial({
  vertexShader: EYES_VERT,
  fragmentShader: EYES_FRAG,
  transparent: true,
  toneMapped: false,
  depthWrite: false,
  uniforms: { uTime: { value: 0 } },
});

/* ------------------------------------------------------------- zone travel */
type ZoneTarget = { x: number; y: number; scale: number; yaw: number; pitch: number };

function readZoneTarget(el: HTMLElement, viewport: { w: number; h: number }): ZoneTarget & { dist: number } {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const worldH = 2 * CAM_Z * Math.tan((FOV / 2) * (Math.PI / 180));
  const worldW = worldH * (viewport.w / viewport.h);
  const perPx = worldH / viewport.h;
  const minDim = Math.min(r.width, r.height);
  return {
    x: (cx / viewport.w - 0.5) * worldW,
    y: -(cy / viewport.h - 0.5) * worldH,
    scale: clamp(minDim * perPx * Number(el.dataset.l4Scale ?? 0.8), 0.35, 3.4),
    yaw: Number(el.dataset.l4Yaw ?? 0),
    pitch: Number(el.dataset.l4Pitch ?? 0),
    dist: Math.abs(cy - viewport.h / 2),
  };
}

function RobotTraveller({ light }: { light: boolean }) {
  const { scene } = useGLTF(MODEL);
  const group = useRef<Group>(null);
  const size = useThree((s) => s.size);
  const zonesRef = useRef<HTMLElement[]>([]);
  const drag = useRef({ active: false, lastX: 0, yaw: 0, vel: 0 });
  const started = useRef(false);

  // normalise the head to ~1 world unit inside an inner group, so FACE
  // coordinates stay valid in model space
  const { offset, fit } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const s = box.getSize(new THREE.Vector3());
    return {
      offset: box.getCenter(new THREE.Vector3()).multiplyScalar(-1),
      fit: 1 / Math.max(s.x, s.y, s.z),
    };
  }, [scene]);


  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  // zone markers + drag-to-rotate + reset wiring
  useEffect(() => {
    zonesRef.current = Array.from(document.querySelectorAll<HTMLElement>('[data-l4-zone]'));

    const onDown = (e: PointerEvent) => {
      const grab = (e.target as HTMLElement | null)?.closest?.('[data-l4-grab]');
      if (!grab) return;
      drag.current.active = true;
      drag.current.lastX = e.clientX;
      grab.classList.add('grabbing');
    };
    const onMove = (e: PointerEvent) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.lastX;
      drag.current.lastX = e.clientX;
      drag.current.vel = dx * 0.006;
      drag.current.yaw = clamp(drag.current.yaw + dx * 0.006, -1.15, 1.15);
    };
    const onUp = () => {
      drag.current.active = false;
      document.querySelector('[data-l4-grab].grabbing')?.classList.remove('grabbing');
    };
    const onReset = () => {
      drag.current.yaw = 0;
      drag.current.vel = 0;
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('lab4-robot-reset', onReset);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('lab4-robot-reset', onReset);
    };
  }, []);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    EYES_MATERIAL.uniforms.uTime.value = t;

    const zones = zonesRef.current;
    if (!zones.length) return;

    // chase the marker nearest the viewport centre — the damped pursuit IS
    // the seam between storytelling zones (§14.2.1)
    let target: (ZoneTarget & { dist: number }) | null = null;
    for (const el of zones) {
      const zt = readZoneTarget(el, { w: size.width, h: size.height });
      if (!target || zt.dist < target.dist) target = zt;
    }
    if (!target) return;

    // inertia decay for the user's drag yaw
    if (!drag.current.active && Math.abs(drag.current.vel) > 0.0001) {
      drag.current.yaw = clamp(drag.current.yaw + drag.current.vel, -1.15, 1.15);
      drag.current.vel *= Math.pow(0.0001, dt); // ~fast decay, frame-rate safe
    }

    const followW = reduced ? 0 : 0.3;
    const yawTarget = target.yaw + drag.current.yaw + state.pointer.x * followW;
    const pitchTarget = target.pitch - state.pointer.y * followW * 0.5;
    const float = reduced ? 0 : Math.sin(t * 1.1) * 0.035 * target.scale;

    if (reduced || !started.current) {
      // snap on first frame (no fly-in from origin) and under reduced motion
      g.position.set(target.x, target.y + float, 0);
      g.scale.setScalar(target.scale);
      g.rotation.set(pitchTarget, yawTarget, 0);
      started.current = true;
      return;
    }

    const k = Math.min(1, dt * 2.6);
    g.position.x += (target.x - g.position.x) * k;
    g.position.y += (target.y + float - g.position.y) * k;
    const s = g.scale.x + (target.scale - g.scale.x) * k;
    g.scale.setScalar(s);
    g.rotation.y += (yawTarget - g.rotation.y) * Math.min(1, dt * 3);
    g.rotation.x += (pitchTarget - g.rotation.x) * Math.min(1, dt * 3);
  });

  return (
    <group ref={group}>
      <group scale={fit}>
        <primitive object={scene} position={offset.toArray()} />
        <mesh position={[FACE.x, FACE.y, FACE.z]}>
          <planeGeometry args={[FACE_SIZE.w, FACE_SIZE.h, 1, 1]} />
          <primitive object={EYES_MATERIAL} attach="material" />
        </mesh>
      </group>
      <pointLight
        position={[0, 0.2, 1.2]}
        intensity={light ? 0.6 : 1.4}
        color={light ? SIGNAL_LIGHT : SIGNAL_DARK}
        distance={4}
      />
    </group>
  );
}

/* ------------------------------------------------------------------ mount */
export function Lab4RobotStage() {
  const [webgl] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      return false;
    }
  });
  const [light, setLight] = useState(false);

  // follow .lab4[data-lab4-theme] so scene light derives from the active
  // theme tokens (§14.7 dual-theme rule)
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('.lab4');
    if (!el) return;
    const read = () => setLight(el.dataset.lab4Theme === 'light');
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ['data-lab4-theme'] });
    return () => mo.disconnect();
  }, []);

  // flag the root so CSS can show the hero poster fallback (§14.2.1)
  useEffect(() => {
    if (!webgl) document.querySelector('.lab4')?.classList.add('lab4-nogl');
  }, [webgl]);

  if (!webgl) return null;

  const signal = light ? SIGNAL_LIGHT : SIGNAL_DARK;
  return (
    <div className="lab4-stagefx" aria-hidden>
      <Canvas
        dpr={[1, 1.8]}
        camera={{ position: [0, 0, CAM_Z], fov: FOV }}
        gl={{ antialias: true, alpha: true }}
        eventSource={typeof document !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={light ? 0.9 : 0.5} />
        <directionalLight position={[4, 6, 4]} intensity={light ? 1.7 : 1.4} />
        <Suspense fallback={null}>
          <RobotTraveller light={light} />
          <Environment resolution={256} frames={1}>
            <Lightformer intensity={light ? 3 : 2.4} position={[0, 3, 3]} scale={[7, 3, 1]} />
            <Lightformer intensity={1.6} position={[-4, 1, -2]} scale={[4, 5, 1]} color={signal} />
            <Lightformer intensity={light ? 2.2 : 1.6} position={[4, 2, 2]} scale={[3, 4, 1]} />
          </Environment>
        </Suspense>
        <EffectComposer>
          <Bloom
            intensity={light ? 0.35 : 0.7}
            luminanceThreshold={0.6}
            luminanceSmoothing={0.22}
            radius={0.5}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
