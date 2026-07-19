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
import type { Group, Mesh, ShaderMaterial } from 'three';

const MODEL = '/lab/robot-head.glb';
useGLTF.preload(MODEL);

/* ------------------------------------------------------------------ tuning */
// Face-screen overlay placement, relative to the head's bbox centre (Y up,
// +Z toward camera). Tuned on localhost against the Meshy head.
const FACE = { x: 0, y: 0.4, z: 0.52 };
const FACE_SIZE = { w: 0.82, h: 0.74 };
const LOOP = 12; // seconds
const PI = Math.PI;

const easeInOut = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (k: number) => Math.min(1, Math.max(0, k));

/* ----------------------------------------------------------- pixel screen */
const SCREEN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Boot sequence: a scanline sweep lights streaming "data" pixels, which then
// resolve into two glowing eyes. uBoot 0→1 drives it; eyes idle-blink after.
const SCREEN_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uBoot;
  varying vec2 vUv;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

  // rounded-rect signed distance (for the screen mask + eyes)
  float rbox(vec2 p, vec2 b, float r){
    vec2 d = abs(p) - b + r;
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
  }

  void main(){
    vec2 uv = vUv;
    // discard outside a rounded-rect so the baked orange rim frames the screen
    vec2 cp = (uv - 0.5) * 2.0;
    float mask = rbox(cp, vec2(0.94, 0.94), 0.34);
    if (mask > 0.0) discard;

    // pixel grid
    vec2 grid = vec2(24.0, 20.0);
    vec2 cell = floor(uv * grid);
    vec2 cuv = fract(uv * grid);
    float rnd = hash(cell);
    float gap = step(0.08, cuv.x) * step(0.08, cuv.y) * step(cuv.x, 0.92) * step(cuv.y, 0.92);

    // scanline sweep reveals rows over the first ~70% of boot; streaming data
    // pixels light up behind the sweep line, then clear as the eyes resolve.
    float sweep = clamp(uBoot / 0.7, 0.0, 1.0);
    float rowNorm = 1.0 - cell.y / grid.y;
    float revealed = step(rowNorm, sweep);
    float flick = step(0.32, fract(rnd * 7.0 + floor(uTime * 8.0) * 0.137)); // denser, fast
    float dataFade = 1.0 - smoothstep(0.72, 0.98, uBoot); // clears as eyes form
    float data = revealed * flick * dataFade;
    // a bright scanning bar at the current sweep row
    float scan = (1.0 - smoothstep(0.0, 0.06, abs(rowNorm - sweep))) * dataFade;

    // eyes (two rounded verticals), brighten in the second half of boot
    float e1 = rbox(uv - vec2(0.37, 0.52), vec2(0.05, 0.08), 0.04);
    float e2 = rbox(uv - vec2(0.63, 0.52), vec2(0.05, 0.08), 0.04);
    float eyeShape = 1.0 - smoothstep(-0.01, 0.02, min(e1, e2));
    float eyeOn = smoothstep(0.6, 0.9, uBoot);
    float blink = 1.0 - 0.9 * step(0.96, fract(uTime * 0.11));
    float eye = eyeShape * eyeOn * blink;

    vec3 bg = vec3(0.015, 0.015, 0.02);
    vec3 orange = vec3(0.98, 0.34, 0.10);
    vec3 white = vec3(1.0);

    vec3 col = bg;
    // faint always-on pixel dot grid so the screen reads as a pixel display
    col += orange * gap * 0.05 * (0.6 + 0.4 * sin(uTime * 2.0 + rnd * 30.0));
    // streaming boot data (orange + sparse white bits) + scan bar
    col += orange * data * gap * 1.3;
    col += white * data * gap * step(0.85, fract(rnd * 13.0)) * 1.1;
    col += orange * scan * gap * 1.6;
    // eyes
    col += mix(white, orange, 0.1) * eye * 1.6;

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ------------------------------------------------------------------ scene */
function RobotScene() {
  const { scene } = useGLTF(MODEL);
  const headGroup = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);
  const flashRef = useRef<Mesh>(null);
  const screenMat = useRef<ShaderMaterial>(null);

  // centre the bust on the head group origin so overlays share its space
  const offset = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    return box.getCenter(new THREE.Vector3()).multiplyScalar(-1);
  }, [scene]);

  const screenMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SCREEN_VERT,
        fragmentShader: SCREEN_FRAG,
        transparent: true,
        toneMapped: false,
        depthWrite: false,
        uniforms: { uTime: { value: 0 }, uBoot: { value: 0 } },
      }),
    [],
  );

  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useFrame((state, dt) => {
    const g = headGroup.current;
    const core = coreRef.current;
    const flash = flashRef.current;
    if (!g) return;
    const time = state.clock.elapsedTime;
    screenMaterial.uniforms.uTime.value = time;

    // Reduced motion: hold fully booted + facing, no loop.
    if (reduced) {
      g.rotation.set(0, 0, 0);
      screenMaterial.uniforms.uBoot.value = 1;
      if (core) core.visible = false;
      if (flash) flash.visible = false;
      return;
    }

    const tt = time % LOOP;
    let ry = PI; // head yaw (PI = back to us, 0 = facing us)
    let boot = 0; // screen boot 0..1
    let coreProg = 0; // 0 = waiting above, 1 = inserted
    let flashK = 0; // insert glow burst 0..1
    let idle = 0; // cursor-follow blend

    if (tt < 1.5) {
      ry = PI;
    } else if (tt < 3.5) {
      const k = (tt - 1.5) / 2.0;
      ry = PI;
      coreProg = easeInOut(k);
      flashK = Math.max(0, 1 - Math.abs(k - 1.0) / 0.28); // burst near insert
    } else if (tt < 5.0) {
      const k = (tt - 3.5) / 1.5;
      ry = lerp(PI, 0, easeInOut(k));
      coreProg = 1;
    } else if (tt < 7.5) {
      const k = (tt - 5.0) / 2.5;
      boot = easeOut(k);
      coreProg = 1;
    } else if (tt < 10.0) {
      boot = 1;
      coreProg = 1;
      idle = clamp01((tt - 7.6) / 0.6);
    } else {
      const k = (tt - 10.0) / 2.0;
      const e = easeInOut(k);
      ry = lerp(0, PI, e);
      boot = 1 - e;
      coreProg = 1 - e;
    }

    // head yaw + gentle idle float, plus cursor-follow when booted & facing
    const cursorYaw = state.pointer.x * 0.32 * idle;
    const cursorPitch = -state.pointer.y * 0.16 * idle;
    g.rotation.y = ry + cursorYaw;
    g.rotation.x = cursorPitch;
    g.position.y = Math.sin(time * 1.1) * 0.03;

    screenMaterial.uniforms.uBoot.value = boot;

    // AI core: drops from above into the head's (rear) core slot, then hides
    if (core) {
      core.visible = coreProg > 0.001 && coreProg < 0.999;
      const cy = lerp(1.7, FACE.y + 0.02, easeInOut(coreProg));
      const cz = lerp(0.7, -0.15, easeInOut(coreProg)); // toward the rear centre
      core.position.set(0, cy, cz);
      const s = lerp(0.16, 0.05, coreProg);
      core.scale.setScalar(s);
      core.rotation.y += dt * 3;
      core.rotation.x += dt * 2;
    }
    // insert glow burst
    if (flash) {
      flash.visible = flashK > 0.01;
      const fs = flashK * 0.7;
      flash.scale.setScalar(fs);
      (flash.material as THREE.MeshBasicMaterial).opacity = flashK * 0.9;
      flash.position.set(0, FACE.y, -0.05);
    }
  });

  return (
    <group ref={headGroup}>
      <primitive object={scene} position={offset.toArray()} />

      {/* live pixel-boot screen, inset so the baked orange rim frames it */}
      <mesh position={[FACE.x, FACE.y, FACE.z]}>
        <planeGeometry args={[FACE_SIZE.w, FACE_SIZE.h, 1, 1]} />
        <primitive object={screenMaterial} ref={screenMat} attach="material" />
      </mesh>

      {/* AI core (emissive) that inserts during the loop */}
      <mesh ref={coreRef} visible={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#ff6a2b"
          emissive="#ff5a1f"
          emissiveIntensity={5}
          toneMapped={false}
          metalness={0.3}
          roughness={0.3}
        />
      </mesh>

      {/* insert glow burst */}
      <mesh ref={flashRef} visible={false}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color="#ff7a30" transparent opacity={0} toneMapped={false} />
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
        frameloop={visible ? 'always' : 'demand'}
        dpr={[1, 1.8]}
        camera={{ position: [0, 0.25, 5], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        eventSource={typeof document !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
        style={{ width: '100%', height: '100%' }}
        aria-hidden
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 6, 4]} intensity={1.4} />
        <Suspense fallback={null}>
          <RobotScene />
          <Environment resolution={256} frames={1}>
            <Lightformer intensity={2.4} position={[0, 3, 3]} scale={[7, 3, 1]} />
            <Lightformer intensity={1.6} position={[-4, 1, -2]} scale={[4, 5, 1]} color="#e8461b" />
            <Lightformer intensity={1.6} position={[4, 2, 2]} scale={[3, 4, 1]} />
          </Environment>
        </Suspense>
        <ContactShadows position={[0, -1.05, 0]} scale={5} blur={2.6} opacity={0.4} far={2.6} color="#2a1712" />
        <EffectComposer>
          <Bloom intensity={0.7} luminanceThreshold={0.6} luminanceSmoothing={0.22} radius={0.5} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
