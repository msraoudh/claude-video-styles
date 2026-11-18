import React from "react";
import { fontInter, fontMono } from "../kit/fonts";
import { B } from "../lib/look";
import { beatPulse, rand } from "../lib/sync";
import { AMBER, AMBER_HOT, Bloom, clamp01, CYAN, decay, EASE_IN, EASE_IN_OUT, EASE_OUT, ICE, iv, rgba, Shockwave, type RGB } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/*
 * La culture — « Devs et ops visent le même but, et quand ça casse, on cherche la cause, pas un coupable. »  t = g - f0
 * 0–12     two glass teams pop in: « dev » (cyan, </> badges) left, « ops » (amber, server badges) right; a glass brick wall rises between them
 * 14–24    the wall cracks (lines run from an impact point, wall shakes)
 * 24       it SHATTERS — glass shards burst out, light bloom + shockwave
 * 24–46    the two teams slide together; 26–42 ONE glowing bullseye pops above them, « même but »; 32–52 aim rays draw from every head to it
 * 60–72    a server card rises between the teams; 74 it CRACKS — brief red flash, sparks, shake, blinking red LEDs, the team recoils
 * 84–104   a pointing finger jabs at a dev « coupable » — 96–104 it gets crossed out (ban ring + strike), shakes « non », fades by 128
 * 104–124  a magnifier sweeps in and scans down onto the crack; 124 amber glint — found
 * 128–146  a glowing amber gear rises out of the crack, « cause »
 * 146      fixed: the crack heals, LEDs turn green, check badge, green pulse ring, everyone hops, confetti (high-five)
 * idle     avatars bob + blink, the target breathes and emits rings, light runs along the aim rays, the gear turns, LEDs blink
 */

const RED: RGB = [248, 113, 113];
const GREEN: RGB = [52, 211, 153];
const OPS: RGB = [251, 176, 59];
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t].map(Math.round) as RGB;

// ── timing ──
const CRACK_W = 12;
const SHATTER = 24;
const MERGE = [24, 46];
const TGT = 26;
const SRV = 60;
const BREAK = 74;
const FINGER = 84;
const BAN = 96;
const MAG = [104, 124];
const FOUND = 124;
const GEAR = 128;
const FIX = 146;

// ── layout (760 stage) ──
const BASE = 590; // feet line of the avatars
const TC = { x: 380, y: 150 }; // the shared target
const TR = 88;
const L0 = [112, 214];
const R0 = [546, 648];
const L1 = [172, 266];
const R1 = [494, 588];
const WALL = { x: 342, y: 220, w: 76, h: 374 };
const SV = { x: 330, y: 448, w: 100, h: 142 }; // server card
const CRK = { x: 380, y: 518 }; // crack centre
const GEAR_P = { x: 380, y: 366 };
const HAND = { x: 236, y: 330 };
const headY = (base: number) => base - 106;

// wall shards: 3 columns × 7 rows of jittered quads, each split in two triangles
const SH_ROWS = 7;
const gridPt = (i: number, j: number): [number, number] => {
  const x = WALL.x + (WALL.w * i) / 3;
  const y = WALL.y + (WALL.h * j) / SH_ROWS;
  const jx = i > 0 && i < 3 ? (rand(i * 13 + j * 7.3) - 0.5) * 16 : 0;
  const jy = j > 0 && j < SH_ROWS ? (rand(i * 3.7 + j * 11.1) - 0.5) * 30 : 0;
  return [x + jx, y + jy];
};
const SHARDS: Array<[number, number][]> = [];
for (let j = 0; j < SH_ROWS; j++)
  for (let i = 0; i < 3; i++) {
    const a = gridPt(i, j), b = gridPt(i + 1, j), c = gridPt(i + 1, j + 1), d = gridPt(i, j + 1);
    if ((i + j) % 2) SHARDS.push([a, b, c], [a, c, d]);
    else SHARDS.push([a, b, d], [b, c, d]);
  }
const IMPACT = { x: 386, y: 400 };
const WALL_CRACKS = [
  [IMPACT.x, IMPACT.y, 360, 336, 376, 272, 352, 226],
  [IMPACT.x, IMPACT.y, 406, 350, 396, 296, 412, 250],
  [IMPACT.x, IMPACT.y, 360, 452, 374, 514, 350, 568],
  [IMPACT.x, IMPACT.y, 408, 466, 394, 536, 410, 590],
  [IMPACT.x, IMPACT.y, 346, 390],
  [IMPACT.x, IMPACT.y, 416, 416],
  [IMPACT.x, IMPACT.y, 352, 430],
];
const poly = (p: number[]) => p.reduce((s, v, k) => s + (k % 2 ? ` ${v}` : `${k ? " L" : "M"}${v}`), "");

const SRV_CRACK = `M${SV.w * 0.52} 0 L${SV.w * 0.4} ${SV.h * 0.2} L${SV.w * 0.6} ${SV.h * 0.38} L${SV.w * 0.42} ${SV.h * 0.58} L${SV.w * 0.62} ${SV.h * 0.78} L${SV.w * 0.5} ${SV.h}`;

const gearPath = (R: number, r: number, teeth: number) => {
  let d = "";
  const st = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a0 = i * st;
    const pts: Array<[number, number]> = [
      [r, a0],
      [R, a0 + st * 0.12],
      [R, a0 + st * 0.42],
      [r, a0 + st * 0.54],
    ];
    pts.forEach(([rr, a], k) => (d += `${i === 0 && k === 0 ? "M" : "L"}${(Math.cos(a) * rr).toFixed(2)} ${(Math.sin(a) * rr).toFixed(2)} `));
  }
  return d + "Z";
};
const GEAR_D = gearPath(36, 27, 9);

/** a small glass avatar, anchored at its feet (cx, base) */
const Avatar: React.FC<{ cx: number; base: number; col: RGB; badge: "code" | "server"; sc: number; rot: number; glow: number; blink: number; look: [number, number]; badgeCol: RGB }> = ({
  cx,
  base,
  col,
  badge,
  sc,
  rot,
  glow,
  blink,
  look,
  badgeCol,
}) => {
  if (sc <= 0.01) return null;
  const bc = badgeCol;
  return (
    <div style={{ position: "absolute", left: cx - 60, top: base - 160, width: 120, height: 160, transform: `rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`, transformOrigin: "50% 100%" }}>
      <div style={{ position: "absolute", left: -40, top: -10, width: 200, height: 190, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(col, 0.2 + 0.25 * glow)}, ${rgba(col, 0)})` }} />
      {/* body */}
      <div
        style={{
          position: "absolute",
          left: 8,
          top: 92,
          width: 104,
          height: 68,
          borderRadius: "52px 52px 20px 20px",
          background: `linear-gradient(160deg, ${rgba(col, 0.55)}, ${rgba(col, 0.14)} 70%)`,
          border: `1.5px solid ${rgba(col, 0.75)}`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.55), inset 0 14px 22px -12px rgba(255,255,255,0.35), 0 10px 26px rgba(0,0,0,0.45), 0 0 ${(20 + 26 * glow).toFixed(0)}px ${rgba(col, 0.35 + 0.3 * glow)}`,
        }}
      />
      {/* head */}
      <div
        style={{
          position: "absolute",
          left: 28,
          top: 22,
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: `radial-gradient(circle at 34% 28%, rgba(255,255,255,0.7), ${rgba(col, 0.6)} 42%, ${rgba(col, 0.2)} 100%)`,
          border: `1.5px solid ${rgba(col, 0.8)}`,
          boxShadow: `inset 0 -8px 16px ${rgba(col, 0.35)}, 0 0 ${(16 + 20 * glow).toFixed(0)}px ${rgba(col, 0.4 + 0.3 * glow)}`,
        }}
      >
        {[20, 36].map((x, k) => (
          <div key={k} style={{ position: "absolute", left: x + look[0], top: 26 + look[1], width: 7, height: 10, borderRadius: 4, background: "#0A1630", transform: `scaleY(${blink.toFixed(3)})` }} />
        ))}
      </div>
      {/* badge */}
      <div
        style={{
          position: "absolute",
          left: 41,
          top: 106,
          width: 38,
          height: 38,
          borderRadius: 12,
          background: "rgba(6,12,28,0.82)",
          border: `2px solid ${rgba(bc, 0.95)}`,
          boxShadow: `0 0 14px ${rgba(bc, 0.6)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {badge === "code" ? (
          <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 14, color: rgba(bc, 1), letterSpacing: "-0.04em" }}>{"</>"}</span>
        ) : (
          <svg width={22} height={22} viewBox="0 0 22 22">
            {[2, 8.5, 15].map((y, k) => (
              <g key={k}>
                <rect x={1.5} y={y} width={19} height={5} rx={1.6} fill="none" stroke={rgba(bc, 1)} strokeWidth={1.6} />
                <circle cx={16.5} cy={y + 2.5} r={1.1} fill={rgba(bc, 1)} />
              </g>
            ))}
          </svg>
        )}
      </div>
    </div>
  );
};

/** small glass label pill centred on (cx, cy); `strike` draws a red line through it */
const Pill: React.FC<{ cx: number; cy: number; text: string; col: RGB; o: number; sc?: number; strike?: number; fs?: number }> = ({ cx, cy, text, col, o, sc = 1, strike = 0, fs = 24 }) =>
  o > 0.01 ? (
    <div style={{ position: "absolute", left: cx, top: cy, width: 0, height: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: o }}>
      <div
        style={{
          flexShrink: 0,
          position: "relative",
          padding: "7px 18px 8px",
          borderRadius: 999,
          background: "rgba(8,16,36,0.78)",
          border: `1.5px solid ${rgba(col, 0.8)}`,
          boxShadow: `0 0 18px ${rgba(col, 0.35)}, inset 0 1px 0 rgba(255,255,255,0.18)`,
          fontFamily: fontInter,
          fontWeight: 700,
          fontSize: fs,
          color: B.white,
          whiteSpace: "nowrap",
          transform: `scale(${sc.toFixed(3)})`,
        }}
      >
        {text}
        {strike > 0 ? <div style={{ position: "absolute", left: 12, top: "50%", height: 4, marginTop: -2, width: `calc(${(strike * 100).toFixed(1)}% - ${(24 * strike).toFixed(1)}px)`, background: rgba(RED, 1), borderRadius: 2, boxShadow: `0 0 8px ${rgba(RED, 0.8)}` }} /> : null}
      </div>
    </div>
  ) : null;

export const CultureFx: ToolFx = ({ g, f0, size }) => {
  const t = g - f0;
  const k = size / 760;
  const bp = beatPulse(g, 14);
  const live = clamp01((t - 46) / 14);

  // ── teams ──
  const m = iv(t, MERGE, [0, 1], EASE_OUT);
  const lean = Math.sin(m * Math.PI);
  const recoil = decay(t - BREAK, 7);
  const fixAge = t - FIX;
  const members = [
    { cx: L0[0] + (L1[0] - L0[0]) * m, col: CYAN, badge: "code" as const, side: -1 },
    { cx: L0[1] + (L1[1] - L0[1]) * m, col: CYAN, badge: "code" as const, side: -1 },
    { cx: R0[0] + (R1[0] - R0[0]) * m, col: OPS, badge: "server" as const, side: 1 },
    { cx: R0[1] + (R1[1] - R0[1]) * m, col: OPS, badge: "server" as const, side: 1 },
  ];
  const avatars = members.map(({ cx, col, badge, side }, i) => {
    const s0 = [0, 3, 2, 5][i];
    const sc = iv(t, [s0, s0 + 8, s0 + 14], [0, 1.1, 1], EASE_OUT);
    const bob = Math.sin(g * 0.085 + i * 1.7) * 4 * live;
    const hopA = fixAge - [2, 0, 0, 2][i];
    const hopS = hopA >= 0 && hopA < 18 ? Math.sin((hopA / 18) * Math.PI) : 0;
    const x = cx + side * 8 * recoil;
    const rot = -side * 7 * lean + side * 6 * recoil - side * 6 * hopS;
    const blink = (g + i * 41) % 140 < 5 ? 0.15 : 1;
    // eyes: at each other while walled, up at the target once merged, down at the server while it is broken
    const look: [number, number] = t >= BREAK && t < FIX ? [-side * 4, 4] : m > 0.5 ? [-side * 3, -4] : [-side * 4, 0];
    const glow = 0.4 * decay(fixAge, 14) + 0.25 * decay(t - (TGT + 8), 14) + 0.15 * bp * live;
    const badgeCol = fixAge >= 0 ? mixRGB(col, GREEN, decay(fixAge, 12)) : col;
    return <Avatar key={i} cx={x} base={BASE + bob - 26 * hopS} col={col} badge={badge} sc={sc} rot={rot} glow={glow} blink={blink} look={look} badgeCol={badgeCol} />;
  });
  const teamA = iv(t, [6, 16], [0, 1], EASE_OUT);
  const devX = (members[0].cx + members[1].cx) / 2;
  const opsX = (members[2].cx + members[3].cx) / 2;

  // ── wall ──
  const wallRise = iv(t, [0, 12], [0, 1], EASE_OUT);
  const crack = iv(t, [CRACK_W, SHATTER - 2], [0, 1]);
  const wallShake = t >= CRACK_W && t < SHATTER ? Math.sin(t * 2.9) * 3 * crack : 0;
  const wall =
    t < SHATTER ? (
      <svg key="wall" width={760} height={760} style={{ position: "absolute", left: wallShake, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="cuWall" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(190,240,255,0.32)" />
            <stop offset="0.5" stopColor="rgba(190,240,255,0.14)" />
            <stop offset="1" stopColor="rgba(190,240,255,0.28)" />
          </linearGradient>
        </defs>
        <g transform={`translate(0 ${WALL.y + WALL.h}) scale(1 ${wallRise.toFixed(4)}) translate(0 ${-(WALL.y + WALL.h)})`}>
          <rect x={WALL.x - 30} y={WALL.y - 10} width={WALL.w + 60} height={WALL.h + 20} rx={30} fill={rgba(ICE, 0.06)} />
          <rect x={WALL.x} y={WALL.y} width={WALL.w} height={WALL.h} rx={8} fill="url(#cuWall)" stroke="rgba(230,250,255,0.75)" strokeWidth={2} />
          {Array.from({ length: 9 }, (_, r) => {
            const y = WALL.y + (WALL.h * (r + 1)) / 10;
            const xm = WALL.x + (r % 2 ? WALL.w * 0.3 : WALL.w * 0.62);
            return (
              <g key={r} stroke="rgba(230,250,255,0.42)" strokeWidth={2}>
                <line x1={WALL.x + 2} y1={y} x2={WALL.x + WALL.w - 2} y2={y} />
                <line x1={xm} y1={y} x2={xm} y2={y - WALL.h / 10} />
              </g>
            );
          })}
          <rect x={WALL.x + 5} y={WALL.y + 6} width={5} height={WALL.h - 12} rx={2.5} fill="rgba(255,255,255,0.4)" />
          {crack > 0
            ? WALL_CRACKS.map((p, j) => (
                <path key={j} d={poly(p)} fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(crack * 1.3 - j * 0.06)} style={{ filter: "drop-shadow(0 0 5px rgba(34,211,238,0.95))" }} />
              ))
            : null}
        </g>
      </svg>
    ) : null;
  const sa = t - SHATTER;
  const shards =
    sa >= 0 && sa < 34 ? (
      <svg key="shards" width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {SHARDS.map((tri, j) => {
          const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
          const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
          const r1 = rand(j * 4.1 + 2);
          const r2 = rand(j * 9.7 + 5);
          const dir = cx < 380 ? -1 : 1;
          const vx = dir * (3 + r1 * 9) + (cx - IMPACT.x) * 0.05;
          const vy = (cy - IMPACT.y) * 0.03 - 2 - r2 * 4;
          const dx = vx * sa;
          const dy = vy * sa + 0.32 * sa * sa;
          const rot = (r1 - 0.5) * 26 * sa;
          const sc = 1 + 0.02 * sa;
          const o = iv(sa, [0, 20, 34], [1, 0.8, 0]);
          return (
            <path
              key={j}
              d={`M${tri[0][0]} ${tri[0][1]} L${tri[1][0]} ${tri[1][1]} L${tri[2][0]} ${tri[2][1]} Z`}
              transform={`translate(${dx.toFixed(1)} ${dy.toFixed(1)}) rotate(${rot.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)}) translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${sc.toFixed(3)}) translate(${(-cx).toFixed(1)} ${(-cy).toFixed(1)})`}
              fill={rgba(ICE, 0.22 * o)}
              stroke={`rgba(235,252,255,${(0.85 * o).toFixed(3)})`}
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
    ) : null;

  // ── the shared target ──
  const tp = iv(t, [TGT, TGT + 9, TGT + 16], [0, 1.14, 1], EASE_OUT);
  const breathe = live * (0.5 + 0.5 * Math.sin((t - 46) * 0.11));
  const tSc = tp * (1 + 0.035 * breathe + 0.04 * bp * live + 0.08 * decay(fixAge, 10));
  const rays = members.map(({ cx, col }, i) => {
    const hx = cx;
    const hy = headY(BASE) - 30;
    const ang = Math.atan2(TC.y - hy, TC.x - hx);
    const ex = TC.x - Math.cos(ang) * (TR + 10);
    const ey = TC.y - Math.sin(ang) * (TR + 10);
    const d = iv(t, [32 + i * 2, 46 + i * 2], [0, 1], EASE_OUT);
    if (d <= 0) return null;
    const o = 0.8 - 0.35 * live;
    const run = (t * 0.02 + i * 0.25) % 1;
    return (
      <g key={i} opacity={o}>
        <line x1={hx} y1={hy} x2={hx + (ex - hx) * d} y2={hy + (ey - hy) * d} stroke={rgba(col, 0.9)} strokeWidth={3.5} strokeLinecap="round" strokeDasharray="2 12" strokeDashoffset={-t * 1.2} />
        {d >= 1 ? <circle cx={hx + (ex - hx) * run} cy={hy + (ey - hy) * run} r={4.5} fill="#F4FDFF" opacity={0.9 * live} style={{ filter: `drop-shadow(0 0 5px ${rgba(col, 1)})` }} /> : null}
      </g>
    );
  });
  const ringAge = t >= 46 ? (t - 46) % 48 : -1;
  const target =
    tp > 0.01 ? (
      <div key="target" style={{ position: "absolute", left: TC.x, top: TC.y, width: 0, height: 0 }}>
        <div style={{ position: "absolute", left: -190, top: -190, width: 380, height: 380, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, (0.28 + 0.14 * breathe + 0.1 * bp) * Math.min(1, tp))}, ${rgba(CYAN, 0)})` }} />
        {ringAge >= 0 ? <div style={{ position: "absolute", left: -TR, top: -TR, width: TR * 2, height: TR * 2, borderRadius: "50%", border: `3px solid ${rgba(CYAN, 0.5 * (1 - ringAge / 48))}`, transform: `scale(${(1 + 0.7 * EASE_OUT(ringAge / 48)).toFixed(3)})` }} /> : null}
        <svg width={TR * 2 + 40} height={TR * 2 + 40} viewBox={`${-TR - 20} ${-TR - 20} ${TR * 2 + 40} ${TR * 2 + 40}`} style={{ position: "absolute", left: -TR - 20, top: -TR - 20, overflow: "visible", transform: `scale(${tSc.toFixed(4)}) rotate(${((1 - Math.min(1, tp)) * -40).toFixed(1)}deg)` }}>
          <defs>
            <radialGradient id="cuBull" cx="0.38" cy="0.32" r="0.8">
              <stop offset="0" stopColor="#FFE7B0" />
              <stop offset="0.55" stopColor="#F59E0B" />
              <stop offset="1" stopColor="#B45309" />
            </radialGradient>
          </defs>
          <circle r={TR} fill="rgba(34,211,238,0.12)" stroke="#22D3EE" strokeWidth={5} style={{ filter: "drop-shadow(0 0 12px rgba(34,211,238,0.8))" }} />
          <circle r={TR - 24} fill="rgba(6,12,28,0.75)" stroke="rgba(235,252,255,0.85)" strokeWidth={3} />
          <circle r={TR - 46} fill="rgba(34,211,238,0.3)" stroke="#67E8F9" strokeWidth={3} />
          <circle r={20} fill="url(#cuBull)" style={{ filter: `drop-shadow(0 0 ${(12 + 10 * breathe).toFixed(1)}px rgba(245,158,11,0.95))` }} />
          <path d={`M${-TR * 0.62} ${-TR * 0.62} A${TR * 0.88} ${TR * 0.88} 0 0 1 ${TR * 0.25} ${-TR * 0.85}`} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={3} strokeLinecap="round" />
        </svg>
      </div>
    ) : null;

  // ── the server that breaks ──
  const sp = iv(t, [SRV, SRV + 8, SRV + 14], [0, 1.06, 1], EASE_OUT);
  const red = t >= BREAK ? iv(t, [BREAK, BREAK + 3], [0, 1]) * iv(t, [FIX - 8, FIX + 4], [1, 0]) : 0;
  const redHot = decay(t - BREAK, 10);
  const heal = iv(t, [FIX, FIX + 12], [0, 1], EASE_OUT);
  const srvShake = t >= BREAK && t < BREAK + 14 ? Math.sin(t * 3.1) * 6 * decay(t - BREAK, 6) : 0;
  const srvCol = mixRGB(heal > 0 ? mixRGB(CYAN, GREEN, 0.5 * decay(fixAge, 16)) : CYAN, RED, Math.max(redHot, red * 0.55));
  const crackDraw = iv(t, [BREAK, BREAK + 4], [0, 1]) * (1 - heal);
  const ledCol: RGB = heal > 0 ? GREEN : red > 0 ? RED : CYAN;
  const ledOn = (r: number) => (heal > 0 ? 0.5 + 0.5 * Math.sin(g * 0.25 + r * 2) : red > 0 ? (Math.floor(t / 5) % 2 ? 1 : 0.25) : 0.4 + 0.6 * Math.abs(Math.sin(g * 0.15 + r * 1.3)));
  const server =
    sp > 0.01 ? (
      <div key="server" style={{ position: "absolute", left: SV.x + srvShake, top: SV.y, width: SV.w, height: SV.h, transform: `scale(${sp.toFixed(4)})`, transformOrigin: "50% 100%", opacity: clamp01(sp * 2) }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 18,
            background: `linear-gradient(150deg, ${rgba(srvCol, 0.32)}, rgba(255,255,255,0.03))`,
            border: `1.5px solid ${rgba(srvCol, 0.8)}`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.45), 0 14px 30px rgba(0,0,0,0.5), 0 0 ${(24 + 40 * redHot).toFixed(0)}px ${rgba(srvCol, 0.4 + 0.4 * redHot)}`,
          }}
        />
        {[0, 1, 2].map((r) => (
          <div key={r} style={{ position: "absolute", left: 12, top: 18 + r * 38, width: SV.w - 24, height: 26, borderRadius: 7, background: "rgba(4,9,22,0.7)", border: `1px solid ${rgba(srvCol, 0.45)}` }}>
            {[0, 1, 2].map((s) => (
              <div key={s} style={{ position: "absolute", left: 8 + s * 9, top: 7, width: 4, height: 12, borderRadius: 2, background: "rgba(226,236,250,0.25)" }} />
            ))}
            <div style={{ position: "absolute", right: 8, top: 8, width: 9, height: 9, borderRadius: "50%", background: rgba(ledCol, 1), opacity: ledOn(r), boxShadow: `0 0 8px ${rgba(ledCol, 1)}` }} />
          </div>
        ))}
        {crackDraw > 0.01 ? (
          <svg width={SV.w} height={SV.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <path d={SRV_CRACK} fill="none" stroke={rgba(RED, 0.6 * crackDraw)} strokeWidth={9} strokeLinejoin="round" style={{ filter: "blur(3px)" }} />
            <path d={SRV_CRACK} fill="none" stroke="#FFF1F1" strokeWidth={3.5} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - iv(t, [BREAK, BREAK + 4], [0, 1])} opacity={1 - heal} />
          </svg>
        ) : null}
      </div>
    ) : null;
  // break sparks
  const ba = t - BREAK;
  const sparks =
    ba >= 0 && ba < 24 ? (
      <svg key="sparks" width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {Array.from({ length: 12 }, (_, j) => {
          const ang = rand(j * 3.3 + 1) * Math.PI * 2;
          const v = 5 + rand(j * 7.1) * 7;
          const x = CRK.x + Math.cos(ang) * v * ba;
          const y = CRK.y - 20 + Math.sin(ang) * v * ba + 0.25 * ba * ba;
          return <line key={j} x1={x} y1={y} x2={x - Math.cos(ang) * 10} y2={y - Math.sin(ang) * 10} stroke={j % 3 ? rgba(RED, 1 - ba / 24) : `rgba(255,240,240,${(1 - ba / 24).toFixed(3)})`} strokeWidth={3} strokeLinecap="round" />;
        })}
      </svg>
    ) : null;

  // ── the blaming finger, crossed out ──
  const fa = t - FINGER;
  const fp = iv(fa, [0, 8, 13], [0, 1.15, 1], EASE_OUT);
  const fOut = iv(t, [116, 128], [1, 0], EASE_IN);
  const ban = iv(t, [BAN, BAN + 8], [0, 1], EASE_OUT);
  const fAng = (Math.atan2(headY(BASE) - 34 - HAND.y, L1[1] - HAND.x) * 180) / Math.PI;
  const jab = fa >= 0 && t < BAN ? 7 * Math.max(0, Math.sin(fa * 0.55)) : 0;
  const no = t >= BAN + 4 && t < 118 ? Math.sin((t - BAN - 4) * 1.4) * 7 * decay(t - BAN - 4, 9) : 0;
  const handFill = `rgba(${Math.round(248 - 70 * ban)},${Math.round(250 - 60 * ban)},${Math.round(252 - 40 * ban)},${(0.95 - 0.35 * ban).toFixed(3)})`;
  const finger =
    fp > 0.01 && fOut > 0.01 ? (
      <div key="finger" style={{ position: "absolute", left: HAND.x + no, top: HAND.y, width: 0, height: 0, opacity: fOut, transform: `scale(${(fp * (0.85 + 0.15 * fOut)).toFixed(4)})` }}>
        <svg width={200} height={200} viewBox="-100 -100 200 200" style={{ position: "absolute", left: -100, top: -100, overflow: "visible" }}>
          <g transform={`rotate(${fAng.toFixed(2)}) translate(${(jab - 12).toFixed(2)} 0) scale(1.5)`}>
            <rect x={-30} y={-20} width={40} height={42} rx={13} fill={handFill} stroke="rgba(10,22,48,0.55)" strokeWidth={2} />
            <rect x={2} y={-20} width={50} height={15} rx={7.5} fill={handFill} stroke="rgba(10,22,48,0.55)" strokeWidth={2} />
            <rect x={-10} y={10} width={24} height={13} rx={6.5} fill={handFill} stroke="rgba(10,22,48,0.45)" strokeWidth={2} />
            {[-4, 6].map((y, j) => (
              <line key={j} x1={-14} y1={y} x2={6} y2={y} stroke="rgba(10,22,48,0.3)" strokeWidth={2} strokeLinecap="round" />
            ))}
          </g>
          {ban > 0 ? (
            <g style={{ filter: "drop-shadow(0 0 8px rgba(248,113,113,0.85))" }}>
              <circle r={72} fill="none" stroke={rgba(RED, 0.95)} strokeWidth={8} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ban} transform="rotate(-135)" />
              <line x1={-51} y1={-51} x2={-51 + 102 * clamp01(ban * 1.4 - 0.4)} y2={-51 + 102 * clamp01(ban * 1.4 - 0.4)} stroke={rgba(RED, 0.95)} strokeWidth={8} strokeLinecap="round" />
            </g>
          ) : null}
        </svg>
      </div>
    ) : null;
  const blameLbl = <Pill key="blame" cx={HAND.x - 40 + no} cy={HAND.y - 104} text="coupable" col={RED} o={Math.min(iv(fa, [4, 12], [0, 1]), fOut)} sc={iv(fa, [4, 12], [0.7, 1], EASE_OUT)} strike={iv(t, [BAN + 2, BAN + 9], [0, 1], EASE_OUT)} fs={22} />;

  // ── the magnifier finds the cause ──
  const mu = iv(t, MAG, [0, 1], EASE_IN_OUT);
  const M0 = { x: 650, y: 300 };
  const M1 = { x: CRK.x, y: CRK.y - 6 };
  const nx = -(M1.y - M0.y);
  const ny = M1.x - M0.x;
  const nl = Math.hypot(nx, ny);
  const wob = 34 * Math.sin(mu * Math.PI * 2) * (1 - mu);
  const lift = iv(t, [FOUND + 14, FOUND + 30], [0, 1], EASE_IN_OUT);
  const mx = M0.x + (M1.x - M0.x) * mu + (nx / nl) * wob + 120 * lift;
  const my = M0.y + (M1.y - M0.y) * mu + (ny / nl) * wob - 30 * lift;
  const mo = iv(t, [MAG[0] - 2, MAG[0] + 6], [0, 1]) * iv(t, [FOUND + 18, FOUND + 32], [1, 0]);
  const found = decay(t - FOUND, 10);
  const LR = 54;
  const magnifier =
    mo > 0.01 ? (
      <div key="mag" style={{ position: "absolute", left: mx, top: my, width: 0, height: 0, opacity: mo }}>
        <div style={{ position: "absolute", left: -LR, top: -LR, width: LR * 2, height: LR * 2, borderRadius: "50%", background: `radial-gradient(circle at 40% 35%, rgba(255,255,255,0.22), ${rgba(mixRGB(CYAN, AMBER, found), 0.14 + 0.35 * found)} 70%)`, backdropFilter: "brightness(1.35)" }} />
        <svg width={260} height={260} viewBox="-100 -100 260 260" style={{ position: "absolute", left: -100, top: -100, overflow: "visible" }}>
          <line x1={LR * 0.72} y1={LR * 0.72} x2={LR * 0.72 + 56} y2={LR * 0.72 + 56} stroke="#0B1530" strokeWidth={20} strokeLinecap="round" />
          <line x1={LR * 0.72} y1={LR * 0.72} x2={LR * 0.72 + 56} y2={LR * 0.72 + 56} stroke={rgba(CYAN, 0.9)} strokeWidth={20} strokeLinecap="round" opacity={0.35} />
          <line x1={LR * 0.72 + 4} y1={LR * 0.72 + 4} x2={LR * 0.72 + 52} y2={LR * 0.72 + 52} stroke="rgba(255,255,255,0.45)" strokeWidth={4} strokeLinecap="round" />
          <circle r={LR} fill="none" stroke={rgba(mixRGB(ICE, AMBER_HOT, found), 1)} strokeWidth={9} style={{ filter: `drop-shadow(0 0 ${(8 + 18 * found).toFixed(1)}px ${rgba(mixRGB(CYAN, AMBER, found), 0.95)})` }} />
          <path d={`M${-LR * 0.6} ${-LR * 0.3} A${LR * 0.68} ${LR * 0.68} 0 0 1 ${-LR * 0.15} ${-LR * 0.66}`} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={4} strokeLinecap="round" />
        </svg>
      </div>
    ) : null;

  // ── the cause: a glowing gear ──
  const ga = t - GEAR;
  const gu = iv(ga, [0, 18], [0, 1], EASE_OUT);
  const gFloat = ga > 18 ? Math.sin(g * 0.07) * 4 : 0;
  const gx = CRK.x + (GEAR_P.x - CRK.x) * gu;
  const gy = CRK.y + (GEAR_P.y - CRK.y) * gu + gFloat;
  const gSc = iv(ga, [0, 12, 18], [0.2, 1.15, 1], EASE_OUT) * (1 + 0.06 * bp * live);
  const gRot = ga * 1.4 + 160 * EASE_OUT(clamp01(ga / 20));
  const gear =
    ga >= 0 ? (
      <div key="gear" style={{ position: "absolute", left: gx, top: gy, width: 0, height: 0 }}>
        <div style={{ position: "absolute", left: -110, top: -110, width: 220, height: 220, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(AMBER, 0.45 + 0.3 * decay(ga, 14))}, ${rgba(AMBER, 0)})` }} />
        <svg width={120} height={120} viewBox="-60 -60 120 120" style={{ position: "absolute", left: -60, top: -60, overflow: "visible", transform: `scale(${gSc.toFixed(4)}) rotate(${gRot.toFixed(2)}deg)` }}>
          <defs>
            <radialGradient id="cuGear" cx="0.35" cy="0.3" r="0.85">
              <stop offset="0" stopColor="#FFF1C9" />
              <stop offset="0.5" stopColor="#FBBF24" />
              <stop offset="1" stopColor="#D97706" />
            </radialGradient>
          </defs>
          <path d={GEAR_D} fill="url(#cuGear)" stroke="#FFF7E0" strokeWidth={2} strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 12px rgba(245,158,11,0.95))" }} />
          <circle r={11} fill="#0B1530" stroke="#FFF7E0" strokeWidth={2} />
        </svg>
      </div>
    ) : null;
  const causeLbl = <Pill key="cause" cx={GEAR_P.x + 108} cy={GEAR_P.y + gFloat} text="cause" col={AMBER} o={iv(ga, [8, 16], [0, 1])} sc={iv(ga, [8, 18], [0.6, 1], EASE_OUT)} fs={26} />;

  // ── the fix: check + team pulse + confetti ──
  const cp = iv(fixAge, [0, 10], [0, 1], EASE_OUT);
  const cOver = fixAge >= 0 ? 1 + 0.28 * Math.sin(clamp01(fixAge / 12) * Math.PI) : 0;
  const cDraw = iv(fixAge, [3, 12], [0, 1], EASE_OUT);
  const check =
    cp > 0 ? (
      <div key="check" style={{ position: "absolute", left: SV.x + SV.w - 22, top: SV.y - 26, width: 52, height: 52, borderRadius: "50%", opacity: cp, transform: `scale(${(cp * cOver).toFixed(3)})`, background: "radial-gradient(circle at 40% 35%, rgba(52,211,153,0.5), rgba(16,80,60,0.9))", border: "3px solid #34D399", boxShadow: `0 0 ${(18 + 12 * bp).toFixed(1)}px rgba(52,211,153,0.75)` }}>
        <svg width={52} height={52} viewBox="0 0 52 52" style={{ position: "absolute", left: -3, top: -3 }}>
          <path d="M15 27 L23 35 L38 18" fill="none" stroke="#ECFDF5" strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - cDraw} />
        </svg>
      </div>
    ) : null;
  const confetti =
    fixAge >= 0 && fixAge < 40 ? (
      <svg key="confetti" width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {Array.from({ length: 22 }, (_, j) => {
          const ang = -Math.PI / 2 + (rand(j * 5.9 + 3) - 0.5) * Math.PI * 1.3;
          const v = 7 + rand(j * 2.3) * 8;
          const x = 380 + Math.cos(ang) * v * fixAge;
          const y = 450 + Math.sin(ang) * v * fixAge + 0.3 * fixAge * fixAge;
          const col = [CYAN, OPS, GREEN, ICE][j % 4];
          const o = iv(fixAge, [0, 26, 40], [1, 0.9, 0]);
          return <rect key={j} x={x - 5} y={y - 3} width={10} height={6} rx={2} fill={rgba(col, o)} transform={`rotate(${(fixAge * (rand(j) - 0.5) * 30).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`} />;
        })}
      </svg>
    ) : null;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: k !== 1 ? `scale(${k})` : undefined, transformOrigin: "0 0" }}>
      {/* floor glow under the teams */}
      <div style={{ position: "absolute", left: 40, top: BASE - 40, width: 680, height: 90, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, 0.16 * teamA)}, rgba(34,211,238,0))` }} />
      <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {rays}
      </svg>
      {target}
      <Pill cx={TC.x} cy={TC.y + TR + 34} text="même but" col={CYAN} o={iv(t, [TGT + 10, TGT + 18], [0, 1])} sc={iv(t, [TGT + 10, TGT + 20], [0.6, 1], EASE_OUT)} fs={26} />
      {server}
      {avatars}
      {wall}
      {shards}
      <Shockwave age={sa} x={IMPACT.x} y={IMPACT.y} dur={22} maxR={340} r0={20} strength={0.9} />
      <Bloom x={IMPACT.x} y={IMPACT.y} rx={220} ry={300} col={ICE} a={0.45 * decay(sa, 5)} />
      <Bloom x={CRK.x} y={CRK.y - 20} rx={260} ry={220} col={RED} a={0.42 * decay(t - BREAK, 9)} />
      <Bloom x={CRK.x} y={CRK.y} rx={200} ry={200} col={AMBER} a={0.4 * found} />
      <Shockwave age={fixAge} x={380} y={500} col={GREEN} dur={30} maxR={380} r0={40} strength={0.8} />
      {sparks}
      {gear}
      {causeLbl}
      {magnifier}
      {check}
      {confetti}
      {finger}
      {blameLbl}
      {/* team chips */}
      <Pill cx={devX} cy={BASE + 34} text="dev" col={CYAN} o={teamA} fs={24} />
      <Pill cx={opsX} cy={BASE + 34} text="ops" col={OPS} o={teamA} fs={24} />
    </div>
  );
};
