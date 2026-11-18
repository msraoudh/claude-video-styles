import type React from "react";
import { AbsoluteFill } from "remotion";
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
