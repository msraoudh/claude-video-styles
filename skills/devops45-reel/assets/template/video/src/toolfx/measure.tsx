import React from "react";
import { Logo } from "../kit/Logo";
import { fontInter, fontMono } from "../kit/fonts";
import { B, glass } from "../lib/look";
import { rand } from "../lib/sync";
import { AMBER, clamp01, CYAN, decay, EASE_IN, EASE_IN_OUT, EASE_OUT, iv, rgba, type RGB } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/**
 * « Trois, la mesure. Le site est-il rapide ? Les livraisons cassent-elles ? On regarde les chiffres. »
 * Concept animation (no tool logo — the DevOps loop sits in the scoreboard header). Three beats:
 *   (1) t 0–~80  a glass browser loads a page (progress bar + skeleton) under a big pulsing « ? »; a stopwatch clicks
 *       (t 10), runs, clicks stop (t 46, « 0,8 s »); the « ? » spins away and a speedometer draws in, its needle
 *       swings into the green zone (lands t 72) — pill « rapide ? » + green check.
 *   (2) at p2 (2nd beat = « Les livraisons… ») the browser shrinks to the top; a conveyor brings 4 package boxes
 *       (v1…v4) through a scanner gate; each crossing pops a mark in the « livraisons » tally ✓ ✓ ✗ ✓ — v3 wobbles
 *       and cracks (brief amber/red, sparks).
 *   (3) at p3 (3rd beat = « On regarde les chiffres ») both scenes collapse into a glass scoreboard: 3 tiles whose
 *       numbers tick up (Chargement 0,8 s · Livraisons OK 98 % · Livraisons / semaine 24), the amber highlight lands
 *       on 98 % (ring, flare, sparks).
 * Beats: ≥3 → p2 = beats[1], p3 = beats[2]; 2 → p2 = beats[1]; 1 → p2 = beats[0]; none → 42 % / 70 % of the item.
 * Idle: needles jitter, numbers flicker slightly, belt/bars/sweeps keep moving. Drawn in a 760 design space.
 */
const D = 760;
const GREEN: RGB = [52, 211, 153];
const ROSE: RGB = [248, 113, 113];

// ── phase 1 (group coords = stage coords at scale 1) ──
const BR = { x: 60, y: 66, w: 640, h: 450 }; // browser window
const HEAD = 58;
const GC = { x: 320, y: 300, r: 148 }; // speedometer (browser-local)
const SW = { x: 136, y: 548, r: 74 }; // stopwatch
const S0 = 10; // stopwatch start click
const SS = 46; // stopwatch stop click (page loaded)
const N0 = SS + 8; // needle starts swinging
const NL = SS + 26; // needle lands
const NV = 0.84; // needle value (green zone)

// ── phase 2 (stage coords) ──
const GATE = 204;
const BELT_Y = 690;
const BOX = 84;

// ── phase 3 ──
const CB = { x: 40, y: 92, w: 680, h: 596 }; // scoreboard card
const TA = { x: 22, y: 98, w: 312, h: 252 };
const TB = { x: 346, y: 98, w: 312, h: 252 };
const TC = { x: 22, y: 366, w: 636, h: 208 };

const backOut = (p: number, s = 1.70158) => {
  const q = clamp01(p) - 1;
  return 1 + (s + 1) * q * q * q + s * q * q;
};
const cubicOut = (x: number) => 1 - Math.pow(1 - x, 3);
const fr1 = (v: number) => (Math.round(v * 10) / 10).toFixed(1).replace(".", ",");

/** self-contained anamorphic flare */
const Flare: React.FC<{ age: number; x: number; y: number; col: RGB; dur: number; strength: number; w: number }> = ({ age, x, y, col, dur, strength, w }) => {
  if (age < 0 || age > dur) return null;
  const env = (age < 2 ? age / 2 : Math.exp(-(age - 2) / (dur * 0.3))) * iv(age, [dur - 6, dur], [1, 0]) * strength;
  if (env < 0.004) return null;
  const W = w * iv(age, [0, dur], [0.5, 1.25], EASE_OUT);
  const bar = (h: number, ww: number, core: string, mid: string) => (
    <div style={{ position: "absolute", left: x - ww / 2, top: y - h / 2, width: ww, height: h, mixBlendMode: "screen", pointerEvents: "none", background: `radial-gradient(closest-side, ${core} 0%, ${mid} 35%, rgba(0,0,0,0) 100%)` }} />
  );
  return (
    <>
      {bar(90, W * 1.1, rgba(col, 0.32 * env), rgba(col, 0.1 * env))}
      {bar(9, W, `rgba(255,255,255,${(0.9 * env).toFixed(3)})`, rgba(col, 0.6 * env))}
      {bar(200, 200, `rgba(255,245,225,${(0.6 * env).toFixed(3)})`, rgba(col, 0.3 * env))}
    </>
  );
};

const Sparks: React.FC<{ age: number; x: number; y: number; n: number; r: number; col: RGB; seed: number; dur?: number }> = ({ age, x, y, n, r, col, seed, dur = 32 }) => {
  if (age < 0 || age > dur) return null;
  const p = age / dur;
  return (
    <svg width={D} height={D} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", mixBlendMode: "screen" }}>
      {Array.from({ length: n }, (_, k) => {
        const a = rand(seed * 31 + k) * Math.PI * 2;
        const sp = 0.45 + 0.55 * rand(seed * 17 + k * 3);
        const dd = r * sp * EASE_OUT(p);
        const px = x + Math.cos(a) * dd, py = y + Math.sin(a) * dd + 26 * p * p;
        const tail = 9 + 16 * sp * (1 - p);
        return (
          <g key={k} opacity={(1 - p) * (0.6 + 0.4 * rand(seed + k))}>
            <line x1={px} y1={py} x2={px - Math.cos(a) * tail} y2={py - Math.sin(a) * tail} stroke={rgba(col, 0.9)} strokeWidth={3} strokeLinecap="round" />
            <circle cx={px} cy={py} r={2.4} fill="#FFFFFF" />
          </g>
        );
      })}
    </svg>
  );
};

const CheckIcon: React.FC<{ s: number; col: string; w?: number; p?: number }> = ({ s, col, w = 3.2, p = 1 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block", overflow: "visible" }}>
    <path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(p)} />
  </svg>
);
const CrossIcon: React.FC<{ s: number; col: string; w?: number }> = ({ s, col, w = 3.2 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block", overflow: "visible" }}>
    <path d="M6.5 6.5 L17.5 17.5 M17.5 6.5 L6.5 17.5" fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" />
  </svg>
);

/** scoreboard tile */
const Tile: React.FC<{ r: { x: number; y: number; w: number; h: number }; e: number; label: string; hl?: number; children?: React.ReactNode }> = ({ r, e, label, hl = 0, children }) => (
  <div
    style={{
      position: "absolute",
      left: r.x,
      top: r.y,
      width: r.w,
      height: r.h,
      borderRadius: 22,
      background: "linear-gradient(160deg, rgba(10,20,42,0.84), rgba(6,12,28,0.72))",
      border: `1.5px solid ${hl > 0.01 ? rgba(AMBER, 0.2 + 0.7 * hl) : "rgba(148,190,255,0.14)"}`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 26px rgba(0,0,0,0.35)${hl > 0.01 ? `, 0 0 ${(44 * hl).toFixed(1)}px ${rgba(AMBER, 0.35 * hl)}, inset 0 0 ${(40 * hl).toFixed(1)}px ${rgba(AMBER, 0.1 * hl)}` : ""}`,
      overflow: "hidden",
      opacity: clamp01(e * 1.6),
      transform: `translateY(${((1 - e) * 28).toFixed(1)}px) scale(${(0.9 + 0.1 * e).toFixed(4)})`,
      filter: e < 0.97 ? `blur(${((1 - e) * 8).toFixed(2)}px)` : undefined,
    }}
  >
    <div style={{ position: "absolute", left: 22, top: 18, fontFamily: fontInter, fontWeight: 600, fontSize: 24, color: B.text2, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{label}</div>
    {children}
  </div>
);

export const MeasureFx: ToolFx = ({ g, f0, f1, beats, size }) => {
  const t = g - f0;
  const k = size / D;
  const beatK = beats.reduce((s, b) => s + decay(g - b, 10), 0);

  // ── timeline: beats time the two questions ──
  const dur = Math.max(170, f1 - f0);
  const rb = beats.map((b) => b - f0).filter((b) => b > 0 && b < dur);
  let p2 = dur * 0.42;
  let p3 = dur * 0.7;
  if (rb.length >= 3) {
    p2 = rb[1];
    p3 = rb[2];
  } else if (rb.length === 2) {
    p2 = rb[1];
    p3 = rb[1] + Math.max(60, rb[1] - rb[0]);
  } else if (rb.length === 1) {
    p2 = rb[0];
    p3 = p2 + 70;
  }
  p2 = Math.round(Math.min(Math.max(p2, 96), dur - 100));
  p3 = Math.round(Math.min(Math.max(p3, p2 + 54), dur - 44));
  const t2 = t - p2;
  const t3 = t - p3;

  // ═════════ PHASE 1 · speed ═════════
  const be = EASE_OUT(iv(t, [0, 16], [0, 1]));
  const tiltX = Math.sin(t * 0.021) * 1.4;
  const tiltY = Math.sin(t * 0.017 + 1) * 2;
  const prog = iv(t, [S0, S0 + 12, S0 + 22, SS - 5, SS], [0, 0.34, 0.47, 0.86, 1]);
  const loaded = iv(t, [SS, SS + 12], [0, 1], EASE_OUT);
  const qIn = EASE_OUT(iv(t, [5, 20], [0, 1]));
  const qOut = iv(t, [SS, SS + 12], [0, 1], EASE_IN);
  const gr = iv(t, [SS + 2, SS + 20], [0, 1], EASE_OUT); // gauge draw-in
  const jit = iv(t, [NL, NL + 12], [0, 1]) * (0.013 * Math.sin(t * 0.72) + 0.008 * Math.sin(t * 1.93 + 1) + 0.004 * Math.sin(t * 4.1));
  const nv = NV * backOut(iv(t, [N0, NL], [0, 1]), 2.1) + jit;
  const landAge = t - (NL - 7); // needle enters green
  const pillE = backOut(iv(t, [NL - 6, NL + 8], [0, 1]), 2);
  const checkP = iv(t, [NL + 2, NL + 12], [0, 1], EASE_OUT);
  const ang = (v: number) => Math.PI + Math.PI * clamp01(v);
  const gpt = (v: number, r: number) => [GC.x + r * Math.cos(ang(v)), GC.y + r * Math.sin(ang(v))];
  const arcD = (a: number, b: number, r: number) => {
    const [sx, sy] = gpt(a, r);
    const [ex, ey] = gpt(b, r);
    return `M${sx.toFixed(2)} ${sy.toFixed(2)} A${r} ${r} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
  };
  const zones: Array<[number, number, RGB, number]> = [
    [0, 0.38, ROSE, 0.55],
    [0.4, 0.68, CYAN, 0.55],
    [0.7, 1, GREEN, 0.75 + 0.25 * decay(landAge, 16)],
  ];
  // stopwatch
  const swE = backOut(iv(t, [3, 18], [0, 1]), 1.6);
  const run = iv(t, [S0, SS], [0, 1]);
  const handA = run * 288 + (t > SS ? 7 * Math.sin((t - SS) * 0.9) * decay(t - SS, 6) : 0);
  const crownDy = 6 * (decay(t - S0, 4) + decay(t - SS, 4));
  const stopFlash = decay(t - SS, 10);
  const readout = fr1((0.8 * Math.floor(run * 8 + 1e-6)) / 8);
  // shrink to the top in phase 2, collapse into tile A in phase 3
  const s1 = iv(t, [p2, p2 + 15], [1, 0.6], EASE_IN_OUT);
  const col = iv(t, [p3, p3 + 18], [0, 1], EASE_IN_OUT);
  const g1Op = clamp01(1 - col * 1.25);

  // ═════════ PHASE 2 · deliveries ═════════
  const L2 = p3 - p2;
  const spc = Math.min(18, Math.max(11, (L2 - 16) / 4));
  const vel = 112 / spc;
  const cross = [0, 1, 2, 3].map((i) => 10 + i * spc);
  const BAD = 2;
  const de = EASE_OUT(iv(t2, [6, 19], [0, 1]));
  const lastCross = cross.reduce((acc, c, i) => (t2 >= c ? i : acc), -1);
  const lampCol: RGB = lastCross === BAD ? ROSE : lastCross >= 0 ? GREEN : CYAN;
  const lampFlash = lastCross >= 0 ? decay(t2 - cross[lastCross], 12) : 0;
  const crackAge = t2 - cross[BAD];
  // the belt runs until the last box passed the gate, then eases to a stop: v1…v4 rest in a row (v3 cracked)
  const c3 = cross[3];
  const T2 = t2 < c3 ? t2 : c3 + 9 * (1 - Math.exp(-(t2 - c3) / 9));
  const beltOff = (Math.max(0, T2) * vel) % 40;
  const restK = iv(t2, [c3 + 10, c3 + 22], [0, 1]);
  const streak = t2 > c3 + 14 ? ((t2 - c3 - 14) % 64) / 40 : -1;

  // ═════════ PHASE 3 · scoreboard ═════════
  const ce = EASE_OUT(iv(t3, [3, 22], [0, 1]));
  const eA = EASE_OUT(iv(t3, [8, 24], [0, 1]));
  const eB = EASE_OUT(iv(t3, [12, 28], [0, 1]));
  const eC = EASE_OUT(iv(t3, [16, 32], [0, 1]));
  const ka = iv(t3, [12, 32], [0, 1], cubicOut);
  const kb = iv(t3, [16, 36], [0, 1], cubicOut);
  const kc = iv(t3, [20, 38], [0, 1], cubicOut);
  const HL = 38;
  const hl = iv(t3, [HL, HL + 12], [0, 1], EASE_OUT);
  const hlBreath = 0.5 + 0.5 * Math.sin((t3 - HL) * 0.1);
  const hlRing = iv(t3, [HL, HL + 18], [0, 1], EASE_OUT);
  // idle flicker (deterministic)
  const slotA = Math.floor(t3 / 24);
  const rA = rand(slotA * 3.7 + 11);
  const flickA = t3 > 44 && t3 - slotA * 24 < 6 && rA > 0.55 ? (rA > 0.78 ? 0.1 : -0.1) : 0;
  const slotB = Math.floor(t3 / 31);
  const rB = rand(slotB * 5.3 + 2);
  const flickB = t3 > 50 && t3 - slotB * 31 < 5 && rB > 0.62 ? 1 : 0;
  const valA = 0.8 * ka + flickA;
  const valB = Math.round(98 * kb) + flickB;
  const valC = Math.round(24 * kc);
  const tickA = t3 > 12 && t3 < 34 ? decay((t3 - 12) % 5, 2) : 0;
  const glowA = ka >= 1 ? (flickA !== 0 ? 0.5 : 0) : tickA;
  const miniNv = 0.82 * iv(t3, [12, 32], [0, 1], cubicOut) + iv(t3, [32, 44], [0, 1]) * (0.02 * Math.sin(t * 0.7) + 0.012 * Math.sin(t * 2.1));
  const sweepB = t3 > HL + 10 ? ((t3 - HL - 10) % 80) / 34 : -1;
  const BARS = [0.48, 0.62, 0.44, 0.7, 0.58, 0.82, 0.92];
  const DAYS = ["L", "M", "M", "J", "V", "S", "D"];

  const shadowTxt = (a: number) => `0 0 ${(16 + 16 * a).toFixed(1)}px ${rgba(CYAN, 0.45 + 0.3 * a)}`;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: D, height: D, transform: `scale(${k})`, transformOrigin: "0 0" }}>
      {/* ═══ PHASE 1 + 2 group: browser · stopwatch ═══ */}
      {g1Op > 0.003 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "380px 214px",
            transform: `translate(${(-162 * col).toFixed(1)}px, ${(103 * col).toFixed(1)}px) scale(${(1 - 0.72 * col).toFixed(4)})`,
            opacity: g1Op,
            filter: col > 0.02 ? `blur(${(col * 7).toFixed(2)}px)` : undefined,
          }}
        >
          <div style={{ position: "absolute", inset: 0, transformOrigin: "380px 40px", transform: `scale(${s1.toFixed(4)})` }}>
            {/* browser */}
            <div style={{ position: "absolute", inset: 0, perspective: 2400 }}>
              <div
                style={{
                  position: "absolute",
                  left: BR.x,
                  top: BR.y,
                  width: BR.w,
                  height: BR.h,
                  opacity: clamp01(be * 1.5),
                  transform: `rotateX(${(tiltX + (1 - be) * 10).toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale(${(0.93 + 0.07 * be).toFixed(4)})`,
                }}
              >
                <div style={{ ...glass("34,211,238", 0.8 + 0.25 * beatK + 0.6 * stopFlash), position: "absolute", inset: 0 }} />
                {/* header: dots + url bar */}
                <div style={{ position: "absolute", left: 22, top: 0, height: HEAD, display: "flex", alignItems: "center", gap: 9 }}>
                  {["rgba(248,113,113,0.7)", "rgba(245,158,11,0.7)", "rgba(52,211,153,0.7)"].map((c) => (
                    <span key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
                  ))}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 112,
                    right: 22,
                    top: 12,
                    height: 34,
                    borderRadius: 17,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    paddingLeft: 16,
                    fontFamily: fontMono,
                    fontWeight: 500,
                    fontSize: 18,
                    color: B.text2,
                  }}
                >
                  <svg width={14} height={16} viewBox="0 0 14 16">
                    <rect x={1} y={7} width={12} height={8} rx={2} fill={rgba(GREEN, 0.8)} />
                    <path d="M3.5 7 V5 a3.5 3.5 0 0 1 7 0 V7" fill="none" stroke={rgba(GREEN, 0.8)} strokeWidth={1.8} />
                  </svg>
                  monsite.fr
                  <span style={{ flex: 1 }} />
                  <svg width={18} height={18} viewBox="0 0 18 18" style={{ marginRight: 12, transform: `rotate(${(t < SS ? t * 14 : 0).toFixed(0)}deg)` }}>
                    {t < SS ? (
                      <circle cx={9} cy={9} r={6.5} fill="none" stroke={B.cyan} strokeWidth={2.2} strokeDasharray="28 14" strokeLinecap="round" />
                    ) : (
                      <path d="M4 9.5 L7.5 13 L14 5.5" fill="none" stroke={B.ok} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                    )}
                  </svg>
                </div>
                {/* progress bar */}
                <div style={{ position: "absolute", left: 0, right: 0, top: HEAD, height: 5, background: "rgba(148,190,255,0.08)", opacity: 1 - iv(t, [SS + 6, SS + 18], [0, 1]) }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(prog * 100).toFixed(2)}%`, background: "linear-gradient(90deg, #0EA5E9, #67E8F9)", boxShadow: `0 0 12px ${B.cyanGlow}` }} />
                  {prog > 0 && prog < 1 ? <div style={{ position: "absolute", left: `calc(${(prog * 100).toFixed(2)}% - 10px)`, top: -6, width: 20, height: 17, borderRadius: 9, background: "rgba(200,246,255,0.9)", filter: "blur(5px)" }} /> : null}
                </div>
                {/* page skeleton */}
                <svg width={BR.w} height={BR.h} style={{ position: "absolute", left: 0, top: 0, opacity: 1 - 0.62 * loaded, filter: loaded > 0.05 ? `blur(${(2.5 * loaded).toFixed(2)}px)` : undefined }}>
                  {(() => {
                    const ap = (th: number) => iv(prog, [th, th + 0.12], [0, 1]);
                    const sk = "rgba(148,190,255,0.13)";
                    return (
                      <g>
                        <rect x={30} y={86} width={580} height={110} rx={16} fill="rgba(34,211,238,0.1)" stroke="rgba(34,211,238,0.18)" opacity={ap(0.12)} />
                        <rect x={30} y={216} width={360} height={16} rx={8} fill={sk} opacity={ap(0.3)} />
                        <rect x={30} y={244} width={260} height={16} rx={8} fill={sk} opacity={ap(0.4)} />
                        {[0, 1, 2].map((q) => (
                          <rect key={q} x={30 + q * 197} y={282} width={186} height={140} rx={14} fill="rgba(255,255,255,0.045)" stroke="rgba(148,190,255,0.12)" opacity={ap(0.55 + q * 0.12)} />
                        ))}
                      </g>
                    );
                  })()}
                </svg>
                {/* big « ? » with a loading ring */}
                {qIn * (1 - qOut) > 0.003 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: GC.x - 150,
                      top: 268 - 150,
                      width: 300,
                      height: 300,
                      opacity: qIn * (1 - qOut),
                      transform: `scale(${((0.6 + 0.4 * qIn) * (1 - 0.65 * qOut) * (1 + 0.035 * Math.sin(t * 0.26))).toFixed(4)}) rotate(${(-34 * qOut).toFixed(1)}deg)`,
                      filter: qOut > 0.02 ? `blur(${(qOut * 8).toFixed(1)}px)` : undefined,
                    }}
                  >
                    <svg width={300} height={300} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                      <circle cx={150} cy={150} r={128} fill="rgba(4,10,24,0.55)" stroke="rgba(148,190,255,0.12)" strokeWidth={3} />
                      <circle cx={150} cy={150} r={128} fill="none" stroke={B.cyan} strokeWidth={5} strokeLinecap="round" strokeDasharray="140 664" transform={`rotate(${(t * 9).toFixed(1)} 150 150)`} style={{ filter: `drop-shadow(0 0 8px ${B.cyanGlow})` }} />
                    </svg>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: fontInter,
                        fontWeight: 800,
                        fontSize: 190,
                        lineHeight: 1,
                        paddingBottom: 8,
                        color: "#E6FBFF",
                        textShadow: `0 0 30px ${B.cyanGlow}, 0 0 70px rgba(34,211,238,0.35)`,
                      }}
                    >
                      ?
                    </div>
                  </div>
                ) : null}
                {/* speedometer */}
                {gr > 0.003 ? (
                  <svg width={BR.w} height={BR.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                    <defs>
                      <filter id="msBlur" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="7" />
                      </filter>
                    </defs>
                    <path d={arcD(0, 1, GC.r)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={26} strokeLinecap="round" opacity={gr} />
                    {zones.map(([a, b, c, al], q) =>
                      gr > a ? (
                        <g key={q}>
                          {q === 2 ? <path d={arcD(a, Math.min(b, gr), GC.r)} fill="none" stroke={rgba(c, 0.6 * decay(landAge, 18) + 0.15)} strokeWidth={34} filter="url(#msBlur)" /> : null}
                          <path d={arcD(a, Math.min(b, gr), GC.r)} fill="none" stroke={rgba(c, al)} strokeWidth={22} strokeLinecap="round" />
                        </g>
                      ) : null,
                    )}
                    {Array.from({ length: 11 }, (_, q) => {
                      const v = q / 10;
                      const [x1, y1] = gpt(v, GC.r - 24);
                      const [x2, y2] = gpt(v, GC.r - (q % 5 === 0 ? 42 : 34));
                      return <line key={q} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(226,236,250,0.38)" strokeWidth={q % 5 === 0 ? 3.5 : 2.5} strokeLinecap="round" opacity={iv(gr, [v * 0.9, v * 0.9 + 0.1], [0, 1])} />;
                    })}
                    <text x={GC.x - GC.r} y={GC.y + 36} textAnchor="middle" fontFamily={fontInter} fontWeight={600} fontSize={18} fill={B.text3} opacity={gr}>
                      lent
                    </text>
                    <text x={GC.x + GC.r} y={GC.y + 36} textAnchor="middle" fontFamily={fontInter} fontWeight={600} fontSize={18} fill={rgba(GREEN, 0.85)} opacity={gr}>
                      rapide
                    </text>
                    {/* needle */}
                    {(() => {
                      const a = ang(nv);
                      const L = GC.r - 30;
                      const tip = [GC.x + L * Math.cos(a), GC.y + L * Math.sin(a)];
                      const nx = -Math.sin(a), ny = Math.cos(a);
                      const base = 9;
                      const tail = [GC.x - 22 * Math.cos(a), GC.y - 22 * Math.sin(a)];
                      const poly = `${tip[0].toFixed(1)},${tip[1].toFixed(1)} ${(GC.x + nx * base).toFixed(1)},${(GC.y + ny * base).toFixed(1)} ${tail[0].toFixed(1)},${tail[1].toFixed(1)} ${(GC.x - nx * base).toFixed(1)},${(GC.y - ny * base).toFixed(1)}`;
                      return (
                        <g opacity={iv(gr, [0.3, 0.7], [0, 1])}>
                          <polygon points={poly} fill={rgba(CYAN, 0.5)} filter="url(#msBlur)" />
                          <polygon points={poly} fill="#E6FBFF" />
                          <circle cx={GC.x} cy={GC.y} r={17} fill="#0B1530" stroke={B.cyan} strokeWidth={3.5} />
                          <circle cx={GC.x} cy={GC.y} r={6} fill={B.cyan} />
                        </g>
                      );
                    })()}
                  </svg>
                ) : null}
                {/* pill « rapide ? » */}
                {pillE > 0.003 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: GC.x - 120,
                      top: GC.y + 48,
                      width: 240,
                      height: 58,
                      borderRadius: 29,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      background: "rgba(6,14,30,0.85)",
                      border: `1.5px solid ${rgba(GREEN, 0.35 + 0.4 * checkP)}`,
                      boxShadow: `0 0 ${(14 + 18 * decay(landAge - 8, 14) + 10 * beatK).toFixed(1)}px ${rgba(GREEN, 0.3)}, 0 8px 20px rgba(0,0,0,0.5)`,
                      opacity: clamp01(pillE * 1.5),
                      transform: `scale(${(0.6 + 0.4 * pillE).toFixed(4)})`,
                      fontFamily: fontInter,
                      fontWeight: 800,
                      fontSize: 30,
                      color: B.white,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    rapide ?
                    <span style={{ width: 34, height: 34, borderRadius: 17, background: rgba(GREEN, 0.18 * checkP + 0.02), border: `1.5px solid ${rgba(GREEN, 0.8 * checkP)}`, display: "flex", alignItems: "center", justifyContent: "center", opacity: clamp01(checkP * 3) }}>
                      <CheckIcon s={22} col={B.ok} p={checkP} />
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* stopwatch */}
            <div style={{ position: "absolute", left: SW.x - 110, top: SW.y - 130, width: 220, height: 230, transformOrigin: "110px 130px", transform: `scale(${swE.toFixed(4)}) rotate(${(Math.sin(t * 0.05) * 2.5).toFixed(2)}deg)`, opacity: clamp01(swE * 2) }}>
              <svg width={220} height={230} style={{ overflow: "visible" }}>
                <defs>
                  <filter id="msBlurSw" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="10" />
                  </filter>
                  <radialGradient id="msFace" cx="0.4" cy="0.35" r="0.8">
                    <stop offset="0" stopColor="#16284D" />
                    <stop offset="1" stopColor="#070E20" />
                  </radialGradient>
                </defs>
                {(() => {
                  const cx = 110, cy = 130, r = SW.r;
                  const ha = ((handA - 90) * Math.PI) / 180;
                  const hx = cx + (r - 16) * Math.cos(ha), hy = cy + (r - 16) * Math.sin(ha);
                  const tx = cx - 14 * Math.cos(ha), ty = cy - 14 * Math.sin(ha);
                  const ra = r - 26;
                  const trail = (handA % 360) / 360;
                  const tEnd = [cx + ra * Math.cos(ha), cy + ra * Math.sin(ha)];
                  return (
                    <g>
                      <rect x={cx - 15} y={cy - r - 24 + crownDy} width={30} height={14} rx={5} fill="#BFEFFF" opacity={0.9} />
                      <rect x={cx - 6} y={cy - r - 12 + crownDy * 0.6} width={12} height={14} fill="rgba(191,239,255,0.7)" />
                      <rect x={cx + r * 0.62} y={cy - r * 0.86} width={18} height={10} rx={4} fill="rgba(191,239,255,0.6)" transform={`rotate(45 ${cx + r * 0.62 + 9} ${cy - r * 0.86 + 5})`} />
                      <circle cx={cx} cy={cy} r={r + 12} fill={rgba(CYAN, 0.12 + 0.3 * stopFlash)} filter="url(#msBlurSw)" />
                      <circle cx={cx} cy={cy} r={r} fill="url(#msFace)" stroke={`rgba(190,240,255,${(0.55 + 0.4 * stopFlash).toFixed(3)})`} strokeWidth={5} />
                      <circle cx={cx} cy={cy} r={r - 7} fill="none" stroke="rgba(148,190,255,0.16)" strokeWidth={1.5} />
                      {Array.from({ length: 12 }, (_, q) => {
                        const a = (q / 12) * Math.PI * 2 - Math.PI / 2;
                        const r1 = r - 12, r2 = r - (q % 3 === 0 ? 22 : 17);
                        return <line key={q} x1={cx + r1 * Math.cos(a)} y1={cy + r1 * Math.sin(a)} x2={cx + r2 * Math.cos(a)} y2={cy + r2 * Math.sin(a)} stroke="rgba(226,236,250,0.5)" strokeWidth={q % 3 === 0 ? 3 : 2} strokeLinecap="round" />;
                      })}
                      {trail > 0.005 ? (
                        <path d={`M${cx} ${cy - ra} A${ra} ${ra} 0 ${trail > 0.5 ? 1 : 0} 1 ${tEnd[0].toFixed(2)} ${tEnd[1].toFixed(2)}`} fill="none" stroke={rgba(CYAN, 0.55 + 0.4 * stopFlash)} strokeWidth={9} strokeLinecap="round" />
                      ) : null}
                      <line x1={tx} y1={ty} x2={hx} y2={hy} stroke="#F8FAFC" strokeWidth={4} strokeLinecap="round" />
                      <circle cx={cx} cy={cy} r={7} fill={B.cyan} stroke="#F8FAFC" strokeWidth={2} />
                    </g>
                  );
                })()}
              </svg>
            </div>
            {/* stopwatch readout */}
            <div
              style={{
                ...glass("34,211,238", 0.5 + stopFlash),
                position: "absolute",
                left: 226,
                top: 546,
                height: 64,
                padding: "0 22px",
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                gap: 4,
                border: `1.5px solid rgba(190,240,255,${(0.14 + 0.6 * stopFlash).toFixed(3)})`,
                opacity: iv(t, [8, 20], [0, 1]),
                transform: `translateX(${((1 - iv(t, [8, 22], [0, 1], EASE_OUT)) * -20).toFixed(1)}px) scale(${(1 + 0.08 * stopFlash).toFixed(3)})`,
                fontFamily: fontMono,
                fontWeight: 700,
                fontSize: 42,
                letterSpacing: "-0.03em",
                color: B.white,
                textShadow: shadowTxt(stopFlash),
                whiteSpace: "nowrap",
              }}
            >
              {readout}
              <span style={{ fontSize: 26, color: B.text2, marginLeft: 6 }}>s</span>
            </div>
          </div>
          <Sparks age={t - SS} x={SW.x} y={SW.y} n={10} r={100} col={CYAN} seed={3} dur={26} />
        </div>
      ) : null}

      {/* ═══ PHASE 2: deliveries ═══ */}
      {t2 > 0 && g1Op > 0.003 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "380px 571px",
            transform: `translate(${(162 * col).toFixed(1)}px, ${(-254 * col).toFixed(1)}px) scale(${(1 - 0.72 * col).toFixed(4)})`,
            opacity: g1Op * clamp01(de * 1.5),
            filter: col > 0.02 ? `blur(${(col * 7).toFixed(2)}px)` : undefined,
          }}
        >
          <div style={{ position: "absolute", inset: 0, transform: `translateY(${((1 - de) * 26).toFixed(1)}px)` }}>
            {/* tally card « livraisons ✓ ✓ ✗ ✓ » */}
            <div
              style={{
                ...glass("34,211,238", 0.6 + 0.3 * lampFlash),
                position: "absolute",
                left: 170,
                top: 428,
                width: 420,
                height: 74,
                borderRadius: 22,
                display: "flex",
                alignItems: "center",
                padding: "0 20px 0 24px",
                gap: 12,
              }}
            >
              <span style={{ fontFamily: fontInter, fontWeight: 700, fontSize: 28, color: B.white, letterSpacing: "-0.01em", flex: 1 }}>livraisons</span>
              {cross.map((c, i) => {
                const mk = backOut(iv(t2, [c + 1, c + 12], [0, 1]), 2.4);
                const bad = i === BAD;
                const colr = bad ? ROSE : GREEN;
                const fl = decay(t2 - c - 1, 12);
                return (
                  <div
                    key={i}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: mk > 0.02 ? `1.5px solid ${rgba(colr, 0.7)}` : "1.5px dashed rgba(148,190,255,0.22)",
                      background: mk > 0.02 ? rgba(colr, 0.14 + 0.25 * fl) : "rgba(255,255,255,0.03)",
                      boxShadow: mk > 0.02 ? `0 0 ${(8 + 22 * fl).toFixed(1)}px ${rgba(bad ? AMBER : colr, 0.35 + 0.3 * fl)}` : undefined,
                    }}
                  >
                    {mk > 0.01 ? <div style={{ transform: `scale(${mk.toFixed(3)})` }}>{bad ? <CrossIcon s={26} col="#FCA5A5" w={3.6} /> : <CheckIcon s={28} col={B.ok} w={3.6} />}</div> : null}
                  </div>
                );
              })}
            </div>

            <svg width={D} height={D} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <defs>
                <filter id="msBlur2" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" />
                </filter>
                <linearGradient id="msBoxF" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="rgba(34,211,238,0.26)" />
                  <stop offset="1" stopColor="rgba(34,211,238,0.08)" />
                </linearGradient>
                <linearGradient id="msBeam" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="rgba(34,211,238,0)" />
                  <stop offset="0.5" stopColor="rgba(160,240,255,0.9)" />
                  <stop offset="1" stopColor="rgba(34,211,238,0)" />
                </linearGradient>
                <clipPath id="msBeltClip">
                  <rect x={40} y={BELT_Y + 4} width={680} height={16} rx={8} />
                </clipPath>
              </defs>
              {/* scanner gate (behind the boxes) */}
              <g>
                <rect x={GATE - 62} y={540} width={124} height={BELT_Y - 540} rx={14} fill="rgba(34,211,238,0.04)" stroke="rgba(148,190,255,0.2)" strokeWidth={2} />
                <rect x={GATE - 3 - 4 * lampFlash} y={548} width={6 + 8 * lampFlash} height={BELT_Y - 556} rx={3} fill="url(#msBeam)" opacity={0.45 + 0.25 * Math.sin(t * 0.3) + 0.4 * lampFlash} />
                <rect x={GATE - 62} y={540} width={124} height={BELT_Y - 540} rx={14} fill={rgba(lampCol, 0.18 * lampFlash)} />
                <circle cx={GATE} cy={524} r={22} fill={rgba(lampCol, 0.25 + 0.5 * lampFlash)} filter="url(#msBlur2)" />
                <circle cx={GATE} cy={524} r={10} fill={rgba(lampCol, 0.7 + 0.3 * lampFlash)} stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} />
              </g>
              {/* belt */}
              <rect x={28} y={BELT_Y} width={704} height={24} rx={12} fill="rgba(15,29,54,0.9)" stroke="rgba(148,190,255,0.22)" strokeWidth={1.5} />
              <g clipPath="url(#msBeltClip)">
                {Array.from({ length: 20 }, (_, q) => (
                  <rect key={q} x={20 + q * 40 + beltOff - 40} y={BELT_Y + 9} width={20} height={6} rx={3} fill="rgba(34,211,238,0.35)" />
                ))}
              </g>
              <circle cx={44} cy={BELT_Y + 12} r={7} fill="none" stroke="rgba(148,190,255,0.4)" strokeWidth={2} />
              <circle cx={716} cy={BELT_Y + 12} r={7} fill="none" stroke="rgba(148,190,255,0.4)" strokeWidth={2} />
              <rect x={60} y={BELT_Y + 26} width={640} height={10} rx={5} fill={rgba(CYAN, 0.18)} filter="url(#msBlur2)" />
              {streak >= 0 && streak <= 1 ? <rect x={40 + streak * 600} y={BELT_Y + 3} width={90} height={18} rx={9} fill={rgba(CYAN, 0.55 * Math.sin(Math.PI * streak))} filter="url(#msBlur2)" /> : null}
              {/* boxes v1…v4 */}
              {cross.map((c, i) => {
                const x = GATE + vel * (T2 - c);
                const pop = backOut(iv(t2, [i * 3, i * 3 + 14], [0, 1]), 1.7);
                const op = clamp01(pop * 1.5) * iv(x, [40, 100], [0, 1]) * iv(x, [640, 712], [1, 0]);
                if (op < 0.004) return null;
                const bad = i === BAD;
                const ca = crackAge;
                let rot = 0;
                let dy = 0;
                if (bad) {
                  if (ca < 0) rot = Math.sin(ca * 1.5) * 8 * iv(ca, [-16, 0], [0, 1]);
                  else {
                    rot = 5 * iv(ca, [0, 8], [0, 1], EASE_OUT) + 5 * Math.sin(ca * 1.3) * decay(ca, 7);
                    dy = 5 * iv(ca, [0, 6], [0, 1], EASE_OUT);
                  }
                }
                dy += restK * 1.6 * Math.sin(t * 0.13 + i * 1.7);
                const red = bad && ca >= 0 ? 0.5 * decay(ca, 10) + 0.12 : 0;
                const crk = bad ? iv(ca, [0, 5], [0, 1]) : 0;
                const h = BOX * (0.35 + 0.65 * pop);
                const w = BOX;
                const crackD = `M-4 ${-h} L8 ${-h * 0.8} L-6 ${-h * 0.62} L10 ${-h * 0.44} L-2 ${-h * 0.26} L6 0`;
                return (
                  <g key={i} opacity={op} transform={`translate(${x.toFixed(1)} ${(BELT_Y + dy).toFixed(1)}) rotate(${rot.toFixed(2)})`}>
                    <ellipse cx={4} cy={2} rx={50} ry={6} fill="rgba(0,0,0,0.45)" />
                    <polygon points={`${w / 2},${-h} ${w / 2 + 14},${-h - 12} ${w / 2 + 14},${-12} ${w / 2},0`} fill="rgba(14,116,144,0.35)" stroke="rgba(34,211,238,0.5)" strokeWidth={1.5} />
                    <polygon points={`${-w / 2},${-h} ${w / 2},${-h} ${w / 2 + 14},${-h - 12} ${-w / 2 + 14},${-h - 12}`} fill="rgba(165,243,252,0.28)" stroke="rgba(34,211,238,0.6)" strokeWidth={1.5} />
                    <rect x={-w / 2} y={-h} width={w} height={h} rx={6} fill="url(#msBoxF)" stroke={rgba(CYAN, 0.8)} strokeWidth={2} />
                    <rect x={-8} y={-h} width={16} height={h * 0.42} fill="rgba(190,240,255,0.32)" />
                    <polygon points={`-8,${-h} 8,${-h} 22,${-h - 12} 6,${-h - 12}`} fill="rgba(190,240,255,0.4)" />
                    <text x={0} y={-h * 0.18} textAnchor="middle" fontFamily={fontMono} fontWeight={700} fontSize={22} fill="#F8FAFC">
                      v{i + 1}
                    </text>
                    {bad && red > 0 ? <rect x={-w / 2} y={-h} width={w} height={h} rx={6} fill={rgba(ROSE, red)} /> : null}
                    {bad && crk > 0 ? (
                      <g>
                        <path d={crackD} fill="none" stroke={rgba(AMBER, 0.9)} strokeWidth={8} filter="url(#msBlur2)" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - crk} opacity={0.35 + 0.6 * decay(ca, 14) + 0.2 * restK * (0.5 + 0.5 * Math.sin(t * 0.15))} />
                        <path d={crackD} fill="none" stroke="#FFE3B0" strokeWidth={3} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - crk} />
                        <path d={`M8 ${-h * 0.8} L24 ${-h * 0.86} M10 ${-h * 0.44} L28 ${-h * 0.38}`} fill="none" stroke="#FFD18A" strokeWidth={2} strokeLinecap="round" opacity={crk} />
                      </g>
                    ) : null}
                  </g>
                );
              })}
            </svg>
            <Flare age={crackAge} x={GATE + vel * (T2 - cross[BAD])} y={BELT_Y - 46} col={AMBER} dur={24} strength={0.55} w={300} />
            <Sparks age={crackAge} x={GATE + vel * (T2 - cross[BAD])} y={BELT_Y - 50} n={12} r={95} col={AMBER} seed={7} dur={28} />
          </div>
        </div>
      ) : null}

      {/* ═══ PHASE 3: scoreboard ═══ */}
      {t3 > 2 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: CB.x,
              top: CB.y,
              width: CB.w,
              height: CB.h,
              opacity: clamp01(ce * 1.4),
              transform: `scale(${(0.9 + 0.1 * ce).toFixed(4)})`,
              filter: ce < 0.96 ? `blur(${((1 - ce) * 8).toFixed(2)}px)` : undefined,
            }}
          >
            <div style={{ ...glass("34,211,238", 0.85 + 0.25 * beatK + 0.4 * decay(t3 - HL, 16)), position: "absolute", inset: 0 }} />
            {/* header */}
            <div style={{ position: "absolute", left: 22, top: 22, opacity: iv(t3, [6, 16], [0, 1]) }}>
              <Logo name="devops" size={100} draw={iv(t3, [6, 24], [0, 1], EASE_OUT)} spin={Math.max(0, t3 - 24)} />
            </div>
            <div style={{ position: "absolute", left: 140, top: 0, height: 96, display: "flex", alignItems: "center", fontFamily: fontInter, fontWeight: 800, fontSize: 34, color: B.white, letterSpacing: "-0.02em", opacity: iv(t3, [8, 18], [0, 1]), transform: `translateX(${((1 - iv(t3, [8, 22], [0, 1], EASE_OUT)) * -16).toFixed(1)}px)` }}>
              Les chiffres
            </div>
            <div style={{ position: "absolute", right: 22, top: 28, height: 40, padding: "0 14px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.35)", fontFamily: fontMono, fontWeight: 700, fontSize: 17, color: B.ok, opacity: iv(t3, [10, 20], [0, 1]) }}>
              <span style={{ width: 9, height: 9, borderRadius: 5, background: B.ok, boxShadow: `0 0 ${(6 + 8 * (0.5 + 0.5 * Math.sin(t * 0.18))).toFixed(1)}px ${B.ok}`, opacity: 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.18)) }} />
              live
            </div>
            <div style={{ position: "absolute", left: 22, right: 22, top: 90, height: 1, background: "rgba(148,190,255,0.12)", transform: `scaleX(${iv(t3, [6, 24], [0, 1], EASE_OUT).toFixed(3)})`, transformOrigin: "0 0" }} />

            {/* tile A · Chargement 0,8 s */}
            <Tile r={TA} e={eA} label="Chargement">
              <svg width={90} height={56} style={{ position: "absolute", right: 18, top: 14, overflow: "visible" }}>
                {(() => {
                  const cx = 45, cy = 46, r = 34;
                  const p = (v: number, rr: number) => [cx + rr * Math.cos(Math.PI + Math.PI * v), cy + rr * Math.sin(Math.PI + Math.PI * v)];
                  const a0 = p(0, r), a1 = p(1, r), gz = p(0.7, r);
                  const nd = p(clamp01(miniNv), r - 8);
                  return (
                    <g>
                      <path d={`M${a0[0]} ${a0[1]} A${r} ${r} 0 0 1 ${a1[0]} ${a1[1]}`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={8} strokeLinecap="round" />
                      <path d={`M${gz[0].toFixed(2)} ${gz[1].toFixed(2)} A${r} ${r} 0 0 1 ${a1[0]} ${a1[1]}`} fill="none" stroke={rgba(GREEN, 0.85)} strokeWidth={8} strokeLinecap="round" />
                      <line x1={cx} y1={cy} x2={nd[0]} y2={nd[1]} stroke="#F8FAFC" strokeWidth={3.5} strokeLinecap="round" />
                      <circle cx={cx} cy={cy} r={5} fill={B.cyan} />
                    </g>
                  );
                })()}
              </svg>
              <div style={{ position: "absolute", left: 22, top: 84, display: "flex", alignItems: "baseline", fontFamily: fontMono, fontWeight: 700, fontSize: 92, letterSpacing: "-0.05em", color: B.white, textShadow: shadowTxt(glowA) }}>
                {fr1(valA)}
                <span style={{ fontSize: 44, color: B.text2, marginLeft: 10 }}>s</span>
              </div>
              <div style={{ position: "absolute", left: 22, top: 196, display: "flex", alignItems: "center", gap: 8, fontFamily: fontInter, fontWeight: 700, fontSize: 24, color: B.ok, opacity: iv(t3, [30, 40], [0, 1]) }}>
                <CheckIcon s={24} col={B.ok} p={iv(t3, [30, 40], [0, 1])} /> rapide
              </div>
            </Tile>

            {/* tile B · Livraisons OK 98 % — the amber key */}
            <Tile r={TB} e={eB} label="Livraisons OK" hl={hl * (0.85 + 0.15 * hlBreath)}>
              {sweepB >= 0 && sweepB <= 1.4 ? (
                <div style={{ position: "absolute", top: -60, bottom: -60, width: 90, left: `${(-30 + sweepB * 110).toFixed(1)}%`, transform: "rotate(18deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,220,160,0.14), rgba(255,255,255,0))" }} />
              ) : null}
              <div
                style={{
                  position: "absolute",
                  right: 18,
                  top: 14,
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: rgba(AMBER, 0.16),
                  border: `1.5px solid ${rgba(AMBER, 0.85)}`,
                  boxShadow: `0 0 ${(12 + 12 * hlBreath).toFixed(1)}px ${rgba(AMBER, 0.45)}`,
                  opacity: clamp01(hl * 1.5),
                  transform: `scale(${backOut(iv(t3, [HL, HL + 14], [0, 1]), 2.4).toFixed(3)})`,
                }}
              >
                <CheckIcon s={28} col="#FFD18A" w={3.6} p={iv(t3, [HL + 4, HL + 14], [0, 1])} />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 22,
                  top: 84,
                  display: "flex",
                  alignItems: "baseline",
                  fontFamily: fontMono,
                  fontWeight: 700,
                  fontSize: 92,
                  letterSpacing: "-0.05em",
                  color: hl > 0.5 ? "#FFF4E0" : B.white,
                  textShadow: hl > 0.02 ? `0 0 ${(18 + 16 * hlBreath).toFixed(1)}px ${rgba(AMBER, 0.35 + 0.35 * hl)}` : shadowTxt(kb > 0 && kb < 1 ? 0.6 : 0),
                  opacity: 0.94 + 0.06 * Math.sin(t * 1.7) * iv(t3, [44, 54], [0, 1]),
                }}
              >
                {valB}
                <span style={{ fontSize: 44, color: hl > 0.5 ? B.amber : B.text2, marginLeft: 10 }}>%</span>
              </div>
              <div style={{ position: "absolute", left: 22, top: 198, fontFamily: fontMono, fontWeight: 700, fontSize: 22, color: B.text2, opacity: iv(t3, [32, 42], [0, 1]) }}>49 sur 50</div>
            </Tile>

            {/* tile C · Livraisons / semaine 24 + bars */}
            <Tile r={TC} e={eC} label="Livraisons / semaine">
              <div style={{ position: "absolute", left: 22, top: 74, fontFamily: fontMono, fontWeight: 700, fontSize: 88, letterSpacing: "-0.05em", color: B.white, textShadow: shadowTxt(kc > 0 && kc < 1 ? 0.6 : 0) }}>{valC}</div>
              <svg width={TC.w} height={TC.h} style={{ position: "absolute", left: 0, top: 0 }}>
                <defs>
                  <linearGradient id="msBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#67E8F9" />
                    <stop offset="1" stopColor="#0E7490" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                {BARS.map((b, q) => {
                  const grow = backOut(iv(t3, [18 + q * 2.5, 36 + q * 2.5], [0, 1]), 1.4);
                  const br = 1 + iv(t3, [44, 60], [0, 1]) * (0.07 * Math.sin(t * 0.09 + q * 0.95) + 0.025 * Math.sin(t * 0.25 + q * 2));
                  const bx0 = 250, bw0 = 360, slot = bw0 / BARS.length;
                  const bh = Math.max(0, 120 * b * grow * br);
                  const bw = slot * 0.56;
                  const x = bx0 + slot * q + (slot - bw) / 2;
                  const yb = 160;
                  return (
                    <g key={q}>
                      <rect x={x} y={yb - bh} width={bw} height={bh} rx={6} fill="url(#msBar)" opacity={q === BARS.length - 1 ? 1 : 0.75} />
                      <rect x={x} y={yb - bh} width={bw} height={Math.min(4, bh)} rx={2} fill="#E6FBFF" opacity={0.85} />
                      <text x={x + bw / 2} y={yb + 26} textAnchor="middle" fontFamily={fontMono} fontSize={15} fill={B.text3} opacity={eC}>
                        {DAYS[q]}
                      </text>
                    </g>
                  );
                })}
                <line x1={246} x2={614} y1={160} y2={160} stroke="rgba(148,190,255,0.18)" strokeWidth={1.5} opacity={eC} />
              </svg>
            </Tile>

            {/* amber ring on the key tile */}
            {hl > 0 && hlRing < 1 ? (
              <div style={{ position: "absolute", left: TB.x + TB.w / 2 - 120 - 90 * hlRing, top: TB.y + TB.h / 2 - 120 - 90 * hlRing, width: 240 + 180 * hlRing, height: 240 + 180 * hlRing, borderRadius: "50%", border: `3px solid ${rgba(AMBER, 0.8 * (1 - hlRing))}`, pointerEvents: "none" }} />
            ) : null}
          </div>
          <Flare age={t3 - HL} x={CB.x + TB.x + 120} y={CB.y + TB.y + 140} col={AMBER} dur={30} strength={0.6} w={460} />
          <Sparks age={t3 - HL} x={CB.x + TB.x + 120} y={CB.y + TB.y + 140} n={12} r={120} col={AMBER} seed={19} />
        </>
      ) : null}
    </div>
  );
};
