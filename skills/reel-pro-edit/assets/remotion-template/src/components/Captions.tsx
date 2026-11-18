import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import type React from "react";
import { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, UI } from "../lib/theme";

/** Words that always carry the accent colour. */
const KEYWORDS = /^(français|france|saïd|tech|cloud|l'ia|ia|montage|vidéo|vidéos|rendu|histoire|éclaté|tard|jamais|claude|couleurs|animations|effets|wesh|lance|projets|galères|valident|seul|news|nouveaux|trucs|fou|flemme|compliquée|coin)$/i;

type Props = {
  captions: Caption[];
  /** [startMs, endMs] windows where captions step aside for a big title */
  hide: [number, number][];
  top?: number;
};

/** Word-by-word reel captions: pages of a few words, active word highlighted. */
export const Captions: React.FC<Props> = ({ captions, hide, top = 1265 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;

  const { pages } = useMemo(
    () => createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: 750 }),
    [captions],
  );

  if (hide.some(([a, b]) => ms >= a && ms < b)) return null;
  const page = pages.find((p, i) => ms >= p.startMs && ms < (pages[i + 1]?.startMs ?? p.startMs + p.durationMs + 400));
  if (!page) return null;

  const pageFrame = Math.round((page.startMs / 1000) * fps);
  const enter = spring({ frame: frame - pageFrame, fps, config: { damping: 14, stiffness: 220, mass: 0.6 } });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "baseline",
          columnGap: 28,
          rowGap: 4,
          scale: String(interpolate(enter, [0, 1], [0.86, 1])),
          opacity: interpolate(enter, [0, 0.35], [0, 1], { extrapolateRight: "clamp" }),
          translate: `0px ${interpolate(enter, [0, 1], [24, 0])}px`,
        }}
      >
        {page.tokens.map((t) => {
          const active = ms >= t.fromMs && ms < t.toMs;
          const said = ms >= t.fromMs;
          const word = t.text.trim();
          const key = KEYWORDS.test(word.replace(/[.,!?:;…]/g, ""));
          const pop = spring({ frame: frame - Math.round((t.fromMs / 1000) * fps), fps, config: { damping: 12, stiffness: 260, mass: 0.5 } });
          return (
            <span
              key={t.fromMs}
              style={{
                fontFamily: UI,
                fontWeight: 900,
                fontSize: 74,
                lineHeight: 1.12,
                letterSpacing: -1.5,
                color: key ? C.accent : C.white,
                opacity: said ? 1 : 0.55,
                WebkitTextStroke: "14px rgba(8,8,12,0.92)",
                paintOrder: "stroke fill",
                textShadow: "0 8px 24px rgba(0,0,0,0.45)",
                display: "inline-block",
                scale: String(active ? interpolate(pop, [0, 1], [1.0, 1.07]) : 1),
                translate: active ? `0px ${interpolate(pop, [0, 1], [0, -6])}px` : "0px 0px",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
