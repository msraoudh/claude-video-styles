// « Marché IT 2026 » reel — design tokens (see brief/creative-direction.md §7).
//
// Kit key NAMES are kept from the NearMatch starter; the values are this reel's:
//   rose  = DECLINE / the closing door (red)   green = OPPORTUNITY / the open door
//   violet = premium accent (end-card streak, cloud/AI glow)   bg/night = deep ink.
// UI parts are still designed in APP POINTS (390 x 844 pt) when placed inside <Phone>.
import type React from "react";
import { fontInter, fontMono } from "./fonts";

/* ─────────────────────────────── colours ─────────────────────────────── */

export const C = {
  // ── Onyx (the app) ──
  bg: "#05060D",
  surface1: "#0B0D18",
  surface2: "#121528",
  surface3: "#1A1E36",
  surface4: "#232845",
  line: "rgba(255,255,255,0.08)",
  lineStrong: "rgba(255,255,255,0.14)",
  text: "#FFFFFF",
  text2: "rgba(235,235,245,0.66)",
  text3: "rgba(235,235,245,0.52)",
  textDisabled: "rgba(235,235,245,0.30)",
  faint: "rgba(235,235,245,0.28)",
  textInverse: "#000000",
  /** Rose — LIVE only: clock digits, timer arcs, the like heart, unread. */
  rose: "#FF4B5C",
  /** Every rose FILL under white text (live CTA, send, badges, urgent pill). */
  roseFill: "#E5283C",
  rosePressed: "#C41F31",
  /** Rose that reads as words ("7 here", "Live"). */
  roseSoft: "#FF8A95",
  roseTint: "rgba(255,75,92,0.15)",
  roseLine: "rgba(255,75,92,0.42)",
  roseGlow: "rgba(255,75,92,0.50)",
  /** Presence: "Here now", live dots, met, verified. */
  green: "#2EF2A0",
  greenHalo: "rgba(46,242,160,0.20)",
  greenTint: "rgba(46,242,160,0.14)",
  greenLine: "rgba(46,242,160,0.36)",
  /** Logo gradient mid-stop — the mark only. */
  orchid: "#A07CFF",
  /** Logo gradient end — the mark only. */
  violet: "#7C5CFF",
  violetSoft: "#C4A1FF",
  violetTint: "rgba(109,40,217,0.22)",
  warning: "#FFD60A",
  danger: "#FF453A",
  dangerTint: "rgba(255,69,58,0.14)",
  dangerLine: "rgba(255,69,58,0.40)",
  info: "#0A84FF",
  expired: "rgba(235,235,245,0.62)",
  expiredTint: "rgba(255,255,255,0.07)",
  // ── Glass ──
  /** Chrome over content: pills, circles, dock, composer, tab bar. */
  glass: "rgba(22,24,44,0.55)",
  /** Headers and bars over a list. */
  glassStrong: "rgba(10,10,12,0.72)",
  /** Bottom sheets. */
  glassSheet: "rgba(14,14,16,0.74)",
  glassLine: "rgba(255,255,255,0.14)",
  glassHighlight: "rgba(255,255,255,0.22)",
  glassFallback: "#1C1C1F",
  /** Soft fill on black: chips, zone tags, quiet buttons. */
  soft: "rgba(255,255,255,0.09)",
  lens: "rgba(255,255,255,0.11)",
  focus: "rgba(255,255,255,0.56)",
  scrim: "rgba(0,0,0,0.62)",
  // ── Chat ──
  bubbleMine: "#F2F2F7",
  bubbleTheirs: "#1C1C1F",
  // ── Night (brand frames) ──
  night: "#05060D",
  night900: "#0B0D18",
  night800: "#121528",
  night700: "#1A1E36",
  night600: "#232845",
  blush: "#FF6B8A",
  paper: "#F6F5FA",
} as const;

/** The mark's gradient, as a CSS string. THE MARK ONLY — never buttons, text, rings, bubbles. */
export const GRADIENT_MARK =
  "linear-gradient(140deg, #FF3D5F 0%, #B05AE8 55%, #6D28D9 100%)";
export const GRADIENT_STOPS = [
  { offset: 0, color: "#FF3D5F" },
  { offset: 0.55, color: "#B05AE8" },
  { offset: 1, color: "#6D28D9" },
] as const;

/** Photo scrims (Onyx `.scrim-top` / `.scrim-bot`). */
export const SCRIM = {
  top: "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0))",
  bottom:
    "linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.94) 100%)",
} as const;

/* ─────────────────────────────── shape ─────────────────────────────── */

export const R = {
  xs: 6,
  sm: 8,
  md: 14,
  lg: 16,
  field: 16,
  chip: 16,
  xl: 20,
  card: 22,
  cardLg: 26,
  sheet: 34,
  tabBar: 33,
  avatar: 14,
  pill: 999,
} as const;

/** Fixed sizes from theme/spacing.ts (pt). */
export const SIZES = {
  button: 56,
  buttonMd: 48,
  buttonSm: 36,
  iconButton: 40,
  pass: 62,
  like: 72,
  passSheet: 58,
  likeSheet: 66,
  codeBoxW: 70,
  codeBoxH: 92,
  tabBarH: 66,
  tabBarInset: 18,
  avatarSm: 32,
  avatarMd: 52,
  avatarLg: 80,
  avatarXl: 100,
  gutter: 20,
  gutterTight: 16,
  /** Status bar height on the 390 x 844 phone (Dynamic Island). */
  statusBar: 54,
  /** Home indicator safe area. */
  homeInset: 34,
} as const;

/* ─────────────────────────────── type ─────────────────────────────── */

export type TypeToken = {
  size: number;
  lineHeight: number;
  weight: 400 | 500 | 600 | 700 | 800;
  letterSpacing: number;
  family: "inter" | "mono";
  caps?: boolean;
};

/** The app's type scale (theme/typography.ts), in pt. */
export const T = {
  hero: {
    size: 44,
    lineHeight: 52,
    weight: 800,
    letterSpacing: -1.3,
    family: "inter",
  },
  photoName: {
    size: 38,
    lineHeight: 44,
    weight: 800,
    letterSpacing: -1.2,
    family: "inter",
  },
  photoAge: {
    size: 38,
    lineHeight: 44,
    weight: 400,
    letterSpacing: -0.6,
    family: "inter",
  },
  display: {
    size: 34,
    lineHeight: 40,
    weight: 800,
    letterSpacing: -1.0,
    family: "inter",
  },
  title: {
    size: 30,
    lineHeight: 36,
    weight: 800,
    letterSpacing: -0.9,
    family: "inter",
  },
  wordmark: {
    size: 26,
    lineHeight: 32,
    weight: 700,
    letterSpacing: -0.7,
    family: "inter",
  },
  displaySm: {
    size: 24,
    lineHeight: 30,
    weight: 700,
    letterSpacing: -0.5,
    family: "inter",
  },
  h1: {
    size: 20,
    lineHeight: 26,
    weight: 700,
    letterSpacing: -0.4,
    family: "inter",
  },
  h2: {
    size: 18,
    lineHeight: 24,
    weight: 600,
    letterSpacing: -0.3,
    family: "inter",
  },
  h3: {
    size: 16,
    lineHeight: 22,
    weight: 600,
    letterSpacing: -0.2,
    family: "inter",
  },
  headline: {
    size: 17,
    lineHeight: 22,
    weight: 700,
    letterSpacing: -0.3,
    family: "inter",
  },
  bodyLg: {
    size: 16,
    lineHeight: 24,
    weight: 400,
    letterSpacing: 0,
    family: "inter",
  },
  body: {
    size: 14,
    lineHeight: 21,
    weight: 400,
    letterSpacing: 0,
    family: "inter",
  },
  bodyMedium: {
    size: 14,
    lineHeight: 21,
    weight: 500,
    letterSpacing: 0,
    family: "inter",
  },
  footnote: {
    size: 13,
    lineHeight: 18,
    weight: 400,
    letterSpacing: 0,
    family: "inter",
  },
  bodySm: {
    size: 12,
    lineHeight: 18,
    weight: 400,
    letterSpacing: 0,
    family: "inter",
  },
  eyebrow: {
    size: 12,
    lineHeight: 16,
    weight: 700,
    letterSpacing: 0.9,
    family: "inter",
    caps: true,
  },
  tabLabel: {
    size: 11,
    lineHeight: 13,
    weight: 500,
    letterSpacing: 0.1,
    family: "inter",
  },
  button: {
    size: 17,
    lineHeight: 22,
    weight: 600,
    letterSpacing: -0.2,
    family: "inter",
  },
  buttonMd: {
    size: 15,
    lineHeight: 20,
    weight: 600,
    letterSpacing: -0.1,
    family: "inter",
  },
  buttonSm: {
    size: 14,
    lineHeight: 18,
    weight: 600,
    letterSpacing: -0.1,
    family: "inter",
  },
  monoCode: {
    size: 64,
    lineHeight: 78,
    weight: 700,
    letterSpacing: -1.0,
    family: "mono",
  },
  monoXl: {
    size: 48,
    lineHeight: 58,
    weight: 700,
    letterSpacing: -1.0,
    family: "mono",
  },
  monoDisplay: {
    size: 40,
    lineHeight: 48,
    weight: 700,
    letterSpacing: -1.2,
    family: "mono",
  },
  monoClock: {
    size: 32,
    lineHeight: 40,
    weight: 700,
    letterSpacing: -0.5,
    family: "mono",
  },
  monoLg: {
    size: 24,
    lineHeight: 32,
    weight: 700,
    letterSpacing: 0.4,
    family: "mono",
  },
  monoPill: {
    size: 14,
    lineHeight: 18,
    weight: 700,
    letterSpacing: 0.3,
    family: "mono",
  },
  monoChip: {
    size: 13,
    lineHeight: 16,
    weight: 700,
    letterSpacing: 0.2,
    family: "mono",
  },
} as const satisfies Record<string, TypeToken>;

export type TypeName = keyof typeof T;

/** CSS for a type token, optionally scaled (`k` = px per pt). */
export const typeStyle = (name: TypeName, k = 1): React.CSSProperties => {
  const t: TypeToken = T[name];
  return {
    fontFamily: t.family === "mono" ? fontMono : fontInter,
    fontSize: t.size * k,
    lineHeight: `${t.lineHeight * k}px`,
    fontWeight: t.weight,
    letterSpacing: t.letterSpacing * k,
    textTransform: t.caps ? "uppercase" : undefined,
  };
};

/* ─────────────────────────────── motion ─────────────────────────────── */

/** The app's springs (theme/motion.ts) as Remotion spring configs. */
export const SPRINGS = {
  card: { damping: 22, stiffness: 180, mass: 1 },
  sheet: { damping: 26, stiffness: 240, mass: 0.9 },
  press: { damping: 18, stiffness: 320, mass: 0.6 },
  celebrate: { damping: 14, stiffness: 140, mass: 1.1 },
  lift: { damping: 22, stiffness: 160, mass: 1 },
  click: { damping: 12, stiffness: 220, mass: 0.8 },
} as const;

export const MOTION = {
  /** ms */
  micro: 150,
  normal: 240,
  entrance: 360,
  celebration: 620,
  /** Delay between staggered items (list reveal, code digits), ms. */
  stagger: 60,
  pressScale: 0.96,
  pressScaleWide: 0.98,
} as const;

/** ms → frames at `fps` (not rounded: springs and interpolations accept fractions). */
export const msToFrames = (ms: number, fps: number) => (ms / 1000) * fps;

/* ─────────────────────────────── light ─────────────────────────────── */

/** Rose glow presets (theme/glow.ts), as CSS radial gradients for a full screen box. */
export const GLOW = {
  /** Welcome: rose bloom behind the mark. */
  hero: "radial-gradient(60% 27% at 50% 41%, rgba(255,61,95,0.15) 0%, rgba(255,61,95,0.068) 40%, rgba(255,61,95,0) 80%)",
  /** Match, validated, code reveal, done: one bloom high on the screen. */
  match:
    "radial-gradient(70% 32% at 50% 30%, rgba(255,61,95,0.20) 0%, rgba(255,61,95,0.09) 40%, rgba(255,61,95,0) 80%)",
  /** The live card's rose corner. */
  card: "radial-gradient(80% 70% at 100% 0%, rgba(255,61,95,0.12) 0%, rgba(255,61,95,0.054) 35%, rgba(255,61,95,0) 70%)",
} as const;

export type GlowPreset = keyof typeof GLOW;

/** Demo data shared by every scene (product brief §4 / creative direction §7). */
export const DEMO = {
  venue: "The Copper Room",
  venueType: "Cocktail bar",
  venueDistance: "30 m",
  hereCount: 7,
  match: {
    name: "Inès",
    age: 27,
    job: "Architect",
    interests: ["Jazz", "Natural wine", "Climbing"],
  },
  deck: [
    { name: "Léa", age: 27 },
    { name: "Maya", age: 26 },
    { name: "Sami", age: 29 },
    { name: "Adam", age: 30 },
  ],
  code: ["4", "8", "1", "7"],
  countdownStart: 45 * 60,
  zone: "At the bar",
  meetButtons: ["Come see me", "I'm coming to you"],
} as const;
