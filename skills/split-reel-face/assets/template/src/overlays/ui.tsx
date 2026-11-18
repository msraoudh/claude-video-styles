import { loadFont as loadEmoji } from "@remotion/google-fonts/NotoColorEmoji";
import type React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE_IN, SPRING_POP } from "../lib/motion";
import { C, glassCard } from "../lib/theme";

export const EMOJI = loadEmoji().fontFamily;

/** Pop/blur entrance at local frame `at`, blur exit over the last `exitLen` frames of `dur`. */
export const useEnterExit = (dur: number, at = 0, exitLen = 8, config = SPRING_POP) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config });
  const q = interpolate(frame, [dur - exitLen, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN });
  return { p, q, frame, fps };
};

export const enterStyle = (p: number, q: number, rise = 50): React.CSSProperties => ({
  opacity: interpolate(p, [0, 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (1 - q),
  scale: String(interpolate(p, [0, 1], [0.82, 1]) * interpolate(q, [0, 1], [1, 0.94])),
  translate: `0px ${interpolate(p, [0, 1], [rise, 0]) + q * -20}px`,
  filter: `blur(${interpolate(p, [0, 1], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) + q * 14}px)`,
});

/** Glass card container. */
export const Glass: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{ ...glassCard, ...style }}>{children}</div>
);

/** Emoji span using the bundled colour emoji font (renders the same everywhere). */
export const Emoji: React.FC<{ e: string; size: number; style?: React.CSSProperties }> = ({ e, size, style }) => (
  <span style={{ fontFamily: EMOJI, fontSize: size, lineHeight: 1, display: "inline-block", ...style }}>{e}</span>
);

/* ---------- icons (stroke SVGs, 24 grid) ---------- */
type IconProps = { size?: number; color?: string; stroke?: number; style?: React.CSSProperties };
const Svg: React.FC<IconProps & { children: React.ReactNode }> = ({ size = 48, color = C.white, stroke = 2.2, style, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);
export const IconCheck: React.FC<IconProps & { progress?: number }> = ({ progress = 1, ...p }) => (
  <Svg {...p}>
    <path d="M5 12.5l4.2 4.2L19 7" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} />
  </Svg>
);
export const IconCloud: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M7 18h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.2 4.5 4.5 0 0 0 7 18z" />
  </Svg>
);
export const IconChip: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
  </Svg>
);
export const IconSparkle: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
  </Svg>
);
export const IconWarning: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M12 3.5l9.5 16.5h-19z" />
    <path d="M12 10v4.5M12 17.6v.1" />
  </Svg>
);
export const IconPlay: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M8 5.5v13l11-6.5z" fill={p.color ?? C.white} />
  </Svg>
);
export const IconCalendar: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);
export const IconNews: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="15" height="14" rx="2" />
    <path d="M18 9h3v8a2 2 0 0 1-4 0M7 9h7M7 13h7M7 16h4" />
  </Svg>
);
export const IconCode: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" />
  </Svg>
);
export const IconCursor: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M4 2.5l14.5 9.2-6.3 1.4 3.6 7.2-2.6 1.3-3.6-7.2L4.9 19z" fill="#fff" stroke="#111" strokeWidth={1.3} strokeLinejoin="round" />
  </svg>
);

/** Claude-style spark mark (2D), used in the chat card header. */
export const SparkMark: React.FC<{ size?: number; color?: string; rotate?: number }> = ({ size = 56, color = C.claude, rotate = 0 }) => {
  const rays = 10;
  const pts: string[] = [];
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const len = i % 2 === 0 ? 11 : 9;
    pts.push(`M12 12 L${12 + Math.cos(a) * len} ${12 + Math.sin(a) * len}`);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ rotate: `${rotate}deg` }}>
      <path d={pts.join(" ")} stroke={color} strokeWidth={2.6} strokeLinecap="round" />
    </svg>
  );
};
