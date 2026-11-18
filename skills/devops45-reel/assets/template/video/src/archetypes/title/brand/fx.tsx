import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";

/* Local light effects for the brand moments (S3 title drop, S6 follow, Cover). Screen-blended, frame-driven. */

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

/** clamped piecewise interpolate */
export const iv = (f: number, input: number[], output: number[], easing?: (t: number) => number) =>
  interpolate(f, input, output, { ...CL, easing });
/** one-shot envelope: 0 before the event (age < 0) */
export const hitEnv = (age: number, input: number[], output: number[]) => (age < 0 ? 0 : iv(age, input, output));
/** exp decay after an event (0 before) */
export const decay = (age: number, tau: number) => (age < 0 ? 0 : Math.exp(-age / tau));
export const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

export type RGB = [number, number, number];
export const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, a).toFixed(3)})`;
export const CYAN: RGB = [34, 211, 238];
export const ICE: RGB = [190, 240, 255];
export const AMBER: RGB = [245, 158, 11];
export const AMBER_HOT: RGB = [255, 196, 92];

/** Anamorphic lens flare: long horizontal streak + hot core. `age` = frames since it fired. */
export const AnamorphicFlare: React.FC<{ age: number; x: number; y: number; col?: RGB; dur?: number; strength?: number; size?: number; streakH?: number }> = ({
  age,
  x,
  y,
  col = CYAN,
  dur = 36,
  strength = 1,
  size = 170,
  streakH = 160,
}) => {
  if (age < 0 || age > dur) return null;
  const attack = 2;
  const env = age < attack ? age / attack : Math.exp(-(age - attack) / Math.max(1, dur * 0.3));
  const a = env * iv(age, [dur - 6, dur], [1, 0]) * strength;
  if (a < 0.003) return null;
  const w = iv(age, [0, dur], [0.45, 1.3], EASE_OUT);
  const streak = (h: number, core: string, mid: string, ww: number) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y - h / 2,
        height: h,
        mixBlendMode: "screen",
        background: `radial-gradient(ellipse ${(ww * 100).toFixed(1)}% 50% at ${x}px 50%, ${core} 0%, ${mid} 30%, rgba(0,0,0,0) 100%)`,
      }}
    />
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {streak(streakH, rgba(col, 0.3 * a), rgba(col, 0.08 * a), w * 1.1)}
      {streak(10, `rgba(255,255,255,${(0.9 * a).toFixed(3)})`, rgba(col, 0.65 * a), w)}
      <AbsoluteFill
        style={{
          mixBlendMode: "screen",
          background: `radial-gradient(circle ${size}px at ${x}px ${y}px, rgba(240,250,255,${(0.7 * a).toFixed(3)}) 0%, ${rgba(col, 0.35 * a)} 26%, rgba(0,0,0,0) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Expanding shockwave ring of light (screen blend). `age` in frames. */
export const Shockwave: React.FC<{ age: number; x: number; y: number; col?: RGB; dur?: number; strength?: number; maxR?: number; r0?: number }> = ({
  age,
  x,
  y,
  col = CYAN,
  dur = 22,
  strength = 1,
  maxR = 1400,
  r0 = 60,
}) => {
  if (age < 0 || age > dur) return null;
  const grow = iv(age, [0, dur], [0, 1], EASE_OUT);
  const a = strength * iv(age, [0, 1.5, dur], [0, 1, 0]);
  const R = r0 + maxR * grow;
  const px = (v: number) => `${Math.max(0, Math.round(v))}px`;
  return (
    <AbsoluteFill
      style={{
        mixBlendMode: "screen",
        pointerEvents: "none",
        background: `radial-gradient(circle at ${x}px ${y}px, rgba(0,0,0,0) ${px(R - 120)}, ${rgba(col, 0.14 * a)} ${px(R - 34)}, ${rgba(ICE, 0.5 * a)} ${px(R - 4)}, ${rgba(col, 0.18 * a)} ${px(R + 14)}, rgba(0,0,0,0) ${px(R + 70)})`,
      }}
    />
  );
};

/** Full-frame light flash (screen). The ONE 4–6 frame flash per scene. */
export const FlashFrame: React.FC<{ a: number; color?: string }> = ({ a, color = "rgb(200,246,255)" }) =>
  a > 0.005 ? <AbsoluteFill style={{ background: color, opacity: Math.min(1, a), mixBlendMode: "screen", pointerEvents: "none" }} /> : null;

/** Soft radial light (screen) — blooms behind glass / numbers. */
export const Bloom: React.FC<{ x: number; y: number; rx: number; ry: number; col: RGB; a: number }> = ({ x, y, rx, ry, col, a }) =>
  a > 0.003 ? (
    <AbsoluteFill
      style={{
        mixBlendMode: "screen",
        pointerEvents: "none",
        background: `radial-gradient(${rx}px ${ry}px at ${x}px ${y}px, ${rgba(col, a)} 0%, ${rgba(col, a * 0.42)} 38%, rgba(0,0,0,0) 100%)`,
      }}
    />
  ) : null;
