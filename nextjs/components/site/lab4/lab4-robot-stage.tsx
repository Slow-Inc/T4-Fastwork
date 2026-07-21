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
// ?v busts stale caches when the asset is re-authored (same public URL)
const MODEL = '/lab4/t4bot-v4.glb';
useGLTF.preload(MODEL);

const SIGNAL_DARK = '#ff6846';
const SIGNAL_LIGHT = '#e8461b';
const CAM_Z = 7;
const FOV = 38;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/* ------------------------------------------------------------- zone travel */
type Mood = 'neutral' | 'focus' | 'happy' | 'wow';

type ZoneTarget = {
  x: number;
  y: number;
  scale: number;
  yaw: number;
  pitch: number;
  point: string;
  perch: string;
  float: number;
  mood: Mood;
};

function toWorld(cx: number, cy: number, viewport: { w: number; h: number }) {
  const worldH = 2 * CAM_Z * Math.tan((FOV / 2) * (Math.PI / 180));
  const worldW = worldH * (viewport.w / viewport.h);
  return {
    x: (cx / viewport.w - 0.5) * worldW,
    y: -(cy / viewport.h - 0.5) * worldH,
  };
}

function readZoneTarget(
  el: HTMLElement,
  viewport: { w: number; h: number },
): ZoneTarget & { dist: number; hidden: boolean } {
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
    perch: el.dataset.l4Perch ?? '',
    float: Number(el.dataset.l4Float ?? 1),
    mood: (el.dataset.l4Mood as Mood) ?? 'neutral',
    dist: Math.abs(cy - viewport.h / 2),
    hidden: r.width === 0 && r.height === 0, // display:none marker (mobile)
  };
}

/* ------------------------------------------------------------ expressions */
/**
 * The face is a canvas-textured plane riding on the Head node, sitting just
 * BEHIND the visor glass so its light reads through the transmission
 * (§14.2.1: "แสดงอารมณ์ผ่านไฟตา/แสง signal ไม่ใช่ใบหน้าการ์ตูน").
 *
 * v4 ships a clean model — no baked eyes, no baked rim — so the canvas owns the
 * whole face outright: no masking, no erasing, no artefacts. Resting neutral is
 * lit eyes, not a blank.
 *
 * The eyes are a real LED DOT-MATRIX: a grid of round cells, only some lit per
 * mood, drawn on a black field so the unlit cells read as a dark panel through
 * the glass. This is what the reference render shows and what reads as a
 * screen rather than a cartoon face.
 *
 * Geometry measured on the v4 mesh in Head-local space: visor centre
 * x -0.008, height 0.518, front glass at z(local-y) 0.512, near-square
 * 0.80×0.79. The plane sits at y 0.518, z 0.47 — behind the 0.512 glass.
 */
const FACE_W = 320;
const FACE_H = 320;
const FACE_PLANE_W = 0.66;
const FACE_PLANE_H = 0.66;
// just in FRONT of the glass front (0.512): three.js transmission renders in a
// separate pass that doesn't composite an additive plane sitting behind it, so
// the LED panel reads as the on-glass display instead of an under-glass layer
const FACE_POS = { x: -0.008, y: 0.518, z: 0.53 };

// dot-matrix layout: each eye is an EYE_COLS×EYE_ROWS grid of LED cells
const EYE_COLS = 5;
const EYE_ROWS = 7;
const CELL = 15; // px pitch between LED centres
const DOT = 9; // lit LED diameter
const EYE_GAP = 42; // px between the two eyes' inner edges
const AMBER = '255, 176, 56';

/** Per-mood lit-cell mask over the 5×7 grid (row-major, 1 = lit). */
const EYE_SHAPES: Record<Mood, number[][]> = {
  // full rounded block — the resting "open" eye
  neutral: [
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
  ],
  // narrowed to the middle bands — attentive
  focus: [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
  // ∩ upward arc — smiling
  happy: [
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 1, 0, 1, 1],
    [1, 0, 0, 0, 1],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
  // wide-open hollow ring — surprised
  wow: [
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
  ],
};

function drawFace(
  ctx: CanvasRenderingContext2D,
  mood: Mood,
  blink: boolean,
  lookX: number,
  lookY: number,
) {
  const W = FACE_W;
  const H = FACE_H;
  ctx.clearRect(0, 0, W, H);

  const gridW = EYE_COLS * CELL;
  const gridH = EYE_ROWS * CELL;
  const gaze = { x: lookX * 10, y: lookY * 8 }; // LED panel shifts with gaze
  const cy = H * 0.5 + gaze.y;
  // the two eyes flank the centre with EYE_GAP between their inner edges
  const leftX = W * 0.5 - EYE_GAP / 2 - gridW + gaze.x;
  const rightX = W * 0.5 + EYE_GAP / 2 + gaze.x;

  const shape = EYE_SHAPES[mood];

  const drawEye = (originX: number) => {
    for (let r = 0; r < EYE_ROWS; r++) {
      for (let c = 0; c < EYE_COLS; c++) {
        let lit = shape[r][c] === 1;
        // a blink collapses the lit rows to the middle two
        if (blink && mood !== 'wow') lit = r >= 3 && r <= 3 && shape[3][c] === 1;
        if (!lit) continue;
        const x = originX + c * CELL + CELL / 2;
        const y = cy - gridH / 2 + r * CELL + CELL / 2;
        const g = ctx.createRadialGradient(x, y, 0, x, y, DOT);
        g.addColorStop(0, `rgba(${AMBER}, 1)`);
        g.addColorStop(0.55, `rgba(${AMBER}, 0.95)`);
        g.addColorStop(1, `rgba(${AMBER}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, DOT, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
  drawEye(leftX);
  drawEye(rightX);
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

  // the face screen — created once per model load, updated when the
  // expression key (mood|blink|gaze) actually changes
  const face = useRef<{
    ctx: CanvasRenderingContext2D;
    tex: THREE.CanvasTexture;
    key: string;
    nextBlink: number;
    blinkUntil: number;
  } | null>(null);
  useEffect(() => {
    const head = headRef.current;
    if (!head) return;
    const canvas = document.createElement('canvas');
    canvas.width = FACE_W;
    canvas.height = FACE_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawFace(ctx, 'neutral', false, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(FACE_PLANE_W, FACE_PLANE_H),
      // additive so the LEDs read as EMITTED light through the smoked glass,
      // and Bloom picks them up; unlit cells are transparent, not black
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    // sits behind the visor glass (FACE_POS measured on the v4 mesh)
    mesh.position.set(FACE_POS.x, FACE_POS.y, FACE_POS.z);
    mesh.renderOrder = 2;
    head.add(mesh);
    face.current = { ctx, tex, key: '', nextBlink: 2.5, blinkUntil: 0 };
    return () => {
      head.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      tex.dispose();
      face.current = null;
    };
  }, [scene]);

  // point-target bookkeeping: candidate cache per selector + the currently
  // highlighted element (gets the .l4-aim class so CSS can mark it)
  const pointEls = useRef<{ sel: string; els: HTMLElement[] }>({ sel: '', els: [] });
  const aimedEl = useRef<HTMLElement | null>(null);
  // perch-target cache: the element the robot sits ON (rect re-read every
  // frame so the seat tracks scroll/resize)
  const perchEl = useRef<{ sel: string; el: HTMLElement | null }>({ sel: '', el: null });

  // v4 ships real named materials (no baked lighting), so we drive them
  // directly instead of the old texture-tint hack:
  //  · RimLight — geometry ring round the visor; push emissive so Bloom blooms
  //    it and it reads as an actual light source, not a painted stripe
  //  · Visor    — smoked glass with KHR transmission; three.js needs the
  //    transmission material explicitly told it is see-through + not tone-mapped
  //    so the LED plane behind it reads through
  useMemo(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      if (!mat) return;
      if (mat.name === 'RimLight') {
        mat.emissive.setRGB(1.0, 0.42, 0.18);
        mat.emissiveIntensity = 5.5;
        mat.toneMapped = false; // let the core blow to white for a real glow
      } else if (mat.name === 'Visor') {
        // dark glossy glass. NOT transmission: the LED panel renders in front of
        // the glass, so transmission would only force an expensive per-frame
        // scene pass (it tipped the robot-stage pages toward the e2e timeout)
        // for no visual gain. A near-black clearcoat reads as the same smoked
        // glass at a fraction of the cost.
        mat.transmission = 0;
        mat.transparent = false;
        mat.color.setRGB(0.015, 0.015, 0.02);
        mat.metalness = 0.0;
        mat.roughness = 0.08;
        mat.clearcoat = 1.0;
        mat.clearcoatRoughness = 0.06;
        mat.envMapIntensity = 1.3;
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

    // markers can be re-rendered out from under us (locale switch, HMR) —
    // refresh the cache whenever a cached node left the document
    let zones = zonesRef.current;
    if (!zones.length || zones.some((el) => !el.isConnected)) {
      zonesRef.current = zones = Array.from(
        document.querySelectorAll<HTMLElement>('[data-l4-zone]'),
      );
    }
    if (!zones.length) return;

    // chase the marker nearest the viewport centre — the damped pursuit IS
    // the seam between storytelling zones (§14.2.1)
    let target: ReturnType<typeof readZoneTarget> | null = null;
    for (const el of zones) {
      const zt = readZoneTarget(el, { w: size.width, h: size.height });
      if (zt.hidden) continue; // display:none dock must never win the chase
      if (!target || zt.dist < target.dist) target = zt;
    }
    // every marker hidden (e.g. mobile) → keep the robot off-stage entirely
    g.visible = !!target;
    if (!target) return;

    // perch zones sit ON a real element: the robot lands on the target's top
    // edge and tracks it through scroll/resize (เกาะ text / เกาะปุ่ม)
    if (target.perch) {
      if (perchEl.current.sel !== target.perch || !perchEl.current.el?.isConnected) {
        perchEl.current = {
          sel: target.perch,
          el: document.querySelector<HTMLElement>(target.perch),
        };
      }
      const seat = perchEl.current.el;
      if (seat) {
        const r = seat.getBoundingClientRect();
        const w = toWorld(r.left + r.width / 2, r.top, { w: size.width, h: size.height });
        target.x = w.x;
        // model is ~1 unit tall and centred, so half the scaled height rests
        // the feet on the edge (small sink so it reads as sitting, not hovering)
        target.y = w.y + 0.46 * target.scale;
      }
    }

    // inertia decay for the user's drag yaw
    if (!drag.current.active && Math.abs(drag.current.vel) > 0.0001) {
      drag.current.yaw = clamp(drag.current.yaw + drag.current.vel, -1.15, 1.15);
      drag.current.vel *= Math.pow(0.0001, dt); // ~fast decay, frame-rate safe
    }

    // resolve the presented element for pointing zones (§14.2.1 — the robot
    // responds to CONTENT: hovered candidate wins, else nearest the centre)
    let aim: HTMLElement | null = null;
    if (target.point) {
      if (
        pointEls.current.sel !== target.point ||
        pointEls.current.els.some((el) => !el.isConnected)
      ) {
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
    // look toward the ACTUAL cursor, measured from where the robot currently is
    // (its world position on the z=0 plane) — not a viewport-centred guess. A
    // robot parked off-centre (the footer peek sits far right) used to under-turn
    // for a cursor on the opposite side because pointer.x is centre-relative;
    // atan2 of the real delta makes it face the pointer wherever it stands.
    const curX = (state.pointer.x * 0.5 + 0.5) * size.width;
    const curY = (-state.pointer.y * 0.5 + 0.5) * size.height;
    const cur = toWorld(curX, curY, { w: size.width, h: size.height });
    let headYaw =
      clamp(Math.atan2(cur.x - g.position.x, 3.6), -0.7, 0.7) * followW;
    let headPitch =
      clamp(-Math.atan2(cur.y - g.position.y, 3.6), -0.42, 0.42) * followW;
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

    // expression: zone mood (drag = wow), blinks, gaze follows the head —
    // redraw only when the face actually changes
    const mood: Mood = drag.current.active ? 'wow' : target.mood;
    const f = face.current;
    if (f) {
      if (!reduced && t > f.nextBlink) {
        f.blinkUntil = t + 0.13;
        f.nextBlink = t + 2.6 + Math.random() * 2.8;
      }
      const blink = !reduced && t < f.blinkUntil;
      const qx = Math.round((headYaw / 0.9) * 10) / 10;
      const qy = Math.round((headPitch / 0.5) * 10) / 10;
      const key = `${mood}|${blink}|${qx}|${qy}`;
      if (key !== f.key) {
        f.key = key;
        drawFace(f.ctx, mood, blink, qx, qy);
        f.tex.needsUpdate = true;
      }
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
      {/* warm signal glow hugging the CHEST — kept on a tight falloff so its
          specular reflection can never reach the glossy visor (it used to
          land mid-screen and read as a stray red dot) */}
      <pointLight
        position={[0, -0.55, 0.75]}
        intensity={light ? 1.1 : 1.5}
        color={light ? SIGNAL_LIGHT : SIGNAL_DARK}
        distance={1.5}
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
  // follow [data-lab4-theme] so scene light derives from the active theme
  // tokens (§14.7 dual-theme rule); pages without a themed shell run the
  // light rig. Client-only component (ssr:false), so the initializer can
  // read the DOM — no setState-in-effect.
  const [light, setLight] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    const el = document.querySelector<HTMLElement>('[data-lab4-theme]');
    return !el || el.dataset.lab4Theme === 'light';
  });
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('[data-lab4-theme]');
    if (!el) return;
    const mo = new MutationObserver(() => setLight(el.dataset.lab4Theme === 'light'));
    mo.observe(el, { attributes: true, attributeFilter: ['data-lab4-theme'] });
    return () => mo.disconnect();
  }, []);

  // let page CSS hide its static poster while the live stage is running
  useEffect(() => {
    if (!webgl) return;
    document.body.classList.add('l4-stage-live');
    return () => document.body.classList.remove('l4-stage-live');
  }, [webgl]);

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
        {/* light mode is LIT but restrained: a clear warm key + rim so the
            robot reads as spotlit on the pale canvas, yet dim enough that
            the white shell keeps its panel-line detail (the 0.9/1.7/3.0 rig
            used to bloom the whole shell into a halo — §14.2.1 wants shell
            contrast from shading/rim, not glow) */}
        <ambientLight intensity={light ? 0.55 : 0.5} />
        <directionalLight position={[4, 6, 4]} intensity={light ? 1.35 : 1.4} />
        <Suspense fallback={null}>
          <RobotTraveller light={light} />
          <Environment resolution={256} frames={1}>
            <Lightformer intensity={light ? 1.8 : 2.4} position={[0, 3, 3]} scale={[7, 3, 1]} />
            <Lightformer intensity={1.6} position={[-4, 1, -2]} scale={[4, 5, 1]} color={signal} />
            <Lightformer intensity={light ? 1.3 : 1.6} position={[4, 2, 2]} scale={[3, 4, 1]} />
          </Environment>
        </Suspense>
        <EffectComposer>
          <Bloom
            intensity={light ? 0.4 : 0.7}
            luminanceThreshold={light ? 0.85 : 0.6}
            luminanceSmoothing={0.22}
            radius={0.5}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
