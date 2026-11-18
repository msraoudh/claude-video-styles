import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { scene, wordAt } from "../data/timeline";
import { C, fontInter, KineticText, type KineticWord, NightAurora, Sparkles } from "../kit";
import { useLayout } from "../lib/layout";
import { EASE_IN_OUT, EASE_OUT, lerp, springIn, SPRING_SOFT } from "../lib/motion";
import type { Cue } from ".";

/**
 * END CARD (demo) — "Lumen. Built for right now."
 * The logo is the PAYOFF (never the opener): the mark draws on (stroke-dashoffset), fills, a ring
 * pulses out (sting), the wordmark reveals letter by letter through a mask on "Lumen.", the tagline
 * lands word by word on its spoken frames, sparkles twinkle, then a long confident hold + fade.
 * Replace the mark with the product's real logo SVG from public/brand — never redraw, recolour,
 * rotate or glow a real logo (brand rules beat style).
 */
const W = (i: number) => wordAt("endcard", i);

export const SFX_CUES: Cue[] = [
  { frame: W(19) - 10, sfx: "sting", volume: 0.6 },
  { frame: W(19) + 6, sfx: "flash", volume: 0.35 },
];

const MARK = "M60 10 L110 60 L60 110 L10 60 Z"; // demo mark (diamond), 120 viewBox
const MARK_LEN = 4 * Math.hypot(50, 50);

export const EndCardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { u, portrait, fps } = useLayout();
  const dur = scene("endcard").durationInFrames;

  const draw = lerp(frame, [W(19) - 24, W(19) + 6], [0, 1], EASE_IN_OUT);
  const fill = lerp(frame, [W(19) + 2, W(19) + 16], [0, 1]);
  const ring = lerp(frame, [W(19), W(19) + 50], [0, 1], EASE_OUT);
  const letters = "Lumen".split("");
  const tagline: KineticWord[] = [20, 21, 22, 23].map((i, k) => ({
    t: ["Built", "for", "right", "now."][k],
    delay: k === 0 ? 0 : W(i) - W(i - 1),
    c: k >= 2 ? C.rose : undefined,
    glow: k >= 2,
  }));
  const settle = lerp(frame, [0, dur], [1.04, 1], (t) => t);
  const fadeOut = interpolate(frame, [dur - 24, dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const markSize = (portrait ? 220 : 190) * u;
  const wordSize = (portrait ? 170 : 160) * u;

  return (
    <AbsoluteFill style={{ backgroundColor: C.night, opacity: fadeOut }}>
      <NightAurora variant="halo" seed="end" />
      <Sparkles seed="end" count={18} sizes={[10 * u, 26 * u]} colors={[C.text, C.violetSoft]} style={{ opacity: lerp(frame, [W(19), W(19) + 30], [0, 0.8]) }} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 48 * u,
          scale: String(settle),
        }}
      >
        <div style={{ position: "relative", width: markSize, height: markSize }}>
          {/* pulse ring */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: markSize,
              height: markSize,
              translate: "-50% -50%",
              borderRadius: "50%",
              border: `${3 * u}px solid rgba(255,255,255,0.6)`,
              scale: String(interpolate(ring, [0, 1], [0.6, 2.4])),
              opacity: ring > 0 ? 1 - ring : 0,
            }}
          />
          <svg viewBox="0 0 120 120" width={markSize} height={markSize}>
            <path d={MARK} fill={C.text} fillOpacity={fill} />
            <path
              d={MARK}
              fill="none"
              stroke={C.text}
              strokeWidth={4}
              strokeLinejoin="round"
              strokeDasharray={MARK_LEN}
              strokeDashoffset={MARK_LEN * (1 - draw)}
            />
          </svg>
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: fontInter,
            fontWeight: 800,
            fontSize: wordSize,
            letterSpacing: -0.045 * wordSize,
            color: C.text,
            lineHeight: 1,
            overflow: "hidden",
            paddingBottom: 0.08 * wordSize,
          }}
        >
          {letters.map((l, i) => {
            const p = springIn(frame, fps, W(19) + i * 3, SPRING_SOFT);
            return (
              <span key={i} style={{ display: "inline-block", translate: `0px ${(1 - p) * wordSize}px`, opacity: Math.min(1, p * 2) }}>
                {l}
              </span>
            );
          })}
        </div>
        <KineticText words={tagline} startFrame={W(20) - 3} stagger={0} size={(portrait ? 76 : 68) * u} weight={700} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
