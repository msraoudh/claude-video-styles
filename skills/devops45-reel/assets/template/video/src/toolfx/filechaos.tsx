import React from "react";
import { fontInter, fontMono } from "../kit/fonts";
import { B, glass } from "../lib/look";
import { rand } from "../lib/sync";
import { AMBER, AnamorphicFlare, clamp01, CYAN, decay, EASE_IN, EASE_IN_OUT, EASE_OUT, ICE, iv, rgba, type RGB } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/*
 * Concept « filechaos » — « Sans outil, on copie des fichiers et on s'y perd. » (no version control = copies everywhere)
 * 0      a glass folder window « Documents » settles; « rapport_final.docx » pops in the middle (counter « 1 fichier »).
 * 14     COPY: a duplicate peels off it and slides into place below while its new suffix types in: « …_v2 ».
 * 26     COPY: again — « rapport_VRAIMENT_final » (the list re-centres each time).
 * 40     CHAOS: the neat list wobbles, tilts and collapses to the bottom of the window; then 12 sillier, longer copies
 *        (« _v2_OK_def », « Copie de… », « _NE_PAS_TOUCHER », « _v2_OK_def_FINAL(3) »…) are thrown in from both sides,
 *        faster and faster (58 → 95), each landing on the pile with a squash, dust and a rattle of the whole heap.
 * 96     the heap slumps into a messy mound (dust along the floor); the counter reads « 15 fichiers ».
 * 86     PERDU: a cursor drifts in, stops on a file, shakes its head — an amber « ? » pops (100, flare) — moves on…
 * 114    …the « ? » stretches into « lequel ? ».
 * idle   the cursor keeps hesitating between three files (each lights up when hovered), the bubble pulses on every
 *        stop, the heap breathes, a light sweeps the window now and then.
 */

type Seg = [string, 0 | 1]; // text, highlighted (the part that changed)
type F = { segs: Seg[]; slot: [number, number, number] };

const FILES: F[] = [
  { segs: [["rapport_final", 0]], slot: [380, 594, -8] },
  { segs: [["rapport_final", 0], ["_v2", 1]], slot: [478, 642, 5] },
  { segs: [["rapport_", 0], ["VRAIMENT_", 1], ["final", 0]], slot: [282, 652, -4] },
  { segs: [["rapport_final", 0], ["_v2_OK_def", 1]], slot: [540, 572, 13] },
  { segs: [["rapport_final", 0], ["_FINAL(1)", 1]], slot: [228, 560, -15] },
  { segs: [["Copie de ", 1], ["rapport_final", 0]], slot: [420, 528, 6] },
  { segs: [["rapport_final", 0], ["_v3_corrigé", 1]], slot: [292, 490, 16] },
  { segs: [["rapport_final", 0], ["_NE_PAS_TOUCHER", 1]], slot: [500, 474, -10] },
  { segs: [["rapport_", 0], ["VRAIMENT_", 1], ["final", 0], ["_v2", 1]], slot: [372, 440, -4] },
  { segs: [["rapport_final", 0], ["_relu_Marc", 1]], slot: [246, 404, -18] },
  { segs: [["rapport_final", 0], ["_v2 (2)", 1]], slot: [528, 398, 9] },
  { segs: [["rapport_final", 0], ["_def_OK_v4", 1]], slot: [408, 368, 13] },
  { segs: [["rapport_final", 0], ["_LAST_last", 1]], slot: [300, 336, -8] },
  { segs: [["rapport_final", 0], ["_def_def_def", 1]], slot: [486, 312, -3] },
  { segs: [["rapport_final", 0], ["_v2_OK_def_FINAL(3)", 1]], slot: [372, 270, -4] },
];
const N = FILES.length;
const CX = 380;

// ── timing (frames after f0) ──
const COPY = [2, 14, 26]; // tile 0 pops, tiles 1 & 2 peel off
const COPY_D = 12;
const FALL = [46, 43, 40]; // the neat list collapses (bottom tile first)
const FALL_D = 13;
const LANDC = [58, 64, 69, 74, 78, 81, 84, 87, 89, 91, 93, 95]; // tiles 3..14 land on the pile
const flyD = (i: number) => Math.max(10, 15 - (i - 3) * 0.5);
const LAND = [FALL[0] + FALL_D, FALL[1] + FALL_D, FALL[2] + FALL_D, ...LANDC];
const BORN = [COPY[0], COPY[1], COPY[2], ...LANDC]; // when the counter counts it
const DIR = [0, 0, 0, 1, -1, 1, 1, -1, 1, -1, -1, 1, -1, 1, -1];
const SLUMP: [number, number] = [96, 108];
const CUR_IN = 86;
const Q_POP = 100;
const MORPH: [number, number] = [114, 124];
const HOVER = [14, 9, 12]; // the files the cursor hesitates between (each lifts out of the pile when hovered)
const SCALE_C = 0.84; // chaos tiles
const NEAT_S = 1.1; // the first three, while they are still a tidy list
const FALL_S = 0.92;
const LIFT = { s: 0.08, r: 0.6, y: 12 }; // hovered tile: grows, straightens, rises

/** approximate tile width (icon + name, Inter 700 29px ≈ 15.4 px/char) → where its icon sits, for the cursor */
const tileW = (i: number) => 98 + 15.4 * (FILES[i].segs.reduce((m, [s]) => m + s.length, 0) + 5);
const slumpDy = (sy: number, slump: number) => slump * (690 - sy) * 0.05;
const iconAt = (i: number, slump: number): [number, number] => {
  const [sx, sy, sr] = FILES[i].slot;
  const sc = (i < 3 ? FALL_S : SCALE_C) * (1 + LIFT.s);
  const a = (sr * (1 - LIFT.r) * Math.PI) / 180;
  const off = (-tileW(i) / 2 + 38) * sc;
  return [sx + off * Math.cos(a) + 8, sy + slumpDy(sy, slump) - LIFT.y + off * Math.sin(a) + 2];
};

// ── window ──
const WIN = { x: 44, y: 64, w: 672, h: 640 };
const BAR = 74;

/** neat-list y of tile i while k (continuous) tiles are listed */
const neatY = (i: number, k: number) => 404 + (i - (k - 1) / 2) * 104;

/** small document glyph */
const DocIcon: React.FC = () => (
  <svg width={40} height={50} viewBox="0 0 40 50" style={{ flexShrink: 0, overflow: "visible", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.45))" }}>
    <path d="M5 2 H27 L38 13 V45 Q38 48 35 48 H5 Q2 48 2 45 V5 Q2 2 5 2 Z" fill="#E9F8FF" />
    <path d="M27 2 V10 Q27 13 30 13 H38 Z" fill="#8FD8EE" />
    <rect x={8} y={18} width={17} height={3.2} rx={1.6} fill="#7E9DB8" />
    <rect x={8} y={24.5} width={24} height={3.2} rx={1.6} fill="#9DB7CC" />
    <rect x={8} y={31} width={20} height={3.2} rx={1.6} fill="#9DB7CC" />
    <path d="M2 38 H38 V45 Q38 48 35 48 H5 Q2 48 2 45 Z" fill="#0EA5C6" />
  </svg>
);

/** one file tile: icon + name (changed part in cyan), opaque so a pile reads */
const Tile: React.FC<{ segs: Seg[]; typed: number; hot: number; caret: boolean }> = ({ segs, typed, hot, caret }) => {
  const hlTotal = segs.reduce((m, [s, h]) => m + (h ? s.length : 0), 0);
  let left = Math.round(typed * hlTotal);
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 14,
        height: 82,
        padding: "0 26px 0 18px",
        borderRadius: 20,
        flexShrink: 0,
        whiteSpace: "nowrap",
        background: "linear-gradient(160deg, #18315A 0%, #0E1E3D 55%, #0A1631 100%)",
        border: `1.5px solid ${rgba(hot > 0.02 ? ICE : CYAN, 0.32 + 0.6 * hot)}`,
        boxShadow: [
          "0 12px 28px rgba(0,0,0,0.6)",
          "inset 0 1px 0 rgba(255,255,255,0.16)",
          "inset 0 -1px 0 rgba(0,0,0,0.5)",
          `0 0 ${(10 + 34 * hot).toFixed(1)}px ${rgba(CYAN, 0.12 + 0.5 * hot)}`,
        ].join(", "),
      }}
    >
      <DocIcon />
      <span style={{ fontFamily: fontInter, fontWeight: 700, fontSize: 29, letterSpacing: "-0.015em", color: B.white }}>
        {segs.map(([s, h], j) => {
          if (!h) return <span key={j}>{s}</span>;
          const n = Math.max(0, Math.min(s.length, left));
          left -= n;
          return n > 0 ? (
            <span key={j} style={{ color: "#67E8F9", textShadow: "0 0 14px rgba(34,211,238,0.55)" }}>
              {s.slice(0, n)}
            </span>
          ) : null;
        })}
        {caret ? <span style={{ display: "inline-block", width: 3, height: 30, marginLeft: 2, verticalAlign: "-4px", background: "#A5F3FC", boxShadow: "0 0 8px #22D3EE" }} /> : null}
        <span style={{ color: B.text3 }}>.docx</span>
      </span>
    </div>
  );
};

/** classic arrow pointer, tip at (0,0) */
const Cursor: React.FC<{ press: number }> = ({ press }) => (
  <svg width={46} height={64} viewBox="0 0 46 64" style={{ position: "absolute", left: -4, top: -3, overflow: "visible", transform: `scale(${(1 - 0.12 * press).toFixed(3)})`, transformOrigin: "4px 3px", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6)) drop-shadow(0 0 10px rgba(190,240,255,0.35))" }}>
    <path d="M4 3 L4 49 L15.5 38.5 L23.5 57 L31 53.8 L23 35.5 L38.5 35.5 Z" fill="#FFFFFF" stroke="#04070F" strokeWidth={3} strokeLinejoin="round" />
  </svg>
);

type Pose = { x: number; y: number; r: number; s: number; o: number; blur: number; sq: number; ghosts: Array<[number, number, number]> };

export const FileChaosFx: ToolFx = ({ g, f0, size }) => {
  const t = g - f0;
  const k = size / 760;

  const appear = iv(t, [0, 12], [0, 1], EASE_OUT);
  const cps = [1, 2].map((i) => iv(t, [COPY[i], COPY[i] + COPY_D], [0, 1], EASE_OUT));
  const kList = 1 + cps[0] + cps[1];

  // rattle: every landing jolts the whole heap
  const rattle = LAND.reduce((m, l) => m + decay(t - l, 5), 0);
  const slump = iv(t, SLUMP, [0, 1], EASE_IN_OUT);
  const idle = clamp01((t - 110) / 30);
  const count = BORN.filter((b) => t >= b).length;
  const lastBorn = BORN.reduce((m, b) => (t >= b ? b : m), -99);
  const shake = Math.sin(t * 2.3) * Math.min(1.4, rattle) * 3.2;

  // ── cursor ──
  const tg = HOVER.map((i) => iconAt(i, slump));
  const curStart: [number, number] = [740, 150];
  let cur: [number, number] = curStart;
  let hovered = -1;
  let hoverA = 0;
  let stops: number[] = [Q_POP];
  if (t >= CUR_IN) {
    const p = iv(t, [CUR_IN, Q_POP], [0, 1], EASE_IN_OUT);
    cur = [curStart[0] + (tg[0][0] - curStart[0]) * p, curStart[1] + (tg[0][1] - curStart[1]) * p];
    hovered = 0;
    hoverA = iv(t, [Q_POP - 4, Q_POP + 2], [0, 1]);
    if (t >= 106) {
      const s = t - 106;
      const seg = Math.floor(s / 26);
      const u = s - seg * 26;
      const from = seg % 3;
      const to = (seg + 1) % 3;
      const m = iv(u, [0, 12], [0, 1], EASE_IN_OUT);
      cur = [tg[from][0] + (tg[to][0] - tg[from][0]) * m, tg[from][1] + (tg[to][1] - tg[from][1]) * m - Math.sin(m * Math.PI) * 26];
      hovered = m < 0.6 ? from : to;
      hoverA = m < 0.6 ? iv(u, [0, 5], [1, 0]) : iv(u, [9, 14], [0, 1]);
      stops = [Q_POP, 106 + seg * 26 + 12, 106 + (seg - 1) * 26 + 12];
    }
    // hesitation: head-shake on the « ? », a little jitter while waiting
    const hs = t >= Q_POP ? Math.sin((t - Q_POP) * 1.5) * 9 * Math.exp(-(t - Q_POP) / 7) : 0;
    cur = [cur[0] + hs + Math.sin(t * 0.45) * 1.6 * idle, cur[1] + Math.cos(t * 0.37) * 1.4 * idle];
  }
  const curO = iv(t, [CUR_IN, CUR_IN + 6], [0, 1]);
  const stopAge = stops.reduce((m, s) => (t >= s ? Math.min(m, t - s) : m), 999);
  const press = t >= CUR_IN && stopAge < 10 ? decay(stopAge, 3) : 0;

  // ── bubble « ? » → « lequel ? » ──
  const qA = t - Q_POP;
  const qS = qA < 0 ? 0 : qA < 6 ? iv(qA, [0, 6], [0, 1.28], EASE_OUT) : iv(qA, [6, 13], [1.28, 1], EASE_OUT);
  const morph = iv(t, MORPH, [0, 1], EASE_IN_OUT);
  const bubPulse = t > MORPH[1] ? decay(stopAge, 8) * 0.1 : 0;
  const bubW = 70 + (238 - 70) * morph;
  const bob = Math.sin(t * 0.09) * 4;

  // ── window ──
  const sweepAt = t < 60 ? 4 : 140 + Math.floor((t - 140) / 110) * 110;
  const sweepU = t >= sweepAt ? (t - sweepAt) / 26 : -1;
  const winGlow = 0.6 + 0.5 * Math.min(1, rattle * 0.5);

  // ── tiles ──
  const pose = (i: number): Pose | null => {
    const [sx, sy, sr] = FILES[i].slot;
    // after landing on the pile
    const settled = (land: number, sc: number): Pose => {
      const a = t - land;
      const bounce = a >= 0 ? -Math.sin(clamp01(a / 10) * Math.PI) * 9 * Math.exp(-a / 6) : 0;
      const sq = a >= 0 ? Math.sin(clamp01(a / 12) * Math.PI * 2) * Math.exp(-a / 5) : 0;
      const jr = rattle * (rand(i * 3.1 + 1) - 0.5) * 3.4;
      const jx = rattle * (rand(i * 5.3 + 2) - 0.5) * 7;
      const jy = rattle * 2.5;
      const sl = slumpDy(sy, slump);
      const br = Math.sin(g * 0.05 + i * 1.3) * 1.3 * idle;
      return { x: sx + jx, y: sy + bounce + jy + sl + br, r: sr + jr + slump * (rand(i * 7.7) - 0.5) * 5, s: sc, o: 1, blur: 0, sq, ghosts: [] };
    };
    if (i < 3) {
      if (t < COPY[i]) return null;
      const y0 = neatY(i, kList);
      let x = CX;
      let y = y0;
      let o = 1;
      let s = NEAT_S;
      if (i === 0) {
        const a = t - COPY[0];
        s = NEAT_S * (a < 7 ? iv(a, [0, 7], [0, 1.12], EASE_OUT) : iv(a, [7, 14], [1.12, 1], EASE_OUT));
      } else {
        const p = cps[i - 1];
        const ys = neatY(i - 1, kList) + 12;
        x = CX + 16 * (1 - p);
        y = ys + (y0 - ys) * p;
        o = iv(p, [0, 0.2], [0.35, 1]);
      }
      const fs = FALL[i];
      if (t < fs) {
        const w = t >= fs - 9 ? Math.sin((t - (fs - 9)) * 1.25) * 3.5 * iv(t, [fs - 9, fs - 4], [0, 1]) : 0;
        return { x, y, r: w, s, o, blur: 0, sq: 0, ghosts: [] };
      }
      const p = iv(t, [fs, fs + FALL_D], [0, 1]);
      if (p < 1) {
        const yy = y + (sy - y) * EASE_IN(p);
        const xx = x + (sx - x) * EASE_IN_OUT(p);
        const rr = sr * EASE_OUT(p) + Math.sin((t - fs) * 1.25) * 3.5 * (1 - p);
        return { x: xx, y: yy, r: rr, s: NEAT_S + (FALL_S - NEAT_S) * p, o: 1, blur: p > 0.4 ? (p - 0.4) * 5 : 0, sq: 0, ghosts: [] };
      }
      return settled(fs + FALL_D, FALL_S);
    }
    const land = LAND[i];
    const d = flyD(i);
    if (t < land - d) return null;
    if (t < land) {
      const dir = DIR[i];
      const x0 = dir > 0 ? 1150 : -390;
      const y0 = sy - 230 - rand(i * 2.9) * 110;
      const r0 = sr - dir * (34 + rand(i * 4.1) * 20);
      const at = (u: number): [number, number, number] => {
        const uu = clamp01(u);
        const ex = 1 - (1 - uu) * (1 - uu);
        return [x0 + (sx - x0) * ex, y0 + (sy - y0) * uu * uu, r0 + (sr - r0) * EASE_OUT(uu)];
      };
      const u = (t - (land - d)) / d;
      const [x, y, r] = at(u);
      return { x, y, r, s: SCALE_C, o: 1, blur: 2.5 * (1 - u), sq: 0, ghosts: [at(u - 0.14), at(u - 0.28)] };
    }
    return settled(land, SCALE_C);
  };

  const hotOf = (i: number) => (hovered >= 0 && HOVER[hovered] === i ? hoverA * curO : 0);
  const base = t >= FALL[2] ? [2, 1, 0, ...Array.from({ length: N - 3 }, (_, j) => j + 3)] : Array.from({ length: N }, (_, j) => j);
  // the hovered file is lifted out of the pile → drawn on top
  const order = [...base.filter((i) => hotOf(i) <= 0.5), ...base.filter((i) => hotOf(i) > 0.5)];

  // dust motes on every landing + along the floor on the slump
  const motes: React.ReactNode[] = [];
  const burst = (age: number, n: number, seed: number, ox: number, oy: number, spread: number, col: RGB, life: number) => {
    if (age < 0 || age > life) return;
    for (let j = 0; j < n; j++) {
      const r1 = rand(seed + j * 7.1);
      const r2 = rand(seed + j * 3.3 + 1);
      const x = ox + (r1 - 0.5) * spread + (r1 - 0.5) * 9 * age;
      const y = oy - (2 + r2 * 5) * age + 0.22 * age * age;
      const a = 1 - age / life;
      motes.push(<circle key={`${seed}-${j}`} cx={x} cy={y} r={1.4 + r2 * 2 * a} fill={rgba(j % 3 === 0 ? ICE : col, 0.7 * a)} style={{ filter: "drop-shadow(0 0 4px rgba(34,211,238,0.8))" }} />);
    }
  };
  for (let i = 0; i < N; i++) burst(t - LAND[i], 5, 31 + i * 13, FILES[i].slot[0], FILES[i].slot[1] + 38, 320, CYAN, 12);
  // soft dust puffs rolling out from under the heap when it slumps
  const puffA = t - SLUMP[0] - 2;
  const puffs =
    puffA >= 0 && puffA < 28
      ? Array.from({ length: 7 }, (_, j) => {
          const side = j % 2 ? 1 : -1;
          const x = CX + side * (30 + j * 30) + side * puffA * (0.6 + rand(j * 3.3) * 0.8);
          const y = 680 - puffA * (0.5 + rand(j * 1.7) * 0.6);
          const r = 30 + puffA * 1.6 + rand(j * 5.1) * 16;
          const a = 0.2 * Math.sin(clamp01(puffA / 28) * Math.PI) * (0.6 + 0.4 * rand(j));
          return <div key={j} style={{ position: "absolute", left: x - r, top: y - r * 0.6, width: r * 2, height: r * 1.2, borderRadius: "50%", background: `radial-gradient(closest-side, rgba(190,225,255,${a.toFixed(3)}), rgba(190,225,255,0))` }} />;
        })
      : null;
  // ring when a copy lands in the list
  const copyRings = [1, 2].map((i) => t - (COPY[i] + COPY_D - 2));

  const tileEl = (i: number) => {
    const P0 = pose(i);
    if (!P0) return null;
    const hot = hotOf(i);
    const P: Pose = hot > 0 ? { ...P0, s: P0.s * (1 + LIFT.s * hot), r: P0.r * (1 - LIFT.r * hot), y: P0.y - LIFT.y * hot } : P0;
    const typed = i === 1 || i === 2 ? iv(t, [COPY[i] + 3, COPY[i] + 12], [0, 1]) : 1;
    const caret = (i === 1 || i === 2) && t >= COPY[i] && t < COPY[i] + 18;
    const born = i === 0 ? decay(t - COPY[0], 8) : 0;
    const ringAge = i === 1 || i === 2 ? copyRings[i - 1] : -1;
    const el = (x: number, y: number, r: number, o: number, blur: number, key: string, ghost: boolean) => (
      <div key={key} style={{ position: "absolute", left: x, top: y, width: 0, height: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: o }}>
        <div
          style={{
            position: "relative",
            flexShrink: 0,
            transform: `rotate(${r.toFixed(2)}deg) scale(${(P.s * (1 + 0.07 * P.sq)).toFixed(4)}, ${(P.s * (1 - 0.1 * P.sq)).toFixed(4)})`,
            filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : !ghost && hot > 0.02 ? `drop-shadow(0 ${(18 * hot).toFixed(1)}px ${(22 * hot).toFixed(1)}px rgba(0,0,0,${(0.55 * hot).toFixed(2)}))` : undefined,
          }}
        >
          <Tile segs={FILES[i].segs} typed={typed} hot={ghost ? 0.3 : Math.max(hot, 0.6 * born, ringAge >= 0 ? 0.7 * decay(ringAge, 8) : 0)} caret={!ghost && caret} />
          {!ghost && ringAge >= 0 && ringAge < 14 ? (
            <div style={{ position: "absolute", inset: -4 - ringAge * 1.6, borderRadius: 24 + ringAge * 1.6, border: `2.5px solid ${rgba(ICE, 0.9 * (1 - ringAge / 14))}` }} />
          ) : null}
        </div>
      </div>
    );
    return (
      <React.Fragment key={i}>
        {P.ghosts.map(([gx, gy, gr], j) => el(gx, gy, gr, (0.28 / (j + 1)) * P.o, 7 + 5 * j, `g${i}-${j}`, true))}
        {el(P.x, P.y, P.r, P.o, P.blur, `t${i}`, false)}
      </React.Fragment>
    );
  };

  const countPop = decay(t - lastBorn, 6);
  const sweepX = sweepU >= 0 && sweepU <= 1 ? -160 + sweepU * (WIN.w + 320) : -9999;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: k !== 1 ? `scale(${k})` : undefined, transformOrigin: "0 0" }}>
      {/* back light */}
      <div style={{ position: "absolute", left: 20, top: 120, width: 720, height: 620, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, 0.13 + 0.08 * Math.min(1, rattle))}, rgba(34,211,238,0))`, filter: "blur(20px)", opacity: appear }} />

      {/* ── the folder window ── */}
      <div
        style={{
          position: "absolute",
          left: WIN.x,
          top: WIN.y,
          width: WIN.w,
          height: WIN.h,
          opacity: appear,
          transform: `translate(${shake.toFixed(2)}px, ${((1 - appear) * 24).toFixed(2)}px) scale(${(0.95 + 0.05 * appear).toFixed(4)})`,
        }}
      >
        <div style={{ position: "absolute", inset: 0, ...glass("34,211,238", winGlow), borderRadius: 30, overflow: "hidden" }}>
          {/* desktop dot grid */}
          <div style={{ position: "absolute", left: 0, right: 0, top: BAR, bottom: 0, backgroundImage: "radial-gradient(rgba(148,190,255,0.12) 1.6px, rgba(0,0,0,0) 1.8px)", backgroundSize: "30px 30px", backgroundPosition: "12px 10px" }} />
          {/* title bar */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: BAR, borderBottom: "1px solid rgba(255,255,255,0.09)", background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))", display: "flex", alignItems: "center", padding: "0 22px", gap: 16 }}>
            <div style={{ display: "flex", gap: 9 }}>
              {[0.55, 0.35, 0.22].map((a, j) => (
                <div key={j} style={{ width: 14, height: 14, borderRadius: 7, background: rgba(CYAN, a), boxShadow: `0 0 8px ${rgba(CYAN, a * 0.6)}` }} />
              ))}
            </div>
            <svg width={34} height={28} viewBox="0 0 34 28" style={{ marginLeft: 8 }}>
              <path d="M2 6 Q2 3 5 3 H13 L16 7 H29 Q32 7 32 10 V23 Q32 26 29 26 H5 Q2 26 2 23 Z" fill={rgba(CYAN, 0.22)} stroke={B.cyan} strokeWidth={2.4} strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily: fontInter, fontWeight: 700, fontSize: 28, color: B.white, letterSpacing: "-0.01em" }}>Documents</span>
            <div style={{ flex: 1 }} />
            <div
              style={{
                fontFamily: fontMono,
                fontWeight: 700,
                fontSize: 23,
                color: "#A5F3FC",
                padding: "6px 14px",
                borderRadius: 14,
                background: rgba(CYAN, 0.1 + 0.2 * countPop),
                border: `1px solid ${rgba(CYAN, 0.35 + 0.4 * countPop)}`,
                transform: `scale(${(1 + 0.12 * countPop).toFixed(3)})`,
                opacity: iv(t, [COPY[0], COPY[0] + 6], [0, 1]),
                whiteSpace: "nowrap",
              }}
            >
              {count <= 1 ? "1 fichier" : `${count} fichiers`}
            </div>
          </div>
          {/* light sweep */}
          {sweepX > -9000 ? (
            <div style={{ position: "absolute", top: -80, bottom: -80, left: sweepX, width: 110, transform: "skewX(-18deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.12), rgba(255,255,255,0))" }} />
          ) : null}
        </div>
      </div>

      {/* contact shadow of the pile */}
      <div style={{ position: "absolute", left: 70, top: 640, width: 620, height: 100, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(0,0,0,0.55), rgba(0,0,0,0))", opacity: iv(t, [50, 100], [0, 1]) }} />

      {/* ── the files ── */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: `translateX(${shake.toFixed(2)}px)` }}>{order.map(tileEl)}</div>

      {puffs}
      <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
        {motes}
      </svg>

      {/* ── the lost cursor + its « ? » ── */}
      {curO > 0.01 ? (
        <div style={{ position: "absolute", left: cur[0], top: cur[1], width: 0, height: 0, opacity: curO }}>
          {qS > 0.01 ? (
            <>
              <svg width={30} height={36} viewBox="0 0 30 36" style={{ position: "absolute", left: 20, top: -70 + bob, overflow: "visible", transform: `scale(${qS.toFixed(3)})`, transformOrigin: "30% 0%" }}>
                <path d="M12 0 L30 0 L6 30 Z" fill="#EE9408" />
              </svg>
              <div
                style={{
                  position: "absolute",
                  left: 30,
                  top: -138 + bob,
                  height: 72,
                  width: bubW,
                  borderRadius: 36,
                  transform: `scale(${(qS * (1 + bubPulse)).toFixed(3)})`,
                  transformOrigin: "0% 100%",
                  background: "linear-gradient(150deg, #FFC966 0%, #F59E0B 60%, #E08A00 100%)",
                  boxShadow: `0 0 ${(26 + 30 * decay(qA, 10)).toFixed(1)}px ${rgba(AMBER, 0.6)}, 0 10px 24px rgba(0,0,0,0.5), inset 0 1.5px 0 rgba(255,255,255,0.55)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ position: "absolute", fontFamily: fontInter, fontWeight: 800, fontSize: 48, color: "#1A1205", opacity: 1 - iv(morph, [0, 0.4], [0, 1]) }}>?</span>
                <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 35, color: "#1A1205", letterSpacing: "-0.01em", opacity: iv(morph, [0.45, 1], [0, 1]), transform: `translateX(${((1 - morph) * 10).toFixed(1)}px)` }}>lequel ?</span>
              </div>
            </>
          ) : null}
          <Cursor press={press} />
        </div>
      ) : null}

      {/* flare box = the full 1080 frame width (stage sits at x 160) so the streak fades out instead of being cut at the stage edge */}
      <div style={{ position: "absolute", left: -160, top: 0, width: 1080, height: 760, pointerEvents: "none" }}>
        <AnamorphicFlare age={qA} x={cur[0] + 65 + 160} y={cur[1] - 102} col={AMBER} dur={26} size={110} streakH={70} strength={0.6} />
      </div>
    </div>
  );
};
