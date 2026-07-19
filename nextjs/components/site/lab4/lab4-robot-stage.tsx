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
 * Model: /lab4/t4bot.glb — T4 Bot v2 (dev's re-modelled mesh, 308 KB;
 * Meshy image-to-3D → Blender split). Named nodes: T4BotRoot › Head / Body /
 * ArmL / ArmR. Split by whole-island centroid — NOT a planar bisect — so
 * nothing is sliced (the v1 head-amputation failure mode is impossible this
 * way): head at the neck gap (Z=0), arm pods at |X| > 0.4 (the island gap
 * between torso 0.38 and pods 0.41). Head pivot sits at the neck base,
 * arm pivots at the shoulder tops, so rotations read as joints.
 *
 * Pointing (§14.2.1 "Robot ตอบสนองเนื้อหา"): a zone marker may carry
 * data-l4-point=<selector>; the robot then aims its head and raises the
 * near arm toward the hovered candidate (else the one nearest the viewport
 * centre) and the target gets the .l4-aim highlight — the robot presents
 * real content instead of floating idle.
 */
const MODEL = '/lab4/t4bot.glb';
useGLTF.preload(MODEL);

const SIGNAL_DARK = '#ff6846';
const SIGNAL_LIGHT = '#e8461b';
const CAM_Z = 7;
const FOV = 38;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/* ------------------------------------------------------------- zone travel */
type ZoneTarget = {
  x: number;
  y: number;
  scale: number;
  yaw: number;
  pitch: number;
  point: string;
  float: number;
};

function toWorld(cx: number, cy: number, viewport: { w: number; h: number }) {
  const worldH = 2 * CAM_Z * Math.tan((FOV / 2) * (Math.PI / 180));
  const worldW = worldH * (viewport.w / viewport.h);
  return {
    x: (cx / viewport.w - 0.5) * worldW,
    y: -(cy / viewport.h - 0.5) * worldH,
  };
}

function readZoneTarget(el: HTMLElement, viewport: { w: number; h: number }): ZoneTarget & { dist: number } {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const worldH = 2 * CAM_Z * Math.tan((FOV / 2) * (Math.PI / 180));
  const perPx = worldH / viewport.h;
  const minDim = Math.min(r.width, r.height);
  return {
    ...toWorld(cx, cy, viewport),
    scale: clamp(minDim * perPx * Number(el.dataset.l4Scale ?? 0.8), 0.35, 3.4),
    yaw: Number(el.dataset.l4Yaw ?? 0),
    pitch: Number(el.dataset.l4Pitch ?? 0),
    point: el.dataset.l4Point ?? '',
    float: Number(el.dataset.l4Float ?? 1),
    dist: Math.abs(cy - viewport.h / 2),
  };
}

/** pick the element the robot should present: hovered wins, else the
 *  candidate nearest the viewport centre (= what the reader is looking at) */
function pickPointTarget(els: HTMLElement[], viewport: { w: number; h: number }) {
  let best: { el: HTMLElement; d: number } | null = null;
  for (const el of els) {
    if (el.matches(':hover')) return el;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > viewport.h) continue;
    const d =
      Math.abs(r.top + r.height / 2 - viewport.h / 2) +
      Math.abs(r.left + r.width / 2 - viewport.w / 2) * 0.25;
    if (!best || d < best.d) best = { el, d };
  }
  return best?.el ?? null;
}

function RobotTraveller({ light }: { light: boolean }) {
  const { scene } = useGLTF(MODEL);
  const group = useRef<Group>(null);
  const size = useThree((s) => s.size);
  const zonesRef = useRef<HTMLElement[]>([]);
  const drag = useRef({ active: false, lastX: 0, yaw: 0, vel: 0 });
  const started = useRef(false);

  // normalise the bot to ~1 world unit
  const { offset, fit } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const s = box.getSize(new THREE.Vector3());
    return {
      offset: box.getCenter(new THREE.Vector3()).multiplyScalar(-1),
      fit: 1 / Math.max(s.x, s.y, s.z),
    };
  }, [scene]);

  // the levitating head node — cursor-follow rotates THIS, not the group,
  // so the body stays calm under the head's attention (layered motion);
  // held in refs because useFrame mutates their rotation every frame.
  // Arm pods pivot at the shoulders: rotation.z swings them outward/up,
  // which is the pointing gesture.
  const headRef = useRef<THREE.Object3D | null>(null);
  const armLRef = useRef<THREE.Object3D | null>(null);
  const armRRef = useRef<THREE.Object3D | null>(null);
  useEffect(() => {
    headRef.current = scene.getObjectByName('Head') ?? null;
    armLRef.current = scene.getObjectByName('ArmL') ?? null;
    armRRef.current = scene.getObjectByName('ArmR') ?? null;
  }, [scene]);

  // point-target bookkeeping: candidate cache per selector + the currently
  // highlighted element (gets the .l4-aim class so CSS can mark it)
  const pointEls = useRef<{ sel: string; els: HTMLElement[] }>({ sel: '', els: [] });
  const aimedEl = useRef<HTMLElement | null>(null);

  // signal-orange emissive boost: Meshy bakes the eyes/ring/emblem near-cream,
  // tinting the emissive factor warms them into the brand accent + lets Bloom
  // pick them up (same recipe as the lab3 reactor core)
  useMemo(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat?.emissiveMap) {
        mat.emissive.setRGB(1.0, 0.55, 0.28);
        mat.emissiveIntensity = 2.6;
      }
    });
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
      aimedEl.current?.classList.remove('l4-aim');
    };
  }, []);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;

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

    // resolve the presented element for pointing zones (§14.2.1 — the robot
    // responds to CONTENT: hovered candidate wins, else nearest the centre)
    let aim: HTMLElement | null = null;
    if (target.point) {
      if (pointEls.current.sel !== target.point) {
        pointEls.current = {
          sel: target.point,
          els: Array.from(document.querySelectorAll<HTMLElement>(target.point)),
        };
      }
      aim = pickPointTarget(pointEls.current.els, { w: size.width, h: size.height });
    }
    if (aim !== aimedEl.current) {
      aimedEl.current?.classList.remove('l4-aim');
      aim?.classList.add('l4-aim');
      aimedEl.current = aim;
    }

    // body/group: zone pose + the user's drag; head: cursor attention —
    // two layers with different lag is what reads as "alive" (§14.2.1)
    const followW = reduced ? 0 : 1;
    const yawTarget = target.yaw + drag.current.yaw;
    const pitchTarget = target.pitch;
    let headYaw = clamp(state.pointer.x * 0.55, -0.55, 0.55) * followW;
    let headPitch = clamp(-state.pointer.y * 0.28, -0.28, 0.28) * followW;
    let lean = 0;
    // arm rest pose = a slight idle sway so the pods never look frozen
    let armLGoal = reduced ? 0 : Math.sin(t * 1.3) * 0.05;
    let armRGoal = reduced ? 0 : Math.sin(t * 1.3 + 1.7) * -0.05;

    if (aim) {
      const r = aim.getBoundingClientRect();
      const w = toWorld(r.left + r.width / 2, r.top + r.height / 2, {
        w: size.width,
        h: size.height,
      });
      const rx = w.x - g.position.x;
      const ry = w.y - g.position.y;
      // head looks AT the content (a dash of cursor keeps it alive)
      headYaw = clamp(Math.atan2(rx, 3.2), -0.9, 0.9) + state.pointer.x * 0.15 * followW;
      headPitch = clamp(-Math.atan2(ry, 3.2), -0.5, 0.5);
      // the near arm swings up from hanging (-90°) toward the target angle;
      // pivot sits at the shoulder so +z raises ArmR outward, -z raises ArmL
      const s = clamp(Math.atan2(ry, Math.abs(rx)) + Math.PI / 2, 0.35, 2.2);
      if (rx >= 0) armRGoal = s;
      else armLGoal = -s;
      lean = clamp(rx * 0.05, -0.13, 0.13); // lean into the gesture
    }

    const float = reduced ? 0 : Math.sin(t * 1.1) * 0.035 * target.scale * target.float;

    if (reduced || !started.current) {
      // snap on first frame (no fly-in from origin) and under reduced motion
      g.position.set(target.x, target.y + float, 0);
      g.scale.setScalar(target.scale);
      g.rotation.set(pitchTarget, yawTarget, lean);
      headRef.current?.rotation.set(headPitch, headYaw, 0);
      armLRef.current?.rotation.set(0, 0, armLGoal);
      armRRef.current?.rotation.set(0, 0, armRGoal);
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
    g.rotation.z += (lean - g.rotation.z) * Math.min(1, dt * 3);
    const head = headRef.current;
    if (head) {
      const hk = Math.min(1, dt * 4.5);
      head.rotation.y += (headYaw - head.rotation.y) * hk;
      head.rotation.x += (headPitch - head.rotation.x) * hk;
    }
    const ak = Math.min(1, dt * 5);
    const armL = armLRef.current;
    const armR = armRRef.current;
    if (armL) armL.rotation.z += (armLGoal - armL.rotation.z) * ak;
    if (armR) armR.rotation.z += (armRGoal - armR.rotation.z) * ak;
  });

  return (
    <group ref={group}>
      <group scale={fit}>
        <primitive object={scene} position={offset.toArray()} />
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
        {/* light mode runs much dimmer than dark: the white shell sits on a
            near-white canvas, so any excess light + bloom blows out the
            panel-line detail (§14.2.1 wants the shell contrast to come from
            shading/rim, not glow) */}
        <ambientLight intensity={light ? 0.45 : 0.5} />
        <directionalLight position={[4, 6, 4]} intensity={light ? 1.0 : 1.4} />
        <Suspense fallback={null}>
          <RobotTraveller light={light} />
          <Environment resolution={256} frames={1}>
            <Lightformer intensity={light ? 1.4 : 2.4} position={[0, 3, 3]} scale={[7, 3, 1]} />
            <Lightformer intensity={1.6} position={[-4, 1, -2]} scale={[4, 5, 1]} color={signal} />
            <Lightformer intensity={light ? 1.0 : 1.6} position={[4, 2, 2]} scale={[3, 4, 1]} />
          </Environment>
        </Suspense>
        <EffectComposer>
          <Bloom
            intensity={light ? 0.25 : 0.7}
            luminanceThreshold={light ? 0.92 : 0.6}
            luminanceSmoothing={0.22}
            radius={0.5}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
