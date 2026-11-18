import React from "react";
import { Easing, interpolate, random, spring, useCurrentFrame } from "remotion";
import { DURATION, at, line as lineOf } from "../lib/time";
import { BIG_FONT } from "../theme";

/**
 * THE STORYBOARD CARD (Showcase), drawn like the frazix reference: a light dotted paper card with black-ink sketches
 * that DRAW THEMSELVES with a visible marker while the user talks. Nothing else: no captions, no script, no timecode, no UI.
 * - a page per beat (one or a few lines); the old page flips up over the top like a sketchpad, then the pen draws the new one
 * - each page = stroke groups pinned to his words (one group per phrase); the pen travels along every stroke,
 *   lifts between strokes, leaves the card (under the video card) when it has nothing to draw
 * - ink #151515, red #E30A17 for the key element, the big word behind the head in Anton (the only lettering)
 * Only the left ~344 px of the card are visible (the video card covers the rest): everything is drawn in x 18–326.
 */
export const SB = { x: 28, y: 500, w: 420, h: 760 };

const INK = "#151515";
const RED = "#E30A17";
const PAPER = "#F4F1EA";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* =====================================================================================
 * 1. geometry: every stroke is a polyline we sample ourselves (no DOM measuring during render)
 * ===================================================================================== */
type P = [number, number];
type Txt = { s: string; x0: number; base: number; size: number; W: number; behind?: [number, number, number] };
type Stroke = { pts: P[]; red?: boolean; w?: number; txt?: Txt };

const dist = (a: P, b: P) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const bez = (a: P, b: P, c: P, d: P, n = 26): P[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, u = 1 - t;
    return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]] as P;
  });
const qbez = (a: P, c: P, b: P, n = 20): P[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]] as P;
  });
/** arc in degrees (0 = right, 90 = down) */
const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): P[] => {
  const n = Math.max(8, Math.ceil((Math.abs(a1 - a0) / 360) * 48));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as P;
  });
};
const join = (...parts: P[][]): P[] => parts.flat();

const resample = (pts: P[], step = 3.5): P[] => {
  const out: P[] = [pts[0]];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    if (seg === 0) continue;
    let d = step - carry;
    while (d <= seg) {
      const t = d / seg;
      out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
      d += step;
    }
    carry = seg - (d - step);
  }
  const last = pts[pts.length - 1];
  if (dist(out[out.length - 1], last) > 0.4) out.push(last);
  return out;
};

/** the hand: slow low-amplitude wobble across the stroke + a tiny tremor, seeded per stroke */
let SEED = 0;
const wobble = (pts: P[], amp = 1.25): P[] => {
  const k = SEED++;
  const r = (n: number) => random(`sb-${k}-${n}`);
  const rs = resample(pts);
  const f1 = 26 + r(1) * 18, f2 = 8 + r(2) * 5, p1 = r(3) * 6.28, p2 = r(4) * 6.28;
  const jx = (r(5) - 0.5) * 2, jy = (r(6) - 0.5) * 2;
  let s = 0;
  return rs.map((p, i) => {
    if (i > 0) s += dist(rs[i - 1], p);
    const a = rs[Math.max(0, i - 1)], b = rs[Math.min(rs.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const off = amp * (Math.sin(s / f1 + p1) * 0.85 + Math.sin(s / f2 + p2) * 0.3);
    return [p[0] - (dy / l) * off + jx, p[1] + (dx / l) * off + jy] as P;
  });
};

const ink = (pts: P[], o: { red?: boolean; w?: number; amp?: number } = {}): Stroke => ({ pts: wobble(pts, o.amp ?? 1.25), red: o.red, w: o.w });
const red = (pts: P[], w?: number): Stroke => ink(pts, { red: true, w });

/* ---------- primitives ---------- */
const ell = (cx: number, cy: number, rx: number, ry: number, start = -120, over = 22): P[] => {
  const ph = random(`ell${cx}${cy}${rx}`) * 6;
  return arc(cx, cy, rx, ry, start, start + 360 + over).map(([x, y], i, all) => {
    const t = i / all.length;
    const k = 1 + 0.025 * Math.sin(t * 9 + ph) + (t > 0.94 ? 0.04 : 0);
    return [cx + (x - cx) * k, cy + (y - cy) * k] as P;
  });
};
const circle = (cx: number, cy: number, r: number, o: { red?: boolean; w?: number; start?: number } = {}) => ink(ell(cx, cy, r, r, o.start ?? -120), o);
const ln = (a: P, b: P, o: { red?: boolean; w?: number } = {}) => ink([a, b], o);
const dot = (x: number, y: number, isRed = false) => ink(ell(x, y, 2.4, 2.4, 0, 30), { red: isRed, w: 5, amp: 0 });
const rrect = (x: number, y: number, w: number, h: number, r = 9): P[] =>
  join(
    [[x + r, y], [x + w - r, y]], arc(x + w - r, y + r, r, r, -90, 0),
    [[x + w, y + h - r]], arc(x + w - r, y + h - r, r, r, 0, 90),
    [[x + r, y + h]], arc(x + r, y + h - r, r, r, 90, 180),
    [[x, y + r]], arc(x + r, y + r, r, r, 180, 270), [[x + r + 8, y - 0.6]],
  );
const box = (x: number, y: number, w: number, h: number, o: { red?: boolean; r?: number; w?: number } = {}) => ink(rrect(x, y, w, h, o.r ?? 9), o);
const arrow = (a: P, b: P, bend = 0, o: { red?: boolean; head?: number } = {}): Stroke[] => {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, l = dist(a, b) || 1;
  const c: P = [mx - ((b[1] - a[1]) / l) * bend, my + ((b[0] - a[0]) / l) * bend];
  const shaft = qbez(a, c, b, 24);
  const q = shaft[shaft.length - 4];
  const ang = Math.atan2(b[1] - q[1], b[0] - q[0]);
  const h = o.head ?? 15, sp = 0.5;
  const wa: P = [b[0] - h * Math.cos(ang - sp), b[1] - h * Math.sin(ang - sp)];
  const wb: P = [b[0] - h * Math.cos(ang + sp), b[1] - h * Math.sin(ang + sp)];
  return [ink(shaft, o), ink([wa, b, wb], o)];
};
const sparkle = (cx: number, cy: number, s: number, isRed = false): Stroke => {
  const pts: P[] = [];
  for (let k = 0; k < 4; k++) {
    const a0 = ((k * 90 - 90) * Math.PI) / 180, a1 = (((k + 1) * 90 - 90) * Math.PI) / 180;
    const o0: P = [cx + s * Math.cos(a0), cy + s * Math.sin(a0)];
    const o1: P = [cx + s * Math.cos(a1), cy + s * Math.sin(a1)];
    const mid = (a0 + a1) / 2;
    const c: P = [cx + s * 0.14 * Math.cos(mid), cy + s * 0.14 * Math.sin(mid)];
    pts.push(...qbez(o0, c, o1, 10));
  }
  return ink(pts, { red: isRed, amp: 0.5 });
};
const star5 = (cx: number, cy: number, r: number, isRed = false): Stroke => {
  const pts: P[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = ((-90 + i * 36) * Math.PI) / 180, rr = i % 2 ? r * 0.45 : r;
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  return ink(pts, { red: isRed, amp: 0.6 });
};
const check = (x: number, y: number, s: number, isRed = true): Stroke => ink([[x, y + s * 0.5], [x + s * 0.36, y + s * 0.88], [x + s, y - s * 0.05]], { red: isRed, w: 5.5 });
const cross = (cx: number, cy: number, s: number, isRed = true): Stroke[] => [
  ln([cx - s, cy - s], [cx + s, cy + s], { red: isRed, w: 5.5 }),
  ln([cx + s, cy - s], [cx - s, cy + s], { red: isRed, w: 5.5 }),
];

/* ---------- the subject ---------- */
const HX = 172, HY = 330;
const fig = (cx = HX, cy = HY, s = 1): Stroke[] => [
  ink(ell(cx, cy, 52 * s, 55 * s, -115)),
  ink(bez([cx - 30 * s, cy + 70 * s], [cx - 76 * s, cy + 80 * s], [cx - 100 * s, cy + 150 * s], [cx - 103 * s, cy + 250 * s])),
  ink(bez([cx + 30 * s, cy + 70 * s], [cx + 76 * s, cy + 80 * s], [cx + 100 * s, cy + 150 * s], [cx + 103 * s, cy + 250 * s])),
];
/** small person (crowds, cards) */
const mini = (cx: number, cy: number, s = 1, isRed = false): Stroke[] => [
  ink(ell(cx, cy, 11 * s, 11.5 * s, -110), { red: isRed, amp: 0.6 }),
  ink(join(bez([cx - 21 * s, cy + 40 * s], [cx - 21 * s, cy + 20 * s], [cx - 10 * s, cy + 16 * s], [cx, cy + 16 * s], 12), bez([cx, cy + 16 * s], [cx + 10 * s, cy + 16 * s], [cx + 21 * s, cy + 20 * s], [cx + 21 * s, cy + 40 * s], 12)), { red: isRed, amp: 0.6 }),
];
const brackets = (cx: number, cy: number, r: number, l = 24): Stroke[] =>
  ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as const).map(([sx, sy]) =>
    red([[cx + sx * r, cy + sy * (r - l)], [cx + sx * r, cy + sy * r], [cx + sx * (r - l), cy + sy * r]], 5),
  );
/** the Claude mark: rays out and back from the centre, in one go like a hand would */
const claude = (cx: number, cy: number, r: number): Stroke[] => {
  const pts: P[] = [];
  for (let i = 0; i < 11; i++) {
    const a = ((i * 360) / 11 - 90 + (random(`cl${i}`) - 0.5) * 10) * (Math.PI / 180);
    const r1 = r * (0.82 + random(`cl2${i}`) * 0.18);
    pts.push([cx + r * 0.12 * Math.cos(a), cy + r * 0.12 * Math.sin(a)], [cx + r1 * Math.cos(a), cy + r1 * Math.sin(a)], [cx + r * 0.12 * Math.cos(a + 0.3), cy + r * 0.12 * Math.sin(a + 0.3)]);
  }
  return [ink(pts, { red: true, w: 5, amp: 0.5 })];
};

/* ---------- single-stroke glyphs (x,y = top-left, h = height) ---------- */
const glyph = (ch: string, x: number, y: number, h: number, isRed = false): Stroke[] => {
  const m = (u: number, v: number): P => [x + u * h, y + v * h];
  const o = { red: isRed, w: 5 };
  const g: Record<string, () => Stroke[]> = {
    "0": () => [ink(ell(x + 0.3 * h, y + 0.5 * h, 0.27 * h, 0.5 * h, -100), o)],
    "1": () => [ink([m(0.1, 0.24), m(0.34, 0), m(0.34, 1)], o)],
    "2": () => [ink(join(bez(m(0.04, 0.26), m(0.06, -0.06), m(0.6, -0.08), m(0.54, 0.3)), bez(m(0.54, 0.3), m(0.5, 0.52), m(0.2, 0.72), m(0.02, 1)), [m(0.62, 1)]), o)],
    "%": () => [ink(ell(x + 0.12 * h, y + 0.16 * h, 0.1 * h, 0.13 * h, -100), o), ink([m(0.58, 0), m(0.04, 1)], o), ink(ell(x + 0.5 * h, y + 0.84 * h, 0.1 * h, 0.13 * h, -100), o)],
    "?": () => [ink(join(bez(m(0.04, 0.27), m(0.04, -0.07), m(0.6, -0.07), m(0.56, 0.27)), bez(m(0.56, 0.27), m(0.52, 0.46), m(0.3, 0.42), m(0.3, 0.7))), o), dot(x + 0.3 * h, y + 0.93 * h, isRed)],
    "!": () => [ink([m(0.3, 0), m(0.3, 0.68)], o), dot(x + 0.3 * h, y + 0.93 * h, isRed)],
    "+": () => [ink([m(0.3, 0.18), m(0.3, 0.82)], o), ink([m(0, 0.5), m(0.6, 0.5)], o)],
    "=": () => [ink([m(0.02, 0.36), m(0.6, 0.36)], o), ink([m(0.02, 0.66), m(0.6, 0.66)], o)],
    "≠": () => [ink([m(0.02, 0.36), m(0.6, 0.36)], o), ink([m(0.02, 0.66), m(0.6, 0.66)], o), ink([m(0.46, 0.1), m(0.16, 0.92)], o)],
    Z: () => [ink([m(0, 0), m(0.56, 0), m(0, 1), m(0.6, 1)], o)],
  };
  return (g[ch] ?? (() => []))();
};
const glyphs = (s: string, x: number, y: number, h: number, isRed = false): Stroke[] =>
  [...s].flatMap((ch, i) => glyph(ch, x + i * h * 0.7, y, h, isRed));

/* ---------- the big word (Anton), sketched behind the head ---------- */
const word = (s: string, cx: number, base: number, size0: number, behind?: [number, number, number]): Stroke => {
  const W0 = s.length * size0 * 0.47;
  const size = W0 > 300 ? (size0 * 300) / W0 : size0;
  const W = Math.min(W0, 300);
  const x0 = cx - W / 2, top = base - size * 0.78;
  // the pen scribbles across the letters while they appear
  const n = Math.max(6, s.length * 3);
  const pts: P[] = Array.from({ length: n + 1 }, (_, i) => [x0 + (W * i) / n, i % 2 ? base - 4 : top + 4] as P);
  return { pts, red: true, txt: { s, x0, base, size, W, behind } };
};
const HEAD_MASK: [number, number, number] = [HX, HY, 56];
const bigWord = (s: string, size = 112) => word(s, HX, HY - 32, size, HEAD_MASK);

/* ---------- icons ---------- */
const bulb = (cx: number, cy: number, s: number, rays = true, isRed = false): Stroke[] => [
  ink(join([[cx - 0.42 * s, cy + 1.3 * s]], arc(cx, cy, s, s, 125, 415), [[cx + 0.42 * s, cy + 1.3 * s]]), { red: isRed }),
  ln([cx - 0.45 * s, cy + 1.45 * s], [cx + 0.45 * s, cy + 1.45 * s], { red: isRed }),
  ln([cx - 0.3 * s, cy + 1.68 * s], [cx + 0.3 * s, cy + 1.68 * s], { red: isRed }),
  ...(rays ? [-150, -90, -30].map((a) => {
    const r = (a * Math.PI) / 180;
    return red([[cx + 1.3 * s * Math.cos(r), cy + 1.3 * s * Math.sin(r)], [cx + 1.7 * s * Math.cos(r), cy + 1.7 * s * Math.sin(r)]], 4.5);
  }) : []),
];
const magnifier = (cx: number, cy: number, s: number, isRed = false): Stroke[] => [
  circle(cx, cy, s, { red: isRed }),
  ln([cx + s * 0.72, cy + s * 0.72], [cx + s * 1.75, cy + s * 1.75], { red: isRed, w: 7 }),
];
const eye = (cx: number, cy: number, s: number): Stroke[] => [
  ink(qbez([cx - s, cy], [cx, cy - s * 0.95], [cx + s, cy])),
  ink(qbez([cx - s, cy], [cx, cy + s * 0.95], [cx + s, cy])),
  circle(cx, cy, s * 0.32, { red: true }),
];
const phone = (cx: number, cy: number, w: number, h: number): Stroke[] => [
  box(cx - w / 2, cy - h / 2, w, h, { r: 12 }),
  ln([cx - w * 0.16, cy - h / 2 + 10], [cx + w * 0.16, cy - h / 2 + 10]),
];
const videoCard = (x: number, y: number, w: number, h: number): Stroke[] => [
  box(x, y, w, h, { r: 10 }),
  red([[x + w * 0.38, y + h * 0.38], [x + w * 0.38, y + h * 0.62], [x + w * 0.66, y + h * 0.5], [x + w * 0.38, y + h * 0.38]]),
];
const gauge = (cx: number, cy: number, r: number, v: number, needle = true): Stroke[] => [
  ink(arc(cx, cy, r, r, 180, 360)),
  ...[180, 225, 270, 315, 360].map((a) => {
    const t = (a * Math.PI) / 180;
    return ln([cx + r * 0.78 * Math.cos(t), cy + r * 0.78 * Math.sin(t)], [cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }),
  ...(needle ? gaugeNeedle(cx, cy, r, v) : []),
];
const gaugeNeedle = (cx: number, cy: number, r: number, v: number): Stroke[] => {
  const t = ((180 + 180 * v) * Math.PI) / 180;
  return [red([[cx, cy], [cx + r * 0.82 * Math.cos(t), cy + r * 0.82 * Math.sin(t)]], 5.5), circle(cx, cy, 4, { red: true })];
};
const target = (cx: number, cy: number, r: number): Stroke[] => [circle(cx, cy, r), circle(cx, cy, r * 0.62), circle(cx, cy, r * 0.26, { red: true })];
const userCard = (x: number, y: number, w: number, h: number): Stroke[] => [box(x, y, w, h, { r: 12 }), ...mini(x + w / 2, y + h * 0.36, w / 62)];
const row = (y: number, x = 40, wd = 252): Stroke[] => [box(x, y, 26, 26, { r: 5 }), ink([[x + 42, y + 14], [x + wd, y + 12]])];
const flask = (cx: number, cy: number, s: number): Stroke[] => [
  ink([[cx - 0.25 * s, cy - s], [cx - 0.25 * s, cy - 0.3 * s], [cx - 0.85 * s, cy + 0.8 * s], [cx + 0.85 * s, cy + 0.8 * s], [cx + 0.25 * s, cy - 0.3 * s], [cx + 0.25 * s, cy - s]]),
  ln([cx - 0.38 * s, cy - s], [cx + 0.38 * s, cy - s]),
  red([[cx - 0.6 * s, cy + 0.35 * s], [cx + 0.6 * s, cy + 0.35 * s]]),
  circle(cx - 0.1 * s, cy + 0.12 * s, 0.08 * s), circle(cx + 0.15 * s, cy - 0.15 * s, 0.06 * s),
];
const filmStrip = (x: number, y: number, w: number, h: number, frames = 4): Stroke[] => [
  box(x, y, w, h, { r: 6 }),
  ln([x + 4, y + h * 0.2], [x + w - 4, y + h * 0.2]),
  ln([x + 4, y + h * 0.8], [x + w - 4, y + h * 0.8]),
  ...Array.from({ length: frames - 1 }, (_, i) => ln([x + (w * (i + 1)) / frames, y + h * 0.2], [x + (w * (i + 1)) / frames, y + h * 0.8])),
  ink(Array.from({ length: 16 }, (_, i) => [x + 10 + ((w - 20) * i) / 15, y + h * 0.1 + (i % 2 ? 0 : 0.5)] as P), { amp: 0 }),
];
const book = (cx: number, cy: number, s: number, isRed = false): Stroke[] => [
  ink(join(qbez([cx, cy - 0.45 * s], [cx - 0.5 * s, cy - 0.65 * s], [cx - s, cy - 0.5 * s]), [[cx - s, cy + 0.5 * s]], qbez([cx - s, cy + 0.5 * s], [cx - 0.5 * s, cy + 0.35 * s], [cx, cy + 0.55 * s]))),
  ink(join(qbez([cx, cy - 0.45 * s], [cx + 0.5 * s, cy - 0.65 * s], [cx + s, cy - 0.5 * s]), [[cx + s, cy + 0.5 * s]], qbez([cx + s, cy + 0.5 * s], [cx + 0.5 * s, cy + 0.35 * s], [cx, cy + 0.55 * s]))),
  ln([cx, cy - 0.45 * s], [cx, cy + 0.55 * s]),
  ink([[cx + 0.22 * s, cy - 0.25 * s], [cx + 0.78 * s, cy - 0.3 * s]], { red: isRed }),
  ink([[cx + 0.22 * s, cy], [cx + 0.78 * s, cy - 0.05 * s]]),
  ink([[cx - 0.78 * s, cy - 0.3 * s], [cx - 0.22 * s, cy - 0.25 * s]]),
];
const gradCap = (cx: number, cy: number, s: number): Stroke[] => [
  ink([[cx - s, cy], [cx, cy - 0.42 * s], [cx + s, cy], [cx, cy + 0.42 * s], [cx - s, cy]]),
  ink(join([[cx - 0.58 * s, cy + 0.2 * s], [cx - 0.58 * s, cy + 0.62 * s]], qbez([cx - 0.58 * s, cy + 0.62 * s], [cx, cy + 0.9 * s], [cx + 0.58 * s, cy + 0.62 * s]), [[cx + 0.58 * s, cy + 0.2 * s]])),
  ink([[cx, cy], [cx + 0.8 * s, cy + 0.1 * s], [cx + 0.8 * s, cy + 0.75 * s]]),
];
const trash = (cx: number, cy: number, s: number): Stroke[] => [
  ln([cx - 0.75 * s, cy - 0.8 * s], [cx + 0.75 * s, cy - 0.8 * s]),
  ink([[cx - 0.2 * s, cy - 0.8 * s], [cx - 0.2 * s, cy - s], [cx + 0.2 * s, cy - s], [cx + 0.2 * s, cy - 0.8 * s]]),
  ink([[cx - 0.62 * s, cy - 0.62 * s], [cx - 0.46 * s, cy + s], [cx + 0.46 * s, cy + s], [cx + 0.62 * s, cy - 0.62 * s]]),
  ...[-0.25, 0, 0.25].map((u) => ln([cx + u * s, cy - 0.4 * s], [cx + u * 0.85 * s, cy + 0.8 * s])),
];
const chatBar = (x: number, y: number, w: number, h: number): Stroke[] => [
  box(x, y, w, h, { r: h / 2 }),
  circle(x + w - h / 2 - 2, y + h / 2, h * 0.32, { red: true }),
  red([[x + w - h / 2 - 9, y + h / 2], [x + w - h / 2 + 5, y + h / 2], [x + w - h / 2 - 1, y + h / 2 - 6]], 4),
];
const bubble = (x: number, y: number, w: number, h: number, side: "l" | "r", isRed = false): Stroke[] => {
  const tx = side === "l" ? x + 22 : x + w - 22;
  return [
    box(x, y, w, h, { r: 16, red: isRed }),
    ink([[tx - 8, y + h - 1], [side === "l" ? x + 6 : x + w - 6, y + h + 16], [tx + 8, y + h - 1]], { red: isRed }),
    ln([x + 18, y + h * 0.38], [x + w - 26, y + h * 0.38]),
    ln([x + 18, y + h * 0.68], [x + w * 0.6, y + h * 0.68]),
  ];
};
const wheel = (cx: number, cy: number, r: number): Stroke[] => [
  circle(cx, cy, r), circle(cx, cy, r * 0.28, { red: true }),
  ...[-90, 30, 150].map((a) => {
    const t = (a * Math.PI) / 180;
    return ln([cx + r * 0.28 * Math.cos(t), cy + r * 0.28 * Math.sin(t)], [cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }),
];
const cloud = (cx: number, cy: number, s: number): Stroke => {
  const pts: P[] = [];
  for (let i = 0; i <= 96; i++) {
    const t = (i / 96) * Math.PI * 2 + 0.3;
    const r = s * (0.86 + 0.2 * Math.abs(Math.sin(t * 3.5)));
    pts.push([cx + r * Math.cos(t), cy + r * 0.66 * Math.sin(t)]);
  }
  return ink(pts, { amp: 0.6 });
};
const camera = (cx: number, cy: number, s: number): Stroke[] => [
  box(cx - s, cy - 0.55 * s, 2 * s, 1.25 * s, { r: 7 }),
  ink([[cx - 0.5 * s, cy - 0.55 * s], [cx - 0.35 * s, cy - 0.85 * s], [cx + 0.15 * s, cy - 0.85 * s], [cx + 0.3 * s, cy - 0.55 * s]]),
  circle(cx, cy + 0.08 * s, 0.4 * s, { red: true }),
];
const clapper = (cx: number, cy: number, s: number): Stroke[] => [
  box(cx - s, cy - 0.35 * s, 2 * s, 1.2 * s, { r: 5 }),
  ink([[cx - s, cy - 0.38 * s], [cx - 0.92 * s, cy - 0.85 * s], [cx + 0.98 * s, cy - 1.05 * s], [cx + s, cy - 0.6 * s]]),
  ...[-0.5, 0, 0.5].map((u) => red([[cx + u * s, cy - 0.45 * s], [cx + (u + 0.25) * s, cy - 0.9 * s]], 4.5)),
];
const mirror = (cx: number, cy: number, rx: number, ry: number): Stroke[] => [
  ink(ell(cx, cy, rx, ry, -100)),
  ln([cx, cy + ry], [cx, cy + ry + 34]),
  ln([cx - 26, cy + ry + 36], [cx + 26, cy + ry + 36]),
  red([[cx + rx * 0.35, cy - ry * 0.6], [cx + rx * 0.6, cy - ry * 0.3]], 4),
];
const cube = (cx: number, cy: number, s: number): Stroke[] => {
  const h = s * 0.58;
  return [
    ink([[cx, cy - s], [cx + s * 0.87, cy - s / 2], [cx + s * 0.87, cy + s / 2], [cx, cy + s], [cx - s * 0.87, cy + s / 2], [cx - s * 0.87, cy - s / 2], [cx, cy - s]]),
    ink([[cx - s * 0.87, cy - s / 2], [cx, cy], [cx + s * 0.87, cy - s / 2]]),
    red([[cx, cy], [cx, cy + s]]),
    ink([[cx + s * 0.2, cy + h * 0.5], [cx + s * 0.67, cy + h * 0.1]], { amp: 0.4 }),
  ];
};
const chip = (cx: number, cy: number, s: number): Stroke[] => [
  box(cx - s, cy - s, 2 * s, 2 * s, { r: 6 }),
  box(cx - 0.45 * s, cy - 0.45 * s, 0.9 * s, 0.9 * s, { r: 3, red: true }),
  ...[-0.5, 0, 0.5].flatMap((u) => [
    ln([cx + u * s, cy - s], [cx + u * s, cy - 1.35 * s]), ln([cx + u * s, cy + s], [cx + u * s, cy + 1.35 * s]),
    ln([cx - s, cy + u * s], [cx - 1.35 * s, cy + u * s]), ln([cx + s, cy + u * s], [cx + 1.35 * s, cy + u * s]),
  ]),
];
const repeatStamp = (cx: number, cy: number, r: number): Stroke[] => [
  circle(cx, cy, r, { red: true, w: 5 }),
  red(arc(cx, cy, r * 0.55, r * 0.55, -60, 220), 5),
  red([[cx + r * 0.55 * Math.cos((220 * Math.PI) / 180) - 10, cy + r * 0.55 * Math.sin((220 * Math.PI) / 180) + 2], [cx + r * 0.55 * Math.cos((220 * Math.PI) / 180), cy + r * 0.55 * Math.sin((220 * Math.PI) / 180)], [cx + r * 0.55 * Math.cos((220 * Math.PI) / 180) + 2, cy + r * 0.55 * Math.sin((220 * Math.PI) / 180) + 12]], 5),
];
const tangle = (x: number, y: number, w: number, h: number, isRed = false): Stroke => {
  const pts: P[] = [];
  for (let i = 0; i <= 90; i++) {
    const t = i / 90;
    pts.push([x + w * t + Math.cos(t * 30) * h * 0.32, y + Math.sin(t * 30) * h * 0.42 + Math.sin(t * 7) * h * 0.12]);
  }
  return ink(pts, { red: isRed, amp: 0.4 });
};
const face = (cx: number, cy: number, r: number, mood: "happy" | "sad" | "sleep"): Stroke[] => [
  ...(mood === "sleep"
    ? [ink(qbez([cx - r * 0.5, cy - r * 0.1], [cx - r * 0.32, cy + r * 0.05], [cx - r * 0.14, cy - r * 0.1])), ink(qbez([cx + r * 0.14, cy - r * 0.1], [cx + r * 0.32, cy + r * 0.05], [cx + r * 0.5, cy - r * 0.1]))]
    : [dot(cx - r * 0.32, cy - r * 0.12), dot(cx + r * 0.32, cy - r * 0.12)]),
  mood === "happy" ? red(qbez([cx - r * 0.42, cy + r * 0.3], [cx, cy + r * 0.65], [cx + r * 0.42, cy + r * 0.3])) : ink(qbez([cx - r * 0.36, cy + r * 0.5], [cx, cy + (mood === "sad" ? r * 0.25 : r * 0.42)], [cx + r * 0.36, cy + r * 0.5])),
];

/* =====================================================================================
 * 2. the beat sheet: pages of stroke groups pinned to his words
 * ===================================================================================== */
const wd = (id: string, needle: string, nth = 0): number => {
  const l = lineOf(id);
  const hits = l.words.filter((x) => x.text.includes(needle));
  const hit = hits[Math.min(nth, hits.length - 1)];
  return hit ? Math.round(hit.s * 30) : at(id);
};
type Group = [number, () => Stroke[]];
type PageDef = { s: number; groups: Group[] };
const PAGES_DEF: PageDef[] = [];
const page = (s: number, groups: Group[]) => PAGES_DEF.push({ s: s === 0 ? 0 : s - 4, groups });
const F = () => fig();

/* hook: you → Claude → « how ? » */
page(0, [
  [8, F],
  [wd("hook", "العباد"), () => brackets(HX, HY, 82)],
  [wd("hook", "تعلّمو"), () => [ink(arc(HX, HY, 98, 98, 200, 480), { amp: 1.6 })]],
  [wd("hook", "Claude") - 3, () => [...claude(274, 172, 34), sparkle(318, 112, 12)]],
  [wd("hook", "ومكش"), () => [box(22, 128, 72, 80, { r: 12 }), ...glyph("?", 42, 140, 56)]],
  [wd("hook", "كيف"), () => arrow([62, 222], [112, 292], 16)],
]);
/* lik: the video card → LIK behind the head */
page(at("lik"), [
  [at("lik"), F],
  [wd("lik", "هاذي"), () => videoCard(20, 150, 76, 120)],
  [wd("lik", "ليك") - 2, () => [bigWord("LIK", 120), sparkle(44, 110, 13, true), sparkle(306, 128, 10)]],
]);
/* crowd: lots of people learn Claude */
const crowdRow = (y: number, xs: number[], s = 1.1) => () => xs.flatMap((x) => mini(x, y, s));
page(at("crowd"), [
  [at("crowd"), crowdRow(300, [56, 124, 192, 260])],
  [wd("crowd", "عباد"), crowdRow(400, [90, 158, 226, 294])],
  [wd("crowd", "تعلّمو"), crowdRow(500, [56, 124, 192, 260])],
  [wd("crowd", "Claude") - 4, () => [...claude(172, 170, 42), sparkle(70, 150, 14), sparkle(282, 210, 10, true)]],
]);
/* deliver: lots of things out (2×2 checked boxes) */
const tick = (x: number, y: number) => () => [box(x, y, 30, 30, { r: 6 }), check(x + 5, y + 6, 22), ink([[x + 46, y + 16], [x + 128, y + 14]])];
page(at("deliver"), [
  [at("deliver"), F],
  [wd("deliver", "livriw"), () => [box(244, 150, 76, 76, { r: 14 }), ...arrow([282, 210], [282, 166], 0, { red: true, head: 13 }), ...tick(26, 610)()]],
  [wd("deliver", "برشا"), tick(186, 610)],
  [wd("deliver", "حاجات"), tick(26, 668)],
  [wd("deliver", "بيه"), tick(186, 668)],
]);
/* minority: a crowd, only three circled */
page(at("minority"), [
  [at("minority"), crowdRow(290, [44, 103, 162, 221, 280], 1)],
  [wd("minority", "كان"), crowdRow(400, [74, 133, 192, 251], 1)],
  [wd("minority", "minorité"), () => [ink(ell(103, 305, 30, 36, -100), { red: true, w: 5 }), ink(ell(251, 415, 30, 36, -100), { red: true, w: 5 }), ink(ell(280, 305, 30, 36, -100), { red: true, w: 5 })]],
  [wd("minority", "la différence"), () => [...arrow([110, 600], [240, 470], -40, { red: true }), sparkle(60, 560, 16), sparkle(300, 540, 11, true)]],
]);
/* unclear6: the difference gauge swings to the max */
page(at("unclear6"), [
  [at("unclear6"), F],
  [wd("unclear6", "هاذي"), () => gauge(276, 214, 44, 0.95, false)],
  [wd("unclear6", "الكل"), () => [...gaugeNeedle(276, 214, 44, 0.95), sparkle(54, 184, 18), sparkle(36, 254, 10, true)]],
  [wd("unclear6", "معاها"), () => [...arrow([238, 250], [314, 166], -24, { red: true, head: 12 })]],
]);
/* two: personnellement → I see → ZOUZ → ≠ → the two AI users */
page(at("two"), [
  [at("two"), F],
  [wd("two", "personnellement"), () => brackets(HX, HY, 82)],
  [wd("two", "نشوف"), () => eye(58, 196, 34)],
  [wd("two", "زوز") - 2, () => [bigWord("ZOUZ", 120)]],
  [wd("two", "حاجات"), () => [circle(282, 196, 30), ...glyph("2", 271, 176, 40, true)]],
  [wd("two", "la différence"), () => glyph("≠", 280, 400, 40, true)],
  [wd("two", "les AI users") - 2, () => [...userCard(22, 600, 92, 124), ...userCard(230, 600, 92, 124)]],
]);
/* crea_int: creativity + intelligence */
page(at("crea_int"), [
  [at("crea_int"), () => [...bulb(90, 300, 44), sparkle(40, 210, 12)]],
  [wd("crea_int", "و"), () => glyph("+", 158, 300, 42)],
  [wd("crea_int", "l'intelligence"), () => [...magnifier(246, 290, 38, true), sparkle(300, 420, 14), sparkle(150, 470, 10)]],
]);
/* explain: let me explain */
page(at("explain"), [
  [at("explain"), F],
  [at("explain") + 6, () => [...bubble(214, 150, 108, 66, "l"), ...[0, 1, 2].map((i) => dot(246 + i * 18, 254, i === 2))]],
]);
/* same: two users, same tool, same model, Claude, everything = the same */
page(at("same"), [
  [at("same"), F],
  [wd("same", "users"), () => [...userCard(16, 232, 78, 108), ...userCard(250, 232, 78, 108)]],
  [wd("same", "نفس"), () => [...row(600), check(45, 602, 18)]],
  [wd("same", "modèle"), () => [...row(645), check(45, 647, 18)]],
  [wd("same", "Claude") - 2, () => [...claude(86, 236, 16), ...claude(320, 236, 16)]],
  [wd("same", "كل"), () => [...row(690), check(45, 692, 18)]],
]);
/* classic: user A sleeps, déjà vu */
page(at("classic") + 5, [
  [at("classic"), () => [box(40, 140, 264, 310, { r: 14 })]],
  [wd("classic", "يخرّج"), () => [circle(172, 290, 50), ...face(172, 290, 50, "sleep"), ink(qbez([96, 450], [110, 370], [150, 352])), ink(qbez([194, 352], [234, 370], [248, 450]))]],
  [wd("classic", "classique"), () => [...glyph("Z", 236, 220, 28), ...glyph("Z", 262, 184, 20), ...glyph("Z", 282, 158, 14)]],
  [wd("classic", "déjà vu"), () => [...repeatStamp(172, 560, 56)]],
]);
/* satisfied: user A happy with 3 stars */
page(at("satisfied"), [
  [at("satisfied"), () => [box(26, 180, 128, 176, { r: 14 }), circle(90, 248, 32), ...face(90, 248, 32, "happy"), box(190, 180, 128, 176, { r: 14 }), ...mini(254, 240, 1.7)]],
  [wd("satisfied", "satisfait"), () => [star5(110, 450, 24), star5(172, 440, 24), star5(234, 450, 24, true)]],
  [wd("satisfied", "résultat"), () => [check(54, 380, 70)]],
]);
/* other: user B does it differently → creative */
page(at("other"), [
  [at("other"), () => [box(26, 180, 128, 176, { r: 14 }), ...mini(90, 240, 1.7), box(190, 180, 128, 176, { r: 14 })]],
  [wd("other", "بشكل"), () => bulb(254, 250, 30, false)],
  [wd("other", "جديد"), () => [sparkle(180, 150, 15), sparkle(318, 390, 11, true), sparkle(312, 160, 9)]],
  [wd("other", "créatif"), () => [box(182, 172, 144, 192, { r: 18, red: true, w: 5 }), ...bulb(254, 250, 30, true, true).slice(3), ...arrow([96, 420], [236, 410], -30)]],
]);
/* combine: concepts merge, experiment */
page(at("combine"), [
  [at("combine"), () => [circle(126, 330, 72)]],
  [wd("combine", "des concepts"), () => [circle(218, 330, 72)]],
  [wd("combine", "des concepts") + 12, () => [red(join(arc(126, 330, 72, 72, -50, 50)), 5), red(arc(218, 330, 72, 72, 130, 230), 5), sparkle(172, 330, 16, true)]],
  [wd("combine", "expérimenti"), () => [...flask(172, 600, 52), sparkle(250, 560, 10)]],
]);
/* results: small bars → INIMAGINABLE → the off-the-chart bar */
page(at("results"), [
  [at("results"), F],
  [wd("results", "des résultats"), () => [ln([24, 736], [320, 736]), ...[30, 46, 38, 56].map((h, i) => box(30 + i * 46, 736 - h, 32, h, { r: 4 }))]],
  [wd("results", "ماملية"), () => [bigWord("INIMAGINABLE", 112)]],
  [wd("results", "تتصوّر"), () => [box(222, 600, 40, 136, { r: 5, red: true, w: 5 }), ...arrow([300, 720], [300, 612], 0, { red: true, head: 12 }), sparkle(312, 586, 10, true)]],
]);
/* the six creative ingredients: one checked cell per item */
const cell = (i: number, icon: (cx: number, cy: number) => Stroke[]) => () => {
  const x = i % 2 ? 180 : 22, y = 352 + Math.floor(i / 2) * 94;
  return [box(x, y, 142, 82, { r: 12 }), ...icon(x + 92, y + 41), box(x + 12, y + 29, 24, 24, { r: 5 }), check(x + 15, y + 31, 20)];
};
page(at("example"), [
  [at("example"), () => [...fig(HX, 190, 0.6), sparkle(60, 140, 13), sparkle(290, 170, 10, true)]],
  [at("ideas"), cell(0, (x, y) => bulb(x, y - 10, 16, false))],
  [at("concept"), cell(1, (x, y) => [cloud(x, y, 30), dot(x - 20, y + 30), dot(x - 30, y + 36)])],
  [at("story"), cell(2, (x, y) => clapper(x, y + 6, 26))],
  [at("angles"), cell(3, (x, y) => camera(x, y + 4, 26))],
  [at("transitions"), cell(4, (x, y) => filmStrip(x - 32, y - 20, 64, 42, 3))],
  [at("vfx"), cell(5, (x, y) => [sparkle(x - 6, y, 18, true), sparkle(x + 22, y - 18, 9), sparkle(x + 20, y + 20, 7)])],
]);
/* tell: the film strip of the story + the book */
page(at("tell"), [
  [at("tell"), F],
  [wd("tell", "الطريقة"), () => filmStrip(22, 608, 300, 108, 4)],
  [wd("tell", "l'histoire"), () => book(270, 196, 46, true)],
  [wd("tell", "حدّ"), () => [sparkle(56, 180, 15), sparkle(318, 120, 9, true)]],
]);
/* needs: everything needs CRÉATIVITÉ */
page(at("needs"), [
  [at("needs"), F],
  [wd("needs", "يحتاج"), () => [0, 1, 2, 3, 4, 5].map((i) => check(30 + i * 50, 640, 28, i === 5))],
  [wd("needs", "créativité") - 3, () => [bigWord("CRÉATIVITÉ"), sparkle(40, 190, 12, true)]],
]);
/* second: number 2 → INTELLIGENCE */
page(at("second"), [
  [at("second"), F],
  [wd("second", "للحاجة"), () => [circle(54, 206, 30), ...glyph("2", 43, 186, 40, true)]],
  [wd("second", "l'intelligence") - 3, () => [bigWord("INTELLIGENCE")]],
  [wd("second", "l'intelligence") + 6, () => magnifier(276, 190, 26, true)],
]);
/* not enough: creativity ✓, alone ✗, 50 % */
page(at("notenough"), [
  [at("notenough"), F],
  [wd("notenough", "créativité"), () => [...row(612), check(45, 614, 18), ...gauge(276, 214, 40, 0.5, false)]],
  [wd("notenough", "وحدها"), () => [...row(668), ...cross(53, 681, 9)]],
  [wd("notenough", "تكفيش") - 4, () => gaugeNeedle(276, 214, 40, 0.5)],
]);
/* academic: not the diploma kind */
page(at("academic"), [
  [at("academic"), F],
  [wd("academic", "راني"), () => gradCap(270, 196, 42)],
  [wd("academic", "مانيش"), () => cross(272, 206, 40)],
  [wd("academic", "académique"), () => [box(22, 176, 74, 54, { r: 8 }), ink([[34, 192], [84, 192]]), ink([[34, 210], [70, 210]]), circle(84, 228, 9, { red: true })]],
]);
/* capacity: understand a problem (tangle → straight) */
page(at("capacity") - 2, [
  [at("capacity"), () => magnifier(150, 190, 48)],
  [wd("capacity", "باش"), () => [tangle(34, 440, 140, 90)]],
  [wd("capacity", "تفهم"), () => arrow([196, 440], [318, 440], -6)],
  [wd("capacity", "un problème"), () => [ink(ell(104, 440, 92, 66, -100), { red: true, w: 5 }), ...glyph("?", 86, 540, 50, true)]],
]);
/* ask / steer / challenge: the chat */
page(at("ask"), [
  [at("ask"), () => fig(HX, 262, 0.8)],
  [wd("ask", "شنوّة"), () => chatBar(22, 640, 300, 58)],
  [wd("ask", "تسأل"), () => glyph("?", 44, 650, 38, true)],
  [at("steer"), () => wheel(282, 150, 32)],
  [at("challenge"), () => bubble(150, 470, 172, 58, "r")],
  [wd("challenge", "challengiha"), () => cross(56, 160, 20)],
  [wd("challenge", "الـréponse"), () => [...bubble(22, 556, 168, 52, "l"), ...claude(174, 556, 10)]],
]);
/* judge: does the result work? */
page(at("judge"), [
  [at("judge"), F],
  [wd("judge", "كيفاش"), () => magnifier(270, 186, 28)],
  [wd("judge", "الـrésultat"), () => [...row(605), dot(53, 619, true)]],
  [wd("judge", "ينجح"), () => [...row(650), check(45, 652, 18, false)]],
  [wd("judge", "ينجحش"), () => [...row(695), ...cross(53, 708, 9)]],
]);
/* perfect-looking answer … technically wrong */
page(at("perfect"), [
  [at("perfect"), () => [box(40, 140, 264, 300, { r: 16 }), ln([60, 190], [284, 190])]],
  [wd("perfect", "تعطيك"), () => [...claude(72, 166, 14), ink([[62, 230], [270, 228]]), ink([[62, 266], [250, 268]]), ink([[62, 302], [262, 300]]), ink([[62, 338], [200, 340]])]],
  [wd("perfect", "parfaite"), () => [check(214, 350, 60, false), star5(120, 490, 18), star5(172, 484, 18), star5(224, 490, 18)]],
  [wd("wrong", "techniquement"), () => magnifier(250, 380, 30)],
  [wd("wrong", "غالطة") - 3, () => [ln([60, 160], [290, 420], { red: true, w: 7 }), ln([290, 160], [60, 420], { red: true, w: 7 })]],
]);
/* no hindsight, no experience, can't judge */
page(at("recul") + 10, [
  [at("recul"), F],
  [wd("recul", "عندكش"), () => [circle(282, 196, 28, { red: true, w: 5 }), red([[262, 216], [302, 176]], 5)]],
  [wd("recul", "le recul"), () => [...row(605), ...cross(53, 618, 9)]],
  [wd("recul", "l'expérience"), () => [...row(650), ...cross(53, 663, 9)]],
  [wd("juger", "la capacité"), () => gauge(62, 214, 38, 0.12)],
  [wd("juger", "de juger"), () => [...row(695), ...cross(53, 708, 9)]],
]);
/* risk: 100 % → 0 %, into the trash */
page(at("risk"), [
  [at("risk"), () => trash(172, 560, 64)],
  [wd("risk", "برشا"), () => glyphs("100%", 52, 140, 64)],
  [wd("risk", "حاجات"), () => [...arrow([172, 230], [172, 300], 8), ink(ell(150, 444, 14, 12, 0)), ink(ell(196, 452, 12, 11, 0))]],
  [wd("risk", "sans valeur"), () => [red([[40, 168], [300, 176]], 6), ...glyphs("0%", 118, 316, 60, true)]],
]);
/* the difference: target → user A vs user B, B is the intelligent creative one */
page(at("diff"), [
  [at("diff"), F],
  [wd("diff", "exactement"), () => [...target(172, 662, 54), ...arrow([300, 600], [190, 656], -14, { red: true })]],
  [wd("diff", "la différence"), () => [...userCard(16, 190, 78, 108), ...userCard(250, 190, 78, 108)]],
  [wd("normal", "les users"), () => [word("VS", HX, 250, 64)]],
  [wd("normal", "العاديين"), () => [ink(Array.from({ length: 9 }, (_, i) => [24 + i * 8, i % 2 ? 210 : 290] as P), { amp: 0.3 })]],
  [wd("smart", "l'intelligence"), () => [box(242, 182, 94, 124, { r: 16, red: true, w: 5 }), ...bulb(290, 130, 15, false, true)]],
  [wd("smart", "les créatifs"), () => [sparkle(234, 340, 12), sparkle(318, 340, 9, true)]],
]);
/* see a product made with AI */
page(at("see"), [
  [at("see"), F],
  [wd("see", "نشوف"), () => eye(56, 200, 32)],
  [wd("product", "produit"), () => phone(282, 214, 62, 112)],
  [wd("product", "مصنوع"), () => [...claude(282, 214, 20), sparkle(240, 132, 9), sparkle(318, 296, 8, true)]],
]);
/* reflect: REFLET, creativity + intelligence, it's you */
page(at("reflect"), [
  [at("reflect"), F],
  [wd("reflect", "يعكس") + 6, () => [bigWord("REFLET", 120)]],
  [wd("reflect", "الـcréativité"), () => bulb(50, 352, 20)],
  [wd("reflect", "l'intelligence"), () => magnifier(282, 342, 20)],
  [wd("reflect", "نشوفو"), () => brackets(HX, HY, 82)],
  [wd("reflect", "فيه"), () => [...mirror(172, 640, 34, 48), ...mini(172, 632, 0.9)]],
]);
/* think: how you think */
page(at("think"), [
  [at("think"), F],
  [wd("think", "نفهمو"), () => [circle(220, 258, 5), circle(238, 226, 8), cloud(276, 156, 46)]],
  [wd("think", "تخمّم"), () => bulb(276, 146, 14, false, true)],
]);
/* good thinking → good result */
page(at("good"), [
  [at("good"), () => [circle(96, 190, 48), ...face(96, 190, 48, "happy")]],
  [wd("good", "بالباهي"), () => [...bulb(216, 150, 22, true)]],
  [wd("good", "تخرجلك"), () => arrow([120, 260], [160, 420], -26)],
  [wd("good", "résultat"), () => [box(80, 440, 184, 210, { r: 16 }), ink([[104, 484], [238, 484]]), ink([[104, 520], [220, 520]])]],
  [wd("good", "باهية"), () => [check(118, 548, 90), sparkle(286, 430, 14, true), sparkle(52, 640, 10)]],
]);
/* bad thinking → bad result */
page(at("bad"), [
  [at("bad"), () => [circle(96, 190, 48), ...face(96, 190, 48, "sad")]],
  [wd("bad", "بالخايب"), () => [tangle(170, 150, 120, 50)]],
  [wd("bad", "تخرجلك"), () => arrow([120, 260], [160, 420], -26)],
  [wd("bad", "résultat"), () => [box(80, 440, 184, 210, { r: 16 }), ink(Array.from({ length: 12 }, (_, i) => [104 + i * 12, 484 + (i % 2 ? 8 : -6)] as P)), ink([[104, 520], [200, 540]])]],
  [wd("bad", "خايبة"), () => [...cross(172, 560, 44)]],
]);
/* concrétiser: AI helps the idea become real → the result you want */
page(at("concret"), [
  [at("concret"), () => claude(172, 112, 26)],
  [wd("concret", "تعاونك"), () => bulb(64, 206, 30)],
  [wd("concret", "concrétisi"), () => [...arrow([110, 214], [214, 214], -18), ...cube(270, 214, 40)]],
  [wd("concret", "les idées"), () => [sparkle(30, 150, 11, true), sparkle(110, 150, 9)]],
  [wd("concret", "finalement"), () => arrow([262, 278], [196, 430], 30)],
  [wd("concret", "تخرّج"), () => target(172, 520, 70)],
  [wd("concret", "الـrésultat") + 2, () => [...arrow([300, 640], [184, 528], 20, { red: true }), sparkle(60, 620, 12)]],
]);
/* mirror (1): a product → intelligence + creativity */
page(at("mirror"), [
  [at("mirror"), F],
  [wd("mirror", "un produit") - 4, () => phone(282, 214, 62, 112)],
  [wd("mirror", "l'intelligence"), () => [circle(132, 662, 50), ...magnifier(120, 650, 12)]],
  [wd("mirror", "créativité"), () => [circle(212, 662, 50), ...bulb(226, 646, 10, false)]],
  [wd("mirror", "متاعك"), () => [red(arc(132, 662, 50, 50, -55, 55), 5), red(arc(212, 662, 50, 50, 125, 235), 5), sparkle(172, 600, 10, true)]],
]);
/* mirror (2): the product reflects you: what you think, who you became, creative or not */
page(wd("mirror", "في"), [
  [wd("mirror", "في") + 4, () => [...fig(96, 300, 0.78), ...mirror(258, 300, 58, 96)]],
  [wd("mirror", "ça reflète", 0), () => [...mini(258, 284, 1.5), ...row(600, 40, 280), check(45, 602, 18)]],
  [wd("mirror", "ça reflète", 1), () => [...row(648, 40, 280), check(45, 650, 18)]],
  [wd("mirror", "ça reflète", 2), () => [...row(696, 40, 280)]],
  [wd("mirror", "créatif"), () => [...glyph("?", 49, 696, 24, true), sparkle(206, 170, 12, true)]],
]);
/* don't just learn AI */
page(at("dont") - 2, [
  [at("dont"), () => book(172, 420, 110)],
  [wd("dont", "just learn"), () => chip(172, 250, 40)],
  [wd("dont", "AI") - 12, () => [...glyph("!", 274, 120, 70, true), sparkle(60, 140, 15), sparkle(46, 560, 10, true)]],
]);
/* learn how to be SMART around AI */
page(at("around"), [
  [at("around"), F],
  [wd("around", "smart around") - 2, () => [bigWord("SMART", 124)]],
  [wd("around", "smart around") + 8, () => [...claude(286, 200, 22), ink(ell(286, 200, 42, 18, 160, 300)), ...arrow([250, 186], [262, 180], 0, { head: 10 })]],
  [wd("around", "AI") - 4, () => [sparkle(50, 180, 14, true)]],
]);
/* final: use it, learn it, learn to be creative & intelligent */
page(at("final"), [
  [at("final"), F],
  [wd("final", "الـAI"), () => [...row(605), check(45, 607, 18)]],
  [wd("final", "الـAI", 1), () => [...row(650), check(45, 652, 18)]],
  [wd("final", "وفي"), () => brackets(HX, HY, 82)],
  [wd("final", "تكون"), () => row(695)],
  [wd("final", "créatif"), () => [check(45, 697, 18), ...bulb(52, 206, 24)]],
  [wd("final", "intelligent"), () => [...magnifier(282, 194, 24, true), sparkle(306, 120, 12, true), sparkle(36, 120, 10)]],
  [wd("final", "intelligent") + 30, () => [sparkle(318, 560, 14), sparkle(26, 580, 12, true)]],
]);

/* =====================================================================================
 * 3. schedule: every stroke gets [t0, t1] in frames; the pen speed fills each phrase
 * ===================================================================================== */
type TS = { t0: number; t1: number; pts: P[]; cum: number[]; len: number; red: boolean; w: number; txt?: Txt; d: string; id: string };
type Pg = { s: number; e: number; strokes: TS[] };
const MIN_V = 10, MAX_V = 170; // px per frame
/** pen up between strokes of a group (short hops are quick) */
const liftT = (d: number) => Math.min(3.5, Math.max(0.35, d / 120));
/** pen up between two groups */
const hopT = (d: number) => Math.min(4, Math.max(0.7, d / 100));
const pathD = (pts: P[]) => "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L");

/** QA only: per group, the word frame asked vs the frames the pen really draws it */
export const SB_DEBUG: { page: number; ask: number; start: number; end: number; pageEnd: number }[] = [];
const PAGES: Pg[] = PAGES_DEF.map((pd, pi) => {
  const nextS = pi < PAGES_DEF.length - 1 ? PAGES_DEF[pi + 1].s : DURATION;
  const e = nextS;
  const groups = [...pd.groups].sort((a, b) => a[0] - b[0]).map(([t, fn]) => ({ t, strokes: fn() }));
  const out: TS[] = [];
  let clock = pi === 0 ? 0 : pd.s + 4;
  let pen: P | null = null;
  groups.forEach((g, gi) => {
    if (!g.strokes.length) return;
    const nextAt = gi < groups.length - 1 ? groups[gi + 1].t : e - 8;
    const first = g.strokes[0].pts[0];
    const start = Math.max(g.t, clock + (pen ? hopT(dist(pen, first)) : 3));
    const lens = g.strokes.map((s) => {
      let L = 0;
      for (let i = 1; i < s.pts.length; i++) L += dist(s.pts[i - 1], s.pts[i]);
      return s.txt ? s.txt.W * 1.6 : L;
    });
    let lifts = 0;
    for (let i = 1; i < g.strokes.length; i++) lifts += liftT(dist(g.strokes[i - 1].pts[g.strokes[i - 1].pts.length - 1], g.strokes[i].pts[0]));
    const total = lens.reduce((a, b) => a + b, 0);
    const avail = nextAt - start - lifts;
    const v = Math.min(MAX_V, Math.max(MIN_V, avail > 0 ? total / avail : MAX_V));
    let t = start;
    g.strokes.forEach((s, si) => {
      if (si > 0) t += liftT(dist(g.strokes[si - 1].pts[g.strokes[si - 1].pts.length - 1], s.pts[0]));
      const dur = Math.max(0.35, lens[si] / v);
      const cum = [0];
      for (let i = 1; i < s.pts.length; i++) cum.push(cum[i - 1] + dist(s.pts[i - 1], s.pts[i]));
      out.push({ t0: t, t1: t + dur, pts: s.pts, cum, len: cum[cum.length - 1], red: !!s.red, w: s.w ?? (s.red ? 5 : 4.5), txt: s.txt, d: pathD(s.pts), id: `p${pi}s${out.length}` });
      t += dur;
    });
    SB_DEBUG.push({ page: pi, ask: g.t, start, end: t, pageEnd: e });
    clock = t;
    pen = g.strokes[g.strokes.length - 1].pts[g.strokes[g.strokes.length - 1].pts.length - 1];
  });
  // everything is drawn before the page turns
  const limit = e - 3;
  const kept = out.filter((s) => s.t0 < limit - 0.5).map((s) => (s.t1 > limit ? { ...s, t1: limit } : s));
  return { s: pd.s, e, strokes: kept };
});
const ALL: TS[] = PAGES.flatMap((p) => p.strokes);

/* =====================================================================================
 * 4. rendering
 * ===================================================================================== */
const ease = (t: number) => t * t * (3 - 2 * t);
const progress = (s: TS, fr: number) => {
  const p = Math.max(0, Math.min(1, (fr - s.t0) / Math.max(0.01, s.t1 - s.t0)));
  return p * 0.75 + ease(p) * 0.25;
};
const pointAt = (s: TS, L: number): { p: P; i: number } => {
  let lo = 0, hi = s.cum.length - 1;
  while (lo < hi - 1) {
    const m = (lo + hi) >> 1;
    if (s.cum[m] <= L) lo = m;
    else hi = m;
  }
  const seg = s.cum[hi] - s.cum[lo] || 1;
  const t = Math.max(0, Math.min(1, (L - s.cum[lo]) / seg));
  const a = s.pts[lo], b = s.pts[hi];
  return { p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], i: lo };
};

const StrokeEl: React.FC<{ s: TS; fr: number; full: boolean }> = ({ s, fr, full }) => {
  const color = s.red ? RED : INK;
  if (s.txt) {
    const t = s.txt;
    const p = full ? 1 : progress(s, fr);
    const ox = full ? t.W + 10 : pointAt(s, s.len * p).p[0] - t.x0 + 6;
    return (
      <g mask={t.behind ? `url(#m-${s.id})` : undefined}>
        {t.behind ? (
          <mask id={`m-${s.id}`} maskUnits="userSpaceOnUse" x={0} y={0} width={SB.w} height={SB.h}>
            <rect x={0} y={0} width={SB.w} height={SB.h} fill="#fff" />
            <circle cx={t.behind[0]} cy={t.behind[1]} r={t.behind[2] + 4} fill="#000" />
          </mask>
        ) : null}
        <clipPath id={`c-${s.id}`}>
          <rect x={t.x0 - 6} y={t.base - t.size * 1.1} width={Math.max(0, ox)} height={t.size * 1.4} />
        </clipPath>
        <text x={t.x0} y={t.base} fontFamily={BIG_FONT} fontSize={t.size} textLength={t.W} lengthAdjust="spacingAndGlyphs" fill={RED} clipPath={`url(#c-${s.id})`} letterSpacing={1}>
          {t.s}
        </text>
      </g>
    );
  }
  let d = s.d;
  if (!full) {
    const { p, i } = pointAt(s, s.len * progress(s, fr));
    d = pathD([...s.pts.slice(0, i + 1), p]);
  }
  return <path d={d} fill="none" stroke={color} strokeWidth={s.w} strokeLinecap="round" strokeLinejoin="round" />;
};

/** the drawing sits 46 px higher than its design grid: the canvas' big check rows cover the card's bottom edge */
const LIFT = -46;
/** one sheet of the pad: every stroke of the page that has started by `fr` */
const Sheet: React.FC<{ pg: Pg; fr: number; frozen?: boolean }> = ({ pg, fr, frozen }) => (
  <svg width={SB.w} height={SB.h} style={{ position: "absolute", left: 0, top: LIFT, overflow: "visible" }}>
    {pg.strokes.filter((s) => frozen || fr >= s.t0).map((s) => <StrokeEl key={s.id} s={s} fr={fr} full={!!frozen || fr >= s.t1} />)}
  </svg>
);

/* the pen: where is the tip, is it on the paper */
const REST: P = [440, 640];
const penAt = (fr: number): { p: P; lift: number; drawing: boolean } => {
  let i = -1;
  for (let k = 0; k < ALL.length; k++) {
    if (ALL[k].t0 <= fr) i = k;
    else break;
  }
  if (i < 0) {
    const n = ALL[0];
    const q = interpolate(fr, [n.t0 - 10, n.t0], [0, 1], clamp);
    return { p: lerp(REST, n.pts[0], ease(q)), lift: 1 - q, drawing: false };
  }
  const s = ALL[i];
  if (fr < s.t1) return { p: pointAt(s, s.len * progress(s, fr)).p, lift: 0, drawing: true };
  const A = s.pts[s.pts.length - 1];
  const n = ALL[i + 1];
  if (!n) {
    const q = ease(interpolate(fr, [s.t1, s.t1 + 12], [0, 1], clamp));
    return { p: lerp(A, REST, q), lift: Math.min(1, q * 3), drawing: false };
  }
  const gap = n.t0 - s.t1;
  const B = n.pts[0];
  if (gap > 26) {
    if (fr < s.t1 + 10) {
      const q = ease((fr - s.t1) / 10);
      return { p: lerp(A, REST, q), lift: Math.min(1, q * 3), drawing: false };
    }
    if (fr > n.t0 - 10) {
      const q = ease((fr - (n.t0 - 10)) / 10);
      return { p: lerp(REST, B, q), lift: Math.min(1, (1 - q) * 3), drawing: false };
    }
    return { p: REST, lift: 1, drawing: false };
  }
  const q = Math.max(0, Math.min(1, (fr - s.t1) / Math.max(0.01, gap)));
  return { p: lerp(A, B, ease(q)), lift: Math.min(1, Math.sin(Math.PI * q) * 1.6), drawing: false };
};
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

const PenShape: React.FC<{ fill?: string }> = ({ fill }) => (
  <g>
    <polygon points="0,0 -5,-15 5,-15" fill={fill ?? INK} />
    <polygon points="-5,-15 -10,-30 10,-30 5,-15" fill={fill ?? "#cfc8bc"} />
    <rect x={-11} y={-150} width={22} height={124} rx={8} fill={fill ?? "#1c1c1c"} />
    {fill ? null : <rect x={-6.5} y={-144} width={4} height={108} rx={2} fill="rgba(255,255,255,.22)" />}
    <rect x={-11} y={-64} width={22} height={11} fill={fill ?? RED} />
    <rect x={-11.5} y={-162} width={23} height={18} rx={7} fill={fill ?? "#2b2b2b"} />
  </g>
);
const Pen: React.FC<{ fr: number }> = ({ fr }) => {
  const { p, lift, drawing } = penAt(fr);
  const jig = drawing ? Math.sin(fr * 1.9) * 2.2 : 0;
  const ang = 30 + jig + lift * 4;
  const tx = p[0] + lift * 5, ty = p[1] - lift * 13;
  return (
    <svg width={SB.w} height={SB.h} style={{ position: "absolute", left: 0, top: LIFT, overflow: "visible", pointerEvents: "none" }}>
      <defs>
        <filter id="pen-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={3 + lift * 3} />
        </filter>
      </defs>
      <g transform={`translate(${p[0] + 9 + lift * 16} ${p[1] + 7 + lift * 12}) rotate(${ang})`} opacity={0.22 - lift * 0.08} filter="url(#pen-blur)">
        <PenShape fill="#000" />
      </g>
      <g transform={`translate(${tx} ${ty}) rotate(${ang})`}>
        <PenShape />
      </g>
    </svg>
  );
};

const PAPER_BG: React.CSSProperties = {
  background: PAPER,
  backgroundImage: "radial-gradient(rgba(21,21,21,.16) 1.3px, transparent 1.5px)",
  backgroundSize: "26px 26px",
  backgroundPosition: "9px 9px",
};

export const Storyboard: React.FC = () => {
  const fr = useCurrentFrame();
  const enter = spring({ frame: fr - 4, fps: 30, config: { damping: 16, stiffness: 120 } });
  let pi = 0;
  for (let i = 0; i < PAGES.length; i++) if (fr >= PAGES[i].s) pi = i;
  const pg = PAGES[pi];
  const prev = pi > 0 ? PAGES[pi - 1] : null;
  const flipT = prev ? interpolate(fr - pg.s, [0, 7], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) }) : 1;
  const flipping = prev && flipT < 1;
  return (
    <div style={{ position: "absolute", left: SB.x, top: SB.y, width: SB.w, height: SB.h, borderRadius: 28, overflow: "hidden", opacity: Math.min(1, enter * 1.4), transform: `translateX(${(1 - enter) * -80}px)`,
      ...PAPER_BG, boxShadow: "0 30px 70px rgba(0,0,0,.55), 0 10px 24px rgba(0,0,0,.35)" }}>
      {/* soft paper light */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 70% at 20% 10%, rgba(255,255,255,.45) 0%, rgba(255,255,255,0) 60%)" }} />
      <Sheet pg={pg} fr={fr} />
      {flipping && prev ? (
        <>
          {/* the shadow the lifting page casts on the new one */}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(0,0,0,${0.18 * (1 - flipT)}) 0%, rgba(0,0,0,0) ${30 + flipT * 40}%)` }} />
          <div style={{ position: "absolute", inset: 0, perspective: 2200 }}>
            <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 0%", transform: `rotateX(${flipT * 100}deg)`, backfaceVisibility: "hidden", ...PAPER_BG }}>
              <Sheet pg={prev} fr={fr} frozen />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(0deg, rgba(0,0,0,${0.25 * flipT}) 0%, rgba(0,0,0,0) 60%)` }} />
            </div>
          </div>
        </>
      ) : null}
      <Pen fr={fr} />
    </div>
  );
};
