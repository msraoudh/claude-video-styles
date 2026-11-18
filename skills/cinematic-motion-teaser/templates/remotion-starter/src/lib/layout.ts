import { useVideoConfig } from "remotion";

/**
 * Responsive layout helper shared by every scene.
 * `u` is the size unit: 1u = 1px on a 1080px short side, so both
 * 1920x1080 and 1080x1920 keep the same visual weight.
 */
export const useLayout = () => {
  const { width, height, fps } = useVideoConfig();
  const portrait = height > width;
  const u = Math.min(width, height) / 1080;
  return {
    width,
    height,
    fps,
    portrait,
    u,
    cx: width / 2,
    cy: height / 2,
    /** Safe-area insets (px) — keep key text inside. */
    safe: portrait
      ? { top: 220 * u, bottom: 380 * u, side: 90 * u }
      : { top: 100 * u, bottom: 100 * u, side: 100 * u },
    /** Vertical centre of the caption band (px from top). */
    captionY: portrait ? height * 0.69 : height * 0.86,
  };
};

export type Layout = ReturnType<typeof useLayout>;
