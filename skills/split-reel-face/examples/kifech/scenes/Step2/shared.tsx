import type React from "react";
import { Easing, interpolate, staticFile } from "remotion";
import { K } from "../../edit/theme";
import { f, wf } from "../../edit/time";

/**
 * Step 2 — « نعطيها لـ Claude يحلّلها » (19.86–39.08 s). Every beat lands ON its spoken word (src/data/captions.json).
 * Comments give the frame each word resolves to.
 */
export const T = {
  start: f(19.86), // 596 « étape 2 »
  end: f(39.08), // 1172 « étape 3 » (Step3 takes over)
  give: wf("نعطي", 21.05), // 632
  lien: wf("lien", 21.98), // 659 link chip drops into the input
  claude1: wf("claude", 22.51), // 675 spark pulses
  nqollo: wf("ونقلّو", 22.9), // 687 window widens, input focus
  tfarrej: wf("تفرّج", 23.33), // 700 typing starts
  video: wf("vidéo", 23.77), // 713
  hedhi: wf("هاذي", 24.0), // 720
  analyse: wf("أناليزيها", 24.28), // 728 « analysiha » underlined
  details: wf("détails", 24.9), // 747 « détails » underlined
  qolli: wf("وقلّي", 26.1), // 783
  bech: wf("وبإش", 27.82), // 835
  outils1: wf("outils", 28.7), // 861 « les outils » underlined
  kol: wf("وكل", 30.24), // 907 → send
  claude2: wf("claude", 30.7), // 921 terminal (Claude Code)
  yhabet: wf("يهبّطها", 31.59), // 948 download bar
  wahdou: wf("وحدو", 32.06), // 962 stamp « TOUT SEUL »
  analyse2: wf("ويناليزيها", 32.45), // 974 terminal compacts, the file pops out
  outils2: wf("outils", 33.01), // 990 whisper
  ffmpeg: wf("ffmpeg", 34.19), // 1026 contact sheet builds
  frame: wf("frame", 34.91), // 1047 tiles fly into the filmstrip
  baad: wf("وبعد", 35.56), // 1067
  yqolli: wf("يقلّي", 36.46), // 1094 Claude's reply + ding
  bchnowa: wf("بشنوّة", 37.5), // 1125 highlight « Couleur »
  kifech: wf("وكيفاش", 38.01), // 1140 highlight « Motion »
  wchnowa: wf("وشنوّة", 38.39), // 1152 tool chips
  outils3: wf("outils", 38.65), // 1160
};

/** Derived beats (frames). */
export const B = {
  winIn: T.start + 4, // 600
  grab: T.give + 8, // 640
  send: T.kol + 4, // 911
  toTerm: T.claude2 - 2, // 919
  ytType: T.claude2 + 9, // 930
  dlDone: T.yhabet + 22, // 970
  c3: T.analyse2 + 4, // 978
  ffType: T.ffmpeg - 8, // 1018
  ffDone: T.ffmpeg + 10, // 1036
  steps: T.frame + 8, // 1055 first filmstrip step
  replyIn: T.yqolli - 4, // 1090
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** ease in-out cubic on a 0..1 value */
export const io = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** keyframed value (clamped, eased in-out per segment) */
export const kf = (frame: number, fr: number[], vals: number[], linear = false) =>
  interpolate(frame, fr, vals, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: linear ? undefined : Easing.inOut(Easing.cubic) });
/** a bell 0→1→0 between a and b */
export const bell = (frame: number, a: number, b: number) => {
  const t = clamp01((frame - a) / (b - a));
  return Math.sin(t * Math.PI);
};

/**
 * REAL frames of the reference reel DemwzTPJK6J (extracted with ffmpeg at fps=2 → frame #n = t·2+1), 270×480 jpg
 * in public/refs/demwz/. Tags = what Claude notices on each frame.
 */
export const REFS: { n: number; t: number; tag: string }[] = [
  { n: 2, t: 0.5, tag: "HOOK" },
  { n: 6, t: 2.5, tag: "TITRE" },
  { n: 9, t: 4.0, tag: "« 7 »" },
  { n: 13, t: 6.0, tag: "UI CLAUDE" },
  { n: 17, t: 8.0, tag: "CARTE" },
  { n: 20, t: 9.5, tag: "ÉVENTAIL" },
  { n: 25, t: 12.0, tag: "SKILL.MD" },
  { n: 30, t: 14.5, tag: "GRILLE" },
  { n: 34, t: 16.5, tag: "PHOTO+SON" },
  { n: 39, t: 19.0, tag: "CHIPS" },
  { n: 45, t: 22.0, tag: "PROMPT" },
  { n: 51, t: 25.0, tag: "RÉPONSE" },
  { n: 55, t: 27.0, tag: "RING" },
  { n: 59, t: 29.0, tag: "PILLS" },
  { n: 63, t: 31.0, tag: "BONUS" },
  { n: 68, t: 33.5, tag: "RÉCAP" },
  { n: 70, t: 34.5, tag: "CTA" },
  { n: 75, t: 37.0, tag: "CTA" },
  { n: 77, t: 38.0, tag: "LEAD" },
  { n: 80, t: 39.5, tag: "FIN" },
];
export const refSrc = (n: number) => staticFile(`refs/demwz/f${String(n).padStart(3, "0")}.jpg`);
export const tc = (t: number) => `00:${String(Math.floor(t)).padStart(2, "0")}.${Math.round((t % 1) * 10)}`;

/** Link glyph (vector, no emoji). */
export const LinkIcon: React.FC<{ size?: number; color?: string }> = ({ size = 22, color = K.coralLight }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
    <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
  </svg>
);

/** Send arrow (up). */
export const SendIcon: React.FC<{ size?: number; color?: string }> = ({ size = 26, color = "#1A0F0B" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5" />
    <path d="M5 12l7-7 7 7" />
  </svg>
);

/** Claude Code tool-call bullet (coral blinking while it runs, green when done). */
export const Dot: React.FC<{ frame: number; doneAt: number }> = ({ frame, doneAt }) => {
  const running = frame < doneAt;
  return (
    <span
      style={{
        display: "inline-block",
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 16,
        flexShrink: 0,
        background: running ? K.coral : K.ok,
        opacity: running ? (Math.floor(frame / 5) % 2 ? 0.35 : 1) : 1,
        boxShadow: running ? `0 0 10px ${K.coralGlow}` : "0 0 8px rgba(127,209,161,0.5)",
      }}
    />
  );
};

/** The « ⎿ » output elbow of Claude Code, drawn (fonts don't all have the glyph). */
export const Elbow: React.FC = () => (
  <span style={{ display: "inline-block", width: 16, height: 16, marginLeft: 6, marginRight: 14, marginTop: -10, borderLeft: `2px solid ${K.dim}`, borderBottom: `2px solid ${K.dim}`, flexShrink: 0 }} />
);
