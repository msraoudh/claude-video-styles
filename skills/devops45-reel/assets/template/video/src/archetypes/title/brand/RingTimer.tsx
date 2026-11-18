import React from "react";
import { DigitWheel, odometerPos } from "../../../kit/Clock";
import { fontInter, fontMono } from "../../../kit/fonts";
import { B } from "../../../lib/look";

/**
 * COPY of src/scenes/s2/RingTimer.tsx (the S2 agent's signature mark) — copied, not imported across scene folders,
 * per the director; keep its look in sync if S2 changes it.
 * « DevOps en 45 secondes » — the series' signature mark: a thin cyan ring timer with « 00:45 » in amber.
 * Reusable as the badge / sting of every episode. Pure function of its props (drive them from the frame).
 *
 *   <RingTimer progress={1} label="45 secondes" size={250} />                         the badge at rest
 *   <RingTimer progress={p} seconds={45 * p} label="45 secondes" size={250} />       counting up to 00:45
 *   <RingTimer progress={1} pop={spring} sweep={deg} glow={0.6} size={250} />       alive (orbiting light)
 *
 * - progress  0..1 — the cyan arc AND the 45 tick marks (lit as it fills).
 * - seconds   value shown (fractional values roll like an odometer). Default 45 × progress.
 * - label     line under the ring; every « 45 » in it is amber (the brand signal). Omit for the bare badge.
 * - size      ring diameter in px (label + ticks scale with it).
 * - pop       scale of the amber digits (feed a spring 14/160/0.8 for the overshoot pop). Default 1.
 * - sweep     angle (deg, 0 = 12 o'clock) of an orbiting light on the ring; null = off.
 * - chase     0..1 a light running once around the 45 ticks (the sting moment); null = off.
 * - glow      0..1 extra bloom.
 * - labelIn   0..1 reveal of the label (rises through a mask).
 */
export type RingTimerProps = {
  progress: number;
  label?: string;
  size?: number;
  seconds?: number;
  total?: number;
  pop?: number;
  sweep?: number | null;
  chase?: number | null;
  glow?: number;
  labelIn?: number;
  style?: React.CSSProperties;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const TICKS = 45;

/** the label with every « 45 » in amber */
const Signal: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(45)/);
  return (
    <>
      {parts.map((p, i) =>
        p === "45" ? (
          <span key={i} style={{ color: B.amber, textShadow: `0 0 24px ${B.amberGlow}` }}>
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
};

export const RingTimer: React.FC<RingTimerProps> = ({
  progress,
  label,
  size = 250,
  seconds,
  total = 45,
  pop = 1,
  sweep = null,
  chase = null,
  glow = 0,
  labelIn = 1,
  style,
}) => {
  const p = clamp01(progress);
  const secs = Math.max(0, seconds ?? total * p);
  const sw = Math.max(3, size * 0.026);
  const pad = size * 0.16; // room for the ticks + glow
  const box = size + pad * 2;
  const c = box / 2;
  const r = size / 2 - sw / 2;
  const circ = 2 * Math.PI * r;
  const tickR0 = r + sw * 1.9;
  const tickR1 = tickR0 + size * 0.045;
  const head = -Math.PI / 2 + p * Math.PI * 2;
  const fs = size * 0.25;
  const lh = fs * 1.18;
  const tensPos = odometerPos(secs, 10, 0.5);
  const onesPos = odometerPos(secs, 1, 0.5);
  const blurPx = fs * 0.1;
  const labelSize = size * 0.168;
  return (
    <div style={{ position: "relative", width: box, display: "flex", flexDirection: "column", alignItems: "center", ...style }}>
      <div style={{ position: "relative", width: box, height: box }}>
        {/* bloom behind the ring */}
        <div
          style={{
            position: "absolute",
            left: c - size * 0.9,
            top: c - size * 0.9,
            width: size * 1.8,
            height: size * 1.8,
            borderRadius: "50%",
            background: `radial-gradient(closest-side, rgba(34,211,238,${0.16 + 0.22 * glow}) 0%, rgba(34,211,238,${0.05 + 0.08 * glow}) 55%, rgba(34,211,238,0) 100%)`,
          }}
        />
        {/* glass disc */}
        <div
          style={{
            position: "absolute",
            left: c - size / 2 + sw * 2.4,
            top: c - size / 2 + sw * 2.4,
            width: size - sw * 4.8,
            height: size - sw * 4.8,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 28%, rgba(255,255,255,0.10), rgba(255,255,255,0.025) 55%, rgba(34,211,238,0.05) 100%)",
            backdropFilter: "blur(12px) saturate(140%)",
            WebkitBackdropFilter: "blur(12px) saturate(140%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28), inset 0 0 30px rgba(34,211,238,0.10), 0 20px 50px rgba(0,0,0,0.45)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
        <svg width={box} height={box} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {/* 45 ticks, lit as the ring fills */}
          {Array.from({ length: TICKS }, (_, i) => {
            const a = -Math.PI / 2 + (i / TICKS) * Math.PI * 2;
            const lit = i / TICKS < p - 1e-4;
            const major = i % 5 === 0;
            let d = chase === null ? 1 : chase * 1.15 - i / TICKS;
            if (d < 0) d = 1;
            const hot = d < 0.16 ? 1 - d / 0.16 : 0;
            const r1 = (major ? tickR1 + size * 0.012 : tickR1) + hot * size * 0.03;
            return (
              <line
                key={i}
                x1={c + Math.cos(a) * tickR0}
                y1={c + Math.sin(a) * tickR0}
                x2={c + Math.cos(a) * r1}
                y2={c + Math.sin(a) * r1}
                stroke={hot > 0.05 ? "#ffffff" : lit ? B.cyan : "rgba(226,236,250,0.16)"}
                strokeOpacity={hot > 0.05 ? 0.4 + 0.6 * hot : lit ? (major ? 0.95 : 0.6) : 1}
                strokeWidth={major ? sw * 0.55 : sw * 0.38}
                strokeLinecap="round"
              />
            );
          })}
          {/* track */}
          <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(226,236,250,0.11)" strokeWidth={sw} />
          {/* arc */}
          {p > 0.002 ? (
            <circle
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={B.cyan}
              strokeWidth={sw}
              strokeLinecap="round"
              strokeDasharray={`${circ * p} ${circ}`}
              transform={`rotate(-90 ${c} ${c})`}
              style={{ filter: `drop-shadow(0 0 ${6 + 10 * glow}px rgba(34,211,238,0.85))` }}
            />
          ) : null}
          {/* head of the arc */}
          {p > 0.002 && p < 0.999 ? <circle cx={c + Math.cos(head) * r} cy={c + Math.sin(head) * r} r={sw * 1.05} fill="#ffffff" style={{ filter: "drop-shadow(0 0 8px rgba(34,211,238,1))" }} /> : null}
          {/* orbiting light */}
          {sweep !== null
            ? [0, 1, 2, 3, 4].map((j) => {
                const a = ((sweep - j * 5) * Math.PI) / 180 - Math.PI / 2;
                return <circle key={j} cx={c + Math.cos(a) * r} cy={c + Math.sin(a) * r} r={sw * (0.95 - j * 0.12)} fill="#ffffff" opacity={(1 - j / 5) * 0.9} style={j === 0 ? { filter: "drop-shadow(0 0 10px rgba(34,211,238,1))" } : undefined} />;
              })
            : null}
        </svg>
        {/* 00:45 — amber is the signal */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "inline-flex", fontFamily: fontMono, fontWeight: 700, fontSize: fs, lineHeight: `${lh}px`, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", whiteSpace: "pre" }}>
            <span style={{ color: "rgba(236,244,255,0.62)" }}>00:</span>
            <span style={{ display: "inline-flex", color: B.amber, textShadow: `0 0 ${18 + 14 * glow}px ${B.amberGlow}`, transform: `scale(${pop})`, transformOrigin: "30% 55%" }}>
              <DigitWheel pos={tensPos} lineHeight={lh} blur={blurPx} />
              <DigitWheel pos={onesPos} lineHeight={lh} blur={blurPx} />
            </span>
          </div>
        </div>
      </div>
      {label ? (
        <div style={{ overflow: "hidden", marginTop: -pad * 0.35, paddingBottom: 6 }}>
          <div
            style={{
              fontFamily: fontInter,
              fontWeight: 800,
              fontSize: labelSize,
              letterSpacing: "-0.03em",
              color: B.white,
              whiteSpace: "nowrap",
              transform: `translateY(${(1 - clamp01(labelIn)) * labelSize * 1.2}px)`,
              opacity: clamp01(labelIn * 1.6),
              textShadow: "0 4px 18px rgba(0,0,0,0.6)",
            }}
          >
            <Signal text={label} />
          </div>
        </div>
      ) : null}
    </div>
  );
};
