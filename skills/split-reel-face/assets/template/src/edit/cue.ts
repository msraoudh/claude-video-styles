/**
 * SFX cue type. Every scene exports its cues (global frames) next to its component; Sound.tsx plays them all.
 * Files in public/audio/sfx/: anime-wow bone-crack ding dissolve flash keypad loading-lag match mouse-click page-turn
 * pop record-scratch riser shutter-modern snapchat-notification sting success swipe switch tap tick vine-boom whip
 * whoosh windows-xp-error  (+ any file you add to public/audio/sfx/).
 * Volumes: 0.2–0.6. Sound.tsx ducks every SFX to 62 % while a word is spoken (from the caption timings).
 */
export type Cue = { f: number; sfx: string; vol?: number; note?: string; trimFrames?: number };
