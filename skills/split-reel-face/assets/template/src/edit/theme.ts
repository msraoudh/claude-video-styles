import { PROJECT } from "../data/project";
import { loadFont as loadAlexandria } from "@remotion/google-fonts/Alexandria";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

/** Arabic + Latin (captions, titles, Arabic UI text). */
export const AR = loadAlexandria("normal", { weights: ["500", "700", "800", "900"], subsets: ["arabic", "latin", "latin-ext"] }).fontFamily;
/** UI (Latin). */
export const UI = loadInter("normal", { weights: ["500", "600", "700", "800", "900"], subsets: ["latin", "latin-ext"] }).fontFamily;
/** Editorial accent (Latin keywords in italic coral, Claude-style). */
export const SERIF = loadSerif("italic", { weights: ["400"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const SERIF_UP = loadSerif("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] }).fontFamily;
/** Terminal, timecodes, numbers. */
export const MONO = loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily;

/**
 * « Claude coral + warm dark » — the user's pick (2026-10-21). The set is a warm brown room and a grey sweater:
 * warm darks keep the split seamless, Claude's coral is the one accent (like the Claude editorial reference).
 */
export const K = {
  bg0: "#0F0B09",
  bg1: "#1B1310",
  bg2: "#261A15",
  cream: "#F5EEE4",
  muted: "#B9A898",
  dim: "rgba(245,238,228,0.42)",
  coral: "#D97757",
  coralLight: "#F0A487",
  coralDeep: "#B4553A",
  coralGlow: "rgba(217,119,87,0.45)",
  ok: "#7FD1A1",
  warn: "#F2B35E",
  glass: "rgba(36,26,21,0.62)",
  glassHi: "rgba(255,236,220,0.07)",
  stroke: "rgba(255,236,220,0.16)",
  strokeHi: "rgba(255,236,220,0.32)",
};

/**
 * Studio playback helper: the « Reel-fluide » composition sets fast = true (no backdrop blur on the glass, no
 * full-frame Pro-Mist pass) so the preview plays in real time. The render uses « Reel » (fast = false).
 */
export const PERF = { fast: false };

/** Glass card recipe (warm). */
export const glass = (accent = false): React.CSSProperties => ({
  background: `linear-gradient(150deg, rgba(255,236,220,0.085), rgba(255,236,220,0.02) 60%), ${K.glass}`,
  border: `1.5px solid ${accent ? "rgba(217,119,87,0.55)" : K.stroke}`,
  borderRadius: 30,
  boxShadow: [
    "0 24px 60px rgba(0,0,0,0.55)",
    "inset 0 1px 0 rgba(255,236,220,0.22)",
    accent ? `0 0 60px ${K.coralGlow}` : "0 0 0 rgba(0,0,0,0)",
  ].join(", "),
  backdropFilter: PERF.fast ? undefined : "blur(20px) saturate(1.3)",
  WebkitBackdropFilter: PERF.fast ? undefined : "blur(20px) saturate(1.3)",
  color: K.cream,
});

/** Layout constants (1080×1920). seam / captions come from src/data/project.ts. */
export const L = {
  W: 1080,
  H: 1920,
  // the face sits at source y ≈ 20 (hair) – 670 (eyes) – 980 (mouth) – 1100 (chin); the mic is at y 1300–1550
  seam: PROJECT.seam, // split: face panel 0–seam, stage below
  stageTop: PROJECT.seam,
  progressY: PROJECT.seam + 26,
  titleY: PROJECT.seam + 72,
  contentTop: PROJECT.seam + 160, // scene content in split: y 1040–1450
  contentBottom: 1450, // captions sit at y ≈ 1460–1560, then the Instagram caption/UI
  captionSplit: PROJECT.captionY.split,
  captionFace: PROJECT.captionY.face,
  captionGfx: PROJECT.captionY.gfx,
  side: 60,
  rightSafe: 940, // below y 1000 the IG icon column sits at x > 950
};
