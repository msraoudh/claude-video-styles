// Live — presence and status chips, in app points.
//
//   <LiveDot />                                   green dot + frame-driven pulse
//   <VenuePill name="The Copper Room" count={7} /> glass pill: ● 🍸 The Copper Room · 7 here
//   <Chip>Dating</Chip>  <Chip variant="soft">Jazz</Chip>  <Chip variant="selected">Jazz</Chip>
//   <HereNow />                                   green pin + "Here now"
//   <LikedNotice count={2} />                     glass pill: ♥ 2 people here liked you
//   <Badge count={2} />                           rose unread badge
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./theme";
import { fontInter } from "./fonts";
import { glassStyle } from "./Glass";
import { Icon, type IconName, type IconWeight } from "./Icon";
import { NumberRoll } from "./Clock";

export type LiveDotProps = {
  size?: number;
  color?: string;
  /** Expanding pulse ring (1.4 s loop, like the app). Default true. */
  pulse?: boolean;
  /** Flat 20 % halo ring around the dot. Default true. */
  halo?: boolean;
  /** Phase offset in ms, so several dots don't pulse in sync. */
  phase?: number;
  /** Soft glow around the dot (mockup `.live-dot` box-shadow). */
  glow?: boolean;
  style?: React.CSSProperties;
};

export const LiveDot: React.FC<LiveDotProps> = ({
  size = 8,
  color = C.green,
  pulse = true,
  halo = true,
  phase = 0,
  glow = false,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000 + phase;
  const raw = (((ms % 1400) + 1400) % 1400) / 1400;
  const p = 1 - (1 - raw) * (1 - raw); // ease-out quad
  const ring = Math.max(2, Math.round(size * 0.375));
  const haloColor =
    color === C.green
      ? C.greenHalo
      : /^#[0-9a-f]{6}$/i.test(color)
        ? `${color}33`
        : "transparent";
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flex: "none",
        ...style,
      }}
    >
      {halo ? (
        <div
          style={{
            position: "absolute",
            left: -ring,
            top: -ring,
            width: size + ring * 2,
            height: size + ring * 2,
            borderRadius: "50%",
            background: haloColor,
          }}
        />
      ) : null}
      {pulse ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: color,
            opacity: 0.5 * (1 - p),
            scale: String(1 + p * 2.2),
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: color,
          boxShadow: glow ? `0 0 ${size}px ${color}` : undefined,
        }}
      />
    </div>
  );
};

export type VenuePillProps = {
  name?: string;
  /** People here now (you included). A number (fractional values roll) or a ready string. Hidden below 2. */
  count?: number | string | null;
  /** Venue glyph (white, never rose). Default the bar's martini. */
  glyph?: IconName;
  live?: boolean;
  style?: React.CSSProperties;
};

/** The deck's venue pill (VenueIsland): glass, 40 high. */
export const VenuePill: React.FC<VenuePillProps> = ({
  name = "The Copper Room",
  count = 7,
  glyph = "martini",
  live = true,
  style,
}) => {
  const showCount =
    typeof count === "string" || (typeof count === "number" && count >= 2);
  return (
    <div
      style={{
        position: "relative",
        height: 40,
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "0 15px 0 13px",
        ...glassStyle({ material: "chrome", radius: 20 }),
        fontFamily: fontInter,
        fontSize: 14.5,
        lineHeight: "20px",
        color: C.text,
        whiteSpace: "nowrap",
        flex: "none",
        ...style,
      }}
    >
      {live ? <LiveDot size={7} halo={false} /> : null}
      <Icon name={glyph} size={18} color={C.text} />
      <span style={{ fontWeight: 600 }}>{name}</span>
      {showCount ? (
        <>
          <span style={{ color: C.text3, fontWeight: 500 }}>·</span>
          <span
            style={{ color: C.text2, fontWeight: 500, display: "inline-flex" }}
          >
            {typeof count === "number" ? <NumberRoll value={count} /> : count}
            {typeof count === "number" ? " here" : null}
          </span>
        </>
      ) : null}
    </div>
  );
};

export type ChipVariant = "glass" | "soft" | "selected" | "rose" | "green";

export type ChipProps = {
  variant?: ChipVariant;
  icon?: IconName;
  iconColor?: string;
  /** Icon weight (default: the name's own; "check" reads best as "bold"). */
  iconWeight?: IconWeight;
  /** "md" 32 pt (default) or "sm" 26 pt. */
  size?: "md" | "sm";
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

/** A chip / badge (Pill.tsx): glass over photos, soft on black, white when selected. */
export const Chip: React.FC<ChipProps> = ({
  variant = "glass",
  icon,
  iconColor,
  iconWeight,
  size = "md",
  style,
  children,
}) => {
  const h = size === "sm" ? 26 : 32;
  const look: React.CSSProperties =
    variant === "glass"
      ? glassStyle({ material: "chrome", radius: h / 2 })
      : variant === "selected"
        ? {
            background: C.text,
            color: C.textInverse,
            borderRadius: h / 2,
            border: `1px solid ${C.text}`,
          }
        : variant === "rose"
          ? {
              background: C.roseTint,
              color: C.roseSoft,
              borderRadius: h / 2,
              border: `1px solid ${C.roseLine}`,
            }
          : variant === "green"
            ? {
                background: C.greenTint,
                color: C.green,
                borderRadius: h / 2,
                border: `1px solid ${C.greenLine}`,
              }
            : {
                background: C.soft,
                borderRadius: h / 2,
                border: `1px solid ${C.line}`,
              };
  return (
    <div
      style={{
        position: "relative",
        height: h,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: `0 ${size === "sm" ? 10 : 13}px`,
        boxSizing: "border-box",
        fontFamily: fontInter,
        fontWeight: 600,
        fontSize: size === "sm" ? 12 : 14,
        lineHeight: "18px",
        color: C.text,
        whiteSpace: "nowrap",
        flex: "none",
        ...look,
        ...style,
      }}
    >
      {icon ? (
        <Icon
          name={icon}
          size={size === "sm" ? 13 : 15}
          weight={iconWeight}
          color={iconColor ?? (look.color as string | undefined) ?? C.text}
        />
      ) : null}
      {children}
    </div>
  );
};

/** Green pin + "Here now" (the deck's meta line). */
export const HereNow: React.FC<{
  text?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({ text = "Here now", size = 15, style }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontFamily: fontInter,
      fontWeight: 500,
      fontSize: size,
      lineHeight: `${Math.round(size * 1.34)}px`,
      color: C.text2,
      textShadow: "0 1px 6px rgba(0,0,0,0.62)",
      ...style,
    }}
  >
    <Icon
      name="map-pin"
      size={Math.round(size * 1.07)}
      weight="fill"
      color={C.green}
    />
    <span>{text}</span>
  </div>
);

/** "2 people here liked you" — glass notice under the deck's top row. */
export const LikedNotice: React.FC<{
  count?: number;
  text?: string;
  style?: React.CSSProperties;
}> = ({ count = 2, text, style }) => (
  <div
    style={{
      position: "relative",
      height: 34,
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "0 14px 0 12px",
      ...glassStyle({ material: "chrome", radius: 17 }),
      fontFamily: fontInter,
      fontWeight: 600,
      fontSize: 14,
      color: C.text,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    <Icon name="heart" size={15} weight="fill" color={C.rose} />
    <span>{text ?? `${count} people here liked you`}</span>
  </div>
);

/** Rose unread badge (Onyx `.badge`). */
export const Badge: React.FC<{
  count: number | string;
  ringColor?: string;
  style?: React.CSSProperties;
}> = ({ count, ringColor = C.bg, style }) => (
  <div
    style={{
      minWidth: 19,
      height: 19,
      padding: "0 5px",
      boxSizing: "border-box",
      borderRadius: 10,
      background: C.roseFill,
      color: C.text,
      fontFamily: fontInter,
      fontWeight: 700,
      fontSize: 11.5,
      lineHeight: "19px",
      textAlign: "center",
      boxShadow: `0 0 0 2px ${ringColor}`,
      display: "inline-block",
      ...style,
    }}
  >
    {count}
  </div>
);
