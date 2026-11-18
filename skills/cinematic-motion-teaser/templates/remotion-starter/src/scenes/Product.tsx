import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { scene, wordAt } from "../data/timeline";
import {
  Bokeh,
  Burst,
  C,
  CheckMark,
  fontInter,
  Glow,
  glassStyle,
  Icon,
  NumberRoll,
  OnyxBg,
  Phone,
  PillButton,
  TapRipple,
} from "../kit";
import { useLayout } from "../lib/layout";
import { drift, EASE_IN_OUT, EASE_OUT, lerp, springIn, SPRING_POP } from "../lib/motion";
import type { Cue } from ".";

/**
 * PRODUCT (demo) — "Plan it in seconds, and it's done."  (captions carry the line)
 * LIVE UI SIMULATION: the real app screen rebuilt in React inside a 3D phone, used as if a finger
 * were on it: tap ripple + button press on "Plan", rows check off one by one on "seconds,",
 * a green "All set" chip bursts in on "done." Floating glass chips orbit the phone (depth).
 * The phone keeps turning (tilt -22° → -8°) and pushing in: never static.
 */
const W = (i: number) => wordAt("product", i);
const ROWS = ["Book the 7 pm table", "Move standup to 10:30", "Send deck to Sara", "Gym after work"];
const TAP = { x: 195, y: 742 }; // the button, in app points (390 x 844)

export const SFX_CUES: Cue[] = [
  { frame: W(12) - 3, sfx: "tap", volume: 0.6 },
  ...ROWS.map((_, i) => ({ frame: W(15) - 8 + i * 7, sfx: "tick", volume: 0.4 })),
  { frame: W(18) - 2, sfx: "success", volume: 0.55 },
];

export const ProductScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { u, portrait, width, height, fps } = useLayout();
  const dur = scene("product").durationInFrames;

  const phoneH = (portrait ? 0.52 : 0.7) * height;
  const cx = portrait ? width / 2 : width * 0.36;
  const cy = portrait ? height * 0.36 : height * 0.43;
  const tiltY = lerp(frame, [0, dur], [-22, -8], EASE_IN_OUT);
  const push = lerp(frame, [0, dur], [0.96, 1.04], (t) => t);
  const enter = springIn(frame, fps, 0);

  const tap = interpolate(frame, [W(12) - 6, W(12) + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const press = Math.sin(Math.PI * Math.min(1, Math.max(0, tap / 0.5)));
  const checks = ROWS.map((_, i) => lerp(frame, [W(15) - 8 + i * 7, W(15) + 10 + i * 7], [0, 1]));
  const done = springIn(frame, fps, W(18) - 3, SPRING_POP);
  const timerChip = springIn(frame, fps, W(13) - 4);

  const chip = (k: string, x: number, y: number, p: number, children: React.ReactNode) => {
    const d = drift(frame, fps, k, 8, 4.5);
    return (
      <div
        style={{
          position: "absolute",
          left: x + d.x * u,
          top: y + d.y * u,
          translate: "-50% -50%",
          rotate: `${d.r}deg`,
          opacity: Math.min(1, p * 1.5),
          scale: String(interpolate(p, [0, 1], [0.7, 1])),
          filter: `blur(${(1 - Math.min(1, p)) * 10 * u}px)`,
          ...glassStyle({ material: "chrome", radius: 999 }),
          display: "flex",
          alignItems: "center",
          gap: 14 * u,
          padding: `${18 * u}px ${30 * u}px`,
          fontFamily: fontInter,
          fontWeight: 700,
          fontSize: 36 * u,
          color: C.text,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <OnyxBg glow="hero" grain={0.06} />
      <Glow custom={{ x: portrait ? 50 : 36, y: 40, rx: 55, ry: 45, opacity: 0.22 * enter }} />
      <Bokeh seed="product-bg" count={10} blurRange={[6 * u, 14 * u]} sizeRange={[20 * u, 70 * u]} opacity={0.35} />

      <div
        style={{
          position: "absolute",
          left: cx,
          top: cy,
          translate: "-50% -50%",
          scale: String(push * interpolate(enter, [0, 1], [0.9, 1])),
          opacity: Math.min(1, enter * 1.5),
        }}
      >
        <Phone height={phoneH} tilt={{ y: tiltY, x: 4 }} glare>
          <div style={{ position: "absolute", inset: 0, fontFamily: fontInter, color: C.text }}>
            <div style={{ position: "absolute", left: 24, top: 74, fontSize: 34, fontWeight: 800, letterSpacing: -1 }}>
              Tonight
            </div>
            <div style={{ position: "absolute", left: 24, top: 118, fontSize: 15, color: C.text2 }}>
              4 things · before 21:00
            </div>
            {ROWS.map((r, i) => (
              <div
                key={r}
                style={{
                  position: "absolute",
                  left: 16,
                  right: 16,
                  top: 168 + i * 76,
                  height: 64,
                  borderRadius: 20,
                  background: C.surface2,
                  border: `1px solid ${C.line}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "0 16px",
                  fontSize: 16,
                  fontWeight: 600,
                  opacity: lerp(frame, [6 + i * 5, 20 + i * 5], [0, 1]),
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    border: `2px solid ${checks[i] > 0.05 ? C.green : C.lineStrong}`,
                    background: checks[i] > 0.05 ? C.greenTint : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckMark progress={checks[i]} size={18} color={C.green} />
                </div>
                <span style={{ color: checks[i] > 0.5 ? C.text2 : C.text }}>{r}</span>
              </div>
            ))}
            <div style={{ position: "absolute", left: 24, right: 24, top: TAP.y - 28 }}>
              <PillButton variant="white" press={press}>
                Plan it
              </PillButton>
            </div>
            <TapRipple x={TAP.x} y={TAP.y} progress={tap} />
          </div>
        </Phone>
      </div>

      {/* floating glass chips (depth plane in front of the phone) */}
      {chip(
        "timer",
        cx + (portrait ? 300 : 520) * u,
        cy - (portrait ? 330 : 200) * u,
        timerChip,
        <>
          <Icon name="timer" size={38 * u} color={C.rose} />
          <NumberRoll value={lerp(frame, [W(13), W(15) + 6], [0, 3])} size={40 * u} color={C.text} weight={800} family="inter" />
          <span style={{ color: C.text2 }}>sec</span>
        </>,
      )}
      {chip(
        "done",
        cx - (portrait ? 270 : 470) * u,
        cy + (portrait ? 330 : 190) * u,
        done,
        <>
          <Icon name="check-circle" size={40 * u} color={C.green} />
          All set
        </>,
      )}
      <div
        style={{
          position: "absolute",
          left: cx - (portrait ? 270 : 470) * u,
          top: cy + (portrait ? 330 : 190) * u,
          width: 0,
          height: 0,
        }}
      >
        <Burst progress={lerp(frame, [W(18) - 3, W(18) + 30], [0, 1], EASE_OUT)} radius={150 * u} from={40 * u} big={12 * u} small={8 * u} colors={[C.green, C.text, C.green]} x={0} y={0} />
      </div>
    </AbsoluteFill>
  );
};
