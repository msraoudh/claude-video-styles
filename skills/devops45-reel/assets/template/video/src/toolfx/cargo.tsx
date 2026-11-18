import React from "react";
import { Logo } from "../kit/Logo";
import { fontInter, fontMono } from "../kit/fonts";
import { beatPulse, rand } from "../lib/sync";
import { AMBER, AnamorphicFlare, clamp01, CYAN, decay, EASE_IN, EASE_IN_OUT, EASE_OUT, ICE, iv, rgba, Shockwave, type RGB } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/*
 * Concept « cargo » — ep. 9 « Docker, c'est quoi ? »: « Pense aux conteneurs des cargos : une boîte standard, qui voyage
 * pareil sur n'importe quel bateau. Docker fait pareil pour une appli. Dans la boîte : ton code, tout ce dont il a
 * besoin, et ses réglages. » (no tool logo in the contract; the real Docker whale is stamped on the box)
 * A harbour at night: a glass sea (reflections, waves, glints), a glass cargo ship, a lattice crane.
 *   0–44    the crane lowers a ribbed Docker-blue shipping container (swaying, then the last few px drop) onto the
 *           ship's dashed slot → 44 heavy THUNK: squash, the ship dips, ripples + droplets, shockwave, camera shake,
 *           corner brackets snap round it (« standard »); 56–84 the spreader lets go and the crane slides away.
 *   TB      « bateau »: the camera pulls back while a small boat and a big ship (two muted containers + one stacked)
 *           sail in from the right, each with a dashed slot of exactly the same size. TB+8 → +26 the same container
 *           hops (dotted route arc) onto the small boat (it dips hard), TB+32 → +52 onto the big ship, stacked on top
 *           of another container — brackets snap each time: it fits identically everywhere.
 *   TA      « appli »: the container lifts off and flies to the centre, growing; the world dims and sinks; the steel
 *           turns to glass (light sweep); TA+30 the real Docker logo stamps on its side (amber ring, sparks, flare).
 *   TO      « boîte »: the logo lifts to the roof as a badge, the side doors swing open toward us (3D), the inside
 *           lights up; three labelled layers drop in and stack, each with a pop: « ton code » (</>), « ce dont il a
 *           besoin » (libs), « réglages » (gear); the badge glows amber when the box is complete.
 *   idle    ships bob and roll, waves run, a light runs along the routes / the ribs / up the layers, the box hovers.
 * Phase words (episode item `beats`): a first beat < 40 frames after f0 is « conteneurs » (ignored). Then
 *   3 → [bateau, appli, boîte]   4 → [bateau, appli, boîte, code]   5 → [bateau, appli, code, besoin, réglages]
 *   6 → [bateau, appli, boîte, code, besoin, réglages]   anything else → 36 / 56 / 64 % of the item.
 * Gaps are clamped so every phase has room (TB ≥ 66, TA ≥ TB+58, TO ≥ TA+36, layers ≥ 12 apart); without layer beats
 * the layers spread over the rest of the item. cargo.sfx.json: the thunk (+44) is exact; the hop whooshes and the
 * first layer pop are timed on an ESTIMATE of ep. 9 (« bateau » ≈ +296, « code » ≈ +566) — re-time them on the voice.
 * Drawn in a 760 design space. World (sea, ships, crane) is in world units, seen through a 2D camera.
 */

const DK: RGB = [36, 150, 237]; // Docker blue
const SLATE: RGB[] = [
  [98, 120, 152],
  [64, 116, 140],
  [88, 98, 138],
];
const LIBS: RGB = [125, 211, 252];
const CONF: RGB = [94, 234, 212];
const WHITE: RGB = [255, 255, 255];
const NIGHT: RGB = [4, 10, 24];
const mix = (a: RGB, b: RGB, u: number): RGB => [Math.round(a[0] + (b[0] - a[0]) * u), Math.round(a[1] + (b[1] - a[1]) * u), Math.round(a[2] + (b[2] - a[2]) * u)];
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const f2 = (v: number) => v.toFixed(2);

const RATIO = 2.37; // 20 ft box, side view
const CW = 190; // container width on the ships (world units)
const CH = CW / RATIO;
const WL = 520; // waterline (world y)
const LAND = 44;
const BIG_W = 560;
const BIG_BOT = 490; // bottom of the big box (stage y)
const HOP_H = [250, 290];
// camera: cam1 = close on the first ship, cam2 = the three ships, cam3 = pulled back under the big box
const S1 = 1.12;
const TX1 = 380 - 380 * S1;
const TY1 = 560 - WL * S1;
const S2 = 0.58;
const TX2 = 380 - 784 * S2;
const TY2 = 540 - WL * S2;
const S3 = 0.5;
const TX3 = 380 - 784 * S3;
const TY3 = 618 - WL * S3;

/* ───────────────────────── the container (side view, ribbed; its long side = two doors) ───────────────────────── */

type BoxP = { uid: string; w: number; tint?: RGB; glassy?: number; door?: number; inner?: number; sweep?: number | null; flash?: number; tag?: number };

const Box: React.FC<BoxP> = ({ uid, w, tint = DK, glassy = 0, door = 0, inner = 0, sweep = null, flash = 0, tag = 0 }) => {
  const h = w / RATIO;
  const post = w * 0.034;
  const rT = h * 0.085;
  const rB = h * 0.095;
  const ox = post;
  const oy = rT;
  const ow = w - 2 * post;
  const oh = h - rT - rB;
  const cx0 = ox + ow / 2;
  const cy0 = oy + oh / 2;
  const sw = Math.max(0.9, w * 0.0045);
  const gl = clamp01(glassy);
  const L = mix(tint, WHITE, 0.42);
  const Dk = mix(tint, NIGHT, 0.45);
  const Dd = mix(tint, NIGHT, 0.72);
  const aF = 1 - 0.6 * gl;
  const ang = (Math.max(0, Math.min(100, door)) * Math.PI) / 180;
  const open = ang > 0.004;
  const Dp = w * 2.8;
  const P = (X: number, Y: number, Z: number): [number, number] => {
    const f = Dp / (Dp - Z);
    return [cx0 + X * f, cy0 + Y * f];
  };
  const pt = (p: [number, number]) => `${f2(p[0])} ${f2(p[1])}`;
  const sx = sweep === null ? -1e5 : -w * 0.25 + sweep * w * 1.5;
  const NR = 8;
  const doorEl = (side: -1 | 1) => {
    const hw = ow / 2;
    const hx = side * hw;
    const fx = hx - side * hw * Math.cos(ang);
    const z = hw * Math.sin(ang);
    const outer = ang < Math.PI / 2;
    const q = [P(hx, -oh / 2, 0), P(fx, -oh / 2, z), P(fx, oh / 2, z), P(hx, oh / 2, 0)];
    const ribs: React.ReactNode[] = [];
    for (let i = 1; i < NR; i++) {
      const u = i / NR;
      const X = hx + (fx - hx) * u;
      const a1 = P(X, -oh * 0.43, z * u);
      const a2 = P(X, oh * 0.43, z * u);
      const b = outer ? Math.exp(-Math.pow((a1[0] - sx) / (w * 0.07), 2)) : 0;
      ribs.push(<line key={`d${i}`} x1={a1[0] + sw * 1.2} y1={a1[1]} x2={a2[0] + sw * 1.2} y2={a2[1]} stroke={rgba(Dd, outer ? 0.5 * aF + 0.15 : 0.45)} strokeWidth={sw * 1.1} />);
      ribs.push(<line key={`l${i}`} x1={a1[0]} y1={a1[1]} x2={a2[0]} y2={a2[1]} stroke={b > 0.02 ? rgba(mix(L, WHITE, b), 0.55 + 0.45 * b) : rgba(L, outer ? 0.42 + 0.3 * gl : 0.2)} strokeWidth={sw * (1.3 + 0.9 * b)} />);
    }
    return (
      <g key={side}>
        <path d={`M${q.map(pt).join(" L")} Z`} fill={outer ? `url(#${uid}f)` : `url(#${uid}i)`} stroke={rgba(L, 0.85)} strokeWidth={sw} strokeLinejoin="round" />
        {ribs}
        <path d={`M${pt(q[1])} L${pt(q[2])}`} stroke={rgba(WHITE, open ? 0.75 : 0.35)} strokeWidth={sw * (open ? 1.6 : 1)} />
      </g>
    );
  };
  const cs = h * 0.12;
  const corners: Array<[number, number]> = [
    [0, 0],
    [w - cs, 0],
    [0, h - cs],
    [w - cs, h - cs],
  ];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${f2(w)} ${f2(h)}`} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={rgba(L, aF)} />
          <stop offset="0.45" stopColor={rgba(tint, aF)} />
          <stop offset="1" stopColor={rgba(Dk, aF)} />
        </linearGradient>
        <linearGradient id={`${uid}i`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={rgba(Dk, 0.95)} />
          <stop offset="1" stopColor={rgba(Dd, 0.95)} />
        </linearGradient>
        <linearGradient id={`${uid}r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={rgba(mix(tint, NIGHT, 0.25), 0.98 - 0.45 * gl)} />
          <stop offset="1" stopColor={rgba(Dd, 0.98 - 0.45 * gl)} />
        </linearGradient>
        <linearGradient id={`${uid}k`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={rgba(tint, 0.3 + 0.25 * inner)} />
          <stop offset="0.55" stopColor="rgba(6,16,36,0.97)" />
          <stop offset="1" stopColor="rgba(4,9,22,0.98)" />
        </linearGradient>
        <radialGradient id={`${uid}o`} cx="0.5" cy="0.42" r="0.62">
          <stop offset="0" stopColor={rgba(CYAN, 0.5 * inner)} />
          <stop offset="1" stopColor="rgba(34,211,238,0)" />
        </radialGradient>
        <radialGradient id={`${uid}g`} cx="0.5" cy="0.5" r="0.7">
          <stop offset="0" stopColor={rgba(CYAN, 0.32 * gl)} />
          <stop offset="1" stopColor="rgba(34,211,238,0)" />
        </radialGradient>
        <linearGradient id={`${uid}w`} gradientUnits="userSpaceOnUse" x1={sx - w * 0.18} y1={0} x2={sx + w * 0.18} y2={0}>
          <stop offset="0" stopColor="rgba(255,255,255,0)" />
          <stop offset="0.5" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <clipPath id={`${uid}c`}>
          <rect x={0} y={0} width={w} height={h} rx={sw} />
        </clipPath>
      </defs>
      {open ? (
        <g>
          <rect x={ox} y={oy} width={ow} height={oh} fill={`url(#${uid}k)`} />
          {Array.from({ length: 15 }, (_, i) => {
            const x = ox + (ow * (i + 1)) / 16;
            return <line key={i} x1={x} y1={oy + oh * 0.08} x2={x} y2={oy + oh * 0.92} stroke={rgba(tint, 0.13)} strokeWidth={sw * 1.4} />;
          })}
          <rect x={ox} y={oy} width={ow} height={oh} fill={`url(#${uid}o)`} />
          <rect x={ox + ow * 0.05} y={oy + oh * 0.035} width={ow * 0.9} height={Math.max(2, h * 0.016)} rx={2} fill="#E8FCFF" opacity={inner} style={{ filter: `drop-shadow(0 0 ${f2(6 + 10 * inner)}px rgba(34,211,238,0.9))` }} />
          <rect x={ox} y={oy + oh - h * 0.03} width={ow} height={h * 0.03} fill={rgba(tint, 0.3 + 0.35 * inner)} />
        </g>
      ) : null}
      {/* frame: rails, posts, corner castings */}
      <rect x={0} y={0} width={w} height={rT} fill={`url(#${uid}r)`} />
      <rect x={0} y={h - rB} width={w} height={rB} fill={`url(#${uid}r)`} />
      <rect x={0} y={0} width={post} height={h} fill={`url(#${uid}r)`} />
      <rect x={w - post} y={0} width={post} height={h} fill={`url(#${uid}r)`} />
      {corners.map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width={cs} height={cs} rx={cs * 0.15} fill={rgba(L, 0.55 + 0.35 * aF)} />
          <ellipse cx={x + cs / 2} cy={y + cs / 2} rx={cs * 0.24} ry={cs * 0.14} fill={rgba(Dd, 0.95)} />
        </g>
      ))}
      <line x1={0} y1={sw * 0.6} x2={w} y2={sw * 0.6} stroke={rgba(WHITE, 0.55)} strokeWidth={sw} />
      {doorEl(-1)}
      {doorEl(1)}
      {gl > 0.01 && !open ? <rect x={ox} y={oy} width={ow} height={oh} fill={`url(#${uid}g)`} /> : null}
      {tag > 0.01 && !open ? (
        <g opacity={tag}>
          <text x={ox + ow * 0.035} y={oy + oh * 0.2} fontFamily={fontMono} fontWeight={700} fontSize={h * 0.075} fill="rgba(255,255,255,0.85)">
            MSRU 045045 5
          </text>
          <text x={ox + ow * 0.035} y={oy + oh * 0.2 + h * 0.08} fontFamily={fontMono} fontWeight={700} fontSize={h * 0.058} fill="rgba(255,255,255,0.6)">
            22G1
          </text>
        </g>
      ) : null}
      <rect x={0} y={0} width={w} height={h} rx={sw} fill="none" stroke={gl > 0.01 ? rgba(mix(L, ICE, gl), 0.75 + 0.25 * gl) : rgba(L, 0.75)} strokeWidth={sw * (1.1 + 0.6 * gl)} />
      {sweep !== null && !open ? <rect x={0} y={0} width={w} height={h} fill={`url(#${uid}w)`} clipPath={`url(#${uid}c)`} /> : null}
      {flash > 0.005 ? <rect x={0} y={0} width={w} height={h} rx={sw} fill="#EFFCFF" opacity={Math.min(0.85, flash)} /> : null}
    </svg>
  );
};

/* ───────────────────────── ships (bow on the left, bridge at the stern) ───────────────────────── */

type ShipDef = { x: number; deck: number; slot: number; bot: number; dip: number; bob: number; ph: number; sail: number; hull: string; ends: [number, number] };
const SHIPS: ShipDef[] = [
  // medium cargo ship
  { x: 380, deck: 30, slot: -40, bot: 30, dip: 9, bob: 2.6, ph: 0, sail: 0, hull: "M170 -30 H-150 L-184 -46 L-160 12 Q-150 34 -120 34 H146 Q170 34 172 10 Z", ends: [-168, 170] },
  // small boat
  { x: 716, deck: 20, slot: -12, bot: 20, dip: 15, bob: 3.6, ph: 2.1, sail: 440, hull: "M115 -20 H-100 L-124 -30 L-104 10 Q-96 22 -76 22 H98 Q116 22 117 6 Z", ends: [-112, 116] },
  // big ship: the slot is on top of another container
  { x: 1129, deck: 46, slot: 78, bot: 46 + CH, dip: 4.5, bob: 1.8, ph: 4.2, sail: 560, hull: "M240 -46 H-214 L-258 -68 L-226 14 Q-214 40 -180 40 H212 Q242 40 243 12 Z", ends: [-236, 242] },
];
const MUTED: Array<{ x: number; row: number; c: number }> = [
  { x: -118, row: 0, c: 0 },
  { x: 78, row: 0, c: 1 },
  { x: -118, row: 1, c: 2 },
];

const ShipBody: React.FC<{ i: number; uid: string; x: number; y: number; roll: number; slotA: number; win: number }> = ({ i, uid, x, y, roll, slotA, win }) => {
  const S = SHIPS[i];
  const winC = `rgba(207,250,254,${(0.62 + 0.35 * win).toFixed(3)})`;
  const sup = (x0: number, y0: number, w: number, h: number, key: string) => (
    <g key={key}>
      <rect x={x0} y={y0} width={w} height={h} rx={4} fill="#0D1F3F" />
      <rect x={x0} y={y0} width={w} height={h} rx={4} fill={`url(#${uid}s)`} stroke={rgba(ICE, 0.78)} strokeWidth={2.6} />
    </g>
  );
  const wins = (x0: number, y0: number, n: number, pitch: number, w: number, h: number, key: string) =>
    Array.from({ length: n }, (_, j) => <rect key={`${key}${j}`} x={x0 + j * pitch} y={y0} width={w} height={h} rx={1.5} fill={winC} />);
  const mast = (mx: number, y0: number, y1: number) => (
    <g>
      <line x1={mx} y1={y0} x2={mx} y2={y1} stroke={rgba(ICE, 0.8)} strokeWidth={3} strokeLinecap="round" />
      <line x1={mx - 9} y1={y1 + 6} x2={mx + 9} y2={y1 + 6} stroke={rgba(ICE, 0.8)} strokeWidth={3} strokeLinecap="round" />
      <circle cx={mx} cy={y1 - 2} r={3.5} fill={`rgba(236,254,255,${(0.6 + 0.4 * win).toFixed(3)})`} />
    </g>
  );
  let extra: React.ReactNode = null;
  if (i === 0)
    extra = (
      <g>
        {sup(104, -98, 56, 68, "b")}
        {sup(98, -105, 68, 8, "w")}
        {wins(110, -88, 4, 12, 8, 9, "a")}
        {wins(112, -66, 3, 15, 9, 6, "c")}
        {mast(140, -105, -130)}
      </g>
    );
  else if (i === 1)
    extra = (
      <g>
        {sup(88, -58, 26, 38, "b")}
        {sup(85, -63, 32, 6, "w")}
        {wins(93, -51, 2, 9, 6, 8, "a")}
        {mast(101, -63, -82)}
      </g>
    );
  else
    extra = (
      <g>
        {MUTED.map((m, j) => (
          <g key={j} transform={`translate(${f2(m.x - CW / 2)} ${f2(-46 - CH * (m.row + 1))})`}>
            <Box uid={`${uid}m${j}`} w={CW} tint={SLATE[m.c]} />
          </g>
        ))}
        {sup(178, -222, 58, 176, "b")}
        {sup(170, -231, 74, 9, "w")}
        {wins(186, -212, 4, 11, 7, 9, "a")}
        {wins(186, -186, 4, 11, 7, 7, "c")}
        {wins(186, -160, 4, 11, 7, 7, "d")}
        {sup(190, -252, 20, 21, "f")}
        <rect x={190} y={-247} width={20} height={5} fill={rgba(CYAN, 0.55)} />
        {mast(226, -231, -262)}
      </g>
    );
  const sxl = S.slot - CW / 2;
  const syl = -S.bot - CH;
  return (
    <g transform={`translate(${f2(x)} ${f2(y)}) rotate(${roll.toFixed(3)})`}>
      <defs>
        <linearGradient id={`${uid}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={rgba(CYAN, 0.34)} />
          <stop offset="0.5" stopColor={rgba(CYAN, 0.12)} />
          <stop offset="1" stopColor={rgba(CYAN, 0.05)} />
        </linearGradient>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.16)" />
          <stop offset="1" stopColor={rgba(CYAN, 0.06)} />
        </linearGradient>
      </defs>
      <path d={S.hull} fill="#0A1834" />
      <path d={S.hull} fill={`url(#${uid}h)`} stroke={rgba(ICE, 0.9)} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M${S.ends[0]} ${-S.deck * 0.45} H${S.ends[1] - 4}`} stroke={rgba(CYAN, 0.6)} strokeWidth={3} strokeLinecap="round" />
      <path d={`M${S.ends[0] + 6} ${-S.deck + 1.5} H${S.ends[1] - 2}`} stroke="rgba(236,254,255,0.85)" strokeWidth={2} />
      {extra}
      {/* the slot: exactly one standard container */}
      <rect x={sxl} y={syl} width={CW} height={CH} rx={4} fill={rgba(CYAN, 0.05 + 0.12 * slotA)} stroke={rgba(ICE, 0.35 + 0.55 * slotA)} strokeWidth={3.5} strokeDasharray="12 8" />
    </g>
  );
};

/* ───────────────────────── layers that go in the box ───────────────────────── */

const gearPath = (cx: number, cy: number, R: number, r: number, n: number) => {
  const pts: string[] = [];
  const per = (2 * Math.PI) / n;
  const p = (rr: number, aa: number) => `${f2(cx + rr * Math.cos(aa))} ${f2(cy + rr * Math.sin(aa))}`;
  for (let i = 0; i < n; i++) {
    const a = i * per;
    pts.push(p(r, a - per * 0.32), p(R, a - per * 0.18), p(R, a + per * 0.18), p(r, a + per * 0.32));
  }
  return `M${pts.join(" L")} Z`;
};
const GEAR = gearPath(20, 20, 17, 12.5, 8);

type Kind = "code" | "libs" | "config";
const LAYERS: Array<{ kind: Kind; label: string; tint: RGB }> = [
  { kind: "code", label: "ton code", tint: CYAN },
  { kind: "libs", label: "ce dont il a besoin", tint: LIBS },
  { kind: "config", label: "réglages", tint: CONF },
];
const LAYER_H = 58;
const LAYER_GAP = 6;

const Layer: React.FC<{ kind: Kind; label: string; tint: RGB; glow: number; w: number; spin: number }> = ({ kind, label, tint, glow, w, spin }) => {
  const ic = rgba(mix(tint, WHITE, 0.25), 1);
  return (
    <div
      style={{
        width: w,
        height: LAYER_H,
        boxSizing: "border-box",
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 20px 0 9px",
        background: `linear-gradient(165deg, ${rgba(tint, 0.36)} 0%, ${rgba(tint, 0.14)} 55%, rgba(8,18,40,0) 100%), #0A1834`,
        border: `1.5px solid ${rgba(tint, 0.55 + 0.4 * glow)}`,
        boxShadow: `0 0 ${f2(14 + 30 * glow)}px ${rgba(tint, 0.22 + 0.45 * glow)}, inset 0 1px 0 rgba(255,255,255,0.38), 0 8px 18px rgba(0,0,0,0.5)`,
      }}
    >
      <div style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 12, background: rgba(tint, 0.2), border: `1.5px solid ${rgba(tint, 0.6)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {kind === "code" ? (
          <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 19, color: ic, letterSpacing: "-0.08em", lineHeight: 1, textShadow: `0 0 10px ${rgba(tint, 0.7)}` }}>{"</>"}</span>
        ) : (
          <svg width={28} height={28} viewBox="0 0 40 40" style={{ overflow: "visible", filter: `drop-shadow(0 0 5px ${rgba(tint, 0.7)})` }}>
            {kind === "config" ? (
              <g fill="none" stroke={ic} strokeWidth={4} strokeLinejoin="round" transform={`rotate(${spin.toFixed(1)} 20 20)`}>
                <path d={GEAR} />
                <circle cx={20} cy={20} r={5} />
              </g>
            ) : (
              <g fill="none" stroke={ic} strokeWidth={3.6} strokeLinejoin="round" strokeLinecap="round">
                <path d="M20 3 L35 11 V28 L20 37 L5 28 V11 Z" />
                <path d="M5 11 L20 19.5 L35 11 M20 19.5 V37" />
              </g>
            )}
          </svg>
        )}
      </div>
      <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 33, color: "#F8FAFC", letterSpacing: "-0.02em", whiteSpace: "nowrap", lineHeight: 1, textShadow: "0 2px 10px rgba(0,0,0,0.55)" }}>{label}</span>
    </div>
  );
};

/* ───────────────────────── the animation ───────────────────────── */

type CPose = { x: number; y: number; r: number; sx: number; sy: number }; // world, bottom-centre

export const CargoFx: ToolFx = ({ g, f0, f1, beats, size }) => {
  const t = g - f0;
  const k = size / 760;
  const dur = Math.max(170, f1 - f0);
  const bp = beatPulse(g, 14);

  // ── phases (see header) ──
  let bt = beats
    .map((b) => b - f0)
    .filter((b) => b > 0 && b < dur)
    .sort((a, b) => a - b);
  if (bt.length && bt[0] < 40) bt = bt.slice(1);
  if (bt.length > 6) bt = [];
  const m = bt.length;
  const pB = m >= 1 ? bt[0] : undefined;
  const pA = m >= 2 ? bt[1] : undefined;
  const pO = m === 3 || m === 4 || m === 6 ? bt[2] : undefined;
  const pD = m === 4 ? [bt[3]] : m === 5 ? bt.slice(2) : m === 6 ? bt.slice(3) : [];
  const TB = Math.max(LAND + 22, pB ?? dur * 0.36);
  const TA = Math.max(TB + 64, pA ?? dur * 0.56);
  const TO = Math.max(TA + 36, pO ?? (pD.length ? pD[0] - 24 : dur * 0.64));
  const gapD = Math.min(70, Math.max(12, (dur - TO - 40) / 3.2));
  const D1 = Math.max(TO + 22, pD[0] ?? TO + 22);
  const D2 = Math.max(D1 + 12, pD[1] ?? D1 + gapD);
  const D3 = Math.max(D2 + 12, pD[2] ?? D2 + gapD);
  const DROPS = [D1, D2, D3];
  const H1: [number, number] = [TB + 6, TB + 24];
  const H2: [number, number] = [TB + 40, TB + 58];
  const STAMP = TA + 30;
  const FALL = 12;

  // ── camera ──
  const c1 = iv(t, [TB, TB + 22], [0, 1], EASE_IN_OUT);
  const c2 = iv(t, [TA, TA + 26], [0, 1], EASE_IN_OUT);
  const camS = S1 + (S2 - S1) * c1 + (S3 - S2) * c2;
  const camX = TX1 + (TX2 - TX1) * c1 + (TX3 - TX2) * c2;
  const camY = TY1 + (TY2 - TY1) * c1 + (TY3 - TY2) * c2;
  const W2S = (x: number, y: number): [number, number] => [camX + x * camS, camY + y * camS];
  const seaY = camY + WL * camS;
  const worldO = 1 - 0.66 * c2;
  // heavy thunk: the whole picture jolts
  const thA = t - LAND;
  const shake = thA >= 0 ? Math.sin(thA * 2.3) * 6 * Math.exp(-thA / 5) : 0;

  // ── ships ──
  const landAge = [t - LAND, t - H1[1], t - H2[1]];
  const leaveAge = [t - H1[0], t - H2[0], t - TA];
  const shipSt = (i: number) => {
    const S = SHIPS[i];
    const sail = i === 0 ? 0 : S.sail * (1 - iv(t, i === 1 ? [TB, TB + 22] : [TB + 3, TB + 26], [0, 1], EASE_OUT));
    const bob = Math.sin(g * 0.055 + S.ph) * S.bob;
    const la = landAge[i];
    const dip = la >= 0 && la < 80 ? S.dip * Math.sin(la * 0.33) * Math.exp(-la / 11) : 0;
    const lv = leaveAge[i];
    const kick = lv >= 0 && lv < 60 ? -S.dip * 0.45 * Math.sin(lv * 0.33) * Math.exp(-lv / 10) : 0;
    const roll = Math.sin(g * 0.041 + S.ph * 1.3) * 0.8 + (la >= 0 && la < 60 ? 2 * Math.sin(la * 0.3) * Math.exp(-la / 9) * (i === 1 ? 1.5 : 0.6) : 0);
    return { x: S.x + sail, y: WL + bob + dip + kick, roll, sail };
  };
  const SH = [shipSt(0), shipSt(1), shipSt(2)];
  const deckPos = (i: number): CPose => {
    const s = SH[i];
    const S = SHIPS[i];
    const rr = (s.roll * Math.PI) / 180;
    const lx = S.slot;
    const ly = -S.bot;
    return { x: s.x + lx * Math.cos(rr) - ly * Math.sin(rr), y: s.y + lx * Math.sin(rr) + ly * Math.cos(rr), r: s.roll, sx: 1, sy: 1 };
  };
  const squash = (age: number) => (age >= 0 && age < 30 ? Math.sin(clamp01(age / 18) * Math.PI * 2) * Math.exp(-age / 6) : 0);
  const hopAt = (i0: number, i1: number, a: number, b: number, hh: number, tt: number): CPose => {
    const u = clamp01((tt - a) / (b - a));
    const p0 = deckPos(i0);
    const p1 = deckPos(i1);
    const e = EASE_IN_OUT(u);
    const st = 1 + 0.08 * Math.sin(Math.PI * u);
    return { x: lerp(p0.x, p1.x, e), y: lerp(p0.y, p1.y, u) - hh * 4 * u * (1 - u), r: 9 * Math.sin(Math.PI * u) * (u < 0.5 ? 1 : 0.6), sx: 1 / st, sy: st };
  };
  const antic = (at: number) => (t >= at - 6 && t < at ? Math.sin(((t - (at - 6)) / 6) * Math.PI * 0.5) : 0);

  // ── the container in the world (t < TA) ──
  let cw: CPose;
  if (t < LAND) {
    const dp = deckPos(0);
    const yHover = dp.y - 16;
    let y = lerp(196, yHover, iv(t, [0, LAND - 6], [0, 1], EASE_IN_OUT));
    if (t >= LAND - 6) y = lerp(yHover, dp.y, EASE_IN(iv(t, [LAND - 6, LAND], [0, 1])));
    const sway = Math.sin(t * 0.21 + 0.6) * 3.2 * Math.exp(-Math.max(0, t) / 22);
    cw = { x: dp.x + sway * 3, y, r: sway, sx: 1, sy: 1 };
  } else if (t < H1[0]) {
    const sq = squash(t - LAND);
    const an = antic(H1[0]);
    cw = { ...deckPos(0), sx: 1 + 0.09 * sq + 0.06 * an, sy: 1 - 0.13 * sq - 0.1 * an };
  } else if (t < H1[1]) {
    cw = hopAt(0, 1, H1[0], H1[1], HOP_H[0], t);
  } else if (t < H2[0]) {
    const sq = squash(t - H1[1]) * 0.8;
    const an = antic(H2[0]);
    cw = { ...deckPos(1), sx: 1 + 0.09 * sq + 0.06 * an, sy: 1 - 0.13 * sq - 0.1 * an };
  } else if (t < H2[1]) {
    cw = hopAt(1, 2, H2[0], H2[1], HOP_H[1], t);
  } else {
    const sq = squash(t - H2[1]) * 0.8;
    cw = { ...deckPos(2), sx: 1 + 0.09 * sq, sy: 1 - 0.13 * sq };
  }

  // ── the container on stage: bottom-centre (bx, by), width bw ──
  const p2 = iv(t, [TA, TA + 26], [0, 1], EASE_IN_OUT);
  const hover = Math.sin(g * 0.06) * 5 * clamp01((t - TA - 34) / 20);
  const stA = t - STAMP;
  const stampShake = stA >= 0 ? Math.sin(stA * 2.4) * 5 * Math.exp(-stA / 5) : 0;
  const bumps = DROPS.reduce((acc, d) => acc + (t >= d ? Math.sin(clamp01((t - d) / 10) * Math.PI) * Math.exp(-(t - d) / 6) : 0), 0);
  let bx: number;
  let by: number;
  let bw: number;
  let br: number;
  let bsx = 1;
  let bsy = 1;
  if (t < TA) {
    [bx, by] = W2S(cw.x, cw.y);
    bw = CW * camS;
    br = cw.r;
    bsx = cw.sx;
    bsy = cw.sy;
  } else {
    const dp = deckPos(2);
    const [x0, y0] = W2S(dp.x, dp.y);
    bx = lerp(x0, 380, p2) + stampShake;
    by = lerp(y0, BIG_BOT, p2) - 110 * Math.sin(Math.PI * p2) + hover;
    bw = lerp(CW * camS, BIG_W, p2);
    br = lerp(dp.r, 0, p2) - 6 * Math.sin(Math.PI * p2);
    const sq = squash(stA) * 0.5;
    bsx = 1 + 0.05 * sq + 0.012 * bumps;
    bsy = 1 - 0.07 * sq - 0.02 * bumps;
  }
  const bh = bw / RATIO;
  const glassy = iv(t, [TA + 8, TA + 26], [0, 1]);
  const doorP = iv(t, [TO + 2, TO + 18], [0, 1], EASE_OUT);
  const dA = t - TO - 18;
  const door = 98 * doorP + (dA >= 0 ? Math.sin(dA * 0.35) * 4 * Math.exp(-dA / 8) + 1.6 * Math.sin(g * 0.05) * clamp01((dA - 12) / 20) : 0);
  const innerKick = DROPS.reduce((acc, d) => Math.max(acc, decay(t - d, 9)), 0);
  const inner = iv(t, [TO + 4, TO + 16], [0, 1]) * (0.82 + 0.12 * Math.sin(g * 0.09)) + 0.25 * innerKick;
  const flash = 0.5 * decay(thA, 5) + 0.35 * decay(t - H1[1], 4) + 0.35 * decay(t - H2[1], 4) + 0.3 * decay(stA, 5);
  const ribSweep = (() => {
    if (t >= TA + 10 && t < TA + 34) return iv(t, [TA + 10, TA + 34], [0, 1]);
    const ph = t - (LAND + 20);
    if (ph < 0) return null;
    const u = (ph % 96) / 40;
    return u <= 1 ? u : null;
  })();

  // ── brackets that snap round the box when it lands (« standard ») ──
  const bracketAges = [thA, t - H1[1], t - H2[1]];
  const nextOff = [H1[0], H2[0], TA];
  const bracketEls: React.ReactNode[] = [];
  bracketAges.forEach((a, j) => {
    if (a < 0 || a > 34 || t >= nextOff[j]) return;
    const sc = iv(a, [0, 8], [1.45, 1.04], EASE_OUT);
    const al = iv(a, [0, 2, 12, 34], [0, 1, 1, 0]);
    const cx = bx;
    const cy = by - bh / 2;
    const hw = (bw / 2) * sc + 6;
    const hh = (bh / 2) * sc + 6;
    const L = Math.min(bw, bh) * 0.32;
    const corner = (sx: number, sy: number, key: string) => (
      <path key={key} d={`M${f2(cx + sx * hw)} ${f2(cy + sy * (hh - L))} L${f2(cx + sx * hw)} ${f2(cy + sy * hh)} L${f2(cx + sx * (hw - L))} ${f2(cy + sy * hh)}`} fill="none" stroke={rgba(ICE, al)} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,0.9))" }} />
    );
    bracketEls.push(corner(-1, -1, `${j}a`), corner(1, -1, `${j}b`), corner(-1, 1, `${j}c`), corner(1, 1, `${j}d`));
  });

  // ── particles ──
  const sparks: React.ReactNode[] = [];
  const burst = (age: number, n: number, seed: number, ox: number, oy: number, spread: number, col: RGB, life: number, pow = 1) => {
    if (age < 0 || age > life) return;
    for (let i = 0; i < n; i++) {
      const r1 = rand(seed + i * 7.1);
      const r2 = rand(seed + i * 3.3 + 1);
      const r3 = rand(seed + i * 5.7 + 2);
      const vx = ((r1 - 0.5) * 14 + (r3 - 0.5) * 5) * pow;
      const vy = (-3 - r2 * 9) * pow;
      const x = ox + (r1 - 0.5) * spread + vx * age;
      const y = oy + vy * age + 0.42 * age * age;
      const a = 1 - age / life;
      const len = 3 + r3 * 4;
      sparks.push(<line key={`${seed}-${i}`} x1={x} y1={y} x2={x - vx * len * 0.25} y2={y - (vy + 0.84 * age) * len * 0.25} stroke={rgba(i % 3 === 0 ? ICE : col, a)} strokeWidth={2.5 + r2 * 2.5} strokeLinecap="round" />);
    }
  };
  // landings: sparks thrown sideways from the box's bottom corners
  const feet = (age: number, i: number, seed: number, n: number, life: number, pow: number) => {
    if (age < 0 || age > life) return;
    const [lx, ly] = W2S(deckPos(i).x, deckPos(i).y);
    const hw = (CW * camS) / 2;
    for (let s = 0; s < 2; s++) {
      const dir = s === 0 ? -1 : 1;
      for (let j = 0; j < n; j++) {
        const r1 = rand(seed + s * 13 + j * 7.1);
        const r2 = rand(seed + s * 17 + j * 3.3 + 1);
        const vx = dir * (3 + r1 * 9) * pow;
        const vy = -(1.5 + r2 * 5) * pow;
        const x = lx + dir * hw + vx * age;
        const y = ly - 3 + vy * age + 0.4 * age * age;
        const a = 1 - age / life;
        sparks.push(<line key={`f${seed}${s}${j}`} x1={x} y1={y} x2={x - vx * 1.4} y2={y - (vy + 0.8 * age) * 1.4} stroke={rgba(j % 3 === 0 ? ICE : CYAN, a)} strokeWidth={2.5 + r2 * 2} strokeLinecap="round" />);
      }
    }
  };
  feet(thA, 0, 11, 8, 24, 1);
  feet(t - H1[1], 1, 23, 5, 20, 0.7);
  feet(t - H2[1], 2, 37, 5, 20, 0.7);
  burst(stA, 12, 47, bx, by - bh / 2, 60, AMBER, 22);

  // water: ripples + droplets at the hull ends when a ship dips
  const water: React.ReactNode[] = [];
  [0, 1, 2].forEach((i) => {
    const a = landAge[i];
    if (a < 0 || a > 40) return;
    const S = SHIPS[i];
    const pw = i === 1 ? 1.2 : i === 0 ? 1 : 0.6;
    S.ends.forEach((ex, e) => {
      const [wx, wy] = W2S(SH[i].x + ex, WL);
      const R = (14 + a * 3.2) * camS * pw;
      water.push(<ellipse key={`r${i}${e}`} cx={wx} cy={wy + 2} rx={R} ry={R * 0.18} fill="none" stroke={rgba(ICE, 0.75 * (1 - a / 40))} strokeWidth={2.5} />);
      if (a < 22) {
        for (let j = 0; j < 7; j++) {
          const r1 = rand(i * 31 + e * 7 + j * 3.7);
          const r2 = rand(i * 17 + e * 5 + j * 2.3 + 1);
          const vx = (e === 0 ? -1 : 1) * (1 + r1 * 4) * camS * pw;
          const vy = -(3 + r2 * 5) * camS * pw;
          water.push(<circle key={`d${i}${e}${j}`} cx={wx + vx * a} cy={wy + vy * a + 0.3 * a * a * camS} r={(2 + r2 * 2.5) * Math.max(0.7, camS)} fill={rgba(j % 2 ? ICE : CYAN, 0.85 * (1 - a / 22))} />);
        }
      }
    });
  });

  // ── slots: empty ones glow in sync once the ships are all there (same size everywhere) ──
  const syncP = t > H2[1] + 10 ? 0.5 + 0.5 * Math.sin((t - H2[1]) * 0.12) : 0;
  const slotA = [
    t < LAND ? 0.55 + 0.35 * Math.sin(t * 0.3) : 0.35 + 0.5 * syncP + 0.6 * decay(t - H1[0], 10),
    0.35 + 0.5 * syncP + 0.5 * iv(t, [TB + 10, TB + 20], [0, 1]) * (t < H1[1] ? 0.5 + 0.5 * Math.sin(t * 0.3) : 0) + 0.6 * decay(t - H2[0], 10),
    0.35 + 0.5 * iv(t, [TB + 14, TB + 26], [0, 1]) * (t < H2[1] ? 0.5 + 0.5 * Math.sin(t * 0.3) : 0),
  ];

  // ── the crane (world) ──
  const craneEx = iv(t, [LAND + 14, LAND + 40], [0, 1], EASE_IN);
  const trX = SHIPS[0].x + SHIPS[0].slot;
  const spY = t < LAND ? cw.y - CH - 3 : lerp(deckPos(0).y - CH - 3, 150, iv(t, [LAND + 4, LAND + 22], [0, 1], EASE_IN_OUT));
  const spX = t < LAND ? cw.x : trX;
  const craneEl =
    craneEx < 1 ? (
      <g transform={`translate(${f2(-330 * craneEx)} ${f2(-40 * craneEx)})`} opacity={1 - craneEx}>
        {/* tower */}
        <line x1={116} y1={66} x2={116} y2={WL + 30} stroke={rgba(ICE, 0.75)} strokeWidth={3.5} />
        <line x1={144} y1={66} x2={144} y2={WL + 30} stroke={rgba(ICE, 0.75)} strokeWidth={3.5} />
        {Array.from({ length: 16 }, (_, j) => {
          const y = 70 + j * 30;
          return <path key={`t${j}`} d={`M116 ${y} L144 ${y + 15} L116 ${y + 30}`} fill="none" stroke={rgba(CYAN, 0.45)} strokeWidth={2.2} />;
        })}
        {/* boom + counter-jib */}
        <line x1={56} y1={66} x2={500} y2={66} stroke={rgba(ICE, 0.85)} strokeWidth={3.5} strokeLinecap="round" />
        <line x1={56} y1={88} x2={500} y2={88} stroke={rgba(ICE, 0.85)} strokeWidth={3.5} strokeLinecap="round" />
        {Array.from({ length: 14 }, (_, j) => {
          const x = 59 + j * 30;
          return <path key={`b${j}`} d={`M${x} 88 L${x + 15} 66 L${x + 30} 88`} fill="none" stroke={rgba(CYAN, 0.45)} strokeWidth={2.2} />;
        })}
        <path d="M130 66 L130 26 M130 26 L500 66 M130 26 L56 66" fill="none" stroke={rgba(ICE, 0.6)} strokeWidth={2.4} />
        <rect x={54} y={90} width={44} height={26} rx={4} fill="#0D1F3F" stroke={rgba(ICE, 0.7)} strokeWidth={2.4} />
        <rect x={146} y={92} width={38} height={26} rx={5} fill="#0D1F3F" stroke={rgba(ICE, 0.75)} strokeWidth={2.4} />
        <rect x={152} y={98} width={26} height={9} rx={2} fill="rgba(207,250,254,0.85)" />
        {/* trolley, cables, spreader */}
        <rect x={trX - 20} y={86} width={40} height={12} rx={3} fill="#12284D" stroke={rgba(ICE, 0.85)} strokeWidth={2.4} />
        <line x1={trX - 10} y1={98} x2={spX - CW * 0.3} y2={spY - 6} stroke={rgba(ICE, 0.8)} strokeWidth={2.2} />
        <line x1={trX + 10} y1={98} x2={spX + CW * 0.3} y2={spY - 6} stroke={rgba(ICE, 0.8)} strokeWidth={2.2} />
        <rect x={spX - CW * 0.46} y={spY - 9} width={CW * 0.92} height={9} rx={3} fill="#12284D" stroke={rgba(ICE, 0.9)} strokeWidth={2.4} />
        <rect x={spX - CW * 0.46} y={spY - 1} width={8} height={5} fill={rgba(ICE, 0.9)} />
        <rect x={spX + CW * 0.46 - 8} y={spY - 1} width={8} height={5} fill={rgba(ICE, 0.9)} />
      </g>
    ) : null;

  // ── dotted routes of the hops ──
  const routeFade = 1 - iv(t, [TA, TA + 16], [0, 1]);
  const route = (i0: number, i1: number, a: number, b: number, hh: number, key: string) => {
    if (t < a || routeFade <= 0) return null;
    const uNow = clamp01((t - a) / (b - a));
    const run = t > b ? (((t - b) * 0.018) % 1.6) - 0.3 : -9;
    const dots: React.ReactNode[] = [];
    for (let j = 0; j <= 24; j++) {
      const u = j / 24;
      if (u > uNow) break;
      const p = hopAt(i0, i1, a, b, hh, a + u * (b - a));
      const lit = Math.exp(-Math.pow((u - run) / 0.08, 2));
      const al = (t < b + 4 ? 0.85 : 0.3 + 0.6 * lit) * routeFade;
      dots.push(<circle key={j} cx={p.x} cy={p.y - CH / 2} r={4 + 3 * lit} fill={rgba(lit > 0.3 ? ICE : CYAN, al)} />);
    }
    return <g key={key}>{dots}</g>;
  };

  // ── ships layer (drawn twice: the reflection, then the ships) ──
  const winFl = (i: number) => 0.5 + 0.5 * Math.sin(g * 0.07 + i * 2.3);
  const shipsLayer = (suffix: string) =>
    [0, 1, 2].map((i) => {
      if (i > 0 && t < TB - 2) return null;
      return <ShipBody key={i} i={i} uid={`cg${suffix}${i}`} x={SH[i].x} y={SH[i].y} roll={SH[i].roll} slotA={slotA[i]} win={winFl(i)} />;
    });

  // wakes behind the ships that sail in
  const wakes = [1, 2].map((i) => {
    const s = SH[i];
    const v = s.sail / SHIPS[i].sail;
    if (v <= 0.01 || t < TB - 2) return null;
    const x0 = s.x + SHIPS[i].ends[1];
    return (
      <g key={i} opacity={Math.min(1, v * 3)}>
        {[0, 1, 2].map((j) => (
          <line key={j} x1={x0 + 6 + j * 26} y1={WL + 3 + j * 5} x2={x0 + 60 + j * 70 + 120 * v} y2={WL + 3 + j * 7} stroke={rgba(ICE, 0.55 - j * 0.14)} strokeWidth={3 - j * 0.6} strokeLinecap="round" />
        ))}
      </g>
    );
  });

  // ── the box's reflection in the sea (only while it sits on a deck) ──
  const airborne = t < LAND ? iv(t, [LAND - 12, LAND], [1, 0]) : t >= H1[0] && t < H1[1] ? Math.sin((Math.PI * (t - H1[0])) / (H1[1] - H1[0])) : t >= H2[0] && t < H2[1] ? Math.sin((Math.PI * (t - H2[0])) / (H2[1] - H2[0])) : 0;
  const reflA = 0.2 * (1 - p2) * (1 - airborne);

  // ── the logo ──
  let logoS = iv(t, [STAMP - 8, STAMP], [2.4, 1], EASE_IN);
  if (stA >= 0) logoS = 1 - 0.12 * Math.sin(clamp01(stA / 14) * Math.PI * 2) * Math.exp(-stA / 6);
  const logoO = iv(t, [STAMP - 8, STAMP - 4], [0, 1]);
  const lift = iv(t, [TO, TO + 12], [0, 1], EASE_IN_OUT);
  const LOGO = 122;
  const roofY = by - bh - LOGO * 0.8 * 0.5 + 6;
  const logoX = bx;
  const logoY = lerp(by - bh / 2, roofY, lift) - 34 * Math.sin(Math.PI * lift);
  const logoSc = logoS * lerp(1, 0.8, lift);
  const ringAge = stA;
  const ring = iv(ringAge, [0, 18], [0.6, 1.9], EASE_OUT);
  const ringA = ringAge >= 0 ? iv(ringAge, [0, 2, 18], [0, 0.95, 0]) : 0;
  const doneA = t - (D3 + 4);
  const doneRing = iv(doneA, [0, 16], [0.75, 1.35], EASE_OUT);
  const doneRingA = doneA >= 0 ? iv(doneA, [0, 2, 16], [0, 0.85, 0]) : 0;
  const logoGlow = 0.25 + 0.3 * bp * clamp01((t - STAMP - 20) / 20) + 0.6 * decay(stA, 8) + 0.6 * decay(doneA, 10);
  const amberHalo = doneA >= 0 ? 0.35 + 0.25 * Math.sin(g * 0.08) : stA >= 0 && stA < 30 ? 1 - stA / 30 : 0;

  // ── layers falling in ──
  const post = BIG_W * 0.034;
  const layerW = BIG_W - 2 * post - 28;
  const layerEls = LAYERS.map((ly, i) => {
    const d = DROPS[i];
    const fp = iv(t, [d - FALL, d], [0, 1], EASE_IN);
    if (fp <= 0) return null;
    const ySlot = by - bh * 0.095 - 5 - i * (LAYER_H + LAYER_GAP) - LAYER_H; // top of the layer
    const y = lerp(ySlot - 280, ySlot, fp);
    const a = t - d;
    const sq = squash(a);
    const sc = lerp(1.12, 1, fp);
    const rot = (i % 2 ? 4 : -4) * (1 - fp);
    // idle: a light runs up through the stack
    const run = t > D3 + 24 ? ((t - D3 - 24) % 90) - i * 12 : -99;
    const lit = run >= 0 && run < 18 ? Math.sin((run / 18) * Math.PI) : 0;
    const glow = 0.85 * decay(a, 9) + 0.6 * lit + 0.15 * (1 - fp);
    return (
      <div
        key={ly.kind}
        style={{
          position: "absolute",
          left: bx - layerW / 2,
          top: y,
          width: layerW,
          height: LAYER_H,
          opacity: iv(t, [d - FALL, d - FALL + 4], [0, 1]),
          transform: `rotate(${rot.toFixed(2)}deg) scale(${f2(sc * (1 + 0.05 * sq))}, ${f2(sc * (1 - 0.12 * sq))})`,
          transformOrigin: "50% 100%",
          filter: fp < 0.85 ? `blur(${f2((0.85 - fp) * 3)}px)` : undefined,
        }}
      >
        <Layer kind={ly.kind} label={ly.label} tint={ly.tint} glow={glow} w={layerW} spin={g * 1.2} />
      </div>
    );
  });
  DROPS.forEach((d, i) => {
    const ySlot = by - bh * 0.095 - 5 - i * (LAYER_H + LAYER_GAP) - LAYER_H / 2;
    burst(t - d, 8, 61 + i * 9, bx - layerW / 2 + 10, ySlot, 20, LAYERS[i].tint, 18, 0.6);
    burst(t - d, 8, 67 + i * 9, bx + layerW / 2 - 10, ySlot, 20, LAYERS[i].tint, 18, 0.6);
  });

  const appear = iv(t, [0, 12], [0, 1], EASE_OUT);
  const EDGE = "linear-gradient(90deg, rgba(0,0,0,0) 0px, #000 70px, #000 690px, rgba(0,0,0,0) 760px)";

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: k !== 1 ? `scale(${k})` : undefined, transformOrigin: "0 0" }}>
      {/* back light */}
      <div style={{ position: "absolute", left: 0, top: 60, width: 760, height: 640, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, 0.12 + 0.05 * bp)}, rgba(34,211,238,0))`, opacity: appear }} />

      <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: `translate(${f2(shake)}px, ${f2(Math.abs(shake) * 0.5)}px)` }}>
        {/* ── the harbour (masked at the stage edges) ── */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, WebkitMaskImage: EDGE, maskImage: EDGE, opacity: appear }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: `translate(${f2(camX)}px, ${f2(camY)}px) scale(${camS.toFixed(4)})`, transformOrigin: "0 0", opacity: worldO }}>
            <svg width={1500} height={900} viewBox="0 0 1500 900" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <defs>
                <linearGradient id="cgReflG" gradientUnits="userSpaceOnUse" x1={0} y1={WL} x2={0} y2={WL + 190}>
                  <stop offset="0" stopColor="#fff" stopOpacity={0.9} />
                  <stop offset="1" stopColor="#fff" stopOpacity={0} />
                </linearGradient>
                <mask id="cgReflM" maskUnits="userSpaceOnUse" x={-800} y={WL} width={3200} height={260}>
                  <rect x={-800} y={WL} width={3200} height={260} fill="url(#cgReflG)" />
                </mask>
              </defs>
              {craneEl}
              <g mask="url(#cgReflM)" opacity={0.3}>
                <g transform={`translate(0 ${2 * WL}) scale(1 -1)`}>{shipsLayer("r")}</g>
              </g>
              {wakes}
              {shipsLayer("s")}
              {route(0, 1, H1[0], H1[1], HOP_H[0], "r1")}
              {route(1, 2, H2[0], H2[1], HOP_H[1], "r2")}
            </svg>
          </div>

          {/* the box's reflection */}
          {reflA > 0.01 ? (
            <div style={{ position: "absolute", left: bx - bw / 2, top: 2 * seaY - by, width: bw, height: bh, opacity: reflA, transform: `scaleY(-1) rotate(${(-br).toFixed(2)}deg)`, transformOrigin: "50% 50%", WebkitMaskImage: "linear-gradient(0deg, #000, rgba(0,0,0,0))", maskImage: "linear-gradient(0deg, #000, rgba(0,0,0,0))" }}>
              <Box uid="cgR" w={bw} />
            </div>
          ) : null}

          {/* ── the glass sea ── */}
          <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <defs>
              <linearGradient id="cgSea" gradientUnits="userSpaceOnUse" x1={0} y1={seaY} x2={0} y2={760}>
                <stop offset="0" stopColor="rgba(9,30,62,0.72)" />
                <stop offset="0.45" stopColor="rgba(6,18,40,0.5)" />
                <stop offset="1" stopColor="rgba(4,7,15,0)" />
              </linearGradient>
              <linearGradient id="cgSheen" gradientUnits="userSpaceOnUse" x1={0} y1={seaY} x2={0} y2={seaY + 160}>
                <stop offset="0" stopColor={rgba(CYAN, 0.2)} />
                <stop offset="1" stopColor="rgba(34,211,238,0)" />
              </linearGradient>
              <linearGradient id="cgShaft" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={rgba(CYAN, 0.55)} />
                <stop offset="1" stopColor="rgba(34,211,238,0)" />
              </linearGradient>
            </defs>
            <rect x={0} y={seaY} width={760} height={Math.max(0, 760 - seaY)} fill="url(#cgSea)" />
            <rect x={0} y={seaY} width={760} height={160} fill="url(#cgSheen)" />
            {/* light of the open box on the water */}
            {inner > 0.01
              ? Array.from({ length: 9 }, (_, j) => {
                  const y = seaY + 6 + j * 15;
                  const wv = 70 + 50 * Math.sin(g * 0.11 + j * 1.7) - j * 5;
                  return <rect key={j} x={bx - wv / 2 + 10 * Math.sin(g * 0.07 + j)} y={y} width={Math.max(10, wv)} height={4} rx={2} fill={rgba(ICE, (0.5 - j * 0.045) * Math.min(1, inner))} />;
                })
              : null}
            {[10, 28, 54, 90, 140].map((dd, j) => {
              const y0 = seaY + dd * (0.6 + 0.4 * camS);
              const amp = 3.2 - j * 0.35;
              let d = `M-10 ${f2(y0)}`;
              for (let x = 0; x <= 780; x += 20) d += ` L${x} ${f2(y0 + amp * Math.sin(x * (0.022 - j * 0.002) + g * (0.06 + j * 0.012) + j * 1.3))}`;
              return <path key={j} d={d} fill="none" stroke={rgba(j === 0 ? ICE : CYAN, 0.32 - j * 0.05)} strokeWidth={2.2 - j * 0.25} />;
            })}
            {Array.from({ length: 16 }, (_, i) => {
              const sp = 0.25 + rand(i * 3.1) * 0.5;
              const x = (((rand(i * 7.3) * 820 - g * sp) % 820) + 820) % 820 - 30;
              const y = seaY + 14 + rand(i * 5.9) * 190;
              const tw = Math.max(0, Math.sin(g * 0.09 + i * 1.9));
              const wl = 10 + rand(i * 2.2) * 22;
              return <rect key={i} x={x} y={y} width={wl} height={2.5} rx={1.25} fill={rgba(ICE, 0.55 * tw * (1 - (y - seaY) / 260))} />;
            })}
            <line x1={0} y1={seaY} x2={760} y2={seaY} stroke={rgba(CYAN, 0.28)} strokeWidth={10} />
            <line x1={0} y1={seaY} x2={760} y2={seaY} stroke={rgba(ICE, 0.85)} strokeWidth={2.4} />
            {water}
            {inner > 0.01 ? <ellipse cx={bx} cy={seaY + 8} rx={260} ry={22} fill={rgba(CYAN, 0.14 * Math.min(1, inner))} /> : null}
          </svg>
        </div>

        {/* ── the box ── */}
        <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
          {bracketEls}
        </svg>
        {/* glow under the hovering box */}
        {p2 > 0.01 ? <div style={{ position: "absolute", left: bx - 330, top: by - bh / 2 - 200, width: 660, height: 400, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, 0.2 * p2 + 0.12 * Math.min(1, inner))}, rgba(34,211,238,0))` }} /> : null}
        {/* motion ghosts on the hops */}
        {[H1, H2].map((h, j) => {
          if (t < h[0] || t >= h[1]) return null;
          return [3, 6].map((lag, n) => {
            const p = hopAt(j, j + 1, h[0], h[1], HOP_H[j], t - lag);
            const [gx, gy] = W2S(p.x, p.y);
            return (
              <div key={`${j}${n}`} style={{ position: "absolute", left: gx - bw / 2, top: gy - bh, width: bw, height: bh, opacity: n === 0 ? 0.2 : 0.09, transform: `rotate(${p.r.toFixed(2)}deg)`, transformOrigin: "50% 100%", filter: "blur(2px)" }}>
                <Box uid={`cgG${j}${n}`} w={bw} />
              </div>
            );
          });
        })}
        <div style={{ position: "absolute", left: bx - bw / 2, top: by - bh, width: bw, height: bh, transform: `rotate(${br.toFixed(2)}deg) scale(${bsx.toFixed(4)}, ${bsy.toFixed(4)})`, transformOrigin: "50% 100%", opacity: appear, filter: `drop-shadow(0 0 ${f2(10 + 14 * p2)}px rgba(36,150,237,${f2(0.4 + 0.2 * p2)}))` }}>
          <Box uid="cgM" w={bw} glassy={glassy} door={door} inner={Math.min(1, inner)} sweep={ribSweep} flash={flash} tag={iv(t, [TA + 20, TA + 30], [0, 1])} />
        </div>
        {/* light spilling out of the open box */}
        {inner > 0.01 ? (
          <div style={{ position: "absolute", left: bx - 340, top: by - bh / 2 - 190, width: 680, height: 380, borderRadius: "50%", mixBlendMode: "screen", background: `radial-gradient(closest-side, ${rgba(CYAN, 0.16 * Math.min(1, inner))}, rgba(34,211,238,0))`, pointerEvents: "none" }} />
        ) : null}

        {/* the Docker logo: stamped on the side, then a badge on the roof (the falling layers pass in front of it) */}
        {logoO > 0.01 ? (
          <div style={{ position: "absolute", left: logoX, top: logoY, width: 0, height: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {ringA > 0.01 ? <div style={{ position: "absolute", width: 170, height: 170, borderRadius: "50%", border: `5px solid ${rgba(AMBER, ringA)}`, boxShadow: `0 0 30px ${rgba(AMBER, ringA * 0.7)}, inset 0 0 20px ${rgba(AMBER, ringA * 0.4)}`, transform: `scale(${ring.toFixed(3)})` }} /> : null}
            {doneRingA > 0.01 ? <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", border: `4px solid ${rgba(AMBER, doneRingA)}`, boxShadow: `0 0 26px ${rgba(AMBER, doneRingA * 0.7)}`, transform: `scale(${doneRing.toFixed(3)})` }} /> : null}
            <div style={{ opacity: logoO, transform: `scale(${logoSc.toFixed(3)})`, flexShrink: 0 }}>
              <Logo name="docker" size={LOGO} glow={Math.min(1, logoGlow)} glowColor={amberHalo > 0.05 ? "245,158,11" : "34,211,238"} />
            </div>
          </div>
        ) : null}

        {layerEls}

        <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
          {sparks}
        </svg>
      </div>

      {/* lights: flare/shockwave boxes span the 1080 frame width (stage at x 160) so streaks fade instead of being cut */}
      <div style={{ position: "absolute", left: -160, top: 0, width: 1080, height: 860, pointerEvents: "none" }}>
        <Shockwave age={thA} x={bx + 160} y={by - bh / 2} dur={22} maxR={190} r0={50} strength={0.6} />
        <AnamorphicFlare age={thA} x={bx + 160} y={by - bh / 2} dur={22} size={120} streakH={70} strength={0.45} />
        <AnamorphicFlare age={stA} x={logoX + 160} y={logoY} col={AMBER} dur={26} size={110} streakH={70} strength={0.65} />
        <AnamorphicFlare age={t - TO - 6} x={bx + 160} y={by - bh / 2} dur={30} size={160} streakH={110} strength={0.55} />
        <AnamorphicFlare age={doneA} x={logoX + 160} y={logoY} col={AMBER} dur={24} size={90} streakH={60} strength={0.5} />
      </div>
    </div>
  );
};
