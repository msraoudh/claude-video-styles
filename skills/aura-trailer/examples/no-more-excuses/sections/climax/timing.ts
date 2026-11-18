import { line } from "../../data/voice";
import { section } from "../../data/sections";
import { KEY } from "../../data/beats";

/**
 * CLIMAX — every frame number of the section in ONE place (GLOBAL trailer frames).
 * Cuts are on beats / 808 onsets from data/beats.ts or on his spoken word frames (data/voice.ts).
 */
const D = line("D");
const E = line("E");
const F = line("F");
const G = line("G");
const word = (l: typeof D, w: string) => {
  const x = l.words.find((v) => v.w.toLowerCase().replace(/[^a-zçéèàù]/g, "").startsWith(w));
  if (!x) throw new Error(`word ${w} not in line ${l.id}`);
  return x.f;
};

export const LINES = { D, E, F, G };

export const T = {
  start: section("silence").from, // 2856
  end: section("end").to, // 3600

  /* ── SILENCE ── */
  dFrom: D.from, // 2863 « Sauf que… »
  plus: word(D, "plus"), // 2906
  tard: word(D, "tard"), // 2914
  ca: word(D, "ça"), // 2932 — cut: portal bursts open (808 ghost onset 2932)
  jamais: word(D, "jamais"), // 2957 — the letter swap
  hein: word(D, "hein"), // 2968
  dEnd: D.from + D.durationInFrames, // 2994
  flyPast: 2984, // JAMAIS. letters rush past the lens
  eCut: 3000, // 808 onset 3000, one frame before « mais » (3001)
  eFrom: E.from, // 3001
  eEnd: 3099, // then 8 frames of pure black
  black: 3099,

  /* ── TITLE ── */
  drop: KEY.bigDrop, // 3107 THE 808
  pulse: 3156, // 808 onset in the title hold (level -4.7 dB)
  flyOut: 3172, // shards blast toward the lens into F
  fCut: 3182, // beat
  fFrom: F.from, // 3181
  fJe: word(F, "je"),
  fMe: word(F, "me"),
  fLance: word(F, "lance"),
  fPunch: 3219, // beat — punch-in
  fFreeze: F.from + F.durationInFrames, // 3231 — freeze frame
  hit2: 3237, // BIG HIT → finale

  /* ── FINALE ── */
  hero: 3451, // beat — hero shot
  tape: KEY.tapeStop, // 3474

  /* ── END ── */
  crtLine: 3488, // collapse to a horizontal line
  crtDot: 3495, // line → dot
  crtPop: 3498, // dot flare (the 808 that the tape stop kills)
  crtOff: 3511,
  reveal: 3513, // downbeat grid — end card
  cardIn: 3521,
  gFrom: G.from, // 3531 « Reste dans le coin. »
  gEnd: G.from + G.durationInFrames, // 3590
  last: 3599,
} as const;

/** tape stop exactly like audio/mix.py: rate = (1 - t/34)^1.6 over 34 frames, then 0 */
export const TAPE_LEN = 34;
export const tapeElapsed = (framesSinceStop: number) => {
  const x = Math.max(0, Math.min(TAPE_LEN, framesSinceStop));
  // ∫0^x (1 - u/L)^1.6 du = L/2.6 * (1 - (1 - x/L)^2.6)
  return (TAPE_LEN / 2.6) * (1 - Math.pow(1 - x / TAPE_LEN, 2.6));
};
export const tapeRate = (framesSinceStop: number) =>
  framesSinceStop <= 0 ? 1 : framesSinceStop >= TAPE_LEN ? 0 : Math.pow(1 - framesSinceStop / TAPE_LEN, 1.6);
