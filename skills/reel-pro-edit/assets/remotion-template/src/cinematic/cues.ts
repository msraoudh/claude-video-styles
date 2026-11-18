import { sec } from "../lib/motion";

/**
 * Shared cue sheet for the cinematic layer.
 * Every time is in SECONDS on the cut timeline (same numbers as EDIT-PLAN.md / Reel.tsx)
 * and is only ever turned into frames through sec(), so a re-cut that remaps sec() keeps
 * every light cue in sync.
 */
export const CUE = {
  francais: 1.3, // "…en français" — FRAN/ÇAIS behind the head
  struggle: 11.97, // "Mais frère…" — mood drop
  montage: 14.76, // "le montage vidéo" — punch-in
  dream: 15.97, // "des idées de fou" — daydream
  reality: 21.17, // "Mais au moment de passer à la pratique"
  scratch: 22.46, // record scratch / "c'était une autre histoire"
  eclate: 27.78, // "j'étais éclaté" — screen crack
  jamais: 35.84, // "…ça n'arrivera jamais" — darkest point
  claude: 36.92, // "Claude" — 3D spark reveal (light from the right)
  wesh: 42.43, // "Et là, je me suis dit : mais wesh," — suspense
  drop: 43.93, // "pourquoi j'attends encore ?" — DROP
  lance: 45.1, // "je me lance enfin"
  bref: 56.43, // "Bah bref" — whip
  versionFr: 52.5, // "en français" — VERSION FR tag
  abonne: 62.78, // cursor clicks "S'abonner"
  end: 64.3,
} as const;

/** Music: ~93 BPM, the drop lands on a downbeat at CUE.drop. Beat length in frames at `fps`. */
export const BPM = 93;
export const beatFrames = (fps: number) => (fps * 60) / BPM;

/** Seconds (cut timeline) -> frame. Single entry point so the re-cut remap applies everywhere. */
export const f = (s: number) => sec(s);

/**
 * Screen-space anchors (fractions of the 1080x1920 frame).
 * The camera scales around 50% 30%, and the user's face sits close to that pivot, so his face
 * stays near this point at every zoom level.
 */
export const FACE = { x: 0.44, y: 0.25 };
/** Centre of the 3D Claude spark (left 690, top 150, 380x380 in Reel). */
export const SPARK = { x: 0.815, y: 0.177 };
/** Follow button in the CTA card (cursor target). */
export const CTA = { x: 0.77, y: 0.515 };

export type RGB = readonly [number, number, number];
export const rgba = (c: RGB, a: number) =>
  `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
