import { interpolate } from "remotion";
import { type Mode, PROJECT } from "../data/project";
import { L } from "./theme";
import { f } from "./time";

/**
 * Layout schedule (src/data/project.ts). `face` = full-frame face, `split` = face panel on top + stage below,
 * `gfx` = full-frame graphic with the face in a small circle (watching), `wall` = the user's shot as a 9:16 card
 * (e.g. the centre of a carousel of their reels). Each change morphs over MORPH frames.
 */
export type { Mode };
export const MODES: [number, Mode][] = PROJECT.modes;
export const MORPH = 14;
/** Screen box of the user's own shot while it is a 9:16 card (wall mode). */
export const WALL_TILE = PROJECT.wallTile;

const EASE = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Where the face video is drawn (screen box x,y,w,h, corner radius r) and which part of the 1080×1920 source fills it
 * (source left sx, top sy, width sw → scale = w / sw). The face sits at source y ≈ 80–780, x ≈ 200–880.
 */
type Box = { x: number; y: number; w: number; h: number; r: number; sx: number; sy: number; sw: number };
const BOX: Record<Mode, Box> = {
  face: { x: 0, y: 0, w: L.W, h: L.H, r: 0, sx: 0, sy: 0, sw: 1080 },
  split: { x: 0, y: 0, w: L.W, h: L.seam, r: 0, sx: 0, sy: PROJECT.face.splitSy, sw: 1080 },
  gfx: { x: 800, y: 200, w: 220, h: 220, r: 110, ...PROJECT.face.pip },
  // centre card of the hook carousel (9:16, whole source frame)
  wall: { x: WALL_TILE.x, y: WALL_TILE.y, w: WALL_TILE.w, h: WALL_TILE.h, r: 28, sx: 0, sy: 0, sw: 1080 },
};

export const modeAt = (frame: number): Mode => {
  let m: Mode = "face";
  for (const [t, mm] of MODES) if (frame >= f(t)) m = mm;
  return m;
};

/** Interpolated face box + stage visibility (0–1) + gfx visibility (0–1) at `frame`. */
export const layoutAt = (frame: number) => {
  let i = 0;
  for (let k = 0; k < MODES.length; k++) if (frame >= f(MODES[k][0])) i = k;
  const cur = MODES[i];
  const prev = i > 0 ? MODES[i - 1][1] : cur[1];
  const t0 = f(cur[0]);
  const p = EASE(Math.min(1, Math.max(0, (frame - t0) / MORPH)));
  const a = BOX[prev];
  const b = BOX[cur[1]];
  const mix = (k: keyof Box) => interpolate(p, [0, 1], [a[k], b[k]]);
  const box: Box = { x: mix("x"), y: mix("y"), w: mix("w"), h: mix("h"), r: mix("r"), sx: mix("sx"), sy: mix("sy"), sw: mix("sw") };
  const vis = (m: Mode) => interpolate(p, [0, 1], [prev === m ? 1 : 0, cur[1] === m ? 1 : 0]);
  return { box, mode: cur[1], prev, p, stage: vis("split"), gfx: vis("gfx"), face: vis("face"), sinceChange: frame - t0 };
};

/** Caption baseline y for the current layout (seam pill in split). */
export const captionY = (frame: number) => {
  const { prev, mode, p } = layoutAt(frame);
  const c = PROJECT.captionY;
  const y = (m: Mode) => (m === "split" ? c.split : m === "gfx" || m === "wall" ? c.gfx : c.face);
  return interpolate(p, [0, 1], [y(prev), y(mode)]);
};
