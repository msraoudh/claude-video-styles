import { Video } from "@remotion/media";
import type React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Footage } from "../components/Footage";
import { sec } from "../lib/motion";
import { CinematicGrade } from "./Grade";
import { CinematicLight } from "./Light";
import { CinematicTexture } from "./Texture";

export { CinematicGrade } from "./Grade";
export { AnamorphicFlare, CinematicLight, LeakAt } from "./Light";
export { CinematicTexture, Grain, Letterbox, Mist } from "./Texture";
export { CINE_MOVES, cineMoveAt, coverScale } from "./zooms";
export { lookAt, LOOK_KEYS } from "./looks";
export { CUE } from "./cues";

export type CinematicLayerProps = {
  /** Global strength of grade + light + texture (0 = off, 1 = designed). */
  amount?: number;
  grade?: boolean;
  light?: boolean;
  /** one-shot flares / bursts / flickers on the story beats */
  cues?: boolean;
  /** WebGL light leaks (@remotion/effects) */
  leaks?: boolean;
  mist?: boolean;
  grain?: boolean;
  letterbox?: boolean;
};

/**
 * The whole cinematic pass in one layer.
 * Place it ABOVE <Footage> and BELOW the motion graphics / captions.
 * It must be a plain sibling (no wrapper with opacity/transform/filter), so its blend modes reach the footage.
 */
export const CinematicLayer: React.FC<CinematicLayerProps> = ({
  amount = 1,
  grade = true,
  light = true,
  cues = true,
  leaks = true,
  mist = true,
  grain = true,
  letterbox = true,
}) => {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {grade ? <CinematicGrade amount={amount} /> : null}
      {light ? <CinematicLight amount={amount} cues={cues} leaks={leaks} /> : null}
      <CinematicTexture amount={amount} mist={mist} grain={grain} letterbox={letterbox} />
    </AbsoluteFill>
  );
};

/** Approximation of Footage's base CSS grade + lens vignette, so the lab looks like the Reel plate. */
const BASE_GRADE = "saturate(1.14) contrast(1.07) brightness(1.02) sepia(0.06)";
const BASE_VIGNETTE =
  "radial-gradient(ellipse 85% 70% at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%), linear-gradient(180deg, rgba(255,140,80,0.06) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.28) 100%)";

export type CinematicLabProps = {
  /**
   * File in public/. Use the same cut as <Footage> so the sec()-remapped cues line up
   * (cut-video.mp4 = original cut, cut-v3.mp4 = current re-cut used by Footage).
   */
  footage: string;
  /** show the cinematic layer (false = plate only, for before/after) */
  showLayer: boolean;
  /** apply an approximation of Footage's base grade + vignette under the layer */
  basePlate: boolean;
  /**
   * Optional contact sheet: up to 9 moments (ORIGINAL cut seconds) shown as a 3x3 grid
   * (render frame 0). Handy to judge the whole grade arc in one still.
   */
  contact?: number[];
  /** forwarded to <CinematicLayer> (e.g. { leaks: false } to isolate a part) */
  layer?: CinematicLayerProps;
  /** use the real <Footage> (camera moves + base grade + vignette, as in Reel) instead of the bare video */
  reelPlate?: boolean;
};

const LabShot: React.FC<Omit<CinematicLabProps, "contact">> = ({ footage, showLayer, basePlate, layer, reelPlate }) => {
  const { fps } = useVideoConfig();
  if (reelPlate) {
    return (
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <Footage />
        {showLayer ? <CinematicLayer {...layer} /> : null}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill>
        <Video
          name="Footage (lab)"
          src={staticFile(footage)}
          muted
          premountFor={fps}
          objectFit="cover"
          style={{ width: "100%", height: "100%", filter: basePlate ? BASE_GRADE : undefined }}
        />
      </AbsoluteFill>
      {basePlate ? <AbsoluteFill style={{ background: BASE_VIGNETTE, pointerEvents: "none" }} /> : null}
      {showLayer ? <CinematicLayer {...layer} /> : null}
    </AbsoluteFill>
  );
};

/** Test bench: the real footage with the cinematic layer on top, independent of Reel. */
export const CinematicLab: React.FC<CinematicLabProps> = ({ footage = "footage/cut-v3.mp4", showLayer = true, basePlate = true, contact, layer, reelPlate = false }) => {
  const { width, height } = useVideoConfig();
  if (!contact || contact.length === 0) {
    return <LabShot footage={footage} showLayer={showLayer} basePlate={basePlate} layer={layer} reelPlate={reelPlate} />;
  }
  const cols = 3;
  const cw = width / cols;
  const ch = height / cols;
  return (
    <AbsoluteFill style={{ backgroundColor: "#111" }}>
      {contact.slice(0, 9).map((t, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: (i % cols) * cw,
            top: Math.floor(i / cols) * ch,
            width,
            height,
            scale: String(1 / cols),
            transformOrigin: "0 0",
            overflow: "hidden",
            isolation: "isolate",
          }}
        >
          <Sequence from={-sec(t)} name={`Contact ${t}s`}>
            <LabShot footage={footage} showLayer={showLayer} basePlate={basePlate} layer={layer} reelPlate={reelPlate} />
          </Sequence>
          <div style={{ position: "absolute", left: 28, top: 20, color: "#fff", fontSize: 72, fontFamily: "sans-serif", fontWeight: 700, textShadow: "0 2px 10px #000" }}>
            {t}s
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
