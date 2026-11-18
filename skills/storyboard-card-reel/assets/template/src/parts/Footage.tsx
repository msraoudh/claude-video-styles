import React from "react";
import { AbsoluteFill, getStaticFiles, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { camAt, ORIGIN, type Cam, type Shot } from "./Camera";

export const FACE_FILE = "footage/talk-clean-v2-4k.mp4"; // NATURAL, as shot (the user: no filter). 4K: talk-clean-v2-4k.mp4 for the final render
export const CUTOUT_FILE = "footage/cutout-v2.webm";

/** framing per frame: the camera engine lives in Camera.ts (moves, punch-ins, jump-cut reframes, handheld). */
export type { Cam, Shot } from "./Camera";
export { ORIGIN } from "./Camera";

/** camera for the current frame: { scale, x, y, rotate, blur } */
export const useCam = (shots: Shot[]): Cam => camAt(shots, useCurrentFrame());

const camOf = (cam?: Cam, scale?: number): Cam => cam ?? { scale: scale ?? 1, x: 0, y: 0, rotate: 0, blur: 0 };
/** the same transform for the footage and its cutout, so the matte never slips. Blur = motion blur only, no colour filter. */
export const camStyle = (c: Cam): React.CSSProperties => ({
  transform: `translate(${c.x.toFixed(2)}px, ${c.y.toFixed(2)}px) scale(${c.scale.toFixed(4)}) rotate(${c.rotate.toFixed(3)}deg)`,
  transformOrigin: ORIGIN,
  filter: c.blur > 0 ? `blur(${c.blur.toFixed(2)}px)` : undefined,
});

export const Footage: React.FC<{ cam?: Cam; scale?: number; grade?: boolean }> = ({ cam, scale }) => (
  <AbsoluteFill style={camStyle(camOf(cam, scale))}>
    <OffthreadVideo src={staticFile(FACE_FILE)} muted style={{ width: "100%", height: "100%", filter: undefined }} />
  </AbsoluteFill>
);

export const hasCutout = () => getStaticFiles().some((x) => x.name === CUTOUT_FILE);
export const Cutout: React.FC<{ cam?: Cam; scale?: number }> = ({ cam, scale }) => !hasCutout() ? null : (
  <AbsoluteFill style={camStyle(camOf(cam, scale))}>
    <OffthreadVideo src={staticFile(CUTOUT_FILE)} muted transparent style={{ width: "100%", height: "100%" }} />
  </AbsoluteFill>
);

/** subtle cinematic grade on top: vignette + a breath of red in the shadows */
export const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 35%, rgba(0,0,0,0) 45%, rgba(0,0,0,.55) 100%)" }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(122,12,23,0) 50%, rgba(122,12,23,.30) 100%)", mixBlendMode: "multiply" }} />
  </AbsoluteFill>
);

/** the wall behind the user becomes a dark black→red studio (ref2/ref3 look, his brand); the cutout keeps him on top */
export const Backdrop: React.FC = () => {
  const fr = useCurrentFrame();
  const pulse = 0.5 + 0.5 * Math.sin(fr / 45);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "#0B0809", opacity: 0.86 }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 45% at 50% 30%, rgba(227,10,23,${0.30 + 0.08 * pulse}) 0%, rgba(122,12,23,.18) 45%, rgba(0,0,0,0) 75%)` }} />
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1.5px, transparent 1.5px)", backgroundSize: "30px 30px", maskImage: "linear-gradient(180deg, #000 0%, transparent 70%)", WebkitMaskImage: "linear-gradient(180deg, #000 0%, transparent 70%)" }} />
      {/* two thin vertical light strips like the refs' studios */}
      {[150, 930].map((x, i) => (
        <div key={i} style={{ position: "absolute", left: x, top: 0, width: 6, height: 820, background: "linear-gradient(180deg, rgba(255,90,100,.0), rgba(255,60,70,.55) 40%, rgba(255,60,70,0))", filter: "blur(2px)", opacity: 0.7 }} />
      ))}
    </AbsoluteFill>
  );
};
