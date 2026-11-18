import React from "react";
import { Logo } from "../kit/Logo";
import { fontInter, fontMono } from "../kit/fonts";
import { B, glass } from "../lib/look";
import { beatPulse, rand } from "../lib/sync";
import { AMBER, AMBER_HOT, clamp01, CYAN, decay, EASE_IN, EASE_IN_OUT, EASE_OUT, ICE, iv, rgba, type RGB } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/**
 * CI (GitHub Actions / Jenkins / GitLab — the `logo` prop decides the chest logo):
 * « un robot construit et teste à chaque modif ».
 *   0     a code block « v1 » drops onto the conveyor belt (squash), the glass robot watches it (eyes follow).
 *   12    belt carries it under « build »: gears whirl, sparks fly, its code lines light up, a package badge appears.
 *   46    on to « test »: a scanner beam sweeps it, the checklist ticks build · tests · qualité.
 *   88    it reaches the exit: a big green ✓ stamp slams on it (shockwave, sparks), the robot raises its arm.
 *   104   « v2 » drops in and goes through the same pipeline (à chaque modif), then v3…
 *   idle  belt keeps crawling, eyes blink, antenna light pulses, gears idle.
 */
const OK: RGB = [52, 211, 153];
const P = 104; // one block every P frames
const BELT = 600; // belt top surface
const X0 = 76; // drop point
const BX = 270; // build station
const TX = 500; // test station
const EX = 672; // exit / stamp
const BW = 128;
const BH = 96;
const RX = 190; // robot centre x

const bump = (u: number, a: number, b: number, c: number, d: number) => iv(u, [a, b, c, d], [0, 1, 1, 0]);

const blockX = (u: number) => {
  if (u < 12) return X0;
  if (u < 46) return iv(u, [12, 28], [X0, BX], EASE_IN_OUT);
  if (u < 76) return iv(u, [46, 58], [BX, TX], EASE_IN_OUT);
  if (u < 112) return iv(u, [76, 88], [TX, EX], EASE_IN_OUT);
  return iv(u, [112, 132], [EX, 770], EASE_IN);
};

const gearPath = (r: number, n: number, h: number) => {
  const s = (Math.PI * 2) / n;
  const pt = (a: number, rr: number) => `${(Math.cos(a) * rr).toFixed(2)} ${(Math.sin(a) * rr).toFixed(2)}`;
  let d = "";
  for (let k = 0; k < n; k++) {
    const a = k * s;
    d += `${k ? "L" : "M"}${pt(a, r)} L${pt(a + s * 0.12, r + h)} L${pt(a + s * 0.42, r + h)} L${pt(a + s * 0.54, r)} `;
  }
  return d + "Z";
};
const GEAR_A = gearPath(30, 10, 9);
const GEAR_B = gearPath(20, 8, 7);

const Gear: React.FC<{ x: number; y: number; d: string; rot: number; r: number; hot: number }> = ({ x, y, d, rot, r, hot }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot.toFixed(2)})`}>
    <path d={d} fill="url(#ciGear)" stroke={rgba(ICE, 0.75 + 0.25 * hot)} strokeWidth={2} strokeLinejoin="round" />
    <circle r={r * 0.42} fill="#071226" stroke={rgba(CYAN, 0.7)} strokeWidth={2} />
    <circle r={r * 0.14} fill={rgba(ICE, 0.9)} />
    {[0, 1, 2].map((k) => (
      <line key={k} x1={0} y1={0} x2={Math.cos((k * 2 * Math.PI) / 3) * r * 0.42} y2={Math.sin((k * 2 * Math.PI) / 3) * r * 0.42} stroke={rgba(CYAN, 0.6)} strokeWidth={2} />
    ))}
  </g>
);

const Status: React.FC<{ state: "idle" | "run" | "done"; age: number; t: number }> = ({ state, age, t }) => {
  const s = 40;
  if (state === "done") {
    const p = iv(age, [0, 6, 10], [0.4, 1.18, 1], EASE_OUT);
    return (
      <svg width={s} height={s} viewBox="-20 -20 40 40" style={{ overflow: "visible", transform: `scale(${p.toFixed(3)})` }}>
        <circle r={19} fill={rgba(OK, 0.95)} style={{ filter: `drop-shadow(0 0 ${(8 + 14 * decay(age, 8)).toFixed(1)}px ${rgba(OK, 0.7)})` }} />
        <path d="M-9 0 L-3 7 L10 -7" fill="none" stroke="#FFFFFF" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - iv(age, [1, 8], [0, 1], EASE_OUT)} />
      </svg>
    );
  }
  return (
    <svg width={s} height={s} viewBox="-20 -20 40 40" style={{ overflow: "visible" }}>
      <circle r={17} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={3.5} />
      {state === "run" ? (
        <circle r={17} fill="none" stroke={B.cyan} strokeWidth={3.5} strokeLinecap="round" pathLength={1} strokeDasharray="0.3 0.7" transform={`rotate(${(t * 14) % 360})`} style={{ filter: `drop-shadow(0 0 6px ${rgba(CYAN, 0.8)})` }} />
      ) : null}
    </svg>
  );
};

export const CiFx: ToolFx = ({ g, f0, beats, size, logo }) => {
  const t = g - f0;
  const bp = beatPulse(g, 14);
  const lastBeat = beats.filter((b) => b <= g).pop();
  const beatK = lastBeat === undefined ? 0 : decay(g - lastBeat, 8);

  // ── blocks alive now ──
  const latest = t < 0 ? -1 : Math.floor(t / P);
  const blocks: { i: number; u: number }[] = [];
  for (let i = Math.max(0, latest - 1); i <= latest; i++) {
    const u = t - i * P;
    if (u >= 0 && u <= 134) blocks.push({ i, u });
  }
  const us = (i: number) => t - i * P;
  // belt travel: base crawl + the steps of every block so far
  let travel = 0;
  for (let i = 0; i <= latest; i++) travel += Math.min(blockX(us(i)), EX) - X0;
  const beltOff = t * 0.9 + travel;

  // station activity
  let buildA = 0;
  let testA = 0;
  let happy = 0;
  let turns = 0;
  for (let i = 0; i <= latest; i++) {
    const u = us(i);
    buildA = Math.max(buildA, bump(u, 25, 30, 44, 49));
    testA = Math.max(testA, bump(u, 55, 59, 75, 79));
    happy = Math.max(happy, bump(u, 87, 90, 112, 120));
    turns += iv(u, [28, 46], [0, 1], EASE_IN_OUT);
  }
  const gearRot = t * 1.4 + turns * 900;
  const testU = blocks.find((b) => b.u >= 55 && b.u <= 79)?.u ?? -1;
  const scanY = testU < 0 ? BELT - BH / 2 : BELT - BH + 6 + (BH - 12) * (0.5 - 0.5 * Math.cos(((testU - 58) / 18) * Math.PI * 2));

  // checklist follows the block that is in (or past) the pipeline
  let cur = -1;
  for (let i = latest; i >= 0; i--) if (us(i) >= 22) { cur = i; break; }
  const uc = cur < 0 ? -1 : us(cur);
  const rows: { label: string; run: [number, number] }[] = [
    { label: "build", run: [28, 46] },
    { label: "tests", run: [58, 70] },
    { label: "qualité", run: [64, 76] },
  ];
  const allDone = cur < 0 ? 0 : decay(uc - 88, 12);

  // focus for the robot's eyes: the newest block that is still on the belt
  const fb = [...blocks].reverse().find((b) => b.u < 112) ?? blocks[blocks.length - 1];
  const focusX = fb ? blockX(fb.u) : BX;
  const look = Math.max(-1, Math.min(1, (focusX - RX) / 380));

  // entrances (the stage itself slides in; this is just the build-up)
  const eRobot = iv(t, [0, 16], [0, 1], EASE_OUT);
  const eList = iv(t, [4, 20], [0, 1], EASE_OUT);
  const eStation = iv(t, [0, 14], [0, 1], EASE_OUT);

  // ── robot ──
  const bob = Math.sin(t * 0.075) * 6;
  const bt = (t + 34) % 72;
  const blink = bt < 7 ? Math.sin((bt / 7) * Math.PI) : 0;
  const ant = 0.55 + 0.25 * (0.5 + 0.5 * Math.sin(t * 0.16)) + 0.3 * bp + 0.4 * beatK;
  const armUp = iv(happy, [0, 1], [0, 1], EASE_OUT);
  const wave = Math.sin(t * 0.45) * 14 * armUp;
  const progress = cur < 0 ? 0 : iv(uc, [12, 88], [0, 1]);

  const station = (cx: number, label: string, active: number, children: React.ReactNode) => (
    <>
      <div
        style={{
          ...glass("34,211,238", 0.5 + active),
          position: "absolute",
          left: cx - 100,
          top: 410,
          width: 200,
          height: 82,
          borderRadius: 22,
          overflow: "hidden",
          opacity: eStation,
          transform: `translateY(${((1 - eStation) * -30).toFixed(1)}px)`,
          border: `1.5px solid ${rgba(CYAN, 0.25 + 0.5 * active)}`,
        }}
      >
        <div style={{ position: "absolute", left: 14, top: 10, fontFamily: fontInter, fontWeight: 800, fontSize: 19, letterSpacing: "0.16em", textTransform: "uppercase", color: rgba(CYAN, 0.75 + 0.25 * active) }}>{label}</div>
        {children}
      </div>
    </>
  );

  const posts = (cx: number) =>
    [-86, 74].map((dx) => (
      <div key={dx} style={{ position: "absolute", left: cx + dx, top: 490, width: 12, height: BELT - 490, borderRadius: 4, opacity: eStation, background: "linear-gradient(90deg, rgba(120,200,255,0.25), rgba(200,240,255,0.55), rgba(60,120,190,0.25))", boxShadow: "0 0 10px rgba(34,211,238,0.15)" }} />
    ));

  // ── sparks of the build station ──
  const sparks: React.ReactNode[] = [];
  for (const { i, u } of blocks) {
    for (let k = 0; k < 34; k++) {
      const born = 28 + k * 0.5;
      const age = u - born;
      if (age < 0 || age > 18) continue;
      const r1 = rand(i * 131 + k * 7.3);
      const r2 = rand(i * 71 + k * 3.1 + 5);
      const r3 = rand(i * 17 + k * 11.7 + 9);
      const ang = -Math.PI / 2 + (r1 - 0.5) * 2.6;
      const sp = 5 + r2 * 7;
      const vx = Math.cos(ang) * sp;
      const vy = Math.sin(ang) * sp;
      const x = BX + (r3 - 0.5) * 70 + vx * age;
      const y = BELT - BH - 2 + vy * age + 0.42 * age * age;
      const cvy = vy + 0.84 * age;
      const a = iv(age, [0, 2, 18], [0, 1, 0]);
      const hot = k % 3 === 0;
      sparks.push(<line key={`${i}-${k}`} x1={x} y1={y} x2={x - vx * 1.6} y2={y - cvy * 1.6} stroke={rgba(hot ? AMBER_HOT : ICE, a)} strokeWidth={hot ? 3.2 : 2.6} strokeLinecap="round" />);
    }
  }

  // ── block card ──
  const block = (i: number, u: number) => {
    const x = blockX(u);
    const drop = iv(u, [0, 12], [0, 1], EASE_IN);
    const land = u >= 12 ? Math.sin((u - 12) * 0.55) * Math.exp(-(u - 12) / 5) : 0;
    const stopK = [28, 58, 88].reduce((s, at) => s + (u >= at ? Math.sin((u - at) * 0.7) * Math.exp(-(u - at) / 4) * 0.35 : 0), 0);
    const sq = land + stopK;
    const o = clamp01(u / 5) * iv(x, [700, 760], [1, 0]);
    const heat = bump(u, 28, 32, 42, 50);
    const built = iv(u, [44, 50], [0, 1], EASE_OUT);
    const scanned = bump(u, 57, 60, 74, 78);
    const passed = iv(u, [88, 92], [0, 1]);
    const lineLit = (k: number) => clamp01((u - 30 - k * 4) / 5);
    const rim = passed > 0 ? rgba(OK, 0.6 + 0.4 * decay(u - 88, 10)) : rgba(heat > 0.05 ? ICE : CYAN, 0.35 + 0.5 * Math.max(heat, scanned));
    const bars: [number, string][] = [
      [70, rgba(CYAN, 0.85)],
      [52, "rgba(255,255,255,0.5)"],
      [88, rgba(CYAN, 0.6)],
    ];
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x - BW / 2,
          top: BELT - BH + (1 - drop) * -130,
          width: BW,
          height: BH,
          opacity: o,
          transformOrigin: "50% 100%",
          transform: `scale(${(1 + 0.14 * sq).toFixed(3)}, ${(1 - 0.14 * sq).toFixed(3)})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 18,
            background: "linear-gradient(150deg, rgba(22,44,82,0.96), rgba(8,18,38,0.96))",
            border: `2px solid ${rim}`,
            boxShadow: `0 12px 26px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.3), 0 0 ${(18 + 40 * Math.max(heat, scanned, passed * 0.8)).toFixed(0)}px ${passed > 0 ? rgba(OK, 0.45) : rgba(heat > 0.05 ? ICE : CYAN, 0.25 + 0.35 * Math.max(heat, scanned))}`,
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", left: 10, top: 9, padding: "2px 9px", borderRadius: 9, background: rgba(CYAN, 0.18), border: `1px solid ${rgba(CYAN, 0.45)}`, fontFamily: fontMono, fontWeight: 700, fontSize: 17, color: B.white }}>v{i + 1}</div>
          <div style={{ position: "absolute", right: 11, top: 10, fontFamily: fontMono, fontWeight: 700, fontSize: 18, color: rgba(CYAN, 0.9) }}>{"</>"}</div>
          {bars.map(([w, c], k) => (
            <div key={k} style={{ position: "absolute", left: 12, top: 46 + k * 15, width: w, height: 8, borderRadius: 4, background: lineLit(k) > 0 ? `linear-gradient(90deg, ${rgba(ICE, 0.95 * lineLit(k))}, ${c})` : c, boxShadow: lineLit(k) > 0 && heat > 0 ? `0 0 10px ${rgba(ICE, 0.8 * heat)}` : undefined }} />
          ))}
          {/* package badge once built */}
          <svg width={34} height={34} viewBox="-17 -17 34 34" style={{ position: "absolute", right: 8, bottom: 8, opacity: built, transform: `scale(${(0.4 + 0.6 * built + 0.25 * decay(u - 46, 6)).toFixed(3)})` }}>
            <path d="M0 -13 L12 -6 L12 7 L0 14 L-12 7 L-12 -6 Z" fill={rgba(CYAN, 0.25)} stroke={B.cyan} strokeWidth={2.2} strokeLinejoin="round" />
            <path d="M-12 -6 L0 1 L12 -6 M0 1 L0 14" fill="none" stroke={B.cyan} strokeWidth={2.2} strokeLinejoin="round" />
          </svg>
          {/* sheen */}
          <div style={{ position: "absolute", top: 0, bottom: 0, width: 50, left: -60 + 260 * iv(u, [44, 54], [0, 1]), background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.35), rgba(255,255,255,0))", transform: "skewX(-18deg)" }} />
        </div>
      </div>
    );
  };

  const stamp = (i: number, u: number) => {
    const age = u - 88;
    if (age < 0) return null;
    const x = blockX(u);
    const o = iv(age, [0, 3], [0, 1]) * iv(x, [700, 760], [1, 0]);
    const s = iv(age, [0, 6, 10, 14], [2.4, 0.86, 1.06, 1], EASE_OUT);
    const cy = BELT - BH / 2 - 14;
    return (
      <g key={`st${i}`} transform={`translate(${x.toFixed(1)} ${cy}) rotate(-12) scale(${s.toFixed(3)})`} opacity={o}>
        <circle r={74} fill={rgba(OK, 0.18 * decay(age, 14))} />
        <circle r={58} fill="url(#ciOk)" stroke="#BBF7D0" strokeWidth={3} style={{ filter: `drop-shadow(0 0 ${(16 + 30 * decay(age, 10)).toFixed(0)}px ${rgba(OK, 0.8)})` }} />
        <circle r={49} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2} strokeDasharray="5 5" />
        <path d="M-24 2 L-7 19 L26 -17" fill="none" stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  };

  const greenSparks: React.ReactNode[] = [];
  for (const { i, u } of blocks) {
    const age = u - 88;
    if (age < 0 || age > 26) continue;
    const x = blockX(u);
    for (let k = 0; k < 14; k++) {
      const ang = (k / 14) * Math.PI * 2 + rand(i * 9 + k) * 0.4;
      const R = 56 + iv(age, [0, 26], [0, 80], EASE_OUT) * (0.7 + 0.5 * rand(i * 3 + k * 5));
      const a = iv(age, [0, 2, 26], [0, 1, 0]);
      const px = x + Math.cos(ang) * R;
      const py = BELT - BH / 2 - 14 + Math.sin(ang) * R;
      greenSparks.push(<circle key={`${i}-${k}`} cx={px} cy={py} r={k % 2 ? 3.2 : 4.6} fill={rgba(k % 3 ? OK : ICE, a)} />);
    }
  }

  // belt marks
  const marks: React.ReactNode[] = [];
  const step = 42;
  const off = ((beltOff % step) + step) % step;
  for (let k = -1; k < 20; k++) {
    const x = 20 + k * step + off;
    if (x < 26 || x > 730) continue;
    marks.push(<path key={k} d={`M${x.toFixed(1)} 611 l11 8 l-11 8`} fill="none" stroke={rgba(CYAN, 0.45)} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />);
  }
  const rollerRot = (beltOff / 14) * (180 / Math.PI);

  const stampAgeLatest = blocks.reduce((m, b) => (b.u >= 88 ? Math.min(m, b.u - 88) : m), 999);
  const stampedX = blocks.find((b) => b.u >= 88)?.u;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: size, height: size }}>
      {/* floor light */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 560, height: 200, background: `radial-gradient(50% 40% at 50% 40%, ${rgba(CYAN, 0.12 + 0.05 * bp)}, rgba(0,0,0,0))` }} />

      {/* belt */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="ciBelt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1B3358" />
            <stop offset="0.25" stopColor="#0D1B36" />
            <stop offset="1" stopColor="#060D1E" />
          </linearGradient>
          <radialGradient id="ciGear" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#CFF6FF" />
            <stop offset="0.5" stopColor="#3FB8D8" />
            <stop offset="1" stopColor="#0E4A6A" />
          </radialGradient>
          <radialGradient id="ciOk" cx="0.35" cy="0.3" r="0.85">
            <stop offset="0" stopColor="#6EE7B7" />
            <stop offset="1" stopColor="#059669" />
          </radialGradient>
          <linearGradient id="ciCone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={rgba(CYAN, 0.45)} />
            <stop offset="1" stopColor={rgba(CYAN, 0.04)} />
          </linearGradient>
        </defs>
        {[70, 380, 690].map((x) => (
          <rect key={x} x={x - 7} y={636} width={14} height={64} rx={4} fill="rgba(120,180,240,0.22)" />
        ))}
        <rect x={20} y={699} width={720} height={2} fill={rgba(CYAN, 0.25)} />
        <rect x={16} y={BELT - 6} width={728} height={44} rx={22} fill="url(#ciBelt)" stroke={rgba(CYAN, 0.45)} strokeWidth={2} />
        <rect x={36} y={BELT - 5} width={688} height={5} rx={2.5} fill="rgba(200,240,255,0.22)" />
        {marks}
        {[38, 722].map((x) => (
          <g key={x} transform={`translate(${x} ${BELT + 16}) rotate(${rollerRot.toFixed(1)})`}>
            <circle r={15} fill="#0B1A33" stroke={rgba(ICE, 0.7)} strokeWidth={2.5} />
            <line x1={-11} y1={0} x2={11} y2={0} stroke={rgba(CYAN, 0.8)} strokeWidth={2.5} />
            <line x1={0} y1={-11} x2={0} y2={11} stroke={rgba(CYAN, 0.8)} strokeWidth={2.5} />
          </g>
        ))}
      </svg>

      {/* stations */}
      {station(
        BX,
        "build",
        buildA,
        <svg width={200} height={82} style={{ position: "absolute", left: 0, top: 0 }}>
          <Gear x={142} y={48} d={GEAR_A} r={30} rot={gearRot} hot={buildA} />
          <Gear x={192} y={21} d={GEAR_B} r={20} rot={-gearRot * 1.5 + 9} hot={buildA} />
          <circle cx={26} cy={58} r={6} fill={buildA > 0.1 ? rgba(AMBER_HOT, 0.6 + 0.4 * Math.sin(t * 0.8)) : rgba(CYAN, 0.35)} />
        </svg>,
      )}
      {station(
        TX,
        "test",
        testA,
        <svg width={200} height={82} style={{ position: "absolute", left: 0, top: 0 }}>
          {[0, 1, 2, 3, 4].map((k) => (
            <rect key={k} x={128 + k * 12} y={22} width={7} height={22} rx={3} fill={rgba(CYAN, 0.25 + 0.6 * testA * (0.5 + 0.5 * Math.sin(t * 0.9 + k)))} />
          ))}
          <rect x={58} y={66} width={84} height={8} rx={4} fill={rgba(ICE, 0.35 + 0.65 * testA)} style={{ filter: `drop-shadow(0 0 ${(4 + 12 * testA).toFixed(0)}px ${rgba(CYAN, 0.9)})` }} />
        </svg>,
      )}

      {/* blocks */}
      {blocks.map(({ i, u }) => block(i, u))}

      {/* scanner + sparks + stamps (over the blocks) */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
        <polygon points={`${TX - 42},492 ${TX + 42},492 ${TX + 80},${BELT} ${TX - 80},${BELT}`} fill="url(#ciCone)" opacity={0.15 + 0.85 * testA} style={{ mixBlendMode: "screen" }} />
        {testA > 0.02 ? (
          <>
            <rect x={TX - 82} y={scanY - 9} width={164} height={18} rx={9} fill={rgba(CYAN, 0.25 * testA)} style={{ mixBlendMode: "screen" }} />
            <rect x={TX - 80} y={scanY - 2} width={160} height={4} rx={2} fill={rgba(ICE, testA)} style={{ filter: `drop-shadow(0 0 8px ${rgba(CYAN, 1)})` }} />
          </>
        ) : null}
        <rect x={BX - 70} y={492} width={140} height={BELT - 492} fill={rgba(ICE, 0.1 * buildA)} style={{ mixBlendMode: "screen" }} />
        {sparks}
        {greenSparks}
        {stampAgeLatest < 24 && stampedX !== undefined ? (
          <circle cx={blockX(stampedX)} cy={BELT - BH / 2 - 14} r={60 + 150 * iv(stampAgeLatest, [0, 24], [0, 1], EASE_OUT)} fill="none" stroke={rgba(OK, 0.7 * iv(stampAgeLatest, [0, 2, 24], [0, 1, 0]))} strokeWidth={10 * iv(stampAgeLatest, [0, 24], [1, 0.2])} style={{ filter: `drop-shadow(0 0 12px ${rgba(OK, 0.9)})` }} />
        ) : null}
        {blocks.map(({ i, u }) => stamp(i, u))}
      </svg>

      {/* station posts in front */}
      {posts(BX)}
      {posts(TX)}

      {/* robot */}
      <div style={{ position: "absolute", left: 0, top: 0, width: size, height: 420, opacity: eRobot, transform: `translateY(${(bob + (1 - eRobot) * 30).toFixed(2)}px) scale(${(0.9 + 0.1 * eRobot).toFixed(3)})`, transformOrigin: `${RX}px 300px` }}>
        {/* hover glow */}
        <div style={{ position: "absolute", left: RX - 90, top: 352 - bob, width: 180, height: 36, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, 0.35 + 0.1 * Math.sin(t * 0.3))}, rgba(0,0,0,0))` }} />
        {/* antenna */}
        <div style={{ position: "absolute", left: RX - 3, top: 14, width: 6, height: 34, borderRadius: 3, background: "linear-gradient(180deg, rgba(200,240,255,0.8), rgba(120,180,230,0.4))" }} />
        <div style={{ position: "absolute", left: RX - 12, top: 2, width: 24, height: 24, borderRadius: 12, background: `radial-gradient(circle at 38% 35%, #FFF3D6, ${B.amber} 60%)`, boxShadow: `0 0 ${(10 + 26 * ant).toFixed(0)}px ${rgba(AMBER, 0.45 + 0.4 * clamp01(ant))}` }} />
        {/* arms (behind body) */}
        <div style={{ ...glass("34,211,238", 0.3), position: "absolute", left: RX - 84 - 30, top: 200, width: 32, height: 108, borderRadius: 16, border: `1.5px solid ${rgba(CYAN, 0.35)}`, transformOrigin: "16px 14px", transform: `rotate(${(14 + Math.sin(t * 0.07) * 4).toFixed(2)}deg)` }} />
        <div style={{ ...glass("34,211,238", 0.3 + 0.6 * armUp), position: "absolute", left: RX + 84 - 2, top: 200, width: 32, height: 108, borderRadius: 16, border: `1.5px solid ${rgba(CYAN, 0.35 + 0.4 * armUp)}`, transformOrigin: "16px 14px", transform: `rotate(${(-14 - 150 * armUp + wave + Math.sin(t * 0.07 + 1) * 4 * (1 - armUp)).toFixed(2)}deg)` }} />
        {/* ears */}
        {[-1, 1].map((s) => (
          <div key={s} style={{ position: "absolute", left: RX + s * 104 - 13, top: 94, width: 26, height: 40, borderRadius: 10, background: "linear-gradient(180deg, #7DD3FC, #0E7490)", boxShadow: `0 0 14px ${rgba(CYAN, 0.4)}` }} />
        ))}
        {/* head */}
        <div style={{ ...glass("34,211,238", 0.8), position: "absolute", left: RX - 100, top: 46, width: 200, height: 134, borderRadius: 46 }}>
          <div style={{ position: "absolute", left: 20, top: 18, width: 160, height: 80, borderRadius: 32, background: "linear-gradient(180deg, #030814, #0A1730)", boxShadow: `inset 0 0 22px ${rgba(CYAN, 0.25)}, inset 0 2px 0 rgba(255,255,255,0.08)`, overflow: "hidden" }}>
            {[-1, 1].map((s) =>
              happy > 0.3 ? (
                <svg key={s} width={44} height={30} viewBox="-22 -15 44 30" style={{ position: "absolute", left: 80 + s * 34 - 22 + look * 8, top: 26 }}>
                  <path d="M-14 8 Q0 -12 14 8" fill="none" stroke="#A5F3FC" strokeWidth={7} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${rgba(CYAN, 0.9)})` }} />
                </svg>
              ) : (
                <div key={s} style={{ position: "absolute", left: 80 + s * 34 - 14 + look * 10, top: 20, width: 28, height: 40, borderRadius: 14, background: "radial-gradient(circle at 40% 35%, #F0FDFF, #67E8F9 55%, #0891B2)", boxShadow: `0 0 16px ${rgba(CYAN, 0.9)}`, transform: `scaleY(${(1 - 0.92 * blink).toFixed(3)})` }} />
              ),
            )}
          </div>
          <svg width={60} height={22} viewBox="-30 -11 60 22" style={{ position: "absolute", left: 70, top: 104 }}>
            <path d={`M-16 ${(-3 - 2 * happy).toFixed(1)} Q0 ${(4 + 8 * happy).toFixed(1)} 16 ${(-3 - 2 * happy).toFixed(1)}`} fill="none" stroke={rgba(ICE, 0.85)} strokeWidth={4} strokeLinecap="round" />
          </svg>
        </div>
        {/* neck */}
        <div style={{ position: "absolute", left: RX - 22, top: 180, width: 44, height: 14, borderRadius: 4, background: "linear-gradient(90deg, #0E4A6A, #7DD3FC, #0E4A6A)" }} />
        {/* body */}
        <div style={{ ...glass("34,211,238", 0.8 + 0.6 * happy), position: "absolute", left: RX - 84, top: 192, width: 168, height: 156, borderRadius: 40 }}>
          <div style={{ position: "absolute", left: 84 - 46, top: 14, width: 92, height: 92, transform: `scale(${(1 + 0.05 * bp + 0.08 * happy).toFixed(3)})` }}>
            <Logo name={logo} size={92} glow={0.35 + 0.4 * happy} glowColor={happy > 0.2 ? "52,211,153" : "34,211,238"} />
          </div>
          <div style={{ position: "absolute", left: 24, top: 124, width: 120, height: 10, borderRadius: 5, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
            <div style={{ width: `${(progress * 100).toFixed(1)}%`, height: "100%", borderRadius: 5, background: progress >= 1 ? B.ok : `linear-gradient(90deg, ${B.cyan}, #A5F3FC)`, boxShadow: `0 0 10px ${progress >= 1 ? rgba(OK, 0.8) : rgba(CYAN, 0.8)}` }} />
          </div>
        </div>
      </div>

      {/* checklist */}
      <div
        style={{
          ...glass(allDone > 0.05 ? "52,211,153" : "34,211,238", 0.7 + allDone),
          position: "absolute",
          left: 408,
          top: 66,
          width: 326,
          height: 272,
          borderRadius: 28,
          opacity: eList,
          transform: `translateX(${((1 - eList) * 40).toFixed(1)}px) translateY(${(Math.sin(t * 0.06 + 1) * 3).toFixed(2)}px)`,
          border: `1.5px solid ${allDone > 0.05 ? rgba(OK, 0.3 + 0.6 * allDone) : "rgba(255,255,255,0.11)"}`,
        }}
      >
        <div style={{ position: "absolute", left: 22, top: 18, right: 22, height: 40, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: cur >= 0 && uc < 88 ? B.cyan : B.ok, boxShadow: `0 0 10px ${cur >= 0 && uc < 88 ? rgba(CYAN, 0.9) : rgba(OK, 0.9)}`, opacity: 0.6 + 0.4 * Math.sin(t * 0.2) }} />
          <div style={{ fontFamily: fontInter, fontWeight: 700, fontSize: 19, letterSpacing: "0.16em", textTransform: "uppercase", color: B.text3 }}>pipeline</div>
          <div style={{ flex: 1 }} />
          <div style={{ overflow: "hidden", height: 36, borderRadius: 10, padding: "0 12px", background: rgba(CYAN, 0.14), border: `1px solid ${rgba(CYAN, 0.4)}`, display: "flex", alignItems: "center" }}>
            <div style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 21, color: B.white, transform: `translateY(${(cur < 0 ? 0 : (1 - iv(uc, [22, 30], [0, 1], EASE_OUT)) * 30).toFixed(1)}px)` }}>v{Math.max(1, cur + 1)}</div>
          </div>
        </div>
        {rows.map((r, k) => {
          const state = cur < 0 || uc < r.run[0] ? "idle" : uc < r.run[1] ? "run" : "done";
          return (
            <div key={r.label} style={{ position: "absolute", left: 22, right: 22, top: 76 + k * 62, height: 54, display: "flex", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ flex: 1, fontFamily: fontInter, fontWeight: 700, fontSize: 30, letterSpacing: "-0.02em", color: state === "idle" ? B.text3 : B.white }}>{r.label}</div>
              <Status state={state} age={uc - r.run[1]} t={t} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
