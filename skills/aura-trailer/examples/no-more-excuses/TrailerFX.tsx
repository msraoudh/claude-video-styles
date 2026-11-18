import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BIG_HITS, KEY } from "../data/beats";
import { bigHitPulse, hitPulse, rand } from "../lib/beat";

/**
 * Global cinematic finish, drawn ON TOP of every section (owned by the director, not the scene agents):
 * film grain, vignette, letterbox bars that close in on the drop-outs, white flash + chromatic fringe on the
 * heavy 808 accents. Sections must NOT add their own global grain/vignette/letterbox.
 */
export const TrailerFX: React.FC = () => {
  const f = useCurrentFrame();
  // letterbox: thin by default, closes in during the two drop-outs and the silence, opens on the drops
  const bar = (() => {
    const base = 0;
    const d1 = interpolate(f, [KEY.dropout1[0] - 10, KEY.dropout1[0] + 20, KEY.drop1 - 2, KEY.drop1 + 4], [0, 150, 150, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const d2 = interpolate(f, [KEY.silence[0] - 6, KEY.silence[0] + 30, KEY.bigDrop - 2, KEY.bigDrop + 4], [0, 210, 210, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const cold = interpolate(f, [0, 236, 244], [190, 190, 0], { extrapolateRight: "clamp" });
    return Math.max(base, d1, d2, cold);
  })();
  // after the tape stop the music is dead: no more flashes / fringe (they would wash out the CRT and the end card)
  const live = f < KEY.tapeStop;
  const flash = live ? Math.max(...BIG_HITS.filter((h) => h < KEY.tapeStop).map((h) => (f >= h && f < h + 10 ? Math.exp(-(f - h) / 2.2) : 0)), f >= KEY.drop1 && f < KEY.drop1 + 10 ? Math.exp(-(f - KEY.drop1) / 2.2) : 0) : 0;
  const fringe = live ? 4 * hitPulse(f, 6) + 10 * bigHitPulse(f, 14) : 0;
  const seed = Math.floor(f / 2);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* chromatic fringe: two tinted edge glows that jump on the hits */}
      {fringe > 0.4 ? (
        <AbsoluteFill style={{ boxShadow: `inset ${fringe}px 0 ${fringe * 3}px rgba(255,46,77,0.35), inset ${-fringe}px 0 ${fringe * 3}px rgba(125,211,252,0.35)` }} />
      ) : null}
      {/* vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 62% at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.78) 100%)" }} />
      {/* grain (deterministic SVG turbulence, reseeded every 2 frames) */}
      <AbsoluteFill style={{ opacity: 0.11, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id={`g${seed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(rand(seed) * 1000)} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#g${seed})`} />
        </svg>
      </AbsoluteFill>
      {/* letterbox */}
      {bar > 0.5 ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: bar, background: "#000" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: bar, background: "#000" }} />
        </>
      ) : null}
      {/* flash */}
      {flash > 0.01 ? <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.85, mixBlendMode: "screen" }} /> : null}
    </AbsoluteFill>
  );
};
