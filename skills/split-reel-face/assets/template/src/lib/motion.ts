import { Easing, interpolate, random, spring } from "remotion";
import remap from "../data/remap.json";

/** House easings. */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

/** House springs (30 fps). */
export const SPRING_POP = { damping: 12, stiffness: 180, mass: 0.7 };
export const SPRING_SOFT = { damping: 18, stiffness: 120, mass: 0.9 };

/**
 * Seconds on the ORIGINAL cut timeline (the times written everywhere in this project, from the
 * first transcription) -> frame on the CURRENT cut. Frames removed later (script glances,
 * see analysis/glance_fix.js) are skipped, so every cue stays on its word.
 */
export const sec = (s: number) => {
  const f = Math.round(s * 30);
  let removedBefore = 0;
  for (const [a, z] of remap.removed as [number, number][]) {
    if (f > z) removedBefore += z - a + 1;
    else if (f >= a) removedBefore += f - a; // inside a removed range: snap to where it was cut
  }
  return f - removedBefore;
};

/** 0 -> 1 spring starting at `delay` frames. */
export const springIn = (frame: number, fps: number, delay = 0, config = SPRING_SOFT) =>
  spring({ frame: frame - delay, fps, config });

/** Clamped interpolate. */
export const lerp = (frame: number, input: [number, number], output: [number, number], easing = EASE_OUT) =>
  interpolate(frame, input, output, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

/** Slow organic float so nothing is ever frozen. Deterministic per seed. */
export const drift = (frame: number, seed: string, amp = 6, periodSec = 4) => {
  const phase = random(seed) * Math.PI * 2;
  const t = (frame / 30 / periodSec) * Math.PI * 2;
  return { x: Math.sin(t + phase) * amp, y: Math.cos(t * 0.8 + phase * 1.3) * amp, r: Math.sin(t * 0.6 + phase) * (amp / 8) };
};

/** Decaying camera shake that starts at `at` (frames) and lasts `len` frames. */
export const shake = (frame: number, at: number, len: number, amp: number, seed: string) => {
  const t = frame - at;
  if (t < 0 || t > len) return { x: 0, y: 0, r: 0 };
  const k = Math.pow(1 - t / len, 2) * amp;
  return {
    x: (random(`${seed}x${t}`) - 0.5) * 2 * k,
    y: (random(`${seed}y${t}`) - 0.5) * 2 * k,
    r: (random(`${seed}r${t}`) - 0.5) * 0.12 * k,
  };
};

/** Blur-in entrance style from progress p (0 -> 1). */
export const blurIn = (p: number, rise = 40): React.CSSProperties => ({
  opacity: interpolate(p, [0, 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  filter: `blur(${interpolate(p, [0, 1], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
  translate: `0px ${interpolate(p, [0, 1], [rise, 0])}px`,
  scale: String(interpolate(p, [0, 1], [0.9, 1])),
});

/** Blur-out exit style from progress q (0 -> 1). */
export const blurOut = (q: number): React.CSSProperties => ({
  opacity: 1 - q,
  filter: `blur(${q * 18}px)`,
});
