import React from "react";
import { Logo } from "../kit/Logo";
import { fontInter, fontMono } from "../kit/fonts";
import { glass } from "../lib/look";
import { beatPulse, rand } from "../lib/sync";
import { AMBER, AMBER_HOT, AnamorphicFlare, clamp01, CYAN, decay, EASE_IN, EASE_IN_OUT, EASE_OUT, ICE, iv, rgba, Shockwave, type RGB } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/* ───────────────────────── L'automatisation: « ce qui se répète, une machine le fait » ───────────────────────── */
/*
 * t = g - f0
 * 0–40    a glass avatar at a desk presses the big amber button by hand: contacts at 10, 24, 38. Each press: the dome
 *         squashes, a ripple, the counter pops ×1 ×2 ×3, the stop-and-go conveyor advances one slot and the SAME card
 *         « déployer » jumps out of the button onto the belt. A sweat drop runs down his head from press 2.
 * 28–52   a rail draws across the top, the machine (cyan glass carriage + DevOps loop + a 2-segment arm with gears)
 *         slides in along it (overshoot) while the arm unfolds; 44–54 the avatar's hand leaves the button.
 * 58      TAKEOVER: the arm's piston hits the button — flash, amber flare, shockwave, sparks — and starts pumping,
 *         faster and faster (9 → 4.5 frames a press, ghosted). The counter spins ×10 (≈75) ×50 (≈101) ×100 (120), the belt
 *         zips identical « déployer » cards out, each landing with a green ✓. An « auto » chip lights on the machine.
 * 60–80   the avatar leans back in his chair, a coffee mug pops into his hand, eyes close, smile, steam.
 * idle    the machine keeps pumping, gears spin, the counter keeps rising, cards keep flying, light runs on the rail,
 *         the avatar breathes and sips his coffee.
 */

const W = 760;
const DESK = 466; // desk top surface
const BX = 300; // button centre x
const DOME_Y = 452; // dome base line (top of the base plate)
const DOME_RX = 40;
const DOME_RY = 25;
const BELT = { x0: 352, x1: 750, y: 450, h: 16 };
const SLOT = 125; // conveyor advance per press
const CARD = { w: 116, h: 72 };
const CARD_CY = BELT.y - 1 - CARD.h / 2; // card centre when resting on the belt
const PRESS = [10, 24, 38]; // manual contacts
const TAKE = 58; // the machine's first contact
const PIVOT = { x: 165, y: 470 }; // avatar hip (lean pivot)
const NECK = { x: 165, y: 330 };
const SHOULDER = { x: 206, y: 362 };
const RAIL_Y = 40;
const CAR_X = 548; // carriage rest x
const L1 = 212;
const L2 = 196;
const PISTON = 48;
const DY = 44; // the whole scene sits a bit lower in the stage (the desk front fades out at the bottom)

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const rotPt = (x: number, y: number, deg: number, cx: number, cy: number) => {
  const a = (deg * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  return { x: cx + dx * Math.cos(a) - dy * Math.sin(a), y: cy + dx * Math.sin(a) + dy * Math.cos(a) };
};
/** 2-bone IK: elbow + (clamped) wrist; side picks the elbow solution */
const ik = (sx: number, sy: number, tx: number, ty: number, l1: number, l2: number, side: number) => {
  const dx = tx - sx;
  const dy = ty - sy;
  const D = Math.min(l1 + l2 - 0.5, Math.max(Math.abs(l1 - l2) + 0.5, Math.hypot(dx, dy)));
  const a = Math.atan2(dy, dx);
  const B = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + D * D - l2 * l2) / (2 * l1 * D))));
  const e = a - side * B;
  return { ex: sx + l1 * Math.cos(e), ey: sy + l1 * Math.sin(e), wx: sx + D * Math.cos(a), wy: sy + D * Math.sin(a) };
};
const gearPath = (R: number, r: number, n: number) => {
  const pts: string[] = [];
  const per = (2 * Math.PI) / n;
  const p = (rr: number, aa: number) => `${(rr * Math.cos(aa)).toFixed(2)} ${(rr * Math.sin(aa)).toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const a = i * per;
    pts.push(p(r, a - per * 0.3), p(R, a - per * 0.17), p(R, a + per * 0.17), p(r, a + per * 0.3));
  }
  return `M${pts.join(" L")} Z`;
};
const GEAR_L = gearPath(34, 26, 10);
const GEAR_M = gearPath(26, 19, 8);
const GEAR_S = gearPath(19, 14, 7);

/** manual press envelope (0 hover → 1 contact), down 5 f, up 9 f */
const pressEnv = (t: number, p: number) => (t < p - 5 || t > p + 9 ? 0 : t < p ? EASE_IN(clamp01((t - (p - 5)) / 5)) : 1 - EASE_OUT(clamp01((t - p) / 9)));

/** machine press phase (cycles since TAKE): rate ramps 1/9 → 1/4.5 over 22 frames */
const RA = 1 / 9;
const RB = 1 / 4.5;
const RAMP = 22;
const machinePhase = (t: number) => {
  const s = t - TAKE;
  if (s <= 0) return 0;
  const b = (RB - RA) / RAMP;
  if (s <= RAMP) return RA * s + (b * s * s) / 2;
  return RA * RAMP + (b * RAMP * RAMP) / 2 + RB * (s - RAMP);
};

/** conveyor offset (px): one eased slot per manual press, then a ramp to 17 px/f */
const VMAX = 17;
const VRAMP = 16;
const beltOffset = (t: number) => {
  let o = 0;
  for (const p of PRESS) o += SLOT * EASE_OUT(clamp01((t - p) / 12));
  const s = t - TAKE;
  if (s > 0) o += s <= VRAMP ? (VMAX * s * s) / (2 * VRAMP) : (VMAX * VRAMP) / 2 + VMAX * (s - VRAMP);
  return o;
};

/** the counter */
const countAt = (t: number) => {
  if (t < TAKE) return PRESS.filter((p) => t >= p).length;
  const s = t - TAKE;
  if (s <= 62) return 3 + Math.floor(97 * Math.pow(s / 62, 2));
  return 100 + Math.floor((s - 62) * 2.3);
};
const MILESTONES = [75, 101, TAKE + 62]; // ≈ ×10, ×50, ×100

/* ───────────────────────── pieces ───────────────────────── */

const TaskCard: React.FC<{ check: number; glow: number }> = ({ check, glow }) => (
  <div style={{ ...glass("34,211,238", 0.6 + glow), width: CARD.w, height: CARD.h, borderRadius: 18, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, position: "relative" }}>
    <svg width={40} height={18} viewBox="0 0 40 18" style={{ overflow: "visible" }}>
      <path d="M4 9 H30 M22 2 L31 9 L22 16" fill="none" stroke="#67E8F9" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 5px rgba(34,211,238,0.7))" }} />
    </svg>
    <div style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 19, color: "rgba(240,250,255,0.95)", letterSpacing: "-0.02em" }}>déployer</div>
    {check > 0.01 ? (
      <div style={{ position: "absolute", right: -12, top: -12, width: 32, height: 32, borderRadius: "50%", background: "#34D399", boxShadow: `0 0 ${(10 + 14 * check).toFixed(0)}px rgba(52,211,153,0.75)`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${check.toFixed(3)})` }}>
        <svg width={18} height={18} viewBox="0 0 18 18">
          <path d="M3.5 9.5 L7.5 13 L14.5 5" fill="none" stroke="#04210F" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ) : null}
  </div>
);

/** a thick glass limb (rounded bar) between two points */
const Limb: React.FC<{ x1: number; y1: number; x2: number; y2: number; w: number; tint?: RGB; a?: number }> = ({ x1, y1, x2, y2, w, tint = CYAN, a = 1 }) => (
  <g opacity={a}>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={rgba(tint, 0.9)} strokeWidth={w + 5} strokeLinecap="round" />
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0A1B33" strokeWidth={w} strokeLinecap="round" />
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={rgba(tint, 0.3)} strokeWidth={w} strokeLinecap="round" />
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.28)" strokeWidth={w * 0.18} strokeLinecap="round" transform={`translate(${(-w * 0.18).toFixed(1)} ${(-w * 0.18).toFixed(1)})`} />
  </g>
);

const Gear: React.FC<{ d: string; x: number; y: number; rot: number; hub: number; glow: number }> = ({ d, x, y, rot, hub, glow }) => (
  <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}>
    <circle r={hub * 2.6} fill={rgba(CYAN, 0.12 + 0.18 * glow)} />
    <path d={d} transform={`rotate(${rot.toFixed(2)})`} fill="rgba(12,34,60,0.92)" stroke={rgba(CYAN, 0.95)} strokeWidth={3} strokeLinejoin="round" />
    <path d={d} transform={`rotate(${rot.toFixed(2)})`} fill={rgba(CYAN, 0.22)} />
    <circle r={hub} fill="#0A1B33" stroke={rgba(ICE, 0.9)} strokeWidth={2.5} />
    <circle r={hub * 0.38} fill={rgba(ICE, 0.95)} />
  </g>
);

/* ───────────────────────── the scene ───────────────────────── */

export const AutomationFx: ToolFx = ({ g, f0, size, logo }) => {
  const t = g - f0;
  const k = size / W;
  const bp = beatPulse(g, 14);
  const enter = iv(t, [0, 12], [0, 1], EASE_OUT);

  // ── manual phase ──
  const pd = PRESS.reduce((m, p) => Math.max(m, pressEnv(t, p)), 0);
  const handOff = iv(t, [44, 56], [0, 1], EASE_IN_OUT); // hand leaves the button
  const relax = iv(t, [60, 80], [0, 1], EASE_IN_OUT); // lean back
  const takeA = t - TAKE;

  // ── machine ──
  const railP = iv(t, [28, 42], [0, 1], EASE_OUT);
  const carU = clamp01((t - 34) / 18);
  const carBack = carU >= 1 ? 1 : 1 + 2.4 * Math.pow(carU - 1, 3) + 1.4 * Math.pow(carU - 1, 2); // back-out
  const carX = lerp(CAR_X + 300, CAR_X, carBack);
  const carO = iv(t, [34, 42], [0, 1]);
  const phase = machinePhase(t);
  const pump = t >= TAKE ? 0.5 + 0.5 * Math.cos(2 * Math.PI * phase) : 0; // 1 = contact
  const fast = iv(t, [TAKE + 6, TAKE + 22], [0, 1]);
  const domeTop = (sq: number) => DOME_Y - DOME_RY * (1 - 0.48 * sq);
  const padUp = DOME_Y - DOME_RY - 58;
  const padDown = domeTop(1);
  let padY: number;
  let padX = BX;
  if (t < 46) {
    // folded under the carriage
    padX = carX - 70;
    padY = 250;
  } else if (t < 54) {
    const u = EASE_IN_OUT(clamp01((t - 46) / 8));
    padX = lerp(carX - 70, BX, u);
    padY = lerp(250, padUp, u);
  } else if (t < TAKE) {
    padY = lerp(padUp, padDown, EASE_IN(clamp01((t - 54) / 4)));
  } else {
    padY = lerp(padUp + 22 * fast, padDown, pump);
  }
  const sh = { x: carX, y: RAIL_Y + 68 };
  const arm = ik(sh.x, sh.y, padX, padY - PISTON, L1, L2, 1);
  const squash = t < TAKE ? Math.max(pd, t >= 54 ? EASE_IN(clamp01((t - 54) / 4)) : 0) : pump;
  const gearRot = g * 2.2 + phase * 70;

  // ── counter ──
  const count = countAt(t);
  const manualPop = PRESS.reduce((m, p) => Math.max(m, decay(t - p, 6)), 0);
  const milePop = MILESTONES.reduce((m, f) => Math.max(m, decay(t - f, 7)), 0);
  const cPop = 1 + 0.16 * manualPop + 0.2 * milePop + 0.2 * decay(takeA, 6);
  const spinBlur = t >= TAKE ? 0.4 + 1.2 * fast : 0;
  const hot = Math.max(milePop, decay(takeA, 10));

  // ── avatar pose ──
  const lean = lerp(3 + 4 * pd, -13, relax);
  const headTilt = lerp(4 + 5 * pd + 3 * clamp01((t - 24) / 14), -8, relax);
  const handWorld = { x: BX, y: lerp(DOME_Y - DOME_RY - 26, domeTop(1) - 14, pd) };
  const handPressLocal = rotPt(handWorld.x, handWorld.y, -lean, PIVOT.x, PIVOT.y);
  const sipU = t > 120 ? Math.pow(Math.max(0, Math.sin(((t - 120) / 110) * Math.PI * 2)), 6) : 0;
  const handRelax = { x: 228 - 14 * sipU, y: 384 - 44 * sipU };
  const hand = { x: lerp(handPressLocal.x, handRelax.x, handOff), y: lerp(handPressLocal.y, handRelax.y, handOff) };
  const elA = ik(SHOULDER.x, SHOULDER.y, hand.x, hand.y, 64, 66, 1);
  const elB = ik(SHOULDER.x, SHOULDER.y, hand.x, hand.y, 64, 66, -1);
  const el = elA.ey > elB.ey ? elA : elB;
  const cupA = iv(t, [60, 70], [0, 1], EASE_OUT);
  const cupS = t >= 60 ? 1 + 0.25 * Math.sin(clamp01((t - 60) / 12) * Math.PI) : 0;
  const breathe = Math.sin(g * 0.08) * 2.2 * (0.4 + relax);
  const strained = 1 - iv(t, [58, 70], [0, 1]);

  // sweat drops (head-local), fade when relaxed
  const drops = [
    { s: 22, x: 207, y0: 252 },
    { s: 36, x: 200, y0: 238 },
  ];

  // ── belt cards ──
  const off = beltOffset(t);
  const cards: React.ReactNode[] = [];
  const kMax = Math.floor(off / SLOT);
  for (let i = kMax; i >= Math.max(0, kMax - 6); i--) {
    const u = off - i * SLOT;
    if (u <= 0) continue;
    const x = BX + u;
    if (x > W + 80) continue;
    const e = clamp01(u / SLOT);
    const arc = Math.sin(e * Math.PI) * lerp(78, 46, fast);
    const sc = Math.min(1, e * 1.7);
    const cy = CARD_CY - arc;
    const o = Math.min(1, e * 3) * iv(x, [640, 745], [1, 0]);
    const check = iv(u, [SLOT * 0.92, SLOT * 1.18], [0, 1], EASE_OUT) * (u < SLOT * 1.18 ? 1 + 0.25 * Math.sin(clamp01((u - SLOT * 0.92) / (SLOT * 0.26)) * Math.PI) : 1);
    const rot = (1 - e) * -14;
    cards.push(
      <div key={i} style={{ position: "absolute", left: x - CARD.w / 2, top: cy - CARD.h / 2, width: CARD.w, height: CARD.h, opacity: o, transform: `rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`, filter: fast > 0.5 && e < 1 ? `blur(${(1.2 * fast).toFixed(2)}px)` : undefined }}>
        <TaskCard check={check} glow={0.25 * decay(u - SLOT, 20)} />
      </div>,
    );
  }

  // ── sparks at the takeover ──
  const sparks: React.ReactNode[] = [];
  if (takeA >= 0 && takeA < 26) {
    for (let i = 0; i < 18; i++) {
      const r1 = rand(71 + i * 7.1);
      const r2 = rand(71 + i * 3.3 + 1);
      const r3 = rand(71 + i * 5.7 + 2);
      const vx = (r1 - 0.5) * 18;
      const vy = -5 - r2 * 10;
      const x = BX + vx * takeA;
      const y = padDown + vy * takeA + 0.45 * takeA * takeA;
      const a = 1 - takeA / 26;
      const len = 3 + r3 * 4;
      sparks.push(<line key={i} x1={x} y1={y} x2={x - vx * len * 0.25} y2={y - (vy + 0.9 * takeA) * len * 0.25} stroke={rgba(i % 3 === 0 ? ICE : i % 3 === 1 ? AMBER_HOT : CYAN, a)} strokeWidth={3 + r2 * 2.5} strokeLinecap="round" />);
    }
  }
  const hitFlash = t >= TAKE ? Math.pow(pump, 6) : 0;
  const domeGlow = 0.35 + 0.4 * squash + 0.3 * bp + 0.8 * decay(takeA, 10);
  const dRy = DOME_RY * (1 - 0.48 * squash);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: W, transform: k !== 1 ? `scale(${k})` : undefined, transformOrigin: "0 0", opacity: enter }}>
      <div style={{ position: "absolute", left: 0, top: DY, width: W, height: W }}>
      {/* floor / desk light */}
      <div style={{ position: "absolute", left: 20, top: 360, width: 720, height: 330, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, 0.13 + 0.05 * bp)}, rgba(34,211,238,0))` }} />
      <div style={{ position: "absolute", left: BX - 130, top: DOME_Y - 130, width: 260, height: 260, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(AMBER, 0.12 + 0.18 * domeGlow)}, rgba(245,158,11,0))` }} />

      {/* the counter */}
      <div style={{ position: "absolute", left: 40, top: 34, width: 300, height: 124, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${cPop.toFixed(3)})`, transformOrigin: "50% 50%" }}>
        <div style={{ ...glass(hot > 0.05 ? "245,158,11" : "34,211,238", 0.8 + 0.8 * hot), width: 300, height: 124, borderRadius: 30, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, overflow: "hidden", position: "relative" }}>
          <span style={{ fontFamily: fontMono, fontWeight: 800, fontSize: 70, color: "#F59E0B", textShadow: "0 0 22px rgba(245,158,11,0.7)", lineHeight: 1 }}>×</span>
          <span style={{ fontFamily: fontMono, fontWeight: 800, fontSize: 88, color: "#F8FAFC", letterSpacing: "-0.04em", lineHeight: 1, textShadow: `0 0 ${(14 + 26 * hot).toFixed(0)}px rgba(${hot > 0.05 ? "245,158,11" : "34,211,238"},${(0.45 + 0.4 * hot).toFixed(2)})`, filter: spinBlur > 0.01 ? `blur(${(spinBlur * (0.5 + 0.5 * Math.abs(Math.sin(g * 1.7)))).toFixed(2)}px)` : undefined, opacity: count === 0 ? 0.35 : 1 }}>
            {count}
          </span>
          {t >= TAKE ? (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 5, background: `linear-gradient(90deg, rgba(34,211,238,0), ${rgba(CYAN, 0.9)}, rgba(34,211,238,0))`, transform: `translateX(${((((t - TAKE) * 22) % 600) - 300).toFixed(0)}px)` }} />
          ) : null}
        </div>
      </div>

      {/* avatar + desk + belt + button */}
      <svg width={W} height={W} viewBox={`0 0 ${W} ${W}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="auBody" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor={rgba(CYAN, 0.46)} />
            <stop offset="1" stopColor={rgba(CYAN, 0.1)} />
          </linearGradient>
          <radialGradient id="auHead" cx="0.38" cy="0.32" r="0.75">
            <stop offset="0" stopColor={rgba(ICE, 0.55)} />
            <stop offset="0.55" stopColor={rgba(CYAN, 0.26)} />
            <stop offset="1" stopColor={rgba(CYAN, 0.08)} />
          </radialGradient>
          <linearGradient id="auDesk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={rgba(CYAN, 0.34)} />
            <stop offset="1" stopColor={rgba(CYAN, 0.08)} />
          </linearGradient>
          <linearGradient id="auFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={rgba(CYAN, 0.16)} />
            <stop offset="1" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
          <radialGradient id="auDome" cx="0.4" cy="0.25" r="0.9">
            <stop offset="0" stopColor="#FFE2A8" />
            <stop offset="0.35" stopColor={rgba(AMBER_HOT, 1)} />
            <stop offset="1" stopColor="#B45309" />
          </radialGradient>
        </defs>

        {/* the avatar (leans around the hip) */}
        <g transform={`translate(0 ${breathe.toFixed(2)}) rotate(${lean.toFixed(2)} ${PIVOT.x} ${PIVOT.y})`}>
          {/* chair back */}
          <rect x={84} y={300} width={150} height={190} rx={34} fill="rgba(10,24,46,0.85)" stroke={rgba(CYAN, 0.35)} strokeWidth={3} />
          <rect x={96} y={312} width={126} height={40} rx={20} fill={rgba(CYAN, 0.08)} />
          {/* torso */}
          <path d="M100 490 C98 400 118 344 165 344 C212 344 232 400 230 490 Z" fill="#0A1B33" />
          <path d="M100 490 C98 400 118 344 165 344 C212 344 232 400 230 490 Z" fill="url(#auBody)" stroke={rgba(CYAN, 0.9)} strokeWidth={3.2} strokeLinejoin="round" />
          <path d="M124 372 C134 356 150 352 162 352" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={3.5} strokeLinecap="round" />
          {/* head */}
          <g transform={`rotate(${headTilt.toFixed(2)} ${NECK.x} ${NECK.y})`}>
            <circle cx={165} cy={282} r={48} fill="#0A1B33" />
            <circle cx={165} cy={282} r={48} fill="url(#auHead)" stroke={rgba(CYAN, 0.95)} strokeWidth={3.2} />
            <path d="M136 260 A36 36 0 0 1 160 244" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={4} strokeLinecap="round" />
            {/* strained face */}
            <g opacity={strained}>
              <path d={`M158 ${274 + 2 * pd} L170 277`} stroke="#F0FAFF" strokeWidth={4.5} strokeLinecap="round" />
              <path d={`M200 ${274 + 2 * pd} L188 277`} stroke="#F0FAFF" strokeWidth={4.5} strokeLinecap="round" />
              <path d="M170 303 Q176 299 182 303 Q188 307 194 303" fill="none" stroke="#F0FAFF" strokeWidth={4} strokeLinecap="round" />
            </g>
            {/* relaxed face */}
            <g opacity={1 - strained}>
              <path d="M156 279 Q163 272 170 279" fill="none" stroke="#F0FAFF" strokeWidth={4.5} strokeLinecap="round" />
              <path d="M186 279 Q193 272 200 279" fill="none" stroke="#F0FAFF" strokeWidth={4.5} strokeLinecap="round" />
              <path d="M168 298 Q180 310 194 298" fill="none" stroke="#F0FAFF" strokeWidth={4.5} strokeLinecap="round" />
            </g>
            {/* sweat */}
            {drops.map((d, i) => {
              const a = t - d.s;
              if (a < 0) return null;
              const o = iv(a, [0, 5], [0, 1]) * (1 - relax) * iv(a, [30, 40], [1, 0]);
              if (o < 0.01) return null;
              const y = d.y0 + 30 * EASE_IN(clamp01(a / 34));
              const s = iv(a, [0, 8], [0.4, 1], EASE_OUT);
              return (
                <g key={i} transform={`translate(${d.x} ${y.toFixed(1)}) scale(${s.toFixed(3)})`} opacity={o}>
                  <path d="M0 -15 C6 -6 10 0 10 5 A10 10 0 0 1 -10 5 C-10 0 -6 -6 0 -15 Z" fill={rgba(ICE, 0.75)} stroke="#E0FAFF" strokeWidth={2} />
                  <circle cx={-3} cy={4} r={2.5} fill="#FFFFFF" />
                </g>
              );
            })}
          </g>
          {/* coffee mug (relaxed) */}
          {cupA > 0.01 ? (
            <g transform={`translate(${(hand.x + 8).toFixed(1)} ${(hand.y - 14).toFixed(1)}) scale(${(cupA * cupS).toFixed(3)})`} opacity={cupA}>
              <path d="M30 -10 C46 -10 46 14 30 14" fill="none" stroke={rgba(ICE, 0.9)} strokeWidth={5} />
              <rect x={-6} y={-26} width={38} height={46} rx={9} fill="#0A1B33" stroke={rgba(ICE, 0.95)} strokeWidth={3} />
              <rect x={-6} y={-26} width={38} height={46} rx={9} fill={rgba(AMBER, 0.28)} />
              <rect x={-2} y={-22} width={30} height={7} rx={3.5} fill={rgba(AMBER_HOT, 0.8)} />
              {[0, 1, 2].map((j) => {
                const ph = (((t * 0.02 + j / 3) % 1) + 1) % 1;
                const sx = 6 + j * 9;
                const sy = -30 - ph * 46;
                const wob = Math.sin(t * 0.12 + j * 2) * 6;
                return <path key={j} d={`M${sx} ${sy + 16} Q${sx + wob} ${sy + 8} ${sx} ${sy} T${sx} ${sy - 16}`} fill="none" stroke={rgba(ICE, 0.55 * Math.sin(ph * Math.PI) * relax)} strokeWidth={3.5} strokeLinecap="round" />;
              })}
            </g>
          ) : null}
          {/* arm */}
          <Limb x1={SHOULDER.x} y1={SHOULDER.y} x2={el.ex} y2={el.ey} w={22} />
          <Limb x1={el.ex} y1={el.ey} x2={hand.x} y2={hand.y} w={20} />
          <circle cx={hand.x} cy={hand.y} r={15} fill="#0A1B33" stroke={rgba(CYAN, 0.95)} strokeWidth={3} />
          <circle cx={hand.x} cy={hand.y} r={15} fill={rgba(ICE, 0.3)} />
        </g>

        {/* desk */}
        <rect x={28} y={DESK} width={724} height={24} rx={9} fill="#0A1B33" />
        <rect x={28} y={DESK} width={724} height={24} rx={9} fill="url(#auDesk)" stroke={rgba(CYAN, 0.75)} strokeWidth={2.5} />
        <line x1={40} y1={DESK + 1.5} x2={740} y2={DESK + 1.5} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
        <rect x={52} y={DESK + 24} width={676} height={150} fill="url(#auFront)" />
        <line x1={70} y1={DESK + 24} x2={70} y2={DESK + 150} stroke={rgba(CYAN, 0.18)} strokeWidth={3} />
        <line x1={710} y1={DESK + 24} x2={710} y2={DESK + 150} stroke={rgba(CYAN, 0.18)} strokeWidth={3} />

        {/* conveyor */}
        <rect x={BELT.x0} y={BELT.y} width={BELT.x1 - BELT.x0} height={BELT.h} rx={8} fill="#06111F" stroke={rgba(CYAN, 0.6)} strokeWidth={2.5} />
        {Array.from({ length: 14 }, (_, i) => {
          const L = BELT.x1 - BELT.x0 - 16;
          const x = BELT.x0 + 8 + ((((i * L) / 14 + off * 0.9) % L) + L) % L;
          return <line key={i} x1={x} y1={BELT.y + 4} x2={x - 6} y2={BELT.y + BELT.h - 4} stroke={rgba(CYAN, 0.45)} strokeWidth={2.5} strokeLinecap="round" />;
        })}
        {t >= TAKE ? <rect x={BELT.x0} y={BELT.y} width={BELT.x1 - BELT.x0} height={BELT.h} rx={8} fill={rgba(CYAN, 0.12 * fast + 0.06 * bp)} /> : null}

        {/* the big button */}
        {PRESS.map((p, i) => {
          const a = t - p;
          if (a < 0 || a > 18) return null;
          const r = iv(a, [0, 18], [40, 110], EASE_OUT);
          return <ellipse key={i} cx={BX} cy={DOME_Y} rx={r} ry={r * 0.32} fill="none" stroke={rgba(CYAN, 0.8 * (1 - a / 18))} strokeWidth={3} />;
        })}
        <path d={`M${BX - DOME_RX} ${DOME_Y} A${DOME_RX} ${dRy.toFixed(2)} 0 0 1 ${BX + DOME_RX} ${DOME_Y} Z`} fill="url(#auDome)" stroke="#FFD58A" strokeWidth={2} style={{ filter: `drop-shadow(0 0 ${(8 + 14 * domeGlow).toFixed(0)}px rgba(245,158,11,${(0.45 + 0.35 * Math.min(1, domeGlow)).toFixed(2)}))` }} />
        <path d={`M${BX - 22} ${(DOME_Y - dRy * 0.48).toFixed(2)} Q${BX - 10} ${(DOME_Y - dRy * 0.84).toFixed(2)} ${BX + 6} ${(DOME_Y - dRy * 0.84).toFixed(2)}`} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={3.5} strokeLinecap="round" />
        {hitFlash > 0.02 ? <path d={`M${BX - DOME_RX} ${DOME_Y} A${DOME_RX} ${dRy.toFixed(2)} 0 0 1 ${BX + DOME_RX} ${DOME_Y} Z`} fill="#FFF6E0" opacity={0.55 * hitFlash} /> : null}
        <rect x={BX - 52} y={DOME_Y} width={104} height={DESK - DOME_Y} rx={6} fill="#0A1B33" stroke={rgba(CYAN, 0.8)} strokeWidth={2.5} />
        <rect x={BX - 44} y={DOME_Y + 4} width={88} height={3} rx={1.5} fill="rgba(255,255,255,0.35)" />
      </svg>

      {/* the repeated task cards */}
      {cards}

      {/* the machine */}
      <svg width={W} height={W} viewBox={`0 0 ${W} ${W}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* rail */}
        {railP > 0.01 ? (
          <g>
            <line x1={750 - 370 * railP} y1={RAIL_Y} x2={750} y2={RAIL_Y} stroke={rgba(CYAN, 0.3)} strokeWidth={14} strokeLinecap="round" />
            <line x1={750 - 370 * railP} y1={RAIL_Y} x2={750} y2={RAIL_Y} stroke={rgba(CYAN, 0.95)} strokeWidth={4} strokeLinecap="round" />
            {t > 60 ? <circle cx={380 + (((t - 60) * 9) % 370)} cy={RAIL_Y} r={6} fill="#EFFCFF" style={{ filter: "drop-shadow(0 0 8px rgba(34,211,238,0.9))" }} /> : null}
          </g>
        ) : null}
        <g opacity={carO}>
          {/* ghosts of the piston when it is a blur */}
          {fast > 0.05
            ? [padUp + 22, padDown].map((py, i) => {
                const a2 = ik(sh.x, sh.y, BX, py - PISTON, L1, L2, 1);
                return (
                  <g key={i} opacity={0.16 * fast}>
                    <Limb x1={a2.ex} y1={a2.ey} x2={a2.wx} y2={a2.wy} w={26} />
                    <rect x={BX - 12} y={py - PISTON} width={24} height={PISTON - 8} fill={rgba(CYAN, 0.6)} />
                  </g>
                );
              })
            : null}
          {/* upper arm, forearm */}
          <Limb x1={sh.x} y1={sh.y} x2={arm.ex} y2={arm.ey} w={34} />
          <Limb x1={arm.ex} y1={arm.ey} x2={arm.wx} y2={arm.wy} w={28} />
          {/* piston + pad */}
          <rect x={arm.wx - 11} y={arm.wy} width={22} height={PISTON - 10} rx={5} fill="#0A1B33" stroke={rgba(CYAN, 0.95)} strokeWidth={2.5} />
          <rect x={arm.wx - 11} y={arm.wy} width={22} height={PISTON - 10} rx={5} fill={rgba(CYAN, 0.25)} />
          <rect x={arm.wx - 30} y={arm.wy + PISTON - 12} width={60} height={14} rx={7} fill="#0A1B33" stroke={rgba(ICE, 0.95)} strokeWidth={2.5} />
          <rect x={arm.wx - 30} y={arm.wy + PISTON - 12} width={60} height={14} rx={7} fill={rgba(CYAN, 0.4 + 0.4 * hitFlash)} />
          {/* speed lines */}
          {fast > 0.05
            ? [-46, 46].map((dx, i) => (
                <line key={i} x1={BX + dx} y1={padUp - 30} x2={BX + dx} y2={padDown - 10} stroke={rgba(ICE, 0.35 * fast * (0.6 + 0.4 * Math.sin(g * 1.3 + i)))} strokeWidth={3} strokeLinecap="round" strokeDasharray="10 12" strokeDashoffset={-g * 6} />
              ))
            : null}
          {/* gears at the joints */}
          <Gear d={GEAR_M} x={arm.ex} y={arm.ey} rot={-gearRot * 1.3} hub={8} glow={bp} />
          <Gear d={GEAR_S} x={arm.wx} y={arm.wy} rot={gearRot * 1.8} hub={6} glow={bp} />
          <Gear d={GEAR_L} x={sh.x} y={sh.y} rot={gearRot} hub={10} glow={bp} />
          {/* carriage on the rail */}
          <rect x={carX - 86} y={RAIL_Y - 18} width={172} height={64} rx={18} fill="#0A1B33" stroke={rgba(CYAN, 0.95)} strokeWidth={3} />
          <rect x={carX - 86} y={RAIL_Y - 18} width={172} height={64} rx={18} fill={rgba(CYAN, 0.2)} />
          <line x1={carX - 70} y1={RAIL_Y - 14} x2={carX + 70} y2={RAIL_Y - 14} stroke="rgba(255,255,255,0.5)" strokeWidth={2.5} strokeLinecap="round" />
          {[0, 1].map((i) => {
            const on = t >= TAKE ? 0.5 + 0.5 * Math.sin(g * 0.5 + i * Math.PI) : 0.25;
            return <circle key={i} cx={carX + 64 - i * 16} cy={RAIL_Y + 32} r={4.5} fill={i === 0 ? `rgba(110,240,190,${(0.35 + 0.65 * on).toFixed(2)})` : rgba(CYAN, 0.35 + 0.65 * on)} />;
          })}
        </g>
      </svg>
      {/* the DevOps loop on the carriage */}
      <div style={{ position: "absolute", left: carX - 76, top: RAIL_Y - 9, width: 92, height: 46, opacity: carO }}>
        <Logo name={logo} size={92} glow={0.3 + 0.3 * bp} spin={Math.max(0, t - 40)} />
      </div>

      {/* takeover hit */}
      <svg width={W} height={W} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {sparks}
      </svg>
      <Shockwave age={takeA} x={BX} y={padDown} dur={20} maxR={210} r0={40} strength={0.9} />
      <AnamorphicFlare age={takeA} x={BX} y={padDown} col={AMBER} dur={30} size={130} streakH={90} strength={0.75} />

      {/* « auto » chip on the machine once it runs */}
      {t >= TAKE + 6 ? (
        <div style={{ position: "absolute", left: carX + 96, top: RAIL_Y + 2, opacity: iv(t, [TAKE + 6, TAKE + 16], [0, 1]), transform: `scale(${iv(t, [TAKE + 6, TAKE + 16], [0.6, 1], EASE_OUT).toFixed(3)})`, transformOrigin: "0 50%" }}>
          <div style={{ ...glass("34,211,238", 0.5), borderRadius: 999, padding: "6px 14px 6px 11px", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#34D399", boxShadow: `0 0 ${(6 + 8 * (0.5 + 0.5 * Math.sin(g * 0.3))).toFixed(1)}px rgba(52,211,153,0.8)` }} />
            <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 20, color: "#F8FAFC", letterSpacing: "0.02em" }}>auto</span>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
};
