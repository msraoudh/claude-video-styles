import React from "react";
import { Logo } from "../kit/Logo";
import { fontInter } from "../kit/fonts";
import { glass } from "../lib/look";
import { beatPulse, rand } from "../lib/sync";
import { AMBER, AMBER_HOT, AnamorphicFlare, Bloom, clamp01, CYAN, decay, EASE_IN, EASE_IN_OUT, EASE_OUT, ICE, iv, rgba, Shockwave, type RGB } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/*
 * « Comme une recette : il manque un ingrédient, et le gâteau rate. »
 * 0    four ingredient jars above a glass mixing bowl (DevOps loop on it): « culture », « automatisation », « mesure »…
 *      and the 4th slot « partage » is EMPTY — a dashed outline blinking amber with a « ? ».
 * 8    the three jars tip one after the other and pour glowing streams into the bowl (splashes, the bowl fills).
 * 54   the empty slot tries to pour too: it tilts, nothing comes out, the « ? » pops (amber flare).
 * 66   a cake rises out of the bowl anyway (candle, smile)… trembles…
 * 98   …and SAGS and collapses (≈ f0+100): tiers squash, candle tips and goes out, sad face, a puff of grey smoke.
 * then idle: the empty slot keeps blinking, smoke drifts up from the flat cake, the jars bob.
 */

type Jar = { x: number; y: number; label: string; col: RGB; rot: number; tip: number; back: number; land: [number, number]; ctrl: [number, number] };
const JY = 172;
const JARS: Jar[] = [
  { x: 118, y: JY, label: "culture", col: [34, 211, 238], rot: 75, tip: 8, back: 40, land: [318, 532], ctrl: [240, 192] },
  { x: 292, y: JY, label: "automatisation", col: [56, 189, 248], rot: 50, tip: 20, back: 52, land: [352, 532], ctrl: [368, 172] },
  { x: 468, y: JY, label: "mesure", col: [94, 234, 212], rot: -50, tip: 32, back: 64, land: [408, 532], ctrl: [392, 172] },
];
const SLOT = { x: 642, y: JY, label: "partage" };
const BOWL = { x: 380, y: 522, rx: 206, ry: 36, bottom: 712 };
const RISE: [number, number] = [66, 90];
const SAG: [number, number] = [98, 108];
const MOUTH = 84;

const mouthOf = (j: Jar, ang: number): [number, number] => {
  const th = (ang * Math.PI) / 180;
  return [j.x + MOUTH * Math.sin(th), j.y - MOUTH * Math.cos(th)];
};
const bez = (a: [number, number], c: [number, number], b: [number, number], u: number): [number, number] => {
  const v = 1 - u;
  return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]];
};
const lerpC = (a: RGB, b: RGB, u: number): RGB => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u].map(Math.round) as RGB;

const JAR_BODY = "M-52 -36 Q-52 -64 -24 -64 H24 Q52 -64 52 -36 V44 Q52 72 24 72 H-24 Q-52 72 -52 44 Z";

/** little white glyph on each jar */
const Glyph: React.FC<{ i: number }> = ({ i }) => {
  const s = { fill: "none", stroke: "rgba(255,255,255,0.92)", strokeWidth: 3.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (i === 0)
    return (
      <g transform="translate(0 14)">
        <circle cx={-11} cy={-12} r={7} {...s} />
        <circle cx={12} cy={-12} r={7} {...s} />
        <path d="M-24 12 C-24 0 -18 -3 -11 -3 C-4 -3 2 0 2 12 M0 12 C0 0 6 -3 12 -3 C19 -3 25 0 25 12" {...s} />
      </g>
    );
  if (i === 1) {
    let d = "";
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const r = k % 2 ? 13 : 19;
      d += `${k ? "L" : "M"}${(Math.cos(a) * r).toFixed(1)} ${(14 + Math.sin(a) * r).toFixed(1)} `;
    }
    return (
      <g>
        <path d={d + "Z"} {...s} />
        <circle cx={0} cy={14} r={6} {...s} />
      </g>
    );
  }
  return (
    <g transform="translate(0 22)">
      <path d="M-20 0 A20 20 0 0 1 20 0" {...s} />
      <path d="M0 0 L11 -13" {...s} />
      <circle cx={0} cy={0} r={3} fill="rgba(255,255,255,0.92)" />
    </g>
  );
};

/** one glass ingredient jar centred on its pivot (0,0); mouth at (0,-84) */
const JarG: React.FC<{ i: number; col: RGB; level: number; uid: string }> = ({ i, col, level, uid }) => {
  const top = 72 - 136 * level;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}c`}>
          <path d={JAR_BODY} />
        </clipPath>
        <linearGradient id={`${uid}l`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={rgba(col, 0.85)} />
          <stop offset="1" stopColor={rgba(col, 0.35)} />
        </linearGradient>
      </defs>
      <path d={JAR_BODY} fill="rgba(8,18,38,0.78)" />
      <g clipPath={`url(#${uid}c)`}>
        <rect x={-60} y={top} width={120} height={150} fill={`url(#${uid}l)`} />
        <rect x={-60} y={top - 2} width={120} height={5} fill="rgba(255,255,255,0.55)" />
      </g>
      <path d={JAR_BODY} fill="none" stroke={rgba(col, 0.9)} strokeWidth={3} />
      <path d="M-40 -44 Q-40 -54 -30 -54" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={3} strokeLinecap="round" />
      <rect x={-40} y={-84} width={80} height={20} rx={7} fill="rgba(34,211,238,0.25)" stroke={rgba(col, 0.9)} strokeWidth={3} />
      <Glyph i={i} />
    </g>
  );
};

export const RecipeFx: ToolFx = ({ g, f0, size }) => {
  const t = g - f0;
  const k = size / 760;
  const bp = beatPulse(g, 14);
  const idle = clamp01((t - 116) / 20);
  const en = iv(t, [0, 16], [0, 1], EASE_OUT);

  // ── jars ──
  const jarEls: React.ReactNode[] = [];
  const streams: React.ReactNode[] = [];
  const splashes: React.ReactNode[] = [];
  let level = 0;
  JARS.forEach((j, i) => {
    const tipP = iv(t, [j.tip, j.tip + 11], [0, 1], EASE_IN_OUT);
    const backP = iv(t, [j.back, j.back + 12], [0, 1], EASE_IN_OUT);
    const shake = t > j.tip + 11 && t < j.back ? Math.sin(t * 1.3 + i) * 2.5 : 0;
    const ang = j.rot * (tipP - backP) + shake;
    const lift = -18 * Math.sin(Math.PI * clamp01(tipP - backP));
    const bob = Math.sin(g * 0.08 + i * 1.6) * 4 * idle;
    const ji = iv(t, [2 * i, 14 + 2 * i], [0, 1], EASE_OUT);
    const lv = 0.62 - 0.44 * iv(t, [j.tip + 10, j.back], [0, 1]);
    jarEls.push(
      <g key={i} opacity={ji} transform={`translate(${j.x} ${j.y + lift + bob + (1 - ji) * 20}) rotate(${ang.toFixed(2)})`}>
        <JarG i={i} col={j.col} level={lv} uid={`rcpj${i}`} />
      </g>,
    );
    // the glowing stream
    const s0 = j.tip + 8;
    const s1 = j.back + 3;
    const head = iv(t, [s0, s0 + 9], [0, 1], EASE_IN);
    const tail = iv(t, [s1, s1 + 8], [0, 1], EASE_IN);
    if (head > 0 && tail < 1) {
      const m = mouthOf(j, j.rot);
      const d = `M${m[0].toFixed(1)} ${(m[1] + lift).toFixed(1)} Q${j.ctrl[0]} ${j.ctrl[1]} ${j.land[0]} ${j.land[1]}`;
      const w = 1 + 0.12 * Math.sin(t * 0.9 + i);
      streams.push(
        <g key={i}>
          <path d={d} fill="none" stroke={rgba(j.col, 0.45)} strokeWidth={26 * w} strokeLinecap="round" pathLength={1} strokeDasharray={`${head - tail} 2`} strokeDashoffset={-tail} filter="url(#rcpBlur)" />
          <path d={d} fill="none" stroke={rgba(j.col, 0.95)} strokeWidth={11 * w} strokeLinecap="round" pathLength={1} strokeDasharray={`${head - tail} 2`} strokeDashoffset={-tail} />
          <path d={d} fill="none" stroke="rgba(240,252,255,0.9)" strokeWidth={3.5} strokeLinecap="round" pathLength={1} strokeDasharray={`${head - tail} 2`} strokeDashoffset={-tail} />
          {/* droplets running down the stream */}
          {Array.from({ length: 4 }, (_, q) => {
            const u = (t * 0.06 + q / 4) % 1;
            if (u < tail || u > head) return null;
            const [x, y] = bez([m[0], m[1] + lift], j.ctrl, j.land, u);
            return <circle key={q} cx={x} cy={y} r={4} fill="#FFFFFF" opacity={0.8} />;
          })}
        </g>,
      );
    }
    // splash where it lands
    const landT = s0 + 9;
    for (let q = 0; q < 9; q++) {
      const age = t - landT - (q % 3) * 6;
      if (age < 0 || age > 18 || t > s1 + 10) continue;
      const vx = (rand(i * 13 + q * 3.7) - 0.5) * 7;
      const vy = -4 - rand(i * 7 + q * 1.9) * 5;
      splashes.push(<circle key={`${i}-${q}`} cx={j.land[0] + vx * age} cy={j.land[1] - 6 + vy * age + 0.45 * age * age} r={3 + rand(q + i) * 2.5} fill={rgba(q % 2 ? j.col : ICE, 1 - age / 18)} />);
    }
    level += iv(t, [landT, landT + 18], [0, 1 / 3]);
  });

  // ── the empty slot (the missing ingredient) ──
  const blinkOn = iv(t, [6, 20], [0, 1]);
  const blink = 0.5 + 0.5 * Math.cos((t - 6) * 0.24);
  const slotA = 0.3 + 0.7 * blink * blinkOn;
  const tryT = t - 54;
  const tryAng = tryT >= 0 ? -24 * Math.sin(clamp01(tryT / 16) * Math.PI) + (tryT > 8 && tryT < 14 ? Math.sin(tryT * 3) * 3 : 0) : 0;
  const qPop = t >= 60 ? 1 + 0.45 * Math.sin(clamp01((t - 60) / 12) * Math.PI) * Math.exp(-(t - 60) / 10) : 1;
  const qBob = Math.sin(g * 0.1) * 4 * idle;

  // ── the cake ──
  const rise = iv(t, RISE, [0, 1], EASE_OUT);
  const riseOver = t >= RISE[0] ? 1 + 0.12 * Math.sin(clamp01((t - RISE[0] - 10) / 16) * Math.PI) * (t > RISE[0] + 10 ? 1 : 0) : 1;
  const c = iv(t, SAG, [0, 1], EASE_IN);
  const landA = t - SAG[1];
  const wob = landA >= 0 ? Math.sin(landA * 0.75) * Math.exp(-landA / 7) : 0;
  const tremble = t >= 90 && t < SAG[0] ? Math.sin(t * 2.6) * 3.2 * iv(t, [90, SAG[0]], [0.3, 1]) : 0;
  const tint = lerpC(CYAN, [118, 138, 160], c);
  const cream: RGB = lerpC([244, 251, 255], [176, 190, 205], c);
  // tiers are paths that can SAG (top edge dips) and BULGE (sides swell) — the collapse is a deformation, not a scale
  const HB = 92 * (1 - 0.46 * c + 0.07 * wob);
  const WB = 236 * (1 + 0.2 * c - 0.03 * wob);
  const HT = 66 * (1 - 0.45 * c + 0.08 * wob);
  const WT = 160 * (1 + 0.26 * c - 0.04 * wob);
  const sagB = 15 * c;
  const sagT = 10 * c;
  const topRot = -8 * c;
  const topX = -10 * c;
  const flame = t < SAG[0] + 2 ? iv(t, [RISE[0] + 12, RISE[0] + 20], [0, 1]) * (1 - iv(t, [SAG[0], SAG[0] + 3], [0, 1])) : 0;
  const sad = iv(t, [SAG[0] + 2, SAG[0] + 8], [0, 1]);
  const happy = iv(t, [RISE[1] - 4, RISE[1] + 2], [0, 1]) * (1 - sad);
  const cakeTop = -HB - HT + sagB; // y of the top surface (local)
  const tierPath = (w: number, h: number, s: number, b: number, r: number, ext = 40) => {
    const L = -w / 2;
    const R = w / 2;
    return `M${L} ${ext} H${R} L${R} 0 C${R + b} ${-h * 0.35} ${R + b * 0.6} ${-h * 0.8} ${R} ${-h + r} Q${R} ${-h} ${R - r} ${-h} Q0 ${-h + 2 * s} ${L + r} ${-h} Q${L} ${-h} ${L} ${-h + r} C${L - b * 0.6} ${-h * 0.8} ${L - b} ${-h * 0.35} ${L} 0 Z`;
  };
  /** top edge y at x (the quadratic dip) */
  const topY = (w: number, h: number, s: number, r: number, x: number) => {
    const u = clamp01((x + (w / 2 - r)) / (w - 2 * r));
    return -h + 4 * s * u * (1 - u);
  };
  const capAndDrips = (w: number, h: number, s: number, r: number, n: number, seed: number) => (
    <g>
      <path d={`M${-w / 2 + 6} ${-h + 2} Q0 ${-h + 2 * s + 2} ${w / 2 - 6} ${-h + 2}`} fill="none" stroke={rgba(cream, 0.96)} strokeWidth={18 - 5 * c} strokeLinecap="round" />
      {Array.from({ length: n }, (_, q) => {
        const x = -w / 2 + 16 + ((w - 32) * (q + 0.5)) / n + (rand(seed + q) - 0.5) * 10;
        const len = (14 + rand(seed + q * 2.3) * 18) * (1 - 0.3 * c);
        return <rect key={q} x={x - 8} y={topY(w, h, s, r, x)} width={16} height={len} rx={8} fill={rgba(cream, 0.96)} />;
      })}
    </g>
  );
  const ink = "rgba(10,20,40,0.88)";
  const face = (
    <g transform={`translate(0 ${(-HB * 0.42 + sagB * 0.4).toFixed(1)})`}>
      {sad > 0.5 ? (
        <g fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round">
          <path d="M-46 -2 L-28 -11" />
          <path d="M46 -2 L28 -11" />
          <circle cx={-36} cy={5} r={2.5} fill={ink} />
          <circle cx={36} cy={5} r={2.5} fill={ink} />
          <path d="M-17 22 Q0 8 17 22" />
          <path d="M-36 14 q-3 8 0 12 q3 -4 0 -12" fill="rgba(140,220,255,0.8)" stroke="none" />
        </g>
      ) : (
        <g>
          {happy > 0.5 ? (
            <g fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round">
              <path d="M-44 2 Q-36 -9 -28 2" />
              <path d="M28 2 Q36 -9 44 2" />
            </g>
          ) : (
            <g fill={ink}>
              <circle cx={-36} cy={-1} r={6.5} />
              <circle cx={36} cy={-1} r={6.5} />
            </g>
          )}
          <path d="M-17 11 Q0 27 17 11" fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />
          <circle cx={-56} cy={14} r={8} fill="rgba(255,170,150,0.38)" />
          <circle cx={56} cy={14} r={8} fill="rgba(255,170,150,0.38)" />
        </g>
      )}
    </g>
  );
  const fl = 1 + 0.12 * Math.sin(g * 0.9) + 0.06 * Math.sin(g * 2.3);
  const topBase = topY(WB, HB, sagB, 20, topX) + 4 + 22 * c;
  const cake = (
    <g transform={`translate(${BOWL.x + tremble} ${BOWL.y - 8 + (1 - rise) * 250}) scale(${(1 / riseOver).toFixed(3)} ${riseOver.toFixed(3)})`}>
      {/* top tier + candle (behind the bottom tier's cream) */}
      <g transform={`translate(${topX.toFixed(2)} ${topBase.toFixed(2)}) rotate(${topRot.toFixed(2)})`}>
        <path d={tierPath(WT, HT, sagT, 8 * c, 16, 4)} fill="url(#rcpSponge)" stroke={rgba(tint, 0.9)} strokeWidth={3} strokeLinejoin="round" />
        {capAndDrips(WT, HT, sagT, 16, 5, 17)}
        <g transform={`translate(0 ${(-HT + sagT - 6).toFixed(1)}) rotate(${(-32 * c).toFixed(2)})`}>
          <rect x={-8} y={-44} width={16} height={44} rx={5} fill="rgba(240,250,255,0.92)" />
          {[0, 1, 2].map((q) => (
            <path key={q} d={`M-8 ${-36 + q * 13} L8 ${-44 + q * 13} V${-38 + q * 13} L-8 ${-30 + q * 13} Z`} fill={rgba(tint, 0.8)} />
          ))}
          <line x1={0} y1={-44} x2={0} y2={-52} stroke="rgba(30,40,60,0.9)" strokeWidth={3} strokeLinecap="round" />
          {flame > 0.01 ? (
            <g transform={`translate(0 -52) scale(${(flame * fl).toFixed(3)})`}>
              <circle cx={0} cy={-14} r={26} fill="url(#rcpFlameHalo)" />
              <path d="M0 -34 C10 -20 12 -10 8 -3 C5 2 -5 2 -8 -3 C-12 -10 -10 -20 0 -34 Z" fill="url(#rcpFlame)" />
            </g>
          ) : null}
        </g>
      </g>
      {/* bottom tier */}
      <path d={tierPath(WB, HB, sagB, 10 * c, 20)} fill="url(#rcpSponge)" stroke={rgba(tint, 0.9)} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M${-WB / 2 + 8} ${-HB * 0.16} Q0 ${-HB * 0.16 + sagB * 0.5} ${WB / 2 - 8} ${-HB * 0.16}`} fill="none" stroke={rgba(cream, 0.35)} strokeWidth={7} strokeLinecap="round" />
      {capAndDrips(WB, HB, sagB, 20, 7, 3)}
      {rise > 0.6 ? face : null}
    </g>
  );

  // smoke: one sad puff at the collapse, then wisps drifting
  const smoke: React.ReactNode[] = [];
  const pA = t - (SAG[0] + 4);
  if (pA >= 0 && pA < 48) {
    for (let q = 0; q < 9; q++) {
      const p = pA / 48;
      const ang = rand(q * 4.1) * Math.PI - Math.PI;
      const sp = 0.6 + rand(q * 2.9) * 0.6;
      const x = BOWL.x + Math.cos(ang) * 120 * sp * EASE_OUT(p);
      const y = BOWL.y + 10 + cakeTop + Math.sin(ang) * 50 * sp * EASE_OUT(p) - 70 * p;
      smoke.push(<circle key={`p${q}`} cx={x} cy={y} r={18 + 34 * p + rand(q) * 10} fill={`rgba(176,190,210,${(0.5 * (1 - p)).toFixed(3)})`} filter="url(#rcpSmoke)" />);
    }
  }
  if (t > SAG[0] + 6) {
    const wA = iv(t, [SAG[0] + 6, SAG[0] + 26], [0, 1]);
    for (let q = 0; q < 5; q++) {
      const u = ((t - SAG[0] - 6) / 70 + q / 5) % 1;
      const x = BOWL.x - 30 + Math.sin(u * 6 + q * 1.7) * 16 + (q - 2) * 14;
      const y = BOWL.y + 4 + cakeTop - 20 - 210 * u;
      smoke.push(<circle key={`w${q}`} cx={x} cy={y} r={10 + 26 * u} fill={`rgba(170,186,208,${(0.32 * wA * Math.sin(Math.PI * u)).toFixed(3)})`} filter="url(#rcpSmoke)" />);
    }
  }

  const bowlFront = `M${BOWL.x - BOWL.rx} ${BOWL.y} C${BOWL.x - BOWL.rx} ${BOWL.y + 150} ${BOWL.x - 120} ${BOWL.bottom} ${BOWL.x} ${BOWL.bottom} C${BOWL.x + 120} ${BOWL.bottom} ${BOWL.x + BOWL.rx} ${BOWL.y + 150} ${BOWL.x + BOWL.rx} ${BOWL.y}`;
  const cakeClip = `M0 -400 H760 V${BOWL.y} H${BOWL.x + BOWL.rx} C${BOWL.x + BOWL.rx} ${BOWL.y + 150} ${BOWL.x + 120} ${BOWL.bottom} ${BOWL.x} ${BOWL.bottom} C${BOWL.x - 120} ${BOWL.bottom} ${BOWL.x - BOWL.rx} ${BOWL.y + 150} ${BOWL.x - BOWL.rx} ${BOWL.y} H0 Z`;
  const liquid = clamp01(level);
  const fillKick = JARS.reduce((m, j) => Math.max(m, decay(t - (j.tip + 17), 10)), 0);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: size, height: size }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: `scale(${k})`, transformOrigin: "0 0" }}>
        <Bloom x={BOWL.x} y={BOWL.y + 40} rx={330} ry={250} col={CYAN} a={(0.06 + 0.12 * liquid + 0.1 * fillKick) * (1 - 0.6 * c)} />
        <svg width={760} height={760} viewBox="0 0 760 760" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <filter id="rcpBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <filter id="rcpSmoke" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="11" />
            </filter>
            <linearGradient id="rcpSponge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={rgba(tint, 0.5)} />
              <stop offset="1" stopColor={rgba(tint, 0.16)} />
            </linearGradient>
            <linearGradient id="rcpBowl" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(34,211,238,0.30)" />
              <stop offset="1" stopColor="rgba(10,24,52,0.92)" />
            </linearGradient>
            <radialGradient id="rcpPool" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor={rgba(ICE, 0.95)} />
              <stop offset="0.5" stopColor={rgba(CYAN, 0.8)} />
              <stop offset="1" stopColor={rgba(CYAN, 0.25)} />
            </radialGradient>
            <radialGradient id="rcpFlame" cx="0.5" cy="0.7" r="0.7">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="0.45" stopColor="#FFD58A" />
              <stop offset="1" stopColor="#F59E0B" />
            </radialGradient>
            <radialGradient id="rcpFlameHalo" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="rgba(255,196,92,0.5)" />
              <stop offset="1" stopColor="rgba(255,196,92,0)" />
            </radialGradient>
            <clipPath id="rcpCakeClip">
              <path d={cakeClip} />
            </clipPath>
          </defs>

          {/* bowl: back rim + opening + the pool of mixed ingredients */}
          <g opacity={en}>
            <ellipse cx={BOWL.x} cy={BOWL.y} rx={BOWL.rx} ry={BOWL.ry} fill="rgba(5,12,28,0.95)" stroke={rgba(CYAN, 0.55)} strokeWidth={3} />
            {liquid > 0.01 ? (
              <ellipse cx={BOWL.x} cy={BOWL.y + 6} rx={(BOWL.rx - 22) * (0.55 + 0.45 * liquid)} ry={(BOWL.ry - 8) * (0.55 + 0.45 * liquid)} fill="url(#rcpPool)" opacity={(0.25 + 0.6 * liquid + 0.25 * fillKick) * (1 - 0.5 * c)} />
            ) : null}
          </g>
          {streams}
          {splashes}
          <g clipPath="url(#rcpCakeClip)">{rise > 0 ? cake : null}</g>
          {/* bowl front (glass) */}
          <g opacity={en}>
            <path d={`${bowlFront} A${BOWL.rx} ${BOWL.ry} 0 0 1 ${BOWL.x - BOWL.rx} ${BOWL.y} Z`} fill="url(#rcpBowl)" stroke={rgba(CYAN, 0.9)} strokeWidth={3.5} strokeLinejoin="round" />
            <path d={`M${BOWL.x - BOWL.rx} ${BOWL.y} A${BOWL.rx} ${BOWL.ry} 0 0 0 ${BOWL.x + BOWL.rx} ${BOWL.y}`} fill="none" stroke="rgba(230,250,255,0.85)" strokeWidth={4} />
            <path d={`M${BOWL.x - BOWL.rx + 26} ${BOWL.y + 50} C${BOWL.x - BOWL.rx + 30} ${BOWL.y + 110} ${BOWL.x - 130} ${BOWL.bottom - 30} ${BOWL.x - 80} ${BOWL.bottom - 16}`} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={5} strokeLinecap="round" />
          </g>
          {smoke}

          {jarEls}

          {/* the empty slot: dashed outline, blinking amber, « ? » */}
          <g opacity={iv(t, [6, 18], [0, 1])} transform={`translate(${SLOT.x} ${SLOT.y}) rotate(${tryAng.toFixed(2)})`}>
            <path d={JAR_BODY} fill={rgba(AMBER, 0.05 + 0.07 * blink * blinkOn)} stroke={rgba(AMBER, slotA)} strokeWidth={3.5} strokeDasharray="12 10" style={{ filter: `drop-shadow(0 0 ${(4 + 10 * blink * blinkOn).toFixed(1)}px rgba(245,158,11,${(0.6 * blink * blinkOn).toFixed(2)}))` }} />
            <rect x={-40} y={-84} width={80} height={20} rx={7} fill="none" stroke={rgba(AMBER, slotA * 0.8)} strokeWidth={3} strokeDasharray="8 8" />
            <text x={0} y={30 + qBob} transform={`translate(0 ${30 + qBob}) scale(${qPop.toFixed(3)}) translate(0 ${-30 - qBob})`} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={74} fill={rgba(AMBER_HOT, 0.45 + 0.55 * slotA)}>
              ?
            </text>
          </g>
        </svg>

        {/* labels */}
        {[...JARS.map((j) => ({ x: j.x, label: j.label, empty: false })), { x: SLOT.x, label: SLOT.label, empty: true }].map((L, i) => {
          const p = iv(t, [4 + 3 * i, 18 + 3 * i], [0, 1], EASE_OUT);
          return (
            <div key={i} style={{ position: "absolute", left: L.x, top: JY - 122, width: 0, height: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: p }}>
              <div
                style={{
                  ...(L.empty ? {} : glass("34,211,238", 0.4)),
                  borderRadius: 999,
                  padding: "6px 16px",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  fontFamily: fontInter,
                  fontWeight: 700,
                  fontSize: 23,
                  letterSpacing: "-0.01em",
                  color: L.empty ? rgba(AMBER_HOT, 0.55 + 0.45 * slotA) : "#F8FAFC",
                  border: L.empty ? `2px dashed ${rgba(AMBER, 0.4 + 0.5 * slotA)}` : undefined,
                  background: L.empty ? rgba(AMBER, 0.06) : undefined,
                  transform: `translateY(${((1 - p) * 10).toFixed(1)}px)`,
                }}
              >
                {L.label}
              </div>
            </div>
          );
        })}

        {/* DevOps loop on the bowl */}
        <div style={{ position: "absolute", left: BOWL.x - 64, top: BOWL.y + 82 - 32, width: 128, height: 64, opacity: en }}>
          <Logo name="devops" size={128} draw={iv(t, [6, 34], [0, 1])} spin={Math.max(0, t - 34)} />
        </div>

        <AnamorphicFlare age={t - 60} x={SLOT.x} y={SLOT.y + 4} col={AMBER} dur={28} size={110} streakH={70} strength={0.7} />
        <AnamorphicFlare age={t - RISE[1] + 2} x={BOWL.x} y={BOWL.y - 210} col={CYAN} dur={24} size={90} streakH={50} strength={0.5 * (1 - c)} />
        <Shockwave age={t - SAG[1]} x={BOWL.x} y={BOWL.y - 20} col={[150, 170, 195]} dur={22} maxR={300} r0={60} strength={0.55} />
        <Bloom x={SLOT.x} y={SLOT.y} rx={130} ry={150} col={AMBER} a={0.1 * blink * blinkOn * (0.7 + 0.3 * bp)} />
      </div>
    </div>
  );
};
