// Buttons — mobile/components/Button.tsx + SwipeActionBar.tsx, in app points.
//
//   <PillButton variant="white" icon="google">Continue with Google</PillButton>
//   <PillButton variant="rose" icon="chat-circle" press={p}>Open chat</PillButton>
//   <PillButton variant="graphite" size={48} icon="hand-waving" iconColor={C.rose}>Come see me</PillButton>
//   <PassButton />  <LikeButton pop={p} />
//
// Variants: white = primary (white pill, black label) · rose = LIVE CTA only
// (#E11D48 fill, white label, rose light pooled under it) · graphite =
// secondary (#232327) · glass = over a photo · ghost = no fill, secondary label.
// `press` 0..1 drives the app's press feedback: scale → 0.96 (0.98 full width)
// and a slight dim. Drive it with a spring for a tap.
import React from "react";
import { C } from "./theme";
import { fontInter } from "./fonts";
import { Icon, type IconName, type IconWeight } from "./Icon";
import { glassStyle } from "./Glass";

export type PillVariant =
  | "white"
  | "rose"
  | "graphite"
  | "glass"
  | "ghost"
  | "destructive";
export type PillSize = 56 | 48 | 36;

const LOOK: Record<
  PillVariant,
  {
    fill: string | null;
    label: string;
    border?: string;
    glow?: boolean;
    glass?: boolean;
  }
> = {
  white: { fill: C.text, label: C.textInverse },
  rose: { fill: C.roseFill, label: C.text, glow: true },
  graphite: { fill: C.surface3, label: C.text },
  glass: { fill: null, label: C.text, glass: true },
  ghost: { fill: "transparent", label: C.text2 },
  destructive: { fill: C.dangerTint, label: C.danger, border: C.dangerLine },
};

const SIZE: Record<
  PillSize,
  {
    padX: number;
    gap: number;
    font: number;
    lh: number;
    ls: number;
    icon: number;
  }
> = {
  56: { padX: 24, gap: 10, font: 17, lh: 22, ls: -0.2, icon: 20 },
  48: { padX: 18, gap: 8, font: 15, lh: 20, ls: -0.1, icon: 19 },
  36: { padX: 14, gap: 6, font: 14, lh: 18, ls: -0.1, icon: 16 },
};

/** Rose light pooled under a live control (theme/glow `glowInsets` + `glowOpacity`). */
export const RoseLight: React.FC<{
  inset: { left: number; right: number; top: number; bottom: number };
  opacity: number;
  color?: string;
}> = ({ inset, opacity, color = "255,61,95" }) => (
  <div
    style={{
      position: "absolute",
      left: inset.left,
      right: inset.right,
      top: inset.top,
      bottom: inset.bottom,
      background: `radial-gradient(closest-side, rgba(${color},${opacity}) 0%, rgba(${color},${opacity * 0.45}) 50%, rgba(${color},0) 100%)`,
      pointerEvents: "none",
    }}
  />
);

export type PillButtonProps = {
  variant?: PillVariant;
  size?: PillSize;
  /** Leading icon name, or any node. */
  icon?: IconName | React.ReactNode;
  /** Icon colour (default: the label colour; the meet buttons use rose). */
  iconColor?: string;
  iconWeight?: IconWeight;
  /** 0..1 press amount. */
  press?: number;
  /** Stretch to the container (default true, like the app). */
  fullWidth?: boolean;
  /** Fixed width in pt (overrides fullWidth). */
  width?: number;
  disabled?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export const PillButton: React.FC<PillButtonProps> = ({
  variant = "white",
  size = 56,
  icon,
  iconColor,
  iconWeight,
  press = 0,
  fullWidth = true,
  width,
  disabled = false,
  style,
  children,
}) => {
  const look = disabled
    ? {
        fill: C.surface2,
        label: C.text3,
        border: C.line,
        glow: false,
        glass: false,
      }
    : LOOK[variant];
  const m = SIZE[size];
  const r = size / 2;
  const wide = width === undefined && fullWidth;
  const scale = 1 - press * (wide ? 0.02 : 0.04);
  const iconNode =
    typeof icon === "string" ? (
      <Icon
        name={icon as IconName}
        size={m.icon}
        color={iconColor ?? look.label}
        weight={iconWeight}
      />
    ) : (
      icon
    );
  return (
    <div
      style={{
        position: "relative",
        height: size,
        width: width ?? (fullWidth ? "100%" : undefined),
        display: fullWidth || width ? "flex" : "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `0 ${m.padX}px`,
        boxSizing: "border-box",
        scale: String(scale),
        filter: press > 0 ? `brightness(${1 - press * 0.12})` : undefined,
        flex: "none",
        ...style,
      }}
    >
      {look.glow ? (
        <RoseLight
          inset={{ left: 18, right: 18, top: 18, bottom: -18 }}
          opacity={0.35}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: r,
          ...(look.glass
            ? glassStyle({ material: "chrome", radius: r })
            : {
                background: look.fill ?? "transparent",
                border: look.border ? `1px solid ${look.border}` : undefined,
                boxSizing: "border-box",
              }),
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: iconNode ? m.gap : 0,
          fontFamily: fontInter,
          fontWeight: 600,
          fontSize: m.font,
          lineHeight: `${m.lh}px`,
          letterSpacing: m.ls,
          color: look.label,
          whiteSpace: "nowrap",
        }}
      >
        {iconNode}
        {children}
      </div>
    </div>
  );
};

export type CircleVariant = "glass" | "white" | "rose" | "graphite" | "plain";

export type CircleButtonProps = {
  size?: number;
  variant?: CircleVariant;
  icon: IconName;
  iconColor?: string;
  /** Default ~42 % of size (the dock's ratio). */
  iconSize?: number;
  iconWeight?: IconWeight;
  /** 0..1 press amount (scale → 0.92 like the dock). */
  press?: number;
  /** Rose light pooled under it (the like button). */
  glow?: boolean;
  /** A 1.5 pt ring colour (the like button's rose line). */
  ring?: string;
  /** 0..1 "likePulse": pops 1 → 1.12 → 1. */
  pop?: number;
  style?: React.CSSProperties;
};

export const CircleButton: React.FC<CircleButtonProps> = ({
  size = 40,
  variant = "glass",
  icon,
  iconColor,
  iconSize,
  iconWeight,
  press = 0,
  glow = false,
  ring,
  pop = 0,
  style,
}) => {
  const fill =
    variant === "white"
      ? C.text
      : variant === "rose"
        ? C.roseFill
        : variant === "graphite"
          ? C.surface3
          : null;
  const color = iconColor ?? (variant === "white" ? C.textInverse : C.text);
  const popScale = 1 + 0.12 * Math.sin(Math.min(1, Math.max(0, pop)) * Math.PI);
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        scale: String((1 - press * 0.08) * popScale),
        flex: "none",
        ...style,
      }}
    >
      {glow ? (
        <RoseLight
          inset={{ left: -16, right: -16, top: -8, bottom: -26 }}
          opacity={0.45}
        />
      ) : null}
      {variant === "plain" ? null : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: size / 2,
            ...(fill
              ? { background: fill }
              : glassStyle({ material: "chrome", radius: size / 2 })),
          }}
        />
      )}
      {ring ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: size / 2,
            border: `1.5px solid ${ring}`,
            boxSizing: "border-box",
          }}
        />
      ) : null}
      <Icon
        name={icon}
        size={iconSize ?? Math.round(size * 0.42)}
        color={color}
        weight={iconWeight}
        style={{ position: "relative" }}
      />
    </div>
  );
};

/** The deck's pass button: 62 pt glass circle, bold white x. */
export const PassButton: React.FC<{
  size?: number;
  press?: number;
  style?: React.CSSProperties;
}> = ({ size = 62, press, style }) => (
  <CircleButton
    size={size}
    icon="x"
    iconWeight="bold"
    press={press}
    style={style}
  />
);

/** The deck's like button: 72 pt glass circle, rose heart, rose ring, rose light under it. */
export const LikeButton: React.FC<{
  size?: number;
  press?: number;
  pop?: number;
  style?: React.CSSProperties;
}> = ({ size = 72, press, pop, style }) => (
  <CircleButton
    size={size}
    icon="heart"
    iconWeight="fill"
    iconColor={C.rose}
    iconSize={Math.round(size * 0.44)}
    glow
    ring={C.roseLine}
    press={press}
    pop={pop}
    style={style}
  />
);

/** Pass + like, 30 pt apart (Onyx `.dock`). */
export const SwipeDock: React.FC<{
  passPress?: number;
  likePress?: number;
  likePop?: number;
  sheet?: boolean;
  style?: React.CSSProperties;
}> = ({ passPress, likePress, likePop, sheet = false, style }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 30,
      ...style,
    }}
  >
    <PassButton size={sheet ? 58 : 62} press={passPress} />
    <LikeButton size={sheet ? 66 : 72} press={likePress} pop={likePop} />
  </div>
);
