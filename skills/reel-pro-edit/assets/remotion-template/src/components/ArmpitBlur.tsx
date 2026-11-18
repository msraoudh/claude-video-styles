import type React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import track from "../data/armpit.json";

type Point = { f: number; x: number; y: number; rx: number; ry: number; o: number };
const byFrame = new Map((track as Point[]).map((p) => [p.f, p]));

/**
 * Privacy blur over the armpit when the user raises his left arm (32.9–34.5 s and 55.8–56.5 s on the cut).
 * Positions come from MediaPipe pose tracking (shoulder landmark, smoothed) — see analysis/pose.py.
 * Lives inside the Footage camera (camera-space pixels) and above the cutout, so it follows every move.
 */
export const ArmpitBlur: React.FC = () => {
  const frame = useCurrentFrame();
  const p = byFrame.get(frame);
  if (!p || p.o <= 0) return null;
  const mask = `radial-gradient(ellipse ${p.rx}px ${p.ry}px at ${p.x}px ${p.y}px, #000 0%, #000 55%, transparent 100%)`;
  return (
    <AbsoluteFill
      style={{
        opacity: p.o,
        backdropFilter: "blur(26px) saturate(0.9)",
        WebkitBackdropFilter: "blur(26px) saturate(0.9)",
        maskImage: mask,
        WebkitMaskImage: mask,
        pointerEvents: "none",
      }}
    />
  );
};
