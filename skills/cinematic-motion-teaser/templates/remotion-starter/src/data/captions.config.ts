import { C } from "../kit/theme";

/**
 * Caption pages = phrase groups by WORDS index (src/data/timeline.ts). Max ~5 words / 2 lines.
 * Scenes that SAY their line as kinetic type (hook, reveal, end card) get no caption page —
 * double text reads cheap. Split pages on punctuation / breath, never mid-phrase.
 */
export const PAGES: Array<[number, number]> = [
  [12, 15], // Plan it in seconds,
  [16, 18], // and it's done.
];

/** Key words take the brand's semantic colours (e.g. accent = live/now, green = presence/done). */
export const KEY: Record<number, string> = {
  15: C.rose, // seconds
  18: C.green, // done
};

/** Fix ASR spelling (Whisper writes "cafe," for "café,"). */
export const DISPLAY: Record<number, string> = {};
