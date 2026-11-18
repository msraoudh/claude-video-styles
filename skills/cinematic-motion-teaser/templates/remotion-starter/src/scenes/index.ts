import type React from "react";
import { EndCardScene, SFX_CUES as endCues } from "./EndCard";
import { HookScene, SFX_CUES as hookCues } from "./Hook";
import { ProductScene, SFX_CUES as productCues } from "./Product";

/** One SFX hit. `frame` is LOCAL to the scene; `sfx` = a file name in public/audio/sfx/ (no .wav). */
export type Cue = { frame: number; sfx: string; volume?: number };

/** Scene id (from data/timeline.ts) → component. Every scene: `export const <Name>Scene: React.FC`. */
export const SCENE_COMPONENTS: Record<string, React.FC> = {
  hook: HookScene,
  product: ProductScene,
  endcard: EndCardScene,
};

/** Scene id → its exported SFX_CUES (read by components/SoundDesign.tsx). */
export const SCENE_CUES: Record<string, Cue[]> = {
  hook: hookCues,
  product: productCues,
  endcard: endCues,
};
