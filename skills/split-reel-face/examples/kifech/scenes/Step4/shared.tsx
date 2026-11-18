import { loadFont as loadEmoji } from "@remotion/google-fonts/NotoColorEmoji";
import type React from "react";
import { EASE } from "../../edit/kit";
import { K } from "../../edit/theme";
import { f, wf } from "../../edit/time";

/** Colour emoji font (renders the same on Windows and WSL). */
export const EMOJI = loadEmoji().fontFamily;
export const Emo: React.FC<{ e: string; size: number; style?: React.CSSProperties }> = ({ e, size, style }) => (
  <span style={{ fontFamily: EMOJI, fontSize: size, lineHeight: 1, display: "inline-block", ...style }}>{e}</span>
);

export const cl = (x: number) => Math.min(1, Math.max(0, x));
/** eased 0→1 from frame `at` over `len` frames (house ease-out). */
export const ease = (frame: number, at: number, len: number) => EASE((frame - at) / len);
/** linear 0→1 between frames a and b. */
export const lin = (frame: number, a: number, b: number) => cl((frame - a) / (b - a));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const EASE_IO = (x: number) => {
  const t = cl(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
/** seconds → « 01:02.15 » (mm:ss.ff at 30 fps). */
export const tc = (s: number) => {
  const t = Math.max(0, s);
  const m = Math.floor(t / 60);
  const ss = Math.floor(t % 60);
  const ff = Math.floor((t * 30) % 30);
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${String(ff).padStart(2, "0")}`;
};
/** seconds → « 01:55 ». */
export const mmss = (s: number) => {
  const t = Math.max(0, Math.round(s));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

/** Lightning bolt (skill icon). */
export const Bolt: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = K.coral }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path d="M13.5 2 L4.5 13.6 H11 L10 22 L19.5 10 H13 Z" fill={color} />
  </svg>
);
/** Check mark. */
export const Check: React.FC<{ size?: number; color?: string; progress?: number; stroke?: number }> = ({ size = 24, color = K.ok, progress = 1, stroke = 3 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M5 12.5l4.2 4.2L19 7" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - cl(progress)} />
  </svg>
);
/** Cross mark. */
export const Cross: React.FC<{ size?: number; color?: string; stroke?: number }> = ({ size = 24, color = K.coral, stroke = 3 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M6 6 L18 18 M18 6 L6 18" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
  </svg>
);
/** Magnifier. */
export const Lens: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = K.cream }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx={10.5} cy={10.5} r={6.5} stroke={color} strokeWidth={2.6} />
    <path d="M15.5 15.5 L21 21" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
  </svg>
);
/** Send arrow (Claude input). */
export const SendArrow: React.FC<{ size?: number; color?: string }> = ({ size = 26, color = "#1A0F0B" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 19 V5 M6 11 L12 5 L18 11" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Word frames of this scene (GLOBAL frames, from src/data/captions.json). */
export const T = {
  A0: f(55.28),
  give: wf("نعطيه", 56.03),
  topic: wf("topic", 56.71),
  howa: wf("وهو", 57.44),
  yemchi: wf("يمشي", 57.77),
  yekteb: wf("يكتب", 58.18),
  script: wf("script", 58.55),
  gen: wf("يجينيري", 59.04),
  eleven: wf("ElevenLabs", 59.95),
  use: wf("يستعمل", 60.93),
  remotion: wf("Remotion", 61.49),
  skills: wf("skills", 62.13),
  sound: wf("sound", 63.22),
  music: wf("الموزيكا", 64.23),
  kol: wf("كل", 65.59),
  ylawj: wf("يلوّجو", 66.71),
  handoff: f(66.9),
  A1: f(67.0),
  B0: f(72.6),
  ana: wf("وأنا", 72.79),
  netfarraj: wf("نتفرّج", 73.55),
  dima: wf("وديما", 74.05),
  odkhel: wf("ادخل", 75.06),
  rem2: wf("Remotion", 75.38),
  chouf: wf("وشوف", 76.36),
  talla: wf("طلّة", 77.08),
  walla: wf("ولّا", 77.78),
  kammelt: wf("كمّلت", 78.19),
  rendu: wf("rendu", 78.8),
  ana2: wf("أنا", 79.71),
  check: wf("نتشيكي", 80.11),
  ma3jeb: wf("عجبتنيش", 80.89),
  n9olou: wf("نقلّو", 81.22),
  baddel: wf("يبدّلها", 81.45),
  vibe: wf("vibe", 82.94),
  rythme: wf("rythme", 83.43),
  design: wf("design", 84.59),
  motion: wf("motion", 85.31),
  bay: wf("بأي", 86.03),
  B1: f(86.52),
};
