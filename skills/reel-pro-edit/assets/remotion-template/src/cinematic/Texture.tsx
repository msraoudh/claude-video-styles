import type React from "react";
import { useMemo } from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { CUE, f } from "./cues";
import { lookAt } from "./looks";

/**
 * Film texture: diffusion/halation (Pro-Mist), grain, and letterbox bars.
 * Same rule as the grade: wrappers never create a stacking context.
 */
const fill: React.CSSProperties = { position: "absolute", inset: 0, pointerEvents: "none" };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ------------------------------------------------------------------ */
/* Diffusion / halation                                                */
/* ------------------------------------------------------------------ */

/**
 * Black Pro-Mist style diffusion: a blurred, contrasty, warm copy of the backdrop is mixed in at low opacity.
 * Highlights bloom with a warm halo, blacks stay deep. One backdrop-filter = one full-frame blur pass.
 */
export const Mist: React.FC<{ amount: number }> = ({ amount }) => {
  if (amount < 0.01) return null;
  const filter = "blur(20px) brightness(1.02) contrast(1.4) saturate(1.2) sepia(0.2)";
  return (
    <div
      style={{
        ...fill,
        backdropFilter: filter,
        WebkitBackdropFilter: filter,
        opacity: Math.min(0.6, amount),
      }}
    />
  );
};

/* ------------------------------------------------------------------ */
/* Grain                                                               */
/* ------------------------------------------------------------------ */

const TILE = 512;

/** Deterministic PRNG (mulberry32) — the noise tile is identical on every render / every tab. */
const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

let grainUrl: string | null = null;

/**
 * A 512x512 grey film-grain tile, generated ONCE per tab into a PNG data URL (no asset file,
 * no per-frame noise generation). Gaussian-ish distribution (sum of 3 uniforms), centred on 50% grey
 * so 'overlay' leaves the average brightness untouched.
 */
const getGrainUrl = (): string => {
  if (grainUrl) return grainUrl;
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = TILE;
  canvas.height = TILE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(TILE, TILE);
  const rnd = mulberry32(1337);
  for (let i = 0; i < TILE * TILE; i++) {
    const g = (rnd() + rnd() + rnd()) / 3; // 0..1, peaked at 0.5
    const v = Math.max(0, Math.min(255, Math.round(128 + (g - 0.5) * 2.2 * 255)));
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  grainUrl = canvas.toDataURL("image/png");
  return grainUrl;
};

/**
 * Deterministic film grain: one noise tile, shown at a pseudo-random offset and flip on every frame
 * (random(seed) — never Math.random), blended with 'overlay'. A hidden <Img> holds the render until
 * the tile is decoded, so no frame ever misses its grain.
 */
export const Grain: React.FC<{ amount: number; size?: number }> = ({ amount, size = 1.6 }) => {
  const frame = useCurrentFrame();
  const url = useMemo(() => getGrainUrl(), []);
  if (!url || amount < 0.003) return null;
  const px = Math.round(TILE * size);
  const ox = Math.floor(random(`grain-x-${frame}`) * px);
  const oy = Math.floor(random(`grain-y-${frame}`) * px);
  const fx = random(`grain-fx-${frame}`) > 0.5 ? -1 : 1;
  const fy = random(`grain-fy-${frame}`) > 0.5 ? -1 : 1;
  return (
    <>
      {/* holds the render (delayRender) until the tile is decoded, so the tiled background below is never missing */}
      <Img src={url} style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
      <div
        style={{
          ...fill,
          // tiling needs a background; loading is guaranteed by the <Img> above (same data URL)
          // eslint-disable-next-line @remotion/no-background-image
          backgroundImage: `url(${url})`,
          backgroundSize: `${px}px ${px}px`,
          backgroundPosition: `${ox}px ${oy}px`,
          scale: `${fx} ${fy}`,
          mixBlendMode: "overlay",
          opacity: Math.min(1, amount),
        }}
      />
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Letterbox                                                           */
/* ------------------------------------------------------------------ */

/** Thin cinematic bars that slide in for the "mais wesh" beat and get blown out by the drop. */
export const Letterbox: React.FC<{ inAt?: number; outAt?: number; size?: number }> = ({ inAt = CUE.wesh, outAt = CUE.drop, size = 0.068 }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const inF = f(inAt);
  const outF = f(outAt);
  const pin = interpolate(frame, [inF, inF + Math.round(0.7 * fps)], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const pout = interpolate(frame, [outF, outF + 4], [0, 1], { ...clamp, easing: Easing.bezier(0.7, 0, 0.84, 0) });
  const h = Math.round(height * size * pin * (1 - pout));
  if (h <= 0) return null;
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: h, backgroundColor: "#000", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: h, backgroundColor: "#000", pointerEvents: "none" }} />
    </>
  );
};

/* ------------------------------------------------------------------ */

export const CinematicTexture: React.FC<{
  amount?: number;
  mist?: boolean;
  grain?: boolean;
  letterbox?: boolean;
}> = ({ amount = 1, mist = true, grain = true, letterbox = true }) => {
  const frame = useCurrentFrame();
  const look = lookAt(frame);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {mist ? <Mist amount={look.mist * amount} /> : null}
      {/* grain halved for Instagram compression (heavy grain turns to mush) */}
      {grain ? <Grain amount={look.grain * amount * 0.5} /> : null}
      {letterbox ? <Letterbox /> : null}
    </AbsoluteFill>
  );
};
