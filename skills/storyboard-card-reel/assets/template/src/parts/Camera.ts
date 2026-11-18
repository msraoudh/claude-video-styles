import { Easing, spring } from "remotion";
import clean from "../data/clean.json";
import { at, end } from "../lib/time";

/**
 * Camera engine (v5). Everything is a pure function of the frame, so Studio scrubbing and the render agree.
 *
 * Per shot (= one line of the script, from cues.tsx SHOTS):
 *   scale  base framing (wide ≈1.035 / close ≈1.28, hard cut between lines)
 *   move   slow push-in (+) or pull-out (−) over the whole shot, ease in-out
 *   drift  lateral px over the shot (sign = direction), plus a light seeded handheld (≈2 px, 0.08°)
 *   punch  snap zooms on stressed words: in 1–2 frames, overshoot, settle, then HOLD the tighter frame to the end of the shot
 *   alt    jump-cut hiding: at every clean-cut piece boundary inside the shot the framing changes (+alt / +alt/2, ±12 px)
 *   pinTop big-word lines: the frame is pinned to the top so a zoom pushes his hair DOWN and the word behind it stays readable
 *   ramp   [startFrame, amount]: accelerating push (cubic) to the end of the shot = speed-ramp feel before a hard snap
 * The face is the transform origin (49% 33%), so every zoom keeps his eyes where the graphics expect them.
 * Coverage is enforced: translation is clamped so the footage never shows an edge.
 */
export type Shot = {
  from: number;
  scale: number;
  /** legacy (v4): start this much bigger and settle in 6 frames */
  push?: number;
  move?: number;
  drift?: number;
  punch?: [number, number][];
  alt?: number;
  pinTop?: boolean;
  ramp?: [number, number];
};
export type Cam = { scale: number; x: number; y: number; rotate: number; blur: number };

export const ORIGIN = "49% 33%";
const W = 1080, H = 1920, OX = 0.49 * W, OY = 0.33 * H;

const PIECES: number[] = (clean as { pieces: { t0: number }[] }).pieces.map((p) => p.t0);
const inOut = Easing.bezier(0.45, 0, 0.55, 1);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** jump cuts inside a shot that are worth re-framing (both sides ≥ 8 frames, not in a ramp) */
const cutCache = new WeakMap<Shot[], number[][]>();
const innerCuts = (shots: Shot[]) => {
  const hit = cutCache.get(shots);
  if (hit) return hit;
  const all = shots.map((s, i) => {
    const next = shots[i + 1]?.from ?? s.from + 600;
    const out: number[] = [];
    let last = s.from;
    for (const t of PIECES) {
      if (t < s.from + 8 || t > next - 8) continue;
      if (s.ramp && t >= s.ramp[0]) continue;
      if (t - last < 8) continue;
      out.push(t);
      last = t;
    }
    return out;
  });
  cutCache.set(shots, all);
  return all;
};

const shotIndex = (shots: Shot[], fr: number) => {
  let i = 0;
  for (let k = 0; k < shots.length; k++) if (fr >= shots[k].from) i = k;
  return i;
};

/** snap zoom: ~2 frames to the peak, ≈20 % overshoot, settled by frame 8 */
const SNAP = { stiffness: 1200, damping: 22, mass: 0.5 };
const snap = (d: number) => (d < 0 ? 0 : d > 24 ? 1 : spring({ frame: d, fps: 30, config: SNAP }));

/** seeded handheld: three slow sines per axis (0.4–2.1 Hz), never more than ~2 px */
const hand = (fr: number, seed: number) => {
  const t = fr / 30;
  return 0.55 * Math.sin(t * 2.5 + seed) + 0.3 * Math.sin(t * 5.7 + seed * 1.7) + 0.15 * Math.sin(t * 13.1 + seed * 2.9);
};

const continuous = (s: Shot, next: number, fr: number) => {
  let m = 1;
  for (const [pf, amt] of s.punch ?? []) m *= 1 + amt * snap(fr - pf);
  if (s.ramp && fr >= s.ramp[0]) {
    const q = clamp01((fr - s.ramp[0]) / Math.max(1, next - s.ramp[0]));
    m *= 1 + s.ramp[1] * q * q * q;
  }
  return m;
};

export const camAt = (shots: Shot[], fr: number): Cam => {
  const i = shotIndex(shots, fr);
  const s = shots[i];
  const next = shots[i + 1]?.from ?? s.from + 600;
  const local = fr - s.from;
  const p = inOut(clamp01(local / Math.max(1, next - s.from)));

  let S = s.scale;
  // legacy v4 slam (kept for shots that still use it)
  if (s.push) S *= local < 6 ? s.push + (1 - s.push) * (local / 6) : 1;
  const mv = s.move ?? 0;
  S *= mv >= 0 ? 1 + mv * p : 1 + -mv * (1 - p);

  // jump-cut hiding
  const cuts = innerCuts(shots)[i];
  let k = 0;
  for (const t of cuts) if (fr >= t) k++;
  const alt = s.alt ?? 0.07;
  const dir = (s.drift ?? 10) >= 0 ? 1 : -1;
  const pattern: [number, number][] = [[0, 0], [alt, 12], [alt * 0.5, -10]];
  const [aS, aX] = pattern[k % 3];
  S *= 1 + aS;

  // punches + ramp
  const cont = continuous(s, next, fr);
  S *= cont;

  let x = (s.drift ?? 10) * (p * 2 - 1) + aX * dir + 1.8 * hand(fr, 1.3);
  let y = -dir * 4 * (p * 2 - 1) + 1.3 * hand(fr, 4.1);
  const rotate = 0.08 * hand(fr, 7.7);

  // coverage: keep every edge outside the frame (rotation margin included)
  const r = Math.abs((rotate * Math.PI) / 180);
  const mx = (H / 2) * Math.sin(r) + 1, my = (W / 2) * Math.sin(r) + 1;
  const fit = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v)));
  if (s.pinTop) y = OY * (S - 1) - my - 2; // top pinned: zoom grows downward, his hair goes down, the big word stays clear
  x = fit(x, -(W - OX) * (S - 1) + mx, OX * (S - 1) - mx);
  y = fit(y, -(H - OY) * (S - 1) + my, OY * (S - 1) - my);

  // motion blur only from continuous motion (punch snaps, ramp), never across a cut
  const prev = local > 0 ? continuous(s, next, fr - 1) : cont;
  const blur = Math.min(5, Math.abs(cont / prev - 1) * 75);
  return { scale: S, x, y, rotate, blur: blur < 0.3 ? 0 : blur };
};

/* ================= transitions (whole-frame, captions excluded) ================= */

export type TrKind = "whipL" | "whipR" | "whipU" | "zoom" | "flash" | "redflash" | "shake" | "spin" | "spinL" | "snap";
export type Transition = { at: number; kinds: TrKind[]; label: string };

/** 13 transitions on the section changes / strong beats; 4–8 frames each */
export const TRANSITIONS: Transition[] = [
  { at: at("crowd"), kinds: ["whipU"], label: "into « barsha 3bed » page: vertical whip" },
  { at: at("crea_int"), kinds: ["whipL"], label: "into CRÉATIVITÉ & INTELLIGENCE page: whip pan" },
  { at: at("same"), kinds: ["zoom"], label: "« same tool »: zoom-blur punch" },
  { at: at("example"), kinds: ["flash", "shake"], label: "« par exemple »: white light flash + shake hit" },
  { at: at("second"), kinds: ["spin"], label: "« the second thing »: rotation snap 4°" },
  { at: at("capacity") - 2, kinds: ["whipR"], label: "into CAPACITÉ page: whip pan" },
  { at: at("perfect"), kinds: ["zoom"], label: "into « réponse parfaite » page: zoom-blur punch" },
  { at: at("risk"), kinds: ["redflash", "shake"], label: "« tu risques »: red light flash + shake hit" },
  { at: at("diff"), kinds: ["whipL"], label: "out of the risk page → « la différence »: whip pan" },
  { at: at("mirror"), kinds: ["spinL"], label: "« donc… » conclusion: rotation snap −4°" },
  { at: at("dont") - 2, kinds: ["snap", "shake"], label: "DON'T: slow ramp push then hard zoom snap + hit" },
  { at: end("dont") + 1, kinds: ["whipR"], label: "out of DON'T → « learn how to be smart »: whip pan" },
  { at: at("final"), kinds: ["flash", "zoom"], label: "final line: white flash + zoom-blur" },
];

export type TFX = { x: number; y: number; scale: number; rotate: number; bx: number; by: number; flash: number; flashRed: boolean };
const IDLE: TFX = { x: 0, y: 0, scale: 1, rotate: 0, bx: 0, by: 0, flash: 0, flashRed: false };

const kind = (k: TrKind, d: number, o: TFX) => {
  // out phase (before the cut): p rises to 1 at the cut; in phase: q falls from 1 at the cut
  const pOut = (n: number) => clamp01((d + n + 1) / (n + 1));
  const qIn = (n: number) => clamp01(1 - d / (n + 1));
  switch (k) {
    case "whipL":
    case "whipR":
    case "whipU": {
      if (d < -3 || d > 3) return;
      const dir = k === "whipL" ? -1 : 1;
      const e = d < 0 ? pOut(3) ** 2 : qIn(3) ** 2;
      const off = d < 0 ? e : -e; // keeps travelling the same way: leaves on one side, enters from the other
      const amp = k === "whipU" ? 230 : 150;
      if (k === "whipU") { o.y += -off * amp; o.by = Math.max(o.by, e * 60); }
      else { o.x += dir * off * amp; o.bx = Math.max(o.bx, e * 55); }
      o.scale *= 1 + 0.24 * e;
      return;
    }
    case "zoom": {
      if (d < -2 || d > 3) return;
      if (d < 0) { const e = pOut(2) ** 2; o.scale *= 1 + 0.15 * e; o.bx = Math.max(o.bx, 9 * e); o.by = Math.max(o.by, 9 * e); }
      else { const e = qIn(3) ** 2; o.scale *= 1 + 0.3 * e; o.bx = Math.max(o.bx, 12 * e); o.by = Math.max(o.by, 12 * e); }
      return;
    }
    case "flash":
    case "redflash": {
      const curve: Record<number, number> = { [-1]: 0.3, 0: 0.85, 1: 0.5, 2: 0.22, 3: 0.07 };
      const v = curve[d] ?? 0;
      if (v > o.flash) { o.flash = v; o.flashRed = k === "redflash"; }
      if (d >= 0 && d <= 3) o.scale *= 1 + 0.05 * qIn(3);
      return;
    }
    case "shake": {
      if (d < 0 || d > 6) return;
      const dec = (1 - d / 7) ** 1.5;
      o.x += 26 * Math.sin(d * 2.5 + 0.6) * dec;
      o.y += 15 * Math.cos(d * 3.3) * dec;
      o.rotate += 0.6 * Math.sin(d * 2.1 + 0.4) * dec;
      o.scale *= 1 + 0.07 * dec;
      if (d === 0) { o.bx = Math.max(o.bx, 3); o.by = Math.max(o.by, 3); }
      return;
    }
    case "spin":
    case "spinL": {
      if (d < -2 || d > 4) return;
      const dir = k === "spin" ? 1 : -1;
      if (d < 0) { const e = pOut(2) ** 2; o.rotate += -dir * 1.2 * e; o.scale *= 1 + 0.08 * e; o.bx = Math.max(o.bx, 5 * e); o.by = Math.max(o.by, 5 * e); }
      else { const e = qIn(4) ** 2; o.rotate += dir * 4 * e; o.scale *= 1 + 0.22 * e; o.bx = Math.max(o.bx, 9 * e); o.by = Math.max(o.by, 9 * e); }
      return;
    }
    case "snap": {
      if (d < 0 || d > 4) return;
      const e = qIn(4) ** 2;
      o.scale *= 1 + 0.25 * e; // the ramp already took him to ≈1.5: keep the crash zoom short of cropping his eyes
      o.bx = Math.max(o.bx, 12 * e);
      o.by = Math.max(o.by, 12 * e);
      return;
    }
  }
};

export const tfxAt = (fr: number): TFX => {
  const o: TFX = { ...IDLE };
  for (const t of TRANSITIONS) {
    const d = fr - t.at;
    if (d < -4 || d > 7) continue;
    for (const k of t.kinds) kind(k, d, o);
  }
  return o;
};
