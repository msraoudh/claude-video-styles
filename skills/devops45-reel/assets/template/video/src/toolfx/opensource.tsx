import React from "react";
import { fontInter, fontMono } from "../kit/fonts";
import { beatPulse, rand } from "../lib/sync";
import { AMBER, AMBER_HOT, AnamorphicFlare, Bloom, clamp01, CYAN, decay, EASE_IN_OUT, EASE_OUT, ICE, iv, rgba, Shockwave, type RGB } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/*
 * « Linux est open source. Comme une recette publique : tout le monde peut la lire, la copier, l'améliorer. »
 * 0    an open glass book in the centre (left page « recette », right page numbered code lines) under a glass badge
 *      holding a closed padlock; 3→15 the padlock's shackle lifts and swings OPEN, the badge widens to « public »,
 *      the pages light up and their lines write themselves in. Four glass avatars fade in around the book (dim).
 * tL   « lire »: one after the other the avatars light up, an eye badge opens beside each head and a cone of reading
 *      light flows from the page into each eye (dashes + light motes running page → eye).
 * tC   « copier »: four glowing copies of the page peel off the book and fly to the avatars, who hold them (pop ring).
 * tA   « améliorer »: the top-right avatar scribbles an amber stroke on its copy and sends back an amber ✎ patch;
 *      it lands on line 3 of the right page (tA+24): amber highlight wipe, the line is rewritten, ✎ badge on the
 *      margin, sparks + shockwave, the version chip bumps « v1 → v2 » (v2 amber, flare).
 * then idle: reading rays keep flowing, ghost copies keep flying to the readers, eyes blink, avatars bob, a light
 *      sweep crosses the pages, the v2 chip breathes amber on the music.
 * Phases: if exactly 3 `beats` are given they are the frames of « lire », « copier », « améliorer » (tX = beat − 4,
 * clamped so each phase has room); otherwise they are spread at 18 / 46 / 76 (edit lands ≈ f0 + 100).
 */

type P = [number, number];
const bez = (a: P, c: P, b: P, u: number): P => {
  const v = 1 - u;
  return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]];
};
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// ── layout (760 space) ──
const CX = 380;
const TOP = 262;
const BOT = 516;
const PW = 200; // page width
const BADGE: P = [380, 146];
const CHIP: P = [380, 630];
const ROW_Y = [326, 362, 398, 434, 470];
const EDIT_ROW = 2;
const EDIT_PT: P = [496, ROW_Y[EDIT_ROW]];
type Seg = [number, "t" | "k" | "a"];
const ROWS: Seg[][] = [
  [[40, "k"], [74, "t"]],
  [[26, "t"], [54, "k"], [36, "t"]],
  [[66, "t"], [48, "t"]],
  [[32, "k"], [84, "t"]],
  [[54, "t"], [42, "k"]],
];
const NEW_ROW: Seg[] = [[44, "k"], [40, "a"], [42, "t"]];
const LEFT_ROWS = [128, 98, 136, 84];

type Av = { x: number; y: number; side: 1 | -1 };
const AVS: Av[] = [
  { x: 84, y: 214, side: -1 },
  { x: 676, y: 214, side: 1 },
  { x: 84, y: 692, side: -1 },
  { x: 676, y: 692, side: 1 },
];
const EDITOR = 1;
const AS = 1.4; // avatar scale
const headY = (a: Av) => a.y - 62 * AS;
const eyeOf = (a: Av): P => [a.x - a.side * 66, headY(a) - (a.y < 450 ? 14 : 30)];
const raySrc = (a: Av): P => [CX + a.side * 112, a.y < 450 ? 322 : 462];
const copyFrom = (a: Av): P => [CX + a.side * 98, 392];
const copyLand = (a: Av): P => [a.x - a.side * 38, a.y - 30];
const copyCtrl = (a: Av): P => {
  const s = copyFrom(a);
  const l = copyLand(a);
  return [(s[0] + l[0]) / 2, Math.min(s[1], l[1]) - 100];
};

const leftPage = `M${CX} ${TOP + 16} Q${CX - 96} ${TOP - 12} ${CX - PW} ${TOP} L${CX - PW} ${BOT} Q${CX - 96} ${BOT - 14} ${CX} ${BOT + 12} Z`;
const rightPage = `M${CX} ${TOP + 16} Q${CX + 96} ${TOP - 12} ${CX + PW} ${TOP} L${CX + PW} ${BOT} Q${CX + 96} ${BOT - 14} ${CX} ${BOT + 12} Z`;
const cover = `M${CX - PW - 14} ${TOP + 10} L${CX - PW - 14} ${BOT + 16} Q${CX - 96} ${BOT + 6} ${CX} ${BOT + 30} Q${CX + 96} ${BOT + 6} ${CX + PW + 14} ${BOT + 16} L${CX + PW + 14} ${TOP + 10} Q${CX + 96} ${TOP + 2} ${CX} ${TOP + 26} Q${CX - 96} ${TOP + 2} ${CX - PW - 14} ${TOP + 10} Z`;

const segCol = (k: Seg[1], a: number) => (k === "k" ? rgba(CYAN, 0.92 * a) : k === "a" ? rgba(AMBER_HOT, a) : `rgba(226,236,250,${(0.58 * a).toFixed(3)})`);

/** a row of code bars starting at x; `draw` 0..1 grows them left→right */
const Bars: React.FC<{ x: number; y: number; segs: Seg[]; draw: number; a?: number; glow?: number }> = ({ x, y, segs, draw, a = 1, glow = 0 }) => {
  const total = segs.reduce((s, [w]) => s + w + 8, -8);
  let cx = x;
  const lim = x + total * clamp01(draw);
  return (
    <g>
      {segs.map(([w, k], i) => {
        const x0 = cx;
        cx += w + 8;
        const ww = Math.max(0, Math.min(w, lim - x0));
        if (ww < 1) return null;
        return <rect key={i} x={x0} y={y - 5.5} width={ww} height={11} rx={5.5} fill={segCol(k, a)} style={glow > 0 && k === "a" ? { filter: `drop-shadow(0 0 ${(8 * glow).toFixed(1)}px rgba(245,158,11,0.9))` } : undefined} />;
      })}
    </g>
  );
};

/** glass avatar (head + shoulders), base centre (0,0) */
const Avatar: React.FC<{ lit: number }> = ({ lit }) => {
  const c: RGB = [Math.round(lerp(34, 214, lit)), Math.round(lerp(211, 246, lit)), Math.round(lerp(238, 255, lit))];
  const stroke = rgba(c, 0.55 + 0.45 * lit);
  return (
    <g>
      {lit > 0.01 ? <circle cx={0} cy={-40} r={64} fill="url(#osAvHalo)" opacity={lit * 0.85} /> : null}
      <path d="M-34 0 C-34 -30 -22 -42 0 -42 C22 -42 34 -30 34 0 Z" fill="url(#osAvB)" stroke={stroke} strokeWidth={2.6} strokeLinejoin="round" />
      <circle cx={0} cy={-62} r={17} fill="url(#osAvH)" stroke={stroke} strokeWidth={2.6} />
      <path d="M-9 -70 A11 11 0 0 1 4 -74" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2.2} strokeLinecap="round" />
    </g>
  );
};

/** eye badge, centred (0,0) */
const Eye: React.FC<{ lit: number; open: number; look: number }> = ({ lit, open, look }) => (
  <g>
    <circle r={26} fill="rgba(8,18,38,0.88)" stroke={rgba(lit > 0.3 ? ICE : CYAN, 0.45 + 0.55 * lit)} strokeWidth={2.6} style={{ filter: `drop-shadow(0 0 ${(4 + 12 * lit).toFixed(1)}px rgba(34,211,238,${(0.7 * lit).toFixed(2)}))` }} />
    <g transform={`scale(1 ${Math.max(0.08, open).toFixed(3)})`}>
      <path d="M-17 0 Q0 -14 17 0 Q0 14 -17 0 Z" fill={rgba(CYAN, 0.12 + 0.2 * lit)} stroke={rgba(ICE, 0.5 + 0.5 * lit)} strokeWidth={2.6} strokeLinejoin="round" />
      <circle cx={look * 3} cy={0} r={6.5} fill={rgba(CYAN, 0.45 + 0.55 * lit)} />
      <circle cx={look * 3} cy={0} r={2.8} fill="#04070F" />
      <circle cx={look * 3 + 2.2} cy={-2.2} r={1.4} fill="#FFFFFF" opacity={lit} />
    </g>
  </g>
);

const MINI_ROWS: [number, number, string][] = [
  [-20, 26, "k"],
  [-8, 36, "t"],
  [4, 30, "t"],
  [16, 22, "k"],
];
/** a mini copy of the page, centred (0,0) */
const MiniPage: React.FC<{ a?: number; glow?: number; scribble?: number }> = ({ a = 1, glow = 1, scribble = 0 }) => (
  <g opacity={a}>
    <rect x={-29} y={-36} width={58} height={72} rx={9} fill="url(#osMini)" stroke={rgba(ICE, 0.9)} strokeWidth={2.4} style={{ filter: `drop-shadow(0 0 ${(6 + 10 * glow).toFixed(1)}px rgba(34,211,238,${(0.75 * glow).toFixed(2)}))` }} />
    <path d="M15 -36 L29 -22" stroke={rgba(ICE, 0.6)} strokeWidth={2} />
    {MINI_ROWS.map(([y, w, kk], i) => (
      <rect key={i} x={-19} y={y - 3} width={w} height={6} rx={3} fill={kk === "k" ? rgba(CYAN, 0.9) : "rgba(226,236,250,0.6)"} />
    ))}
    {scribble > 0 ? (
      <path d="M-20 4 q6 -6 12 0 t12 0 t12 0" fill="none" stroke={rgba(AMBER_HOT, 1)} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray={`${scribble} 2`} style={{ filter: "drop-shadow(0 0 5px rgba(245,158,11,0.9))" }} />
    ) : null}
  </g>
);

/** pencil glyph ✎, centred (0,0), ~28 px */
const Pencil: React.FC<{ s?: number; col?: string }> = ({ s = 1, col = "#FFFFFF" }) => (
  <g transform={`scale(${s}) rotate(45)`}>
    <rect x={-4.5} y={-13} width={9} height={20} rx={1.5} fill={col} />
    <path d="M-4.5 7 L0 14 L4.5 7 Z" fill={col} />
    <rect x={-4.5} y={-18} width={9} height={3.5} rx={1.5} fill={col} opacity={0.7} />
  </g>
);

/** padlock, centred (0,0); the shackle lifts then swings around its left post */
const Padlock: React.FC<{ lift: number; swing: number; lit: number }> = ({ lift, swing, lit }) => {
  const col = lit > 0.5 ? rgba(ICE, 1) : `rgba(203,213,225,${(0.75 + 0.25 * lit).toFixed(2)})`;
  return (
    <g>
      <g transform={`translate(0 ${lift.toFixed(2)}) rotate(${swing.toFixed(2)} -9 -2)`}>
        <path d="M-9 -2 V-11 A9 9 0 0 1 9 -11 V-2" fill="none" stroke={col} strokeWidth={4.4} strokeLinecap="round" />
      </g>
      <rect x={-15} y={-3} width={30} height={23} rx={5} fill={lit > 0.5 ? rgba(CYAN, 0.35 + 0.25 * lit) : "rgba(148,163,184,0.25)"} stroke={col} strokeWidth={3} />
      <circle cx={0} cy={7} r={3} fill={col} />
      <rect x={-1.4} y={8} width={2.8} height={6} rx={1.4} fill={col} />
    </g>
  );
};

export const OpenSourceFx: ToolFx = ({ g, f0, f1, beats, size }) => {
  const t = g - f0;
  const k = size / 760;
  const bp = beatPulse(g, 14);
  const dur = f1 - f0;

  // ── phases ──
  let tL = 18;
  let tC = 46;
  let tA = 76;
  const rel = beats.map((b) => b - f0).filter((x) => x > 6 && x < dur - 24).sort((a, b) => a - b);
  if (beats.length === 3 && rel.length === 3) {
    tL = Math.max(16, rel[0] - 4);
    tC = Math.max(tL + 22, rel[1] - 4);
    tA = Math.max(tC + 30, rel[2] - 4);
  }
  const tE = tA + 24; // the edit lands on the page
  const idleC = clamp01((t - tC - 40) / 20);

  // ── unlock + book ──
  const lift = iv(t, [3, 8], [0, -7], EASE_OUT);
  const swing = iv(t, [7, 14], [0, -40], EASE_OUT) + (t > 14 ? 5 * Math.sin((t - 14) * 0.7) * decay(t - 14, 6) : 0);
  const unlocked = iv(t, [10, 16], [0, 1]);
  const pillW = lerp(68, 214, iv(t, [12, 26], [0, 1], EASE_OUT));
  const pageLit = iv(t, [12, 32], [0, 1], EASE_OUT);
  const bookEn = iv(t, [0, 12], [0, 1], EASE_OUT);
  const badgePop = t >= 12 ? 1 + 0.08 * Math.sin(clamp01((t - 12) / 12) * Math.PI) : 1;

  // ── edit ──
  const wipe = iv(t, [tE, tE + 10], [0, 1], EASE_OUT);
  const oldOut = iv(t, [tE, tE + 6], [1, 0]);
  const newIn = iv(t, [tE + 3, tE + 14], [0, 1], EASE_OUT);
  const penPop = t >= tE + 4 ? iv(t, [tE + 4, tE + 12], [0, 1], EASE_OUT) * (1 + 0.3 * Math.sin(clamp01((t - tE - 4) / 10) * Math.PI)) : 0;
  const bump = iv(t, [tE + 6, tE + 18], [0, 1], EASE_OUT);
  const v2Pop = t >= tE + 8 ? 1 + 0.35 * Math.sin(clamp01((t - tE - 8) / 12) * Math.PI) * decay(t - tE - 8, 10) : 1;
  const editIdle = clamp01((t - tE - 18) / 20);
  const pulse = 0.5 + 0.5 * Math.sin(g * 0.12);
  const chipGlow = bump * (0.55 + 0.25 * Math.sin(g * 0.11) * editIdle + 0.3 * bp * editIdle + 0.6 * decay(t - tE - 8, 12));

  // ── light sweep across the pages (once at unlock, then every 120 f) ──
  const sweepAge = t < 60 ? t - 14 : (t - 60) % 120;
  const sweep = iv(sweepAge, [0, 34], [0, 1], EASE_IN_OUT);
  const sweepX = lerp(130, 650, sweep);
  const sweepA = sweepAge >= 0 && sweepAge <= 34 ? Math.sin(sweep * Math.PI) * (t < 60 ? 0.5 : 0.3) : 0;

  // shared per-avatar motion (hop when it lights, bob afterwards)
  const motion = (i: number) => {
    const l0 = tL + 4 * i;
    const hop = t >= l0 ? Math.sin(clamp01((t - l0) / 14) * Math.PI) * 10 : 0;
    const bob = Math.sin(g * 0.075 + i * 1.7) * 3.5 * clamp01((t - l0 - 14) / 20);
    return { l0, hop, bob };
  };

  // ── avatars, eyes, rays ──
  const rays: React.ReactNode[] = [];
  const avEls: React.ReactNode[] = [];
  const eyes: React.ReactNode[] = [];
  AVS.forEach((a, i) => {
    const en = iv(t, [6 + 3 * i, 22 + 3 * i], [0, 1], EASE_OUT);
    const { l0, hop, bob } = motion(i);
    const lit = iv(t, [l0, l0 + 10], [0, 1], EASE_OUT);
    const ay = a.y - hop + bob + (1 - en) * 16;
    avEls.push(
      <g key={i} opacity={en * (0.7 + 0.3 * lit)} transform={`translate(${a.x} ${ay.toFixed(2)}) scale(${AS})`}>
        <Avatar lit={lit} />
      </g>,
    );
    // eye badge
    const [ex, ey0] = eyeOf(a);
    const ey = ey0 - hop * 0.6 + bob;
    const blinkPh = (t - l0 - 40 - i * 23) % 97;
    const blink = t > l0 + 40 && blinkPh >= 0 && blinkPh < 8 ? Math.abs(Math.cos((blinkPh / 8) * Math.PI)) : 1;
    const open = iv(t, [l0, l0 + 8], [0.12, 1], EASE_OUT) * blink;
    const ePop = t >= l0 ? 1 + 0.25 * Math.sin(clamp01((t - l0) / 10) * Math.PI) * decay(t - l0, 8) : 1;
    eyes.push(
      <g key={i} opacity={en * (0.5 + 0.5 * lit)} transform={`translate(${ex} ${ey.toFixed(2)}) scale(${(ePop * (0.85 + 0.15 * en)).toFixed(3)})`}>
        <Eye lit={lit} open={open} look={-a.side} />
      </g>,
    );
    // reading ray: cone of light page → eye, dashes + motes running into the eye
    const rg = iv(t, [l0, l0 + 14], [0, 1], EASE_OUT);
    if (rg > 0.01) {
      const S = raySrc(a);
      const E: P = [ex, ey];
      const Ec: P = [lerp(S[0], E[0], rg), lerp(S[1], E[1], rg)];
      const dx = E[0] - S[0];
      const dy = E[1] - S[1];
      const L = Math.hypot(dx, dy);
      const nx = -dy / L;
      const ny = dx / L;
      const flash = decay(t - l0 - 10, 10);
      const ra = (0.75 + 0.25 * Math.sin(g * 0.13 + i * 1.3)) * (1 - 0.35 * clamp01((t - l0 - 30) / 30)) + 0.5 * flash;
      const wS = 40;
      const wE = 9 * rg;
      const poly = `${S[0] + nx * wS},${S[1] + ny * wS} ${S[0] - nx * wS},${S[1] - ny * wS} ${Ec[0] - nx * wE},${Ec[1] - ny * wE} ${Ec[0] + nx * wE},${Ec[1] + ny * wE}`;
      rays.push(
        <g key={i} opacity={Math.min(1, ra)}>
          <defs>
            <linearGradient id={`osRay${i}`} gradientUnits="userSpaceOnUse" x1={S[0]} y1={S[1]} x2={E[0]} y2={E[1]}>
              <stop offset="0" stopColor={rgba(CYAN, 0.16)} />
              <stop offset="0.6" stopColor={rgba(CYAN, 0.3)} />
              <stop offset="1" stopColor={rgba(ICE, 0.6)} />
            </linearGradient>
          </defs>
          <ellipse cx={S[0]} cy={S[1]} rx={40} ry={22} fill={rgba(CYAN, 0.35)} filter="url(#osBlur)" />
          <polygon points={poly} fill={`url(#osRay${i})`} />
          <line x1={S[0]} y1={S[1]} x2={Ec[0]} y2={Ec[1]} stroke={rgba(CYAN, 0.5)} strokeWidth={16} strokeLinecap="round" filter="url(#osBlur)" />
          {[-0.55, 0, 0.55].map((o, q) => (
            <line
              key={q}
              x1={S[0] + nx * wS * o}
              y1={S[1] + ny * wS * o}
              x2={Ec[0] + nx * wE * o}
              y2={Ec[1] + ny * wE * o}
              stroke={rgba(ICE, q === 1 ? 0.95 : 0.55)}
              strokeWidth={q === 1 ? 3.6 : 2.4}
              strokeLinecap="round"
              strokeDasharray="5 15"
              strokeDashoffset={-(t * 1.8 + q * 6)}
            />
          ))}
          {Array.from({ length: 3 }, (_, q) => {
            const u = ((t - l0) * 0.028 + q / 3) % 1;
            if (u > rg) return null;
            const o = (rand(i * 7 + q * 3.3) - 0.5) * (1 - u) * 1.2;
            const px = lerp(S[0], E[0], u) + nx * wS * o;
            const py = lerp(S[1], E[1], u) + ny * wS * o;
            return <circle key={q} cx={px} cy={py} r={4.2} fill="#FFFFFF" opacity={Math.sin(u * Math.PI)} style={{ filter: "drop-shadow(0 0 5px rgba(34,211,238,0.9))" }} />;
          })}
        </g>,
      );
    }
  });

  // ── copies flying to the readers ──
  const copies: React.ReactNode[] = [];
  const held: React.ReactNode[] = [];
  const pops: React.ReactNode[] = [];
  AVS.forEach((a, i) => {
    const c0 = tC + 4 * i;
    const S = copyFrom(a);
    const C = copyCtrl(a);
    const Ld = copyLand(a);
    const peel = iv(t, [c0, c0 + 7], [0, 1], EASE_OUT);
    const fl = iv(t, [c0 + 7, c0 + 23], [0, 1], EASE_IN_OUT);
    const landed = t >= c0 + 23;
    if (t >= c0 && !landed) {
      // the copy + its motion trail
      for (let q = 2; q >= 0; q--) {
        const u = Math.max(0, fl - q * 0.07);
        const [px, py] = fl > 0 ? bez(S, C, Ld, u) : [S[0], S[1] - 16 * peel];
        const rot = a.side * (-14 * Math.sin(u * Math.PI)) + (1 - peel) * a.side * 8;
        const sx = 1;
        const sc = (fl > 0 ? 1.3 - 0.15 * u : 0.7 + 0.6 * peel);
        copies.push(
          <g key={`${i}-${q}`} transform={`translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${rot.toFixed(2)}) scale(${(sx * sc).toFixed(3)} ${sc.toFixed(3)})`}>
            <MiniPage a={q === 0 ? clamp01(peel * 1.6) : fl > 0 ? 0.32 / q : 0} glow={1 + 0.8 * (1 - peel)} />
          </g>,
        );
      }
    }
    if (landed) {
      const age = t - c0 - 23;
      const sq = age < 12 ? 1 + 0.18 * Math.sin((age / 12) * Math.PI * 2) * decay(age, 6) : 1;
      const { hop, bob } = motion(i);
      const scrib = i === EDITOR ? iv(t, [tA, tA + 10], [0, 1], EASE_IN_OUT) : 0;
      const shake = i === EDITOR && t >= tA && t < tA + 10 ? Math.sin(t * 2.4) * 2 : 0;
      held.push(
        <g key={i} transform={`translate(${Ld[0] + shake} ${(Ld[1] - hop + bob).toFixed(2)}) rotate(${a.side * -6}) scale(${(1.15 / sq).toFixed(3)} ${(1.15 * sq).toFixed(3)})`}>
          <MiniPage glow={0.45 + 0.55 * decay(age, 14) + (i === EDITOR ? 0.3 * scrib : 0)} scribble={scrib} />
          {i === EDITOR && t >= tA && t < tA + 14 ? (
            <g transform={`translate(${lerp(-14, 22, scrib).toFixed(1)} ${(-10 + Math.sin(t * 1.6) * 3).toFixed(1)})`} opacity={iv(t, [tA + 10, tA + 14], [1, 0])}>
              <Pencil s={1} col={rgba(AMBER_HOT, 1)} />
            </g>
          ) : null}
        </g>,
      );
      if (age < 18) {
        const p = age / 18;
        pops.push(<circle key={i} cx={Ld[0]} cy={Ld[1]} r={20 + 50 * EASE_OUT(p)} fill="none" stroke={rgba(ICE, 0.75 * (1 - p))} strokeWidth={3 * (1 - p) + 0.5} />);
      }
    }
    // idle: ghost copies keep flowing to the readers
    if (idleC > 0) {
      const per = 84;
      const since = t - tC - 40 - i * 21;
      const ph = since % per;
      if (since >= 0 && ph < 34) {
        const u = EASE_IN_OUT(ph / 34);
        const [px, py] = bez(S, C, Ld, u);
        copies.push(
          <g key={`g${i}`} transform={`translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${(a.side * -12 * Math.sin(u * Math.PI)).toFixed(2)}) scale(0.6)`}>
            <MiniPage a={idleC * 0.6 * Math.sin(u * Math.PI)} glow={0.8} />
          </g>,
        );
      }
    }
  });

  // ── the ✎ patch flying back to the book ──
  const ed = AVS[EDITOR];
  const pS = copyLand(ed);
  const pC: P = [(pS[0] + EDIT_PT[0]) / 2 + 30, Math.min(pS[1], EDIT_PT[1]) - 50];
  const pf = iv(t, [tA + 8, tE], [0, 1], EASE_IN_OUT);
  let patch: React.ReactNode = null;
  if (t >= tA + 8 && t < tE + 2) {
    const trail = [3, 2, 1].map((q) => {
      const u = Math.max(0, pf - q * 0.06);
      const [px, py] = bez(pS, pC, EDIT_PT, u);
      return <circle key={q} cx={px} cy={py} r={16 - 3 * q} fill={rgba(AMBER, 0.55 / q)} filter="url(#osBlur)" />;
    });
    const [px, py] = bez(pS, pC, EDIT_PT, pf);
    const s = iv(t, [tA + 8, tA + 13], [0.3, 1], EASE_OUT) * (1 - 0.3 * clamp01((pf - 0.85) / 0.15));
    patch = (
      <g>
        {trail}
        <g transform={`translate(${px.toFixed(1)} ${py.toFixed(1)}) scale(${s.toFixed(3)})`}>
          <circle r={36} fill={rgba(AMBER, 0.35)} filter="url(#osBlur)" />
          <rect x={-31} y={-22} width={62} height={44} rx={22} fill={rgba(AMBER, 0.96)} stroke="rgba(255,236,200,0.95)" strokeWidth={2.4} />
          <Pencil s={0.95} />
        </g>
      </g>
    );
  }

  // sparks at the edit + at the chip
  const sparks: React.ReactNode[] = [];
  const burst = (x: number, y: number, at: number, n: number, sp: number, seed: number) => {
    for (let q = 0; q < n; q++) {
      const age = t - at - (q % 3);
      if (age < 0 || age > 28) continue;
      const ang = (q / n) * Math.PI * 2 + rand(seed + q) * 0.5;
      const v = sp * (0.6 + rand(seed + q * 2.7) * 0.7);
      const px = x + Math.cos(ang) * v * age * (1 - age / 60);
      const py = y + Math.sin(ang) * v * age * (1 - age / 60) + 0.12 * age * age;
      const col = q % 3 === 0 ? ICE : q % 3 === 1 ? AMBER_HOT : AMBER;
      sparks.push(<circle key={`${seed}-${q}`} cx={px} cy={py} r={(2.2 + rand(seed + q) * 2.6) * (1 - age / 32)} fill={rgba(col, 1 - age / 28)} />);
    }
  };
  burst(EDIT_PT[0], EDIT_PT[1], tE, 16, 6.5, 11);
  burst(CHIP[0] + 62, CHIP[1], tE + 8, 10, 4.5, 37);

  // text rows write in as the page lights
  const rowDraw = (r: number, off: number) => iv(t, [14 + off + 3 * r, 30 + off + 3 * r], [0, 1], EASE_OUT);
  const v1x = CHIP[0] - 64 * bump;
  const chipW = 124 + 120 * bump;
  const chipEn = iv(t, [10, 26], [0, 1], EASE_OUT);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: size, height: size }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: `scale(${k})`, transformOrigin: "0 0" }}>
        <Bloom x={CX} y={(TOP + BOT) / 2} rx={360} ry={260} col={CYAN} a={0.05 + 0.13 * pageLit + 0.04 * bp * pageLit} />
        <Bloom x={EDIT_PT[0]} y={EDIT_PT[1]} rx={200} ry={120} col={AMBER} a={0.18 * decay(t - tE, 18) + 0.05 * wipe * pulse} />
        <svg width={760} height={760} viewBox="0 0 760 760" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <filter id="osBlur" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <linearGradient id="osPage" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="1" stopColor="rgba(255,255,255,0.03)" />
            </linearGradient>
            <linearGradient id="osCover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(34,211,238,0.30)" />
              <stop offset="1" stopColor="rgba(10,24,52,0.95)" />
            </linearGradient>
            <linearGradient id="osMini" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgba(60,120,170,0.75)" />
              <stop offset="1" stopColor="rgba(9,22,46,0.95)" />
            </linearGradient>
            <linearGradient id="osAvB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(34,211,238,0.30)" />
              <stop offset="1" stopColor="rgba(10,24,52,0.9)" />
            </linearGradient>
            <radialGradient id="osAvH" cx="0.4" cy="0.35" r="0.7">
              <stop offset="0" stopColor="rgba(160,235,250,0.55)" />
              <stop offset="1" stopColor="rgba(12,30,60,0.9)" />
            </radialGradient>
            <radialGradient id="osAvHalo" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="rgba(34,211,238,0.28)" />
              <stop offset="1" stopColor="rgba(34,211,238,0)" />
            </radialGradient>
            <linearGradient id="osPill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(255,255,255,0.13)" />
              <stop offset="1" stopColor="rgba(255,255,255,0.03)" />
            </linearGradient>
            <linearGradient id="osSweep" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="rgba(255,255,255,0)" />
              <stop offset="0.5" stopColor="rgba(255,255,255,1)" />
              <stop offset="1" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <clipPath id="osPages">
              <path d={leftPage} />
              <path d={rightPage} />
            </clipPath>
            <clipPath id="osPillClip">
              <rect x={BADGE[0] - pillW / 2} y={BADGE[1] - 33} width={pillW} height={66} rx={33} />
            </clipPath>
          </defs>

          {rays}

          {/* ── the book ── */}
          <g opacity={bookEn} transform={`translate(0 ${((1 - bookEn) * 14).toFixed(1)})`}>
            <path d={cover} fill="url(#osCover)" stroke={rgba(CYAN, 0.75)} strokeWidth={3} strokeLinejoin="round" />
            {[8, 4].map((o) => (
              <g key={o} transform={`translate(0 ${o})`} opacity={0.5}>
                <path d={leftPage} fill="rgba(8,18,38,0.9)" stroke={rgba(ICE, 0.35)} strokeWidth={1.6} />
                <path d={rightPage} fill="rgba(8,18,38,0.9)" stroke={rgba(ICE, 0.35)} strokeWidth={1.6} />
              </g>
            ))}
            {[leftPage, rightPage].map((d, i) => (
              <g key={i}>
                <path d={d} fill="rgba(9,20,42,0.94)" />
                <path d={d} fill="url(#osPage)" />
                <path d={d} fill={rgba(CYAN, 0.07 * pageLit)} />
                <path d={d} fill="none" stroke={rgba(ICE, 0.55 + 0.35 * pageLit)} strokeWidth={2.6} strokeLinejoin="round" />
              </g>
            ))}
            <line x1={CX} y1={TOP + 16} x2={CX} y2={BOT + 12} stroke={rgba(ICE, 0.35 + 0.4 * pageLit)} strokeWidth={2.4} />
            <line x1={CX} y1={TOP + 16} x2={CX} y2={BOT + 12} stroke={rgba(CYAN, 0.4 * pageLit)} strokeWidth={10} filter="url(#osBlur)" />

            {/* left page: « recette » */}
            <text x={CX - PW / 2} y={TOP + 62} textAnchor="middle" fontFamily={fontInter} fontWeight={800} fontSize={33} letterSpacing="-0.02em" fill="#F8FAFC" opacity={rowDraw(0, -4)}>
              recette
            </text>
            <rect x={CX - PW / 2 - 26} y={TOP + 76} width={52 * rowDraw(0, -2)} height={4} rx={2} fill={rgba(CYAN, 0.9)} />
            {LEFT_ROWS.map((w, r) => {
              const y = TOP + 112 + r * 34;
              const d = rowDraw(r + 1, 0);
              return (
                <g key={r} opacity={clamp01(d * 3)}>
                  <circle cx={CX - PW + 30} cy={y} r={5} fill={rgba(CYAN, 0.9)} />
                  <rect x={CX - PW + 44} y={y - 5.5} width={w * d} height={11} rx={5.5} fill="rgba(226,236,250,0.55)" />
                </g>
              );
            })}

            {/* right page: numbered code lines */}
            {ROWS.map((segs, r) => {
              const y = ROW_Y[r];
              const d = rowDraw(r, 2);
              const isEdit = r === EDIT_ROW;
              return (
                <g key={r}>
                  {isEdit && wipe > 0 ? (
                    <rect
                      x={CX + 14}
                      y={y - 15}
                      width={(PW - 22) * wipe}
                      height={30}
                      rx={8}
                      fill={rgba(AMBER, 0.16 + 0.08 * pulse * editIdle + 0.2 * decay(t - tE, 10))}
                      stroke={rgba(AMBER, 0.75)}
                      strokeWidth={2}
                      style={{ filter: `drop-shadow(0 0 ${(6 + 6 * decay(t - tE, 12)).toFixed(1)}px rgba(245,158,11,0.6))` }}
                    />
                  ) : null}
                  <text x={CX + 30} y={y + 6} textAnchor="middle" fontFamily={fontMono} fontWeight={700} fontSize={17} fill={isEdit && wipe > 0 ? rgba(AMBER_HOT, 0.95) : "rgba(226,236,250,0.42)"} opacity={clamp01(d * 3)}>
                    {r + 1}
                  </text>
                  {isEdit ? (
                    <g>
                      {oldOut > 0 ? <Bars x={CX + 48} y={y} segs={segs} draw={d} a={oldOut} /> : null}
                      {newIn > 0 ? <Bars x={CX + 48} y={y} segs={NEW_ROW} draw={newIn} glow={1} /> : null}
                    </g>
                  ) : (
                    <Bars x={CX + 48} y={y} segs={segs} draw={d} />
                  )}
                </g>
              );
            })}
            {/* light sweep */}
            {sweepA > 0.01 ? (
              <g clipPath="url(#osPages)">
                <rect x={sweepX - 60} y={TOP - 80} width={120} height={BOT - TOP + 160} fill="url(#osSweep)" opacity={sweepA} transform={`rotate(18 ${sweepX} ${(TOP + BOT) / 2})`} />
              </g>
            ) : null}
          </g>

          {/* ✎ badge on the margin */}
          {penPop > 0.01 ? (
            <g transform={`translate(${CX + PW + 2} ${ROW_Y[EDIT_ROW]}) scale(${penPop.toFixed(3)})`}>
              <circle r={22} fill={rgba(AMBER, 0.95)} stroke="rgba(255,236,200,0.95)" strokeWidth={2.4} style={{ filter: `drop-shadow(0 0 ${(8 + 6 * pulse * editIdle).toFixed(1)}px rgba(245,158,11,0.85))` }} />
              <Pencil s={0.8} />
            </g>
          ) : null}

          {/* ── « public » badge with the padlock ── */}
          <g opacity={iv(t, [0, 8], [0, 1])} transform={`translate(${BADGE[0]} ${BADGE[1]}) scale(${badgePop.toFixed(3)}) translate(${-BADGE[0]} ${-BADGE[1]})`}>
            <rect x={BADGE[0] - pillW / 2} y={BADGE[1] - 33} width={pillW} height={66} rx={33} fill="rgba(9,20,42,0.92)" />
            <rect
              x={BADGE[0] - pillW / 2}
              y={BADGE[1] - 33}
              width={pillW}
              height={66}
              rx={33}
              fill="url(#osPill)"
              stroke={unlocked > 0.5 ? rgba(CYAN, 0.85) : "rgba(255,255,255,0.22)"}
              strokeWidth={2.4}
              style={{ filter: `drop-shadow(0 0 ${(4 + 16 * unlocked * (0.7 + 0.3 * bp)).toFixed(1)}px rgba(34,211,238,${(0.6 * unlocked).toFixed(2)}))` }}
            />
            <g clipPath="url(#osPillClip)">
              <g transform={`translate(${(BADGE[0] - pillW / 2 + 34).toFixed(1)} ${BADGE[1] - 3})`}>
                <Padlock lift={lift} swing={swing} lit={unlocked} />
              </g>
              <text x={BADGE[0] - pillW / 2 + 64} y={BADGE[1] + 11} fontFamily={fontInter} fontWeight={800} fontSize={33} letterSpacing="-0.01em" fill="#F8FAFC" opacity={iv(t, [16, 24], [0, 1])}>
                public
              </text>
              {t >= 14 && t < 40 ? (
                <rect x={BADGE[0] - 140 + 300 * iv(t, [14, 36], [0, 1], EASE_IN_OUT)} y={BADGE[1] - 60} width={40} height={120} fill="url(#osSweep)" opacity={0.55} transform={`rotate(20 ${BADGE[0]} ${BADGE[1]})`} />
              ) : null}
            </g>
          </g>

          {/* ── avatars, held copies, eyes, flying copies ── */}
          {avEls}
          {held}
          {pops}
          {eyes}
          {copies}
          {patch}

          {/* ── version chip ── */}
          <g opacity={chipEn}>
            <rect x={CHIP[0] - chipW / 2} y={CHIP[1] - 30} width={chipW} height={60} rx={30} fill="rgba(9,20,42,0.92)" />
            <rect
              x={CHIP[0] - chipW / 2}
              y={CHIP[1] - 30}
              width={chipW}
              height={60}
              rx={30}
              fill="url(#osPill)"
              stroke={bump > 0.3 ? rgba(AMBER, 0.6 + 0.4 * Math.min(1, chipGlow)) : rgba(CYAN, 0.6)}
              strokeWidth={2.4}
              style={{ filter: `drop-shadow(0 0 ${(4 + 18 * chipGlow).toFixed(1)}px rgba(245,158,11,${(0.65 * Math.min(1, chipGlow)).toFixed(2)}))` }}
            />
            <text x={v1x} y={CHIP[1] + 11} textAnchor="middle" fontFamily={fontMono} fontWeight={800} fontSize={32} fill={bump > 0.3 ? "rgba(226,236,250,0.5)" : "#F8FAFC"}>
              v1
            </text>
            {bump > 0.01 ? (
              <g opacity={bump}>
                <path d={`M${CHIP[0] - 22} ${CHIP[1]} H${CHIP[0] + 14} M${CHIP[0] + 4} ${CHIP[1] - 9} L${CHIP[0] + 14} ${CHIP[1]} L${CHIP[0] + 4} ${CHIP[1] + 9}`} fill="none" stroke="rgba(226,236,250,0.7)" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
                <g transform={`translate(${CHIP[0] + 62} ${(CHIP[1] + (1 - bump) * 22).toFixed(1)}) scale(${v2Pop.toFixed(3)})`}>
                  <text x={0} y={11} textAnchor="middle" fontFamily={fontMono} fontWeight={800} fontSize={32} fill={rgba(AMBER_HOT, 1)} style={{ filter: `drop-shadow(0 0 ${(6 + 8 * Math.min(1, chipGlow)).toFixed(1)}px rgba(245,158,11,0.8))` }}>
                    v2
                  </text>
                </g>
              </g>
            ) : null}
          </g>

          {sparks}
        </svg>

        <AnamorphicFlare age={t - 15} x={BADGE[0] - 73} y={BADGE[1] - 3} col={CYAN} dur={26} size={90} streakH={50} strength={0.6} />
        <AnamorphicFlare age={t - tE} x={EDIT_PT[0]} y={EDIT_PT[1]} col={AMBER} dur={30} size={120} streakH={70} strength={0.75} />
        <AnamorphicFlare age={t - tE - 8} x={CHIP[0] + 62} y={CHIP[1]} col={AMBER} dur={26} size={90} streakH={50} strength={0.6} />
        <Shockwave age={t - tE} x={EDIT_PT[0]} y={EDIT_PT[1]} col={AMBER} dur={24} maxR={330} r0={30} strength={0.55} />
        <Bloom x={CHIP[0] + 40} y={CHIP[1]} rx={180} ry={90} col={AMBER} a={0.08 * chipGlow} />
      </div>
    </div>
  );
};
