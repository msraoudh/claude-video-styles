import React, { createContext, useContext } from "react";
import { BEATS, DOWNBEATS, HITS, SUB_ENV } from "../data/beats";
import { phrase, PHRASES, DURATION } from "../data/voice";

/**
 * Sync helpers. Inside a <Sequence> useCurrentFrame() is LOCAL — use useGlobalFrame() for anything that must
 * land on a spoken word or a music beat. Words come from data/voice.ts (master clock), beats from data/beats.ts.
 */
const Ctx = createContext(0);
export const GlobalFrameProvider: React.FC<{ frame: number; children: React.ReactNode }> = ({ frame, children }) =>
  React.createElement(Ctx.Provider, { value: frame }, children);
export const useGlobalFrame = () => useContext(Ctx);

/** global frame of a word inside a phrase (accents/punctuation ignored, prefix match, nth occurrence) */
export const wf = (phraseId: string, text: string, nth = 0): number => {
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9']/g, "");
  const want = norm(text);
  const hits = phrase(phraseId).words.filter((w) => norm(w.w).startsWith(want));
  if (!hits[nth]) throw new Error(`word "${text}" #${nth} not found in ${phraseId}`);
  return hits[nth].f;
};
export const phraseOnset = (id: string) => phrase(id).from;
export const phraseEnd = (id: string) => phrase(id).to;
export const ALL_PHRASES = PHRASES;

const lastLE = (arr: number[], f: number) => {
  let lo = 0, hi = arr.length - 1, ans: number | undefined;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (arr[m] <= f) { ans = arr[m]; lo = m + 1; } else hi = m - 1;
  }
  return ans;
};
const pulse = (arr: number[], f: number, decay: number) => {
  const p = lastLE(arr, f);
  return p === undefined ? 0 : Math.exp(-(f - p) / Math.max(1, decay / 3));
};
export const beatPulse = (f: number, decay = 12) => pulse(BEATS, f, decay);
export const barPulse = (f: number, decay = 20) => pulse(DOWNBEATS, f, decay);
export const hitPulse = (f: number, decay = 14) => pulse(HITS.filter((h) => h.rise >= 3).map((h) => h.f), f, decay);
export const beatsBetween = (a: number, b: number) => BEATS.filter((x) => x >= a && x < b);
export const snapToBeat = (f: number) => {
  if (!BEATS.length) return f;
  let best = BEATS[0];
  for (const b of BEATS) if (Math.abs(b - f) < Math.abs(best - f)) best = b;
  return best;
};
export const sub = (f: number) => SUB_ENV[Math.max(0, Math.min(DURATION - 1, Math.round(f)))] ?? 0;
/** deterministic random in [0,1) */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
