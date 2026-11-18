import React from "react";
import { AbsoluteFill, random } from "remotion";
import { useGlobalFrame } from "../../lib/beat";
import { decay, rgba } from "./lib";

const fill: React.CSSProperties = { position: "absolute", inset: 0, pointerEvents: "none" };
type RGB = [number, number, number];

/**
 * Local RGB split + glitch slices on ONE layer (a single SVG filter, so a video inside stays one element).
 * rgb = channel offset in px, slice = max horizontal slice displacement in px, seed changes the slice pattern.
 * The tree is stable (the filter is only switched to "none"), so the children never remount.
 */
export const Glitch: React.FC<{ id: string; rgb: number; slice?: number; seed?: number; sliceFreq?: number; expo?: number; children: React.ReactNode }> = ({ id, rgb, slice = 0, seed = 1, sliceFreq = 0.012, expo = 1, children }) => {
  const useSlice = slice > 0.5;
  const on = rgb > 1.2 || useSlice;
  const fid = `esc-gl-${id}`;
  return (
    <AbsoluteFill>
      {on ? (
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <filter id={fid} x="-5%" y="0%" width="110%" height="100%" colorInterpolationFilters="sRGB">
            {useSlice ? (
              <>
                <feTurbulence type="fractalNoise" baseFrequency={`0.00001 ${sliceFreq}`} numOctaves="1" seed={seed} result="n" />
                <feComponentTransfer in="n" result="steps">
                  <feFuncR type="discrete" tableValues="0.5 0.5 0.15 0.5 0.85 0.5 0.5 0.3 0.5 0.7 0.5" />
                  <feFuncG type="discrete" tableValues="0.5" />
                </feComponentTransfer>
                <feDisplacementMap in="SourceGraphic" in2="steps" scale={slice * 2} xChannelSelector="R" yChannelSelector="G" result="d" />
              </>
            ) : (
              <feOffset in="SourceGraphic" dx="0" dy="0" result="d" />
            )}
            <feColorMatrix in="d" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feOffset in="r" dx={rgb} dy="0" result="r2" />
            <feColorMatrix in="d" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="gg" />
            <feColorMatrix in="d" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
            <feOffset in="b" dx={-rgb} dy={rgb * 0.25} result="b2" />
            <feBlend in="r2" in2="gg" mode="screen" result="rg" />
            <feBlend in="rg" in2="b2" mode="screen" />
          </filter>
        </svg>
      ) : null}
      <AbsoluteFill style={{ filter: [on ? `url(#${fid})` : "", expo > 1.005 ? `brightness(${expo.toFixed(3)})` : ""].join(" ").trim() || "none" }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/** A flash on our own cut (TrailerFX already owns the white flash on the BIG hits). */
export const Flash: React.FC<{ at: number; frames?: number; color?: string; strength?: number; blend?: React.CSSProperties["mixBlendMode"] }> = ({ at, frames = 2.2, color = "#fff", strength = 0.75, blend = "screen" }) => {
  const g = useGlobalFrame();
  const a = decay(g, at, frames) * strength;
  if (a < 0.01) return null;
  return <div style={{ ...fill, background: color, opacity: a, mixBlendMode: blend }} />;
};

/** Expanding shockwave ring + light burst centred on (x, y). */
export const Shockwave: React.FC<{ at: number; x: number; y: number; col?: RGB; frames?: number; max?: number; strength?: number }> = ({ at, x, y, col = [182, 255, 59], frames = 26, max = 1500, strength = 1 }) => {
  const g = useGlobalFrame();
  const t = g - at;
  if (t < 0 || t > frames) return null;
  const p = t / frames;
  const e = 1 - Math.pow(1 - p, 3);
  const r = 40 + max * e;
  const a = (1 - p) * strength;
  const w = 10 + 50 * (1 - p);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - r,
          top: y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: "50%",
          border: `${Math.max(2, w * 0.35)}px solid ${rgba(col, 0.85 * a)}`,
          boxShadow: `0 0 ${w}px ${rgba(col, 0.7 * a)}, inset 0 0 ${w * 1.4}px ${rgba(col, 0.45 * a)}`,
          mixBlendMode: "screen",
        }}
      />
      <div style={{ ...fill, mixBlendMode: "screen", background: `radial-gradient(circle ${Math.round(r * 0.9)}px at ${x}px ${y}px, ${rgba(col, 0.32 * a * a)} 0%, ${rgba(col, 0)} 100%)` }} />
    </>
  );
};

/**
 * Volumetric beams from a source just above the frame (port of Beams from the user's previous reel's cinematic
 * layer: irregular conic rays, soft-edged, slowly sweeping, frame-driven).
 */
export const Beams: React.FC<{ intensity: number; col?: RGB; x?: number; y?: number; seed?: string; spread?: [number, number] }> = ({ intensity, col = [150, 200, 255], x = 58, y = -8, seed = "esc", spread = [140, 220] }) => {
  const g = useGlobalFrame();
  if (intensity < 0.005) return null;
  const t = g / 60;
  const [a0, a1] = spread;
  const sweep = 2.6 * Math.sin((t / 9) * Math.PI * 2);
  const N = 9;
  const stops: string[] = ["rgba(0,0,0,0) 0deg"];
  for (let i = 0; i < N; i++) {
    const jitter = (random(`${seed}-j${i}`) - 0.5) * 0.5;
    const centre = a0 + ((a1 - a0) * (i + 0.5 + jitter)) / N + sweep * (0.6 + 0.4 * random(`${seed}-s${i}`));
    const width = 1.2 + random(`${seed}-w${i}`) * 2.6;
    const base = 0.3 + random(`${seed}-a${i}`) * 0.7;
    const flicker = 0.65 + 0.35 * Math.sin((t / (2.4 + random(`${seed}-p${i}`) * 3)) * Math.PI * 2 + random(`${seed}-ph${i}`) * 6.283);
    const a = base * flicker;
    stops.push(`rgba(0,0,0,0) ${(centre - width).toFixed(2)}deg`);
    stops.push(`${rgba(col, a)} ${centre.toFixed(2)}deg`);
    stops.push(`rgba(0,0,0,0) ${(centre + width * 1.3).toFixed(2)}deg`);
  }
  stops.push("rgba(0,0,0,0) 360deg");
  const mask = `radial-gradient(circle at ${x}% ${y}%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0) 75%)`;
  const bg = `conic-gradient(from 0deg at ${x}% ${y}%, ${stops.join(", ")})`;
  return <div style={{ ...fill, mixBlendMode: "screen", opacity: Math.min(1, intensity), background: bg, maskImage: mask, WebkitMaskImage: mask }} />;
};

/** Anamorphic flare (port of AnamorphicFlare from the previous reel): horizontal streak + core + ghosts. */
export const Flare: React.FC<{ at: number; x: number; y: number; col?: RGB; dur?: number; strength?: number }> = ({ at, x, y, col = [125, 211, 252], dur = 30, strength = 1 }) => {
  const g = useGlobalFrame();
  const t = g - at;
  if (t < 0 || t > dur) return null;
  const env = t < 2 ? t / 2 : Math.exp(-(t - 2) / Math.max(1, dur * 0.3));
  const a = env * strength * Math.min(1, (dur - t) / 4);
  const w = 0.5 + 0.8 * (1 - Math.pow(1 - t / dur, 3));
  const streak = (h: number, core: string, mid: string, ww: number) => (
    <div style={{ position: "absolute", left: 0, right: 0, top: y - h / 2, height: h, mixBlendMode: "screen", background: `radial-gradient(ellipse ${(ww * 100).toFixed(1)}% 50% at ${x}px 50%, ${core} 0%, ${mid} 32%, rgba(0,0,0,0) 100%)` }} />
  );
  return (
    <>
      {streak(180, rgba(col, 0.38 * a), rgba(col, 0.12 * a), w * 1.1)}
      {streak(14, `rgba(255,255,255,${(0.95 * a).toFixed(3)})`, rgba(col, 0.7 * a), w)}
      <div style={{ ...fill, mixBlendMode: "screen", background: `radial-gradient(circle 150px at ${x}px ${y}px, rgba(255,250,240,${(0.85 * a).toFixed(3)}) 0%, ${rgba(col, 0.4 * a)} 22%, rgba(0,0,0,0) 100%)` }} />
    </>
  );
};

/** Dark stage: ink + a cold glow behind the subject + optional faint grid. */
export const Stage: React.FC<{ glow?: RGB; glowA?: number; gx?: number; gy?: number; grid?: number }> = ({ glow = [70, 110, 170], glowA = 0.32, gx = 55, gy = 45, grid = 0 }) => (
  <>
    <div style={{ ...fill, background: `radial-gradient(ellipse 70% 45% at ${gx}% ${gy}%, ${rgba(glow, glowA)} 0%, ${rgba(glow, glowA * 0.25)} 45%, rgba(3,6,13,0) 100%), #03060d` }} />
    {grid > 0 ? (
      <div
        style={{
          ...fill,
          opacity: grid,
          backgroundImage: "linear-gradient(rgba(230,237,247,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(230,237,247,0.07) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
          maskImage: "radial-gradient(ellipse 70% 55% at 50% 45%, #000 0%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 55% at 50% 45%, #000 0%, transparent 100%)",
        }}
      />
    ) : null}
  </>
);

/** Dust motes drifting in the light (deterministic, frame-driven, cheap DOM dots). */
export const Dust: React.FC<{ n?: number; col?: RGB; a?: number; seed?: string; cx?: number; spread?: number }> = ({ n = 34, col = [200, 220, 255], a = 0.55, seed = "dust", cx = 540, spread = 520 }) => {
  const g = useGlobalFrame();
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const r0 = random(`${seed}-x${i}`), r1 = random(`${seed}-y${i}`), r2 = random(`${seed}-s${i}`), r3 = random(`${seed}-p${i}`);
    const sp = 0.25 + r2 * 0.6;
    const y = ((r1 * 1700 - g * sp * 0.9) % 1700 + 1700) % 1700 + 120;
    const x = cx + (r0 - 0.5) * 2 * spread * (0.35 + (y / 1900) * 0.75) + Math.sin(g * 0.02 + r3 * 6.28) * 14;
    const size = 2 + r2 * 5;
    const fl = 0.45 + 0.55 * Math.sin(g * (0.05 + r3 * 0.07) + r0 * 6.28) ** 2;
    dots.push(<div key={i} style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", background: rgba(col, a * fl * (0.4 + 0.6 * (1 - r2))), filter: size > 5 ? "blur(1.5px)" : undefined }} />);
  }
  return <div style={{ ...fill, mixBlendMode: "screen" }}>{dots}</div>;
};

/** Darkness creeping in from the edges (local exposure shaping, NOT a global vignette). */
export const Falloff: React.FC<{ a?: number; top?: number }> = ({ a = 0.6, top = 0 }) => (
  <>
    <div style={{ ...fill, background: `radial-gradient(ellipse 80% 62% at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,${a.toFixed(3)}) 100%)` }} />
    {top > 0 ? <div style={{ ...fill, background: `linear-gradient(180deg, rgba(0,0,0,${top.toFixed(3)}) 0%, rgba(0,0,0,0) 30%)` }} /> : null}
  </>
);
