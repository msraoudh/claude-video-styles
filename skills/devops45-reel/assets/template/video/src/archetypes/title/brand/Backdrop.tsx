import React from "react";
import { AbsoluteFill } from "remotion";
import { B } from "../../../lib/look";
import { beatPulse, rand } from "../../../lib/sync";

/**
 * S6 backdrop — the SAME family as S1/S2's opening backdrop (copied look: B.bg plate, perspective dot field,
 * blue depth plate, cyan bloom, slow bokeh) so the calm tail at 2717 loops back into S1's first frame.
 * Plus the energy build of the CTA: warp streaks + a warm amber light under the action.
 *   t       seconds (drives drift)        bloom   cyan bloom intensity      bloomAt  y of the light centre
 *   push    dot-field fly-in scale        warp    0..1 warp streak energy   warmAt / warm  amber light under the pill
 */
const BOKEH = [
  { x: 120, y: 360, r: 120, a: 0.16, sp: 0.35, ph: 0.3 },
  { x: 960, y: 520, r: 90, a: 0.14, sp: 0.5, ph: 1.7 },
  { x: 880, y: 1180, r: 160, a: 0.1, sp: 0.3, ph: 2.6 },
  { x: 200, y: 1320, r: 110, a: 0.1, sp: 0.45, ph: 4.1 },
  { x: 560, y: 220, r: 70, a: 0.12, sp: 0.6, ph: 5.2 },
  { x: 1010, y: 1500, r: 80, a: 0.09, sp: 0.4, ph: 0.9 },
];

const STREAKS = Array.from({ length: 46 }, (_, i) => ({
  th: rand(i * 7.13 + 1) * Math.PI * 2,
  r0: rand(i * 3.71 + 2),
  sp: 0.6 + rand(i * 5.37 + 3) * 0.8,
  len: 0.5 + rand(i * 9.11 + 4),
  hue: rand(i * 2.9 + 5) > 0.82 ? "amber" : "cyan",
}));

export const Backdrop: React.FC<{
  g: number;
  t: number;
  bloom: number;
  bloomAt: number;
  push: number;
  warp: number;
  warpT: number;
  warpAt: { x: number; y: number };
  warm: number;
  warmAt: number;
  /** unique svg id prefix (several backdrops can coexist in one frame) */
  id?: string;
}> = ({ g, t, bloom, bloomAt, push, warp, warpT, warpAt, warm, warmAt, id = "bd" }) => {
  const bp = beatPulse(g, 16);
  return (
    <AbsoluteFill style={{ background: B.bg, overflow: "hidden" }}>
      {/* dot field, slowly flying toward camera */}
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(4)})`, transformOrigin: `540px ${bloomAt}px` }}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <pattern id={`${id}-dots`} width={34} height={34} patternUnits="userSpaceOnUse">
              <circle cx={17} cy={17} r={1.7} fill="rgba(148,200,255,0.42)" />
            </pattern>
            <radialGradient id={`${id}-dotfade`} cx="50%" cy={`${((bloomAt / 1920) * 100).toFixed(2)}%`} r="62%">
              <stop offset="0%" stopColor="#fff" stopOpacity={0.9} />
              <stop offset="55%" stopColor="#fff" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#fff" stopOpacity={0} />
            </radialGradient>
            <mask id={`${id}-dotmask`}>
              <rect width={1080} height={1920} fill={`url(#${id}-dotfade)`} />
            </mask>
          </defs>
          <rect width={1080} height={1920} fill={`url(#${id}-dots)`} mask={`url(#${id}-dotmask)`} opacity={0.55} />
        </svg>
      </AbsoluteFill>
      {/* blue depth plate + cyan bloom behind the lockup */}
      <div style={{ position: "absolute", left: -260, top: bloomAt - 900, width: 1600, height: 1800, background: "radial-gradient(closest-side, rgba(40,90,190,0.28), rgba(20,50,120,0.10) 55%, rgba(0,0,0,0) 100%)" }} />
      <div
        style={{
          position: "absolute",
          left: 540 - 560,
          top: bloomAt - 560,
          width: 1120,
          height: 1120,
          borderRadius: "50%",
          opacity: bloom * (0.85 + 0.15 * Math.sin(t * 1.3)) * (1 + 0.25 * bp),
          background: "radial-gradient(closest-side, rgba(34,211,238,0.34) 0%, rgba(34,211,238,0.13) 38%, rgba(34,211,238,0.035) 70%, rgba(34,211,238,0) 100%)",
        }}
      />
      {/* warm light under the action (teal & orange) */}
      {warm > 0.003 ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 520,
            top: warmAt - 300,
            width: 1040,
            height: 600,
            opacity: warm,
            background: "radial-gradient(closest-side, rgba(245,158,11,0.30) 0%, rgba(245,140,11,0.10) 45%, rgba(245,158,11,0) 100%)",
          }}
        />
      ) : null}
      {BOKEH.map((b, i) => {
        const dx = Math.sin(t * b.sp + b.ph) * 26;
        const dy = Math.cos(t * b.sp * 0.8 + b.ph) * 20 - t * 6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: b.x - b.r + dx,
              top: b.y - b.r + dy,
              width: b.r * 2,
              height: b.r * 2,
              borderRadius: "50%",
              background: `radial-gradient(closest-side, rgba(${i % 3 === 1 ? "160,200,255" : "34,211,238"},${b.a}) 0%, rgba(34,211,238,${b.a * 0.4}) 60%, rgba(34,211,238,0) 100%)`,
            }}
          />
        );
      })}
      {/* warp streaks: the riser, made visible — they speed up and multiply toward the final hit */}
      {warp > 0.01 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
          <defs>
            <linearGradient id={`${id}-st-c`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="rgba(34,211,238,0)" />
              <stop offset="1" stopColor="rgba(190,245,255,0.9)" />
            </linearGradient>
            <linearGradient id={`${id}-st-a`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="rgba(245,158,11,0)" />
              <stop offset="1" stopColor="rgba(255,205,120,0.9)" />
            </linearGradient>
          </defs>
          {STREAKS.map((s, i) => {
            const on = i / STREAKS.length < 0.25 + 0.75 * warp;
            if (!on) return null;
            const R = 1500;
            const r = ((s.r0 + warpT * s.sp) % 1) * R;
            const r0 = 170 + r;
            const L = (40 + 260 * warp * warp) * s.len * (0.4 + r / R);
            const a = Math.min(1, r / 260) * (1 - r / R) * (0.18 + 0.5 * warp);
            const deg = (s.th * 180) / Math.PI;
            return (
              <g key={i} transform={`translate(${warpAt.x} ${warpAt.y}) rotate(${deg.toFixed(2)})`}>
                <rect x={r0} y={-1.2} width={L} height={2.4} rx={1.2} fill={`url(#${id}-st-${s.hue === "amber" ? "a" : "c"})`} opacity={a} />
              </g>
            );
          })}
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
