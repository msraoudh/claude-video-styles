import React from "react";
import { fontInter, fontMono } from "../../kit/fonts";
import { useGlobalFrame } from "../../lib/beat";
import { L } from "../../lib/look";
import { clamp01, decay, EO, lin } from "./lib";

/**
 * One line of giant trailer type (Inter 800, uppercase, -0.04em) that SLAMS in on its frame:
 * scale 1.22 → 1, blur 14 → 0 over 6 frames, with an RGB-fringe text-shadow that decays (cheap, no filter on video).
 * x/y = left/baseline-ish top of the line box in px; size in px.
 */
export const Slam: React.FC<{
  text: string;
  at: number;
  x: number;
  y: number;
  size: number;
  color?: string;
  align?: "left" | "center" | "right";
  width?: number;
  out?: number;
  outline?: boolean;
  opacity?: number;
  track?: number;
  from?: number;
  glow?: string;
}> = ({ text, at, x, y, size, color = L.steel, align = "left", width = 1080, out, outline = false, opacity = 1, track = -0.04, from = 1.22, glow }) => {
  const g = useGlobalFrame();
  if (g < at) return null;
  if (out !== undefined && g >= out) return null;
  const p = lin(g, at, at + 6, 0, 1, EO);
  const sc = from + (1 - from) * p;
  const blur = 14 * (1 - p);
  const fr = outline ? 0 : 9 * decay(g, at, 5);
  const shadow = [fr > 0.4 ? `${-fr}px 0 0 rgba(255,46,77,0.65), ${fr}px 0 0 rgba(125,211,252,0.65)` : "", glow ? `0 0 60px ${glow}` : ""].filter(Boolean).join(", ");
  const origin = align === "left" ? "0% 60%" : align === "right" ? "100% 60%" : "50% 60%";
  return (
    <div
      style={{
        position: "absolute",
        left: align === "center" ? x - width / 2 : align === "right" ? x - width : x,
        top: y,
        width,
        textAlign: align,
        fontFamily: fontInter,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 0.82,
        letterSpacing: `${track}em`,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        color: outline ? "transparent" : color,
        WebkitTextStroke: outline ? `${Math.max(2, size / 90)}px ${color}` : undefined,
        textShadow: shadow || undefined,
        transform: `scale(${sc})`,
        transformOrigin: origin,
        filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined,
        opacity: opacity * clamp01((g - at + 1) / 2),
      }}
    >
      {text}
    </div>
  );
};

/** Small mono label (JetBrains Mono caps, wide tracking). */
export const Mono: React.FC<{ text: string; x: number; y: number; size?: number; color?: string; align?: "left" | "center" | "right"; track?: number; opacity?: number; dot?: string }> = ({ text, x, y, size = 26, color = L.steel2, align = "center", track = 0.42, opacity = 1, dot }) => (
  <div
    style={{
      position: "absolute",
      left: align === "center" ? x - 540 : align === "right" ? x - 1080 : x,
      top: y,
      width: 1080,
      textAlign: align,
      fontFamily: fontMono,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: `${track}em`,
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      color,
      opacity,
      // letter-spacing adds a trailing gap after the last glyph: compensate so centred labels are optically centred
      paddingLeft: align === "center" ? `${track}em` : undefined,
      boxSizing: "border-box",
    }}
  >
    {dot ? <span style={{ color: dot, marginRight: "0.6em" }}>●</span> : null}
    {text}
  </div>
);
