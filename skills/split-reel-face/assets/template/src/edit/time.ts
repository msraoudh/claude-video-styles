import captionsData from "../data/captions.json";
import { PROJECT } from "../data/project";

export const FPS = PROJECT.fps;
export const DURATION = PROJECT.durationFrames;
/** seconds of the source cut → frame (nothing is removed from the user's cut). */
export const f = (s: number) => Math.round(s * FPS);

export type Word = { text: string; startMs: number; endMs: number; part: string };
export const WORDS = captionsData as unknown as Word[];

const norm = (s: string) => s.trim().toLowerCase().replace(/[،,.:؟?!]/g, "");

/**
 * Frame of the spoken word `w` (Arabic or Latin, prefix match) nearest to `approxSec`.
 * Use it instead of raw numbers so every visual lands ON its word. Falls back to approxSec.
 */
export const wf = (w: string, approxSec: number): number => {
  const want = norm(w);
  let best: Word | undefined;
  for (const x of WORDS) {
    const t = norm(x.text);
    if (t === want || t.startsWith(want) || t.endsWith(want) || t.includes(` ${want}`)) {
      if (!best || Math.abs(x.startMs / 1000 - approxSec) < Math.abs(best.startMs / 1000 - approxSec)) best = x;
    }
  }
  if (best && Math.abs(best.startMs / 1000 - approxSec) < 2.5) return Math.round((best.startMs / 1000) * FPS);
  return f(approxSec);
};

/** Scene ranges (seconds) — each scene component owns its range; see EDIT-PLAN.md. */
export const SCENES = PROJECT.scenes;
export type SceneId = string;

/** Which step the progress bar shows (1..stepCount, 0 = hidden, stepCount + 1 = bonus). */
export const STEP_AT: [number, number][] = PROJECT.stepAt;
export const stepAt = (frame: number) => {
  let s = 0;
  for (const [t, n] of STEP_AT) if (frame >= f(t)) s = n;
  return s;
};
