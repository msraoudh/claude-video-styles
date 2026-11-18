/** The music bed (user's pick) starts at 3.0 s; first 808 hit ≈ 3.03 s, 140 BPM → beat = 12.857 frames. */
export const BEAT0 = 3.03 * 30;
export const BEAT = (30 * 60) / 140;
export const beatFrame = (n: number) => Math.round(BEAT0 + n * BEAT);
/** 1 on each beat, decaying fast (0 before the first hit). Only used in the 0–9.62 s hook where the grid is known. */
export const pulse = (frame: number) => {
  if (frame < BEAT0 - 0.5) return 0;
  const k = (frame - BEAT0) % BEAT;
  return Math.exp(-k / 3.2);
};
