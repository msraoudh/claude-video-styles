// Phone — a premium iPhone 15/16 Pro style device in CSS.
//
//   <Phone height={1500} tilt={{ y: -14, x: 4 }} glare>
//     <SwipeScreen ... />          ← laid out in a 390 x 844 pt coordinate space
//   </Phone>
//
// The children are laid out in app points (390 x 844, the size the app is
// designed for) and the whole screen is scaled to fit `height` (the device's
// total height in px, frame included). Layers, back to front: floor shadow ·
// extruded titanium edge (thickness, follows the tilt) · side buttons ·
// titanium frame · black bezel · screen (children) · status bar · Dynamic
// Island · home indicator · glass sheen + moving glare.
//
// 3D: CSS perspective on the wrapper + rotateX/rotateY/rotateZ on the body. No
// transform-style: preserve-3d is used (it would flatten backdrop-filter glass
// inside the screen), the thickness is drawn as stacked offset layers.
import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./theme";
import { fontInter } from "./fonts";

export const PHONE_W = 390;
export const PHONE_H = 844;
/** Black glass border around the screen (pt). */
const BEZEL = 6;
/** Titanium band (pt). */
const FRAME = 3.6;
export const DEVICE_W = PHONE_W + 2 * (BEZEL + FRAME);
export const DEVICE_H = PHONE_H + 2 * (BEZEL + FRAME);
/** Screen corner radius (pt). */
export const SCREEN_RADIUS = 55;
const DEVICE_R = SCREEN_RADIUS + BEZEL + FRAME;

/** px per app point for a device `height` px tall. */
export const usePhoneScale = (height: number) => height / DEVICE_H;
/** Device box for a given height. `k` = px per pt. */
export const phoneSize = (height: number) => {
  const k = height / DEVICE_H;
  return {
    width: DEVICE_W * k,
    height,
    k,
    screenW: PHONE_W * k,
    screenH: PHONE_H * k,
  };
};

/**
 * Render app-point components (pills, chips, cards, the meet card…) outside a
 * phone at `k` px per pt — e.g. a floating glass chip at 2.2 × u. Uses CSS zoom,
 * so the box takes its scaled size in layout and text stays crisp.
 */
export const AppScale: React.FC<{
  k: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ k, style, children }) => (
  <div style={{ zoom: k, ...style }}>{children}</div>
);

export type PhoneTilt = { x?: number; y?: number; z?: number };

export type PhoneProps = {
  /** Total device height in px (frame included). */
  height: number;
  /** Screen background. Default true black. */
  screen?: string;
  /** Degrees. y > 0 turns the right edge away from the viewer. */
  tilt?: PhoneTilt;
  /** CSS perspective in px. Default 2.6 x height. */
  perspective?: number;
  /** Moving glare streak: true = auto sweep every ~4.5 s; a number 0..1 = manual position; false = off. */
  glare?: boolean | number;
  /** Soft floor shadow + body shadow. Default true. */
  shadow?: boolean;
  showStatusBar?: boolean;
  showHomeIndicator?: boolean;
  /** Status bar time. Default "9:41". */
  time?: string;
  /** "light" = white status bar glyphs (default, the app is dark-only). */
  statusBarTone?: "light" | "dark";
  /** Titanium finish. */
  finish?: "black" | "natural";
  /** Device thickness in pt for the extruded edge. Default 40. */
  thickness?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

/** The status bar glyphs of the Onyx mockup (signal · wifi · battery), 78 x 13. */
const StatusGlyphs: React.FC<{ color: string }> = ({ color }) => (
  <svg width={78} height={13} viewBox="0 0 78 13" style={{ display: "block" }}>
    <g fill={color}>
      <rect x="0" y="8.5" width="3" height="4.5" rx=".8" />
      <rect x="4.6" y="6.2" width="3" height="6.8" rx=".8" />
      <rect x="9.2" y="3.6" width="3" height="9.4" rx=".8" />
      <rect x="13.8" y="1" width="3" height="12" rx=".8" />
      <path d="M24.6 4.4a10.4 10.4 0 0 1 13.8 0l-1.6 1.7a8 8 0 0 0-10.6 0z M27.4 7.4a6.3 6.3 0 0 1 8.2 0l-1.6 1.7a4 4 0 0 0-5 0z M30.2 10.4a2.2 2.2 0 0 1 2.6 0l-1.3 1.6z" />
      <rect
        x="47.5"
        y=".8"
        width="24"
        height="11.4"
        rx="3.4"
        fill="none"
        stroke={color}
        strokeOpacity=".4"
      />
      <rect x="49.5" y="2.8" width="18.5" height="7.4" rx="1.8" />
      <rect x="72.6" y="4.4" width="1.6" height="4.2" rx=".8" opacity=".45" />
    </g>
  </svg>
);

/** iOS status bar (54 pt), in app points. Use inside a 390-wide screen. */
export const StatusBar: React.FC<{
  time?: string;
  color?: string;
  style?: React.CSSProperties;
}> = ({ time = "9:41", color = C.text, style }) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 54,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "4px 30px 0 46px",
      boxSizing: "border-box",
      fontFamily: fontInter,
      fontWeight: 600,
      fontSize: 17,
      letterSpacing: -0.3,
      lineHeight: 1,
      color,
      zIndex: 30,
      pointerEvents: "none",
      ...style,
    }}
  >
    <span style={{ fontVariantNumeric: "tabular-nums" }}>{time}</span>
    <StatusGlyphs color={color} />
  </div>
);

/** The Dynamic Island (124 x 36 pt at 11 pt from the top). */
export const DynamicIsland: React.FC<{ style?: React.CSSProperties }> = ({
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: PHONE_W / 2 - 62,
      top: 11,
      width: 124,
      height: 36,
      borderRadius: 20,
      background: "#000",
      zIndex: 31,
      ...style,
    }}
  >
    {/* the front camera, barely visible */}
    <div
      style={{
        position: "absolute",
        right: 12,
        top: 11,
        width: 14,
        height: 14,
        borderRadius: 7,
        background:
          "radial-gradient(circle at 40% 38%, #1d2333 0%, #0b0d14 45%, #050507 70%)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    />
    <div
      style={{
        position: "absolute",
        right: 17,
        top: 14,
        width: 3,
        height: 3,
        borderRadius: 2,
        background: "rgba(120,140,255,0.35)",
      }}
    />
  </div>
);

/** Home indicator (138 x 5 pt, 8 pt from the bottom). */
export const HomeIndicator: React.FC<{
  color?: string;
  style?: React.CSSProperties;
}> = ({ color = C.text, style }) => (
  <div
    style={{
      position: "absolute",
      bottom: 8,
      left: PHONE_W / 2 - 69,
      width: 138,
      height: 5,
      borderRadius: 3,
      background: color,
      zIndex: 40,
      ...style,
    }}
  />
);

const FINISH = {
  black: {
    frame: (a: number) =>
      `linear-gradient(${a}deg, #6e6e74 0%, #2a2a2e 14%, #141416 38%, #1c1c1f 58%, #3a3a3f 80%, #8a8a91 100%)`,
    edgeNear: [92, 92, 98] as const,
    edgeFar: [22, 22, 25] as const,
    button: "linear-gradient(90deg, #1a1a1d, #4a4a50 50%, #1a1a1d)",
  },
  natural: {
    frame: (a: number) =>
      `linear-gradient(${a}deg, #c9c4bd 0%, #7d7a75 16%, #54524f 40%, #6a6763 60%, #9a968f 82%, #e0dbd3 100%)`,
    edgeNear: [168, 163, 156] as const,
    edgeFar: [58, 56, 54] as const,
    button: "linear-gradient(90deg, #4f4d4a, #a29e97 50%, #4f4d4a)",
  },
} as const;

const mixRgb = (a: readonly number[], b: readonly number[], t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;

export const Phone: React.FC<PhoneProps> = ({
  height,
  screen = C.bg,
  tilt,
  perspective,
  glare = false,
  shadow = true,
  showStatusBar = true,
  showHomeIndicator = true,
  time = "9:41",
  statusBarTone = "light",
  finish = "black",
  thickness = 40,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = height / DEVICE_H;
  const width = DEVICE_W * k;
  const rx = tilt?.x ?? 0;
  const ry = tilt?.y ?? 0;
  const rz = tilt?.z ?? 0;
  const f = FINISH[finish];

  // Extruded edge: the back plane, offset against the tilt.
  const T = thickness * k;
  const offX = -Math.sin((ry * Math.PI) / 180) * T;
  const offY = Math.sin((rx * Math.PI) / 180) * T;
  const edgeLen = Math.hypot(offX, offY);
  const layers =
    edgeLen < 0.5 ? 0 : Math.min(28, Math.max(4, Math.ceil(edgeLen / 1.6)));

  // Light comes from the top-left; turning the phone moves the highlight.
  const lightAngle = 128 + ry * 2.2 - rx * 1.2;

  // Glare position 0..1 (beyond the screen at both ends).
  let glarePos: number | null = null;
  if (typeof glare === "number") {
    glarePos = glare;
  } else if (glare) {
    const period = 4.5 * fps;
    const t = (frame % period) / period;
    glarePos = interpolate(t, [0, 0.55, 1], [0, 1, 1], {
      extrapolateRight: "clamp",
    });
  }

  const sb = statusBarTone === "light" ? C.text : "#000";
  const screenLeft = (FRAME + BEZEL) * k;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        perspective: perspective ?? height * 2.6,
        flex: "none",
        ...style,
      }}
    >
      {shadow ? (
        <div
          style={{
            position: "absolute",
            left: width * 0.1,
            width: width * 0.8,
            top: height * 0.955,
            height: width * 0.16,
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, rgba(0,0,0,0.6), rgba(0,0,0,0))",
            filter: `blur(${14 * k}px)`,
            translate: `${-offX * 0.6}px 0px`,
          }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
          transformOrigin: "50% 50%",
        }}
      >
        {/* extruded titanium edge (back to front) */}
        {Array.from({ length: layers }, (_, i) => {
          const t = 1 - i / Math.max(1, layers - 1); // 1 = back, 0 = near the face
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: DEVICE_R * k,
                translate: `${offX * t}px ${offY * t}px`,
                background: mixRgb(f.edgeNear, f.edgeFar, Math.pow(t, 0.7)),
                boxShadow:
                  i === 0 && shadow
                    ? `0 ${40 * k}px ${80 * k}px ${-24 * k}px rgba(0,0,0,0.75)`
                    : undefined,
              }}
            />
          );
        })}

        {/* side buttons: action + volume (left), power (right) */}
        {[
          { side: "left", top: 168, len: 32 },
          { side: "left", top: 226, len: 58 },
          { side: "left", top: 296, len: 58 },
          { side: "right", top: 258, len: 96 },
        ].map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: b.top * k,
              height: b.len * k,
              width: 4 * k,
              [b.side]: -2.6 * k,
              borderRadius: 2 * k,
              background: f.button,
              translate: `${offX * 0.35}px ${offY * 0.35}px`,
            }}
          />
        ))}

        {/* titanium frame */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: DEVICE_R * k,
            background: f.frame(lightAngle),
            boxShadow: `inset 0 0 0 ${0.6 * k}px rgba(255,255,255,0.28), inset 0 0 0 ${1.6 * k}px rgba(0,0,0,0.35)`,
            ...(layers === 0 && shadow
              ? {
                  boxShadow: `inset 0 0 0 ${0.6 * k}px rgba(255,255,255,0.28), inset 0 0 0 ${1.6 * k}px rgba(0,0,0,0.35), 0 ${40 * k}px ${80 * k}px ${-24 * k}px rgba(0,0,0,0.75)`,
                }
              : null),
          }}
        />

        {/* black bezel */}
        <div
          style={{
            position: "absolute",
            inset: FRAME * k,
            borderRadius: (DEVICE_R - FRAME) * k,
            background: "#020203",
            boxShadow: `inset 0 0 0 ${0.8 * k}px rgba(255,255,255,0.07)`,
          }}
        />

        {/* screen */}
        <div
          style={{
            position: "absolute",
            left: screenLeft,
            top: screenLeft,
            width: PHONE_W * k,
            height: PHONE_H * k,
            borderRadius: SCREEN_RADIUS * k,
            overflow: "hidden",
            background: screen,
            isolation: "isolate",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: PHONE_W,
              height: PHONE_H,
              transform: `scale(${k})`,
              transformOrigin: "0 0",
              overflow: "hidden",
            }}
          >
            {children}
            {showStatusBar ? <StatusBar time={time} color={sb} /> : null}
            <DynamicIsland />
            {showHomeIndicator ? <HomeIndicator color={sb} /> : null}
          </div>

          {/* glass: a faint static sheen + the moving glare */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: `linear-gradient(${lightAngle - 10}deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.015) 28%, rgba(255,255,255,0) 45%)`,
              mixBlendMode: "screen",
              zIndex: 50,
            }}
          />
          {glarePos !== null ? (
            <div
              style={{
                position: "absolute",
                top: -PHONE_H * k * 0.25,
                height: PHONE_H * k * 1.5,
                width: PHONE_W * k * 0.55,
                left: interpolate(
                  glarePos,
                  [0, 1],
                  [-PHONE_W * k * 1.3, PHONE_W * k * 1.4],
                ),
                rotate: "22deg",
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.13) 48%, rgba(255,255,255,0.05) 66%, rgba(255,255,255,0) 100%)",
                mixBlendMode: "screen",
                pointerEvents: "none",
                zIndex: 51,
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
