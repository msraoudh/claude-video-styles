/**
 * The trailer look: dark, cold, menacing, premium — a thriller cut of the user's own series design system
 * (cinematic-reel-builder: #03060d ink, Inter, JetBrains Mono, cyan/violet/emerald/rose accents, liquid glass).
 * Re-skin per trailer if the subject has another identity, but keep the roles: one danger colour, one AI/tech
 * colour, one "go/action" colour, all used sparingly on a near-black world.
 */
export const L = {
  ink: "#03060d", // his series background
  ink2: "#070b14",
  steel: "#e6edf7", // primary text
  steel2: "rgba(230,237,247,0.65)",
  steel3: "rgba(230,237,247,0.42)",
  /** danger / the old world / "plus tard" */
  blood: "#ff2e4d",
  bloodSoft: "#fb7185",
  /** the AI (his violet) */
  violet: "#a78bfa",
  /** the way forward / "go" (his emerald, pushed acid for ACIDO) */
  acid: "#b6ff3b",
  emerald: "#34d399",
  cyan: "#7dd3fc",
  amber: "#fbbf24",
};

/** CSS filter grades for footage. Global grain/vignette/letterbox are added on top by TrailerFX. */
export const GRADE = {
  /** cold, crushed, desaturated thriller look — default for his face shots */
  cold: "contrast(1.18) saturate(0.72) brightness(0.86) hue-rotate(-8deg)",
  /** even darker, for the cold open / silence */
  night: "contrast(1.3) saturate(0.45) brightness(0.62)",
  /** black & white high contrast (flash frames, freeze frames) */
  mono: "grayscale(1) contrast(1.45) brightness(0.9)",
  /** keep screens/episodes readable but sit them in the world */
  screen: "contrast(1.08) saturate(0.9) brightness(0.9)",
  none: "none",
} as const;
export type Grade = keyof typeof GRADE;
