import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { B } from "../lib/look";
import type { LogoKey } from "../kit/logos";
import { CONCEPT_FX, TOOL_FX } from ".";

/** QA lab: one tool animation alone (f0 = 12, f1 = 228, beats 70/110/150) on the brand background, stage 760 at y 300 */
export const toolLab = (key: string) => {
  const C = TOOL_FX[key as LogoKey] ?? CONCEPT_FX[key].C;
  const logo = (TOOL_FX[key as LogoKey] ? key : "devops") as LogoKey;
  const Comp: React.FC = () => {
    const g = useCurrentFrame();
    return (
      <AbsoluteFill style={{ background: B.bg }}>
        <div style={{ position: "absolute", left: 160, top: 300, width: 760, height: 760, outline: "1px dashed rgba(148,190,255,0.12)" }}>
          <C g={g} f0={12} f1={228} beats={[70, 110, 150]} size={760} logo={logo} />
        </div>
      </AbsoluteFill>
    );
  };
  return Comp;
};
