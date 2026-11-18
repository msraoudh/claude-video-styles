import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import { EASE_IN_OUT, EASE_OUT } from "./motion";

/* ------------------------------------------------------------------ */
/* lightStreak — signature transition: a diagonal glowing bar sweeps  */
/* across the frame; the new scene is revealed behind it.             */
/* ------------------------------------------------------------------ */
type StreakProps = { core?: string; accent?: string };

const LightStreakComp: React.FC<
  TransitionPresentationComponentProps<StreakProps>
> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const { width: W, height: H } = useVideoConfig();
  const u = Math.min(W, H) / 1080;
  const d = H * 0.32; // slant
  const p = EASE_IN_OUT(presentationProgress);
  const s = interpolate(p, [0, 1], [-d - 260 * u, W + d + 260 * u]);
  const xTop = s + d;
  const xBot = s - d;

  if (presentationDirection === "exiting") {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  const L = Math.sqrt(H * H + 4 * d * d) * 1.3;
  const angle = (Math.atan2(H, xBot - xTop) * 180) / Math.PI;
  const cx = (xTop + xBot) / 2;
  const core = passedProps.core ?? "#FFFFFF";
  const accent = passedProps.accent ?? "#8B7CF6";
  const bar = (thick: number, off: number, color: string, glow: number) => (
    <div
      style={{
        position: "absolute",
        left: cx - L / 2 + off,
        top: H / 2 - thick / 2,
        width: L,
        height: thick,
        rotate: `${angle}deg`,
        background: color,
        boxShadow: `0 0 ${glow}px ${glow / 3}px ${color}`,
        borderRadius: thick,
      }}
    />
  );

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          clipPath: `polygon(0px 0px, ${xTop}px 0px, ${xBot}px ${H}px, 0px ${H}px)`,
        }}
      >
        {children}
      </AbsoluteFill>
      {bar(150 * u, -170 * u, accent, 60 * u)}
      {bar(70 * u, 0, core, 50 * u)}
      {bar(18 * u, 90 * u, accent, 20 * u)}
    </AbsoluteFill>
  );
};

export const lightStreak = (
  props: StreakProps = {},
): TransitionPresentation<StreakProps> => ({
  component: LightStreakComp,
  props,
});

/* ------------------------------------------------------------------ */
/* whipPush — fast directional push with blur.                        */
/* ------------------------------------------------------------------ */
type WhipProps = { direction?: "left" | "right" | "up" | "down" };

const WhipComp: React.FC<TransitionPresentationComponentProps<WhipProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const { width: W, height: H } = useVideoConfig();
  const u = Math.min(W, H) / 1080;
  const dir = passedProps.direction ?? "left";
  const p = EASE_IN_OUT(presentationProgress);
  const horizontal = dir === "left" || dir === "right";
  const sign = dir === "left" || dir === "up" ? -1 : 1;
  const span = horizontal ? W : H;
  const offset =
    presentationDirection === "exiting"
      ? sign * span * p
      : -sign * span * (1 - p);
  const blur = Math.sin(Math.PI * p) * 36 * u;
  return (
    <AbsoluteFill
      style={{
        translate: horizontal ? `${offset}px 0px` : `0px ${offset}px`,
        filter: `blur(${blur}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const whipPush = (
  props: WhipProps = {},
): TransitionPresentation<WhipProps> => ({ component: WhipComp, props });

/* ------------------------------------------------------------------ */
/* irisFrom — circle reveal growing from a point (fractions of frame). */
/* ------------------------------------------------------------------ */
type IrisProps = { x?: number; y?: number; ring?: string };

const IrisComp: React.FC<TransitionPresentationComponentProps<IrisProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const { width: W, height: H } = useVideoConfig();
  const u = Math.min(W, H) / 1080;
  const x = (passedProps.x ?? 0.5) * W;
  const y = (passedProps.y ?? 0.5) * H;
  const p = EASE_IN_OUT(presentationProgress);
  const maxR = Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) * 1.05;
  const r = p * maxR;
  if (presentationDirection === "exiting") {
    return (
      <AbsoluteFill
        style={{
          scale: String(interpolate(p, [0, 1], [1, 0.94])),
          filter: `brightness(${interpolate(p, [0, 1], [1, 0.55])})`,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `circle(${r}px at ${x}px ${y}px)` }}>
        {children}
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: x - r,
          top: y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: "50%",
          border: `${4 * u}px solid ${passedProps.ring ?? "rgba(255,255,255,0.85)"}`,
          boxShadow: `0 0 ${40 * u}px ${passedProps.ring ?? "rgba(255,255,255,0.6)"}`,
          opacity: interpolate(p, [0, 0.1, 0.85, 1], [0, 1, 1, 0]),
        }}
      />
    </AbsoluteFill>
  );
};

export const irisFrom = (
  props: IrisProps = {},
): TransitionPresentation<IrisProps> => ({ component: IrisComp, props });

/* ------------------------------------------------------------------ */
/* cardFlyAway — old scene becomes a tilted 3D card and flies off.    */
/* ------------------------------------------------------------------ */
const CardFlyComp: React.FC<
  TransitionPresentationComponentProps<Record<string, never>>
> = ({ children, presentationDirection, presentationProgress }) => {
  const { width: W, height: H } = useVideoConfig();
  const u = Math.min(W, H) / 1080;
  const p = presentationProgress;
  if (presentationDirection === "entering") {
    return (
      <AbsoluteFill
        style={{
          zIndex: 1,
          scale: String(interpolate(EASE_OUT(p), [0, 1], [1.08, 1])),
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }
  const shrink = EASE_OUT(Math.min(1, p * 2.2));
  const fly = EASE_IN_OUT(Math.max(0, (p - 0.25) / 0.75));
  return (
    <AbsoluteFill style={{ zIndex: 2, perspective: 1600 * u }}>
      <AbsoluteFill
        style={{
          scale: String(interpolate(shrink, [0, 1], [1, 0.78])),
          rotate: `${interpolate(fly, [0, 1], [0, -10])}deg`,
          translate: `${interpolate(fly, [0, 1], [0, W * 0.35])}px ${interpolate(fly, [0, 1], [0, -H * 1.25])}px`,
          transform: `rotateX(${interpolate(shrink, [0, 1], [0, 18])}deg)`,
          borderRadius: interpolate(shrink, [0, 1], [0, 56 * u]),
          overflow: "hidden",
          boxShadow: `0 ${40 * u}px ${120 * u}px rgba(0,0,0,${0.55 * shrink})`,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const cardFlyAway = (): TransitionPresentation<
  Record<string, never>
> => ({
  component: CardFlyComp,
  props: {},
});

/* ------------------------------------------------------------------ */
/* blurDissolve — soft focus pull between scenes.                     */
/* ------------------------------------------------------------------ */
const BlurDissolveComp: React.FC<
  TransitionPresentationComponentProps<Record<string, never>>
> = ({ children, presentationDirection, presentationProgress }) => {
  const { width: W, height: H } = useVideoConfig();
  const u = Math.min(W, H) / 1080;
  const p = EASE_IN_OUT(presentationProgress);
  const entering = presentationDirection === "entering";
  return (
    <AbsoluteFill
      style={{
        opacity: entering ? p : 1 - p,
        filter: `blur(${(entering ? 1 - p : p) * 30 * u}px)`,
        scale: String(
          entering
            ? interpolate(p, [0, 1], [0.97, 1])
            : interpolate(p, [0, 1], [1, 1.05]),
        ),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const blurDissolve = (): TransitionPresentation<
  Record<string, never>
> => ({
  component: BlurDissolveComp,
  props: {},
});
