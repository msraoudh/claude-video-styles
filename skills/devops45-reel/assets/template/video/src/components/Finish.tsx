import React from "react";
import { AbsoluteFill } from "remotion";
import { rand, useGlobalFrame } from "../lib/sync";

/** Global finish on top of every scene (director-owned): soft vignette + very light grain. No letterbox, no flashes. */
export const Finish: React.FC = () => {
  const g = useGlobalFrame();
  const seed = Math.floor(g / 2);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 45%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)" }} />
      <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id={`n${seed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(rand(seed) * 1000)} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#n${seed})`} />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
