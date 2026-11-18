import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FLASH_FRAMES, FX_LIVE_UNTIL, GRAIN, LETTERBOX } from "../data/fx";
import { bigHitPulse, hitPulse, rand } from "../lib/beat";

/**
 * Global cinematic finish, drawn ON TOP of every section (owned by the director, not the scene agents):
 * film grain, vignette, letterbox bars (curves from trailer.json fx.letterbox: they close in on the drop-outs and
 * the silence, open on the drops), white flash on the heavy 808 accents and a chromatic edge fringe on the hits.
 * Sections must NOT add their own global grain/vignette/letterbox.
 */
export const TrailerFX: React.FC = () => {
  const f = useCurrentFrame();
  const bar = Math.max(
    0,
    ...LETTERBOX.map((pts) =>
      interpolate(f, pts.map((p) => p[0]), pts.map((p) => p[1]), { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    ),
  );
  // after the tape stop the music is dead: no more flashes / fringe (they would wash out the end card)
  const live = f < FX_LIVE_UNTIL;
  const flash = live ? Math.max(0, ...FLASH_FRAMES.map((h) => (f >= h && f < h + 10 ? Math.exp(-(f - h) / 2.2) : 0))) : 0;
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
      <AbsoluteFill style={{ opacity: GRAIN, mixBlendMode: "overlay" }}>
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
