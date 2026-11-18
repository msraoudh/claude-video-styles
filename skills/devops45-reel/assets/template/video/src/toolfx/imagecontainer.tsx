import React from "react";
import { Logo } from "../kit/Logo";
import { fontInter, fontMono } from "../kit/fonts";
import { B, glass } from "../lib/look";
import { beatPulse, rand } from "../lib/sync";
import { AMBER, AnamorphicFlare, clamp01, CYAN, decay, EASE_IN_OUT, EASE_OUT, ICE, iv, rgba, Shockwave, type RGB } from "../archetypes/title/brand/fx";
import { boxSize, ContainerBox } from "./docker";
import type { ToolFx } from "./types";

/*
 * Concept « imagecontainer » — ep. 9 « Docker, c'est quoi ? »: « Le modèle de la boîte, c'est une image. Lancée, c'est un
 * conteneur. Et la même boîte tourne sur ton PC, sur le serveur de test, puis en prod. »
 *   0–40    IMAGE: a blueprint glass card (grid paper) settles; a translucent WIREFRAME container draws itself edge by
 *           edge (dashed hidden edges + ribs, bounding-box brackets), the real Docker badge spins onto its front, a
 *           dimension line reads « app:1.0 ». The pill « IMAGE (le modèle) » pops on TI (« image »). Idle: a scan line.
 *   TL      « lancée »: an amber « ▶ run » button pops beside the card (TL−14) and is pressed on TL (squash, amber ripple,
 *           the card rim flashes amber); a bright wire copy peels off the image and drops down a light column →
 *   TL+12   it hits the floor and turns SOLID (white flash, squash, cyan sparks, shockwave, flare): the glowing running
 *           container, same Docker badge, green LED. Pill « CONTENEUR (en marche) » pops on TC (« conteneur »).
 *           If there is room before « PC », ▶ run is pressed again: a second identical container stamps out (one image,
 *           many containers) — the first slides left.
 *   TP−16   the image shrinks to the top (it stays the source); the running container arcs down and a LAPTOP « ton PC »
 *           rises under it on TP: the box sits in its screen, green ✓.
 *   TT      a SERVER tower « test » rises; the second container (waiting in its slot) or a new copy dropped from the
 *           image locks into its bay, green ✓; a chevron PC › test draws between the labels.
 *   TR      the big RACK « prod » rises; a copy drops from the image into its top bay, bigger green ✓ (burst, shockwave,
 *           flare); chevron test › prod. Fine links fan out from the image to the three machines.
 *   idle    one synchronized light sweep over the three identical boxes, then staggered sweeps; boxes bob, LEDs pulse,
 *           drive / rack LEDs blink, light dots run down the links, the blueprint keeps scanning.
 * Phase words (item `beats`): 6 = [image, lancée, conteneur, PC, test, prod] (best for ep. 9), 5 = [image, conteneur, PC,
 * test, prod], 4 = [conteneur, PC, test, prod], 3 = [conteneur, PC, prod] (test halfway). Anything else → fractions of
 * the item. Gaps are clamped so every phase has room. Without « lancée » the press is 12 f before « conteneur ».
 * Ep. 9 voice (global): image 1144, lancée 1192, conteneur 1255, PC 1399, test 1479, prod 1532 → with f0 ≈ 1060 the
 * sfx json is timed on +132 (run) and +476 (prod ✓). Drawn in a 760 design space.
 */

const BW = 260;
const BH = 156;
const SZ = boxSize(BW, BH); // dx 57.2, d 41.6, W 317.2, H 197.6
const GREEN: RGB = [52, 211, 153];
const MINT = "#6EE7B7";

// ── the blueprint card (B phase: big, C phase: small at the top) ──
const CARD = { w: 380, h: 300 };
const CARD_L = 380 - CARD.w / 2;
const BOX_L = (CARD.w - SZ.W) / 2; // card-local
const BOX_T = 46;
const DIM_Y = BOX_T + SZ.H + 24;
const CARD_Y0 = 78;
const CARD_Y1 = 34;
const IMG_S1 = 0.52;
const CARD_BOT1 = CARD_Y1 + CARD.h * IMG_S1; // card bottom in the C phase
const BTN = { x: 664, y: CARD_Y0 + 150 };

// ── stamped containers (B phase) ──
type Pose = { cx: number; cy: number; s: number }; // bbox centre + scale
const FLOOR_B = 648;
const S_TWO = 0.8;
const B1: Pose = { cx: 380, cy: FLOOR_B - SZ.H / 2, s: 1 };
const B_L: Pose = { cx: 204, cy: FLOOR_B - (SZ.H * S_TWO) / 2, s: S_TWO };
const B_R: Pose = { cx: 556, cy: FLOOR_B - (SZ.H * S_TWO) / 2, s: S_TWO };

// ── environments (C phase) ──
const FLOOR = 602;
const SC = 0.476; // container scale inside a machine
const ENV = [
  { cx: 130, bay: FLOOR - 97, top: FLOOR - 172, half: 114, label: "ton PC" },
  { cx: 380, bay: FLOOR - 216, top: FLOOR - 290, half: 95, label: "test" },
  { cx: 630, bay: FLOOR - 310, top: FLOOR - 384, half: 118, label: "prod" },
];
const BAY: Pose[] = ENV.map((e) => ({ cx: e.cx, cy: e.bay, s: SC }));
const LINK_C: Array<[number, number]> = [
  [130, 200],
  [380, 250],
  [630, 198],
];

const backOut = (d: number) => (d >= 1 ? 1 : d <= 0 ? 0 : 1 + 2.2 * Math.pow(d - 1, 3) + 1.2 * Math.pow(d - 1, 2));
const lerpPose = (a: Pose, b: Pose, u: number): Pose => ({ cx: a.cx + (b.cx - a.cx) * u, cy: a.cy + (b.cy - a.cy) * u, s: a.s + (b.s - a.s) * u });
const arc = (p: Pose, u: number, h: number): Pose => ({ ...p, cy: p.cy - Math.sin(u * Math.PI) * h });
const imgPose = (m: number): Pose => {
  const s = 1 + (IMG_S1 - 1) * m;
  const y = CARD_Y0 + (CARD_Y1 - CARD_Y0) * m;
  return { cx: 380, cy: y + (BOX_T + SZ.H / 2) * s, s };
};
const IMG_B = imgPose(0);
const IMG_C = imgPose(1);
const bez = (p0: [number, number], c: [number, number], p1: [number, number], u: number): [number, number] => [
  (1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * c[0] + u * u * p1[0],
  (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * c[1] + u * u * p1[1],
];

/* ───────────────────────── the image: a translucent wireframe container ───────────────────────── */

const WireBox: React.FC<{ p: number; glow?: number; scan?: number | null; hot?: number }> = ({ p, glow = 0, scan = null, hot = 0 }) => {
  const w = BW;
  const h = BH;
  const dx = SZ.dx;
  const d = SZ.d;
  const W = w + dx;
  const H = h + d;
  const VIS: Array<[number, number, number, number]> = [
    [0, d + h, 0, d],
    [0, d, w, d],
    [w, d, w, d + h],
    [w, d + h, 0, d + h],
    [0, d, dx, 0],
    [dx, 0, w + dx, 0],
    [w + dx, 0, w, d],
    [w + dx, 0, w + dx, h],
    [w + dx, h, w, d + h],
  ];
  const HID: Array<[number, number, number, number]> = [
    [dx, 0, dx, h],
    [dx, h, w + dx, h],
    [0, d + h, dx, h],
  ];
  const fa = iv(p, [0.55, 1], [0, 1]);
  const edge = `rgba(${Math.round(190 + 65 * hot)},${Math.round(240 + 15 * hot)},255,0.96)`;
  const cb = 18;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible", filter: `drop-shadow(0 0 ${(4 + 12 * glow).toFixed(1)}px rgba(34,211,238,${(0.5 + 0.4 * glow).toFixed(2)}))` }}>
      <path d={`M0 ${d} H${w} V${d + h} H0 Z`} fill={rgba(CYAN, 0.07 * fa + 0.08 * hot)} />
      <path d={`M0 ${d} L${dx} 0 H${w + dx} L${w} ${d} Z`} fill={rgba(CYAN, 0.13 * fa + 0.08 * hot)} />
      <path d={`M${w} ${d} L${w + dx} 0 V${h} L${w} ${d + h} Z`} fill={rgba(CYAN, 0.05 * fa + 0.05 * hot)} />
      {HID.map(([x1, y1, x2, y2], i) => (
        <line key={`h${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={rgba(ICE, 0.45 * fa)} strokeWidth={2} strokeDasharray="7 7" />
      ))}
      {Array.from({ length: 11 }, (_, i) => {
        const x = (w * (i + 1)) / 12;
        return <line key={`r${i}`} x1={x} y1={d + h * 0.12} x2={x} y2={d + h * 0.88} stroke={rgba(CYAN, 0.45 * fa)} strokeWidth={2} strokeDasharray="5 6" />;
      })}
      {VIS.map(([x1, y1, x2, y2], i) => {
        const pi = clamp01((p - i * 0.055) / 0.5);
        return pi > 0 ? <line key={`v${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={edge} strokeWidth={3.2} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - pi} /> : null;
      })}
      {[
        [-12, -12, 1, 1],
        [W + 12, -12, -1, 1],
        [-12, H + 12, 1, -1],
        [W + 12, H + 12, -1, -1],
      ].map(([x, y, sx, sy], i) => (
        <path key={`c${i}`} d={`M${x} ${y + sy * cb} V${y} H${x + sx * cb}`} fill="none" stroke={rgba(ICE, 0.6 * fa)} strokeWidth={2.5} strokeLinecap="round" />
      ))}
      {scan !== null && scan >= 0 && scan <= 1 ? (
        <g>
          <line x1={0} y1={d + scan * h} x2={w} y2={d + scan * h} stroke="rgba(255,255,255,0.85)" strokeWidth={2.5} />
          <line x1={w} y1={d + scan * h} x2={w + dx} y2={scan * h} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
        </g>
      ) : null}
    </svg>
  );
};

/* ───────────────────────── a running container (solid glass box + Docker badge + green LED) ───────────────────────── */

const Solid: React.FC<{ uid: string; flash: number; sweep: number | null; led: number; badgeK: number; glow: number }> = ({ uid, flash, sweep, led, badgeK, glow }) => (
  <div style={{ position: "relative", width: SZ.W, height: SZ.H }}>
    <div style={{ position: "absolute", left: -60, top: -50, width: SZ.W + 120, height: SZ.H + 100, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, 0.2 + 0.3 * glow)}, rgba(34,211,238,0))` }} />
    <div style={{ position: "absolute", left: 0, top: 0 }}>
      <ContainerBox uid={uid} w={BW} h={BH} lid={0} flash={flash} sweep={sweep} inner={0} ribs={12} led={led} sw={3.5} />
    </div>
    <div style={{ position: "absolute", left: BW / 2, top: SZ.d + BH / 2, width: 0, height: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ flexShrink: 0, transform: `scale(${badgeK.toFixed(3)})` }}>
        <Logo name="docker" size={80} glow={0.25 + 0.35 * glow} />
      </div>
    </div>
  </div>
);

/* ───────────────────────── machines (drawn around their bottom-centre origin) ───────────────────────── */

const Laptop: React.FC<{ on: number; hl: number }> = ({ on, hl }) => (
  <svg width={290} height={186} viewBox="-145 -180 290 186" style={{ position: "absolute", left: -145, top: -180, overflow: "visible" }}>
    <defs>
      <linearGradient id="icLtD" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0F2750" />
        <stop offset="1" stopColor="#071330" />
      </linearGradient>
      <radialGradient id="icLtG" cx="0.5" cy="0.55" r="0.62">
        <stop offset="0" stopColor={rgba(CYAN, 0.34 * on)} />
        <stop offset="1" stopColor="rgba(34,211,238,0)" />
      </radialGradient>
      <linearGradient id="icLtK" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={rgba(CYAN, 0.3)} />
        <stop offset="1" stopColor={rgba(CYAN, 0.1)} />
      </linearGradient>
    </defs>
    <rect x={-114} y={-172} width={228} height={150} rx={14} fill="rgba(9,20,42,0.95)" stroke={rgba(CYAN, 0.8 + 0.2 * hl)} strokeWidth={3} />
    <rect x={-105} y={-163} width={210} height={132} rx={8} fill="url(#icLtD)" />
    <rect x={-105} y={-163} width={210} height={132} rx={8} fill="url(#icLtG)" />
    <circle cx={0} cy={-167.5} r={2.4} fill={rgba(ICE, 0.75)} />
    <path d="M-98 -171 H98" stroke="rgba(255,255,255,0.42)" strokeWidth={1.5} />
    <path d="M-122 -22 H122 L138 -3 Q140 2 134 2 H-134 Q-140 2 -138 -3 Z" fill="url(#icLtK)" stroke={rgba(CYAN, 0.8)} strokeWidth={2.5} strokeLinejoin="round" />
    <rect x={-28} y={-20} width={56} height={6} rx={3} fill={rgba(ICE, 0.45)} />
  </svg>
);

const Server: React.FC<{ g: number; hl: number }> = ({ g, hl }) => (
  <svg width={200} height={300} viewBox="-100 -296 200 300" style={{ position: "absolute", left: -100, top: -296, overflow: "visible" }}>
    <defs>
      <linearGradient id="icSvB" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="rgba(44,78,132,0.6)" />
        <stop offset="1" stopColor="rgba(9,20,44,0.94)" />
      </linearGradient>
    </defs>
    <rect x={-95} y={-290} width={190} height={290} rx={18} fill="url(#icSvB)" stroke={rgba(CYAN, 0.8 + 0.2 * hl)} strokeWidth={3} />
    <path d="M-78 -289 H78" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
    <rect x={-83} y={-278} width={166} height={124} rx={10} fill="rgba(5,12,28,0.95)" stroke={rgba(CYAN, 0.45)} strokeWidth={2} />
    {[0, 1, 2, 3].map((i) => {
      const y0 = -142 + i * 34;
      const on = rand(Math.floor(g / 7) * 3.1 + i * 5.3) > 0.35;
      return (
        <g key={i}>
          <rect x={-83} y={y0} width={166} height={26} rx={6} fill={rgba(CYAN, 0.08)} stroke={rgba(CYAN, 0.3)} strokeWidth={1.5} />
          {[0, 1, 2, 3, 4].map((j) => (
            <line key={j} x1={-70 + j * 12} y1={y0 + 7} x2={-70 + j * 12} y2={y0 + 19} stroke={rgba(CYAN, 0.35)} strokeWidth={3} strokeLinecap="round" />
          ))}
          <circle cx={50} cy={y0 + 13} r={4} fill={rgba(CYAN, 0.75)} />
          <circle cx={67} cy={y0 + 13} r={4.5} fill={on ? MINT : "rgba(110,231,183,0.22)"} />
        </g>
      );
    })}
  </svg>
);

const Rack: React.FC<{ g: number; hl: number }> = ({ g, hl }) => (
  <svg width={250} height={392} viewBox="-125 -388 250 392" style={{ position: "absolute", left: -125, top: -388, overflow: "visible" }}>
    <defs>
      <linearGradient id="icRkB" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="rgba(44,78,132,0.55)" />
        <stop offset="1" stopColor="rgba(8,18,40,0.95)" />
      </linearGradient>
    </defs>
    <rect x={-118} y={-384} width={236} height={384} rx={14} fill="url(#icRkB)" stroke={rgba(CYAN, 0.8 + 0.2 * hl)} strokeWidth={3} />
    <path d="M-100 -383 H100" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
    {[-1, 1].map((sd) => (
      <g key={sd}>
        <rect x={sd < 0 ? -112 : 102} y={-372} width={10} height={360} rx={3} fill={rgba(CYAN, 0.12)} />
        {Array.from({ length: 18 }, (_, j) => (
          <circle key={j} cx={sd < 0 ? -107 : 107} cy={-362 + j * 20} r={2} fill={rgba(ICE, 0.35)} />
        ))}
      </g>
    ))}
    <rect x={-96} y={-372} width={192} height={124} rx={10} fill="rgba(5,12,28,0.95)" stroke={rgba(CYAN, 0.45)} strokeWidth={2} />
    {Array.from({ length: 6 }, (_, i) => {
      const y0 = -238 + i * 38;
      return (
        <g key={i}>
          <rect x={-96} y={y0} width={192} height={30} rx={5} fill={rgba(CYAN, 0.07)} stroke={rgba(CYAN, 0.28)} strokeWidth={1.5} />
          {[0, 1, 2, 3, 4, 5].map((j) => (
            <line key={j} x1={-84 + j * 10} y1={y0 + 8} x2={-84 + j * 10} y2={y0 + 22} stroke={rgba(CYAN, 0.3)} strokeWidth={2.5} strokeLinecap="round" />
          ))}
          {[0, 1, 2].map((j) => {
            const on = rand(Math.floor(g / 5) * 1.7 + i * 7.1 + j * 3.3) > 0.4;
            return <circle key={j} cx={54 + j * 14} cy={y0 + 15} r={4} fill={j === 2 ? (on ? MINT : "rgba(110,231,183,0.22)") : on ? rgba(CYAN, 0.9) : rgba(CYAN, 0.22)} />;
          })}
        </g>
      );
    })}
  </svg>
);

/** green check badge: scale s (back-out), stroke drawn by d */
const Check: React.FC<{ x: number; y: number; s: number; d: number; ring: number; big?: boolean }> = ({ x, y, s, d, ring, big = false }) => {
  const R = big ? 29 : 25;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0 }}>
      {ring >= 0 && ring < 18 ? <div style={{ position: "absolute", left: -R - ring * 2.6, top: -R - ring * 2.6, width: 2 * (R + ring * 2.6), height: 2 * (R + ring * 2.6), borderRadius: "50%", border: `3px solid ${rgba(GREEN, 0.9 * (1 - ring / 18))}` }} /> : null}
      <div
        style={{
          position: "absolute",
          left: -R,
          top: -R,
          width: 2 * R,
          height: 2 * R,
          borderRadius: R,
          background: "linear-gradient(150deg, #7CF0C4, #10B981)",
          boxShadow: `0 0 ${big ? 26 : 18}px rgba(52,211,153,0.75), 0 6px 14px rgba(0,0,0,0.5), inset 0 1.5px 0 rgba(255,255,255,0.6)`,
          transform: `scale(${s.toFixed(4)})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={R * 1.1} height={R * 1.1} viewBox="0 0 26 26" style={{ overflow: "visible" }}>
          <path d="M5 13.5 L10.5 19 L21 7" fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - d} />
        </svg>
      </div>
    </div>
  );
};

/* ───────────────────────── the animation ───────────────────────── */

export const ImageContainerFx: ToolFx = ({ g, f0, f1, beats, size }) => {
  const t = g - f0;
  const k = size / 760;
  const dur = Math.max(150, f1 - f0);
  const bp = beatPulse(g, 14);

  // ── phases ──
  const bt = beats
    .map((b) => b - f0)
    .filter((b) => b > 0 && b < dur)
    .sort((a, b) => a - b);
  let TI = 20;
  let TL = -1;
  let TC = dur * 0.3;
  let TP = dur * 0.55;
  let TT = dur * 0.7;
  let TR = dur * 0.84;
  if (bt.length === 6) {
    TI = bt[0];
    TL = bt[1];
    TC = bt[2];
    TP = bt[3];
    TT = bt[4];
    TR = bt[5];
  } else if (bt.length === 5) {
    TI = bt[0];
    TC = bt[1];
    TP = bt[2];
    TT = bt[3];
    TR = bt[4];
  } else if (bt.length === 4) {
    TC = bt[0];
    TP = bt[1];
    TT = bt[2];
    TR = bt[3];
  } else if (bt.length === 3) {
    TC = bt[0];
    TP = bt[1];
    TR = bt[2];
    TT = (TP + TR) / 2;
  }
  TC = Math.max(TC, 50);
  TI = Math.min(Math.max(TI, 14), TC - 26);
  TL = TL < 0 ? TC - 12 : Math.min(Math.max(TL, 36), TC - 12);
  const LAND1 = TL + 12;
  const TCL = Math.max(TC, LAND1) + 4; // « CONTENEUR » pill
  TP = Math.max(TP, TCL + 26);
  TT = Math.max(TT, TP + 16);
  TR = Math.max(TR, TT + 16);
  const S2 = LAND1 + 30;
  const two = TP - LAND1 >= 56;
  const X0 = TP - 16;

  // ── image group ──
  const appear = iv(t, [0, 14], [0, 1], EASE_OUT);
  const mx = iv(t, [X0, TP], [0, 1], EASE_IN_OUT);
  const gS = 1 + (IMG_S1 - 1) * mx;
  const gY = CARD_Y0 + (CARD_Y1 - CARD_Y0) * mx;
  const wp = iv(t, [4, 34], [0, 1]);
  const badgeD = iv(t, [22, 40], [0, 1]);
  const dimP = iv(t, [28, 42], [0, 1], EASE_OUT);
  const labP = iv(t, [TI, TI + 12], [0, 1]);
  const presses = two ? [TL, S2 - 12] : [TL];
  const pressEnv = presses.reduce((m, p) => Math.max(m, t >= p ? iv(t - p, [0, 3, 11], [0, 1, 0]) : 0), 0);
  const amberKick = presses.reduce((m, p) => Math.max(m, decay(t - p - 1, 8)), 0);

  // ghost copies dropping out of the image (B: stamps, C: deliveries)
  const drops: Array<{ a: number; b: number; from: Pose; to: Pose }> = [{ a: LAND1 - 10, b: LAND1, from: IMG_B, to: B1 }];
  if (two) drops.push({ a: S2 - 10, b: S2, from: IMG_B, to: B_R });
  else drops.push({ a: TT - 8, b: TT + 2, from: IMG_C, to: BAY[1] });
  drops.push({ a: TR - 8, b: TR + 2, from: IMG_C, to: BAY[2] });
  const imgKick = drops.reduce((m, d) => Math.max(m, decay(t - d.a, 8)), 0);

  // blueprint scan (card-local y)
  const scanU = t >= 40 ? ((t - 40) % 96) / 46 : -1;
  const scanY = scanU >= 0 && scanU <= 1 ? -20 + scanU * (CARD.h + 40) : null;
  const boxScan = scanY === null ? null : (scanY - BOX_T - SZ.d) / BH;

  // ── containers ──
  const c1Base = two ? lerpPose(B1, B_L, iv(t, [S2 - 14, S2], [0, 1], EASE_IN_OUT)) : B1;
  const u1 = iv(t, [X0, TP + 2], [0, 1], EASE_IN_OUT);
  const c1: Pose = u1 > 0 ? arc(lerpPose(c1Base, BAY[0], u1), u1, 80) : c1Base;
  const u2 = iv(t, [X0 + 2, TP + 4], [0, 1], EASE_IN_OUT);
  const hover = Math.sin(g * 0.11) * 5 * iv(t, [TP + 4, TP + 12], [0, 1]) * iv(t, [TT - 8, TT], [1, 0]);
  const c2a = arc(lerpPose(B_R, BAY[1], u2), u2, 60);
  const c2: Pose = u2 > 0 ? { ...c2a, cy: c2a.cy + hover } : B_R;

  const boxAt = (key: string, P: Pose, sx: number, sy: number, o: number, child: React.ReactNode) => (
    <div key={key} style={{ position: "absolute", left: P.cx - SZ.W / 2, top: P.cy + (SZ.H * P.s) / 2 - SZ.H, width: SZ.W, height: SZ.H, opacity: o, transform: `scale(${(P.s * sx).toFixed(4)}, ${(P.s * sy).toFixed(4)})`, transformOrigin: "50% 100%" }}>
      {child}
    </div>
  );

  const solid = (key: string, idx: number, P: Pose, land: number, settle: number) => {
    if (t < land) return null;
    const a = t - land;
    const sq = Math.sin(clamp01(a / 14) * Math.PI * 2) * Math.exp(-a / 5);
    const sa = t - settle;
    const sq2 = settle > land && sa >= 0 ? 0.55 * Math.sin(clamp01(sa / 12) * Math.PI * 2) * Math.exp(-sa / 5) : 0;
    const s = sq + sq2;
    const flash = 0.9 * decay(a, 5) + 0.35 * (settle > land ? decay(sa, 5) : 0);
    const led = iv(a, [2, 10], [0, 1]) * (0.65 + 0.35 * Math.sin(g * 0.18 + idx * 1.3));
    let sweep: number | null = a >= 2 && a < 30 ? (a - 2) / 28 : null;
    if (t >= TR + 14 && t < TR + 40) sweep = (t - TR - 14) / 26; // one synchronized sweep: identical boxes
    else if (t >= TR + 60) {
      const u = ((t - TR - 60 + idx * 33) % 100) / 60;
      sweep = u <= 1 ? u : null;
    }
    const idleK = clamp01((t - settle - 12) / 20);
    const bob = Math.sin(g * 0.07 + idx * 1.9) * 3 * idleK;
    const badgeK = 1 + 0.35 * clamp01((1 - P.s) / (1 - SC));
    return boxAt(key, { ...P, cy: P.cy + bob }, 1 + 0.09 * s, 1 - 0.11 * s, 1, <Solid uid={`ic${key}`} flash={flash} sweep={sweep} led={led} badgeK={badgeK} glow={0.3 + 0.5 * decay(a, 10) + 0.4 * (settle > land ? decay(sa, 10) : 0) + 0.15 * bp} />);
  };

  const containers: React.ReactNode[] = [];
  containers.push(solid("c1", 0, c1, LAND1, TP + 2));
  if (two) containers.push(solid("c2", 1, c2, S2, TT + 2));
  else containers.push(solid("c2", 1, BAY[1], TT + 2, TT + 2));
  containers.push(solid("c3", 2, BAY[2], TR + 2, TR + 2));

  // ghost wire copies in flight (+ two trailing echoes)
  const ghosts: React.ReactNode[] = [];
  const beams: React.ReactNode[] = [];
  drops.forEach((dr, j) => {
    if (t < dr.a - 2 || t > dr.b + 8) return;
    const env = iv(t, [dr.a - 2, dr.a + 2, dr.b, dr.b + 8], [0, 1, 1, 0]);
    const top = dr.from.cy + (SZ.H * dr.from.s) / 2 - 8 * dr.from.s;
    const bot = dr.to.cy - (SZ.H * dr.to.s) / 2;
    const wa = (SZ.W * dr.from.s) / 2;
    const wb = (SZ.W * dr.to.s) / 2;
    beams.push(<path key={`b${j}`} d={`M${dr.from.cx - wa * 0.8} ${top} L${dr.from.cx + wa * 0.8} ${top} L${dr.to.cx + wb} ${bot + 10} L${dr.to.cx - wb} ${bot + 10} Z`} fill="url(#icBeam)" opacity={env} />);
    if (t >= dr.b) return;
    const u = (t - dr.a) / (dr.b - dr.a);
    [0.36, 0.18, 0].forEach((lag, q) => {
      const uu = u - lag;
      if (uu < 0) return;
      const P = lerpPose(dr.from, dr.to, uu * uu * (0.35 + 0.65 * uu) + 0.12 * uu * (1 - uu)); // gravity-like, leaves the image at once
      ghosts.push(
        <div key={`g${j}-${q}`} style={{ position: "absolute", left: 0, top: 0, filter: q < 2 ? `blur(${(4 - q * 1.5).toFixed(1)}px)` : undefined }}>
          {boxAt(`gg${j}-${q}`, P, 1 - 0.04 * uu, 1 + 0.1 * uu, q === 2 ? 1 : 0.22 + 0.16 * q, <WireBox p={1} glow={1} hot={0.8} />)}
        </div>,
      );
    });
  });

  // ── machines ──
  const T_ENV = [TP, TT, TR];
  const devU = T_ENV.map((T) => iv(t, [T - 10, T + 2], [0, 1]));
  const devHl = T_ENV.map((T) => decay(t - (T + 2), 8));
  const ck = T_ENV.map((T) => iv(t, [T + 4, T + 14], [0, 1]));
  const labU = T_ENV.map((T) => iv(t, [T, T + 10], [0, 1], EASE_OUT));
  const linkP = [iv(t, [TP - 2, TP + 10], [0, 1], EASE_OUT), iv(t, [TT - 8, TT + 4], [0, 1], EASE_OUT), iv(t, [TR - 8, TR + 4], [0, 1], EASE_OUT)];
  const lapOn = iv(t, [TP - 2, TP + 8], [0, 1]);
  const machine = (i: number, el: React.ReactNode) => {
    const u = devU[i];
    if (u <= 0) return null;
    const off = (1 - backOut(u)) * 210;
    return (
      <div key={`m${i}`} style={{ position: "absolute", left: ENV[i].cx, top: FLOOR, width: 0, height: 0, opacity: clamp01(u * 3), transform: `translateY(${off.toFixed(2)}px) scale(${(0.86 + 0.14 * u).toFixed(4)})`, transformOrigin: "0px 0px", filter: u < 0.6 ? `blur(${((0.6 - u) * 6).toFixed(1)}px)` : undefined }}>
        {el}
      </div>
    );
  };

  // ── sparks ──
  const sparks: React.ReactNode[] = [];
  const burst = (age: number, n: number, seed: number, ox: number, oy: number, spread: number, col: RGB, life: number, pw = 1) => {
    if (age < 0 || age > life) return;
    for (let i = 0; i < n; i++) {
      const r1 = rand(seed + i * 7.1);
      const r2 = rand(seed + i * 3.3 + 1);
      const r3 = rand(seed + i * 5.7 + 2);
      const vx = ((r1 - 0.5) * 16 + (r3 - 0.5) * 6) * pw;
      const vy = (-4 - r2 * 10) * pw;
      const x = ox + (r1 - 0.5) * spread + vx * age;
      const y = oy + vy * age + 0.42 * age * age;
      const a = 1 - age / life;
      const len = 3 + r3 * 4;
      sparks.push(<line key={`${seed}-${i}`} x1={x} y1={y} x2={x - vx * len * 0.25} y2={y - (vy + 0.84 * age) * len * 0.25} stroke={rgba(i % 3 === 0 ? ICE : col, a)} strokeWidth={(2.4 + r2 * 2.4) * Math.min(1, pw + 0.25)} strokeLinecap="round" />);
    }
  };
  presses.forEach((p, j) => burst(t - p - 1, 8, 91 + j * 17, BTN.x - 30, BTN.y - 10, 40, AMBER, 16, 0.55));
  burst(t - LAND1, 18, 11, B1.cx - SZ.dx / 2, FLOOR_B - BH, 280, CYAN, 26);
  if (two) burst(t - S2, 12, 29, B_R.cx - (SZ.dx * S_TWO) / 2, FLOOR_B - BH * S_TWO, 210, CYAN, 22, 0.8);
  burst(t - (TP + 2), 8, 53, BAY[0].cx, BAY[0].cy - 40, 120, GREEN, 18, 0.55);
  burst(t - (TT + 2), 8, 61, BAY[1].cx, BAY[1].cy - 40, 120, GREEN, 18, 0.55);
  burst(t - (TR + 2), 10, 73, BAY[2].cx, BAY[2].cy - 40, 140, CYAN, 20, 0.65);
  const CK_AT = ENV.map((e) => ({ x: e.cx + e.half - 12, y: e.top + 12 }));
  burst(t - (TR + 4), 16, 83, CK_AT[2].x, CK_AT[2].y, 30, GREEN, 26, 0.8);

  // ── run button ──
  const btnIn = iv(t, [TL - 14, TL - 4], [0, 1]);
  const btnOut = iv(t, [X0, X0 + 8], [1, 0]);
  const btnS = (0.45 + 0.55 * backOut(btnIn)) * (1 - 0.13 * pressEnv) * (0.7 + 0.3 * btnOut);
  const btnO = clamp01(btnIn * 3) * btnOut;

  // ── « CONTENEUR (en marche) » pill ──
  const cpIn = iv(t, [TCL, TCL + 12], [0, 1]);
  const cpO = clamp01(cpIn * 2.5) * iv(t, [X0, X0 + 8], [1, 0]);
  const dotP = 0.55 + 0.45 * Math.sin(g * 0.16);

  const floorB = iv(t, [LAND1 - 4, LAND1 + 6], [0, 1]) * (1 - mx);
  const cardGlow = 0.9 + 0.8 * imgKick + 0.2 * bp;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: k !== 1 ? `scale(${k.toFixed(4)})` : undefined, transformOrigin: "0 0" }}>
      {/* back light */}
      <div style={{ position: "absolute", left: 20, top: 40, width: 720, height: 680, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, 0.12 + 0.05 * bp)}, rgba(34,211,238,0))`, opacity: appear }} />

      {/* floor light under the stamped container (B) and under each machine (C) */}
      <div style={{ position: "absolute", left: 80, top: FLOOR_B - 60, width: 600, height: 130, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, 0.24 + 0.2 * decay(t - LAND1, 12))}, rgba(34,211,238,0))`, opacity: floorB }} />
      {ENV.map((e, i) => (devU[i] > 0 ? <div key={`fl${i}`} style={{ position: "absolute", left: e.cx - 150, top: FLOOR - 34, width: 300, height: 70, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, 0.22 + 0.25 * devHl[i])}, rgba(34,211,238,0))`, opacity: devU[i] }} /> : null))}

      {/* links: one image → three machines */}
      <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="icBeam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={rgba(ICE, 0.32)} />
            <stop offset="1" stopColor={rgba(CYAN, 0.06)} />
          </linearGradient>
        </defs>
        {ENV.map((e, i) => {
          if (linkP[i] <= 0) return null;
          const p0: [number, number] = [380, CARD_BOT1 - 4];
          const p1: [number, number] = [e.cx, e.top + 4];
          const dPath = `M${p0[0]} ${p0[1]} Q${LINK_C[i][0]} ${LINK_C[i][1]} ${p1[0]} ${p1[1]}`;
          const lu = t >= TR + 16 ? ((t - TR - 16 + i * 22) % 66) / 44 : -1;
          const dot = lu >= 0 && lu <= 1 ? bez(p0, LINK_C[i], p1, lu) : null;
          return (
            <g key={`l${i}`}>
              <path d={dPath} fill="none" stroke={rgba(CYAN, 0.18)} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - linkP[i]} />
              <path d={dPath} fill="none" stroke={rgba(ICE, 0.55)} strokeWidth={2.5} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - linkP[i]} />
              {dot ? <circle cx={dot[0]} cy={dot[1]} r={5} fill="#EFFCFF" style={{ filter: "drop-shadow(0 0 7px rgba(34,211,238,0.95))" }} opacity={Math.sin(lu * Math.PI)} /> : null}
            </g>
          );
        })}
        {beams}
      </svg>

      {/* machines */}
      {machine(0, <Laptop on={lapOn} hl={devHl[0]} />)}
      {machine(1, <Server g={g} hl={devHl[1]} />)}
      {machine(2, <Rack g={g} hl={devHl[2]} />)}

      {/* ── the image: blueprint card + wireframe + Docker badge ── */}
      <div style={{ position: "absolute", left: CARD_L, top: gY, width: CARD.w, height: CARD.h, opacity: appear, transform: `scale(${(gS * (0.94 + 0.06 * appear)).toFixed(4)})`, transformOrigin: "50% 0%" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            ...glass("34,211,238", cardGlow),
            borderRadius: 30,
            overflow: "hidden",
            border: `2px solid ${amberKick > 0.03 ? rgba(AMBER, 0.3 + 0.65 * amberKick) : rgba(CYAN, 0.3 + 0.4 * imgKick)}`,
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(16,44,88,0.55), rgba(6,16,38,0.5))" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${rgba(CYAN, 0.09)} 1px, rgba(0,0,0,0) 1px), linear-gradient(90deg, ${rgba(CYAN, 0.09)} 1px, rgba(0,0,0,0) 1px)`, backgroundSize: "26px 26px", backgroundPosition: "-1px -1px" }} />
          {scanY !== null ? <div style={{ position: "absolute", left: 0, right: 0, top: scanY - 30, height: 30, background: `linear-gradient(180deg, rgba(34,211,238,0), ${rgba(CYAN, 0.16)})`, borderBottom: `1.5px solid ${rgba(ICE, 0.55)}` }} /> : null}
          {imgKick > 0.02 ? <div style={{ position: "absolute", inset: 0, background: `radial-gradient(closest-side, ${rgba(ICE, 0.3 * imgKick)}, rgba(0,0,0,0))` }} /> : null}
        </div>
        <div style={{ position: "absolute", left: BOX_L, top: BOX_T }}>
          <WireBox p={wp} glow={0.3 + 0.7 * imgKick} scan={boxScan} hot={0.5 * imgKick} />
        </div>
        {badgeD > 0 ? (
          <div style={{ position: "absolute", left: BOX_L + BW / 2, top: BOX_T + SZ.d + BH / 2, width: 0, height: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Logo name="docker" size={80} draw={badgeD} glow={0.35 + 0.4 * imgKick} />
          </div>
        ) : null}
        {/* dimension line « app:1.0 » */}
        {dimP > 0 ? (
          <div style={{ position: "absolute", left: 0, top: 0, opacity: dimP }}>
            <svg width={CARD.w} height={CARD.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <g stroke={rgba(ICE, 0.6)} strokeWidth={2} strokeLinecap="round">
                <line x1={BOX_L} y1={DIM_Y - 9} x2={BOX_L} y2={DIM_Y + 9} />
                <line x1={BOX_L + BW} y1={DIM_Y - 9} x2={BOX_L + BW} y2={DIM_Y + 9} />
                <line x1={BOX_L + BW / 2 - (BW / 2) * dimP} y1={DIM_Y} x2={BOX_L + BW / 2 + (BW / 2) * dimP} y2={DIM_Y} />
                <path d={`M${BOX_L + 9} ${DIM_Y - 6} L${BOX_L + 1} ${DIM_Y} L${BOX_L + 9} ${DIM_Y + 6}`} fill="none" />
                <path d={`M${BOX_L + BW - 9} ${DIM_Y - 6} L${BOX_L + BW - 1} ${DIM_Y} L${BOX_L + BW - 9} ${DIM_Y + 6}`} fill="none" />
              </g>
            </svg>
            <div style={{ position: "absolute", left: BOX_L + BW / 2, top: DIM_Y, width: 0, height: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ flexShrink: 0, padding: "3px 12px", borderRadius: 10, background: "rgba(8,20,44,0.95)", fontFamily: fontMono, fontWeight: 700, fontSize: 22, color: "#A5F3FC", letterSpacing: "0.01em", whiteSpace: "nowrap" }}>app:1.0</div>
            </div>
          </div>
        ) : null}
      </div>

      {/* « IMAGE (le modèle) » pill, straddling the card's top edge */}
      {labP > 0 ? (
        <div style={{ position: "absolute", left: 380, top: gY, width: 0, height: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: clamp01(labP * 2.5) }}>
          <div
            style={{
              flexShrink: 0,
              ...glass("34,211,238", 0.7),
              background: "linear-gradient(140deg, rgba(22,52,94,0.97), rgba(10,24,52,0.97))",
              border: `1.5px solid ${rgba(CYAN, 0.6)}`,
              borderRadius: 999,
              height: 58,
              padding: "0 26px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              whiteSpace: "nowrap",
              transform: `scale(${(backOut(labP) * (1 - 0.28 * mx) * (1 + 0.08 * decay(t - TI - 12, 6))).toFixed(4)})`,
            }}
          >
            <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 32, color: B.white, letterSpacing: "0.08em" }}>IMAGE</span>
            <span style={{ fontFamily: fontInter, fontWeight: 600, fontSize: 26, color: B.text2 }}>(le modèle)</span>
          </div>
        </div>
      ) : null}

      {/* containers + ghost copies */}
      {containers}
      {ghosts}

      {/* checks */}
      {ENV.map((e, i) => (ck[i] > 0 ? <Check key={`ck${i}`} x={CK_AT[i].x} y={CK_AT[i].y} s={backOut(ck[i]) * (1 + 0.04 * Math.sin(g * 0.1 + i) * clamp01((t - T_ENV[i] - 20) / 20))} d={iv(ck[i], [0.3, 1], [0, 1])} ring={t - T_ENV[i] - 6} big={i === 2} /> : null))}

      {/* machine labels + chevrons */}
      {ENV.map((e, i) =>
        labU[i] > 0 ? (
          <div key={`lb${i}`} style={{ position: "absolute", left: e.cx, top: FLOOR + 22, width: 0, display: "flex", justifyContent: "center", opacity: clamp01(labU[i] * 2), transform: `translateY(${((1 - labU[i]) * 18).toFixed(1)}px)` }}>
            <div style={{ ...glass("34,211,238", 0.5 + 0.6 * devHl[i]), borderRadius: 999, padding: "8px 22px", flexShrink: 0, whiteSpace: "nowrap", fontFamily: fontInter, fontWeight: 700, fontSize: 30, color: B.white, letterSpacing: "-0.01em" }}>{e.label}</div>
          </div>
        ) : null,
      )}
      <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {[1, 2].map((i) => {
          const p = iv(t, [T_ENV[i] - 4, T_ENV[i] + 6], [0, 1], EASE_OUT);
          if (p <= 0) return null;
          const x = (ENV[i - 1].cx + ENV[i].cx) / 2 + 2 + (i === 1 ? -4 : 0);
          const y = FLOOR + 49;
          return (
            <path key={`ch${i}`} d={`M${x - 7} ${y - 12} L${x + 5} ${y} L${x - 7} ${y + 12}`} fill="none" stroke={rgba(CYAN, 0.9)} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" opacity={p} transform={`translate(${((1 - p) * -12).toFixed(1)} 0)`} style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,0.8))" }} />
          );
        })}
      </svg>

      {/* « ▶ run » button */}
      {btnO > 0.01 ? (
        <div style={{ position: "absolute", left: BTN.x, top: BTN.y, width: 0, height: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: btnO }}>
          {presses.map((p, j) => {
            const ra = t - p - 1;
            return ra >= 0 && ra < 20 ? <div key={j} style={{ position: "absolute", width: 150 + ra * 9, height: 66 + ra * 9, borderRadius: 999, border: `3px solid ${rgba(AMBER, 0.85 * (1 - ra / 20))}` }} /> : null;
          })}
          <div
            style={{
              flexShrink: 0,
              ...glass("245,158,11", 0.6 + 1.2 * amberKick),
              background: `linear-gradient(140deg, ${rgba(AMBER, 0.26 + 0.3 * pressEnv)}, rgba(30,22,10,0.85))`,
              border: `2px solid ${rgba(AMBER, 0.6 + 0.4 * pressEnv)}`,
              borderRadius: 999,
              height: 66,
              padding: "0 28px 0 24px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              whiteSpace: "nowrap",
              transform: `scale(${btnS.toFixed(4)})`,
            }}
          >
            <svg width={24} height={26} viewBox="0 0 24 26" style={{ overflow: "visible", filter: `drop-shadow(0 0 ${(6 + 10 * amberKick).toFixed(1)}px rgba(245,158,11,0.9))` }}>
              <path d="M3 2 L22 13 L3 24 Z" fill="#FBBF24" stroke="#FFE7B8" strokeWidth={1.5} strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 32, color: "#FFE7B8", letterSpacing: "0.02em" }}>run</span>
          </div>
        </div>
      ) : null}

      {/* « CONTENEUR (en marche) » pill */}
      {cpO > 0.01 ? (
        <div style={{ position: "absolute", left: 380, top: FLOOR_B + 52, width: 0, height: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: cpO }}>
          <div
            style={{
              flexShrink: 0,
              ...glass("52,211,153", 0.6),
              background: "linear-gradient(140deg, rgba(18,58,72,0.97), rgba(8,26,40,0.97))",
              border: `1.5px solid ${rgba(GREEN, 0.6)}`,
              borderRadius: 999,
              height: 58,
              padding: "0 26px 0 22px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              whiteSpace: "nowrap",
              transform: `scale(${(backOut(cpIn) * (1 + 0.08 * decay(t - TCL - 12, 6))).toFixed(4)})`,
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: 7, background: "#34D399", boxShadow: `0 0 ${(6 + 10 * dotP).toFixed(1)}px rgba(52,211,153,${(0.5 + 0.4 * dotP).toFixed(2)})` }} />
            <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 32, color: B.white, letterSpacing: "0.08em" }}>CONTENEUR</span>
            <span style={{ fontFamily: fontInter, fontWeight: 600, fontSize: 26, color: MINT }}>(en marche)</span>
          </div>
        </div>
      ) : null}

      <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
        {sparks}
      </svg>
      <Shockwave age={t - LAND1} x={B1.cx} y={B1.cy} dur={26} maxR={480} r0={110} strength={0.85} />
      <AnamorphicFlare age={t - LAND1} x={B1.cx - SZ.dx / 2} y={FLOOR_B - BH} dur={30} size={150} streakH={100} strength={0.75} />
      {presses.map((p, j) => (
        <AnamorphicFlare key={`af${j}`} age={t - p - 1} x={BTN.x - 40} y={BTN.y} col={AMBER} dur={22} size={90} streakH={50} strength={0.5} />
      ))}
      <Shockwave age={t - (TR + 2)} x={BAY[2].cx} y={BAY[2].cy} col={GREEN} dur={24} maxR={320} r0={50} strength={0.7} />
      <AnamorphicFlare age={t - (TR + 4)} x={CK_AT[2].x} y={CK_AT[2].y} col={GREEN} dur={28} size={110} streakH={70} strength={0.6} />
    </div>
  );
};
