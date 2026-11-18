import { Video } from "@remotion/media";
import type React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { cameraAt, gradeAt } from "../timeline";

/**
 * The talking-head plate: graded footage inside a moving "camera".
 * Children render INSIDE the camera (so they move with the shot) and ABOVE the plate:
 * that is where text-behind-subject beats live, each with its own cutout on top.
 */
export const Footage: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = cameraAt(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transformOrigin: "50% 30%",
          scale: String(cam.scale),
          translate: `${cam.x}px ${cam.y}px`,
          rotate: `${cam.r}deg`,
        }}
      >
        <Video
          name="Talking head (cut)"
          src={staticFile("footage/cut-v4.mp4")}
          muted
          premountFor={fps}
          objectFit="cover"
          style={{ width: "100%", height: "100%", filter: gradeAt(frame) }}
        />
        {children}
      </AbsoluteFill>
      {/* lens vignette, a touch of warmth at the top */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 85% 70% at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%), linear-gradient(180deg, rgba(255,140,80,0.06) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.28) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
