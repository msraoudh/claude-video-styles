// Type — kinetic headlines (sizes in PX: multiply by `u` from useLayout()).
//
//   <KineticText
//     words={[{ t: "Meet" }, { t: "someone." , br: true }, { t: "Tonight.", c: C.rose, glow: true }]}
//     startFrame={6} size={150 * u} exitFrame={110}
//   />
//   <Highlight progress={p}>right here</Highlight>
//   <StrikeThrough progress={p}>weeks of chat</StrikeThrough>
//
// Entrance = creative direction §2.1: per word blur(14u → 0) + rise 40u + scale
// 0.92 → 1 + opacity, spring 18/140/0.9, 3–4 frame stagger. Exit = the whole
// stack blurs 0 → 16u and fades in ~8 frames. Inter 800, tracking −3 %.
import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./theme";
import { fontInter } from "./fonts";
import {
  SPRING_WORD,
  blurInStyle,
  blurOutStyle,
  springIn,
} from "../lib/motion";

export type KineticWord = {
  t: string;
  /** Colour (key words: C.rose / C.roseSoft / C.green). */
  c?: string;
  italic?: boolean;
  weight?: 400 | 500 | 600 | 700 | 800;
  /** Soft glow in the word's colour (key words). */
  glow?: boolean;
  /** Line break after this word. */
  br?: boolean;
  /** Extra delay (frames) for this word. */
  delay?: number;
};

export type KineticTextProps = {
  words: readonly (KineticWord | string)[];
  startFrame?: number;
  /** Frames between words. Default 4. */
  stagger?: number;
  /** Font size in px. */
  size: number;
  align?: "center" | "left" | "right";
  /** Line height multiple. Default 1.04. */
  lineHeight?: number;
  maxWidth?: number;
  /** Frame where the whole stack blurs out (8 frames). */
  exitFrame?: number;
  exitDuration?: number;
  color?: string;
  weight?: 400 | 500 | 600 | 700 | 800;
  /** Tracking as a fraction of the size. Default −0.03. */
  tracking?: number;
  /** Rise distance in u (default 40). */
  rise?: number;
  style?: React.CSSProperties;
};

export const KineticText: React.FC<KineticTextProps> = ({
  words,
  startFrame = 0,
  stagger = 4,
  size,
  align = "center",
  lineHeight = 1.04,
  maxWidth,
  exitFrame,
  exitDuration = 8,
  color = C.text,
  weight = 800,
  tracking = -0.03,
  rise = 40,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const u = Math.min(width, height) / 1080;
  const q =
    exitFrame === undefined
      ? 0
      : interpolate(frame, [exitFrame, exitFrame + exitDuration], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.quad),
        });
  const list = words.map((w) => (typeof w === "string" ? { t: w } : w));
  let extra = 0;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent:
          align === "center"
            ? "center"
            : align === "right"
              ? "flex-end"
              : "flex-start",
        alignItems: "baseline",
        columnGap: size * 0.24,
        maxWidth,
        fontFamily: fontInter,
        fontSize: size,
        lineHeight,
        fontWeight: weight,
        letterSpacing: size * tracking,
        color,
        textAlign: align,
        ...(q > 0 ? blurOutStyle(q, u) : null),
        ...style,
      }}
    >
      {list.map((w, i) => {
        extra += w.delay ?? 0;
        const p = springIn(
          frame,
          fps,
          startFrame + i * stagger + extra,
          SPRING_WORD,
        );
        const col = w.c ?? color;
        return (
          <React.Fragment key={i}>
            <span
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                color: col,
                fontWeight: w.weight ?? weight,
                fontStyle: w.italic ? "italic" : undefined,
                textShadow: w.glow
                  ? `0 0 ${size * 0.28}px ${col}66, 0 0 ${size * 0.08}px ${col}55`
                  : undefined,
                ...blurInStyle(p, u, rise),
              }}
            >
              {w.t}
            </span>
            {w.br ? <span style={{ flexBasis: "100%", height: 0 }} /> : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** A marker swipe behind text (left → right). progress 0..1. */
export const Highlight: React.FC<{
  progress: number;
  color?: string;
  /** Height of the marker as a fraction of the line (from the bottom). Default 0.46. */
  height?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({
  progress,
  color = "rgba(255,61,95,0.42)",
  height = 0.46,
  style,
  children,
}) => {
  const p = Easing.bezier(0.16, 1, 0.3, 1)(Math.min(1, Math.max(0, progress)));
  return (
    <span style={{ position: "relative", display: "inline-block", ...style }}>
      <span
        style={{
          position: "absolute",
          left: "-0.06em",
          right: "-0.06em",
          bottom: "0.06em",
          height: `${height}em`,
          background: color,
          borderRadius: "0.08em",
          transformOrigin: "0% 50%",
          scale: `${p} 1`,
          rotate: "-1deg",
          zIndex: 0,
        }}
      />
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </span>
  );
};

/** A line drawn across text (left → right), slightly tilted. progress 0..1. */
export const StrikeThrough: React.FC<{
  progress: number;
  color?: string;
  /** Thickness in em. Default 0.075. */
  thickness?: number;
  /** Tilt in degrees. Default −4. */
  tilt?: number;
  /** Dim the text as it gets struck (0..1). Default 0.45. */
  dim?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({
  progress,
  color = C.rose,
  thickness = 0.075,
  tilt = -4,
  dim = 0.45,
  style,
  children,
}) => {
  const p = Easing.bezier(0.16, 1, 0.3, 1)(Math.min(1, Math.max(0, progress)));
  return (
    <span style={{ position: "relative", display: "inline-block", ...style }}>
      <span style={{ opacity: 1 - dim * p }}>{children}</span>
      <span
        style={{
          position: "absolute",
          left: "-0.08em",
          right: "-0.08em",
          top: "52%",
          height: `${thickness}em`,
          marginTop: `${-thickness / 2}em`,
          background: color,
          borderRadius: `${thickness}em`,
          transformOrigin: "0% 50%",
          scale: `${p} 1`,
          rotate: `${tilt}deg`,
        }}
      />
    </span>
  );
};
