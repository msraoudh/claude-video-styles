import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { fontInter } from "../../kit/fonts";
import { bassShake, beatPulse, rand, useGlobalFrame } from "../../lib/beat";
import { L } from "../../lib/look";
import { FACE_KEY, IsolatedFace } from "./Face";
import { GlassTitle, TITLE_CENTER } from "./GlassTitle";
import { AnamorphicFlare, EASE_OUT, FlashFrame, GlitchBands, hitEnv, iv, Shockwave } from "./fx";
import { LINES, T } from "./timing";

/**
 * TITLE 3107–3237.
 *  3099–3182  glass-shard title « NO MORE EXCUSES » (3D): panes fly in through the fog during the black, LOCK on
 *             the biggest 808 (3107) where the headline ignites inside the glass; anamorphic flare + shockwave +
 *             lens chroma + 808 camera shake; hold with a slow push and a light sweep (second ring on 3156);
 *             3172 the panes blast toward the lens.
 *  3182–3237  line F « Je me lance enfin. » lip-synced, « JE ME / LANCE. » in acid on the spoken words,
 *             punch-in on the 3219 beat, freeze frame at the end of the line (3231) into the 3237 BIG HIT.
 */
const at = (gf: number) => gf - T.start;
const F = LINES.F;

const TitleShot: React.FC = () => {
  const g = useGlobalFrame();
  const hit = g - T.drop;
  // shake in world units at the pane (≈ 540 px per unit): violent on the 808, then follows the sub
  const sh = bassShake(g, hit >= 0 ? 6 : 0);
  const k = hit >= 0 ? Math.exp(-hit / 9) : 0;
  const sx = (sh.x / 540) * 0.6 + (rand(g * 2.3) - 0.5) * 0.06 * k;
  const sy = (sh.y / 540) * 0.6 + (rand(g * 4.1 + 3) - 0.5) * 0.06 * k;
  const pulse = g - T.pulse;
  return (
    <AbsoluteFill>
      <GlassTitle g={g} shakeX={sx} shakeY={sy} />
      {/* impact light (screen blend, local to the title) */}
      <Shockwave age={hit} x={TITLE_CENTER.x} y={TITLE_CENTER.y} dur={18} strength={0.75} maxR={1400} />
      <AnamorphicFlare age={hit} x={TITLE_CENTER.x} y={TITLE_CENTER.y - 10} dur={48} strength={1} size={200} />
      <AnamorphicFlare age={pulse} x={TITLE_CENTER.x + 120} y={TITLE_CENTER.y + 150} dur={28} strength={0.45} size={110} />
    </AbsoluteFill>
  );
};

/* ───────────── F ───────────── */
const FShot: React.FC = () => {
  const g = useGlobalFrame();
  const lead = T.fCut - F.from; // the cut is 1 frame into the line
  const speed = (lf: number) => Math.min(F.srcIn + (lf + lead) / 60, F.srcOut);
  const frozen = g >= T.fFreeze;
  const punch = g >= T.fPunch ? iv(g - T.fPunch, [0, 6], [1.2, 1.15], EASE_OUT) : iv(g, [T.fCut, T.fPunch], [1.06, 1.0], EASE_OUT);
  const freezeZoom = frozen ? iv(g, [T.fFreeze, T.hit2], [1, 1.06]) : 1;
  const sh = bassShake(g, frozen ? 0 : 9);
  const bp = beatPulse(g, 10);
  return (
    <AbsoluteFill>
      <IsolatedFace
        speed={speed}
        scale={(punch + 0.025 * bp) * freezeZoom}
        tx={sh.x}
        ty={sh.y + (g >= T.fPunch ? 120 : 0)}
        rot={sh.r}
        origin="50% 22%"
        grade={frozen ? "mono" : "cold"}
        bg={frozen ? "brightness(0.35)" : "brightness(0.42) saturate(0.55) hue-rotate(8deg)"}
        fg={frozen ? "brightness(1.05)" : "brightness(1.12) contrast(1.06)"}
        mask={FACE_KEY(0.6)}
        rim={frozen ? 0.2 : 0.55}
      />
      <FWords />
      {/* freeze-frame shutter blink */}
      <FlashFrame a={hitEnv(g - T.fFreeze, [0, 1, 3], [0.7, 0.3, 0])} />
      {/* suck to black right before the BIG HIT */}
      <AbsoluteFill style={{ background: "#000", opacity: iv(g, [T.hit2 - 5, T.hit2 - 1], [0, 0.85]) }} />
    </AbsoluteFill>
  );
};

const FWord: React.FC<{ text: string; f0: number; x: number; y: number; size: number; align?: "left" | "right" | "center" }> = ({ text, f0, x, y, size, align = "center" }) => {
  const g = useGlobalFrame();
  if (g < f0) return null;
  const a = g - f0;
  const s = iv(a, [0, 5], [1.25, 1], EASE_OUT) * (g >= T.fPunch ? iv(g - T.fPunch, [0, 6], [1.08, 1], EASE_OUT) : 1);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(${align === "center" ? "-50%" : align === "right" ? "-100%" : "0"}, 0) scale(${s})`,
        transformOrigin: "50% 50%",
        fontFamily: fontInter,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.045em",
        color: L.acid,
        whiteSpace: "nowrap",
        textShadow: "0 0 36px rgba(182,255,59,0.35), 0 6px 30px rgba(0,0,0,0.6)",
        opacity: 1,
      }}
    >
      {text}
    </div>
  );
};

const FWords: React.FC = () => {
  const g = useGlobalFrame();
  const j = Math.max(iv(g - T.fCut, [0, 1, 3], [0, 1, 0]), iv(g - T.fMe, [0, 1, 3], [0, 1, 0]), iv(g - T.fLance, [0, 1, 4], [0, 1, 0]), iv(g - T.fPunch, [0, 1, 4], [0, 1, 0]));
  return (
    <GlitchBands amount={j * 0.5} seed={Math.floor(g / 2) + 50} maxShift={40}>
      <FWord text="JE" f0={T.fCut} x={540 - 30} y={1080} size={215} align="right" />
      <FWord text="ME" f0={T.fMe} x={540 + 30} y={1080} size={215} align="left" />
      <FWord text="LANCE." f0={T.fLance} x={540} y={1300} size={215} />
    </GlitchBands>
  );
};

export const Title: React.FC = () => (
  <AbsoluteFill>
    <Sequence from={at(T.black)} durationInFrames={T.fCut - T.black} name="NO MORE EXCUSES (3D glass)" premountFor={30}>
      <TitleShot />
    </Sequence>
    <Sequence from={at(T.fCut)} durationInFrames={T.hit2 - T.fCut} name="F « je me lance »" premountFor={20}>
      <FShot />
    </Sequence>
  </AbsoluteFill>
);
