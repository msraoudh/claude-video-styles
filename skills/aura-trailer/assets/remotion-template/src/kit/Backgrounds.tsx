// Backgrounds — full-frame plates (absolute, inset 0).
//
//   <NightAurora variant="dusk" />     Night #060610 + aurora plate, slow drift/scale, grain, vignette (brand frames)
//   <OnyxBg glow="hero" />              true black + the app's rose glow (app UI frames)
//   <RippleBg />                        public/brand/ring-ripple.jpg slowly breathing
import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { noise2D } from "@remotion/noise";
import { C, type GlowPreset } from "./theme";
import { Glow, Grain } from "./Effects";

/** A soft dark vignette. */
export const Vignette: React.FC<{
  strength?: number;
  style?: React.CSSProperties;
}> = ({ strength = 0.55, style }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(120% 95% at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: "none",
      ...style,
    }}
  />
);

export type NightAuroraProps = {
  variant?: "dusk" | "halo" | "horizon";
  /** Slow drift + scale (default true). */
  drift?: boolean;
  /** Grain opacity (0 = off). Default 0.07. */
  grain?: number;
  vignette?: boolean;
  /** Plate opacity (lets Night show through). Default 1. */
  intensity?: number;
  /** Seconds offset for the drift so consecutive scenes don't repeat. */
  seed?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

/** Night #060610 + aurora light (dusk = rose from the top-left, violet from the bottom-right). */
export const NightAurora: React.FC<NightAuroraProps> = ({
  variant = "dusk",
  drift = true,
  grain = 0.07,
  vignette = true,
  intensity = 1,
  seed = "aurora",
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dx = drift ? noise2D(`${seed}-x`, t * 0.05, 0) * 2.2 : 0;
  const dy = drift ? noise2D(`${seed}-y`, 0, t * 0.05) * 2.2 : 0;
  const sc = drift ? 1.08 + 0.035 * Math.sin(t * 0.35) : 1.04;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: C.night,
        overflow: "hidden",
        ...style,
      }}
    >
      <Img
        src={staticFile(`brand/aurora-${variant}.jpg`)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: intensity,
          scale: String(sc),
          translate: `${dx}% ${dy}%`,
        }}
      />
      {vignette ? <Vignette strength={0.5} /> : null}
      {grain > 0 ? <Grain opacity={grain} /> : null}
      {children}
    </div>
  );
};

/** True black + an optional rose glow (the app's canvas). */
export const OnyxBg: React.FC<{
  glow?: GlowPreset | "none";
  glowOpacity?: number;
  grain?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ glow = "hero", glowOpacity = 1, grain = 0, style, children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: C.bg,
      overflow: "hidden",
      ...style,
    }}
  >
    {glow !== "none" ? <Glow preset={glow} opacity={glowOpacity} /> : null}
    {grain > 0 ? <Grain opacity={grain} /> : null}
    {children}
  </div>
);

/** The presence-ripple plate (ring-ripple.jpg) or the ring field, slowly breathing. */
export const RippleBg: React.FC<{
  variant?: "ripple" | "field";
  /** Breathing amount (scale delta). Default 0.035. */
  breathe?: number;
  /** Seconds per breath. */
  period?: number;
  grain?: number;
  vignette?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({
  variant = "ripple",
  breathe = 0.035,
  period = 6,
  grain = 0.06,
  vignette = true,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ph = Math.sin((frame / fps / period) * Math.PI * 2);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: C.night,
        overflow: "hidden",
        ...style,
      }}
    >
      <Img
        src={staticFile(
          variant === "ripple"
            ? "brand/ring-ripple.jpg"
            : "brand/ring-field.jpg",
        )}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          scale: String(1.04 + breathe * (0.5 + 0.5 * ph)),
          opacity: 0.85 + 0.15 * (0.5 + 0.5 * ph),
        }}
      />
      {vignette ? <Vignette strength={0.45} /> : null}
      {grain > 0 ? <Grain opacity={grain} /> : null}
      {children}
    </div>
  );
};
