import React from "react";
import { Logo } from "../kit/Logo";
import { EASE_OUT, iv } from "../archetypes/title/brand/fx";
import type { ToolFxProps } from "./types";

/** placeholder until the tool's real animation exists: its logo, big, popping in */
export const StubFx: React.FC<ToolFxProps> = ({ g, f0, size, logo }) => {
  const p = iv(g, [f0, f0 + 18], [0, 1], EASE_OUT);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Logo name={logo} size={size * 0.36} draw={p} glow={0.4} />
    </div>
  );
};
