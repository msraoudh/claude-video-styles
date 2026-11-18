import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export const ANTON = loadAnton().fontFamily;
export const INTER = loadInter("normal", { weights: ["600", "800", "900"] }).fontFamily;
export const CAIRO = loadCairo("normal", { weights: ["700", "900"] }).fontFamily;

/** the user's brand: black + deep Tunisian red, red→black gradients. */
export const C = {
  black: "#0B0B0B",
  ink: "#141012",
  red: "#E30A17",
  redDeep: "#7A0C17",
  redGlow: "rgba(227,10,23,0.75)",
  white: "#FFFFFF",
  cream: "#F4EDE4",
  grey: "#8E8A88",
};
export const GRAD = `linear-gradient(160deg, ${C.redDeep} 0%, #2A060B 45%, ${C.black} 100%)`;
/** caption + type families: Latin first, Arabic falls back to Cairo */
export const CAP_FONT = `${INTER}, ${CAIRO}, sans-serif`;
export const BIG_FONT = `${ANTON}, ${CAIRO}, sans-serif`;
/** accent font (no handwriting font: the user rejected Caveat on 2026-11-11) */
export const HAND_FONT = `${INTER}, ${CAIRO}, sans-serif`;
