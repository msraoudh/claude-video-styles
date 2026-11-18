import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import { random } from "remotion";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { glyphGeometry, layoutLine, lineWidth } from "./glyphs";
import { T } from "./timing";
import { clamp01, smooth } from "./fx";
import { makePost } from "./post";
import { newFogExp2 } from "./three-shim";

/**
 * « PLUS TARD » → « JAMAIS. » — a frame-driven port of the wireframe-portal-title block (Three.js):
 * extruded wireframe letterforms (dark fill + fat edge lines) come through the portal, then on the word « jamais »
 * every letter turns edge-on and is handed off to the new phrase (same glyphs A / S are reused and slide over,
 * the others swap identity), with a deterministic block glitch + chromatic split in a post pass, depth fog,
 * warp dots, and finally the resolved word rushes past the lens.
 * Pure function of the GLOBAL frame `g` (passed in: custom contexts are not bridged into the R3F root).
 */

const INK = new THREE.Color("#03060d");
const RED = new THREE.Color("#ff2e4d");
const WHITE = new THREE.Color("#f4f7ff");
const W = 1080;
const H = 1920;
const CAM_Z = 20;
const DEPTH = 0.3; // extrusion, em
const PX_PER_UNIT = H / (2 * CAM_Z * Math.tan((40 * Math.PI) / 360)); // ≈131.9 px per unit at z = 0

type Letter = {
  g: THREE.Group;
  fill: THREE.MeshBasicMaterial;
  cap: THREE.MeshBasicMaterial;
  capMesh: THREE.Mesh;
  line: LineMaterial;
  ch: string;
  baseX: number;
  baseY: number;
  size: number;
  z: number;
  depthScale: number;
};
type Slot = { from: Letter | null; to: Letter | null; delay: number; same: boolean; exitDelay: number };

const buildWorld = () => {
  const root = new THREE.Group();
  const res = new THREE.Vector2(W, H);
  const geoCache = new Map<string, ReturnType<typeof glyphGeometry>>();
  const geomFor = (ch: string) => {
    if (!geoCache.has(ch)) geoCache.set(ch, glyphGeometry(ch, DEPTH, 8));
    return geoCache.get(ch)!;
  };
  const make = (ch: string, x: number, y: number, size: number, seed: string): Letter => {
    const { geo, cap, yOff } = geomFor(ch);
    const g = new THREE.Group();
    const fill = new THREE.MeshBasicMaterial({ color: "#05070c", transparent: true, opacity: 0.94, side: THREE.DoubleSide });
    g.add(new THREE.Mesh(geo, fill));
    const capMat = new THREE.MeshBasicMaterial({ color: WHITE.clone(), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const capMesh = new THREE.Mesh(cap, capMat);
    g.add(capMesh);
    const edges = new THREE.EdgesGeometry(geo, 20);
    const lg = new LineSegmentsGeometry();
    lg.setPositions(edges.attributes.position.array as Float32Array);
    edges.dispose();
    const line = new LineMaterial({ color: RED.getHex(), linewidth: 3.6, transparent: true, resolution: res });
    line.fog = true;
    g.add(new LineSegments2(lg, line));
    root.add(g);
    return {
      g,
      fill,
      cap: capMat,
      capMesh,
      line,
      ch,
      baseX: x,
      baseY: y + yOff * size,
      size,
      z: (random(`z${seed}`) - 0.5) * 0.7,
      depthScale: 0.75 + random(`d${seed}`) * 0.5,
    };
  };

  // ── layouts (world units at z = 0; 1 unit ≈ 132 px) ──
  const srcSize = 6.5 / lineWidth("TARD", 1);
  const tgtSize = 7.3 / lineWidth("JAMAIS.", 1, -0.02, { "S.": -0.02 });
  const src = [...layoutLine("PLUS", srcSize, 1.05), ...layoutLine("TARD", srcSize, -1.05, -0.02, { TA: -0.05 })].map((p, i) => make(p.ch, p.x, p.y, srcSize, `s${i}`));
  const tgt = layoutLine("JAMAIS.", tgtSize, -0.05, -0.02, { "S.": -0.02 }).map((p, i) => make(p.ch, p.x, p.y, tgtSize, `t${i}`));

  // ── hand-off pairing (exact glyph first, then nearest), as in the source block ──
  const slots: Slot[] = tgt.map((to) => ({ from: null, to, delay: 0, same: false, exitDelay: 0 }));
  const remaining = new Set(src);
  const dist = (a: Letter, b: Letter) => Math.hypot(a.baseX - b.baseX, a.baseY - b.baseY);
  for (const exact of [true, false]) {
    for (const s of slots) {
      if (s.from) continue;
      let best: Letter | null = null;
      let cost = Infinity;
      for (const l of remaining) {
        if (exact && l.ch !== s.to!.ch) continue;
        const c = dist(l, s.to!);
        if (c < cost) {
          best = l;
          cost = c;
        }
      }
      if (best) {
        s.from = best;
        remaining.delete(best);
      }
    }
  }
  for (const l of remaining) slots.push({ from: l, to: null, delay: 0, same: false, exitDelay: 0 });
  slots.forEach((s, i) => {
    const order = s.to ? tgt.indexOf(s.to) : 3;
    s.delay = (order / Math.max(1, tgt.length - 1)) * 4; // ripple left → right, centred on « jamais »
    s.exitDelay = (order / Math.max(1, tgt.length - 1)) * 4;
    s.same = !!(s.from && s.to && s.from.ch === s.to.ch);
    if (s.same && s.to) s.to.g.visible = false;
    void i;
  });

  // ── warp dots ──
  const N = 320;
  const dots = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  dots.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  dots.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const dotMat = new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const points = new THREE.Points(dots, dotMat);
  points.frustumCulled = false;
  root.add(points);
  const seeds = Array.from({ length: N }, (_, i) => ({
    th: random(`wa${i}`) * Math.PI * 2,
    r: 1.2 + Math.pow(random(`wr${i}`), 0.7) * 11,
    z0: random(`wz${i}`) * 90,
    red: random(`wc${i}`) < 0.35,
  }));

  return { root, src, tgt, slots, dots, pos, col, seeds, N };
};

/** phrase ease of the source block: slow preparation, fast edge-on hand-off at x = 0.62, soft settle */
const phraseEase = (x: number, e = 6) => {
  const t = clamp01(x);
  const a = Math.pow(t * 0.38, e);
  const b = Math.pow((1 - t) * 0.62, e);
  return a / (a + b);
};

const POST_FS = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform float uGlitch;
  uniform float uSeed;
  uniform float uCA;
  uniform vec3 uHaze;
  uniform vec2 uHazeAt;
  varying vec2 vUv;
  float rnd(float s) { return fract(543.2543 * sin(dot(vec2(s, s), vec2(3525.46, -54.3415)))); }
  void main() {
    vec2 uv = vUv;
    float band = floor(uv.y * 26.0 + rnd(uSeed) * 3.0);
    float on = step(0.52, rnd(band * 1.37 + uSeed * 7.1));
    float shift = (rnd(band * 3.11 + uSeed) - 0.5) * uGlitch * 0.16 * on;
    uv.x += shift;
    float ca = uCA + uGlitch * 0.010 * on;
    vec4 c = texture2D(tDiffuse, uv);
    c.r = texture2D(tDiffuse, uv + vec2(ca, 0.0)).r;
    c.b = texture2D(tDiffuse, uv - vec2(ca, 0.0)).b;
    // haze behind the letters (aspect-correct radial glow)
    vec2 d = (vUv - uHazeAt) * vec2(1.0, 1.7778);
    c.rgb += uHaze * exp(-dot(d, d) * 5.5);
    gl_FragColor = vec4(c.rgb, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const Content: React.FC<{ g: number }> = ({ g }) => {
  const { gl, scene, camera } = useThree();
  const w = useMemo(buildWorld, []);
  const post = useMemo(
    () =>
      makePost(W, H, POST_FS, {
        uGlitch: { value: 0 },
        uSeed: { value: 0 },
        uCA: { value: 0.0015 },
        uHaze: { value: new THREE.Vector3() },
        uHazeAt: { value: new THREE.Vector2(0.5, 0.5) },
      }),
    [],
  );
  useMemo(() => {
    scene.background = INK;
    scene.fog = newFogExp2(INK, 0.013);
  }, [scene]);

  /* ───────── frame state ───────── */
  const swapStart = T.jamais - 12; // edge-on (progress 0.62 of 16 f) of the middle letter lands on « jamais »
  const SWAP_LEN = 16;
  let glitch = 0;

  // letters fly in through the portal (reading order), seat, tremble
  const flyIn = (l: Letter, i: number) => {
    const u = clamp01((g - T.ca - 1 - i * 0.9) / 13);
    const p = 1 - Math.pow(1 - u, 4);
    return { z: -58 + (l.z + 58) * p, spin: (1 - p) * (i % 2 ? 0.9 : -0.9), on: u > 0 };
  };

  for (const l of [...w.src, ...w.tgt]) l.g.visible = false;
  w.slots.forEach((s, i) => {
    const prog = clamp01((g - swapStart - s.delay) / SWAP_LEN);
    const motion = phraseEase(prog);
    const incoming = motion >= 0.5;
    const swapPulse = Math.exp(-Math.pow((prog - 0.62) / 0.06, 2));
    const settle = Math.exp(-Math.pow((prog - 0.86) / 0.07, 2));
    glitch = Math.max(glitch, swapPulse * 0.9, settle * 0.45);
    const tick = Math.sin(Math.floor(g / 2) * 17.1 + i * 4.7) * settle;
    const tremble = smooth((g - (T.ca + 14)) / 6) * (1 - smooth(prog * 3));
    const jx = (random(`jx${i}-${Math.floor(g / 2)}`) - 0.5) * 0.05 * tremble;
    const jy = (random(`jy${i}-${Math.floor(g / 2)}`) - 0.5) * 0.05 * tremble;

    if (!s.to && s.from) {
      // spare source letter: recedes into the fog
      const l = s.from;
      const fi = flyIn(l, w.src.indexOf(l));
      const dep = smooth((g - (T.jamais - 3)) / 12);
      l.g.visible = fi.on && dep < 0.999;
      l.g.position.set(l.baseX + jx, l.baseY + jy, fi.z - dep * 60);
      l.g.rotation.set(0, fi.spin + dep * 0.5, 0);
      l.g.scale.set(l.size, l.size, l.size * l.depthScale);
      l.line.opacity = 1 - dep;
      l.fill.opacity = 0.94 * (1 - dep);
      l.cap.color.copy(RED);
      l.cap.opacity = 0.2 * (1 - dep);
      return;
    }
    const from = s.from!;
    const to = s.to!;
    const fi = flyIn(from, w.src.indexOf(from));
    const x = from.baseX + (to.baseX - from.baseX) * motion;
    const y = from.baseY + (to.baseY - from.baseY) * motion;
    const zSeat = fi.z + (to.z - from.z) * motion - Math.sin(Math.PI * motion) * 1.6;
    const fly = Math.pow(clamp01((g - T.flyPast - s.exitDelay) / 13), 3);
    const z = zSeat + fly * 40;
    const size = from.size + (to.size - from.size) * motion;
    const edge = Math.pow(Math.abs(2 * motion - 1), 0.65);
    const passed = z > CAM_Z - 0.6;
    for (const [obj, isIn] of [
      [from, false],
      [to, true],
    ] as Array<[Letter, boolean]>) {
      const active = s.same ? !isIn : incoming === isIn;
      obj.g.visible = fi.on && active && !passed;
      if (!obj.g.visible) continue;
      obj.g.position.set(x + tick * 0.12 + jx, y + tick * 0.04 + jy, z);
      const ry = s.same ? Math.sin(Math.PI * motion) * 0.55 : isIn ? -Math.PI * (1 - motion) : Math.PI * motion;
      obj.g.rotation.set(0, (prog > 0 ? ry : 0) + fi.spin, tick * 0.012);
      obj.g.scale.set(size, size, size * obj.depthScale * (s.same ? 1 : prog > 0 ? 0.015 + 0.985 * edge : 1));
      // colour: blood red → white across the hand-off; the resolved word lights its front caps
      const k = smooth((motion - 0.35) / 0.4);
      obj.line.color.copy(RED).lerp(WHITE, k);
      obj.line.opacity = 1;
      obj.fill.opacity = 0.94;
      const lit = smooth((prog - 0.7) / 0.22);
      obj.cap.color.copy(RED).lerp(WHITE, k);
      obj.cap.opacity = (0.2 * (1 - k) + 0.96 * lit) * (1 - fly);
    }
  });

  // warp dots: burst through the portal, slow stream in the hold, second burst on the fly-past
  const travel = 1.2 * (g - T.ca) + 70 * smooth((g - T.ca) / 18) + 26 * smooth((g - T.jamais + 3) / 10) + 90 * smooth((g - T.flyPast) / 16);
  for (let i = 0; i < w.N; i++) {
    const s = w.seeds[i];
    const z = -80 + ((((s.z0 + travel) % 92) + 92) % 92);
    w.pos[i * 3] = Math.cos(s.th) * s.r;
    w.pos[i * 3 + 1] = Math.sin(s.th) * s.r;
    w.pos[i * 3 + 2] = z;
    const b = Math.pow(clamp01((z + 80) / 95), 2.2) * (0.35 + 0.65 * smooth((g - T.ca) / 4));
    const c = s.red ? [1, 0.25, 0.32] : [0.75, 0.85, 1];
    w.col[i * 3] = c[0] * b;
    w.col[i * 3 + 1] = c[1] * b;
    w.col[i * 3 + 2] = c[2] * b;
  }
  (w.dots.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  (w.dots.attributes.color as THREE.BufferAttribute).needsUpdate = true;

  // camera: tiny drift, slow push on JAMAIS., kick on the swap
  const cam = camera as THREE.PerspectiveCamera;
  const push = smooth((g - T.jamais) / 30) * 2.2;
  const kick = Math.exp(-Math.max(0, g - T.jamais) / 5) * (g >= T.jamais ? 1 : 0);
  cam.fov = 40;
  cam.near = 0.1;
  cam.far = 200;
  cam.position.set(Math.sin(g * 0.03) * 0.25 + (random(`ck${g}`) - 0.5) * 0.25 * kick, Math.cos(g * 0.025) * 0.15, CAM_Z - push);
  cam.lookAt(0, 0, 0);
  cam.rotation.z += Math.sin(g * 0.05) * 0.006 + (random(`cr${g}`) - 0.5) * 0.02 * kick;
  cam.updateProjectionMatrix();

  const hazeRed = 1 - smooth((g - T.jamais + 2) / 8);
  const hz = 0.07 + 0.05 * kick;
  const frameState = useRef({ glitch: 0, seed: 0, haze: new THREE.Vector3(), ca: 0.0015 });
  frameState.current.glitch = glitch * 0.9 + 0.5 * Math.exp(-Math.max(0, g - T.ca) / 3) * (g >= T.ca ? 1 : 0);
  frameState.current.seed = Math.floor(g / 2);
  frameState.current.haze.set(hz * (0.9 * hazeRed + 0.55 * (1 - hazeRed)), hz * (0.12 * hazeRed + 0.6 * (1 - hazeRed)), hz * (0.18 * hazeRed + 0.75 * (1 - hazeRed)));
  frameState.current.ca = 0.0012 + 0.004 * kick;

  useFrame(() => {
    const st = frameState.current;
    post.mat.uniforms.uGlitch.value = st.glitch;
    post.mat.uniforms.uSeed.value = st.seed;
    post.mat.uniforms.uHaze.value.copy(st.haze);
    post.mat.uniforms.uCA.value = st.ca;
    post.render(gl, scene, camera, INK);
  }, 1);

  return <primitive object={w.root} />;
};

export const SwapWorld: React.FC<{ g: number }> = ({ g }) => (
  <ThreeCanvas
    width={W}
    height={H}
    flat
    gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    camera={{ fov: 40, near: 0.1, far: 200, position: [0, 0, CAM_Z] }}
    style={{ position: "absolute", inset: 0 }}
  >
    <Content g={g} />
  </ThreeCanvas>
);

export const SWAP_PX_PER_UNIT = PX_PER_UNIT;
