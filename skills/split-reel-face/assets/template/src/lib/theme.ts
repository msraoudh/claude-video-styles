import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

/** Big condensed display (text behind the subject, drop title). */
export const DISPLAY = loadAnton("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] }).fontFamily;
/** UI cards and captions. */
export const UI = loadInter("normal", { weights: ["500", "700", "800", "900"], subsets: ["latin", "latin-ext"] }).fontFamily;
/** Elegant italic accents (the name, a few hero words). */
export const SERIF = loadSerif("italic", { weights: ["400"], subsets: ["latin", "latin-ext"] }).fontFamily;
/** Mono details (percentages, timecodes). */
export const MONO = loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily;

/**
 * Palette built around the footage: blue wall + orange chair + red shorts.
 * Warm orange is the accent (it also matches Claude's coral), cold glass for UI.
 */
export const C = {
  accent: "#FF7A3D",
  accentSoft: "#FFB38A",
  claude: "#D97757",
  ink: "#0B0B10",
  white: "#FFFFFF",
  glass: "rgba(14, 14, 20, 0.62)",
  glassLight: "rgba(255, 255, 255, 0.14)",
  stroke: "rgba(255, 255, 255, 0.22)",
  green: "#34D399",
  red: "#FF4D4D",
  frBlue: "#1E5BFF",
  frRed: "#FF3B47",
};

/** Shared glass card look. */
export const glassCard: React.CSSProperties = {
  background: C.glass,
  border: `2px solid ${C.stroke}`,
  borderRadius: 36,
  boxShadow: "0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
  backdropFilter: "blur(22px) saturate(1.4)",
  WebkitBackdropFilter: "blur(22px) saturate(1.4)",
  color: C.white,
  fontFamily: UI,
};
