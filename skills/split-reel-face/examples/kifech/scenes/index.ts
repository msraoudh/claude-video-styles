import type React from "react";
import type { Cue } from "../edit/cue";
import { Agents, agentsCues } from "./Agents";
import { Bonus, bonusCues } from "./Bonus";
import { Hook, hookCues } from "./Hook";
import { Reveal, revealCues } from "./Reveal";
import { Step1, step1Cues } from "./Step1";
import { Step2, step2Cues } from "./Step2";
import { Step3, step3Cues } from "./Step3";
import { Step4, step4Cues } from "./Step4";
import { Step5, step5Cues } from "./Step5";

/**
 * Scene registry. Each scene renders itself only inside its own time ranges (GLOBAL frames — no Sequence offset)
 * and exports its SFX cues. Owners: one agent per file (see EDIT-PLAN.md « Scenes »).
 */
export const SCENE_LIST: { id: string; C: React.FC }[] = [
  { id: "hook", C: Hook },
  { id: "step1", C: Step1 },
  { id: "step2", C: Step2 },
  { id: "step3", C: Step3 },
  { id: "step4", C: Step4 },
  { id: "agents", C: Agents },
  { id: "step5", C: Step5 },
  { id: "reveal", C: Reveal },
  { id: "bonus", C: Bonus },
];

export const ALL_CUES: Cue[] = [
  ...hookCues,
  ...step1Cues,
  ...step2Cues,
  ...step3Cues,
  ...step4Cues,
  ...agentsCues,
  ...step5Cues,
  ...revealCues,
  ...bonusCues,
].sort((a, b) => a.f - b.f);
