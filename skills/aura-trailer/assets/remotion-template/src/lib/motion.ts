import { Easing, interpolate, random, spring } from "remotion";

/** House easings. */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1); // expo-like settle
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

/** House spring presets (tuned for 60 fps). */
export const SPRING_POP = { damping: 14, stiffness: 160, mass: 0.8 };
export const SPRING_SOFT = { damping: 20, stiffness: 110, mass: 1 };
export const SPRING_WORD = { damping: 18, stiffness: 140, mass: 0.9 };

/** 0→1 spring that starts at `delay` frames. */
export const springIn = (
  frame: number,
  fps: number,
  delay = 0,
  config: Partial<typeof SPRING_POP> = SPRING_SOFT,
) => spring({ frame: frame - delay, fps, config });

/** Clamped interpolate shorthand. */
export const lerp = (
  frame: number,
  input: [number, number],
  output: [number, number],
  easing = EASE_OUT,
) =>
  interpolate(frame, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/**
 * Slow organic float so nothing is ever frozen.
 * Returns {x, y, r} offsets in px/deg. Deterministic per `seed`.
 */
export const drift = (
  frame: number,
  fps: number,
  seed: string,
  amp = 6,
  periodSec = 4,
) => {
  const phase = random(seed) * Math.PI * 2;
  const t = (frame / fps / periodSec) * Math.PI * 2;
  return {
    x: Math.sin(t + phase) * amp,
    y: Math.cos(t * 0.8 + phase * 1.3) * amp,
    r: Math.sin(t * 0.6 + phase) * (amp / 8),
  };
};

/**
 * Style for a word/element "blur-in" entrance driven by progress p (0→1).
 * Use with springIn(). `u` = layout unit.
 */
export const blurInStyle = (p: number, u: number, rise = 40) => ({
  opacity: interpolate(p, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
  filter: `blur(${interpolate(p, [0, 1], [14, 0], { extrapolateRight: "clamp" }) * u}px)`,
  translate: `0px ${interpolate(p, [0, 1], [rise, 0]) * u}px`,
  scale: String(interpolate(p, [0, 1], [0.92, 1])),
});

/** Style for a blur-out exit driven by progress q (0→1). */
export const blurOutStyle = (q: number, u: number) => ({
  opacity: 1 - q,
  filter: `blur(${q * 16 * u}px)`,
});
