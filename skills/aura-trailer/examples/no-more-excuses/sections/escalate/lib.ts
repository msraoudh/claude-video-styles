import { Easing, interpolate } from "remotion";
import { section } from "../../data/sections";

/** ESCALATE helpers — every time here is a GLOBAL trailer frame. */
export const S0 = section("escalate").from; // 1804
export const S1 = section("escalate").to; // 2856

export const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const EO = Easing.bezier(0.16, 1, 0.3, 1);
export const EIO = Easing.bezier(0.65, 0, 0.35, 1);
export const EI = Easing.bezier(0.7, 0, 0.84, 0);
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
export const smoother = (u: number) => {
  const x = clamp01(u);
  return x * x * x * (10 + x * (-15 + 6 * x));
};
/** clamped interpolate on global frames */
export const lin = (g: number, a: number, b: number, from: number, to: number, ease = EO) =>
  interpolate(g, [a, b], [from, to], { ...CL, easing: ease });
/** 1 on frame e, exponential decay afterwards (0 before e) */
export const decay = (g: number, e: number, frames: number) => (g < e ? 0 : Math.exp(-(g - e) / Math.max(0.5, frames)));
/** decay from the most recent of several events */
export const decayAny = (g: number, events: number[], frames: number) => {
  let best = 0;
  for (const e of events) best = Math.max(best, decay(g, e, frames));
  return best;
};
export const rgba = (c: [number, number, number], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

/** The 808 grid of this section (from data/beats.ts HITS, loud ones) and its ghost 808s / beats used for half-beat cuts. */
export const H808 = [1804, 1836, 1869, 1901, 1934, 1966, 2000, 2032, 2064, 2097, 2130, 2162, 2195, 2226, 2260, 2292, 2325, 2358, 2390, 2423, 2455, 2488, 2520, 2553, 2586, 2618, 2651, 2683, 2717];
export const BIG = 2260;
