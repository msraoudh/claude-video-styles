// HERO — 2D finishing pieces (local to this section): type, light, glitch, cuts.
// Light pieces are ports of the previous reel's cinematic layer (AnamorphicFlare, Pop) re-timed to
// GLOBAL frames. All blend with 'screen' so they only add light.
import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence } from "remotion";
import { fontInter, fontMono } from "../../kit/fonts";
import { rand } from "../../lib/beat";
import { L } from "../../lib/look";
import { SEC_FROM } from "./timeline";

export const OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const IN = Easing.bezier(0.7, 0, 0.84, 0);
export const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = (f: number, a: number, b: number, from: number, to: number, e = OUT) =>
  interpolate(f, [a, b], [from, to], { ...cl, easing: e });

const fill: React.CSSProperties = { position: "absolute", inset: 0, pointerEvents: "none" };
export type RGB = readonly [number, number, number];
export const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

/** A <Sequence> addressed in GLOBAL frames (the hero section starts at SEC_FROM). */
export const At: React.FC<{ from: number; to: number; children: React.ReactNode; name?: string }> = ({ from, to, children, name }) => (
  <Sequence from={from - SEC_FROM} durationInFrames={Math.max(1, to - from)} name={name} premountFor={30}>
    {children}
  </Sequence>
);

/** Mono caps label (JetBrains Mono, wide tracking). */
export const Mono: React.FC<{ children: React.ReactNode; size?: number; color?: string; ls?: number; weight?: 500 | 700; style?: React.CSSProperties }> = ({
  children,
  size = 24,
  color = L.steel2,
  ls = 0.38,
  weight = 500,
  style,
}) => (
  <div style={{ fontFamily: fontMono, fontSize: size, fontWeight: weight, letterSpacing: `${ls}em`, textTransform: "uppercase", color, whiteSpace: "nowrap", lineHeight: 1, ...style }}>
    {children}
  </div>
);

/** Big trailer type (Inter 800, tight). */
export const Big: React.FC<{ children: React.ReactNode; size: number; color?: string; ls?: number; style?: React.CSSProperties }> = ({ children, size, color = L.steel, ls = -0.045, style }) => (
  <div style={{ fontFamily: fontInter, fontWeight: 800, fontSize: size, letterSpacing: `${ls}em`, lineHeight: 0.86, textTransform: "uppercase", color, whiteSpace: "nowrap", ...style }}>
    {children}
  </div>
);

/** Characters appear one by one from frame `start` (a cursor block blinks at the end while typing). */
export const typeOn = (text: string, f: number, start: number, cps = 1.6) => {
  const n = Math.max(0, Math.floor((f - start) * cps));
  return { shown: text.slice(0, n), done: n >= text.length, typing: n > 0 && n < text.length };
};

export const TypeOn: React.FC<{ text: string; f: number; start: number; cps?: number; cursor?: string }> = ({ text, f, start, cps = 1.6, cursor = L.acid }) => {
  const t = typeOn(text, f, start, cps);
  if (f < start) return null;
  // reserve the full width so the line never jumps; untyped chars are transparent
  return (
    <span>
      {t.shown}
      <span style={{ color: "transparent" }}>{text.slice(t.shown.length)}</span>
      {t.typing ? <span style={{ position: "relative", marginLeft: "-1ch", background: cursor, color: "transparent" }}>_</span> : null}
    </span>
  );
};

/** Anamorphic flare (horizontal streak + core + ghosts), peaks 3 frames after `start`. */
export const Flare: React.FC<{ f: number; start: number; dur: number; x: number; y: number; col?: RGB; strength?: number; size?: number; ghosts?: boolean }> = ({
  f,
  start,
  dur,
  x,
  y,
  col = [150, 195, 255],
  strength = 1,
  size = 150,
  ghosts = true,
}) => {
  const lf = f - start;
  if (lf < 0 || lf > dur) return null;
  const attack = 3;
  const env = lf < attack ? lf / attack : Math.exp(-(lf - attack) / Math.max(1, dur * 0.32));
  const fade = interpolate(lf, [dur - 4, dur], [1, 0], cl);
  const a = env * fade * strength;
  if (a < 0.003) return null;
  const w = interpolate(lf, [0, dur], [0.45, 1.3], { ...cl, easing: OUT });
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
  const gl = ghosts ? [0.45, 0.85, 1.35, 1.75] : [];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {streak(170, rgba(col, 0.36 * a), rgba(col, 0.1 * a), w * 1.1)}
      {streak(14, `rgba(255,255,255,${(0.95 * a).toFixed(3)})`, rgba(col, 0.7 * a), w)}
      <div style={{ ...fill, mixBlendMode: "screen", background: `radial-gradient(circle ${size}px at ${x}px ${y}px, rgba(255,250,240,${(0.85 * a).toFixed(3)}) 0%, ${rgba(col, 0.42 * a)} 22%, rgba(0,0,0,0) 100%)` }} />
      {gl.map((s, i) => {
        const gx = x + (540 - x) * s * 1.15;
        const gy = y + (960 - y) * s * 1.15;
        const r = 26 + 60 * rand(i * 7 + 3) * (0.6 + s * 0.4);
        const gc: RGB = i % 2 === 0 ? [120, 200, 255] : col;
        return (
          <div
            key={i}
            style={{ ...fill, mixBlendMode: "screen", background: `radial-gradient(circle ${Math.round(r)}px at ${gx.toFixed(1)}px ${gy.toFixed(1)}px, ${rgba(gc, 0.08 * a)} 0%, ${rgba(gc, 0.14 * a)} 70%, rgba(0,0,0,0) 100%)` }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Exposure pop on a hard cut / punch (1–2 frames of extra light, then decays over ~5). */
export const Pop: React.FC<{ f: number; at: number; peak?: number; col?: RGB }> = ({ f, at, peak = 0.16, col = [215, 230, 255] }) => {
  const o = interpolate(f - at, [0, 1, 6], [peak, peak, 0], cl);
  if (f < at || o <= 0.002) return null;
  return <div style={{ ...fill, mixBlendMode: "screen", backgroundColor: rgba(col, 1), opacity: o }} />;
};

/** Horizontal glitch slices: offsets bands of the CHILD (rendered N times, clipped). Use on 2–4 frames only. */
export const GlitchSlices: React.FC<{ f: number; seed: number; amount: number; children: React.ReactNode; bands?: number }> = ({ f, seed, amount, children, bands = 7 }) => {
  if (amount <= 0.01) return <>{children}</>;
  const cuts: number[] = [0];
  for (let i = 1; i < bands; i++) cuts.push(Math.min(1, cuts[i - 1] + (0.06 + rand(seed * 13 + i + f) * 0.24)));
  cuts.push(1);
  return (
    <AbsoluteFill>
      {cuts.slice(0, -1).map((y0, i) => {
        const y1 = cuts[i + 1];
        if (y1 <= y0) return null;
        const dx = (rand(seed * 31 + i * 7 + f * 3) - 0.5) * 2 * 60 * amount * (rand(seed + i) > 0.4 ? 1 : 0.15);
        return (
          <AbsoluteFill key={i} style={{ clipPath: `inset(${(y0 * 100).toFixed(2)}% 0 ${((1 - y1) * 100).toFixed(2)}% 0)`, transform: `translateX(${dx.toFixed(1)}px)` }}>
            {children}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

/** Cheap glitch overlay (no re-render of the content): a few bands whose backdrop is inverted / hue-shifted. */
export const GlitchBands: React.FC<{ f: number; seed: number; amount: number }> = ({ f, seed, amount }) => {
  if (amount <= 0.01) return null;
  const n = 6;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, i) => {
        const y = rand(seed * 7 + i * 13 + f) * 1920;
        const h = 8 + rand(seed * 3 + i * 5 + f * 2) * 90 * amount;
        const mode = i % 3;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: y,
              height: h,
              backdropFilter: mode === 0 ? "invert(1) hue-rotate(180deg)" : mode === 1 ? "hue-rotate(110deg) saturate(3) brightness(1.4)" : "brightness(2.2) contrast(1.4)",
              WebkitBackdropFilter: mode === 0 ? "invert(1) hue-rotate(180deg)" : mode === 1 ? "hue-rotate(110deg) saturate(3) brightness(1.4)" : "brightness(2.2) contrast(1.4)",
              opacity: Math.min(1, amount * 1.4),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * Chromatic aberration done right: the red channel and the green+blue channels are separated (SVG colour
 * matrices) and re-added with 'screen' — aligned they rebuild the exact image, offset they fringe. No milky lift.
 * Children are rendered twice.
 */
export const RgbSplit: React.FC<{ px: number; children: React.ReactNode }> = ({ px, children }) => {
  if (px < 0.5) return <>{children}</>;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id="hero-ch-r" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
          </filter>
          <filter id="hero-ch-gb" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill style={{ filter: "url(#hero-ch-gb)", transform: `translateX(${(-px / 2).toFixed(1)}px)` }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ filter: "url(#hero-ch-r)", transform: `translateX(${(px / 2).toFixed(1)}px)`, mixBlendMode: "screen" }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Corner brackets (viewfinder / face lock) around a box, with a label. */
export const Brackets: React.FC<{ x: number; y: number; w: number; h: number; color?: string; arm?: number; thick?: number; label?: React.ReactNode; opacity?: number }> = ({
  x,
  y,
  w,
  h,
  color = L.violet,
  arm = 46,
  thick = 3,
  label,
  opacity = 1,
}) => {
  const c = (l: number, t: number, bl: boolean, bt: boolean) => (
    <div
      style={{
        position: "absolute",
        left: l - (bl ? 0 : arm),
        top: t - (bt ? 0 : arm),
        width: arm,
        height: arm,
        borderLeft: bl ? `${thick}px solid ${color}` : undefined,
        borderRight: !bl ? `${thick}px solid ${color}` : undefined,
        borderTop: bt ? `${thick}px solid ${color}` : undefined,
        borderBottom: !bt ? `${thick}px solid ${color}` : undefined,
        boxShadow: `0 0 18px ${color}`,
      }}
    />
  );
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity }}>
      {c(x, y, true, true)}
      {c(x + w, y, false, true)}
      {c(x, y + h, true, false)}
      {c(x + w, y + h, false, false)}
      {label ? <div style={{ position: "absolute", left: x, top: y + h + 18 }}>{label}</div> : null}
    </div>
  );
};

/** The 9-layer liquid-glass shadow stack of his series (talking-head card), accent = halo colour. */
export const glassShadow = (accent: RGB = [125, 211, 252], second: RGB = [167, 139, 250], k = 1) =>
  [
    "0 0 0 0.5px rgba(255,255,255,0.18)",
    "0 6px 18px rgba(0,0,0,0.55)",
    "0 38px 80px rgba(0,0,0,0.5)",
    `0 0 90px ${rgba(accent, 0.28 * k)}`,
    `0 -22px 70px ${rgba(second, 0.18 * k)}`,
    "inset 0 0.6px 0 rgba(255,255,255,0.55)",
    "inset 0 16px 28px -16px rgba(255,255,255,0.22)",
    "inset 0 -0.6px 0 rgba(0,0,0,0.5)",
    "inset 0 -18px 32px -16px rgba(0,0,0,0.55)",
  ].join(", ");

/** Gradient hairline ring (mask-composite) used on his glass cards. */
export const GlassRing: React.FC<{ radius: number; accent?: RGB; width?: number }> = ({ radius, accent = [125, 211, 252], width = 1.5 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: radius,
      padding: width,
      background: `linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 25%, ${rgba(accent, 0.22)} 60%, rgba(255,255,255,0.28) 100%)`,
      WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
      WebkitMaskComposite: "xor",
      maskComposite: "exclude",
      pointerEvents: "none",
    }}
  />
);

/** Specular sheen inside a glass card (upper-left bloom + one low sweep at `sweep` 0..1). */
export const GlassSheen: React.FC<{ sweep?: number; k?: number }> = ({ sweep, k = 1 }) => (
  <>
    <div
      style={{
        ...fill,
        background: "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 40%, transparent 100%)",
        mixBlendMode: "screen",
        opacity: k,
        height: "32%",
      }}
    />
    <div
      style={{
        position: "absolute",
        top: -8,
        left: -8,
        width: "55%",
        height: "45%",
        background: "radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 30%, transparent 60%)",
        mixBlendMode: "screen",
        opacity: k,
        pointerEvents: "none",
      }}
    />
    {sweep !== undefined && sweep > 0 && sweep < 1 ? (
      <div
        style={{
          ...fill,
          mixBlendMode: "screen",
          background: `linear-gradient(105deg, transparent ${(sweep * 160 - 40).toFixed(1)}%, rgba(255,255,255,0.22) ${(sweep * 160 - 25).toFixed(1)}%, rgba(255,255,255,0.05) ${(sweep * 160 - 15).toFixed(1)}%, transparent ${(sweep * 160 - 5).toFixed(1)}%)`,
        }}
      />
    ) : null}
  </>
);

export { fontInter, fontMono };
