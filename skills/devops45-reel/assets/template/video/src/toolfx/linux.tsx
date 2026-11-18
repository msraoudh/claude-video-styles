import React from "react";
import { Logo } from "../kit/Logo";
import { fontInter, fontMono } from "../kit/fonts";
import { glass } from "../lib/look";
import { beatPulse, rand } from "../lib/sync";
import { AMBER, AnamorphicFlare, clamp01, CYAN, decay, EASE_IN, EASE_IN_OUT, EASE_OUT, ICE, iv, rgba, Shockwave } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/* ───────────────────────── Linux: the base layer of the computer… and it is everywhere ─────────────────────────
 * Two uses (director's rule 2026-10-23):
 *  A) beats = []  → « Linux, c'est le logiciel de base d'un ordinateur, comme Windows » : ONLY phase 1, then idle on it.
 *  B) beats = [« serveurs », « cloud », « poche »] → phase 1 built fast, the stack shrinks to the left, then the rack
 *     lights on beats[0], the cloud on beats[1], the phone (Android-ish robot) on beats[2].
 *
 * phase 1 (local time p; p = t in A, p = 2.2·t in B)
 *   0–12   the hardware slab « matériel » drops in (chips, vents, LEDs) → squash
 *   14–26  the glowing glass layer with the real Linux logo + « le système » slams onto it → flash, amber flare, shockwave
 *   34–56  three app tiles (web, music, chat) drop onto the top of the Linux layer → « applis »
 *   58–76  a light sweep runs through the Linux layer (it is THE base) ; idle: tiles bob, LEDs blink, the layer breathes
 * phase 2 (B only)
 *   P2→+20 the stack shrinks to the left (labels fade, the logo grows on the layer) ; dim device silhouettes fade in
 *   T−14→T a light line draws from the Linux core to each device ; at T the device lights, its Linux logo spins in
 *          (rack: 3 units one by one ; cloud ; phone: screen wakes, robot pops on a tiny Linux slab) → chip « partout »
 *   idle   pulses run from the core to each device, server LEDs blink, cloud & phone bob
 */

const SW = 560;
const SH = 420;
const ST = { left: 100, top: 170 };
const HW = { xL: 20, xR: 540, yb: 380, h: 60, d: 80, ins: 40 };
const LX = { xL: 40, xR: 520, yb: 300, h: 112, d: 70, ins: 35 };
const TILE_B = 176; // tile bottom (on the Linux top face)
const TS = 98;
type TK = "web" | "music" | "chat";
const TILES: Array<{ x: number; k: TK; at: number }> = [
  { x: 168, k: "web", at: 34 },
  { x: 280, k: "music", at: 40 },
  { x: 392, k: "chat", at: 46 },
];
const CORE = { tx: -200, ty: 20, s: 0.56 };
const S = { x: 320, y: 419 }; // core output (right edge of the Linux layer once shrunk)
const RACK = { x: 580, y: 175, w: 250, h: 186 };
const CLOUD = { x: 610, y: 410, w: 236, h: 144 };
const PHONE = { x: 590, y: 618, w: 118, h: 204 };
const TGT = [
  { x: RACK.x - RACK.w / 2, y: RACK.y },
  { x: CLOUD.x - CLOUD.w / 2 + 12, y: CLOUD.y + 18 },
  { x: PHONE.x - PHONE.w / 2, y: PHONE.y },
];

type Lay = { xL: number; xR: number; yb: number; h: number; d: number; ins: number };
const front = (L: Lay) => `M${L.xL} ${L.yb - L.h} H${L.xR} V${L.yb} H${L.xL} Z`;
const top = (L: Lay) => {
  const yt = L.yb - L.h;
  return `M${L.xL} ${yt} L${L.xL + L.ins} ${yt - L.d} H${L.xR - L.ins} L${L.xR} ${yt} Z`;
};
const squash = (age: number, amp: number) => (age >= 0 ? Math.sin(clamp01(age / 18) * Math.PI * 2) * Math.exp(-age / 6) * amp : 0);

type P = [number, number];
const bez = (a: P, b: P, c: P, d: P, u: number): P => {
  const v = 1 - u;
  return [v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]];
};
const ctrl = (i: number): [P, P, P, P] => {
  const T = TGT[i];
  return [
    [S.x, S.y],
    [S.x + 80, S.y + (T.y - S.y) * 0.1],
    [T.x - 80, T.y],
    [T.x, T.y],
  ];
};

/* ───────────────────────── tile icons ───────────────────────── */
const TileIcon: React.FC<{ k: TK }> = ({ k }) => {
  const ic = "#67E8F9";
  return (
    <svg width={54} height={54} viewBox="0 0 60 60" style={{ overflow: "visible", filter: "drop-shadow(0 0 8px rgba(34,211,238,0.6))" }}>
      <g fill="none" stroke={ic} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
        {k === "web" ? (
          <>
            <circle cx={30} cy={30} r={24} />
            <ellipse cx={30} cy={30} rx={10} ry={24} />
            <path d="M7 22 H53 M7 38 H53" />
          </>
        ) : k === "music" ? (
          <>
            <path d="M22 44 V12 L48 6 V38" />
            <circle cx={16} cy={45} r={7} fill={ic} />
            <circle cx={42} cy={39} r={7} fill={ic} />
          </>
        ) : (
          <>
            <path d="M8 12 H52 V40 H26 L14 51 V40 H8 Z" />
            <path d="M18 23 H42 M18 31 H34" />
          </>
        )}
      </g>
    </svg>
  );
};

/* ───────────────────────── devices ───────────────────────── */
const RackUnit: React.FC<{ g: number; i: number; lit: number; logoD: number; flash: number }> = ({ g, i, lit, logoD, flash }) => {
  const W = 226;
  const H = 50;
  const leds = [0, 1, 2].map((j) => (lit > 0.5 ? (rand(Math.floor((g + i * 3) / 7) * 13.7 + i * 7 + j * 3.1) > 0.3 ? 1 : 0.25) : 0.12));
  return (
    <div style={{ position: "relative", width: W, height: H, borderRadius: 12, background: `linear-gradient(180deg, ${rgba(CYAN, 0.05 + 0.2 * lit)}, rgba(6,14,30,0.85))`, border: `2px solid ${rgba(CYAN, 0.18 + 0.7 * lit)}`, boxShadow: lit > 0.01 ? `0 0 ${(26 * lit).toFixed(0)}px ${rgba(CYAN, 0.35 * lit)}, inset 0 1px 0 rgba(255,255,255,${(0.1 + 0.3 * lit).toFixed(2)})` : undefined }}>
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 9 }, (_, v) => (
          <line key={v} x1={70 + v * 11} y1={15} x2={70 + v * 11} y2={35} stroke={rgba(CYAN, 0.16 + 0.3 * lit)} strokeWidth={4} strokeLinecap="round" />
        ))}
        {leds.map((a, j) => (
          <circle key={j} cx={176 + j * 16} cy={25} r={5} fill={j === 0 ? `rgba(52,211,153,${(0.2 + 0.8 * a).toFixed(2)})` : rgba(CYAN, 0.15 + 0.85 * a)} style={a > 0.5 ? { filter: `drop-shadow(0 0 5px ${j === 0 ? "rgba(52,211,153,0.9)" : "rgba(34,211,238,0.9)"})` } : undefined} />
        ))}
      </svg>
      {logoD > 0.01 ? (
        <div style={{ position: "absolute", left: 8, top: 4 }}>
          <Logo name="linux" size={42} draw={logoD} glow={0.4 * lit} />
        </div>
      ) : null}
      {flash > 0.01 ? <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: "#EFFCFF", opacity: Math.min(0.85, flash) }} /> : null}
    </div>
  );
};

const CLOUD_D = "M52 132 C20 132 6 110 10 90 C14 68 34 58 54 62 C58 32 86 12 116 16 C142 19 162 37 168 60 C178 50 198 48 212 58 C230 70 234 94 224 112 C216 126 202 132 188 132 Z";

/** a friendly phone robot (generic, no brand mark) */
const Robot: React.FC<{ s: number }> = ({ s }) => {
  const c = "#34D399";
  return (
    <svg width={70 * s} height={84 * s} viewBox="0 0 70 84" style={{ overflow: "visible", filter: "drop-shadow(0 0 10px rgba(52,211,153,0.55))" }}>
      <g stroke={c} strokeWidth={3.5} strokeLinecap="round">
        <line x1={22} y1={14} x2={15} y2={3} />
        <line x1={48} y1={14} x2={55} y2={3} />
      </g>
      <path d="M10 34 A25 25 0 0 1 60 34 Z" fill={c} />
      <circle cx={25} cy={24} r={3.4} fill="#06101F" />
      <circle cx={45} cy={24} r={3.4} fill="#06101F" />
      <path d="M10 38 H60 V64 Q60 72 52 72 H18 Q10 72 10 64 Z" fill={c} />
      <rect x={0} y={40} width={7} height={24} rx={3.5} fill={c} />
      <rect x={63} y={40} width={7} height={24} rx={3.5} fill={c} />
      <rect x={20} y={68} width={9} height={15} rx={4.5} fill={c} />
      <rect x={41} y={68} width={9} height={15} rx={4.5} fill={c} />
    </svg>
  );
};

/* ───────────────────────── the animation ───────────────────────── */
export const LinuxFx: ToolFx = ({ g, f0, f1, beats, size }) => {
  const t = g - f0;
  const k = size / 760;
  const bp = beatPulse(g, 14);

  // ── mode: A (no beats → phase 1 only) or B (beats → spread on beats[0..2]) ──
  const bt = beats
    .map((b) => b - f0)
    .filter((b) => b >= 0 && b <= f1 - f0)
    .sort((a, b) => a - b);
  const modeB = bt.length > 0;
  const TS_ = modeB ? 2.2 : 1; // phase 1 speed
  const p = t * TS_;
  const P2 = modeB ? Math.max(28, bt[0] - 30) : 1e9;
  const T0 = modeB ? Math.max(bt[0], P2 + 22) : 1e9;
  const T1 = modeB ? Math.max(bt[1] ?? T0 + 26, T0 + 16) : 1e9;
  const T2 = modeB ? Math.max(bt[2] ?? T1 + 22, T1 + 16) : 1e9;
  const TD = [T0, T1, T2];

  // ── phase 1 ──
  const hwIn = iv(p, [0, 12], [0, 1], EASE_IN);
  const hwDy = -110 * (1 - hwIn);
  const hwO = iv(p, [0, 4], [0, 1]);
  const lxIn = iv(p, [14, 26], [0, 1], EASE_IN);
  const lxDy = -190 * (1 - lxIn);
  const lxO = iv(p, [14, 18], [0, 1]);
  const lxAge = p - 26;
  const hwSq = squash(p - 12, 0.06) + squash(lxAge, 0.035);
  const lxSq = squash(lxAge, 0.07);
  const lxFlash = decay(lxAge, 5) * 0.8;
  const rimA = decay(lxAge, 16); // amber rim on the key landing
  const sweepX = p >= 58 && p < 76 ? iv(p, [58, 76], [LX.xL - 120, LX.xR + 120], EASE_IN_OUT) : null;
  const idleSweep = !modeB && t > 100 ? ((t - 100) % 110) / 60 : -1;
  const sweep = sweepX ?? (idleSweep >= 0 && idleSweep <= 1 ? LX.xL - 120 + idleSweep * (LX.xR - LX.xL + 240) : null);
  const idle1 = clamp01((p - 60) / 30);
  const breathe = 0.5 + 0.5 * Math.sin(g * 0.08);
  const lxGlow = 0.35 + 0.25 * breathe * idle1 + 0.3 * bp * idle1 + 0.7 * decay(lxAge, 10);
  const labA = iv(p, [26, 36], [0, 1]);

  // ── phase 2 ──
  const mv = modeB ? iv(t, [P2, P2 + 20], [0, 1], EASE_IN_OUT) : 0;
  const stackT = `translate(${(CORE.tx * mv).toFixed(2)}px, ${(CORE.ty * mv).toFixed(2)}px) scale(${(1 + (CORE.s - 1) * mv).toFixed(4)})`;
  const devIn = modeB ? iv(t, [P2 + 8, P2 + 22], [0, 1], EASE_OUT) : 0;
  const lit = TD.map((T) => (modeB ? iv(t, [T, T + 8], [0, 1], EASE_OUT) : 0));
  const lineP = TD.map((T) => (modeB ? iv(t, [Math.max(P2 + 12, T - 14), T], [0, 1], EASE_IN_OUT) : 0));
  const textA = 1 - mv;
  const devFlash = TD.map((T) => (modeB ? decay(t - T, 6) : 0));

  // sparks when the Linux layer lands
  const sparks: React.ReactNode[] = [];
  const sa = lxAge / TS_;
  if (sa >= 0 && sa < 24) {
    for (let i = 0; i < 16; i++) {
      const r1 = rand(31 + i * 7.1);
      const r2 = rand(31 + i * 3.3 + 1);
      const side = i % 2 ? 1 : -1;
      const ox = side > 0 ? LX.xR : LX.xL;
      const vx = side * (4 + r1 * 10);
      const vy = -3 - r2 * 9;
      const x = ox + vx * sa;
      const y = LX.yb - 4 + vy * sa + 0.45 * sa * sa;
      const a = 1 - sa / 24;
      sparks.push(<line key={i} x1={x} y1={y} x2={x - vx * 1.2} y2={y - (vy + 0.9 * sa) * 1.2} stroke={rgba(i % 3 === 0 ? ICE : i % 3 === 1 ? CYAN : AMBER, a)} strokeWidth={3 + r2 * 2} strokeLinecap="round" />);
    }
  }

  const layerDiv = (key: string, yb: number, dy: number, sx: number, sy: number, o: number, child: React.ReactNode) => (
    <div key={key} style={{ position: "absolute", left: 0, top: 0, width: SW, height: SH, opacity: o, transform: `translate(0px, ${dy.toFixed(2)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`, transformOrigin: `280px ${yb}px` }}>
      {child}
    </div>
  );

  // ── idle pulses core → devices ──
  const PER = 46;
  const phaseOf = (i: number) => (t - TD[i] - 12 + i * 15) % PER;
  const pulse = (i: number) => {
    if (!modeB || t < TD[i] + 12) return null;
    const u = phaseOf(i) / 22;
    if (u > 1) return null;
    const [x, y] = bez(...ctrl(i), EASE_IN_OUT(u));
    return <circle key={`p${i}`} cx={x} cy={y} r={7} fill="#EFFCFF" style={{ filter: "drop-shadow(0 0 8px rgba(34,211,238,0.95))" }} />;
  };
  const arrive = (i: number) => {
    if (!modeB || t < TD[i] + 12) return 0;
    const ph = phaseOf(i);
    return ph >= 22 ? decay(ph - 22, 6) : 0;
  };
  const bob = (i: number) => Math.sin(g * 0.07 + i * 1.9) * 5 * clamp01((t - TD[i] - 10) / 20);
  const slideIn = `translateX(${((1 - devIn) * 30).toFixed(1)}px)`;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: k !== 1 ? `scale(${k})` : undefined, transformOrigin: "0 0" }}>
      {/* floor light under the stack */}
      <div style={{ position: "absolute", left: 60 - 200 * mv, top: 470 - 40 * mv, width: 640 - 260 * mv, height: 260, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, (0.13 + 0.07 * bp) * hwO)}, rgba(34,211,238,0))` }} />

      {/* light lines core → devices */}
      {modeB ? (
        <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {[0, 1, 2].map((i) => {
            const [a, b, c, d] = ctrl(i);
            const dd = `M${a[0]} ${a[1]} C${b[0]} ${b[1]} ${c[0]} ${c[1]} ${d[0]} ${d[1]}`;
            const lp = lineP[i];
            if (lp <= 0) return null;
            const [hx, hy] = bez(a, b, c, d, lp);
            return (
              <g key={i}>
                <path d={dd} fill="none" stroke={rgba(CYAN, 0.25 + 0.2 * arrive(i))} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - lp} opacity={0.4} />
                <path d={dd} fill="none" stroke={rgba(CYAN, 0.85)} strokeWidth={3.5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - lp} />
                {lp < 1 ? <circle cx={hx} cy={hy} r={8} fill="#EFFCFF" style={{ filter: "drop-shadow(0 0 10px rgba(34,211,238,1))" }} /> : null}
              </g>
            );
          })}
          {[0, 1, 2].map(pulse)}
          {lineP[0] > 0 ? <circle cx={S.x} cy={S.y} r={9 + 3 * bp} fill="#EFFCFF" opacity={0.9} style={{ filter: "drop-shadow(0 0 10px rgba(34,211,238,1))" }} /> : null}
        </svg>
      ) : null}

      {/* ── the OS stack ── */}
      <div style={{ position: "absolute", left: ST.left, top: ST.top, width: SW, height: SH, transform: stackT, transformOrigin: "280px 210px" }}>
        {/* hardware */}
        {layerDiv(
          "hw",
          HW.yb,
          hwDy,
          1 + hwSq * 0.6,
          1 - hwSq,
          hwO,
          <>
            <svg width={SW} height={SH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <defs>
                <linearGradient id="lxHwF" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#16264A" />
                  <stop offset="1" stopColor="#0A1328" />
                </linearGradient>
                <linearGradient id="lxHwT" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0" stopColor="#1C3260" />
                  <stop offset="1" stopColor="#0E1A36" />
                </linearGradient>
              </defs>
              <path d={top(HW)} fill="url(#lxHwT)" stroke={rgba(CYAN, 0.4)} strokeWidth={2} strokeLinejoin="round" />
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const x = 70 + i * 74;
                return (
                  <g key={i}>
                    <rect x={x} y={HW.yb - HW.h - 18} width={40} height={12} rx={2} fill={rgba(CYAN, 0.28)} stroke={rgba(CYAN, 0.6)} strokeWidth={1.5} />
                    <line x1={x + 40} y1={HW.yb - HW.h - 12} x2={x + 74} y2={HW.yb - HW.h - 12} stroke={rgba(CYAN, 0.35)} strokeWidth={1.5} />
                  </g>
                );
              })}
              <path d={front(HW)} fill="url(#lxHwF)" stroke={rgba(CYAN, 0.55)} strokeWidth={2.5} strokeLinejoin="round" />
              <path d={`M${HW.xL} ${HW.yb - HW.h} H${HW.xR}`} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />
              {Array.from({ length: 10 }, (_, v) => (
                <line key={v} x1={330 + v * 13} y1={HW.yb - HW.h + 18} x2={330 + v * 13} y2={HW.yb - 18} stroke={rgba(CYAN, 0.3)} strokeWidth={4} strokeLinecap="round" />
              ))}
              {[0, 1].map((j) => {
                const on = rand(Math.floor(g / 9) * 5.3 + j * 2.1) > 0.35;
                return <circle key={j} cx={490 + j * 22} cy={HW.yb - HW.h / 2} r={5.5} fill={j ? (on ? "#67E8F9" : "rgba(103,232,249,0.25)") : on ? "#34D399" : "rgba(52,211,153,0.3)"} style={on ? { filter: `drop-shadow(0 0 6px ${j ? "rgba(34,211,238,0.9)" : "rgba(52,211,153,0.9)"})` } : undefined} />;
              })}
              {Array.from({ length: 22 }, (_, v) => (
                <rect key={v} x={44 + v * 22} y={HW.yb + 2} width={8} height={9} rx={1.5} fill={rgba(CYAN, 0.35)} />
              ))}
            </svg>
            <div style={{ position: "absolute", left: HW.xL + 34, top: HW.yb - HW.h, height: HW.h, display: "flex", alignItems: "center", fontFamily: fontMono, fontWeight: 700, fontSize: 27, color: "rgba(226,236,250,0.78)", opacity: textA, whiteSpace: "nowrap" }}>matériel</div>
          </>,
        )}

        {/* Linux layer */}
        {layerDiv(
          "lx",
          LX.yb,
          lxDy,
          1 + lxSq * 0.6,
          1 - lxSq,
          lxO,
          <>
            <svg width={SW} height={SH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <defs>
                <linearGradient id="lxF" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={rgba(CYAN, 0.42 + 0.15 * lxGlow)} />
                  <stop offset="1" stopColor={rgba(CYAN, 0.1)} />
                </linearGradient>
                <linearGradient id="lxT" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0" stopColor={rgba(CYAN, 0.6)} />
                  <stop offset="1" stopColor={rgba(CYAN, 0.24)} />
                </linearGradient>
                <linearGradient id="lxSw" gradientUnits="userSpaceOnUse" x1={(sweep ?? -999) - 90} y1={0} x2={(sweep ?? -999) + 90} y2={0}>
                  <stop offset="0" stopColor="rgba(255,255,255,0)" />
                  <stop offset="0.5" stopColor="rgba(255,255,255,0.4)" />
                  <stop offset="1" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
                <filter id="lxBl" x="-20%" y="-60%" width="140%" height="220%">
                  <feGaussianBlur stdDeviation="16" />
                </filter>
              </defs>
              <path d={front(LX)} fill={rgba(CYAN, 0.35 * lxGlow)} filter="url(#lxBl)" />
              <path d={top(LX)} fill="url(#lxT)" stroke={rgba(CYAN, 0.85)} strokeWidth={2.5} strokeLinejoin="round" />
              {[0.33, 0.66].map((f, i) => {
                const y = LX.yb - LX.h - LX.d * f;
                return <line key={i} x1={LX.xL + LX.ins * f} y1={y} x2={LX.xR - LX.ins * f} y2={y} stroke="rgba(255,255,255,0.18)" strokeWidth={1.5} />;
              })}
              {Array.from({ length: 7 }, (_, i) => {
                const f = (i + 1) / 8;
                const yt = LX.yb - LX.h;
                const xf = LX.xL + (LX.xR - LX.xL) * f;
                const xb = LX.xL + LX.ins + (LX.xR - LX.xL - 2 * LX.ins) * f;
                return <line key={`v${i}`} x1={xf} y1={yt} x2={xb} y2={yt - LX.d} stroke="rgba(255,255,255,0.14)" strokeWidth={1.5} />;
              })}
              <path d={front(LX)} fill="url(#lxF)" stroke={rimA > 0.02 ? `rgba(${Math.round(34 + (245 - 34) * rimA)},${Math.round(211 + (158 - 211) * rimA)},${Math.round(238 + (11 - 238) * rimA)},0.95)` : rgba(CYAN, 0.95)} strokeWidth={3 + 2 * rimA} strokeLinejoin="round" />
              {sweep !== null ? <path d={front(LX)} fill="url(#lxSw)" /> : null}
              <path d={`M${LX.xL} ${LX.yb - LX.h} H${LX.xR}`} stroke="rgba(255,255,255,0.7)" strokeWidth={2} />
              {lxFlash > 0.01 ? <path d={`${front(LX)} ${top(LX)}`} fill="#EFFCFF" opacity={Math.min(0.9, lxFlash)} /> : null}
              {sparks}
            </svg>
            {/* real Linux logo + « le système » (the logo slides to the centre and grows once shrunk) */}
            <div style={{ position: "absolute", left: 66 + (280 - 46 - 66) * mv, top: LX.yb - LX.h / 2 - 46, transform: `scale(${(1 + 0.25 * mv).toFixed(3)})`, transformOrigin: "46px 46px" }}>
              <Logo name="linux" size={92} draw={iv(p, [20, 40], [0, 1])} glow={lxGlow * 0.8} />
            </div>
            <div style={{ position: "absolute", left: 186, top: LX.yb - LX.h, height: LX.h, display: "flex", alignItems: "center", fontFamily: fontInter, fontWeight: 800, fontSize: 40, color: "#F8FAFC", letterSpacing: "-0.02em", opacity: labA * textA, textShadow: "0 0 18px rgba(34,211,238,0.6)", whiteSpace: "nowrap" }}>le système</div>
          </>,
        )}

        {/* app tiles */}
        {TILES.map((tl, i) => {
          const u = iv(p, [tl.at, tl.at + 10], [0, 1], EASE_IN);
          if (u <= 0) return null;
          const age = p - (tl.at + 10);
          const sq = squash(age, 0.12);
          const hover = Math.sin(g * 0.1 + i * 2.1) * 4 * idle1;
          const dy = -170 * (1 - u) + hover;
          return (
            <div key={tl.k} style={{ position: "absolute", left: tl.x - TS / 2, top: TILE_B - TS, width: TS, height: TS, opacity: iv(u, [0, 0.3], [0, 1]), transform: `translate(0px, ${dy.toFixed(2)}px) scale(${(1 + sq * 0.6).toFixed(3)}, ${(1 - sq).toFixed(3)})`, transformOrigin: "50% 100%" }}>
              <div style={{ ...glass("34,211,238", 0.7 + 0.5 * decay(age, 8)), width: TS, height: TS, borderRadius: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TileIcon k={tl.k} />
              </div>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 0, width: SW, top: 30, display: "flex", justifyContent: "center", opacity: iv(p, [50, 60], [0, 1]) * textA }}>
          <div style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 27, color: "rgba(226,236,250,0.85)", transform: `translateY(${(iv(p, [50, 60], [12, 0], EASE_OUT) + Math.sin(g * 0.1) * 2 * idle1).toFixed(1)}px)`, whiteSpace: "nowrap" }}>applis</div>
        </div>
      </div>

      {/* ── devices (B) ── */}
      {modeB && devIn > 0.01 ? (
        <>
          {/* rack */}
          <div style={{ position: "absolute", left: RACK.x - RACK.w / 2, top: RACK.y - RACK.h / 2 + bob(0), width: RACK.w, height: RACK.h, opacity: devIn, transform: slideIn }}>
            <div style={{ ...glass("34,211,238", 0.3 + 0.7 * lit[0]), position: "absolute", inset: 0, borderRadius: 22 }} />
            {[0, 1, 2].map((u) => {
              const Tu = TD[0] + u * 5;
              const l = iv(t, [Tu, Tu + 6], [0, 1], EASE_OUT);
              return (
                <div key={u} style={{ position: "absolute", left: 12, top: 14 + u * 58 }}>
                  <RackUnit g={g} i={u} lit={l} logoD={iv(t, [Tu, Tu + 14], [0, 1])} flash={decay(t - Tu, 5) + 0.5 * arrive(0)} />
                </div>
              );
            })}
          </div>

          {/* cloud */}
          <div style={{ position: "absolute", left: CLOUD.x - CLOUD.w / 2, top: CLOUD.y - CLOUD.h / 2 + bob(1), width: CLOUD.w, height: CLOUD.h, opacity: devIn, transform: slideIn }}>
            <svg width={CLOUD.w} height={CLOUD.h} viewBox="0 0 236 144" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <defs>
                <linearGradient id="lxCl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={rgba(CYAN, 0.08 + 0.4 * lit[1])} />
                  <stop offset="1" stopColor={rgba(CYAN, 0.03 + 0.12 * lit[1])} />
                </linearGradient>
                <filter id="lxClB" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="14" />
                </filter>
              </defs>
              {lit[1] > 0.01 ? <path d={CLOUD_D} fill={rgba(CYAN, 0.4 * lit[1] + 0.2 * arrive(1))} filter="url(#lxClB)" /> : null}
              <path d={CLOUD_D} fill="url(#lxCl)" stroke={rgba(CYAN, 0.25 + 0.7 * lit[1])} strokeWidth={3.5} strokeLinejoin="round" />
              <path d="M40 74 C46 64 56 60 66 62" fill="none" stroke={`rgba(255,255,255,${(0.15 + 0.4 * lit[1]).toFixed(2)})`} strokeWidth={3} strokeLinecap="round" />
              {devFlash[1] > 0.01 ? <path d={CLOUD_D} fill="#EFFCFF" opacity={Math.min(0.85, devFlash[1])} /> : null}
            </svg>
            {lit[1] > 0.01 ? (
              <div style={{ position: "absolute", left: CLOUD.w / 2 - 30, top: 52 }}>
                <Logo name="linux" size={66} draw={iv(t, [TD[1], TD[1] + 14], [0, 1])} glow={0.5} />
              </div>
            ) : null}
          </div>

          {/* phone */}
          <div style={{ position: "absolute", left: PHONE.x - PHONE.w / 2, top: PHONE.y - PHONE.h / 2 + bob(2), width: PHONE.w, height: PHONE.h, opacity: devIn, transform: slideIn }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 26, background: "linear-gradient(160deg, #1A2A4C, #0A1328)", border: `3px solid ${rgba(CYAN, 0.25 + 0.7 * lit[2])}`, boxShadow: `0 16px 34px rgba(0,0,0,0.5), 0 0 ${(40 * lit[2]).toFixed(0)}px ${rgba(CYAN, 0.35 * lit[2] + 0.2 * arrive(2))}` }} />
            <div style={{ position: "absolute", left: 9, top: 22, right: 9, bottom: 18, borderRadius: 14, background: `radial-gradient(90% 70% at 50% 40%, ${rgba(CYAN, 0.04 + 0.3 * lit[2])}, rgba(5,12,26,0.95))`, overflow: "hidden" }}>
              {devFlash[2] > 0.01 ? <div style={{ position: "absolute", inset: 0, background: "#EFFCFF", opacity: Math.min(0.85, devFlash[2]) }} /> : null}
            </div>
            <div style={{ position: "absolute", left: PHONE.w / 2 - 6, top: 9, width: 12, height: 6, borderRadius: 3, background: rgba(CYAN, 0.3 + 0.4 * lit[2]) }} />
            {lit[2] > 0.01 ? (
              <>
                <div style={{ position: "absolute", left: PHONE.w / 2 - 31, top: 40, transform: `translateY(${((1 - iv(t, [TD[2] + 2, TD[2] + 14], [0, 1], EASE_OUT)) * 24 - 3 * Math.abs(Math.sin(g * 0.12)) * clamp01((t - TD[2] - 16) / 10)).toFixed(1)}px) scale(${iv(t, [TD[2] + 2, TD[2] + 14], [0.4, 1], EASE_OUT).toFixed(3)})`, opacity: iv(t, [TD[2] + 2, TD[2] + 6], [0, 1]), transformOrigin: "50% 100%" }}>
                  <Robot s={0.88} />
                </div>
                {/* the robot stands on a tiny Linux slab */}
                <div style={{ position: "absolute", left: 16, right: 16, top: 118, height: 14, borderRadius: 4, background: rgba(CYAN, 0.5), boxShadow: `0 0 14px ${rgba(CYAN, 0.7)}`, opacity: lit[2] }} />
                <div style={{ position: "absolute", left: PHONE.w / 2 - 19, top: 140 }}>
                  <Logo name="linux" size={38} draw={iv(t, [TD[2] + 4, TD[2] + 18], [0, 1])} glow={0.45} />
                </div>
              </>
            ) : null}
          </div>

          {[RACK, CLOUD, PHONE].map((d, i) => (
            <Shockwave key={i} age={t - TD[i]} x={d.x} y={d.y} dur={20} maxR={170} r0={50} strength={0.7} />
          ))}

          {/* « partout » */}
          {t >= TD[2] + 10 ? (
            <div style={{ position: "absolute", left: 180, top: 560, width: 0, display: "flex", justifyContent: "center", opacity: iv(t, [TD[2] + 10, TD[2] + 22], [0, 1]), transform: `translateY(${iv(t, [TD[2] + 10, TD[2] + 22], [16, 0], EASE_OUT).toFixed(1)}px)` }}>
              <div style={{ ...glass("34,211,238", 0.6), borderRadius: 999, padding: "10px 24px 10px 18px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, whiteSpace: "nowrap" }}>
                <div style={{ width: 13, height: 13, borderRadius: "50%", background: rgba(AMBER, 1), boxShadow: `0 0 ${(8 + 8 * breathe).toFixed(1)}px rgba(245,158,11,0.8)` }} />
                <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 30, color: "#F8FAFC", letterSpacing: "-0.01em" }}>partout</span>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <Shockwave age={lxAge / TS_} x={ST.left + 280} y={ST.top + LX.yb - LX.h / 2} dur={24} maxR={480} r0={100} strength={0.75 * (1 - mv)} />
      <AnamorphicFlare age={lxAge / TS_} x={ST.left + 280} y={ST.top + LX.yb - LX.h} col={AMBER} dur={28} size={130} streakH={80} strength={0.7} />
    </div>
  );
};
