import { fitText } from "@remotion/layout-utils";
import type React from "react";
import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE_IN, SPRING_POP, springIn } from "../lib/motion";
import { C, DISPLAY, SERIF } from "../lib/theme";
import { cameraAt, gradeAt } from "../timeline";

/**
 * Re-draws the user on top of whatever is behind him (cutout from Robust Video Matting).
 * Must sit inside a <Sequence> that starts at `from`, inside the Footage camera.
 */
export const Cutout: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame();
  return (
    <OffthreadVideo
      src={staticFile("footage/cutout-v4.webm")}
      transparent
      muted
      trimBefore={from}
      style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", filter: gradeAt(from + frame) }}
    />
  );
};

type BehindTextProps = {
  name: string;
  /** frame on the cut timeline where the beat starts */
  from: number;
  durationInFrames: number;
  lines: string[];
  /** index of the line drawn in the accent colour */
  accentLine?: number;
  /** top of the word stack, px (camera space, 1080x1920) */
  top?: number;
  /**
   * Horizontal column the words are fitted into. Measured from the matte: in every beat the user's
   * head spans x≈150–700 and leaves ~400px of wall on the right, so words live there and their
   * left edge slips just behind his head.
   */
  column?: [number, number];
  maxFontSize?: number;
  /** small serif kicker above the stack */
  kicker?: string;
  /** frames each line waits before entering */
  stagger?: number;
};

/** Big condensed words placed BEHIND the user: the plate, these letters (soft cast shadow), then his cutout. */
export const BehindText: React.FC<BehindTextProps> = ({ name, from, durationInFrames, column, ...rest }) => {
  const { fps } = useVideoConfig();
  // words live in camera space: shrink the column so that, once zoomed, the right edge stays inside the frame
  const s = cameraAt(from + Math.min(6, durationInFrames - 1)).scale;
  const col: [number, number] = column ?? [630, Math.round(540 + 500 / s)];
  return (
    <Sequence name={name} from={from} durationInFrames={durationInFrames} premountFor={fps}>
      <BehindLetters dur={durationInFrames} column={col} {...rest} />
      <Cutout from={from} />
    </Sequence>
  );
};

const BehindLetters: React.FC<Omit<BehindTextProps, "name" | "from" | "durationInFrames"> & { dur: number }> = ({
  lines,
  accentLine = -1,
  top = 230,
  column = [630, 1050],
  maxFontSize = 330,
  kicker,
  stagger = 4,
  dur,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(frame, [dur - 7, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN });
  const width = column[1] - column[0];
  let y = top;
  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: `blur(${out * 14}px)` }}>
      {kicker ? (
        <div
          style={{
            position: "absolute",
            left: column[0] + 40,
            top: top - 70,
            fontFamily: SERIF,
            fontSize: 64,
            color: C.white,
            opacity: interpolate(frame, [1, 8], [0, 0.95], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            textShadow: "0 6px 30px rgba(0,0,0,0.35)",
            whiteSpace: "nowrap",
          }}
        >
          {kicker}
        </div>
      ) : null}
      {lines.map((line, i) => {
        const size = Math.min(maxFontSize, fitText({ text: line, withinWidth: width, fontFamily: DISPLAY, letterSpacing: "-2px", textTransform: "uppercase" }).fontSize);
        const lineTop = y;
        y += size * 0.9;
        const p = springIn(frame, fps, i * stagger, SPRING_POP);
        const isAccent = i === accentLine;
        return (
          <div
            key={line + i}
            style={{
              position: "absolute",
              left: column[0],
              top: lineTop,
              fontFamily: DISPLAY,
              fontSize: size,
              lineHeight: `${size * 0.9}px`,
              letterSpacing: interpolate(p, [0, 1], [24, -2]),
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              color: isAccent ? C.accent : C.white,
              transformOrigin: "0% 50%",
              opacity: interpolate(p, [0, 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              translate: `${interpolate(p, [0, 1], [120, 0])}px 0px`,
              scale: String(interpolate(p, [0, 1], [1.25, 1])),
              filter: `blur(${interpolate(p, [0, 1], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px) drop-shadow(-14px 26px 22px rgba(0,0,0,0.4))`,
            }}
          >
            {line}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
