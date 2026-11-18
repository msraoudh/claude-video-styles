// HERO — WebGL pieces that live inside the Stage's <ThreeCanvas>: dust/bokeh, a fibonacci dot sphere
// (ported from the orbit-card block) and an instanced flip-tile surface (ported from code-slice-hero:
// a square-tile surface that turns over cell by cell under a sweeping Gaussian depth field).
// All of them are pure functions of their props (frame passed in).
import React, { useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { additive, clamp01, smooth, type V3 } from "./stage3d";

const DEG = Math.PI / 180;
const hash = (a: number, b = 0) => {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/* ───────────────────────────── dust / bokeh ───────────────────────────── */

const pointsVS = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  uniform float uScale;
  uniform float uFocus;
  uniform float uBlur;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float depth = max(-mv.z, 1.0);
    float coc = abs(depth - uFocus) / uFocus;
    float s = aSize * (1.0 + coc * uBlur);
    gl_PointSize = clamp(s * uScale / depth, 1.0, 150.0);
    // particles that brush past the lens fade out instead of fogging the frame
    vAlpha = aAlpha / (1.0 + coc * uBlur * 1.6) * step(0.0, -mv.z) * smoothstep(220.0, 1100.0, depth);
    vColor = aColor;
    gl_Position = projectionMatrix * mv;
  }`;
const pointsFS = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d) * 2.0;
    float a = smoothstep(1.0, 0.0, r);
    a = a * a * (0.65 + 0.35 * smoothstep(0.9, 0.55, r));
    gl_FragColor = vec4(vColor * a * vAlpha, 1.0);
  }`;

const usePxScale = (fov: number) => {
  const { gl } = useThree();
  const dpr = gl.getPixelRatio();
  return ((1920 / 2) / Math.tan((fov * DEG) / 2)) * dpr;
};

export type DustProps = {
  frame: number;
  count?: number;
  seed?: number;
  /** box the dust lives in (world px) */
  box?: { x: [number, number]; y: [number, number]; z: [number, number] };
  color?: V3;
  /** brightness multiplier */
  amount?: number;
  /** world size range */
  size?: [number, number];
  /** distance from the camera that is in focus */
  focus?: number;
  blur?: number;
  fov?: number;
  /** slow rise (px per frame) */
  rise?: number;
  /** radial burst: frames since a burst, its origin; particles get pushed outward */
  burst?: { age: number; origin: V3; power?: number };
};

export const Dust: React.FC<DustProps> = ({
  frame,
  count = 420,
  seed = 1,
  box = { x: [-1500, 1500], y: [-1900, 1900], z: [-2600, 2400] },
  color = [0.62, 0.78, 1],
  amount = 1,
  size = [3, 9],
  focus = 3000,
  blur = 2.4,
  fov = 40,
  rise = 0.35,
  burst,
}) => {
  const scale = usePxScale(fov);
  const w = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const al = new Float32Array(count);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(al, 1));
    const mat = additive(
      new THREE.ShaderMaterial({
        uniforms: { uScale: { value: 1 }, uFocus: { value: 3000 }, uBlur: { value: 2 } },
        vertexShader: pointsVS,
        fragmentShader: pointsFS,
        depthTest: true,
      }),
    );
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    const base = Array.from({ length: count }, (_, i) => ({
      x: hash(i, seed * 3.1),
      y: hash(i, seed * 5.7 + 1),
      z: hash(i, seed * 9.3 + 2),
      s: hash(i, seed * 2.2 + 3),
      ph: hash(i, seed * 7.7 + 4) * 6.283,
      k: 0.4 + hash(i, seed * 4.4 + 5) * 0.9,
      warm: hash(i, seed * 6.6 + 6),
    }));
    return { geo, mat, pts, pos, col, sz, al, base };
  }, [count, seed]);
  const t = frame / 60;
  const [x0, x1] = box.x;
  const [y0, y1] = box.y;
  const [z0, z1] = box.z;
  const hy = y1 - y0;
  for (let i = 0; i < count; i++) {
    const b = w.base[i];
    let x = x0 + (x1 - x0) * b.x + Math.sin(t * 0.35 * b.k + b.ph) * 40;
    let y = y0 + ((((b.y * hy + frame * rise * b.k) % hy) + hy) % hy) + Math.cos(t * 0.3 * b.k + b.ph) * 30;
    let z = z0 + (z1 - z0) * b.z + Math.sin(t * 0.27 * b.k + b.ph * 1.3) * 50;
    if (burst && burst.age >= 0 && burst.age < 90) {
      const dx = x - burst.origin[0];
      const dy = y - burst.origin[1];
      const dz = z - burst.origin[2];
      const d = Math.max(60, Math.hypot(dx, dy, dz));
      const push = (burst.power ?? 600) * (1 - Math.exp(-burst.age / 9)) * Math.exp(-d / 1400);
      x += (dx / d) * push;
      y += (dy / d) * push;
      z += (dz / d) * push;
    }
    w.pos[i * 3] = x;
    w.pos[i * 3 + 1] = y;
    w.pos[i * 3 + 2] = z;
    const tw = 0.55 + 0.45 * Math.sin(t * (1.2 + b.k) + b.ph * 2);
    const c = b.warm > 0.85 ? [1, 0.86, 0.72] : color;
    w.col[i * 3] = c[0];
    w.col[i * 3 + 1] = c[1];
    w.col[i * 3 + 2] = c[2];
    w.sz[i] = size[0] + (size[1] - size[0]) * b.s * b.s;
    w.al[i] = tw * amount * (0.35 + 0.65 * b.s);
  }
  w.geo.attributes.position.needsUpdate = true;
  w.geo.attributes.aColor.needsUpdate = true;
  w.geo.attributes.aSize.needsUpdate = true;
  w.geo.attributes.aAlpha.needsUpdate = true;
  w.mat.uniforms.uScale.value = scale;
  w.mat.uniforms.uFocus.value = focus;
  w.mat.uniforms.uBlur.value = blur;
  return <primitive object={w.pts} />;
};

/* ───────────────────────────── dot sphere (orbit-card) ───────────────────────────── */

export type DotSphereProps = {
  frame: number;
  center: V3;
  radius: number;
  count?: number;
  /** rotation (deg): tilt about X then spin about Y */
  tilt?: number;
  spin: number;
  color?: V3;
  /** second colour for the back hemisphere */
  color2?: V3;
  size?: number;
  amount?: number;
  /** 0..1 pulse that brightens the dots in a wave from the pole */
  pulse?: number;
  fov?: number;
  focus?: number;
};

export const DotSphere: React.FC<DotSphereProps> = ({
  frame,
  center,
  radius,
  count = 1100,
  tilt = -18,
  spin,
  color = [0.55, 0.78, 1],
  color2 = [0.62, 0.48, 1],
  size = 7,
  amount = 1,
  pulse = 0,
  fov = 40,
  focus = 3000,
}) => {
  const scale = usePxScale(fov);
  const w = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const al = new Float32Array(count);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(al, 1));
    const mat = additive(
      new THREE.ShaderMaterial({
        uniforms: { uScale: { value: 1 }, uFocus: { value: 3000 }, uBlur: { value: 0.6 } },
        vertexShader: pointsVS,
        fragmentShader: pointsFS,
        depthTest: true,
      }),
    );
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const unit = Array.from({ length: count }, (_, i) => {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const a = golden * i;
      return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    });
    return { geo, mat, pts, pos, col, sz, al, unit };
  }, [count]);
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt * DEG, spin * DEG, 0, "XYZ"));
  const v = new THREE.Vector3();
  const t = frame / 60;
  for (let i = 0; i < count; i++) {
    v.copy(w.unit[i]).applyQuaternion(q);
    w.pos[i * 3] = center[0] + v.x * radius;
    w.pos[i * 3 + 1] = center[1] + v.y * radius;
    w.pos[i * 3 + 2] = center[2] + v.z * radius;
    // front hemisphere (toward +z) brighter and cyan, back dimmer and violet
    const facing = clamp01(v.z * 0.5 + 0.5);
    const lat = w.unit[i].y;
    const wave = pulse > 0 ? Math.exp(-Math.pow((lat - (1 - pulse * 2.4)) * 4, 2)) * pulse : 0;
    const tw = 0.75 + 0.25 * Math.sin(t * 2.1 + i * 1.7);
    const c0 = color;
    const c1 = color2;
    w.col[i * 3] = c1[0] + (c0[0] - c1[0]) * facing + wave * 0.6;
    w.col[i * 3 + 1] = c1[1] + (c0[1] - c1[1]) * facing + wave * 0.6;
    w.col[i * 3 + 2] = c1[2] + (c0[2] - c1[2]) * facing + wave * 0.6;
    w.sz[i] = size * (0.7 + 0.5 * facing) * (1 + wave * 0.8);
    w.al[i] = amount * tw * (0.25 + 0.75 * facing) * (1 + wave * 1.5);
  }
  w.geo.attributes.position.needsUpdate = true;
  w.geo.attributes.aColor.needsUpdate = true;
  w.geo.attributes.aSize.needsUpdate = true;
  w.geo.attributes.aAlpha.needsUpdate = true;
  w.mat.uniforms.uScale.value = scale;
  w.mat.uniforms.uFocus.value = focus;
  return <primitive object={w.pts} />;
};

/* ───────────────────────────── flip-tile surface (code-slice-hero) ───────────────────────────── */

const tileVS = /* glsl */ `
  attribute vec3 aPos;
  attribute vec2 aUV;
  attribute float aFace;
  attribute vec4 aCell;    // cx, cy, w, h (surface px, y up)
  attribute vec4 aMotion;  // dx, dy, dz, scale
  attribute vec4 aAngles;  // rx, ry, rz (rad), formation
  attribute vec4 aSurf;    // shade, frontSel, rearSel, glow
  uniform vec2 uSize;
  uniform float uDepth;
  varying vec2 vUV;
  varying vec2 vAtlas;
  varying vec2 vSurf;
  varying float vFace;
  varying float vShade;
  varying float vFront;
  varying float vRear;
  varying float vGlow;
  varying float vForm;
  void main() {
    vec3 p = vec3(aPos.xy * aCell.zw, aPos.z * uDepth * (0.25 + 0.75 * aAngles.w)) * aMotion.w;
    vec3 c = cos(aAngles.xyz);
    vec3 s = sin(aAngles.xyz);
    p.xy = vec2(c.z * p.x - s.z * p.y, s.z * p.x + c.z * p.y);
    p.xz = vec2(c.y * p.x + s.y * p.z, -s.y * p.x + c.y * p.z);
    p.yz = vec2(c.x * p.y - s.x * p.z, s.x * p.y + c.x * p.z);
    p += vec3(aCell.xy, 0.0) + aMotion.xyz;
    vUV = aUV;
    vAtlas = (aCell.xy + (aUV - 0.5) * aCell.zw) / uSize + 0.5;
    vSurf = p.xy;
    vFace = aFace;
    vShade = aSurf.x;
    vFront = aSurf.y;
    vRear = aSurf.z;
    vGlow = aSurf.w;
    vForm = aAngles.w;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;

const tileFS = /* glsl */ `
  uniform sampler2D uTexN;
  uniform sampler2D uTexP;
  uniform vec4 uCursor;   // x, y, radius, strength
  uniform vec3 uTileA;    // procedural tile colour
  uniform float uEdge;    // grid line strength on the procedural face
  uniform float uBright;
  varying vec2 vUV;
  varying vec2 vAtlas;
  varying vec2 vSurf;
  varying float vFace;
  varying float vShade;
  varying float vFront;
  varying float vRear;
  varying float vGlow;
  varying float vForm;
  void main() {
    float radius = 0.08 * vForm;
    vec2 q = abs(vUV - 0.5) - (0.5 - radius);
    float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
    if (vFace < 1.5 && radius > 0.0001 && dist > 0.0) discard;
    // at rest the tiles are one flat seamless surface: side walls would only z-fight at the shared edges
    if (vFace > 1.5 && vForm < 0.03) discard;
    vec3 col;
    if (vFace > 1.5) {
      float sh = vFace > 4.5 ? 1.0 : (vFace > 3.5 ? 0.45 : 0.7);
      col = vec3(0.16, 0.2, 0.28) * sh;
    } else {
      bool front = vFace < 0.5;
      float sel = front ? vFront : vRear;
      if (front && sel < 0.5) {
        float e = min(min(vUV.x, 1.0 - vUV.x), min(vUV.y, 1.0 - vUV.y));
        float line = 1.0 - smoothstep(0.0, 0.05, e);
        float top = smoothstep(0.85, 1.0, vUV.y) * 0.5;
        col = uTileA * (0.85 + 0.3 * vUV.y) + vec3(0.07, 0.1, 0.17) * (line * uEdge + top * 0.25);
      } else if (!front && sel < 0.5) {
        col = texture2D(uTexN, vAtlas).rgb;
      } else {
        col = texture2D(uTexP, vAtlas).rgb;
      }
      col *= vShade * uBright;
    }
    float d = length(vSurf - uCursor.xy) / max(uCursor.z, 1.0);
    float L = exp(-d * d * 1.4) * uCursor.w;
    col += vec3(0.5, 0.68, 1.0) * L * 0.32 + vec3(0.75, 0.85, 1.0) * vGlow;
    gl_FragColor = vec4(col, 1.0);
  }`;

const buildTileGeometry = () => {
  const verts: number[] = [];
  const uvs: number[] = [];
  const faces: number[] = [];
  const quad = (c: number[][], face: number) => {
    const uv = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    for (const i of [0, 1, 2, 0, 2, 3]) {
      verts.push(...c[i]);
      uvs.push(...uv[i]);
      faces.push(face);
    }
  };
  const h = 0.5;
  quad([[-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]], 0);
  quad([[h, -h, -h], [-h, -h, -h], [-h, h, -h], [h, h, -h]], 1);
  quad([[-h, -h, -h], [-h, -h, h], [-h, h, h], [-h, h, -h]], 2);
  quad([[h, -h, h], [h, -h, -h], [h, h, -h], [h, h, h]], 3);
  quad([[-h, -h, -h], [h, -h, -h], [h, -h, h], [-h, -h, h]], 4);
  quad([[-h, h, h], [h, h, h], [h, h, -h], [-h, h, -h]], 5);
  return { verts: new Float32Array(verts), uvs: new Float32Array(uvs), faces: new Float32Array(faces) };
};

export type TilePose = {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  scale: number;
  formation: number;
  shade: number;
  /** 0 = procedural tile, 1 = texture P */
  front: number;
  /** 0 = texture N, 1 = texture P */
  rear: number;
  glow: number;
};

export type Tile = { i: number; col: number; row: number; cx: number; cy: number; w: number; h: number };

export const makeTiles = (cols: number, rows: number, W: number, H: number): Tile[] => {
  const tiles: Tile[] = [];
  const cw = W / cols;
  const ch = H / rows;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      tiles.push({ i: r * cols + c, col: c, row: r, cx: -W / 2 + cw * (c + 0.5), cy: H / 2 - ch * (r + 0.5), w: cw, h: ch });
  return tiles;
};

export const TileSurface: React.FC<{
  tiles: Tile[];
  W: number;
  H: number;
  depth?: number;
  matrix: THREE.Matrix4;
  pose: (t: Tile) => TilePose;
  texN?: THREE.Texture | null;
  texP?: THREE.Texture | null;
  cursor?: { x: number; y: number; r: number; k: number };
  tileColor?: V3;
  edge?: number;
  bright?: number;
}> = ({ tiles, W, H, depth = 14, matrix, pose, texN, texP, cursor, tileColor = [0.035, 0.05, 0.085], edge = 1, bright = 1 }) => {
  const n = tiles.length;
  const w = useMemo(() => {
    const g = buildTileGeometry();
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute("aPos", new THREE.BufferAttribute(g.verts, 3));
    geo.setAttribute("position", new THREE.BufferAttribute(g.verts, 3));
    geo.setAttribute("aUV", new THREE.BufferAttribute(g.uvs, 2));
    geo.setAttribute("aFace", new THREE.BufferAttribute(g.faces, 1));
    const cell = new Float32Array(n * 4);
    const motion = new Float32Array(n * 4);
    const angles = new Float32Array(n * 4);
    const surf = new Float32Array(n * 4);
    geo.setAttribute("aCell", new THREE.InstancedBufferAttribute(cell, 4));
    geo.setAttribute("aMotion", new THREE.InstancedBufferAttribute(motion, 4));
    geo.setAttribute("aAngles", new THREE.InstancedBufferAttribute(angles, 4));
    geo.setAttribute("aSurf", new THREE.InstancedBufferAttribute(surf, 4));
    geo.instanceCount = n;
    const blank = new THREE.DataTexture(new Uint8Array([8, 12, 20, 255]), 1, 1);
    blank.needsUpdate = true;
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTexN: { value: blank },
        uTexP: { value: blank },
        uSize: { value: new THREE.Vector2(1, 1) },
        uDepth: { value: 14 },
        uCursor: { value: new THREE.Vector4(0, 0, 1, 0) },
        uTileA: { value: new THREE.Vector3(0.035, 0.05, 0.085) },
        uEdge: { value: 1 },
        uBright: { value: 1 },
      },
      vertexShader: tileVS,
      fragmentShader: tileFS,
      side: THREE.FrontSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.matrixAutoUpdate = false;
    return { geo, mat, mesh, cell, motion, angles, surf, blank };
  }, [n]);
  for (const t of tiles) {
    const p = pose(t);
    const k = t.i * 4;
    w.cell[k] = t.cx;
    w.cell[k + 1] = t.cy;
    w.cell[k + 2] = t.w;
    w.cell[k + 3] = t.h;
    w.motion[k] = p.x;
    w.motion[k + 1] = p.y;
    w.motion[k + 2] = p.z;
    w.motion[k + 3] = p.scale;
    w.angles[k] = p.rx * DEG;
    w.angles[k + 1] = p.ry * DEG;
    w.angles[k + 2] = p.rz * DEG;
    w.angles[k + 3] = p.formation;
    w.surf[k] = p.shade;
    w.surf[k + 1] = p.front;
    w.surf[k + 2] = p.rear;
    w.surf[k + 3] = p.glow;
  }
  (w.geo.attributes.aCell as THREE.InstancedBufferAttribute).needsUpdate = true;
  (w.geo.attributes.aMotion as THREE.InstancedBufferAttribute).needsUpdate = true;
  (w.geo.attributes.aAngles as THREE.InstancedBufferAttribute).needsUpdate = true;
  (w.geo.attributes.aSurf as THREE.InstancedBufferAttribute).needsUpdate = true;
  const u = w.mat.uniforms;
  u.uTexN.value = texN ?? w.blank;
  u.uTexP.value = texP ?? w.blank;
  (u.uSize.value as THREE.Vector2).set(W, H);
  u.uDepth.value = depth;
  (u.uCursor.value as THREE.Vector4).set(cursor?.x ?? 0, cursor?.y ?? 0, cursor?.r ?? 1, cursor?.k ?? 0);
  (u.uTileA.value as THREE.Vector3).set(tileColor[0], tileColor[1], tileColor[2]);
  u.uEdge.value = edge;
  u.uBright.value = bright;
  w.mesh.matrix.copy(matrix);
  w.mesh.matrixWorldNeedsUpdate = true;
  return <primitive object={w.mesh} />;
};

/* ───────── the sweep (code-slice-hero poseAt, re-expressed in 60 fps frames) ───────── */

export type Sweep = {
  /** frame the cursor starts crossing */
  start: number;
  /** frames for the full crossing */
  dur: number;
  dir: 1 | -1;
  /** 1 = linear, higher = starts fast and settles */
  power?: number;
  flipDur?: number;
  radius?: number;
  falloff?: number;
  /** + toward the camera */
  depth?: number;
  tilt?: number;
  bounce?: number;
  noise?: number;
  /** which tiles turn over */
  flips: (t: Tile) => boolean;
};

export const sweepCursorX = (s: Sweep, W: number, frame: number) => {
  const R = s.radius ?? 260;
  const left = -W / 2 - R * 1.8;
  const span = W + R * 3.6;
  const pw = 1 + (s.power ?? 2);
  const u = clamp01((frame - s.start) / s.dur);
  const e = 1 - Math.pow(1 - u, pw);
  return s.dir === 1 ? left + span * e : -left - span * e;
};

const smoothStep3 = (u: number) => {
  const v = clamp01(u);
  return v * v * (3 - 2 * v);
};

/** One sweep's contribution to a tile at `frame` (angles in degrees). */
export const sweepPose = (s: Sweep, t: Tile, W: number, frame: number) => {
  const R = s.radius ?? 260;
  const falloff = s.falloff ?? 1.4;
  const depth = s.depth ?? 90;
  const tilt = s.tilt ?? 40;
  const flipDur = s.flipDur ?? 22;
  const bounceK = s.bounce ?? 0.18;
  const noise = s.noise ?? 1.2;
  const pw = 1 + (s.power ?? 2);
  const left = -W / 2 - R * 1.8;
  const span = W + R * 3.6;
  const rank = s.dir === 1 ? (t.cx - left) / span : (-t.cx - left) / span;
  const inv = 1 - Math.pow(1 - clamp01(rank), 1 / pw);
  const passTime = s.start + s.dur * inv;
  const active = s.flips(t);
  const flipStart = passTime + hash(t.col, t.row) * 1.2;
  const p = active ? clamp01((frame - flipStart) / flipDur) : 0;
  const turn = smooth(p / 0.64);
  const ringT = clamp01((p - 0.64) / 0.36);
  const ringEnv = smooth(ringT / 0.12) * Math.exp(-3.3 * ringT) * (1 - smooth((ringT - 0.72) / 0.28));
  const bounce = bounceK * 36 * Math.sin(ringT * Math.PI * 3.3) * ringEnv;
  const flight = Math.pow(Math.sin(Math.PI * p), 0.7);
  const cx = sweepCursorX(s, W, frame);
  const cy = 0;
  const d2 = (t.cx - cx) ** 2 + (t.cy - cy) ** 2;
  const raw = Math.exp((-falloff * d2) / (R * R));
  const radial = smoothStep3((raw - 0.06) / 0.94);
  const running = frame >= s.start && frame <= s.start + s.dur;
  const approach = smooth((frame - passTime + 12) / 9.6);
  const pull = (running ? radial * approach * (1 - smooth(p / 0.32)) : 0) * (active ? 1 : 0.55);
  const dx = cx - t.cx;
  const dy = cy - t.cy;
  const peak = Math.exp((-falloff * t.cy * t.cy) / (R * R));
  const variation = noise * Math.max(pull, flight * peak);
  const tt = frame / 60;
  const ph = hash(t.col * 3.3, t.row * 1.7) * 6.283;
  const jitter = variation * (Math.sin(tt * 5.7 + ph) * 0.7 + Math.sin(tt * 10.3 + ph * 1.71) * 0.3);
  const seedX = hash(t.col, t.row * 2.1 + 7) * 2 - 1;
  const seedY = hash(t.col * 1.9 + 3, t.row) * 2 - 1;
  const seedZ = hash(t.col + 11, t.row + 5) * 2 - 1;
  const depthGain = depth / 160;
  const pullTiltX = depthGain * ((dy / R) * tilt * 1.6 * pull + seedX * tilt * 0.16 * pull);
  const yawDx = active ? s.dir * Math.max(0, -s.dir * dx) : -dx;
  const yawHandoff = active ? 1 - smooth((frame - passTime + 2.4) / 7.2) : 1;
  const pullTiltY = depthGain * ((yawDx / R) * tilt * 1.8 * pull + seedY * tilt * 0.12 * pull) * yawHandoff;
  const pullZ = (tilt / 30) * depth * 0.45 * pull;
  return {
    x: Math.max(-t.w * 0.18, Math.min(t.w * 0.18, dx * 0.08 * pull)) + jitter * 0.2,
    y: Math.max(-t.h * 0.11, Math.min(t.h * 0.11, dy * 0.07 * pull)) + jitter * 0.16,
    z: pullZ + 26 * flight * (0.4 + 0.6 * peak),
    rx: -pullTiltX + seedX * variation * 3 * flight + jitter,
    ry: s.dir * (180 * turn + bounce) + pullTiltY + jitter * 0.7,
    rz: seedZ * variation * (2.3 * flight + 1.2 * pull) + jitter * 0.35,
    formation: Math.max(pull, flight * (0.55 + 0.45 * peak)),
    turned: turn > 0.5,
    done: p >= 1,
    progress: p,
    active,
    flight,
  };
};

export const restPose = (front = 0, rear = 0): TilePose => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, scale: 1, formation: 0, shade: 1, front, rear, glow: 0 });
