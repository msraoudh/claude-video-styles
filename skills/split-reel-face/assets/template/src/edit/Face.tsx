import { Video } from "@remotion/media";
import type React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { PROJECT } from "../data/project";
import { layoutAt, MODES } from "./layout";
import { K } from "./theme";
import { f } from "./time";

/** Slow push-in on every layout segment (AIS reference: 1.3–3 %/s), around the face. */
const pushAt = (frame: number) => {
  let t0 = 0;
  for (const [t] of MODES) if (frame >= f(t)) t0 = f(t);
  return 1 + Math.min(0.06, ((frame - t0) / 30) * 0.012);
};

/** Warm, natural grade (skin first). */
const GRADE = "contrast(1.06) saturate(1.04) brightness(1.02) sepia(0.06)";

/**
 * The talking head, drawn into the box of the current layout (full frame / top panel / PiP circle) and
 * morphing between them. The audio comes from SoundDesign (mastered voice), so the video is muted.
 */
export const Face: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { box, gfx } = layoutAt(frame);
  const scale = box.w / box.sw;
  const push = pushAt(frame);
  // push-in around the face centre (source ≈ 560, 760: between the eyes and the mouth)
  const cx = PROJECT.face.cx;
  const cy = PROJECT.face.cy;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: box.x,
          top: box.y,
          width: box.w,
          height: box.h,
          borderRadius: box.r,
          overflow: "hidden",
          background: K.bg0,
          boxShadow: gfx > 0.01 ? `0 0 0 ${4 * gfx}px ${K.coral}, 0 20px 60px rgba(0,0,0,${0.6 * gfx})` : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            transformOrigin: "0 0",
            transform: `scale(${scale}) translate(${-box.sx}px, ${-box.sy}px) translate(${cx}px, ${cy}px) scale(${push}) translate(${-cx}px, ${-cy}px)`,
          }}
        >
          <Video
            name="Talking head (1021.mp4)"
            src={staticFile(PROJECT.video)}
            muted
            premountFor={fps}
            style={{ width: 1080, height: 1920, filter: GRADE }}
          />
        </div>
        {/* lens vignette + a warm lift at the top, fades as the box shrinks */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse 90% 75% at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%), linear-gradient(180deg, rgba(255,150,100,0.05) 0%, rgba(0,0,0,0) 35%)",
            opacity: interpolate(gfx, [0, 1], [1, 0.3]),
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
