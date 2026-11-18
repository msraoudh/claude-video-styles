/**
 * Shared stage for the terminal / code / steps archetypes (one copy per archetype folder — keep them in sync by
 * copying, never import across archetype folders).
 *
 * The lit world behind the glass, ported from the brand intro s4 corridor: deep-ink depth gradient, drifting light
 * plates (cyan / blue / teal + one faint warm ember) that breathe on the music beat and flash on the scene's hits,
 * a perspective floor + ceiling grid the camera slowly travels through, a particle field (sharp dust behind, soft
 * bokeh in front), a slow camera push 1 → 1.04, a top/bottom grade that keeps the caption band calm and the
 * 5-frame cyan light streak that masks the hard cut into the scene.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { fontInter, fontMono } from "../../kit/fonts";
import { B } from "../../lib/look";
import { beatPulse, rand } from "../../lib/sync";
import { PHRASES } from "../../data/voice";
import type { SceneSpec } from "../../data/episode";

/* ───────────────────────────── maths / easing helpers (house curves) ───────────────────────────── */
export const EO = Easing.bezier(0.16, 1, 0.3, 1);
export const EIO = Easing.bezier(0.65, 0, 0.35, 1);
export const EI = Easing.bezier(0.7, 0, 0.84, 0);
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const lin = (g: number, a: number, b: number, from = 0, to = 1, ease?: (t: number) => number) =>
  b <= a
    ? g >= a
      ? to
      : from
    : interpolate(g, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", ...(ease ? { easing: ease } : {}) });
/** 0 before `at`, 1 at `at`, exponential decay after */
export const kick = (g: number, at: number, decay = 6) => (g < at ? 0 : Math.exp(-(g - at) / decay));
export const kickAny = (g: number, ats: number[], decay = 6) => ats.reduce((m, a) => Math.max(m, kick(g, a, decay)), 0);
/** 0..1 pop with a small overshoot */
export const pop = (g: number, at: number, dur = 12) => {
  const t = clamp01((g - at) / dur);
  if (t <= 0) return 0;
  const c1 = 1.5;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const CYAN = "34,211,238";
export const AMBER = "245,158,11";
export const OK = "52,211,153";
export const rgba = (rgb: string, a: number) => `rgba(${rgb},${clamp01(a).toFixed(3)})`;

/** entrance style: blur 14→0 + rise + scale 0.94→1 (house ease). Returns undefined filter once settled (keeps backdrop). */
export const enter = (g: number, at: number, dur = 16, rise = 34, blur = 14): React.CSSProperties => {
  const p = EO(clamp01((g - at) / dur));
  const b = (1 - p) * blur;
  return {
    opacity: clamp01((g - at) / (dur * 0.45)),
    transform: `translateY(${((1 - p) * rise).toFixed(1)}px) scale(${(0.94 + 0.06 * p).toFixed(4)})`,
    filter: b > 0.15 ? `blur(${b.toFixed(2)}px)` : undefined,
  };
};

/* ───────────────────────────── text metrics (deterministic, no DOM measuring) ───────────────────────────── */
/** JetBrains Mono advance = 0.6 em for every glyph */
export const MONO_ADV = 0.6;
/**
 * Inter (700–800) width estimate in em per character — slightly generous so text never overflows. We do not use
 * measureText at render time: its cache can capture fallback-font metrics before the webfont is ready.
 */
const INTER_NARROW = new Set("iljI.,:;'!|´`’ ".split(""));
const INTER_SEMI = new Set("frt()[]-  \"".split(""));
const INTER_WIDE = new Set("mwMWœŒ@%".split(""));
export const interWidth = (text: string, size: number, tracking = -0.02) => {
  let em = 0;
  for (const ch of text) {
    if (INTER_NARROW.has(ch)) em += 0.3;
    else if (INTER_SEMI.has(ch)) em += 0.42;
    else if (INTER_WIDE.has(ch)) em += 0.9;
    else if (/[A-ZÀ-Ý]/.test(ch)) em += 0.7;
    else if (/[0-9]/.test(ch)) em += 0.64;
    else em += 0.6;
    em += tracking;
  }
  return em * size;
};
/** balanced split of `text` into `n` lines at spaces (minimises the longest line) */
export const balancedSplit = (text: string, n: number, width: (s: string) => number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  if (n <= 1 || words.length < 2) return [words.join(" ")];
  let best: string[] = [words.join(" ")];
  let bestW = Infinity;
  if (n === 2) {
    for (let i = 1; i < words.length; i++) {
      const ls = [words.slice(0, i).join(" "), words.slice(i).join(" ")];
      const w = Math.max(...ls.map(width));
      if (w < bestW) {
        bestW = w;
        best = ls;
      }
    }
  } else {
    for (let i = 1; i < words.length - 1; i++)
      for (let j = i + 1; j < words.length; j++) {
        const ls = [words.slice(0, i).join(" "), words.slice(i, j).join(" "), words.slice(j).join(" ")];
        const w = Math.max(...ls.map(width));
        if (w < bestW) {
          bestW = w;
          best = ls;
        }
      }
  }
  return best;
};

/* ───────────────────────────── timing helpers ───────────────────────────── */
/** end frame (fe of the last word) of the phrase that contains the word starting at global frame f */
export const phraseEndAt = (spec: SceneSpec, f: number): number | undefined => {
  for (const p of PHRASES) {
    if (!spec.phrases.includes(p.id) || !p.words.length) continue;
    if (p.words[0].f <= f + 1 && p.words[p.words.length - 1].fe >= f) return p.words[p.words.length - 1].fe;
  }
  return undefined;
};

/* ───────────────────────────── camera / world ───────────────────────────── */
const FOC = 900;
const CXW = 540;
type Cam = { x: number; y: number; z: number; cy: number };
const camAt = (g: number, from: number, cy: number): Cam => {
  const t = g - from;
  return { x: Math.sin(t * 0.006 + 0.7) * 60, y: Math.cos(t * 0.005) * 26, z: t * 5.2 + 400, cy };
};
const proj = (cam: Cam, x: number, y: number, d: number) => {
  const s = FOC / (FOC + d);
  return { x: CXW + s * (x - cam.x), y: cam.cy + s * (y - cam.y), s };
};

type Bloom = { x: number; y: number; r: number; c: string; a: number; sx: number; sy: number; ph: number };
const blooms = (cy: number): Bloom[] => [
  { x: 560, y: cy - 140, r: 760, c: CYAN, a: 0.3, sx: 70, sy: 40, ph: 0 },
  { x: 180, y: cy + 420, r: 980, c: "59,130,246", a: 0.27, sx: 90, sy: 60, ph: 1.7 },
  { x: 940, y: cy - 560, r: 820, c: "14,116,144", a: 0.32, sx: 80, sy: 50, ph: 3.1 },
  { x: 880, y: cy + 760, r: 640, c: AMBER, a: 0.055, sx: 50, sy: 30, ph: 4.4 },
];

const Plates: React.FC<{ g: number; from: number; cy: number; hit: number }> = ({ g, from, cy, hit }) => {
  const bp = beatPulse(g, 14);
  const t = (g - from) / 60;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {blooms(cy).map((b, i) => {
        const x = b.x + Math.sin(t * 0.35 + b.ph) * b.sx;
        const y = b.y + Math.cos(t * 0.28 + b.ph * 1.3) * b.sy;
        const a = b.a * (1 + (i === 3 ? 0.2 : 0.55) * hit + 0.3 * bp);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - b.r,
              top: y - b.r,
              width: b.r * 2,
              height: b.r * 2,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(${b.c},${a.toFixed(3)}) 0%, rgba(${b.c},${(a * 0.35).toFixed(3)}) 38%, rgba(${b.c},0) 70%)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** floor + (fainter) ceiling grids: a lit corridor the camera travels through */
const Grid: React.FC<{ cam: Cam; uid: string }> = ({ cam, uid }) => {
  const planes = [
    { y: 780, a: 0.36, id: "f" },
    { y: -1000, a: 0.18, id: "c" },
  ];
  const step = 480;
  const k0 = Math.ceil((cam.z - 650) / step);
  const k1 = Math.floor((cam.z + 9000) / step);
  const sN = FOC / (FOC - 600);
  const sF = FOC / (FOC + 9000);
  const lines: React.ReactNode[] = [];
  const defs: React.ReactNode[] = [];
  for (const pl of planes) {
    for (let k = k0; k <= k1; k++) {
      const d = k * step - cam.z;
      const s = FOC / (FOC + d);
      const y = cam.cy + s * (pl.y - cam.y);
      const a = pl.a * Math.pow(clamp01(1 - d / 9000), 1.4) * clamp01((d + 650) / 300);
      lines.push(<line key={`${pl.id}t${k}`} x1={CXW + s * (-4200 - cam.x)} x2={CXW + s * (4200 - cam.x)} y1={y} y2={y} stroke={rgba(CYAN, a)} strokeWidth={2} />);
    }
    const yN = cam.cy + sN * (pl.y - cam.y);
    const yF = cam.cy + sF * (pl.y - cam.y);
    defs.push(
      <linearGradient key={pl.id} id={`${uid}-fade-${pl.id}`} x1="0" y1={yF} x2="0" y2={yN} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={B.cyan} stopOpacity={0} />
        <stop offset="0.5" stopColor={B.cyan} stopOpacity={pl.a * 0.45} />
        <stop offset="1" stopColor={B.cyan} stopOpacity={pl.a * 1.1} />
      </linearGradient>,
    );
    for (let k = -11; k <= 11; k++) {
      const x = k * 380;
      lines.push(<line key={`${pl.id}l${k}`} x1={CXW + sN * (x - cam.x)} y1={yN} x2={CXW + sF * (x - cam.x)} y2={yF} stroke={`url(#${uid}-fade-${pl.id})`} strokeWidth={2} />);
    }
  }
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>{defs}</defs>
      {lines}
    </svg>
  );
};

type Part = { x: number; y: number; z: number; r: number; white: boolean };
const SPAN = 6800;
const PARTS: Part[] = Array.from({ length: 170 }, (_, i) => {
  let x = (rand(i * 3.1 + 1) - 0.5) * 3600;
  let y = (rand(i * 5.7 + 2) - 0.5) * 2700;
  // keep the hero corridor clear so nothing crosses the glass text
  if (Math.abs(x) < 640 && Math.abs(y) < 600) {
    if (rand(i * 1.9) < 0.5) x = x < 0 ? x - 640 : x + 640;
    else y = y < 0 ? y - 600 : y + 600;
  }
  return { x, y, z: rand(i * 7.3 + 3) * SPAN, r: 1.3 + rand(i * 9.1) * 2.5, white: rand(i * 2.2) > 0.72 };
});

const Particles: React.FC<{ cam: Cam; front: boolean; uid: string }> = ({ cam, front, uid }) => {
  const els: React.ReactNode[] = [];
  PARTS.forEach((pt, i) => {
    const d = ((((pt.z - cam.z) % SPAN) + SPAN) % SPAN) - 700;
    if (front !== d < -120) return;
    const p = proj(cam, pt.x, pt.y, d);
    const r = Math.min(15, pt.r * p.s);
    const far = clamp01((SPAN - 700 - d) / 2400);
    const near = clamp01((d + 700) / 220);
    const a = (pt.white ? 0.7 : 0.8) * far * near * (p.s > 1.6 ? 0.5 : 1);
    if (a < 0.02) return;
    els.push(<circle key={i} cx={p.x} cy={p.y} r={Math.max(0.8, r)} fill={pt.white ? "rgb(235,245,255)" : B.cyan} opacity={a} />);
  });
  const id = `${uid}-bk-${front ? "f" : "b"}`;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={front ? 3.4 : 0.5} />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>{els}</g>
    </svg>
  );
};

/** the streak stays soft over the caption band (y 1300–1540) */
const STREAK_MASK = "linear-gradient(180deg, #000 0%, #000 64%, rgba(0,0,0,0.22) 68%, rgba(0,0,0,0.22) 81%, #000 85%)";
/** ONE 5-frame cyan light streak (sweeps across, masks the hard cut) */
export const Streak: React.FC<{ g: number; at: number; dir?: 1 | -1 }> = ({ g, at, dir = 1 }) => {
  const a = at - 2;
  const b = at + 4;
  if (g <= a || g >= b) return null;
  const p = (g - a) / (b - a);
  const x = dir > 0 ? mix(-380, 1460, p) : mix(1460, -380, p);
  const bar = (w: number, off: number, bg: string, glow: number) => (
    <div
      style={{
        position: "absolute",
        left: x + off - w / 2,
        top: -400,
        width: w,
        height: 2720,
        background: bg,
        boxShadow: `0 0 ${glow}px ${glow / 3}px ${rgba(CYAN, 0.6)}`,
        borderRadius: w,
        transform: `rotate(${dir * 16}deg)`,
      }}
    />
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", overflow: "hidden", WebkitMaskImage: STREAK_MASK, maskImage: STREAK_MASK }}>
      {bar(180, -120 * dir, rgba(CYAN, 0.16), 50)}
      {bar(30, 0, "rgba(190,250,255,0.78)", 34)}
      {bar(7, 64 * dir, "rgba(255,255,255,0.85)", 12)}
    </AbsoluteFill>
  );
};

/**
 * The world + camera. `children` = the hero (absolute, 1080x1920 coords), pushed with the camera (1 → 1.04).
 * `hit` (0..1) flashes the light plates. `cy` = vertical centre of the hero (light + grid horizon follow it).
 * Never put filter/opacity on the hero's ancestors (it would cut the glass backdrop) — the Stage only translates/scales.
 */
export const Stage: React.FC<{
  spec: SceneSpec;
  g: number;
  cy?: number;
  hit?: number;
  shake?: number;
  uid: string;
  children: React.ReactNode;
}> = ({ spec, g, cy = 745, hit = 0, shake = 0, uid, children }) => {
  const cam = camAt(g, spec.from, cy);
  const dur = Math.max(1, spec.to - spec.from);
  const push = 1 + 0.04 * EIO(clamp01((g - spec.from) / dur));
  const roll = Math.sin((g - spec.from) * 0.011) * 0.35;
  const sx = shake * 4 * Math.sin(g * 2.3);
  const sy = shake * 3 * Math.cos(g * 1.7);
  return (
    <AbsoluteFill style={{ background: B.ink, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: B.bg }} />
      <AbsoluteFill style={{ transform: `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) rotate(${roll.toFixed(3)}deg)`, transformOrigin: `540px ${cy}px` }}>
        <Plates g={g} from={spec.from} cy={cy} hit={hit} />
        <Grid cam={cam} uid={uid} />
        <Particles cam={cam} front={false} uid={uid} />
        <AbsoluteFill style={{ transform: `scale(${push.toFixed(4)})`, transformOrigin: `540px ${cy}px` }}>{children}</AbsoluteFill>
        <Particles cam={cam} front uid={uid} />
      </AbsoluteFill>
      {/* soft top/bottom grade so the HUD + caption band stay calm */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(4,7,15,0.55) 0%, rgba(4,7,15,0) 13%, rgba(4,7,15,0) 64%, rgba(4,7,15,0.35) 78%, rgba(4,7,15,0.6) 100%)",
          pointerEvents: "none",
        }}
      />
      <Streak g={g} at={spec.from + 1} dir={1} />
    </AbsoluteFill>
  );
};

/* ───────────────────────────── glass shell (brand intro recipe) ───────────────────────────── */
/**
 * Glass card: real backdrop blur of the lit world behind it + a refracted light that slides inside the glass
 * (lx/ly in %), gradient rim (cyan, flashes on the hit), top sheen, optional light sweep (`sheen` 0..1).
 */
export const Shell: React.FC<{
  w: number;
  h: number;
  flash?: number;
  sheen?: number;
  lx?: number;
  ly?: number;
  radius?: number;
  glow?: number;
  tint?: string;
  children?: React.ReactNode;
}> = ({ w, h, flash = 0, sheen = -1, lx = 28, ly = 8, radius = 38, glow = 1, tint = CYAN, children }) => (
  <div
    style={{
      position: "relative",
      width: w,
      height: h,
      borderRadius: radius,
      overflow: "hidden",
      background: "linear-gradient(165deg, rgba(36,58,100,0.50) 0%, rgba(14,26,52,0.62) 40%, rgba(6,12,28,0.76) 100%)",
      backdropFilter: "blur(26px) saturate(175%)",
      WebkitBackdropFilter: "blur(26px) saturate(175%)",
      boxShadow: [
        "0 0 0 0.5px rgba(255,255,255,0.18)",
        "0 10px 26px rgba(0,0,0,0.5)",
        "0 46px 100px rgba(0,0,0,0.5)",
        `0 0 ${((70 + 90 * flash) * glow).toFixed(1)}px ${rgba(tint, (0.16 + 0.45 * flash) * glow)}`,
        "inset 0 1px 0 rgba(255,255,255,0.42)",
        "inset 0 18px 30px -18px rgba(255,255,255,0.16)",
        "inset 0 -1px 0 rgba(0,0,0,0.5)",
      ].join(", "),
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(75% 55% at ${lx.toFixed(1)}% ${ly.toFixed(1)}%, ${rgba(CYAN, 0.17 + 0.2 * flash)} 0%, ${rgba(CYAN, 0.05)} 45%, rgba(34,211,238,0) 75%)`,
      }}
    />
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: Math.min(190, h * 0.26), background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0))" }} />
    <div style={{ position: "absolute", top: -10, left: -10, width: "50%", height: Math.min(300, h * 0.4), background: "radial-gradient(ellipse at 22% 18%, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 60%)" }} />
    {children}
    {sheen > 0 && sheen < 1 ? (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(112deg, rgba(255,255,255,0) ${(sheen * 150 - 40).toFixed(1)}%, rgba(255,255,255,0.13) ${(sheen * 150 - 26).toFixed(1)}%, rgba(255,255,255,0) ${(sheen * 150 - 12).toFixed(1)}%)`,
          pointerEvents: "none",
        }}
      />
    ) : null}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        padding: 1.5,
        background: `linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.10) 26%, ${rgba(tint, 0.22 + 0.65 * flash)} 68%, rgba(255,255,255,0.24) 100%)`,
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        pointerEvents: "none",
      }}
    />
  </div>
);

/** amber block cursor (the signal) — solid while typing, blinks when idle */
export const Cursor: React.FC<{ g: number; typing: boolean; size: number }> = ({ g, typing, size }) => {
  const on = typing || Math.floor(g / 16) % 2 === 0;
  return (
    <span
      style={{
        display: "inline-block",
        width: size * 0.56,
        height: size * 1.02,
        marginLeft: size * 0.06,
        verticalAlign: "-0.16em",
        background: B.amber,
        opacity: on ? 1 : 0.12,
        boxShadow: on ? `0 0 ${size * 0.5}px ${rgba(AMBER, 0.6)}` : "none",
        borderRadius: 3,
      }}
    />
  );
};

/* ───────────────────────────── glyphs (generic line icons, no logos) ───────────────────────────── */
const sw = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
export const PromptGlyph: React.FC<{ size?: number; color?: string }> = ({ size = 40, color = B.cyan }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: "block" }}>
    <path d="M14 20 L28 32 L14 44" stroke={color} strokeWidth={5.5} {...sw} />
    <path d="M34 46 L52 46" stroke={B.amber} strokeWidth={5.5} {...sw} />
  </svg>
);
export const CopyGlyph: React.FC<{ size?: number; color?: string }> = ({ size = 32, color = B.white }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: "block" }}>
    <rect x={22} y={10} width={30} height={34} rx={7} stroke={color} strokeWidth={5} {...sw} opacity={0.6} />
    <rect x={12} y={20} width={30} height={34} rx={7} stroke={color} strokeWidth={5} {...sw} />
  </svg>
);
export const CheckGlyph: React.FC<{ size?: number; color?: string; p?: number; stroke?: number }> = ({ size = 28, color = B.white, p = 1, stroke = 3.4 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" style={{ display: "block" }}>
    <path d="M6 14.5 L11.5 20 L22 8.5" stroke={color} strokeWidth={stroke} strokeDasharray={30} strokeDashoffset={30 * (1 - clamp01(p))} {...sw} />
  </svg>
);
export const FileGlyph: React.FC<{ size?: number; color?: string }> = ({ size = 30, color = B.cyan }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: "block" }}>
    <path d="M16 8 L38 8 L50 20 L50 56 L16 56 Z M38 8 L38 20 L50 20" stroke={color} strokeWidth={5} {...sw} />
    <path d="M24 32 L42 32 M24 42 L36 42" stroke={B.amber} strokeWidth={5} {...sw} />
  </svg>
);

/** mono text — ligatures OFF (JetBrains Mono would draw `!=` as « ≠ », `->` as an arrow: wrong for a command to copy) */
export const monoStyle = (size: number, weight = 500): React.CSSProperties => ({
  fontFamily: fontMono,
  fontWeight: weight,
  fontSize: size,
  whiteSpace: "pre",
  fontVariantLigatures: "none",
  fontFeatureSettings: '"liga" 0, "calt" 0',
});
export const interStyle = (size: number, weight = 700): React.CSSProperties => ({ fontFamily: fontInter, fontWeight: weight, fontSize: size, whiteSpace: "nowrap" });
