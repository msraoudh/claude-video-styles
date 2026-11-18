import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { clip as getClip, MASTER } from "../data/footage";
import { beatPulse, bassShake, useGlobalFrame } from "../lib/beat";
import { GRADE, type Grade } from "../lib/look";

const FPS = 60;

/** grade + extra filter as valid CSS ("none" is only valid on its own) */
const cssFilter = (grade: Grade, extra?: string) => {
  const parts = [GRADE[grade], extra ?? ""].map((p) => p.trim()).filter((p) => p && p !== "none");
  return parts.length ? parts.join(" ") : "none";
};

export type ShotProps = {
  /** clip id from data/footage.ts (footage.json) */
  clip: string;
  /** seconds into the clip at local frame 0 (for a lip-sync master: the line's srcIn — or use <LipShot>) */
  at?: number;
  /** playback speed (1 = real time; 0.35 = slow-mo; 0 = freeze) — or a time map localFrame -> clip seconds (speed ramps) */
  speed?: number | ((localFrame: number) => number);
  /** object-fit cover by default; "contain" letterboxes */
  fit?: "cover" | "contain";
  /** object-position, e.g. "50% 30%" to keep the face high */
  focus?: string;
  /** base scale (1 = fill) */
  scale?: number;
  /** punch-in on every beat: extra scale at the hit (0.06 = +6 %) */
  punch?: number;
  /** sub-bass camera shake in px at full bass (0 = none) */
  shake?: number;
  grade?: Grade;
  /** extra CSS filter appended after the grade */
  filter?: string;
  style?: React.CSSProperties;
};

/**
 * One piece of footage, muted (the offline mixer owns all sound). <Freeze> maps trailer frames to clip time, so
 * slow-mo, freezes and speed ramps are exact and deterministic.
 */
export const Shot: React.FC<ShotProps> = ({ clip, at = 0, speed = 1, fit = "cover", focus = "50% 40%", scale = 1, punch = 0, shake = 0, grade = "cold", filter, style }) => {
  const f = useCurrentFrame();
  const g = useGlobalFrame();
  const src = getClip(clip).src;
  const t = typeof speed === "function" ? speed(f) : at + (f / FPS) * speed;
  const srcFrame = Math.max(0, Math.round(t * FPS));
  const s = scale * (1 + punch * beatPulse(g, 10));
  const sh = shake ? bassShake(g, shake) : { x: 0, y: 0, r: 0 };
  return (
    <AbsoluteFill style={{ overflow: "hidden", ...style }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(${s})`, filter: cssFilter(grade, filter) }}>
        <Freeze frame={srcFrame}>
          <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: fit, objectPosition: focus }} />
        </Freeze>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * The alpha cut-out of the subject (for text BEHIND them): render <Shot clip=X at=…/>, then the text, then
 * <Matte clip=X at=…/> with the same at/speed/focus/scale. `clip` defaults to the main master.
 */
export const Matte: React.FC<Omit<ShotProps, "clip"> & { clip?: string }> = ({ clip, at = 0, speed = 1, focus = "50% 40%", scale = 1, punch = 0, shake = 0, grade = "cold", filter, style }) => {
  const f = useCurrentFrame();
  const g = useGlobalFrame();
  const matte = clip ? getClip(clip).matte : MASTER.matte;
  const t = typeof speed === "function" ? speed(f) : at + (f / FPS) * speed;
  const s = scale * (1 + punch * beatPulse(g, 10));
  const sh = shake ? bassShake(g, shake) : { x: 0, y: 0, r: 0 };
  if (!matte) return null;
  return (
    <AbsoluteFill style={{ overflow: "hidden", ...style }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(${s})`, filter: cssFilter(grade, filter) }}>
        <Freeze frame={Math.max(0, Math.round(t * FPS))}>
          <OffthreadVideo src={staticFile(matte)} transparent muted style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: focus }} />
        </Freeze>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Speed-ramp helper: real time until `rampAt` (local frame), then `slow` speed — returns a time map for Shot.speed */
export const ramp = (at: number, rampAt: number, slow: number, fast = 1) => (lf: number) =>
  lf <= rampAt ? at + (lf / FPS) * fast : at + (rampAt / FPS) * fast + ((lf - rampAt) / FPS) * slow;
