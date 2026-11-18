import React from "react";
import { Logo } from "../kit/Logo";
import { fontInter, fontMono } from "../kit/fonts";
import { glass } from "../lib/look";
import { rand } from "../lib/sync";
import { AMBER, AnamorphicFlare, clamp01, CYAN, decay, EASE_IN, EASE_IN_OUT, EASE_OUT, ICE, iv, rgba, Shockwave, type RGB } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/*
 * « C'est comme les sauvegardes d'un jeu vidéo. Chaque sauvegarde s'appelle un commit. Une erreur ? Tu reviens au
 * point d'avant. » — concept animation (no tool logo; the real Git logo sits on each commit chip).
 * A glass handheld-console screen with a tiny neon pixel level: hearts + status pill (HUD), pixel stars, stepped hills,
 * a glass-block floor, three checkpoint flags.
 *   0–16    the screen settles, floor blocks cascade in, flag poles grow; the pixel hero runs in from the left.
 *   H0/1/2  (16, 16+k, 16+2k; k = 16…24) the hero hops to each flag: the flag shoots up the pole and lights cyan,
 *           pixel burst + ring, a glass chip pops above it: floppy + « SAVE 1 / 2 / 3 » (pixel font).
 *   TC      « commit »: the three chips flip like a split-flap board into « COMMIT · <git logo> a1f3c9 · départ »
 *           (7be204 · + la clé, c93d1e · boss battu); a git history line draws through the flag tops and the
 *           balls become commit dots.
 *   TE      « erreur »: a red pixel bug crawls in (TE−30); the hero runs at it (TE−16) and is hit on TE: X eyes, red,
 *           pops up and falls through the floor; red flash, shake, a heart breaks, the pill says « ERREUR »,
 *           a red « GAME OVER » slams in with glitch slices.
 *   TR      « reviens »: VHS rewind (amber tint, tracking bands, jitter, pill « ◀◀ REWIND »): STORY TIME RUNS BACKWARDS
 *           — the amber ghost hero (with afterimages) rises out of the floor and slides back to flag 3, GAME OVER
 *           un-slams, the heart mends, the bug walks backwards out.
 *   L=TR+24 « LOAD »: amber pixel pill slams above chip 3 (chip 3 + its dot turn amber), the hero re-assembles from
 *           flying pixels, white flash, amber shockwave + flare; pill back to « PLAY ».
 *   idle    hero breathes / blinks, flags wave, stars twinkle, clouds drift, a light runs along the commit line,
 *           LOAD breathes.
 * Phase words (episode item `beats`): ["sauvegardes", "commit", "erreur", "reviens"] (4 → the last 3 are used) or
 * ["commit", "erreur", "reviens"]. Anything else → TC/TE/TR at 50 / 68 / 80 % of the item. Gaps are clamped so every
 * phase has room. Ep. 7 (f0 = 894): TC +170, TE +230, TR +272 — savegame.sfx.json is timed on those.
 * Drawn in a 760 design space; everything inside the screen uses screen-local coords.
 */

const SCR = { x: 26, y: 42, w: 708, h: 676 }; // the game screen inside the glass bezel (stage coords)
const GY = 520; // floor top (screen-local, as everything below)
const POLES = [120, 295, 470];
const STOP = POLES.map((p) => p - 46); // where the hero stands at each flag
const BALL_Y = 352;
const POLE_H = GY - BALL_Y;
const CLOTH_UP = 360;
const CLOTH_DN = 458;
const CHIP = { w: 156, h: 100, y: 230 };
const LOAD_Y = 196; // LOAD pill centre
const HIT_X = 574; // hero centre when the bug hits
const BUG_X = 640;
const BUG_OFF = 800;
const HC = 7; // hero pixel
const HW = 11 * HC;
const HH = 12 * HC;
const BC = 6; // bug pixel
const BW = 12 * BC;
const BH = 8 * BC;
const RW = 24; // rewind length (frames)
const RED: RGB = [248, 113, 113];
const COMMITS = [
  { h: "a1f3c9", m: "départ" },
  { h: "7be204", m: "+ la clé" },
  { h: "c93d1e", m: "boss battu" },
];

const backOut = (d: number) => (d >= 1 ? 1 : d <= 0 ? 0 : 1 + 2.2 * Math.pow(d - 1, 3) + 1.2 * Math.pow(d - 1, 2));

/* ───────────────────────── pixel font (5×7, space 2 wide) ───────────────────────── */
const GLYPH: Record<string, string[]> = {
  S: [".XXXX", "X....", "X....", ".XXX.", "....X", "....X", "XXXX."],
  A: [".XXX.", "X...X", "X...X", "XXXXX", "X...X", "X...X", "X...X"],
  V: ["X...X", "X...X", "X...X", "X...X", "X...X", ".X.X.", "..X.."],
  E: ["XXXXX", "X....", "X....", "XXXX.", "X....", "X....", "XXXXX"],
  G: [".XXX.", "X...X", "X....", "X.XXX", "X...X", "X...X", ".XXX."],
  M: ["X...X", "XX.XX", "X.X.X", "X.X.X", "X...X", "X...X", "X...X"],
  O: [".XXX.", "X...X", "X...X", "X...X", "X...X", "X...X", ".XXX."],
  R: ["XXXX.", "X...X", "X...X", "XXXX.", "X.X..", "X..X.", "X...X"],
  L: ["X....", "X....", "X....", "X....", "X....", "X....", "XXXXX"],
  D: ["XXXX.", "X...X", "X...X", "X...X", "X...X", "X...X", "XXXX."],
  "1": ["..X..", ".XX..", "..X..", "..X..", "..X..", "..X..", ".XXX."],
  "2": [".XXX.", "X...X", "....X", "...X.", "..X..", ".X...", "XXXXX"],
  "3": ["XXXX.", "....X", "....X", ".XXX.", "....X", "....X", "XXXX."],
  " ": ["..", "..", "..", "..", "..", "..", ".."],
};
const pixLayout = (text: string) => {
  let x = 0;
  const out: Array<{ ch: string; x: number }> = [];
  text.split("").forEach((ch) => {
    const gl = GLYPH[ch] ?? GLYPH[" "];
    out.push({ ch, x });
    x += gl[0].length + 1;
  });
  return { out, w: x - 1 };
};
const PixelText: React.FC<{ text: string; px: number; color: string; glow?: string; gap?: number }> = ({ text, px, color, glow, gap = 0.7 }) => {
  const { out, w } = pixLayout(text);
  const s = (px - gap).toFixed(2);
  let d = "";
  out.forEach(({ ch, x }) => {
    (GLYPH[ch] ?? GLYPH[" "]).forEach((row, r) => {
      for (let c = 0; c < row.length; c++) if (row[c] === "X") d += `M${((x + c) * px).toFixed(2)} ${(r * px).toFixed(2)}h${s}v${s}h-${s}Z`;
    });
  });
  return (
    <svg width={w * px} height={7 * px} viewBox={`0 0 ${w * px} ${7 * px}`} style={{ display: "block", overflow: "visible", flexShrink: 0, filter: glow ? `drop-shadow(0 0 ${(px * 1.5).toFixed(1)}px ${glow})` : undefined }}>
      <path d={d} fill={color} />
    </svg>
  );
};

/* ───────────────────────── pixel sprites ───────────────────────── */
type Pal = Record<string, string>;
const PAL_HERO: Pal = { A: "#FFFFFF", B: "#22D3EE", L: "#A5F3FC", D: "#0E9DBB", W: "#ECFEFF", K: "#06101F" };
const PAL_DEAD: Pal = { A: "#FECACA", B: "#F87171", L: "#FECACA", D: "#C2413B", W: "#FFF1F2", K: "#3B0A0A" };
const PAL_GHOST: Pal = { A: "#FFF7E0", B: "#FBBF24", L: "#FDE68A", D: "#C27C0E", W: "#FFFBEB", K: "#3A1A02" };
const PAL_BUG: Pal = { R: "#EF4444", r: "#FCA5A5", d: "#FB7185", K: "#1A0505", W: "#FFFFFF" };

const HEAD = [".....A.....", ".....B.....", "..LLLLLLL..", ".LLBBBBBBB.", ".LBWWWWWWB."];
const EYES_OPEN = [".LBWWKWWKB.", ".LBWWKWWKB."];
const EYES_BLINK = [".LBWWWWWWB.", ".LBWKKWKKB."];
const BODY = ["..BBBBBBB..", ".DLBBBBBBD.", ".D.BBBBB.D."];
const LEGS: Record<string, string[]> = {
  stand: ["...BB.BB...", "..DDD.DDD.."],
  runA: ["..BB...BB..", ".DD.....DD."],
  runB: ["....BBB....", "....DDDD..."],
};
const DEAD_ROWS = [
  ".....A.....",
  ".....B.....",
  "..LLLLLLL..",
  ".LLBBBBBBB.",
  ".LBKWKKWKB.",
  ".LBWKWWKWB.",
  ".LBKWKKWKB.",
  "D.BBBBBBB.D",
  "DDLBBBBBBDD",
  "...BBBBB...",
  "...BB.BB...",
  "..DDD.DDD..",
];
type Pose = "stand" | "runA" | "runB" | "dead";
const heroRows = (pose: Pose, blink: boolean) => (pose === "dead" ? DEAD_ROWS : [...HEAD, ...(blink ? EYES_BLINK : EYES_OPEN), ...BODY, ...LEGS[pose]]);
const BUG_ROWS = [
  [
    "..d......d..",
    "...d....d...",
    "...rRRRRr...",
    "..RKWRRKWR..",
    ".dRRRRRRRRd.",
    "d.RrRRRRrR.d",
    ".dRRRRRRRRd.",
    "d..RRRRRR..d",
  ],
  [
    "..d......d..",
    "...d....d...",
    "...rRRRRr...",
    "..RKWRRKWR..",
    "d.RRRRRRRR.d",
    ".dRrRRRRrRd.",
    "d.RRRRRRRR.d",
    ".d.RRRRRR.d.",
  ],
];
const HEART_FULL = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];
const HEART_EMPTY = [".XX.XX.", "X..X..X", "X.....X", ".X...X.", "..X.X..", "...X..."];

/** one <path> per palette colour (cells overlap 0.4 px so no seams show when scaled) */
const spritePaths = (rows: string[], pal: Pal, cell: number) => {
  const by: Record<string, string> = {};
  const e = cell + 0.4;
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === ".") continue;
      by[ch] = (by[ch] ?? "") + `M${c * cell} ${r * cell}h${e}v${e}h-${e}Z`;
    }
  });
  return Object.keys(by).map((ch) => <path key={ch} d={by[ch]} fill={pal[ch] ?? "#FFFFFF"} />);
};

/** floppy disk, 24-unit box */
const FloppyG: React.FC<{ col: string; sw?: number }> = ({ col, sw = 2.2 }) => (
  <g fill="none" stroke={col} strokeWidth={sw} strokeLinejoin="round">
    <path d="M3 2.5 H17.5 L21.5 6.5 V21.5 H3 Z" />
    <path d="M7 2.5 V8.5 H15.5 V2.5" />
    <rect x={6.5} y={13.2} width={11.5} height={8.3} rx={1} fill={col} stroke="none" />
  </g>
);

type HeroSt = { x: number; y: number; rot: number; pose: Pose; land: number };

export const SaveGameFx: ToolFx = ({ g, f0, f1, beats, size }) => {
  const t = g - f0;
  const dur = Math.max(150, f1 - f0);

  // ── phases: the item's phase words (see header) ──
  const bt = beats
    .map((b) => b - f0)
    .filter((b) => b > 0 && b < dur)
    .sort((a, b) => a - b);
  const o = bt.length === 3 ? 0 : bt.length === 4 ? 1 : -1;
  const TC = Math.max(58, o >= 0 ? bt[o] : dur * 0.5);
  const TE = Math.max(TC + 34, o >= 0 ? bt[o + 1] : dur * 0.68);
  const TR = Math.max(TE + 30, o >= 0 ? bt[o + 2] : dur * 0.8);
  const L = TR + RW;
  const k = Math.min(24, Math.max(14, (TC - 26) / 2));
  const H = [16, 16 + k, 16 + 2 * k];
  const D = Math.min(k - 2, 18);
  const MOVES = [
    { a: 2, b: H[0], x0: -70, x1: STOP[0] },
    { a: H[1] - D, b: H[1], x0: STOP[0], x1: STOP[1] },
    { a: H[2] - D, b: H[2], x0: STOP[1], x1: STOP[2] },
    { a: TE - 16, b: TE, x0: STOP[2], x1: HIT_X },
  ];

  /** the hero at story time s (the rewind replays this backwards) */
  const heroAt = (s: number): HeroSt => {
    if (s >= TE) {
      const a = s - TE;
      const y = a < 14 ? -110 * EASE_OUT(a / 14) : -110 + 0.95 * (a - 14) * (a - 14);
      return { x: HIT_X - a * 1.1, y, rot: -a * 7, pose: "dead", land: 99 };
    }
    for (const m of MOVES) {
      if (s >= m.a && s < m.b) {
        const u = (s - m.a) / (m.b - m.a);
        const e = u * u * (3 - 2 * u);
        const n = Math.max(1, Math.round(Math.abs(m.x1 - m.x0) / 62));
        return { x: m.x0 + (m.x1 - m.x0) * e, y: -Math.abs(Math.sin(Math.PI * u * n)) * 17, rot: 0, pose: Math.floor(s / 4) % 2 ? "runA" : "runB", land: 99 };
      }
    }
    let x = -70;
    let land = 99;
    for (const m of MOVES) {
      if (s >= m.b) {
        x = m.x1;
        land = s - m.b;
      }
    }
    return { x, y: 0, rot: 0, pose: "stand", land };
  };
  const bugX = (s: number) => iv(s, [TE - 30, TE - 10], [BUG_OFF, BUG_X], EASE_OUT);

  // ── story time: runs forward, then BACKWARDS during the rewind, then holds just before the bug came ──
  const sA = Math.min(TR, TE + 40);
  const sB = TE - 32;
  const rw = iv(t, [TR, L], [0, 1], EASE_IN_OUT);
  const rewinding = t >= TR && t < L;
  const s = t < TR ? t : sA + (sB - sA) * rw;
  const rwEnv = iv(t, [TR, TR + 3, L - 3, L], [0, 1, 1, 0]);
  const wt = t < TR ? t : t < L ? TR - 5 * (t - TR) : TR - 5 * RW + (t - L); // world drift (scrolls back on rewind)

  const appear = iv(t, [0, 14], [0, 1], EASE_OUT);

  // error (story-time driven, so it un-happens on the rewind)
  const imp = decay(s - TE, 7) * (rewinding ? 0.45 : 1);
  const veil = iv(s, [TE, TE + 8], [0, 1]);
  const goP = iv(s, [TE + 3, TE + 11], [0, 1], EASE_OUT);
  const goGl = Math.max(s >= TE + 3 && s < TE + 11 ? 1 - (s - TE - 3) / 8 : 0, rewinding && goP > 0 ? 0.28 : 0);
  const shA = t >= TE && t < TR ? Math.exp(-(t - TE) / 7) : 0;
  const shX = Math.sin((t - TE) * 2.6) * 11 * shA + (rewinding ? (rand(Math.floor(t) * 1.7 + 3) - 0.5) * 12 * rwEnv : 0);
  const shY = Math.cos((t - TE) * 3.3) * 7 * shA;

  // load
  const lAge = t - L;
  const loaded = iv(t, [L, L + 8], [0, 1]);

  // commit line
  const dotAt = [0, 1, 2].map((i) => TC + 14 + 5 * i);
  const lineP = iv(t, [TC + 14, TC + 24], [0, 1]);

  /* ── hero drawing ── */
  const blink = (g + 17) % 84 < 5;
  const drawHero = (st: HeroSt, pal: Pal, op: number, key: string, asmAge: number | null) => {
    if (op <= 0.005) return null;
    const rows = heroRows(st.pose, blink && st.pose === "stand");
    const sq = st.land < 12 ? Math.sin(clamp01(st.land / 12) * Math.PI) * Math.exp(-st.land / 6) : 0;
    const standing = st.pose === "stand";
    const bob = standing ? Math.sin(g * 0.09) * 2 : 0;
    const sx = 1 + 0.12 * sq;
    const sy = 1 - 0.14 * sq + (standing ? 0.015 * Math.sin(g * 0.09 + 1) : 0);
    const dead = st.pose === "dead";
    let body: React.ReactNode;
    if (asmAge !== null && asmAge < 18) {
      const cells: React.ReactNode[] = [];
      rows.forEach((row, r) => {
        for (let c = 0; c < row.length; c++) {
          const ch = row[c];
          if (ch === ".") continue;
          const id = r * 11 + c;
          const p = iv(asmAge - rand(id * 7.31 + 2) * 6, [0, 11], [0, 1], EASE_OUT);
          if (p <= 0) continue;
          const ox = (rand(id * 3.7 + 1) - 0.5) * 170 * (1 - p);
          const oy = (rand(id * 5.3 + 4) - 0.5) * 170 * (1 - p) - 50 * (1 - p);
          cells.push(<rect key={id} x={c * HC + ox} y={r * HC + oy} width={HC + 0.4} height={HC + 0.4} fill={p < 0.8 ? "#FFFFFF" : pal[ch]} opacity={Math.min(1, p * 1.6)} />);
        }
      });
      body = cells;
    } else body = spritePaths(rows, pal, HC);
    const glowC = dead ? "rgba(248,113,113,0.8)" : pal === PAL_GHOST ? "rgba(245,158,11,0.75)" : "rgba(34,211,238,0.75)";
    return (
      <div
        key={key}
        style={{
          position: "absolute",
          left: st.x - HW / 2,
          top: GY - HH + st.y + bob,
          width: HW,
          height: HH,
          opacity: op,
          transform: `rotate(${st.rot.toFixed(1)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`,
          transformOrigin: dead ? "50% 50%" : "50% 100%",
        }}
      >
        <svg width={HW} height={HH} viewBox={`0 0 ${HW} ${HH}`} style={{ overflow: "visible", filter: `drop-shadow(0 0 9px ${glowC})` }}>
          {body}
        </svg>
      </div>
    );
  };

  const heroNow = heroAt(s);
  const heroEls: React.ReactNode[] = [];
  if (t < TR) {
    heroEls.push(drawHero(heroNow, heroNow.pose === "dead" ? PAL_DEAD : PAL_HERO, appear, "h", null));
  } else if (rewinding) {
    [15, 10, 5].forEach((d, j) => heroEls.push(drawHero(heroAt(s + d), PAL_GHOST, [0.09, 0.17, 0.3][j] * rwEnv, `gh${d}`, null)));
    heroEls.push(drawHero(heroNow, PAL_GHOST, 0.72, "g", null));
  } else {
    heroEls.push(drawHero(heroNow, PAL_GHOST, 0.72 * (1 - iv(lAge, [0, 8], [0, 1])), "g", null));
    heroEls.push(drawHero(heroNow, PAL_HERO, 1, "h", lAge));
  }
  const shadowA = heroNow.pose === "dead" ? 0 : 0.42 * (1 - Math.min(1, -heroNow.y / 50) * 0.5) * appear;

  /* ── bug ── */
  const bx = bugX(s);
  const bugHop = s >= TE + 4 && s < TE + 30 ? -Math.abs(Math.sin(((s - TE - 4) / 13) * Math.PI)) * 9 : 0;
  const bugFrame = Math.floor(g / (rewinding ? 2 : 5)) % 2;

  /* ── particles ── */
  const parts: React.ReactNode[] = [];
  H.forEach((h, i) => {
    const a = t - h;
    if (a < 0 || a > 26) return;
    for (let j = 0; j < 12; j++) {
      const r1 = rand(i * 31 + j * 7.7);
      const r2 = rand(i * 17 + j * 3.1 + 5);
      const r3 = rand(i * 11 + j * 5.9 + 9);
      const vx = (r1 - 0.5) * 10;
      const vy = -4 - r2 * 7;
      const x = POLES[i] + 34 + vx * a;
      const y = CLOTH_UP + 22 + vy * a + 0.38 * a * a;
      const sz = 5 + r3 * 5;
      parts.push(<rect key={`s${i}-${j}`} x={x - sz / 2} y={y - sz / 2} width={sz} height={sz} fill={j % 3 === 0 ? "#FFFFFF" : j % 3 === 1 ? "#67E8F9" : "#A5F3FC"} opacity={1 - a / 26} />);
    }
    parts.push(<circle key={`r${i}`} cx={POLES[i]} cy={BALL_Y} r={10 + a * 3.2} fill="none" stroke={rgba(ICE, 0.9 * (1 - a / 20))} strokeWidth={3} />);
  });
  const ia = t - TE;
  if (ia >= 0 && ia < 28 && t < TR) {
    const cx = HIT_X + 36;
    const cy = GY - 44;
    for (let j = 0; j < 14; j++) {
      const r1 = rand(71 + j * 7.7);
      const r2 = rand(53 + j * 3.1);
      const vx = (r1 - 0.5) * 14;
      const vy = -3 - r2 * 9;
      const sz = 5 + rand(91 + j) * 6;
      parts.push(<rect key={`d${j}`} x={cx + vx * ia - sz / 2} y={cy + vy * ia + 0.45 * ia * ia - sz / 2} width={sz} height={sz} fill={j % 3 === 0 ? "#FFFFFF" : j % 2 ? "#F87171" : "#FCA5A5"} opacity={1 - ia / 28} />);
    }
    if (ia < 12) {
      for (let j = 0; j < 8; j++) {
        const an = (j / 8) * Math.PI * 2 + 0.3;
        const r0 = 14 + ia * 4;
        const r1 = r0 + 26 * (1 - ia / 12);
        parts.push(<line key={`x${j}`} x1={cx + Math.cos(an) * r0} y1={cy + Math.sin(an) * r0} x2={cx + Math.cos(an) * r1} y2={cy + Math.sin(an) * r1} stroke={j % 2 ? "#FFFFFF" : "#F87171"} strokeWidth={5} strokeLinecap="round" opacity={1 - ia / 12} />);
      }
    }
  }

  /* ── parallax background ── */
  const hill = (seed: number, base: number, hMin: number, hMax: number, off: number) => {
    const P = 360;
    const step = 24;
    const oo = ((off % P) + P) % P;
    let d = `M-40 ${base}`;
    for (let x = -oo - step; x < SCR.w + step; x += step) {
      const idx = Math.round((x + oo) / step);
      const h = hMin + rand(seed + (((idx % 15) + 15) % 15) * 3.3) * (hMax - hMin);
      d += ` L${x} ${base - h} L${x + step} ${base - h}`;
    }
    return `${d} L${SCR.w + 40} ${base} Z`;
  };
  const CLOUD = ["..XXX....", ".XXXXXXX.", "XXXXXXXXX"];

  /* ── chips ── */
  const H2 = H[2];
  const chipEls = [0, 1, 2].map((i) => {
    const pc = iv(t, [H[i] + 2, H[i] + 16], [0, 1]);
    if (pc <= 0) return null;
    const sc = 0.4 + 0.6 * backOut(pc);
    const fp = iv(t, [TC + 5 * i, TC + 5 * i + 14], [0, 1], EASE_IN_OUT);
    const back = fp >= 0.5;
    const fy = Math.max(0.02, Math.abs(Math.cos(fp * Math.PI)));
    const mid = Math.sin(fp * Math.PI);
    const am = i === 2 ? loaded : 0;
    // « chaque sauvegarde »: the SAVE chips light one after the other while waiting for « commit »
    const hu = t - H2 - 30;
    const ws = H2 + 30 + Math.floor(hu / 60) * 60; // start of this wave — only waves that finish before « commit »
    const ha = hu >= 0 && ws + 34 < TC ? (hu % 60) - 8 * i : -1;
    const hl = ha >= 0 && ha < 16 ? Math.sin((ha / 16) * Math.PI) : 0;
    // glint after the flip, then every 96 frames
    const ga0 = t - (TC + 5 * i + 14);
    const ga = ga0 >= 0 ? (ga0 < 40 ? ga0 : (ga0 - 40) % 96) : -1;
    const glint = ga >= 0 && ga < 16 ? ga / 16 : -1;
    const acc = am > 0.01 ? "245,158,11" : "34,211,238";
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: POLES[i] - CHIP.w / 2,
          top: CHIP.y,
          width: CHIP.w,
          height: CHIP.h,
          opacity: clamp01(pc * 2.5),
          transform: `translateY(${((1 - pc) * 26).toFixed(1)}px) scale(${(sc * (1 + 0.07 * mid + 0.05 * hl + 0.04 * decay(lAge, 8) * (i === 2 ? 1 : 0))).toFixed(4)})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            ...glass(acc, 0.7 + 0.6 * hl + 0.9 * am + 0.5 * mid),
            borderRadius: 20,
            border: `1.5px solid ${am > 0.01 ? rgba(AMBER, 0.35 + 0.55 * am) : rgba(CYAN, 0.3 + 0.45 * hl + 0.3 * mid)}`,
            transform: `scaleY(${fy.toFixed(4)})`,
            overflow: "hidden",
          }}
        >
          {!back ? (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 11 }}>
              <svg width={28} height={28} viewBox="0 0 24 24" style={{ overflow: "visible", filter: "drop-shadow(0 0 6px rgba(34,211,238,0.7))" }}>
                <FloppyG col="#67E8F9" />
              </svg>
              <PixelText text={`SAVE ${i + 1}`} px={4} color="#F0FDFF" glow="rgba(34,211,238,0.85)" />
            </div>
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
              <div style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 15, letterSpacing: "0.24em", paddingLeft: "0.24em", color: am > 0.05 ? "#FCD34D" : "#67E8F9", lineHeight: 1.1 }}>COMMIT</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, height: 34 }}>
                <Logo name="git" size={28} plate={false} />
                <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 27, color: am > 0.05 ? "#FFE7B8" : "#F8FAFC", letterSpacing: "-0.01em", textShadow: `0 0 14px ${am > 0.05 ? rgba(AMBER, 0.6) : rgba(CYAN, 0.45)}` }}>{COMMITS[i].h}</span>
              </div>
              <div style={{ fontFamily: fontInter, fontWeight: 600, fontSize: 18, color: "rgba(226,236,250,0.74)", lineHeight: 1.1 }}>{COMMITS[i].m}</div>
            </div>
          )}
          {mid > 0.02 ? <div style={{ position: "absolute", inset: 0, background: "rgb(225,248,255)", opacity: 0.5 * mid }} /> : null}
          {glint >= 0 ? (
            <div style={{ position: "absolute", top: -40, bottom: -40, width: 46, left: -70 + glint * (CHIP.w + 110), transform: "skewX(-20deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.5), rgba(255,255,255,0))" }} />
          ) : null}
        </div>
      </div>
    );
  });

  /* ── LOAD pill ── */
  const lp = iv(t, [L - 2, L + 3], [0, 1]);
  const lsc = t < L + 4 ? iv(t, [L - 2, L + 4], [1.9, 1], EASE_IN) : 1 + 0.07 * Math.sin(clamp01((t - L - 4) / 12) * Math.PI) * Math.exp(-(t - L - 4) / 8) + 0.025 * Math.sin(g * 0.1);

  /* ── HUD ── */
  const state = t < TE ? "play" : t < TR ? "err" : t < L ? "rw" : "play";
  const since = t < TE ? t - 8 : t < TR ? t - TE : t < L ? t - TR : t - L;
  const stCol: RGB = state === "err" ? RED : state === "rw" ? AMBER : CYAN;
  const stPop = 1 + 0.18 * decay(since, 6) + (state === "rw" ? 0.08 : 0);
  const rwBlink = state === "rw" ? (Math.floor(t / 4) % 2 ? 1 : 0.35) : 1;

  const k760 = size / 760;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: k760 !== 1 ? `scale(${k760.toFixed(4)})` : undefined, transformOrigin: "0 0" }}>
      {/* back light (cyan, red on the error, amber on the load) */}
      <div style={{ position: "absolute", left: -20, top: 40, width: 800, height: 700, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, 0.13)}, rgba(0,0,0,0))`, opacity: appear }} />
      {veil > 0.01 ? <div style={{ position: "absolute", left: -20, top: 40, width: 800, height: 700, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(RED, 0.16)}, rgba(0,0,0,0))`, opacity: veil }} /> : null}
      {loaded > 0.01 ? <div style={{ position: "absolute", left: 120, top: 40, width: 700, height: 600, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(AMBER, 0.12 + 0.2 * decay(lAge, 14))}, rgba(0,0,0,0))`, opacity: loaded }} /> : null}

      {/* ── the console: glass bezel + screen ── */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, opacity: appear, transform: `scale(${(0.94 + 0.06 * appear).toFixed(4)})`, transformOrigin: "380px 400px" }}>
        <div style={{ position: "absolute", left: 14, top: 30, width: 732, height: 700, ...glass("34,211,238", 1), borderRadius: 40 }} />
        <div
          style={{
            position: "absolute",
            left: SCR.x,
            top: SCR.y,
            width: SCR.w,
            height: SCR.h,
            borderRadius: 28,
            overflow: "hidden",
            background: "linear-gradient(180deg, #0B1A3C 0%, #081230 52%, #050A1A 100%)",
            boxShadow: `inset 0 0 0 1px ${rgba(CYAN, 0.2)}, inset 0 0 50px rgba(0,0,0,0.55)`,
          }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, width: SCR.w, height: SCR.h, transform: `translate(${shX.toFixed(2)}px, ${shY.toFixed(2)}px)` }}>
            {/* pixel grid */}
            <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${rgba(CYAN, 0.035)} 1px, rgba(0,0,0,0) 1px), linear-gradient(90deg, ${rgba(CYAN, 0.035)} 1px, rgba(0,0,0,0) 1px)`, backgroundSize: "24px 24px" }} />

            {/* sky: stars, clouds, hills */}
            <svg width={SCR.w} height={SCR.h} style={{ position: "absolute", left: 0, top: 0 }}>
              {Array.from({ length: 18 }, (_, i) => {
                const x = (((rand(i * 3.1 + 1) * (SCR.w + 40) - wt * 0.08) % (SCR.w + 40)) + SCR.w + 40) % (SCR.w + 40) - 20;
                const y = 78 + rand(i * 5.7 + 2) * 250;
                const sz = rand(i * 1.3) > 0.6 ? 4 : 3;
                const tw = 0.18 + 0.55 * Math.max(0, Math.sin(g * 0.07 + i * 2.1));
                return <rect key={i} x={x} y={y} width={sz} height={sz} fill={i % 4 === 0 ? "#FDE68A" : "#CFFAFE"} opacity={tw * appear} />;
              })}
              {[0, 1].map((c) => {
                const span = SCR.w + 220;
                const x = (((c * 390 + 80 - wt * (0.35 + 0.15 * c)) % span) + span) % span - 110;
                const y = 120 + c * 64;
                const cs = 8 + c * 2;
                let d = "";
                CLOUD.forEach((row, r) => {
                  for (let q = 0; q < row.length; q++) if (row[q] === "X") d += `M${x + q * cs} ${y + r * cs}h${cs + 0.4}v${cs + 0.4}h-${cs + 0.4}Z`;
                });
                return <path key={c} d={d} fill={rgba(ICE, 0.09 + 0.03 * c)} />;
              })}
              <path d={hill(11, GY, 70, 150, wt * 0.25)} fill={rgba(CYAN, 0.05)} stroke={rgba(CYAN, 0.12)} strokeWidth={2} />
              <path d={hill(37, GY, 24, 70, wt * 0.6)} fill={rgba(CYAN, 0.08)} stroke={rgba(CYAN, 0.2)} strokeWidth={2} />
            </svg>

            {/* flags + commit line */}
            <svg width={SCR.w} height={SCR.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <defs>
                <filter id="sgGlow" x="-20%" y="-300%" width="140%" height="700%">
                  <feGaussianBlur stdDeviation="6" />
                </filter>
                <linearGradient id="sgCloth" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#A5F3FC" />
                  <stop offset="1" stopColor="#22D3EE" />
                </linearGradient>
                <linearGradient id="sgPole" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="rgba(255,255,255,0.85)" />
                  <stop offset="1" stopColor="rgba(34,211,238,0.55)" />
                </linearGradient>
              </defs>
              {POLES.map((px, i) => {
                const pg = iv(t, [5 + 3 * i, 15 + 3 * i], [0, 1], EASE_OUT);
                if (pg <= 0) return null;
                const lit = iv(t, [H[i], H[i] + 4], [0, 1]);
                const cr = iv(t, [H[i], H[i] + 12], [0, 1]);
                const cy = CLOTH_DN + (CLOTH_UP - CLOTH_DN) * backOut(cr);
                const amp = 0.4 + 0.6 * lit;
                const wv = [0, 1.2, 2.4].map((ph) => Math.sin(g * 0.13 + i * 2 + ph) * 3.5 * amp);
                const top = GY - POLE_H * pg;
                return (
                  <g key={i}>
                    <rect x={px - 3} y={top} width={6} height={POLE_H * pg} rx={3} fill="url(#sgPole)" opacity={0.85} />
                    {pg > 0.6 ? (
                      <g transform={`translate(${px + 3}, ${Math.max(cy, top + 8)})`} opacity={iv(pg, [0.6, 1], [0, 1])}>
                        <path d={`M0 0 L76 ${wv[0]} L62 ${23 + wv[1]} L76 ${46 + wv[2]} L0 46 Z`} fill={lit > 0.01 ? "url(#sgCloth)" : "rgba(148,190,255,0.14)"} stroke={lit > 0.01 ? "rgba(236,254,255,0.9)" : "rgba(255,255,255,0.28)"} strokeWidth={2} strokeLinejoin="round" opacity={lit > 0.01 ? 0.35 + 0.65 * lit : 1} style={lit > 0.01 ? { filter: `drop-shadow(0 0 ${(8 + 14 * decay(t - H[i], 10)).toFixed(1)}px rgba(34,211,238,0.8))` } : undefined} />
                        <g transform={`translate(17, ${11 + wv[1] * 0.4}) scale(1)`} opacity={0.35 + 0.65 * lit}>
                          <FloppyG col={lit > 0.01 ? "#06233A" : "rgba(255,255,255,0.4)"} sw={2.4} />
                        </g>
                      </g>
                    ) : null}
                  </g>
                );
              })}
              {/* git history line through the flag tops */}
              {lineP > 0 ? (
                <g>
                  <line x1={POLES[0]} y1={BALL_Y} x2={POLES[0] + (POLES[2] - POLES[0]) * lineP} y2={BALL_Y} stroke={rgba(CYAN, 0.7)} strokeWidth={12} strokeLinecap="round" filter="url(#sgGlow)" />
                  <line x1={POLES[0]} y1={BALL_Y} x2={POLES[0] + (POLES[2] - POLES[0]) * lineP} y2={BALL_Y} stroke="#A5F3FC" strokeWidth={5} strokeLinecap="round" />
                </g>
              ) : null}
              {t > TC + 40
                ? (() => {
                    const span = POLES[2] - POLES[0] + 140;
                    const x = POLES[0] - 20 + (((t - TC - 40) * 4.5) % span);
                    return x < POLES[2] + 10 ? (
                      <g>
                        <ellipse cx={x} cy={BALL_Y} rx={40} ry={9} fill={rgba(ICE, 0.5)} filter="url(#sgGlow)" />
                        <circle cx={x} cy={BALL_Y} r={4} fill="#FFFFFF" />
                      </g>
                    ) : null;
                  })()
                : null}
              {/* flag-top balls → commit dots */}
              {POLES.map((px, i) => {
                const pg = iv(t, [5 + 3 * i, 15 + 3 * i], [0, 1], EASE_OUT);
                if (pg < 0.98) return null;
                const lit = t >= H[i];
                const ca = t - dotAt[i];
                const com = ca >= 0;
                const am = i === 2 ? loaded : 0;
                const pop = com ? (ca < 6 ? iv(ca, [0, 6], [0.6, 1.35], EASE_OUT) : iv(ca, [6, 14], [1.35, 1])) : 1;
                const r = (com ? 12 : lit ? 9 : 8) * pop;
                const col: RGB = am > 0.05 ? AMBER : CYAN;
                return (
                  <g key={i}>
                    {com ? <circle cx={px} cy={BALL_Y} r={r + 5} fill={rgba(col, 0.28 + 0.3 * decay(ca, 10) + 0.3 * am)} /> : null}
                    <circle cx={px} cy={BALL_Y} r={r} fill={com ? (am > 0.05 ? "#FFE1A3" : "#FFFFFF") : lit ? "#ECFEFF" : "rgba(226,236,250,0.35)"} stroke={com ? (am > 0.05 ? "#F59E0B" : "#22D3EE") : "none"} strokeWidth={4} style={lit ? { filter: `drop-shadow(0 0 ${com ? 12 : 8}px ${rgba(col, 0.9)})` } : undefined} />
                    {com && ca < 20 ? <circle cx={px} cy={BALL_Y} r={12 + ca * 2.4} fill="none" stroke={rgba(CYAN, 0.85 * (1 - ca / 20))} strokeWidth={3} /> : null}
                  </g>
                );
              })}
            </svg>

            {/* floor: glass pixel blocks */}
            <svg width={SCR.w} height={SCR.h} style={{ position: "absolute", left: 0, top: 0 }}>
              <defs>
                <linearGradient id="sgFloorFade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="rgba(5,10,26,0)" />
                  <stop offset="1" stopColor="rgba(5,10,26,0.95)" />
                </linearGradient>
              </defs>
              {Array.from({ length: 18 }, (_, c) => {
                const ta = 1 + c * 0.8;
                const dp = iv(t, [ta, ta + 9], [0, 1], EASE_OUT);
                if (dp <= 0) return null;
                const x = -6 + c * 40;
                const dy = -26 * (1 - dp);
                return (
                  <g key={c} transform={`translate(0, ${dy.toFixed(2)})`} opacity={clamp01(dp * 2)}>
                    {[0, 1, 2].map((r) => (
                      <rect key={r} x={x + 2} y={GY + r * 40 + 2} width={36} height={36} rx={5} fill={rgba(CYAN, [0.16, 0.09, 0.05][r])} stroke={rgba(CYAN, [0.5, 0.26, 0.14][r])} strokeWidth={1.5} />
                    ))}
                    <rect x={x + 4} y={GY + 3} width={32} height={3} rx={1.5} fill="#A5F3FC" opacity={0.75} />
                    <rect x={x + 6} y={GY + 10} width={6} height={6} fill="rgba(236,254,255,0.35)" />
                  </g>
                );
              })}
              <rect x={0} y={GY + 40} width={SCR.w} height={SCR.h - GY - 40} fill="url(#sgFloorFade)" />
              {/* floor light under the hero */}
              <ellipse cx={heroNow.x} cy={GY + 3} rx={34} ry={7} fill={rgba(CYAN, 0.55)} opacity={shadowA} filter="url(#sgGlow)" />
            </svg>

            {/* the bug */}
            {bx < SCR.w + 60 ? (
              <div style={{ position: "absolute", left: bx - BW / 2, top: GY - BH + bugHop, width: BW, height: BH }}>
                <svg width={BW} height={BH} viewBox={`0 0 ${BW} ${BH}`} style={{ overflow: "visible", filter: "drop-shadow(0 0 10px rgba(239,68,68,0.75))" }}>
                  {spritePaths(BUG_ROWS[bugFrame], PAL_BUG, BC)}
                </svg>
              </div>
            ) : null}

            {/* the hero */}
            {heroEls}

            {/* chips */}
            {chipEls}

            {/* LOAD pill */}
            {lp > 0.01 ? (
              <div style={{ position: "absolute", left: POLES[2], top: LOAD_Y, width: 0, height: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div
                  style={{
                    flexShrink: 0,
                    height: 52,
                    padding: "0 22px 0 18px",
                    borderRadius: 26,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "linear-gradient(140deg, rgba(245,158,11,0.34), rgba(245,158,11,0.12))",
                    border: `2px solid ${rgba(AMBER, 0.92)}`,
                    boxShadow: `0 0 ${(26 + 30 * decay(lAge, 10)).toFixed(0)}px ${rgba(AMBER, 0.5)}, inset 0 1px 0 rgba(255,255,255,0.35)`,
                    opacity: lp,
                    transform: `scale(${lsc.toFixed(4)})`,
                  }}
                >
                  <svg width={26} height={26} viewBox="0 0 26 26" style={{ overflow: "visible" }}>
                    <path d="M21 13 A8 8 0 1 1 13 5" fill="none" stroke="#FFD58A" strokeWidth={3.2} strokeLinecap="round" />
                    <path d="M12 0.5 L18 5 L12 9.5 Z" fill="#FFD58A" />
                  </svg>
                  <PixelText text="LOAD" px={4} color="#FFE7B8" glow="rgba(245,158,11,0.9)" />
                </div>
              </div>
            ) : null}

            {/* particles */}
            <svg width={SCR.w} height={SCR.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              {parts}
            </svg>

            {/* error veil + red vignette */}
            {veil > 0.01 ? (
              <>
                <div style={{ position: "absolute", inset: 0, background: "rgba(6,4,12,0.5)", opacity: veil }} />
                <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 120px ${rgba([239, 68, 68], 0.5)}`, opacity: veil * (0.6 + 0.4 * imp) }} />
              </>
            ) : null}

            {/* GAME OVER */}
            {goP > 0.01 ? (
              <div style={{ position: "absolute", left: 0, right: 0, top: 104, height: 70, display: "flex", justifyContent: "center", opacity: clamp01(goP * 1.6) }}>
                <div style={{ position: "relative", width: 400, height: 56, transform: `scale(${(1.6 - 0.6 * goP).toFixed(4)})` }}>
                  {goGl > 0.02 ? (
                    <>
                      <div style={{ position: "absolute", left: -(3 + 7 * goGl), top: 0, opacity: 0.7 * goGl }}>
                        <PixelText text="GAME OVER" px={8} color="#22D3EE" gap={1} />
                      </div>
                      <div style={{ position: "absolute", left: 3 + 7 * goGl, top: 0, opacity: 0.7 * goGl }}>
                        <PixelText text="GAME OVER" px={8} color="#FF2D55" gap={1} />
                      </div>
                    </>
                  ) : null}
                  {[0, 1, 2, 3].map((j) => (
                    <div key={j} style={{ position: "absolute", left: 0, top: 0, clipPath: `inset(${j * 25}% 0 ${100 - (j + 1) * 25}% 0)`, transform: `translateX(${((rand(Math.floor(s * 0.7) * 7 + j * 13) - 0.5) * 40 * goGl).toFixed(1)}px)` }}>
                      <PixelText text="GAME OVER" px={8} color="#FCA5A5" glow="rgba(239,68,68,0.95)" gap={1} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* HUD: hearts + status pill */}
            {[0, 1, 2].map((j) => {
              const hp = iv(t, [6 + 2 * j, 16 + 2 * j], [0, 1]);
              if (hp <= 0) return null;
              const broken = j === 2 && s >= TE;
              const pop = j === 2 ? (broken ? decay(s - TE, 6) : decay(lAge, 8)) : 0;
              const col = broken ? "#F87171" : j === 2 && lAge >= 0 && lAge < 20 ? "#FDE68A" : "#67E8F9";
              return (
                <div key={j} style={{ position: "absolute", left: 24 + j * 44, top: 24, width: 35, height: 30, transform: `scale(${(backOut(hp) * (1 + 0.45 * pop)).toFixed(4)})` }}>
                  <svg width={35} height={30} viewBox="0 0 35 30" style={{ overflow: "visible", filter: `drop-shadow(0 0 7px ${broken ? "rgba(248,113,113,0.8)" : "rgba(34,211,238,0.7)"})` }}>
                    {spritePaths(broken ? HEART_EMPTY : HEART_FULL, { X: col }, 5)}
                  </svg>
                </div>
              );
            })}
            {t >= 8 ? (
              <div style={{ position: "absolute", right: 22, top: 18, height: 0, display: "flex", justifyContent: "flex-end", opacity: iv(t, [8, 16], [0, 1]) }}>
                <div
                  style={{
                    height: 42,
                    padding: "0 18px 0 15px",
                    borderRadius: 21,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: `linear-gradient(140deg, ${rgba(stCol, 0.22)}, ${rgba(stCol, 0.07)})`,
                    border: `1.5px solid ${rgba(stCol, 0.75)}`,
                    boxShadow: `0 0 ${state === "play" ? 14 : 26}px ${rgba(stCol, 0.35)}`,
                    transform: `scale(${stPop.toFixed(4)})`,
                    transformOrigin: "100% 0%",
                    whiteSpace: "nowrap",
                  }}
                >
                  <svg width={state === "rw" ? 30 : 18} height={18} viewBox={state === "rw" ? "0 0 30 18" : "0 0 18 18"} style={{ opacity: rwBlink }}>
                    {state === "play" ? <path d="M3 1.5 L16 9 L3 16.5 Z" fill={rgba(stCol, 1)} /> : null}
                    {state === "err" ? <path d="M3 3 L15 15 M15 3 L3 15" stroke={rgba(stCol, 1)} strokeWidth={3.4} strokeLinecap="round" /> : null}
                    {state === "rw" ? <path d="M14 1.5 L2 9 L14 16.5 Z M28 1.5 L16 9 L28 16.5 Z" fill={rgba(stCol, 1)} /> : null}
                  </svg>
                  <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 19, letterSpacing: "0.14em", color: state === "play" ? "#E6FBFF" : state === "err" ? "#FECACA" : "#FFE7B8" }}>
                    {state === "play" ? "PLAY" : state === "err" ? "ERREUR" : "REWIND"}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* VHS rewind */}
          {rwEnv > 0.01 ? (
            <>
              <div style={{ position: "absolute", inset: 0, background: rgba(AMBER, 0.1), opacity: rwEnv }} />
              <div style={{ position: "absolute", inset: 0, opacity: rwEnv, backgroundImage: "repeating-linear-gradient(0deg, rgba(255,236,200,0.07) 0 2px, rgba(0,0,0,0) 2px 5px)" }} />
              {[0, 1, 2].map((j) => {
                const span = SCR.h + 80;
                const y = ((t * (29 + 9 * j) + j * 227) % span) - 40;
                const h = 6 + j * 7;
                return <div key={j} style={{ position: "absolute", left: 0, right: 0, top: y, height: h, opacity: rwEnv, background: `linear-gradient(90deg, rgba(255,240,215,0.04), rgba(255,240,215,${(0.18 + 0.06 * j).toFixed(2)}), rgba(255,240,215,0.06))`, transform: `translateX(${((rand(Math.floor(t) * 3 + j) - 0.5) * 30).toFixed(1)}px)` }} />;
              })}
            </>
          ) : null}

          {/* flashes */}
          {imp > 0.01 ? <div style={{ position: "absolute", inset: 0, background: rgba([239, 68, 68], 0.3), opacity: imp, mixBlendMode: "screen" }} /> : null}
          {lAge >= 0 && lAge < 24 ? <div style={{ position: "absolute", inset: 0, background: "rgb(255,246,225)", opacity: 0.55 * decay(lAge, 5), mixBlendMode: "screen" }} /> : null}

          {/* screen scanlines + glare */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.022) 0 1px, rgba(0,0,0,0) 1px 4px)" }} />
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(155deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0) 34%)" }} />
        </div>
      </div>

      {/* stage-level light */}
      <AnamorphicFlare age={t - dotAt[2]} x={SCR.x + POLES[2]} y={SCR.y + BALL_Y} dur={26} strength={0.5} size={90} streakH={60} />
      <AnamorphicFlare age={t < TR ? t - TE : -1} x={SCR.x + HIT_X + 36} y={SCR.y + GY - 44} col={RED} dur={26} strength={0.55} size={110} streakH={70} />
      <Shockwave age={lAge} x={SCR.x + STOP[2]} y={SCR.y + GY - HH / 2} col={AMBER} dur={24} strength={0.85} maxR={300} r0={30} />
      <AnamorphicFlare age={lAge} x={SCR.x + POLES[2]} y={SCR.y + LOAD_Y} col={AMBER} dur={30} strength={0.7} size={120} streakH={80} />
    </div>
  );
};
