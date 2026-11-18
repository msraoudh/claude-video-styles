import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { CUES, PAGES, SHOTS } from "./cues";
import { Captions } from "./parts/Captions";
import { tfxAt, type TFX } from "./parts/Camera";
import { Cutout, Footage, useCam } from "./parts/Footage";
import { Sound } from "./parts/Sound";
import { DURATION } from "./lib/time";
import { SILVER } from "./fx/fx";
import { BIG_FONT, C, HAND_FONT } from "./theme";

/** frames where something sits behind the head: the cutout is drawn only there (his real background stays) */
const BEHIND = CUES.filter((c) => c.layer === "behind").map((c) => [c.from, c.from + c.dur]);

const Layer: React.FC<{ layer: "behind" | "front" | "page" }> = ({ layer }) => (
  <>
    {CUES.filter((c) => c.layer === layer).map((c, i) => (
      <Sequence key={i} from={c.from} durationInFrames={c.dur} layout="absolute-fill">
        {c.el(c.dur)}
      </Sequence>
    ))}
  </>
);

/** transition blur: an SVG gaussian so whips get a DIRECTIONAL (x-only / y-only) motion blur */
const TFX_ID = "reel-tfx-blur";
const TfxDefs: React.FC<{ fx: TFX }> = ({ fx }) => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <filter id={TFX_ID} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
      <feGaussianBlur stdDeviation={`${fx.bx.toFixed(2)} ${fx.by.toFixed(2)}`} edgeMode="duplicate" />
    </filter>
  </svg>
);

/** whole-frame transition move (whip / zoom / spin / shake). The wrapper is always mounted (no video remounts); idle = no style. */
const TLayer: React.FC<{ fx: TFX; children: React.ReactNode }> = ({ fx, children }) => {
  const moving = fx.x !== 0 || fx.y !== 0 || fx.scale !== 1 || fx.rotate !== 0;
  const blur = fx.bx > 0.3 || fx.by > 0.3;
  return (
    <AbsoluteFill style={{ filter: blur ? `url(#${TFX_ID})` : undefined }}>
      <AbsoluteFill style={{ transform: moving ? `translate(${fx.x.toFixed(2)}px, ${fx.y.toFixed(2)}px) scale(${fx.scale.toFixed(4)}) rotate(${fx.rotate.toFixed(3)}deg)` : undefined }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** quick light hit on a cut (white, or the brand red) */
const LightFlash: React.FC<{ fx: TFX }> = ({ fx }) =>
  fx.flash <= 0 ? null : (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity: fx.flash,
        mixBlendMode: "screen",
        background: fx.flashRed
          ? "radial-gradient(ellipse at 50% 38%, rgba(255,120,120,1) 0%, rgba(227,10,23,.95) 40%, rgba(122,12,23,.8) 100%)"
          : "radial-gradient(ellipse at 50% 38%, rgba(255,255,255,1) 0%, rgba(255,250,245,.9) 50%, rgba(255,235,230,.7) 100%)",
      }}
    />
  );

const EndCard: React.FC = () => {
  const fr = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #2A060B 0%, #0B0B0B 70%)", alignItems: "center", justifyContent: "center", opacity: Math.min(1, fr / 8) }}>
      <div style={{ fontFamily: BIG_FONT, fontSize: 150, transform: "scaleY(1.15)", backgroundImage: SILVER, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>CRÉATIF</div>
      <div style={{ fontFamily: HAND_FONT, fontWeight: 900, fontStyle: "italic", fontSize: 72, marginTop: 6, backgroundImage: SILVER, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>& intelligent</div>
    </AbsoluteFill>
  );
};

/** part: "all" = the whole edit; in the card layout the card shows "base" (clipped) and "overlay"
 *  (front effects + captions) is drawn again unclipped on top, so effects can break out of the card.
 *  Camera (v5): the footage + cutout share one moving camera (parts/Camera.ts); transitions move the whole
 *  picture (footage, graphics, pages) but never the captions. */
export const Reel: React.FC<{ sound: boolean; captions: boolean; part?: "all" | "base" | "overlay" }> = ({ sound, captions, part = "all" }) => {
  const fr = useCurrentFrame();
  const cam = useCam(SHOTS);
  const fx = tfxAt(fr);
  const behind = BEHIND.some(([a, b]) => fr >= a && fr < b);
  const base = part !== "overlay";
  const over = part !== "base";
  return (
    <AbsoluteFill style={{ background: base ? C.black : undefined }}>
      <TfxDefs fx={fx} />
      {base ? (
        <TLayer fx={fx}>
          <Footage cam={cam} />
          <Layer layer="behind" />
          {behind ? <Cutout cam={cam} /> : null}
        </TLayer>
      ) : null}
      {over ? (
        <TLayer fx={fx}>
          <Layer layer="front" />
        </TLayer>
      ) : null}
      {over && captions ? <Captions hidden={PAGES} /> : null}
      {base ? (
        <>
          <TLayer fx={fx}>
            <Layer layer="page" />
          </TLayer>
          <LightFlash fx={fx} />
          <Sequence from={DURATION - 60} durationInFrames={60} layout="absolute-fill"><EndCard /></Sequence>
          {sound ? <Sound total={DURATION} /> : null}
        </>
      ) : null}
    </AbsoluteFill>
  );
};
