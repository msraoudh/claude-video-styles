import { Easing, interpolate } from "remotion";
import { f, type RGB } from "./cues";

/**
 * A "look" = every knob of the cinematic grade + ambient light for one story section.
 * Looks are keyframed on the cut timeline and crossfaded, so the grade evolves with the story.
 */
export type Look = {
  /** 0..1 desaturation ('saturation' blend with neutral grey). */
  desat: number;
  /** Colour cast, 'soft-light' blend (colour + opacity). Half strength on the face. */
  cast: RGB;
  castA: number;
  /** Shadow tint, 'lighten' blend of a DARK colour: the deepest blacks take that hue (teal blacks). */
  lift: RGB;
  liftA: number;
  /** Black crush, 'color-burn' with a light (tinted) grey = a levels black point. 0..1 opacity. */
  crush: number;
  crushTint: RGB;
  /** Background (the wall) only, face masked out: 'hue' shift toward a colour, plus darkening. */
  wallHue: RGB;
  wallHueA: number;
  wallDim: number;
  /** Lens vignette strength 0..1 and where it starts (% of the ellipse radius). */
  vig: number;
  vigIn: number;
  /** Darkness creeping in from the four corners, 0..1. */
  creep: number;
  /** Overall exposure pull-down (black, normal blend) 0..1. */
  dim: number;
  /** Isolate the face in a hard key light; everything else to black. 0..1. */
  spot: number;
  /** Pro-Mist style diffusion / halation 0..1. */
  mist: number;
  /** Film grain opacity. */
  grain: number;
  /** Key light from the top-right corner (soft-light colour + screen glow). */
  key: number;
  keyCol: RGB;
  /** Coloured light from the bottom-left corner (screen). */
  rim: number;
  rimCol: RGB;
  /** Volumetric beams: warm from the top-right, cold from the top-left. */
  beamsWarm: number;
  beamsCool: number;
  /** How much the light pumps on the music beat (after the drop). */
  pulse: number;
};

const GOLD: RGB = [255, 168, 92];
const TEAL_DARK: RGB = [0, 24, 34];
const TEAL: RGB = [20, 170, 205];
const TEAL_WALL: RGB = [0, 150, 160];
const COLD_BLUE: RGB = [70, 125, 220];
const NEUTRAL_GREY: RGB = [236, 236, 236];
const TEAL_GREY: RGB = [214, 232, 240];

/** 0–12 s — warm, golden, clean; a hint of teal in the shadows. */
export const HOOK: Look = {
  desat: 0.08,
  cast: [255, 186, 118],
  castA: 0.16,
  lift: TEAL_DARK,
  liftA: 1,
  crush: 0.32,
  crushTint: NEUTRAL_GREY,
  wallHue: TEAL_WALL,
  wallHueA: 0.4,
  wallDim: 0.1,
  vig: 0.42,
  vigIn: 38,
  creep: 0,
  dim: 0.04,
  spot: 0,
  mist: 0.14,
  grain: 0.09,
  key: 0.5,
  keyCol: GOLD,
  rim: 0.22,
  rimCol: TEAL,
  beamsWarm: 0.2,
  beamsCool: 0,
  pulse: 0,
};

/** 12–16 s — the problem: cold, desaturated teal/blue, crushed blacks, heavier vignette. */
export const STRUGGLE: Look = {
  desat: 0.32,
  cast: [62, 118, 168],
  castA: 0.3,
  lift: [0, 16, 28],
  liftA: 1,
  crush: 0.5,
  crushTint: TEAL_GREY,
  wallHue: [30, 110, 150],
  wallHueA: 0.35,
  wallDim: 0.26,
  vig: 0.5,
  vigIn: 46,
  creep: 0.25,
  dim: 0.04,
  spot: 0,
  mist: 0.06,
  grain: 0.13,
  key: 0,
  keyCol: GOLD,
  rim: 0.3,
  rimCol: COLD_BLUE,
  beamsWarm: 0,
  beamsCool: 0.16,
  pulse: 0,
};

/** 16–21 s — "des idées de fou… le rendu de mes rêves": a soft, dreamy daydream (still cool). */
export const DREAM: Look = {
  desat: 0.12,
  cast: [150, 138, 205],
  castA: 0.2,
  lift: [14, 10, 34],
  liftA: 1,
  crush: 0.22,
  crushTint: NEUTRAL_GREY,
  wallHue: [90, 90, 200],
  wallHueA: 0.3,
  wallDim: 0.08,
  vig: 0.36,
  vigIn: 50,
  creep: 0.1,
  dim: 0,
  spot: 0,
  mist: 0.34,
  grain: 0.11,
  key: 0.24,
  keyCol: [255, 150, 175],
  rim: 0.32,
  rimCol: [95, 120, 255],
  beamsWarm: 0.12,
  beamsCool: 0.22,
  pulse: 0,
};

/** 21.2 s — reality hits: colder and harsher than the first struggle. */
export const REALITY: Look = {
  ...STRUGGLE,
  desat: 0.4,
  castA: 0.34,
  crush: 0.58,
  wallDim: 0.32,
  vig: 0.58,
  vigIn: 42,
  creep: 0.35,
  dim: 0.06,
  grain: 0.15,
  rim: 0.24,
  beamsCool: 0.12,
};

/** 35.8 s — "ça n'arrivera jamais": darkness has crept in from every corner. */
export const ABYSS: Look = {
  ...REALITY,
  desat: 0.46,
  crush: 0.66,
  wallDim: 0.4,
  vig: 0.72,
  vigIn: 30,
  creep: 0.85,
  dim: 0.1,
  grain: 0.18,
  rim: 0.18,
  beamsCool: 0.06,
};

/** 36.9–42.4 s — Claude: warm coral light pours in from the right; shadows still teal. */
export const HOPE: Look = {
  desat: 0.14,
  cast: [255, 160, 120],
  castA: 0.1,
  lift: TEAL_DARK,
  liftA: 1,
  crush: 0.3,
  crushTint: TEAL_GREY,
  wallHue: TEAL_WALL,
  wallHueA: 0.35,
  wallDim: 0.14,
  vig: 0.36,
  vigIn: 52,
  creep: 0.12,
  dim: 0,
  spot: 0,
  mist: 0.2,
  grain: 0.09,
  key: 0.34,
  keyCol: [255, 134, 92],
  rim: 0.3,
  rimCol: TEAL,
  beamsWarm: 0.34,
  beamsCool: 0,
  pulse: 0,
};

/** 42.4 s — "mais wesh,": near-dark, one hard key light on the face, the rest falls to black. */
export const WESH: Look = {
  desat: 0.3,
  cast: [96, 116, 150],
  castA: 0.22,
  lift: [0, 0, 0],
  liftA: 0,
  crush: 0.62,
  crushTint: NEUTRAL_GREY,
  wallHue: TEAL_WALL,
  wallHueA: 0,
  wallDim: 0.3,
  vig: 0.8,
  vigIn: 26,
  creep: 0.5,
  dim: 0,
  spot: 0.86,
  mist: 0.08,
  grain: 0.18,
  key: 0,
  keyCol: GOLD,
  rim: 0.12,
  rimCol: COLD_BLUE,
  beamsWarm: 0,
  beamsCool: 0,
  pulse: 0,
};

/** 43.9 s — the light tightens right before the drop. */
export const WESH_DEEP: Look = { ...WESH, spot: 0.95, vig: 0.88, creep: 0.7 };

/** 43.93 s — DROP: high-energy warm orange / magenta. */
export const DROP: Look = {
  desat: 0,
  cast: [255, 130, 95],
  castA: 0.16,
  lift: [22, 4, 14],
  liftA: 1,
  crush: 0.24,
  crushTint: NEUTRAL_GREY,
  wallHue: TEAL_WALL,
  wallHueA: 0,
  wallDim: 0,
  vig: 0.28,
  vigIn: 56,
  creep: 0,
  dim: 0,
  spot: 0,
  mist: 0.16,
  grain: 0.09,
  key: 0.85,
  keyCol: [255, 122, 61],
  rim: 0.34,
  rimCol: [255, 46, 140],
  beamsWarm: 0.5,
  beamsCool: 0,
  pulse: 1,
};

/** 45–64 s — confident golden hour with subtle teal shadows. */
export const OUTRO: Look = {
  desat: 0,
  cast: [255, 172, 104],
  castA: 0.17,
  lift: TEAL_DARK,
  liftA: 1,
  crush: 0.22,
  crushTint: NEUTRAL_GREY,
  wallHue: TEAL_WALL,
  wallHueA: 0.4,
  wallDim: 0.1,
  vig: 0.32,
  vigIn: 46,
  creep: 0,
  dim: 0,
  spot: 0,
  mist: 0.16,
  grain: 0.09,
  key: 0.55,
  keyCol: GOLD,
  rim: 0.3,
  rimCol: TEAL,
  beamsWarm: 0.36,
  beamsCool: 0,
  pulse: 0.35,
};

/** 55.3–56.4 s — "…ou si je vais parler tout seul" 🦗: a brief, comic cool dip. */
export const LONELY: Look = { ...OUTRO, cast: [120, 150, 190], castA: 0.16, desat: 0.2, wallDim: 0.2, key: 0.15, beamsWarm: 0.1, pulse: 0 };

/** 62–64 s — sign-off: the sun gets a little lower and warmer. */
export const SUNSET: Look = { ...OUTRO, castA: 0.21, key: 0.7, keyCol: [255, 150, 80], beamsWarm: 0.45, mist: 0.24 };

type Key = { t: number; look: Look; ease?: "inOut" | "linear" };

/**
 * The steady split-reel look: the warm golden grade of the first split reel (its SUNSET look, 63–115 s), without the
 * teal wall shift (its face mask sits at a fixed point that the layout morphs don't follow) and without the beat pump.
 */
export const SPLIT_WARM: Look = { ...SUNSET, wallHueA: 0, wallDim: 0, pulse: 0 };

/**
 * The grade timeline (seconds of THIS video). One key = one steady look for the whole reel, which is what a split
 * explainer wants. To change the mood on a line (e.g. a cold dip on « ça a cassé »), add keys on this video's own
 * seconds: { t: 41.2, look: SPLIT_WARM }, { t: 41.6, look: LONELY }, … — never reuse another video's timings.
 */
export const LOOK_KEYS: Key[] = [{ t: 0, look: SPLIT_WARM }];

const EASE = Easing.bezier(0.45, 0, 0.25, 1);

const mixN = (a: number, b: number, k: number) => a + (b - a) * k;
const mixC = (a: RGB, b: RGB, k: number): RGB => [mixN(a[0], b[0], k), mixN(a[1], b[1], k), mixN(a[2], b[2], k)];

export const mixLook = (a: Look, b: Look, k: number): Look => ({
  desat: mixN(a.desat, b.desat, k),
  cast: mixC(a.cast, b.cast, k),
  castA: mixN(a.castA, b.castA, k),
  lift: mixC(a.lift, b.lift, k),
  liftA: mixN(a.liftA, b.liftA, k),
  crush: mixN(a.crush, b.crush, k),
  crushTint: mixC(a.crushTint, b.crushTint, k),
  wallHue: mixC(a.wallHue, b.wallHue, k),
  wallHueA: mixN(a.wallHueA, b.wallHueA, k),
  wallDim: mixN(a.wallDim, b.wallDim, k),
  vig: mixN(a.vig, b.vig, k),
  vigIn: mixN(a.vigIn, b.vigIn, k),
  creep: mixN(a.creep, b.creep, k),
  dim: mixN(a.dim, b.dim, k),
  spot: mixN(a.spot, b.spot, k),
  mist: mixN(a.mist, b.mist, k),
  grain: mixN(a.grain, b.grain, k),
  key: mixN(a.key, b.key, k),
  keyCol: mixC(a.keyCol, b.keyCol, k),
  rim: mixN(a.rim, b.rim, k),
  rimCol: mixC(a.rimCol, b.rimCol, k),
  beamsWarm: mixN(a.beamsWarm, b.beamsWarm, k),
  beamsCool: mixN(a.beamsCool, b.beamsCool, k),
  pulse: mixN(a.pulse, b.pulse, k),
});

/** The interpolated look at `frame` (frames on the composition timeline). */
export const lookAt = (frame: number, keys: Key[] = LOOK_KEYS): Look => {
  if (frame <= f(keys[0].t)) return keys[0].look;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    const fa = f(a.t);
    const fb = f(b.t);
    if (frame >= fa && frame < fb) {
      if (a.look === b.look) return a.look;
      const k = interpolate(frame, [fa, fb], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: b.ease === "linear" ? Easing.linear : EASE,
      });
      return mixLook(a.look, b.look, k);
    }
  }
  return keys[keys.length - 1].look;
};
