import type React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE_IN, EASE_OUT, SPRING_POP, sec } from "../lib/motion";
import { C, MONO, SERIF, UI } from "../lib/theme";
import { Emoji, enterStyle, Glass, IconCheck, IconChip, IconCloud, IconSparkle, useEnterExit } from "./ui";

type Beat = { from: number; dur: number };

/** "peut-être l'algo va enfin me calculer en France" — a progress bar that resolves on "France". */
export const AlgoCard: React.FC<Beat> = ({ from, dur }) => {
  const { p, q, frame } = useEnterExit(dur);
  const cue = (t: number) => sec(t) - from;
  const fill = interpolate(frame, [cue(3.18), cue(4.18)], [0.04, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN });
  const done = frame >= cue(4.2);
  const stamp = spring({ frame: frame - cue(4.2), fps: 30, config: SPRING_POP });
  return (
    <AbsoluteFill>
      <Glass style={{ position: "absolute", left: 130, right: 130, top: 860, padding: "34px 40px", ...enterStyle(p, q) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34, fontWeight: 800, letterSpacing: 2 }}>
          <Emoji e="🇫🇷" size={44} />
          <span>ALGORITHME</span>
          <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 30, color: done ? C.green : C.accentSoft }}>
            {Math.round(fill * 100)}%
          </span>
        </div>
        <div style={{ marginTop: 22, height: 22, borderRadius: 11, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
          <div
            style={{
              width: `${fill * 100}%`,
              height: "100%",
              borderRadius: 11,
              background: done ? C.green : `linear-gradient(90deg, ${C.frBlue}, #ffffff 50%, ${C.frRed})`,
              boxShadow: done ? `0 0 30px ${C.green}` : "0 0 24px rgba(255,255,255,0.5)",
            }}
          />
        </div>
        <div style={{ marginTop: 20, fontSize: 32, fontWeight: 600, color: "rgba(255,255,255,0.8)", height: 40 }}>
          {done ? (
            <span style={{ color: C.green, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 10, scale: String(interpolate(stamp, [0, 1], [1.3, 1])) }}>
              <IconCheck size={38} color={C.green} stroke={3} /> Calculé en France
            </span>
          ) : (
            <span>calcul en cours{".".repeat(1 + (Math.floor(frame / 6) % 3))}</span>
          )}
        </div>
      </Glass>
    </AbsoluteFill>
  );
};

/** "moi c'est the user, je bosse dans la tech, le cloud, l'IA… bref" */
export const NameCard: React.FC<Beat> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = (t: number) => sec(t) - from;
  const p = spring({ frame, fps, config: SPRING_POP });
  // "Bref" -> everything whips out to the left
  const whip = interpolate(frame, [cue(8.7), cue(8.7) + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN });
  const underline = interpolate(frame, [4, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT });
  const chips: [number, string, React.ReactNode][] = [
    [7.14, "TECH", <IconChip key="c" size={40} color={C.accent} />],
    [7.74, "CLOUD", <IconCloud key="l" size={40} color={C.accent} />],
    [8.06, "IA", <IconSparkle key="s" size={40} color={C.accent} />],
  ];
  return (
    <AbsoluteFill style={{ translate: `${-whip * 1100}px 0px`, filter: `blur(${whip * 30}px)`, opacity: 1 - whip * 0.6 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 780, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: SERIF, fontSize: 64, color: C.white, opacity: interpolate(p, [0, 1], [0, 0.9]), textShadow: "0 6px 26px rgba(0,0,0,0.5)" }}>
          moi c'est
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 230,
            lineHeight: 0.95,
            color: C.white,
            textShadow: "0 18px 50px rgba(0,0,0,0.5)",
            scale: String(interpolate(p, [0, 1], [0.7, 1])),
            opacity: interpolate(p, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
            filter: `blur(${interpolate(p, [0, 1], [20, 0], { extrapolateRight: "clamp" })}px)`,
          }}
        >
          the user
        </div>
        <div style={{ width: 360 * underline, height: 10, borderRadius: 5, background: C.accent, boxShadow: `0 0 30px ${C.accent}`, marginTop: 4 }} />
        <div style={{ display: "flex", gap: 22, marginTop: 40 }}>
          {chips.map(([t, label, icon]) => {
            const cp = spring({ frame: frame - cue(t), fps, config: SPRING_POP });
            return (
              <Glass
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "18px 30px",
                  borderRadius: 999,
                  fontSize: 40,
                  fontWeight: 900,
                  letterSpacing: 1,
                  ...enterStyle(cp, 0, 30),
                }}
              >
                {icon}
                {label}
              </Glass>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** "j'aime bien tester des trucs, apprendre et construire des projets" */
export const SkillsStack: React.FC<Beat> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = (t: number) => sec(t) - from;
  const q = interpolate(frame, [dur - 7, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN });
  const rows: [number, string][] = [
    [9.48, "TESTER"],
    [10.57, "APPRENDRE"],
    [10.9, "CONSTRUIRE"],
  ];
  return (
    <AbsoluteFill style={{ opacity: 1 - q, filter: `blur(${q * 12}px)` }}>
      <div style={{ position: "absolute", left: 90, top: 860, display: "flex", flexDirection: "column", gap: 18 }}>
        {rows.map(([t, label], i) => {
          const rp = spring({ frame: frame - cue(t), fps, config: SPRING_POP });
          const tick = interpolate(frame, [cue(t) + 5, cue(t) + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                opacity: interpolate(rp, [0, 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                translate: `${interpolate(rp, [0, 1], [-80, 0])}px 0px`,
              }}
            >
              <Glass style={{ width: 84, height: 84, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", background: tick > 0 ? C.accent : C.glass }}>
                <IconCheck size={56} stroke={3.4} progress={tick} />
              </Glass>
              <span
                style={{
                  fontFamily: UI,
                  fontWeight: 900,
                  fontSize: 88 - i * 4,
                  letterSpacing: -2,
                  color: C.white,
                  WebkitTextStroke: "10px rgba(8,8,12,0.85)",
                  paintOrder: "stroke fill",
                  textShadow: "0 10px 30px rgba(0,0,0,0.4)",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
