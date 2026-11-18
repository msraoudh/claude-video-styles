import React, { createContext, useContext } from "react";
import { BEATS, BIG_HITS, DOWNBEATS, HITS, SUB_ENV, DURATION } from "../data/beats";

/**
 * Music-sync helpers. EVERYTHING that moves with the music goes through these, in GLOBAL trailer frames.
 * Inside a <Sequence>, useCurrentFrame() is local — use useGlobalFrame() for anything beat-synced.
 */
const GlobalFrameCtx = createContext<number>(0);
export const GlobalFrameProvider: React.FC<{ frame: number; children: React.ReactNode }> = ({ frame, children }) =>
  React.createElement(GlobalFrameCtx.Provider, { value: frame }, children);
export const useGlobalFrame = () => useContext(GlobalFrameCtx);

const lastLE = (arr: number[], f: number): number | undefined => {
  let lo = 0, hi = arr.length - 1, ans: number | undefined;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= f) { ans = arr[mid]; lo = mid + 1; } else hi = mid - 1;
  }
  return ans;
};
const firstGT = (arr: number[], f: number): number | undefined => arr.find((x) => x > f);

export const prevBeat = (f: number) => lastLE(BEATS, f);
export const nextBeat = (f: number) => firstGT(BEATS, f);
export const prevDownbeat = (f: number) => lastLE(DOWNBEATS, f);
export const beatsBetween = (a: number, b: number) => BEATS.filter((x) => x >= a && x < b);
export const downbeatsBetween = (a: number, b: number) => DOWNBEATS.filter((x) => x >= a && x < b);
/** 808 onsets (sub-bass rises) with at least `minRise` dB, between a and b */
export const hitsBetween = (a: number, b: number, minRise = 3) => HITS.filter((h) => h.f >= a && h.f < b && h.rise >= minRise).map((h) => h.f);
export const snapToBeat = (f: number) => {
  const p = prevBeat(f) ?? f, n = nextBeat(f) ?? f;
  return f - p <= n - f ? p : n;
};

/** 1 on the hit frame, exponential decay over ~`decay` frames. 0 before the first event. */
const pulseFrom = (events: number[], f: number, decay: number) => {
  const p = lastLE(events, f);
  if (p === undefined) return 0;
  return Math.exp(-(f - p) / Math.max(1, decay / 3));
};
export const beatPulse = (f: number, decay = 12) => pulseFrom(BEATS, f, decay);
export const downbeatPulse = (f: number, decay = 18) => pulseFrom(DOWNBEATS, f, decay);
const HIT_FRAMES = (minRise: number) => HITS.filter((h) => h.rise >= minRise).map((h) => h.f);
const HIT3 = HIT_FRAMES(3);
const HIT5 = HIT_FRAMES(5);
/** pulse on every 808 onset (rise >= 3 dB) */
export const hitPulse = (f: number, decay = 14) => pulseFrom(HIT3, f, decay);
/** pulse on the stronger 808 onsets (rise >= 5 dB) */
export const strongHitPulse = (f: number, decay = 18) => pulseFrom(HIT5, f, decay);
/** pulse on the few heavy accents (title slam etc.) */
export const bigHitPulse = (f: number, decay = 30) => pulseFrom(BIG_HITS, f, decay);
/** sub-bass loudness 0..1 at frame f (smooth, follows the 808 tail) */
export const sub = (f: number) => SUB_ENV[Math.max(0, Math.min(DURATION - 1, Math.round(f)))] ?? 0;

/** Deterministic pseudo-random in [0,1) from an integer seed (no Math.random in renders). */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
/** Camera shake (px) driven by the sub-bass: amount = px at full bass. Deterministic per frame. */
export const bassShake = (f: number, amount = 10) => {
  const s = sub(f) ** 2 * amount + hitPulse(f, 8) * amount * 0.8;
  return { x: (rand(f * 3.1) - 0.5) * 2 * s, y: (rand(f * 7.7 + 1) - 0.5) * 2 * s, r: (rand(f * 1.3 + 5) - 0.5) * s * 0.06 };
};
