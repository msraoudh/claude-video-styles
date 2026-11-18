import React from "react";
import { AbsoluteFill, Easing, interpolate, random } from "remotion";

/* Local effects of the CLIMAX (the global grain / vignette / letterbox / big-hit flash belong to TrailerFX). */

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

/** clamped interpolate (piecewise) */
export const iv = (f: number, input: number[], output: number[], easing?: (t: number) => number) =>
  interpolate(f, input, output, { ...CL, easing });

/** one-shot envelope: 0 before the event (age < 0), else the clamped interpolation */
export const hitEnv = (age: number, input: number[], output: number[]) => (age < 0 ? 0 : iv(age, input, output));

/** smoothstep */
export const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

export type RGB = [number, number, number];
export const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, a).toFixed(3)})`;
export const COLD: RGB = [150, 205, 255];
export const BLOOD: RGB = [255, 46, 77];
export const ACID: RGB = [182, 255, 59];

/**
 * RGB split as an SVG filter (one video element, no duplicates): red shifted +dx, blue -dx.
 * Render <RGBSplitDefs id dx/> once, then use style={{ filter: `url(#id)` }} on the layer.
 */
export const RGBSplitDefs: React.FC<{ id: string; dx: number; dy?: number }> = ({ id, dx, dy = 0 }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <filter id={id} x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
        <feOffset in="r" dx={dx} dy={dy} result="r2" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
        <feOffset in="b" dx={-dx} dy={-dy} result="b2" />
        <feBlend in="r2" in2="g" mode="screen" result="rg" />
        <feBlend in="rg" in2="b2" mode="screen" />
      </filter>
    </defs>
  </svg>
);

/**
 * Anamorphic lens flare (ported from his reel's cinematic/Light.tsx): long horizontal streak + hot core + ghosts.
 * `age` = frames since the flare fired.
 */
export const AnamorphicFlare: React.FC<{ age: number; x: number; y: number; col?: RGB; dur?: number; strength?: number; size?: number; width?: number; height?: number }> = ({
  age,
  x,
  y,
  col = COLD,
  dur = 36,
  strength = 1,
  size = 170,
  width = 1080,
  height = 1920,
}) => {
  if (age < 0 || age > dur) return null;
  const attack = 2;
  const env = age < attack ? age / attack : Math.exp(-(age - attack) / Math.max(1, dur * 0.3));
  const fade = iv(age, [dur - 5, dur], [1, 0]);
  const a = env * fade * strength;
  if (a < 0.003) return null;
  const w = iv(age, [0, dur], [0.5, 1.4], EASE_OUT);
  const streak = (h: number, core: string, mid: string, ww: number) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y - h / 2,
        height: h,
        mixBlendMode: "screen",
        background: `radial-gradient(ellipse ${(ww * 100).toFixed(1)}% 50% at ${x}px 50%, ${core} 0%, ${mid} 32%, rgba(0,0,0,0) 100%)`,
      }}
    />
  );
  const cx = width / 2;
  const cy = height / 2;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {streak(190, rgba(col, 0.36 * a), rgba(col, 0.1 * a), w * 1.1)}
      {streak(14, `rgba(255,255,255,${(0.95 * a).toFixed(3)})`, rgba(col, 0.7 * a), w)}
      <AbsoluteFill
        style={{
          mixBlendMode: "screen",
          background: `radial-gradient(circle ${size}px at ${x}px ${y}px, rgba(240,248,255,${(0.85 * a).toFixed(3)}) 0%, ${rgba(col, 0.4 * a)} 24%, rgba(0,0,0,0) 100%)`,
        }}
      />
      {[0.5, 0.95, 1.45].map((s, i) => {
        const gx = x + (cx - x) * s * 1.15;
        const gy = y + (cy - y) * s * 1.15 + (i - 1) * 160;
        const r = 24 + 50 * random(`cl-ghost${i}`);
        return (
          <AbsoluteFill
            key={i}
            style={{
              mixBlendMode: "screen",
              background: `radial-gradient(circle ${Math.round(r)}px at ${gx.toFixed(1)}px ${gy.toFixed(1)}px, ${rgba(col, 0.08 * a)} 0%, ${rgba(col, 0.14 * a)} 70%, rgba(0,0,0,0) 100%)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Expanding shockwave ring of cold light (screen blend). `age` in frames. */
export const Shockwave: React.FC<{ age: number; x: number; y: number; col?: RGB; dur?: number; strength?: number; maxR?: number }> = ({
  age,
  x,
  y,
  col = COLD,
  dur = 22,
  strength = 1,
  maxR = 1500,
}) => {
  if (age < 0 || age > dur) return null;
  const grow = iv(age, [0, dur], [0, 1], EASE_OUT);
  const a = strength * iv(age, [0, 1.5, dur], [0, 1, 0]);
  const R = 60 + maxR * grow;
  const px = (v: number) => `${Math.max(0, Math.round(v))}px`;
  return (
    <AbsoluteFill
      style={{
        mixBlendMode: "screen",
        pointerEvents: "none",
        background: `radial-gradient(circle at ${x}px ${y}px, rgba(0,0,0,0) ${px(R - 130)}, ${rgba(col, 0.16 * a)} ${px(R - 36)}, rgba(255,255,255,${(0.5 * a).toFixed(3)}) ${px(R - 4)}, ${rgba(col, 0.2 * a)} ${px(R + 16)}, rgba(0,0,0,0) ${px(R + 80)})`,
      }}
    />
  );
};

/** A flat colour flash frame (own cuts only — the big-hit flashes are TrailerFX's). */
export const FlashFrame: React.FC<{ a: number; color?: string; blend?: "screen" | "normal" }> = ({ a, color = "#fff", blend = "screen" }) =>
  a > 0.005 ? <AbsoluteFill style={{ background: color, opacity: Math.min(1, a), mixBlendMode: blend === "screen" ? "screen" : undefined, pointerEvents: "none" }} /> : null;

/** Thin horizontal scanlines (CRT / tape feel), local to a layer. */
export const Scanlines: React.FC<{ a: number; gap?: number }> = ({ a, gap = 4 }) =>
  a > 0.005 ? (
    <AbsoluteFill
      style={{
        opacity: a,
        pointerEvents: "none",
        backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 1px, rgba(0,0,0,0) ${gap / 2}px, rgba(0,0,0,0) ${gap}px)`,
      }}
    />
  ) : null;

/**
 * DOM block glitch for TEXT layers: the children are drawn in N horizontal bands, each band shifted by a
 * deterministic random x offset (+ a red / cyan fringe). amount 0 = a single clean copy.
 */
export const GlitchBands: React.FC<{ amount: number; seed: number; bands?: number; maxShift?: number; children: React.ReactNode; height?: number }> = ({
  amount,
  seed,
  bands = 9,
  maxShift = 60,
  children,
  height = 1920,
}) => {
  if (amount < 0.02) return <AbsoluteFill>{children}</AbsoluteFill>;
  const items: React.ReactNode[] = [];
  // uneven band heights
  const cuts = [0];
  for (let i = 1; i < bands; i++) cuts.push(i / bands + (random(`gb${seed}-${i}`) - 0.5) * (0.6 / bands));
  cuts.push(1);
  for (let i = 0; i < bands; i++) {
    const top = cuts[i] * height;
    const bottom = height - cuts[i + 1] * height;
    const r = random(`gbx${seed}-${i}`);
    const on = r > 0.35;
    const dx = on ? (random(`gbd${seed}-${i}`) - 0.5) * 2 * maxShift * amount : 0;
    items.push(
      <AbsoluteFill key={i} style={{ clipPath: `inset(${top.toFixed(1)}px 0px ${bottom.toFixed(1)}px 0px)`, transform: `translateX(${dx.toFixed(1)}px)` }}>
        {children}
      </AbsoluteFill>,
    );
  }
  return (
    <AbsoluteFill>
      {amount > 0.15 ? (
        <>
          <AbsoluteFill style={{ transform: `translateX(${(10 * amount).toFixed(1)}px)`, opacity: 0.55 * amount, filter: "sepia(1) saturate(8) hue-rotate(-50deg)", mixBlendMode: "screen" }}>
            {children}
          </AbsoluteFill>
          <AbsoluteFill style={{ transform: `translateX(${(-10 * amount).toFixed(1)}px)`, opacity: 0.5 * amount, filter: "sepia(1) saturate(6) hue-rotate(160deg)", mixBlendMode: "screen" }}>
            {children}
          </AbsoluteFill>
        </>
      ) : null}
      {items}
    </AbsoluteFill>
  );
};
