// PLACEHOLDER — overwritten by aura-trailer/scripts/plan.py from trailer.json (run it before building scenes).
export const FPS = 60;
export const DURATION = 600;
/** every beat of the song, trailer frames */
export const BEATS: number[] = [];
/** bar starts */
export const DOWNBEATS: number[] = [];
/** sub-bass (808) onsets: f = frame, rise = dB jump, level = dB after the hit (0 = loudest) */
export const HITS: {f: number; rise: number; level: number}[] = [];
/** the heavy 808 accents — put the biggest visual punches here */
export const BIG_HITS: number[] = [];
/** sub-bass loudness per frame, 0..1 (drive shake / glow / zoom with it) */
export const SUB_ENV: number[] = [];
export const KEY = {"start": 0, "end": 599} as const;
/** the processed song (public/) and the song frame that plays at trailer frame 0 */
export const MUSIC = {"file": "", "offsetFrames": 0, "credit": ""} as const;
