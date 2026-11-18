// PLACEHOLDER — overwritten by aura-trailer/scripts/plan.py from trailer.json.
export type Word = {w: string; f: number; e: number};
export type Line = {id: string; src: string; clip: string; srcIn: number; srcOut: number; at: number; from: number; durationInFrames: number; text: string; words: Word[]};
export const LINES: Line[] = [];
export const line = (id: string) => LINES.find((l) => l.id === id)!;
