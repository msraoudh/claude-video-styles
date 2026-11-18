import type React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FACE, rgba, type RGB } from "./cues";
import { lookAt, type Look } from "./looks";

/**
 * Cinematic grade: full-frame blend-mode layers that sit ABOVE the footage and BELOW the UI.
 *
 * IMPORTANT for blending: none of the wrappers here may create a stacking context
 * (no opacity / transform / filter / isolation / z-index on wrappers), otherwise the
 * blend modes would only blend with this layer instead of with the footage underneath.
 */
const fill: React.CSSProperties = { position: "absolute", inset: 0, pointerEvents: "none" };

const rgb = (c: RGB) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;

/**
 * Mask for the background: the upper part of the frame, minus a generous ellipse around head + face
 * (the wall sits around his head; arms and torso below are excluded so skin never turns teal).
 */
const WALL_MASK = [
  `radial-gradient(ellipse 34% 25% at ${FACE.x * 100}% ${FACE.y * 100 - 3}%, transparent 62%, #000 100%)`,
  "linear-gradient(180deg, #000 0%, #000 26%, transparent 46%)",
].join(", ");

const WallGrade: React.FC<{ look: Look; amount: number }> = ({ look, amount }) => {
  const mask: React.CSSProperties = {
    maskImage: WALL_MASK,
    WebkitMaskImage: WALL_MASK,
    maskComposite: "intersect",
    WebkitMaskComposite: "source-in",
  };
  return (
    <>
      {look.wallHueA > 0.001 ? (
        <div style={{ ...fill, ...mask, backgroundColor: rgb(look.wallHue), mixBlendMode: "hue", opacity: look.wallHueA * amount }} />
      ) : null}
      {look.wallDim > 0.001 ? <div style={{ ...fill, ...mask, backgroundColor: "#000", opacity: look.wallDim * amount }} /> : null}
    </>
  );
};

/** Primary + secondary correction: desaturation, colour cast, black point, shadow tint. */
export const GradeColor: React.FC<{ look: Look; amount?: number }> = ({ look, amount = 1 }) => {
  const cx = `${FACE.x * 100}%`;
  const cy = `${FACE.y * 100 + 4}%`;
  return (
    <>
      {/* 1. desaturate (keeps luminance) */}
      {look.desat > 0.001 ? (
        <div style={{ ...fill, backgroundColor: "rgb(128,128,128)", mixBlendMode: "saturation", opacity: look.desat * amount }} />
      ) : null}
      {/* 2. colour cast — lighter on the face so skin stays natural, full strength toward the edges */}
      <div
        style={{
          ...fill,
          mixBlendMode: "soft-light",
          background: `radial-gradient(ellipse 60% 40% at ${cx} ${cy}, ${rgba(look.cast, look.castA * 0.5 * amount)} 0%, ${rgba(look.cast, look.castA * amount)} 75%)`,
        }}
      />
      {/* 3. black point (levels) — colour-burn with a light grey; a tinted grey crushes into teal */}
      {look.crush > 0.001 ? (
        <div style={{ ...fill, backgroundColor: rgb(look.crushTint), mixBlendMode: "color-burn", opacity: look.crush * amount }} />
      ) : null}
      {/* 3b. the wall only (face + body masked out): pull the bright webcam-blue toward a deeper teal */}
      {look.wallHueA > 0.001 || look.wallDim > 0.001 ? <WallGrade look={look} amount={amount} /> : null}
      {/* 4. shadow tint — 'lighten' with a dark colour: only the deepest blacks take its hue (teal blacks),
             mids and highlights are untouched, so nothing gets washed out */}
      {look.liftA > 0.001 ? (
        <div style={{ ...fill, backgroundColor: rgb(look.lift), mixBlendMode: "lighten", opacity: look.liftA * amount }} />
      ) : null}
    </>
  );
};

/** Exposure shaping: vignette, darkness creeping from the corners, global dim, face spotlight. */
export const GradeDarkness: React.FC<{ look: Look; amount?: number }> = ({ look, amount = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  // the corners breathe slowly so the darkness feels alive, never static
  const breathe = (period: number, phase: number) => 1 + 0.09 * Math.sin((t / period) * Math.PI * 2 + phase);
  const creep = look.creep * amount;
  const corner = (x: string, y: string, period: number, phase: number) => {
    const r = 260 + 820 * creep * breathe(period, phase);
    const a = Math.min(0.92, 0.25 + 0.7 * creep);
    return `radial-gradient(circle ${Math.round(r)}px at ${x} ${y}, rgba(0,0,0,${a.toFixed(3)}) 0%, rgba(0,0,0,${(a * 0.55).toFixed(3)}) 45%, rgba(0,0,0,0) 100%)`;
  };
  const spot = look.spot * amount;
  const sx = FACE.x * 100;
  const sy = FACE.y * 100 + 3;
  return (
    <>
      {/* lens vignette (centred a bit above the middle, where the face lives) */}
      <div
        style={{
          ...fill,
          background: `radial-gradient(ellipse 76% 62% at 50% 40%, rgba(0,0,0,0) ${look.vigIn.toFixed(1)}%, ${`rgba(0,0,0,${(look.vig * 0.55 * amount).toFixed(3)})`} ${((look.vigIn + 100) / 2).toFixed(1)}%, rgba(0,0,0,${(look.vig * amount).toFixed(3)}) 100%)`,
        }}
      />
      {/* darkness creeping in from the corners */}
      {creep > 0.01 ? (
        <div
          style={{
            ...fill,
            background: [
              corner("0%", "0%", 7.3, 0),
              corner("100%", "0%", 8.1, 1.7),
              corner("0%", "100%", 6.7, 3.1),
              corner("100%", "100%", 7.9, 4.4),
            ].join(", "),
          }}
        />
      ) : null}
      {/* overall exposure pull-down */}
      {look.dim > 0.001 ? <div style={{ ...fill, backgroundColor: "#000", opacity: look.dim * amount }} /> : null}
      {/* single hard key light on the face, everything else falls to black */}
      {spot > 0.001 ? (
        <>
          <div
            style={{
              ...fill,
              background: `radial-gradient(ellipse 34% 21% at ${sx}% ${sy}%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 52%, rgba(0,0,0,${(0.55 * spot).toFixed(3)}) 78%, rgba(0,0,0,${(0.96 * spot).toFixed(3)}) 100%)`,
            }}
          />
          {/* the key itself: a cool-neutral, slightly hard light from camera-left */}
          <div
            style={{
              ...fill,
              mixBlendMode: "soft-light",
              background: `radial-gradient(ellipse 26% 16% at ${sx - 3}% ${sy - 1.5}%, rgba(235,240,255,${(0.55 * spot).toFixed(3)}) 0%, rgba(235,240,255,0) 100%)`,
            }}
          />
        </>
      ) : null}
    </>
  );
};

/**
 * <CinematicGrade /> — the per-section look, crossfaded along the story.
 * `amount` scales the whole grade (0 = off, 1 = designed strength).
 */
export const CinematicGrade: React.FC<{ amount?: number }> = ({ amount = 1 }) => {
  const frame = useCurrentFrame();
  const look = lookAt(frame);
  const k = interpolate(amount, [0, 1], [0, 1], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <GradeColor look={look} amount={k} />
      <GradeDarkness look={look} amount={k} />
    </AbsoluteFill>
  );
};
