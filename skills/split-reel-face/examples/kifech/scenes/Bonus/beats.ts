import { f, wf } from "../../edit/time";

/**
 * Bonus scene beat clock (GLOBAL frames, 30 fps). Every value is the spoken word that triggers it
 * (src/data/captions.json), so each element lands ON its word.
 *   103.26 bien sûr، كان تحب برشا vidéos كيما هكّا يتعملو   → the user's reels: a deck that fans out
 *   106.86 تقلّو: اعمللي skill باللي عملتو الكل              → prompt → SKILL.md types itself → lands in the shelf
 *   109.24 يعمللك skill، كل مرة تعطيه vidéo ولّا idée        → input → skill → finished reel, ×3
 *   112.04 وتقلّو: استعمل الـ skill هاذي                      → prompt « esta3mel el skill hedhi » + the skill glows
 *   113.42 → face outro (Hook scene)
 */
export const B = {
  start: f(103.26), // 3098 face → split morph begins
  sur: wf("sûr", 103.63), // 3109 deck lands
  kan: wf("كان", 104.4), // 3132 deck lifts (anticipation)
  t7eb: wf("تحب", 104.75), // 3143
  barcha: wf("برشا", 105.08), // 3152 FAN OUT
  videos: wf("vidéos", 105.46), // 3164 back layer: even more videos
  kima: wf("كيما", 105.78), // 3173 « like this one » — the centre reel steps forward
  hakka: wf("هكّا", 106.0), // 3180
  yit3amlou: wf("يتعملو", 106.41), // 3192 riffle flip
  tqollou: wf("تقلّو", 106.86), // 3206 collapse to a deck + prompt types
  a3melli: wf("اعمللي", 107.28), // 3218
  skill: wf("skill", 107.63), // 3229 SKILL.md card
  belli: wf("باللي", 107.85), // 3236 the videos are absorbed into the skill
  m3maltou: wf("عملتو", 108.57), // 3257
  lkol: wf("الكل", 108.92), // 3268 card flies into the shelf
  ya3mellek: wf("يعمللك", 109.24), // 3277
  skill2: wf("skill", 109.65), // 3290 NEW badge
  kol: wf("كل", 109.96), // 3299 shelf → machine
  marra: wf("مرة", 110.5), // 3315
  ta3tih: wf("تعطيه", 110.8), // 3324
  video: wf("vidéo", 111.09), // 3333 input « vidéo »
  walla: wf("ولّا", 111.45), // 3344
  idee: wf("idée", 111.73), // 3352 input « idée »
  wtqollou: wf("وتقلّو", 112.04), // 3361 prompt 2
  esta3mel: wf("استعمل", 112.45), // 3374
  lskill: wf("skill", 112.75), // 3383 skill chip attaches + glow
  hedhi: wf("هاذي", 113.03), // 3391 send → the skill fires
  end: f(113.42), // 3403 hand-off to the face outro
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const c01 = (t: number) => Math.min(1, Math.max(0, t));
/** ease-out cubic 0→1 over [at, at+len] */
export const eo = (frame: number, at: number, len: number) => 1 - Math.pow(1 - c01((frame - at) / len), 3);
/** ease-in-out cubic 0→1 over [at, at+len] */
export const eio = (frame: number, at: number, len: number) => {
  const t = c01((frame - at) / len);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * Beat C — the skill as a machine: input appears in the left slot, flies into the skill (hit), the skill processes
 * (hit → done), a finished reel flies out to the right stack (done → land). Three fast loops, each one quicker.
 * The real outputs: aura-trailer made « NO MORE EXCUSES » = ig-1.mp4 (trim seconds in `trim`).
 */
export type LoopKind = "rush" | "video" | "idea";
export const LOOPS: { kind: LoopKind; appear: number; fly: number; hit: number; done: number; land: number; trim: number }[] = [
  { kind: "rush", appear: B.kol + 4, fly: B.kol + 11, hit: B.kol + 18, done: B.kol + 25, land: B.kol + 32, trim: 4 },
  { kind: "video", appear: B.video - 3, fly: B.video + 6, hit: B.video + 12, done: B.video + 17, land: B.video + 24, trim: 13 },
  { kind: "idea", appear: B.idee - 3, fly: B.idee + 6, hit: B.idee + 11, done: B.idee + 15, land: B.idee + 21, trim: 52 },
];

/** Stage geometry (split mode content area y 1040–1450, x 60–940). */
export const G = {
  // fan
  cx: 540,
  cy: 1218,
  // SKILL.md card (beat B)
  skill: { x: 252, y: 1114, w: 688, h: 334 },
  // shelf tile 1 slot (beat B end)
  tile1: { x: 60, y: 1094, w: 430, h: 140 },
  // the skill as the machine core (beat C/D)
  core: { x: 345, y: 1108, w: 390, h: 270 },
  // input slot centre / output stack centre (beat C)
  inX: 152,
  outX: 862,
  laneY: 1243,
};
