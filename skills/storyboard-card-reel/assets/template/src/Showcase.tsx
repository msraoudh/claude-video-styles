import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Reel } from "./Reel";
import { Storyboard } from "./parts/Storyboard";
import { Captions } from "./parts/Captions";
import { CUES, PAGES } from "./cues";
import { Sequence } from "remotion";
import { C } from "./theme";

/**
 * the user's card layout (the refs' presentation): dark canvas, his edit in a card, the storyboard card beside it
 * whose sketch redraws at every beat. NO red label pills (no handle tag, no "STORYBOARD" tag), no tagline, no white.
 * Effects break out of the card: the card shows Reel "base" (clipped), Reel "overlay" (front + captions) is drawn unclipped.
 */
const CARD = { x: 372, y: 300, w: 668 };
const CH = Math.round((CARD.w * 1920) / 1080);

export const Showcase: React.FC<{ sound: boolean }> = ({ sound }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: fr, fps, config: { damping: 16, stiffness: 120 } });
  const k = CARD.w / 1080;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #6E0A15 0%, #3A0710 18%, #1A0508 38%, ${C.black} 62%, ${C.black} 100%)` }}>
      {/* soft red light at the top, filling the space above the card */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 22% at 50% 0%, rgba(227,10,23,.45) 0%, rgba(227,10,23,0) 100%)" }} />
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(227,10,23,.16) 1.6px, transparent 1.6px)", backgroundSize: "34px 34px" }} />
      <Storyboard />
      {/* his edit in the card (clipped) */}
      <div style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CARD.w, height: CH, borderRadius: 34, overflow: "hidden", boxShadow: "0 40px 90px rgba(0,0,0,.75), 0 0 60px rgba(227,10,23,.18)", transform: `translateY(${(1 - s) * 60}px)` }}>
        <div style={{ width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: "0 0" }}>
          <Reel sound={sound} captions={false} part="base" />
        </div>
      </div>
      {/* the effects + captions, unclipped: they break out of the card onto the whole screen */}
      <div style={{ position: "absolute", left: CARD.x, top: CARD.y, width: 1080, height: 1920, transform: `translateY(${(1 - s) * 60}px) scale(${k})`, transformOrigin: "0 0", pointerEvents: "none" }}>
        <Reel sound={false} captions={false} part="overlay" />
      </div>
      {/* full-screen effects (cue layer "screen"): canvas coordinates 1080x1920, outside the card, full size */}
      {CUES.filter((c) => (c.layer as string) === "screen").map((c, i) => (
        <Sequence key={`scr${i}`} from={c.from} durationInFrames={c.dur} layout="absolute-fill">{c.el(c.dur)}</Sequence>
      ))}
      {/* captions on the FULL screen (the user), not inside the card */}
      <Captions hidden={PAGES} y={1610} />
    </AbsoluteFill>
  );
};
