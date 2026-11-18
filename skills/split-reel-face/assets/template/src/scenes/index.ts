import type React from "react";
import type { Cue } from "../edit/cue";
import { Example, exampleCues } from "./Example";

/**
 * Scene registry. Each scene renders itself only inside its own time ranges (GLOBAL frames — no Sequence offset)
 * and exports its SFX cues. One file per scene, one agent per file (references/agents.md). Replace Example.
 */
export const SCENE_LIST: { id: string; C: React.FC }[] = [{ id: "example", C: Example }];

export const ALL_CUES: Cue[] = [...exampleCues].sort((a, b) => a.f - b.f);
