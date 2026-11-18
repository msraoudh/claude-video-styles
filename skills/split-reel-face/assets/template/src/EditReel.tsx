import type React from "react";
import { AbsoluteFill } from "remotion";
import { CinematicLayer } from "./cinematic";
import { Captions } from "./edit/Captions";
import { Face } from "./edit/Face";
import { Sound } from "./edit/Sound";
import { Background, StageHeader } from "./edit/Stage";
import { PERF } from "./edit/theme";
import { SCENE_LIST } from "./scenes";

/**
 * The split-reel-face edit: the user's face-cam video (PROJECT in src/data/project.ts) with motion graphics for every
 * step they explain. Layer stack:
 *   Background (warm dark world) → Face (full / top panel / PiP / carousel card, morphing) → cinematic layer 0.5 (one steady warm look,
 *   no timed cues: see cinematic/looks.ts) → StageHeader (progress + step title) → scenes (one per step, global frames) → Captions → Sound.
 * fast = Studio playback mode (« Reel-fluide »): same picture and timing, without the two costly blur passes.
 */
export const EditReel: React.FC<{ sound?: boolean; captions?: boolean; only?: string; fast?: boolean }> = ({ sound = true, captions = true, only, fast = false }) => {
  PERF.fast = fast; // read by glass() in the scenes rendered below
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F0B09" }}>
      <Background />
      <Face />
      {fast ? null : <CinematicLayer amount={0.5} leaks={false} cues={false} letterbox={false} />}
      <StageHeader />
      {SCENE_LIST.filter((s) => !only || s.id === only).map(({ id, C }) => (
        <C key={id} />
      ))}
      {captions ? <Captions /> : null}
      {sound ? <Sound /> : null}
    </AbsoluteFill>
  );
};
