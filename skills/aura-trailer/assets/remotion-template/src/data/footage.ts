// PLACEHOLDER — overwritten by aura-trailer/scripts/footage.py from footage.json.
export type Clip = {id: string; kind: string; src: string; w: number; h: number; seconds: number; fps: number; sourceFile: string; sourceStart: number; desc: string; matte: string};
export const CLIPS: Clip[] = [];
export const clip = (id: string) => CLIPS.find((c) => c.id === id)!;
/** the main lip-sync master and its alpha cut-out (text behind the subject) */
export const MASTER = {"id": "", "video": "", "matte": ""};
