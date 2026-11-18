import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { DISPLAY, KEY, PAGES } from "../data/captions.config";
import { WORDS } from "../data/timeline";
import { fontInter } from "../kit/fonts";
import { useLayout } from "../lib/layout";
import { EASE_OUT } from "../lib/motion";

/**
 * Global word-by-word captions (rendered ONCE by Teaser, above every scene).
 * - page appears 6 frames before its first word, words rise in with a 2-frame stagger
 * - unspoken words sit at 35% opacity; each lights up on its exact spoken frame (±2)
 * - key words switch to their colour + soft glow when spoken, with a tiny 4% scale pulse
 * - page blurs out 24 frames after its last word (or when the next page starts)
 * Scenes keep the band clear: portrait y 64–76%, landscape y 80–92%.
 */
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { u, portrait, captionY, width } = useLayout();

  const bounds = (k: number) => {
    const [a, b] = PAGES[k];
    const start = WORDS[a].s - 6;
    const nextStart = k + 1 < PAGES.length ? WORDS[PAGES[k + 1][0]].s - 6 : Infinity;
    return { a, b, start, end: Math.min(WORDS[b].e + 24, nextStart) };
  };
  const pageIdx = PAGES.findIndex((_, k) => {
    const { start, end } = bounds(k);
    return frame >= start && frame < end;
  });
  if (pageIdx === -1) return null;
  const { a, b, start: pageStart, end: pageEnd } = bounds(pageIdx);
  const pageOut = interpolate(frame, [pageEnd - 8, pageEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const size = (portrait ? 60 : 50) * u;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          width,
          top: captionY - size * 0.7,
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: `0 ${size * 0.26}px`,
          padding: `0 ${(portrait ? 110 : 260) * u}px`,
          fontFamily: fontInter,
          fontWeight: 700,
          fontSize: size,
          letterSpacing: -0.02 * size,
          lineHeight: 1.15,
          opacity: pageOut,
          filter: `blur(${(1 - pageOut) * 8 * u}px)`,
        }}
      >
        {Array.from({ length: b - a + 1 }, (_, k) => a + k).map((i) => {
          const w = WORDS[i];
          const enter = interpolate(
            frame,
            [pageStart + (i - a) * 2, pageStart + (i - a) * 2 + 10],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT },
          );
          const spoken = interpolate(frame, [w.s - 2, w.s + 4], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const key = KEY[i];
          const color = key && spoken > 0.5 ? key : "#FFFFFF";
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                color,
                opacity: (0.35 + 0.65 * spoken) * enter,
                translate: `0px ${(1 - enter) * 14 * u}px`,
                scale: String(1 + 0.04 * Math.sin(Math.PI * Math.min(1, spoken))),
                textShadow: `0 ${2 * u}px ${18 * u}px rgba(0,0,0,0.65)${key && spoken > 0.5 ? `, 0 0 ${22 * u}px ${key}66` : ""}`,
              }}
            >
              {DISPLAY[i] ?? w.w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
