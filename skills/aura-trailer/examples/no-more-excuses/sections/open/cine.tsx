import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { rand, useGlobalFrame } from "../../lib/beat";

/**
 * Cinematic finishing pieces ported from the user's previous reel (remotion-video/src/cinematic: GradeDarkness,
 * AnamorphicFlare) and his series' PIP glass card (cinematic-reel-builder/rules/talking-head.md), re-written
 * frame-driven on GLOBAL frames for this trailer. Local to the OPEN section.
 */
const fill: React.CSSProperties = { position: "absolute", inset: 0, pointerEvents: "none" };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type RGB = [number, number, number];
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

/**
 * Exposure shaping: darkness creeping in from the four corners (breathing slowly so it feels alive),
 * an optional hard key on the face (everything else falls to black) and a cool soft-light key.
 */
export const Darkness: React.FC<{ creep?: number; spot?: number; x?: number; y?: number; key?: number }> = ({ creep = 0.6, spot = 0, x = 50, y = 34, key = 0.4 }) => {
  const g = useGlobalFrame();
  const t = g / 60;
  const breathe = (period: number, phase: number) => 1 + 0.09 * Math.sin((t / period) * Math.PI * 2 + phase);
  const corner = (cx: string, cy: string, period: number, phase: number) => {
    const r = 260 + 820 * creep * breathe(period, phase);
    const a = Math.min(0.92, 0.25 + 0.7 * creep);
    return `radial-gradient(circle ${Math.round(r)}px at ${cx} ${cy}, rgba(0,0,0,${a.toFixed(3)}) 0%, rgba(0,0,0,${(a * 0.55).toFixed(3)}) 45%, rgba(0,0,0,0) 100%)`;
  };
  return (
    <>
      {creep > 0.01 ? (
        <div style={{ ...fill, background: [corner("0%", "0%", 7.3, 0), corner("100%", "0%", 8.1, 1.7), corner("0%", "100%", 6.7, 3.1), corner("100%", "100%", 7.9, 4.4)].join(", ") }} />
      ) : null}
      {spot > 0.001 ? (
        <>
          <div style={{ ...fill, background: `radial-gradient(ellipse 40% 24% at ${x}% ${y}%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,${(0.55 * spot).toFixed(3)}) 78%, rgba(0,0,0,${(0.96 * spot).toFixed(3)}) 100%)` }} />
          <div style={{ ...fill, mixBlendMode: "soft-light", background: `radial-gradient(ellipse 28% 17% at ${x - 3}% ${y - 1.5}%, rgba(225,235,255,${(key * spot).toFixed(3)}) 0%, rgba(225,235,255,0) 100%)` }} />
        </>
      ) : null}
    </>
  );
};

/** Anamorphic lens flare peaking 3 frames after `at`: long horizontal streak, hot core, ghosts through the centre. */
export const Flare: React.FC<{ at: number; x: number; y: number; col: RGB; dur?: number; strength?: number; size?: number; ghosts?: boolean }> = ({ at, x, y, col, dur = 40, strength = 1, size = 150, ghosts = true }) => {
  const g = useGlobalFrame();
  const fr = g - at;
  if (fr < 0 || fr > dur) return null;
  const attack = 3;
  const env = fr < attack ? interpolate(fr, [0, attack], [0, 1], clamp) : Math.exp(-(fr - attack) / Math.max(1, dur * 0.32));
  const a = env * interpolate(fr, [dur - 4, dur], [1, 0], clamp) * strength;
  if (a < 0.003) return null;
  const w = interpolate(fr, [0, dur], [0.45, 1.3], clamp);
  const px = x * 1080, py = y * 1920;
  const streak = (h: number, core: string, mid: string, ww: number) => (
    <div style={{ position: "absolute", left: 0, right: 0, top: py - h / 2, height: h, mixBlendMode: "screen", background: `radial-gradient(ellipse ${(ww * 100).toFixed(1)}% 50% at ${px}px 50%, ${core} 0%, ${mid} 32%, rgba(0,0,0,0) 100%)` }} />
  );
  const ghostList = ghosts ? [0.45, 0.85, 1.35, 1.75] : [];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {streak(170, rgba(col, 0.38 * a), rgba(col, 0.12 * a), w * 1.1)}
      {streak(14, `rgba(255,255,255,${(0.95 * a).toFixed(3)})`, rgba(col, 0.7 * a), w)}
      <div style={{ ...fill, mixBlendMode: "screen", background: `radial-gradient(circle ${size}px at ${px}px ${py}px, rgba(255,250,240,${(0.8 * a).toFixed(3)}) 0%, ${rgba(col, 0.42 * a)} 22%, rgba(0,0,0,0) 100%)` }} />
      {ghostList.map((s, i) => {
        const gx = px + (540 - px) * s * 1.15, gy = py + (960 - py) * s * 1.15;
        const r = 26 + 60 * rand(i * 9.1 + 3) * (0.6 + s * 0.4);
        const gc: RGB = i % 2 === 0 ? [120, 200, 255] : col;
        return <div key={i} style={{ ...fill, mixBlendMode: "screen", background: `radial-gradient(circle ${Math.round(r)}px at ${gx.toFixed(1)}px ${gy.toFixed(1)}px, ${rgba(gc, 0.1 * a)} 0%, ${rgba(gc, 0.16 * a)} 70%, rgba(0,0,0,0) 100%)` }} />;
      })}
    </AbsoluteFill>
  );
};

/** His series' iOS liquid-glass PIP shadow stack (accent halo = topic colour). */
export const pipShadow = (accent: RGB = [125, 211, 252], second: RGB = [167, 139, 250]) =>
  [
    "0 0 0 0.5px rgba(255,255,255,0.18)",
    "0 6px 18px rgba(0,0,0,0.55)",
    "0 38px 80px rgba(0,0,0,0.5)",
    `0 0 90px ${rgba(accent, 0.28)}`,
    `0 -22px 70px ${rgba(second, 0.18)}`,
    "inset 0 0.6px 0 rgba(255,255,255,0.55)",
    "inset 0 16px 28px -16px rgba(255,255,255,0.22)",
    "inset 0 -0.6px 0 rgba(0,0,0,0.5)",
    "inset 0 -18px 32px -16px rgba(0,0,0,0.55)",
  ].join(", ");

/** The glass sheen layers that sit on top of the PIP video (top bloom, bottom depth, specular, ring). */
export const PipSheen: React.FC<{ radius: number; accent?: RGB }> = ({ radius, accent = [125, 211, 252] }) => (
  <>
    <div style={{ ...fill, height: "32%", bottom: "auto", background: "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 40%, transparent 100%)", mixBlendMode: "screen" }} />
    <div style={{ ...fill, top: "auto", height: "32%", background: "linear-gradient(0deg, rgba(0,0,0,0.38) 0%, transparent 100%)" }} />
    <div style={{ position: "absolute", top: -8, left: -8, width: "55%", height: "45%", pointerEvents: "none", background: "radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 30%, transparent 60%)", mixBlendMode: "screen" }} />
    <div
      style={{
        ...fill,
        borderRadius: radius,
        padding: 1.5,
        background: `linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 25%, ${rgba(accent, 0.2)} 60%, rgba(255,255,255,0.28) 100%)`,
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude" as React.CSSProperties["maskComposite"],
      }}
    />
  </>
);

/** Terminal-style glyph decode: returns `word` with its not-yet-resolved letters replaced by noise glyphs. */
const GLYPHS = "█<>/#%&@$01=+*";
export const decode = (word: string, g: number, at: number, perChar = 1.6, scramble = 5) => {
  let out = "";
  for (let i = 0; i < word.length; i++) {
    const resolveAt = at + i * perChar + scramble;
    const ch = word[i];
    if (g >= resolveAt || ch === " " || ch === "·") out += ch;
    else if (g >= at + i * perChar) out += GLYPHS[Math.floor(rand(g * 13.7 + i * 7.3) * GLYPHS.length)];
    else out += " ";
  }
  return out;
};
