/**
 * Music bed — set once the user picks a track (references/sound-music.md): royalty-free stock only (Mixkit…),
 * built with scripts/music_bed.py (bar splices), starting where the user wants. null = no music yet.
 * from = global frame where the bed starts, trimBefore = source frames skipped, volume(globalFrame) ≈ 0.085
 * (≈ 18 dB under the −16 LUFS voice for a −11.7 LUFS bed).
 */
import { interpolate } from "remotion";

export type Music = { title: string; file: string; from: number; trimBefore: number; volume: (frame: number) => number };
export const MUSIC: Music | null = null;
// example (« Kifech na3mel el reels hedhom »):
// export const MUSIC: Music | null = { title: "Young Trizzy 02 — Arulo (Mixkit 431)", file: "audio/music-bed-v2.wav", from: 90, trimBefore: 0,
//   volume: (fr) => interpolate(fr, [90, 3400, 3451], [0.085, 0.085, 0.07], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) };
void interpolate;
