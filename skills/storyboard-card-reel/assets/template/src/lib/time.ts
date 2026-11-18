import linesData from "../data/lines.json";
import clean from "../data/clean.json";

/** All times are GLOBAL frames of the reel (30 fps) on the clean voice. Never hard-code frames: ask a line or a word. */
export const FPS = 30;
export type Word = { text: string; s: number; e: number; key: boolean };
export type Line = { id: string; s: number; e: number; text: string; key: string; words: Word[] };
export const LINES = linesData as Line[];
export const TAIL = 60; // end card + music out
export const DURATION = clean.totalF + TAIL;

const byId = new Map(LINES.map((l) => [l.id, l]));
export const line = (id: string): Line => {
  const l = byId.get(id);
  if (!l) throw new Error(`unknown line ${id}`);
  return l;
};
export const f = (sec: number) => Math.round(sec * FPS);
/** first frame of a line */
export const at = (id: string) => f(line(id).s);
/** last frame of a line */
export const end = (id: string) => f(line(id).e);
/** first frame of the first word containing `needle` (or index) */
export const w = (id: string, needle: string | number) => {
  const l = line(id);
  if (typeof needle === "number") return f(l.words[Math.max(0, Math.min(l.words.length - 1, needle))].s);
  const x = l.words.find((ww) => ww.text.includes(needle));
  if (!x) throw new Error(`no word « ${needle} » in line ${id}`);
  return f(x.s);
};
/** frames from a to the start of line b (exclusive) */
export const until = (a: number, id: string) => Math.max(1, at(id) - a);
