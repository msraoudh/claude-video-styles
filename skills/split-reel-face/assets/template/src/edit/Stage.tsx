import type React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { EASE, Title } from "./kit";
import { layoutAt } from "./layout";
import { PROJECT } from "../data/project";
import { K, L, MONO } from "./theme";
import { f, stepAt, STEP_AT } from "./time";

/** Step titles (src/data/project.ts): text + Latin keyword in coral serif, under the progress bar in split mode. */
const TITLES = PROJECT.titles;
const N = PROJECT.stepCount;

/** The warm-dark world behind everything (seen below the face in split, and full frame in gfx). */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 55%, ${K.bg2} 0%, ${K.bg1} 45%, ${K.bg0} 100%)` }}>
      {/* two slow coral light plates */}
      <div style={{ position: "absolute", left: 140 + Math.sin(t * 0.4) * 80, top: 1050 + Math.cos(t * 0.33) * 60, width: 820, height: 620, borderRadius: "50%", background: K.coralGlow, filter: "blur(160px)", opacity: 0.35 }} />
      <div style={{ position: "absolute", left: 620 + Math.cos(t * 0.27) * 90, top: 1450 + Math.sin(t * 0.3) * 70, width: 520, height: 420, borderRadius: "50%", background: "rgba(240,164,135,0.35)", filter: "blur(150px)", opacity: 0.25 }} />
      {/* fine dot grid */}
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(255,236,220,0.07) 1.2px, transparent 1.3px)", backgroundSize: "36px 36px", opacity: 0.6, maskImage: "linear-gradient(180deg, transparent 38%, black 60%, black 85%, transparent)" }} />
      {/* film grain (SVG noise, new seed every 2 frames) — heavy for the live Studio preview, exact in the render */}
      <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id={`bg-grain-${Math.floor(frame / 2)}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={Math.floor(random(Math.floor(frame / 2)) * 1000)} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#bg-grain-${Math.floor(frame / 2)})`} />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Progress bar (5 steps + bonus) and the step title, under the seam. */
export const StageHeader: React.FC = () => {
  const frame = useCurrentFrame();
  const { stage } = layoutAt(frame);
  const step = stepAt(frame);
  if (stage <= 0.01 || step === 0) return null;
  const changeAt = f(STEP_AT.find(([, n]) => n === step)![0]);
  const tIn = EASE((frame - changeAt) / 9);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: stage, transform: `translateY(${(1 - stage) * 40}px)` }}>
      {/* seam: soft shadow + a coral hairline */}
      <div style={{ position: "absolute", left: 0, right: 0, top: L.seam - 2, height: 2, background: `linear-gradient(90deg, transparent, ${K.coral}, transparent)`, opacity: 0.55 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: L.seam, height: 60, background: "linear-gradient(180deg, rgba(0,0,0,0.45), transparent)" }} />
      {/* segmented progress (RTL reading order: step 1 on the right) */}
      <div dir="rtl" style={{ position: "absolute", left: L.side, right: L.side, top: L.progressY, display: "flex", gap: 10 }}>
        {Array.from({ length: N }, (_, i) => i + 1).map((n) => {
          const done = step > n || step === N + 1;
          const cur = step === n;
          const fill = done ? 1 : cur ? interpolate(frame, [changeAt, changeAt + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
          return (
            <div key={n} style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,236,220,0.12)", overflow: "hidden" }}>
              <div style={{ width: `${fill * 100}%`, height: "100%", marginInlineStart: 0, background: cur ? K.coral : "rgba(217,119,87,0.6)", boxShadow: cur ? `0 0 12px ${K.coralGlow}` : undefined }} />
            </div>
          );
        })}
      </div>
      {/* step label + title */}
      <div style={{ position: "absolute", right: L.side, top: L.progressY + 22, fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: "0.16em", color: K.coral, opacity: tIn }}>
        {step === N + 1 ? PROJECT.bonusLabel : `ÉTAPE ${step}/${N}`}
      </div>
      <div style={{ position: "absolute", left: L.side, right: L.side, top: L.titleY + 10, opacity: tIn, transform: `translateY(${(1 - tIn) * 12}px)`, filter: tIn < 1 ? `blur(${(1 - tIn) * 6}px)` : undefined }}>
        <Title parts={TITLES[step]} size={52} />
      </div>
    </AbsoluteFill>
  );
};
