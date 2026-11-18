import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import { beatPulse } from "../../../lib/sync";
import { drawText } from "./glyphs";
import { makePost } from "./post";
import { newScene } from "./three-shim";
import { BLOCK_W, H, L1, L3, LAY, RING_R, RING_W, TITLE_CY, TR, W } from "./layout";
import type { IdentT } from "./ident";
import { clamp01, decay, smooth } from "./fx";

/**
 * « DEVOPS EN (45) SECONDES » in glass — a frame-driven R3F port of the user's glass-shard-title block (via the
 * me-trailer climax): the lockup is rasterised with Inter ExtraBold outlines, its footprint becomes a jagged blob
 * broken into seeded Voronoi panes (Sutherland–Hodgman clip of the blob against each cell); every pane is an
 * extruded, bevelled, rounded piece of transmissive glass carrying its slice of the lockup on its FRONT cap.
 *  · 492 hard cut on the drop: the panes are mid-flight from the lens side, implode and LOCK at 497 (recoil ring)
 *  · the lockup is « etched » (dim) from the lock; each word IGNITES on its spoken frame (per-word shader masks):
 *    DEVOPS 533 · EN 554 · 45 572 (amber, the cyan ring timer closes around it) · SECONDES 609
 *  · teal & orange studio light; light sweep #1 on « 45 », #2 on a beat in the hold; slow camera push
 *  · 764 the panes blast toward the lens into S4.
 * The back plate carries a dot field + cyan bloom so the glass always refracts something (never flat navy).
 */

const FOV = 42;
const CAM_Z = 5.2;
const PANE_Z = 0.6;
const DIST = CAM_Z - PANE_Z;
const VH = 2 * DIST * Math.tan((FOV * Math.PI) / 360);
const VW = VH * (W / H);
/** screen px per world unit on the pane plane */
export const PPU = H / VH;
/** lens shift: the block centre (world origin) lands on screen y = TITLE_CY */
const shiftNdc = (cy: number) => (H / 2 - cy) / (H / 2);
const INK = new THREE.Color("#04070F");

type P2 = [number, number];
const mulberry32 = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const area2 = (p: P2[]) => {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
};
/** keep the half-plane closer to site a than to site b */
const clipHalf = (poly: P2[], a: P2, b: P2): P2[] => {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const nx = b[0] - a[0];
  const ny = b[1] - a[1];
  const side = (p: P2) => (p[0] - mx) * nx + (p[1] - my) * ny;
  const out: P2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i];
    const Q = poly[(i + 1) % poly.length];
    const sp = side(P);
    const sq = side(Q);
    if (sp <= 0) out.push(P);
    if (sp <= 0 !== sq <= 0) {
      const t = sp / (sp - sq);
      out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]);
    }
  }
  return out;
};
const cell = (i: number, sites: P2[], base: P2[]) => {
  let poly = base;
  for (let j = 0; j < sites.length && poly.length >= 3; j++) if (j !== i) poly = clipHalf(poly, sites[i], sites[j]);
  return poly;
};
const sanitize = (poly: P2[]) => {
  const out: P2[] = [];
  for (const p of poly) {
    const l = out[out.length - 1];
    if (l && Math.hypot(p[0] - l[0], p[1] - l[1]) < 1e-4) continue;
    out.push(p);
  }
  while (out.length > 1 && Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1]) < 1e-4) out.pop();
  if (out.length < 3) return null;
  const clean: P2[] = [];
  for (let i = 0; i < out.length; i++) {
    const a = out[(i + out.length - 1) % out.length];
    const b = out[i];
    const c = out[(i + 1) % out.length];
    const cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(cr) < 1e-7) continue;
    clean.push(b);
  }
  if (clean.length < 3) return null;
  if (area2(clean) < 0) clean.reverse();
  return clean;
};
const lineX = (p1: P2, p2: P2, p3: P2, p4: P2): P2 | null => {
  const d = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
  if (Math.abs(d) < 1e-9) return null;
  const t = ((p1[0] - p3[0]) * (p3[1] - p4[1]) - (p1[1] - p3[1]) * (p3[0] - p4[0])) / d;
  return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
};
const inset = (poly: P2[], d: number) => {
  const n = poly.length;
  const edges: Array<{ a: P2; b: P2 }> = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) continue;
    const nx = -dy / len;
    const ny = dx / len;
    edges.push({ a: [a[0] + nx * d, a[1] + ny * d], b: [b[0] + nx * d, b[1] + ny * d] });
  }
  const out: P2[] = [];
  for (let k = 0; k < edges.length; k++) {
    const e1 = edges[(k + edges.length - 1) % edges.length];
    const e2 = edges[k];
    out.push(lineX(e1.a, e1.b, e2.a, e2.b) ?? e2.a);
  }
  return Math.abs(area2(out)) < 1e-6 ? null : out;
};
/** rounded-corner extruded pane (port of the block's buildPieceGeometry, per-corner clamped radius) */
const paneGeometry = (poly: P2[], r: number, depth: number) => {
  const shape = new THREE.Shape();
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const prev = poly[(i + n - 1) % n];
    const cur = poly[i];
    const next = poly[(i + 1) % n];
    const v1x = cur[0] - prev[0];
    const v1y = cur[1] - prev[1];
    const v2x = next[0] - cur[0];
    const v2y = next[1] - cur[1];
    const l1 = Math.hypot(v1x, v1y);
    const l2 = Math.hypot(v2x, v2y);
    const u1x = v1x / l1;
    const u1y = v1y / l1;
    const u2x = v2x / l2;
    const u2y = v2y / l2;
    const cosI = Math.max(-1, Math.min(1, -u1x * u2x - u1y * u2y));
    const sinI = Math.sqrt(Math.max(0, 1 - cosI * cosI));
    const tanHalf = 1 + cosI > 1e-6 ? sinI / (1 + cosI) : 0;
    const d = tanHalf > 1e-4 ? Math.min(r / tanHalf, l1 * 0.45, l2 * 0.45) : 0;
    const sx = cur[0] - u1x * d;
    const sy = cur[1] - u1y * d;
    const ex = cur[0] + u2x * d;
    const ey = cur[1] + u2y * d;
    if (i === 0) shape.moveTo(sx, sy);
    else shape.lineTo(sx, sy);
    if (d > 1e-4) {
      const k = 0.5523;
      shape.bezierCurveTo(sx + u1x * d * k, sy + u1y * d * k, ex - u2x * d * k, ey - u2y * d * k, ex, ey);
    } else shape.lineTo(cur[0], cur[1]);
  }
  shape.closePath();
  const bev = depth * 0.25;
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.8, bevelSegments: 3, curveSegments: 8 });
};

/* ─────────────────────────── the world ─────────────────────────── */

type Word = "devops" | "en" | "n45" | "secondes";
type Shard = {
  grp: THREE.Group;
  cx: number;
  cy: number;
  word: Word;
  inOff: [number, number, number];
  inSpin: [number, number, number];
  outOff: [number, number, number];
  outSpin: [number, number, number];
  baseRot: [number, number, number];
  wob: number;
  wf: number;
  inDelay: number;
  lockDelay: number;
  outDelay: number;
};

const TEXW = 1440;
const TEXH = 2560;
const K = TEXW / W; // texture px per screen px at the pane plane
const AMBER_TEX = "#FF9200"; // painted more saturated than B.amber: ACES desaturates bright emissives back to amber
const CYAN_TEX = "#3FE0F5";

/** block px (y down) → world units (y up) on the pane plane */
const bw = (px: number) => px / PPU;

const buildWorld = (gl: THREE.WebGLRenderer) => {
  const root = new THREE.Group();

  /* the lockup raster, spanning the frustum at the pane plane (texture centre = block centre) */
  const can = document.createElement("canvas");
  can.width = TEXW;
  can.height = TEXH;
  const ctx = can.getContext("2d")!;
  const tx = (bx: number) => TEXW / 2 + bx * K;
  const ty = (by: number) => TEXH / 2 + by * K;
  const paint = (soft: number) => {
    ctx.shadowBlur = soft;
    ctx.fillStyle = "#f6fbff";
    ctx.shadowColor = "rgba(160,235,255,0.16)";
    drawText(ctx, L1, tx(LAY.x1), ty(LAY.b1), LAY.s1 * K, TR);
    drawText(ctx, L3, tx(LAY.x3), ty(LAY.b3), LAY.s3 * K, TR);
    ctx.fillStyle = AMBER_TEX;
    ctx.shadowColor = "rgba(255,170,40,0.22)";
    drawText(ctx, "45", tx(LAY.x45), ty(LAY.b45), LAY.s45 * K, -0.02);
    // the ring timer track (its lit arc is a shader mask)
    ctx.strokeStyle = CYAN_TEX;
    ctx.shadowColor = "rgba(34,211,238,0.3)";
    ctx.lineWidth = RING_W * K;
    ctx.beginPath();
    ctx.arc(tx(0), ty(LAY.ringCy), RING_R * K, 0, Math.PI * 2);
    ctx.stroke();
    // the 45 bezel ticks of the series' ring timer (same proportions as s2/RingTimer: stroke = 2.6 % of Ø)
    const D = RING_R * 2;
    const t0 = RING_R + RING_W * 1.9;
    ctx.lineCap = "round";
    for (let i = 0; i < 45; i++) {
      const a = (i / 45) * Math.PI * 2;
      const major = i % 5 === 0;
      const t1 = t0 + D * 0.045 + (major ? D * 0.012 : 0);
      ctx.lineWidth = RING_W * (major ? 0.55 : 0.38) * K;
      ctx.globalAlpha = major ? 0.95 : 0.6;
      ctx.beginPath();
      ctx.moveTo(tx(0) + Math.sin(a) * t0 * K, ty(LAY.ringCy) - Math.cos(a) * t0 * K);
      ctx.lineTo(tx(0) + Math.sin(a) * t1 * K, ty(LAY.ringCy) - Math.cos(a) * t1 * K);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  ctx.clearRect(0, 0, TEXW, TEXH);
  paint(9);
  paint(0);
  ctx.shadowBlur = 0;
  const headTex = new THREE.CanvasTexture(can);
  headTex.colorSpace = THREE.SRGBColorSpace;
  headTex.anisotropy = 8;

  /* blob silhouette around the lockup (seeded harmonics, rect floor, caps) — world units */
  const HW = bw(BLOCK_W / 2 + 22);
  const HH = bw(LAY.totalH / 2 + 24);
  const PAD = 0.08;
  const A0 = HW + PAD;
  const B0 = HH + PAD * 1.4;
  const capX = bw(BLOCK_W / 2 + 80);
  const capY = bw(LAY.totalH / 2 + 60);
  const rb = mulberry32(45 * 511 + 3);
  const HARM: Array<{ k: number; amp: number; ph: number }> = [];
  for (let k = 2; k <= 9; k++) HARM.push({ k, amp: (rb() * 2 - 1) / Math.sqrt(k), ph: rb() * Math.PI * 2 });
  const blobR = (th: number) => {
    let n = 0;
    for (const h of HARM) n += h.amp * Math.sin(h.k * th + h.ph);
    let r = ((A0 * B0) / Math.hypot(B0 * Math.cos(th), A0 * Math.sin(th))) * (1 + 0.27 * n);
    const c = Math.abs(Math.cos(th));
    const s = Math.abs(Math.sin(th));
    const rect = Math.min(c > 1e-6 ? (HW + PAD * 0.25) / c : 1e9, s > 1e-6 ? (HH + PAD * 0.35) / s : 1e9);
    r = Math.max(r, rect);
    const lim = Math.min(c > 1e-6 ? capX / c : 1e9, s > 1e-6 ? capY / s : 1e9);
    return Math.min(r, lim);
  };
  const re = mulberry32(45 * 733 + 9);
  const blob: P2[] = [];
  const BV = 30;
  for (let j = 0; j < BV; j++) {
    const th = ((j + (re() - 0.5) * 0.72) / BV) * Math.PI * 2;
    const r = blobR(th) * (1 + (re() - 0.5) * 0.07);
    blob.push([r * Math.cos(th), r * Math.sin(th)]);
  }
  const inBlob = (x: number, y: number) => Math.hypot(x, y) <= blobR(Math.atan2(y, x));
  let maxRX = 0;
  let maxRY = 0;
  for (let i = 0; i < 96; i++) {
    const th = (i / 96) * Math.PI * 2;
    const r = blobR(th);
    maxRX = Math.max(maxRX, Math.abs(r * Math.cos(th)));
    maxRY = Math.max(maxRY, Math.abs(r * Math.sin(th)));
  }

  /* seeded sites (some clustering) + 2 Lloyd passes */
  const rnd = mulberry32(45);
  const rv = mulberry32(45 * 977 + 5);
  const centres: P2[] = [];
  for (let g = 0; centres.length < 4 && g < 400; g++) {
    const x = (rv() * 2 - 1) * maxRX;
    const y = (rv() * 2 - 1) * maxRY;
    if (inBlob(x, y)) centres.push([x, y]);
  }
  const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-9, rnd()))) * Math.cos(2 * Math.PI * rnd());
  const N = 46;
  let sites: P2[] = [];
  const sigma = Math.max(maxRX, maxRY) * 0.14;
  for (let g = 0; sites.length < N && g < N * 200; g++) {
    let x: number;
    let y: number;
    if (rnd() < 0.85 * 0.3) {
      const c = centres[Math.floor(rnd() * centres.length) % centres.length];
      x = c[0] + gauss() * sigma;
      y = c[1] + gauss() * sigma;
    } else {
      x = (rnd() * 2 - 1) * maxRX;
      y = (rnd() * 2 - 1) * maxRY;
    }
    if (inBlob(x, y)) sites.push([x, y]);
  }
  const bounds: P2[] = [
    [-maxRX * 1.3, -maxRY * 1.3],
    [maxRX * 1.3, -maxRY * 1.3],
    [maxRX * 1.3, maxRY * 1.3],
    [-maxRX * 1.3, maxRY * 1.3],
  ];
  for (let it = 0; it < 2; it++) {
    sites = sites.map((p, i) => {
      const c = cell(i, sites, bounds);
      if (c.length < 3) return p;
      let x = 0;
      let y = 0;
      for (const q of c) {
        x += q[0];
        y += q[1];
      }
      return [x / c.length, y / c.length] as P2;
    });
  }

  /* material: clear teal-tinted transmissive glass, the lockup on the front cap, per-word ignition masks, fog */
  const iri = document.createElement("canvas");
  iri.width = iri.height = 256;
  {
    const c = iri.getContext("2d")!;
    const gr = c.createLinearGradient(0, 0, 256, 256);
    gr.addColorStop(0, "#303030");
    gr.addColorStop(0.5, "#8a8a8a");
    gr.addColorStop(1, "#d0d0d0");
    c.fillStyle = gr;
    c.fillRect(0, 0, 256, 256);
  }
  const iriTex = new THREE.CanvasTexture(iri);
  const r = LAY.rects;
  const rect4 = (k: Word) => new THREE.Vector4(r[k].x0, r[k].y0, r[k].x1, r[k].y1);
  const U = {
    uFogStart: { value: DIST + 0.3 },
    uFogRho: { value: 4.6 / 36 },
    uFogColor: { value: INK.clone() },
    uScr: { value: new THREE.Vector2(W, H) },
    uRDev: { value: rect4("devops") },
    uREn: { value: rect4("en") },
    uR45: { value: rect4("n45") },
    uRSec: { value: rect4("secondes") },
    uLv: { value: new THREE.Vector4(0, 0, 0, 0) },
    uBase: { value: 0.2 },
    uRing: { value: new THREE.Vector3(LAY.ringCy, RING_R - RING_W / 2 - 2, RING_R + RING_W * 1.9 + RING_R * 0.12 + 4) },
    uRingP: { value: 0 },
    uRingLv: { value: 0 },
    uRingHead: { value: 0 },
  };
  const glass = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#ecfbff"),
    transmission: 1,
    thickness: 0.5,
    ior: 1.47,
    dispersion: 0.22,
    roughness: 0.09,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.3,
    specularIntensity: 1,
    attenuationDistance: 2.4,
    attenuationColor: new THREE.Color("#8fdcf0"),
    envMapIntensity: 1.0,
    iridescence: 0.25,
    iridescenceIOR: 1.9,
    iridescenceThicknessRange: [120, 380],
    iridescenceThicknessMap: iriTex,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(0.94, 1, 1),
    emissiveMap: headTex,
    emissiveIntensity: 1,
  });
  glass.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vNzObj;\nvarying float vDep;")
      .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nvNzObj = normal.z;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvDep = -mvPosition.z;");
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying float vNzObj;
varying float vDep;
uniform float uFogStart;
uniform float uFogRho;
uniform vec3 uFogColor;
uniform vec2 uScr;
uniform vec4 uRDev;
uniform vec4 uREn;
uniform vec4 uR45;
uniform vec4 uRSec;
uniform vec4 uLv;
uniform float uBase;
uniform vec3 uRing;
uniform float uRingP;
uniform float uRingLv;
uniform float uRingHead;
float boxM(vec2 p, vec4 r) {
  vec2 a = smoothstep(r.xy - 2.0, r.xy + 2.0, p) * (1.0 - smoothstep(r.zw - 2.0, r.zw + 2.0, p));
  return a.x * a.y;
}`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
{
  vec2 bp = vec2((vEmissiveMapUv.x - 0.5) * uScr.x, (0.5 - vEmissiveMapUv.y) * uScr.y);
  float lv = uBase;
  lv += boxM(bp, uRDev) * uLv.x;
  lv += boxM(bp, uREn) * uLv.y;
  lv += boxM(bp, uR45) * uLv.z;
  lv += boxM(bp, uRSec) * uLv.w;
  vec2 rq = bp - vec2(0.0, uRing.x);
  float rr = length(rq);
  float ann = smoothstep(uRing.y - 2.0, uRing.y + 1.0, rr) * (1.0 - smoothstep(uRing.z - 1.0, uRing.z + 2.0, rr));
  float a01 = fract(atan(rq.x, -rq.y) / 6.2831853 + 1.0);
  float arc = 1.0 - smoothstep(uRingP - 0.004, uRingP + 0.004, a01);
  float d = uRingP - a01;
  float head = exp(-d * d * 1800.0) * step(-0.01, d);
  lv += ann * (arc * uRingLv + head * uRingHead);
  totalEmissiveRadiance *= lv * smoothstep(0.5, 0.78, vNzObj);
}`,
      )
      .replace(
        "#include <dithering_fragment>",
        "gl_FragColor.rgb = mix(gl_FragColor.rgb, uFogColor, 1.0 - exp(-pow(max(0.0, vDep - uFogStart) * uFogRho, 2.0)));\n#include <dithering_fragment>",
      );
  };

  /* panes */
  const GAP = 0.011;
  const RADIUS = 0.03;
  const DEPTH = 0.075;
  const pane = new THREE.Group();
  pane.position.z = PANE_Z;
  root.add(pane);
  const rf = mulberry32(45 * 31337 + 7);
  const rt = mulberry32(45 * 9973 + 1);
  const shards: Shard[] = [];
  const wordOf = (cx: number, cy: number): Word => {
    const by = -cy * PPU; // block px, y down
    const bx = cx * PPU;
    if (by < LAY.b1 + 20) return bx < (r.devops.x1 + r.en.x0) / 2 ? "devops" : "en";
    if (by > LAY.b3 - LAY.cap3 - 20) return "secondes";
    return "n45";
  };
  sites.forEach((_, i) => {
    let poly = sanitize(cell(i, sites, blob));
    if (!poly || Math.abs(area2(poly)) < 2e-4) return;
    const off = inset(poly, GAP / 2);
    poly = (off && sanitize(off)) || poly;
    let cx = 0;
    let cy = 0;
    for (const p of poly) {
      cx += p[0];
      cy += p[1];
    }
    cx /= poly.length;
    cy /= poly.length;
    const local = poly.map((p) => [p[0] - cx, p[1] - cy] as P2);
    const geo = paneGeometry(local, RADIUS, DEPTH);
    geo.translate(0, 0, -DEPTH / 2);
    const pos = geo.attributes.position;
    const uvs = new Float32Array(pos.count * 2);
    for (let v = 0; v < pos.count; v++) {
      uvs[v * 2] = (pos.getX(v) + cx) / VW + 0.5;
      uvs[v * 2 + 1] = (pos.getY(v) + cy) / VH + 0.5;
    }
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    const grp = new THREE.Group();
    grp.add(new THREE.Mesh(geo, glass));
    grp.position.set(cx, cy, 0);
    pane.add(grp);
    // implode: each pane comes from further out along its own direction, and from the lens side
    const len = Math.hypot(cx, cy) || 1;
    const dx = cx / len;
    const dy = cy / len;
    const spread = 0.9 + rf() * 0.9;
    shards.push({
      grp,
      cx,
      cy,
      word: wordOf(cx, cy),
      inOff: [dx * spread + (rf() - 0.5) * 0.5, dy * spread * 0.8 + (rf() - 0.5) * 0.5, 2.9 * (0.75 + rf() * 0.5)],
      inSpin: [(rf() - 0.5) * 2.4, (rf() - 0.5) * 3.0, (rf() - 0.5) * 1.4],
      outOff: [cx * (0.7 + rf() * 0.6) + (rf() - 0.5) * 0.25, cy * (0.7 + rf() * 0.6) + (rf() - 0.5) * 0.25, 1.9 * (0.85 + rf() * 0.3)],
      outSpin: [(rf() - 0.5) * Math.PI * 1.9, (rf() - 0.5) * Math.PI * 2.4, (rf() - 0.5) * Math.PI * 1.0],
      baseRot: [(rt() - 0.5) * 0.05, (rt() - 0.5) * 0.05, (rt() - 0.5) * 0.016],
      wob: rt() * Math.PI * 2,
      wf: 0.45 + rt() * 0.5,
      inDelay: 0,
      lockDelay: 0,
      outDelay: 0,
    });
  });
  // centre seats first (in), edges peel first (out)
  const n1 = Math.max(1, shards.length - 1);
  [...shards].sort((a, b) => Math.hypot(a.cx, a.cy) - Math.hypot(b.cx, b.cy)).forEach((s, k) => {
    s.inDelay = (k / n1) * 2;
    s.lockDelay = (k / n1) * 3;
  });
  [...shards].sort((a, b) => Math.hypot(b.cx, b.cy * 0.8) - Math.hypot(a.cx, a.cy * 0.8)).forEach((s, k) => (s.outDelay = (k / n1) * 6));

  /* back plate: deep-ink radial gradient + cyan bloom behind the glass + a dot field the panes refract */
  const PW = 900;
  const PH = 2240;
  const bg = document.createElement("canvas");
  bg.width = PW;
  bg.height = PH;
  {
    const c = bg.getContext("2d")!;
    c.fillStyle = "#04070F";
    c.fillRect(0, 0, PW, PH);
    const g0 = c.createRadialGradient(PW / 2, PH / 2, 0, PW / 2, PH / 2, PH * 0.42);
    g0.addColorStop(0, "#10224a");
    g0.addColorStop(0.45, "#081430");
    g0.addColorStop(1, "rgba(4,7,15,0)");
    c.fillStyle = g0;
    c.fillRect(0, 0, PW, PH);
    // dot field (fades out toward the edges)
    const SP = 17;
    for (let y = SP / 2; y < PH; y += SP) {
      for (let x = SP / 2; x < PW; x += SP) {
        const d = Math.hypot((x - PW / 2) / (PW * 0.5), (y - PH / 2) / (PH * 0.3));
        const a = 0.5 * Math.max(0, 1 - d * 0.7);
        if (a < 0.01) continue;
        c.fillStyle = `rgba(150,225,255,${a.toFixed(3)})`;
        c.beginPath();
        c.arc(x, y, 1.5, 0, Math.PI * 2);
        c.fill();
      }
    }
    // cyan bloom behind the lockup + a warm hint behind the 45 (teal & orange)
    const g1 = c.createRadialGradient(PW / 2, PH / 2, 0, PW / 2, PH / 2, PW * 0.62);
    g1.addColorStop(0, "rgba(34,211,238,0.5)");
    g1.addColorStop(0.5, "rgba(34,190,238,0.16)");
    g1.addColorStop(1, "rgba(34,211,238,0)");
    c.fillStyle = g1;
    c.fillRect(0, 0, PW, PH);
    const g2 = c.createRadialGradient(PW / 2, PH / 2, 0, PW / 2, PH / 2, PW * 0.22);
    g2.addColorStop(0, "rgba(245,158,11,0.16)");
    g2.addColorStop(1, "rgba(245,158,11,0)");
    c.fillStyle = g2;
    c.fillRect(0, 0, PW, PH);
  }
  const bgTex = new THREE.CanvasTexture(bg);
  bgTex.colorSpace = THREE.SRGBColorSpace;
  const BZ = -3.2;
  const dB = CAM_Z - BZ;
  const bh = 2 * dB * Math.tan((FOV * Math.PI) / 360) * 1.5;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(bh * (PW / PH), bh), new THREE.MeshBasicMaterial({ map: bgTex, depthWrite: false, depthTest: false, toneMapped: false }));
  back.position.z = BZ;
  back.renderOrder = -1;
  root.add(back);

  /* lights */
  root.add(new THREE.AmbientLight(0xffffff, 0.55));
  const spot = new THREE.SpotLight(0xe8fbff, 6, 0, Math.PI / 4, 0.5, 1);
  spot.position.set(0, 7.1, 2);
  root.add(spot);
  root.add(spot.target);
  const point = new THREE.PointLight(0xffc27a, 2.5, 0, 1);
  point.position.set(0.6, -3, 1.2);
  root.add(point);

  /* dust motes */
  const DN = 150;
  const dust = new THREE.BufferGeometry();
  const dpos = new Float32Array(DN * 3);
  dust.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
  const dustMat = new THREE.PointsMaterial({ size: 2.4, sizeAttenuation: false, color: new THREE.Color(0.55, 0.85, 1), transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false });
  const dustPts = new THREE.Points(dust, dustMat);
  dustPts.frustumCulled = false;
  root.add(dustPts);
  const rd = mulberry32(4545);
  const dseed = Array.from({ length: DN }, () => [(rd() - 0.5) * 3.4, (rd() - 0.5) * 5.6, -5 + rd() * 8.5, rd()] as [number, number, number, number]);

  /* studio environment: dark room + soft boxes — cyan key left, warm amber kicker right (teal & orange) */
  const env = newScene();
  env.add(new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshBasicMaterial({ color: 0x05070c, side: THREE.BackSide })));
  const strip = (w: number, h: number, p: [number, number, number], ry: number, rx: number, k: number, tint = [1, 1, 1]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k * tint[0], k * tint[1], k * tint[2]), side: THREE.DoubleSide }));
    m.position.set(...p);
    m.rotation.set(rx, ry, 0);
    env.add(m);
  };
  strip(1.2, 16, [-7, 0, 1], Math.PI / 2, 0, 4.6, [0.55, 0.92, 1]);
  strip(1.0, 16, [7, 0, 1], -Math.PI / 2, 0, 3.6, [1, 0.72, 0.38]);
  strip(16, 0.8, [0, 8, 0], 0, Math.PI / 2, 2.6, [0.85, 0.95, 1]);
  // the sweep: a narrow cyan-white soft box behind the camera — the environment rotation drags it across the faces
  strip(0.38, 10, [0, 0.4, 8], Math.PI, 0, 7.5, [0.42, 0.9, 1]);
  strip(0.6, 12, [3.5, 0, -9], 0, 0, 2.6, [0.5, 0.85, 1]);
  const pm = new THREE.PMREMGenerator(gl);
  const envTex = pm.fromScene(env as unknown as Parameters<typeof pm.fromScene>[0], 0.02).texture;
  pm.dispose();

  return { root, shards, glass, U, envTex, dust, dpos, dseed, DN, pane };
};

const POST_FS = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform float uCA;
  varying vec2 vUv;
  void main() {
    vec2 d = (vUv - 0.5);
    vec2 off = d * uCA;
    vec4 c = texture2D(tDiffuse, vUv);
    c.r = texture2D(tDiffuse, vUv + off).r;
    c.b = texture2D(tDiffuse, vUv - off).b;
    gl_FragColor = vec4(c.rgb, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** ignition envelope of a word: etched → white-hot spike → lit (0 before f) */
const ignite = (g: number, f: number, lit = 1.0, spike = 1.5) => (g < f ? 0 : lit + spike * Math.exp(-(g - f) / 6));

/** camera push (world units) — shared with the DOM overlays so flares track the glass */
export const camPush = (g: number, T3: IdentT, cover = false) =>
  cover ? 0.06 : 0.16 * smooth((g - T3.lock) / 70) + 0.05 * smooth((g - T3.n45) / 20) - 0.24 * decay(g - T3.drop, 5);
/** perspective scale of the pane plane for a camera push */
export const planeScale = (g: number, T3: IdentT, cover = false) => DIST / (DIST - camPush(g, T3, cover));

const Content: React.FC<{ g: number; T3: IdentT; shakeX: number; shakeY: number; cover: boolean; cy: number }> = ({ g, T3, shakeX, shakeY, cover, cy }) => {
  const { gl, scene, camera } = useThree();
  const w = useMemo(() => buildWorld(gl), [gl]);
  const post = useMemo(() => makePost(W, H, POST_FS, { uCA: { value: 0.003 } }), []);
  useMemo(() => {
    // Khronos PBR Neutral keeps the amber « 45 » amber (ACES pushed it to salmon)
    gl.toneMapping = THREE.NeutralToneMapping;
    scene.environment = w.envTex;
    scene.background = null;
  }, [scene, w]);

  /* ── choreography (all from the global frame) ── */
  const t = g / 60;
  for (const s of w.shards) {
    const a0 = T3.flightFrom + s.inDelay;
    const a1 = T3.lock + s.lockDelay;
    const ui = clamp01((g - a0) / (a1 - a0));
    const p = Math.pow(1 - ui, 2.4);
    const pz = Math.pow(1 - ui, 1.7);
    const pr = Math.pow(1 - ui, 2.0);
    const uo = clamp01((g - T3.flyOut - s.outDelay) / (T3.end - T3.flyOut - s.outDelay));
    const q = Math.pow(uo, 2.4);
    const qz = Math.pow(uo, 1.9);
    let x = s.cx + s.inOff[0] * p;
    let y = s.cy + s.inOff[1] * p;
    let z = s.inOff[2] * pz;
    let rx = s.baseRot[0] + s.inSpin[0] * pr;
    let ry = s.baseRot[1] + s.inSpin[1] * pr;
    let rz = s.baseRot[2] + s.inSpin[2] * pr;
    const seated = ui >= 1 ? Math.max(0, 1 - q * 3) : 0;
    if (seated > 0) {
      rx += 0.025 * Math.sin(t * s.wf + s.wob) * seated;
      ry += 0.04 * Math.sin(t * s.wf * 0.83 + s.wob * 2.1) * seated;
      rz += 0.01 * Math.sin(t * s.wf * 1.31 + s.wob * 0.7) * seated;
      z += 0.016 * Math.sin(t * 0.9 + s.wob) * seated;
      // the lock: every pane jolts back and rings
      const ring = decay(g - (T3.lock + s.lockDelay), 5);
      z -= 0.08 * ring * (0.6 + 0.4 * Math.sin(s.wob * 3));
      rx += 0.05 * ring * Math.sin(s.wob * 5.1);
      ry += 0.05 * ring * Math.cos(s.wob * 3.7);
      // its word ignites: the panes carrying it knock back a hair
      const wf = s.word === "devops" ? T3.devops : s.word === "en" ? T3.en : s.word === "n45" ? T3.n45 : T3.secondes;
      const kick = decay(g - wf, 6) * (s.word === "n45" ? 1.4 : 1);
      z -= 0.035 * kick;
      ry += 0.025 * kick * Math.sin(s.wob * 2.3);
      // sweep #2 and the beat keep the hold alive
      if (!cover) z -= 0.012 * beatPulse(g, 10);
    }
    if (uo > 0) {
      x += s.outOff[0] * q;
      y += s.outOff[1] * q;
      z += s.outOff[2] * qz;
      rx += s.outSpin[0] * q;
      ry += s.outSpin[1] * q;
      rz += s.outSpin[2] * q;
    }
    s.grp.position.set(x, y, z);
    s.grp.rotation.set(rx, ry, rz);
    s.grp.visible = z + PANE_Z < CAM_Z - 0.2;
  }

  /* ignition levels per word (etched 0.2 from the lock) */
  w.U.uBase.value = g < T3.drop ? 0 : 0.085 + 0.2 * decay(g - T3.lock, 6);
  w.U.uLv.value.set(ignite(g, T3.devops), ignite(g, T3.en, 1.0, 1.1), ignite(g, T3.n45, 0.78, 2.2), ignite(g, T3.secondes));
  // the ring timer closes around the 45 (cyan) in 22 frames, snap ease, its head runs hot
  const RD = T3.ringDur;
  const ru = clamp01((g - T3.n45) / RD);
  w.U.uRingP.value = g < T3.n45 ? 0 : (1 - Math.pow(1 - ru, 3)) * 1.002;
  w.U.uRingLv.value = g < T3.n45 ? 0 : 0.95 + 0.9 * decay(g - (T3.n45 + RD), 7);
  w.U.uRingHead.value = g < T3.n45 ? 0 : 1.6 * (1 - smooth((g - T3.n45 - RD + 4) / 6));

  w.pane.rotation.x = 0.018 * Math.sin(t * 0.5 + 0.7);
  w.pane.rotation.y = 0.04 * Math.sin(t * 0.33 + 2.1) - 0.02;
  // light sweeps: the cyan soft-box is dragged across the faces (outside ±0.42 rad it misses them)
  const s1 = smooth((g - (T3.n45 - 2)) / 18);
  const s2 = smooth((g - T3.sweep2) / 22);
  const sweep = cover ? 0.42 : g < T3.sweep2 ? -0.42 + 0.84 * s1 : -0.42 + 0.84 * s2;
  (scene as unknown as { environmentRotation: THREE.Euler }).environmentRotation.set(0.04 * Math.sin(t * 0.7), sweep, 0);

  // dust: drifts; the lock shockwave pushes it outward
  const push = g >= T3.lock ? 1 - Math.exp(-(g - T3.lock) / 9) : 0;
  for (let i = 0; i < w.DN; i++) {
    const [x0, y0, z0, r] = w.dseed[i];
    const k = 1 + push * (0.3 + r * 0.45);
    w.dpos[i * 3] = x0 * k + Math.sin(t * 0.4 + r * 9) * 0.05;
    w.dpos[i * 3 + 1] = y0 * k + Math.cos(t * 0.3 + r * 7) * 0.05 + t * 0.02;
    w.dpos[i * 3 + 2] = z0 + push * 0.7 * r;
  }
  (w.dust.attributes.position as THREE.BufferAttribute).needsUpdate = true;

  // camera: recoil on the drop, slow push through the hold, micro-shake on the lock
  const cam = camera as THREE.PerspectiveCamera;
  cam.fov = FOV;
  cam.near = 0.1;
  cam.far = 80;
  cam.position.set(shakeX, shakeY, CAM_Z - camPush(g, T3, cover));
  cam.rotation.set(0, 0, shakeX * 0.5);
  cam.updateProjectionMatrix();
  cam.projectionMatrix.elements[9] = -shiftNdc(cy);
  cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();

  const st = useRef({ ca: 0.003 });
  st.current.ca = 0.0025 + 0.016 * decay(g - T3.drop, 4) + 0.012 * decay(g - T3.n45, 6) + 0.01 * smooth((g - T3.flyOut) / 14);
  useFrame(() => {
    post.mat.uniforms.uCA.value = st.current.ca;
    post.render(gl, scene, camera, INK);
  }, 1);

  return <primitive object={w.root} />;
};

export const GlassTitle: React.FC<{ g: number; T3: IdentT; shakeX?: number; shakeY?: number; cover?: boolean; cy?: number }> = ({ g, T3, shakeX = 0, shakeY = 0, cover = false, cy = TITLE_CY }) => (
  <ThreeCanvas
    width={W}
    height={H}
    gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    camera={{ fov: FOV, near: 0.1, far: 80, position: [0, 0, CAM_Z] }}
    style={{ position: "absolute", inset: 0 }}
  >
    <Content g={g} T3={T3} shakeX={shakeX} shakeY={shakeY} cover={cover} cy={cy} />
  </ThreeCanvas>
);
