import React from "react";
import { AbsoluteFill } from "remotion";
import { Matte, Shot } from "../../components/Shot";
import type { Grade } from "../../lib/look";

/**
 * the user cut out of his own room: the master plate is pushed down into darkness (bg filter), the alpha matte of
 * him sits on top with its own grade and a light mask (key light on the face, body falls off), plus an
 * optional cold back-light between the two so the silhouette separates. Camera move = one wrapper transform
 * (scale around the face), so plate, light and matte stay locked.
 */
export const IsolatedFace: React.FC<{
  speed: (lf: number) => number;
  scale?: number;
  tx?: number;
  ty?: number;
  rot?: number;
  origin?: string;
  bg?: string;
  fg?: string;
  grade?: Grade;
  /** CSS mask for the matte (key light). */
  mask?: string;
  /** cold rim / back-light strength 0..1 */
  rim?: number;
  rimColor?: string;
  focus?: string;
  style?: React.CSSProperties;
}> = ({ speed, scale = 1, tx = 0, ty = 0, rot = 0, origin = "50% 22%", bg = "brightness(0.3)", fg = "", grade = "night", mask, rim = 0, rimColor = "120,170,255", focus = "50% 40%", style }) => (
  <AbsoluteFill style={{ overflow: "hidden", ...style }}>
    <AbsoluteFill style={{ transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${scale})`, transformOrigin: origin }}>
      <Shot clip="master-v4" speed={speed} grade={grade} filter={bg} focus={focus} />
      {rim > 0.01 ? (
        <AbsoluteFill
          style={{
            mixBlendMode: "screen",
            background: `radial-gradient(ellipse 34% 20% at 50% 20%, rgba(${rimColor},${(0.34 * rim).toFixed(3)}) 0%, rgba(${rimColor},${(0.12 * rim).toFixed(3)}) 55%, rgba(${rimColor},0) 100%)`,
          }}
        />
      ) : null}
      <AbsoluteFill style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}>
        <Matte speed={speed} grade={grade} filter={fg} focus={focus} />
      </AbsoluteFill>
    </AbsoluteFill>
  </AbsoluteFill>
);

/** key light on the face, body falls into the dark (mask for IsolatedFace) */
export const FACE_KEY = (strength = 1, at = "50% 24%") =>
  `radial-gradient(ellipse 58% 34% at ${at}, rgba(0,0,0,1) 38%, rgba(0,0,0,${(1 - 0.75 * strength).toFixed(2)}) 78%, rgba(0,0,0,${(1 - 0.9 * strength).toFixed(2)}) 100%)`;
