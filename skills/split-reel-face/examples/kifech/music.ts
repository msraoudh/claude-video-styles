import { interpolate } from "remotion";

/**
 * Music bed — « Young Trizzy 02 » by Arulo (Mixkit 431, Mixkit Stock Music Free License), the user's pick (#4).
 * The user: "start it at 3 sec" → the bed starts at 3.01 s with the track's FIRST 808 hit (src 13.65) landing on
 * « والصوت » (3.04 — "and this sound": the music arrives as the user says « the sound »).
 * Built in music/ (bed-trizzy-v2.wav, 112 s): 13.62→41.08 | 54.80→89.08 | 13.65→41.08 | 54.80→78.0 (bar splices, the
 * 8-bar break src 41.08–54.80 skipped), fade out at the end.
 * Bed = −11.7 LUFS → ≈ 0.085 puts it ~18 dB under the voice (−16 LUFS), fixed low level like the references.
 */
export type Music = { title: string; file: string; from: number; trimBefore: number; volume: (frame: number) => number };
export const MUSIC: Music | null = {
  title: "Young Trizzy 02 — Arulo (Mixkit 431)",
  file: "audio/music-bed-v2.wav",
  from: 90, // 3.00 s; the hit sits 30 ms into the file → 3.03 s
  trimBefore: 0,
  volume: (fr) => interpolate(fr, [90, 3400, 3451], [0.085, 0.085, 0.07], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
};
