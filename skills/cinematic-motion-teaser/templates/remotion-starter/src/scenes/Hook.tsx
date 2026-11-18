import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { scene, wordAt } from "../data/timeline";
import {
  Bokeh,
  C,
  fontInter,
  glassStyle,
  Icon,
  type IconName,
  KineticText,
  type KineticWord,
  NightAurora,
  NumberRoll,
} from "../kit";
import { useLayout } from "../lib/layout";
import { drift, EASE_IN, EASE_OUT, lerp, springIn, SPRING_POP } from "../lib/motion";
import type { Cue } from ".";

/**
 * HOOK (demo) — "Your days are full of tabs. Lumen gets you out of them."
 * Beats (all on the spoken words, from timeline.ts):
 *  - each word blurs in on its own spoken frame; glass "tab" cards pop in around it, a live
 *    counter rolls 0 → 37 ("bold claim + motion in the first 1.5 s")
 *  - on "Lumen": the line blurs out, every card flies outward with blur (whoosh), the product name
 *    lands huge with a punch-in (flash), then "gets you out of them." rises word by word
 *  - continuous slow push-in 1 → 1.06, foreground bokeh at a different speed (depth)
 */
const W = (i: number) => wordAt("hook", i);

const TABS: Array<{ label: string; icon: IconName; x: number; y: number; r: number }> = [
  { label: "Inbox · 48", icon: "bell", x: -250, y: -200, r: -6 },
  { label: "Standup notes", icon: "file-text", x: 190, y: -250, r: 5 },
  { label: "Team chat", icon: "chat-circle", x: -300, y: 20, r: 4 },
  { label: "Calendar", icon: "clock", x: 260, y: -20, r: -4 },
  { label: "Q3 deck v7", icon: "laptop", x: -170, y: 230, r: 7 },
  { label: "Tasks", icon: "check-circle", x: 220, y: 215, r: -7 },
  { label: "Docs", icon: "cards", x: 10, y: -40, r: 2 },
];

export const SFX_CUES: Cue[] = [
  ...TABS.map((_, i) => ({ frame: W(0) + i * 9, sfx: "pop", volume: 0.28 })),
  { frame: W(6) - 14, sfx: "whoosh", volume: 0.45 },
  { frame: W(6) - 1, sfx: "flash", volume: 0.5 },
];

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { u, portrait, width, height, fps } = useLayout();
  const dur = scene("hook").durationInFrames;

  // camera: slow push + a punch-in on the product name
  const push = lerp(frame, [0, dur], [1, 1.06], (t) => t);
  const punch = interpolate(frame, [W(6) - 2, W(6) + 5, W(6) + 40], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const fly = lerp(frame, [W(6) - 12, W(6) + 14], [0, 1], EASE_IN);

  const line1: KineticWord[] = [0, 1, 2, 3, 4, 5].map((i) => ({
    t: ["Your", "days", "are", "full", "of", "tabs."][i],
    delay: i === 0 ? 0 : W(i) - W(i - 1),
    c: i === 5 ? C.rose : undefined,
    glow: i === 5,
    br: portrait && i === 2,
  }));
  const line2: KineticWord[] = [7, 8, 9, 10, 11].map((i, k) => ({
    t: ["gets", "you", "out", "of", "them."][k],
    delay: k === 0 ? 0 : W(i) - W(i - 1),
  }));

  const clusterX = portrait ? width / 2 : width * 0.74;
  const clusterY = portrait ? height * 0.58 : height * 0.52;
  const nameIn = springIn(frame, fps, W(6) - 3, SPRING_POP);

  return (
    <AbsoluteFill style={{ backgroundColor: C.night, overflow: "hidden" }}>
      <NightAurora variant="dusk" seed="hook" />
      <AbsoluteFill style={{ scale: String(push + punch * 0.05) }}>
        {/* glass tab cards: pop in, drift forever, then fly outward on the reveal */}
        {TABS.map((t, i) => {
          const p = springIn(frame, fps, W(0) + i * 9, SPRING_POP);
          const d = drift(frame, fps, `tab-${i}`, 7, 4 + (i % 3));
          const dirX = t.x / Math.hypot(t.x, t.y || 1);
          const dirY = t.y / Math.hypot(t.x || 1, t.y);
          const out = fly * Math.max(width, height) * 0.9;
          return (
            <div
              key={t.label}
              style={{
                position: "absolute",
                left: clusterX + (t.x * (portrait ? 1 : 1.15) + d.x) * u + dirX * out,
                top: clusterY + (t.y + d.y) * u + dirY * out,
                translate: "-50% -50%",
                rotate: `${t.r + d.r + fly * t.r * 2}deg`,
                scale: String(interpolate(p, [0, 1], [0.6, 1]) * (1 + fly * 0.25)),
                opacity: Math.min(1, p * 1.6) * (1 - fly),
                filter: `blur(${(1 - Math.min(1, p)) * 12 * u + fly * 18 * u}px)`,
                ...glassStyle({ material: "chrome", radius: 26 * u }),
                display: "flex",
                alignItems: "center",
                gap: 16 * u,
                padding: `${20 * u}px ${30 * u}px`,
                fontFamily: fontInter,
                fontWeight: 600,
                fontSize: 34 * u,
                color: C.text,
                whiteSpace: "nowrap",
              }}
            >
              <Icon name={t.icon} size={36 * u} color={C.text2} />
              {t.label}
            </div>
          );
        })}

        {/* live counter: rolls while the line is spoken */}
        <div
          style={{
            position: "absolute",
            left: clusterX,
            top: clusterY + (portrait ? 400 : 360) * u,
            translate: "-50% 0",
            opacity: lerp(frame, [W(3) - 6, W(3) + 6], [0, 1]) * (1 - fly),
            display: "flex",
            alignItems: "baseline",
            gap: 14 * u,
            fontFamily: fontInter,
            fontWeight: 700,
            fontSize: 40 * u,
            color: C.text2,
          }}
        >
          <NumberRoll
            value={lerp(frame, [W(3), W(5) + 10], [0, 37])}
            size={64 * u}
            color={C.rose}
            weight={800}
            family="inter"
          />
          open tabs
        </div>

        {/* line 1 */}
        <div
          style={{
            position: "absolute",
            left: portrait ? 90 * u : 120 * u,
            right: portrait ? 90 * u : width * 0.52,
            top: portrait ? height * 0.13 : height * 0.3,
            display: "flex",
            justifyContent: portrait ? "center" : "flex-start",
          }}
        >
          <KineticText
            words={line1}
            startFrame={W(0) - 3}
            stagger={0}
            size={(portrait ? 120 : 112) * u}
            align={portrait ? "center" : "left"}
            exitFrame={W(6) - 12}
          />
        </div>

        {/* the reveal */}
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 30 * u, flexDirection: "column" }}>
          <div
            style={{
              fontFamily: fontInter,
              fontWeight: 800,
              fontSize: (portrait ? 230 : 250) * u,
              letterSpacing: -0.045 * (portrait ? 230 : 250) * u,
              color: C.text,
              opacity: Math.min(1, nameIn * 1.4),
              scale: String(interpolate(nameIn, [0, 1], [1.25, 1])),
              filter: `blur(${(1 - Math.min(1, nameIn)) * 20 * u}px)`,
              textShadow: `0 0 ${80 * u}px rgba(255,61,95,${0.35 * nameIn})`,
            }}
          >
            Lumen
          </div>
          <KineticText words={line2} startFrame={W(7) - 3} stagger={0} size={(portrait ? 84 : 76) * u} weight={600} color={C.text2} />
        </AbsoluteFill>
      </AbsoluteFill>
      {/* foreground depth plane */}
      <Bokeh seed="hook-fg" count={9} blurRange={[10 * u, 26 * u]} sizeRange={[30 * u, 110 * u]} drift={30 * u} opacity={0.5} />
    </AbsoluteFill>
  );
};
