// Glass — Onyx's Apple glass (mobile/components/Glass.tsx + the mockup's `.gl`):
// backdrop blur + a graphite fill + a 1 pt white hairline + a 1 pt light along
// the top edge. NEVER a drop shadow (coloured light is a <Glow>, not a shadow).
//
//   chrome  rgba(40,40,44,.42)  blur 26 saturate 180%   pills, circles, dock, composer
//   strong  rgba(10,10,12,.72)  blur 30                  headers and bars
//   sheet   rgba(14,14,16,.74)  blur 40 saturate 170%   bottom sheets
//
// Glass only blurs what is painted BEHIND it inside the same backdrop root
// (a photo, a list). On pure black it reads as dark graphite, like the app.
import React from "react";
import { C } from "./theme";

export type GlassMaterial = "chrome" | "strong" | "sheet";

const FILL: Record<GlassMaterial, string> = {
  chrome: C.glass,
  strong: C.glassStrong,
  sheet: C.glassSheet,
};
const BLUR: Record<GlassMaterial, string> = {
  chrome: "blur(26px) saturate(180%)",
  strong: "blur(30px) saturate(180%)",
  sheet: "blur(40px) saturate(170%)",
};

export type GlassStyleOptions = {
  material?: GlassMaterial;
  radius?: number;
  /** Override the blur radius (px in the component's own coordinate space). */
  blur?: number;
  /** Solid graphite (#1C1C1F) instead of blur — the app's Android / reduce-transparency look. */
  fallback?: boolean;
  border?: boolean;
  highlight?: boolean;
};

/** The glass recipe as a style object (use on any element). */
export const glassStyle = ({
  material = "chrome",
  radius = 0,
  blur,
  fallback = false,
  border = true,
  highlight = true,
}: GlassStyleOptions = {}): React.CSSProperties => {
  const filter =
    blur !== undefined
      ? `blur(${blur}px) saturate(${material === "sheet" ? 170 : 180}%)`
      : BLUR[material];
  return {
    borderRadius: radius,
    backgroundColor: fallback ? C.glassFallback : FILL[material],
    backdropFilter: fallback ? undefined : filter,
    WebkitBackdropFilter: fallback ? undefined : filter,
    border: border ? `1px solid ${C.glassLine}` : undefined,
    boxShadow: highlight ? `inset 0 1px 0 ${C.glassHighlight}` : undefined,
    boxSizing: "border-box",
  };
};

export type GlassProps = GlassStyleOptions & {
  /** Shorthand for material="strong". */
  strong?: boolean;
  /** Shorthand for material="sheet". */
  sheet?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export const Glass: React.FC<GlassProps> = ({
  strong,
  sheet,
  material,
  radius = 20,
  blur,
  fallback,
  border,
  highlight,
  style,
  children,
}) => {
  const m: GlassMaterial =
    material ?? (sheet ? "sheet" : strong ? "strong" : "chrome");
  return (
    <div
      style={{
        position: "relative",
        ...glassStyle({
          material: m,
          radius,
          blur,
          fallback,
          border,
          highlight,
        }),
        ...style,
      }}
    >
      {children}
    </div>
  );
};
