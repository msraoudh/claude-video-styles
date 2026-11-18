import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import { drawText, textAdvance } from "./glyphs";
import { makePost } from "./post";
import { newScene } from "./three-shim";
import { T } from "./timing";
import { clamp01, smooth } from "./fx";

/**
 * « NO MORE EXCUSES » — a frame-driven Remotion / R3F port of the glass-shard-title block, re-laid for 9:16:
 * the headline is rasterised (Inter ExtraBold outlines, no web-font wait), its footprint becomes a jagged blob
 * that is broken into seeded Voronoi glass panes (Sutherland–Hodgman clip of the blob against each cell),
 * every pane is an extruded, bevelled, rounded piece of iridescent transmissive glass carrying its slice of the
 * headline on its FRONT cap only (emissive map masked by the object-space normal), with per-fragment fog.
 * The panes fly in from the fogged depth during the black frames and LOCK on the 808 (3107) where the text
 * ignites; hold with a slow push + light sweep; blast toward the lens into the next shot.
 */

const W = 1080;
const H = 1920;
const FOV = 42;
const CAM_Z = 5.2;
const PANE_Z = 0.6;
const DIST = CAM_Z - PANE_Z;
const VH = 2 * DIST * Math.tan((FOV * Math.PI) / 360);
const VW = VH * (W / H);
const INK = new THREE.Color("#03060d");

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
/** rounded-corner extruded pane (port of buildPieceGeometry, per-corner clamped radius) */
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

type Shard = {
  grp: THREE.Group;
  cx: number;
  cy: number;
  inOff: [number, number, number];
  inSpin: [number, number, number];
  outOff: [number, number, number];
  outSpin: [number, number, number];
  baseRot: [number, number, number];
  wob: number;
  wf: number;
  inDelay: number;
  outDelay: number;
};

const LINES = ["NO MORE", "EXCUSES"];

const buildWorld = (gl: THREE.WebGLRenderer) => {
  const root = new THREE.Group();

  /* headline raster spanning the frustum at the pane plane */
  const TEXW = 1440;
  const TEXH = 2560;
  const can = document.createElement("canvas");
  can.width = TEXW;
  can.height = TEXH;
  const ctx = can.getContext("2d")!;
  const TR = -0.03;
  let fpx = 300;
  const w0 = Math.max(...LINES.map((l) => textAdvance(l, fpx, TR)));
  fpx = Math.floor((fpx * TEXW * 0.84) / w0);
  const capPx = 0.727 * fpx;
  const gapPx = 0.24 * fpx;
  const blockH = capPx * 2 + gapPx;
  const top = TEXH / 2 - blockH / 2;
  ctx.clearRect(0, 0, TEXW, TEXH);
  ctx.fillStyle = "#f6f8fc";
  ctx.shadowColor = "rgba(190,225,255,0.28)";
  ctx.shadowBlur = 10;
  LINES.forEach((l, i) => {
    const lw = textAdvance(l, fpx, TR);
    drawText(ctx, l, TEXW / 2 - lw / 2, top + capPx + i * (capPx + gapPx), fpx, TR);
  });
  ctx.shadowBlur = 0;
  LINES.forEach((l, i) => {
    const lw = textAdvance(l, fpx, TR);
    drawText(ctx, l, TEXW / 2 - lw / 2, top + capPx + i * (capPx + gapPx), fpx, TR);
  });
  const headTex = new THREE.CanvasTexture(can);
  headTex.colorSpace = THREE.SRGBColorSpace;
  headTex.anisotropy = 8;

  /* blob silhouette around the text block (seeded harmonics, rect floor, frustum cap) */
  const bandW = ((Math.max(...LINES.map((l) => textAdvance(l, fpx, TR))) + fpx * 0.14) / TEXW) * VW;
  const bandH = ((blockH + fpx * 0.3) / TEXH) * VH;
  const HW = bandW / 2;
  const HH = bandH / 2;
  const PAD = 0.1;
  const A0 = HW + PAD;
  const B0 = HH + PAD * 1.6;
  const rb = mulberry32(11 * 511 + 3);
  const HARM: Array<{ k: number; amp: number; ph: number }> = [];
  for (let k = 2; k <= 9; k++) HARM.push({ k, amp: (rb() * 2 - 1) / Math.sqrt(k), ph: rb() * Math.PI * 2 });
  const blobR = (th: number) => {
    let n = 0;
    for (const h of HARM) n += h.amp * Math.sin(h.k * th + h.ph);
    let r = ((A0 * B0) / Math.hypot(B0 * Math.cos(th), A0 * Math.sin(th))) * (1 + 0.25 * 2.4 * n * 0.5);
    const c = Math.abs(Math.cos(th));
    const s = Math.abs(Math.sin(th));
    const rect = Math.min(c > 1e-6 ? (HW + PAD * 0.25) / c : 1e9, s > 1e-6 ? (HH + PAD * 0.4) / s : 1e9);
    r = Math.max(r, rect);
    const lim = Math.min(c > 1e-6 ? (VW * 0.475) / c : 1e9, s > 1e-6 ? (VH * 0.3) / s : 1e9);
    return Math.min(r, lim);
  };
  const re = mulberry32(11 * 733 + 9);
  const blob: P2[] = [];
  const BV = 26;
  for (let j = 0; j < BV; j++) {
    const th = ((j + (re() - 0.5) * 0.72) / BV) * Math.PI * 2;
    const r = blobR(th) * (1 + (re() - 0.5) * 0.08);
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

  /* seeded sites (size variance 0.35: some clustering) + 2 Lloyd passes */
  const rnd = mulberry32(11);
  const rv = mulberry32(11 * 977 + 5);
  const centres: P2[] = [];
  for (let g = 0; centres.length < 4 && g < 400; g++) {
    const x = (rv() * 2 - 1) * maxRX;
    const y = (rv() * 2 - 1) * maxRY;
    if (inBlob(x, y)) centres.push([x, y]);
  }
  const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-9, rnd()))) * Math.cos(2 * Math.PI * rnd());
  const N = 40;
  let sites: P2[] = [];
  const sigma = Math.max(maxRX, maxRY) * 0.14;
  for (let g = 0; sites.length < N && g < N * 200; g++) {
    let x: number;
    let y: number;
    if (rnd() < 0.85 * 0.35) {
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

  /* materials: iridescent transmissive glass with the headline on the front cap + per-fragment fog */
  const iri = document.createElement("canvas");
  iri.width = iri.height = 256;
  {
    const c = iri.getContext("2d")!;
    const gr = c.createLinearGradient(0, 0, 256, 256);
    gr.addColorStop(0, "#202020");
    gr.addColorStop(0.5, "#a0a0a0");
    gr.addColorStop(1, "#f0f0f0");
    c.fillStyle = gr;
    c.fillRect(0, 0, 256, 256);
    const rg = c.createRadialGradient(77, 102, 0, 77, 102, 230);
    rg.addColorStop(0, "rgba(255,255,255,0.4)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = rg;
    c.fillRect(0, 0, 256, 256);
  }
  const iriTex = new THREE.CanvasTexture(iri);
  const FOG_START = DIST + 0.28;
  const FOG_RHO = 4.6 / 36;
  const glass = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#d6e4ff"),
    transmission: 1,
    thickness: 0.5,
    ior: 1.45,
    dispersion: 0.24,
    roughness: 0.16,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.45,
    specularIntensity: 1,
    attenuationDistance: 0.55,
    attenuationColor: new THREE.Color("#33507f"),
    envMapIntensity: 0.75,
    iridescence: 0.7,
    iridescenceIOR: 2.34,
    iridescenceThicknessRange: [80, 500],
    iridescenceThicknessMap: iriTex,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: headTex,
    emissiveIntensity: 0,
  });
  glass.onBeforeCompile = (sh) => {
    sh.uniforms.uFogStart = { value: FOG_START };
    sh.uniforms.uFogRho = { value: FOG_RHO };
    sh.uniforms.uFogColor = { value: INK.clone() };
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vNzObj;\nvarying float vDep;")
      .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nvNzObj = normal.z;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvDep = -mvPosition.z;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vNzObj;\nvarying float vDep;\nuniform float uFogStart;\nuniform float uFogRho;\nuniform vec3 uFogColor;")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance *= smoothstep(0.5, 0.78, vNzObj);")
      .replace(
        "#include <dithering_fragment>",
        "gl_FragColor.rgb = mix(gl_FragColor.rgb, uFogColor, 1.0 - exp(-pow(max(0.0, vDep - uFogStart) * uFogRho, 2.0)));\n#include <dithering_fragment>",
      );
  };

  /* panes */
  const GAP = 0.011;
  const RADIUS = 0.032;
  const DEPTH = 0.075;
  const pane = new THREE.Group();
  pane.position.z = PANE_Z;
  root.add(pane);
  const rf = mulberry32(11 * 31337 + 7);
  const rt = mulberry32(11 * 9973 + 1);
  const shards: Shard[] = [];
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
    const sign = cx >= 0 ? 1 : -1;
    const ROT = 5;
    shards.push({
      grp,
      cx,
      cy,
      inOff: [sign * 1.6 * (0.7 + rf() * 0.6), (rf() - 0.5) * 2.2, -42 * (0.85 + rf() * 0.3)],
      inSpin: [(rf() - 0.5) * Math.PI * 1.0 * ROT * 0.4, (rf() - 0.5) * Math.PI * 1.3 * ROT * 0.4, (rf() - 0.5) * Math.PI * 0.5 * ROT * 0.4],
      outOff: [sign * 1.8 * (0.8 + rf() * 0.7), (rf() - 0.5) * 2.6, 9 * (0.85 + rf() * 0.3)],
      outSpin: [(rf() - 0.5) * Math.PI * 1.6 * 2, (rf() - 0.5) * Math.PI * 2.0 * 2, (rf() - 0.5) * Math.PI * 0.8 * 2],
      baseRot: [(rt() - 0.5) * 0.06, (rt() - 0.5) * 0.06, (rt() - 0.5) * 0.02],
      wob: rt() * Math.PI * 2,
      wf: 0.45 + rt() * 0.5,
      inDelay: 0,
      outDelay: 0,
    });
  });
  // centre knits first (in), edges peel first (out)
  const n1 = Math.max(1, shards.length - 1);
  [...shards].sort((a, b) => Math.abs(a.cx) - Math.abs(b.cx)).forEach((s, r) => (s.inDelay = (r / n1) * 5));
  [...shards].sort((a, b) => Math.abs(b.cx) + Math.abs(b.cy) - (Math.abs(a.cx) + Math.abs(a.cy))).forEach((s, r) => (s.outDelay = (r / n1) * 5));

  /* back plate: flat ink with a faint cold glow (painted first, writes no depth) */
  const bg = document.createElement("canvas");
  bg.width = 270;
  bg.height = 480;
  {
    const c = bg.getContext("2d")!;
    c.fillStyle = "#03060d";
    c.fillRect(0, 0, 270, 480);
    const rg = c.createRadialGradient(135, 240, 0, 135, 240, 260);
    rg.addColorStop(0, "rgba(60,90,140,0.30)");
    rg.addColorStop(0.45, "rgba(20,32,60,0.16)");
    rg.addColorStop(1, "rgba(3,6,13,0)");
    c.fillStyle = rg;
    c.fillRect(0, 0, 270, 480);
  }
  const bgTex = new THREE.CanvasTexture(bg);
  bgTex.colorSpace = THREE.SRGBColorSpace;
  const dB = CAM_Z + 3.5;
  const bh = 2 * dB * Math.tan((FOV * Math.PI) / 360);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(bh * (W / H) * 1.15, bh * 1.15), new THREE.MeshBasicMaterial({ map: bgTex, depthWrite: false, depthTest: false, toneMapped: false }));
  back.position.z = -3.5;
  back.renderOrder = -1;
  root.add(back);

  /* lights */
  root.add(new THREE.AmbientLight(0xffffff, 0.6));
  const spot = new THREE.SpotLight(0xffffff, 7, 0, Math.PI / 4, 0.5, 1);
  spot.position.set(0, 7.1, 2);
  root.add(spot);
  root.add(spot.target);
  const point = new THREE.PointLight(0xccddff, 4, 0, 1);
  point.position.set(0, -3, 1);
  root.add(point);

  /* dust motes in the fog */
  const DN = 160;
  const dust = new THREE.BufferGeometry();
  const dpos = new Float32Array(DN * 3);
  dust.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
  const dustMat = new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, color: new THREE.Color(0.55, 0.65, 0.8), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const dustPts = new THREE.Points(dust, dustMat);
  dustPts.frustumCulled = false;
  root.add(dustPts);
  const rd = mulberry32(4242);
  const dseed = Array.from({ length: DN }, () => [(rd() - 0.5) * 3.2, (rd() - 0.5) * 5.4, -6 + rd() * 9.5, rd()] as [number, number, number, number]);

  /* studio environment: dark room + soft-box strips (no HDR file needed) */
  const env = newScene();
  env.add(new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshBasicMaterial({ color: 0x07090d, side: THREE.BackSide })));
  const strip = (w: number, h: number, p: [number, number, number], ry: number, rx: number, k: number, tint = [1, 1, 1]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k * tint[0], k * tint[1], k * tint[2]), side: THREE.DoubleSide }));
    m.position.set(...p);
    m.rotation.set(rx, ry, 0);
    env.add(m);
  };
  strip(1.2, 16, [-7, 0, 1], Math.PI / 2, 0, 4.5, [0.85, 0.92, 1]);
  strip(1.2, 16, [7, 0, 1], -Math.PI / 2, 0, 4.5, [1, 0.95, 0.92]);
  strip(16, 0.8, [0, 8, 0], 0, Math.PI / 2, 3);
  // the sweep: one narrow soft-box behind the camera, off-axis — the environment rotation drags it across the faces
  strip(0.42, 10, [0, 0.4, 8], Math.PI, 0, 7, [0.9, 0.96, 1]);
  strip(0.6, 12, [3.5, 0, -9], 0, 0, 3, [0.7, 0.85, 1]);
  const pm = new THREE.PMREMGenerator(gl);
  const envTex = pm.fromScene(env, 0.02).texture;
  pm.dispose();

  return { root, shards, glass, envTex, dust, dpos, dseed, DN, pane };
};

const POST_FS = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform float uCA;
  uniform float uGlitch;
  uniform float uSeed;
  varying vec2 vUv;
  float rnd(float s) { return fract(543.2543 * sin(dot(vec2(s, s), vec2(3525.46, -54.3415)))); }
  void main() {
    vec2 uv = vUv;
    float band = floor(uv.y * 30.0);
    float on = step(0.6, rnd(band * 1.37 + uSeed * 7.1));
    uv.x += (rnd(band * 3.11 + uSeed) - 0.5) * uGlitch * 0.12 * on;
    // radial chromatic aberration: grows toward the edges of the frame (lens), plus the hit kick
    vec2 d = (uv - 0.5);
    vec2 off = d * uCA;
    vec4 c = texture2D(tDiffuse, uv);
    c.r = texture2D(tDiffuse, uv + off).r;
    c.b = texture2D(tDiffuse, uv - off).b;
    gl_FragColor = vec4(c.rgb, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const Content: React.FC<{ g: number; shakeX: number; shakeY: number }> = ({ g, shakeX, shakeY }) => {
  const { gl, scene, camera } = useThree();
  const w = useMemo(() => buildWorld(gl), [gl]);
  const post = useMemo(() => makePost(W, H, POST_FS, { uCA: { value: 0.004 }, uGlitch: { value: 0 }, uSeed: { value: 0 } }), []);
  useMemo(() => {
    scene.environment = w.envTex;
    scene.background = null;
  }, [scene, w]);

  /* ── choreography (all from the global frame) ── */
  const IN0 = T.drop - 19; // flight starts behind the black (the canvas mounts at 3099)
  const hit = g - T.drop; // frames since the 808
  const t = g / 60;
  for (const s of w.shards) {
    const dur = T.drop - IN0 - s.inDelay;
    const ui = clamp01((g - IN0 - s.inDelay) / dur);
    const p = Math.pow(1 - ui, 3); // xy remaining
    const pz = Math.pow(1 - ui, 1.25); // depth travels nearly linearly → visible traversal of the fog, hard lock
    const pr = Math.pow(1 - ui, 1.3);
    const uo = clamp01((g - T.flyOut - s.outDelay) / (T.fCut - T.flyOut - s.outDelay));
    const q = uo * uo;
    const qz = Math.pow(uo, 1.35);
    let x = s.cx + s.inOff[0] * p;
    let y = s.cy + s.inOff[1] * p;
    let z = s.inOff[2] * pz;
    let rx = s.baseRot[0] + s.inSpin[0] * pr;
    let ry = s.baseRot[1] + s.inSpin[1] * pr;
    let rz = s.baseRot[2] + s.inSpin[2] * pr;
    const seated = (ui >= 1 ? 1 : 0) * Math.max(0, 1 - q * 3);
    if (seated > 0) {
      rx += 0.03 * Math.sin(t * s.wf + s.wob) * seated;
      ry += 0.045 * Math.sin(t * s.wf * 0.83 + s.wob * 2.1) * seated;
      rz += 0.012 * Math.sin(t * s.wf * 1.31 + s.wob * 0.7) * seated;
      z += 0.018 * Math.sin(t * 0.9 + s.wob) * seated;
      // the 808 recoil: every pane jolts back and rings
      const ring = hit >= 0 ? Math.exp(-hit / 5) : 0;
      z -= 0.09 * ring * (0.6 + 0.4 * Math.sin(s.wob * 3));
      rx += 0.06 * ring * Math.sin(s.wob * 5.1);
      ry += 0.06 * ring * Math.cos(s.wob * 3.7);
      // second hit in the hold (3156): a smaller ring
      const h2 = g - T.pulse;
      const ring2 = h2 >= 0 ? Math.exp(-h2 / 6) : 0;
      z -= 0.04 * ring2;
      ry += 0.03 * ring2 * Math.sin(s.wob * 2.3);
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
    s.grp.visible = z + PANE_Z < CAM_Z - 0.15;
  }
  // the text ignites on the 808: dark glass before, white-hot spike, settle
  w.glass.emissiveIntensity = hit < 0 ? 0 : 1.05 + 1.2 * Math.exp(-hit / 5) + 0.35 * Math.exp(-Math.max(0, g - T.pulse) / 8) * (g >= T.pulse ? 1 : 0);
  w.pane.rotation.x = 0.02 * Math.sin(t * 0.5 + 0.7);
  w.pane.rotation.y = 0.045 * Math.sin(t * 0.33 + 2.1) + 0.05 * smooth((g - T.drop) / 70) - 0.025;
  // light sweep: environment rotates slowly; a fast pass after each hit
  // two deterministic passes of the on-axis sweep strip (outside ±0.3 rad it is out of the faces' reflection cone)
  const pass1 = smooth((g - (T.drop + 6)) / 34);
  const pass2 = smooth((g - T.pulse) / 16);
  const sweep = g < T.pulse ? -0.42 + 0.84 * pass1 : -0.42 + 0.84 * pass2;
  scene.environmentRotation.set(0.04 * Math.sin(t * 0.7), sweep, 0);

  // dust: drifts; the shockwave pushes it outward
  const push = hit >= 0 ? 1 - Math.exp(-hit / 9) : 0;
  for (let i = 0; i < w.DN; i++) {
    const [x0, y0, z0, r] = w.dseed[i];
    const k = 1 + push * (0.35 + r * 0.5);
    w.dpos[i * 3] = x0 * k + Math.sin(t * 0.4 + r * 9) * 0.05;
    w.dpos[i * 3 + 1] = y0 * k + Math.cos(t * 0.3 + r * 7) * 0.05 + t * 0.02;
    w.dpos[i * 3 + 2] = z0 + push * 0.8 * r;
  }
  (w.dust.attributes.position as THREE.BufferAttribute).needsUpdate = true;

  // camera: slow push through the hold + 808 shake
  const cam = camera as THREE.PerspectiveCamera;
  cam.fov = FOV;
  cam.near = 0.1;
  cam.far = 80;
  const pushZ = 0.55 * smooth((g - T.drop - 4) / 75);
  const recoil = hit >= 0 ? 0.24 * Math.exp(-hit / 4) : 0; // the camera is blown back by the impact
  cam.position.set(shakeX, shakeY, CAM_Z - pushZ + recoil);
  cam.rotation.set(0, 0, shakeX * 0.6);
  cam.updateProjectionMatrix();

  const st = useRef({ ca: 0.004, glitch: 0, seed: 0 });
  const kick = hit >= 0 ? Math.exp(-hit / 6) : 0;
  st.current.ca = 0.003 + 0.04 * kick + 0.012 * (g >= T.pulse ? Math.exp(-(g - T.pulse) / 6) : 0) + 0.02 * smooth((g - T.flyOut) / 10);
  st.current.glitch = 0.8 * (hit >= 0 && hit < 3 ? 1 - hit / 3 : 0) + 0.5 * smooth((g - T.flyOut - 4) / 6);
  st.current.seed = Math.floor(g / 2);
  useFrame(() => {
    post.mat.uniforms.uCA.value = st.current.ca;
    post.mat.uniforms.uGlitch.value = st.current.glitch;
    post.mat.uniforms.uSeed.value = st.current.seed;
    post.render(gl, scene, camera, INK);
  }, 1);

  return <primitive object={w.root} />;
};

export const GlassTitle: React.FC<{ g: number; shakeX?: number; shakeY?: number }> = ({ g, shakeX = 0, shakeY = 0 }) => (
  <ThreeCanvas
    width={W}
    height={H}
    gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    camera={{ fov: FOV, near: 0.1, far: 80, position: [0, 0, CAM_Z] }}
    style={{ position: "absolute", inset: 0 }}
  >
    <Content g={g} shakeX={shakeX} shakeY={shakeY} />
  </ThreeCanvas>
);

/** where the title sits on screen (px) — for DOM flares / shockwaves */
export const TITLE_CENTER = { x: W / 2, y: H / 2 };
export const TITLE_PX_PER_UNIT = H / VH;
