import React from "react";
import { AbsoluteFill } from "remotion";
import { useGlobalFrame } from "../../lib/beat";
import { Cold } from "./Cold";
import { Dropout } from "./Dropout";
import { World } from "./World";

/**
 * OPEN — global frames 0-756 (sections `cold` 0-240 and `world` 240-757). This component is mounted at global
 * frame 0, so every Sequence `from` inside Cold / World / Dropout is a GLOBAL frame. Each part is only
 * mounted inside its own range (hard cuts between them).
 *   0-239   Cold: line H on his zones card, « TOI. » slam at 221, hard cut on the 808 entry (240).
 *   240-613 World: trailer cards + his data hits + line L40 (+40 MÉTIERS), cut on the 808 onsets, strobe at 598.
 *   614-756 Dropout: line A on master-v4, « MOI C'EST ▌ » (name withheld), TECH · CLOUD · IA, suck-in to black.
 */
export const Open: React.FC = () => {
  const g = useGlobalFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {g < 240 ? <Cold /> : null}
      {g >= 240 && g < 614 ? <World /> : null}
      {g >= 614 && g < 757 ? <Dropout /> : null}
    </AbsoluteFill>
  );
};
