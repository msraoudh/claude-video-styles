// Effects — accents and atmosphere. All frame-deterministic (random(seed) /
// @remotion/noise), all absolutely positioned inside their parent unless noted.
//
//   <Burst progress={p} />                         the match heart's 12-dot burst (24 → 64 pt, 1.2 s ease-out-cubic)
//   <Sparkles seed="hook" count={14} />            ✦ pops and twinkles
//   <PulseRings size={600} />                      presence ripple: concentric OPEN rings with the mark's gap
//   <Bokeh seed="bar" count={18} />                soft out-of-focus lights drifting with parallax
//   <Grain opacity={0.08} />                       film grain overlay (public/brand/grain.jpg)
//   <Glow preset="match" />                        the app's rose radial glows
//   <TapRipple x={195} y={760} progress={p} />     a finger tap
//   <CheckMark progress={p} size={28} />           a check drawing on
import React from "react";
import {
  Easing,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { noise2D } from "@remotion/noise";
import { C, GLOW, type GlowPreset } from "./theme";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOutCubic = Easing.out(Easing.cubic);

/* ───────────────────────────── Burst ───────────────────────────── */

export type BurstProps = {
  /** 0..1 (linear; eased internally with the app's ease-out-cubic unless eased=false). */
  progress: number;
  count?: number;
  colors?: readonly string[];
  /** Start / end distance from the centre (pt). App: 24 → 64. */
  from?: number;
  radius?: number;
  /** Dot sizes: every third dot is `big`. App: 7 / 5. */
  big?: number;
  small?: number;
  /** Centre inside the parent (px). Default the parent's centre. */
  x?: number | string;
  y?: number | string;
  eased?: boolean;
  style?: React.CSSProperties;
};

export const Burst: React.FC<BurstProps> = ({
  progress,
  count = 12,
  colors = [C.rose, C.text, C.roseSoft, C.roseFill],
  from = 24,
  radius = 64,
  big = 7,
  small = 5,
  x = "50%",
  y = "50%",
  eased = true,
  style,
}) => {
  const p = eased ? easeOutCubic(clamp01(progress)) : clamp01(progress);
  if (progress <= 0 || progress >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 0,
        height: 0,
        pointerEvents: "none",
        ...style,
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        const s = i % 3 === 0 ? big : small;
        const d = from + (radius - from) * p;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: -s / 2,
              top: -s / 2,
              width: s,
              height: s,
              borderRadius: "50%",
              background: colors[i % colors.length],
              opacity: 1 - p,
              translate: `${Math.cos(a) * d}px ${Math.sin(a) * d}px`,
              scale: String(1 - p * 0.4),
            }}
          />
        );
      })}
    </div>
  );
};

/* ───────────────────────────── Sparkles ───────────────────────────── */

const SPARK =
  "M12 0 C12.9 6.6 17.4 11.1 24 12 C17.4 12.9 12.9 17.4 12 24 C11.1 17.4 6.6 12.9 0 12 C6.6 11.1 11.1 6.6 12 0 Z";

/** A single ✦ (4-point sparkle). */
export const Sparkle: React.FC<{
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ size = 24, color = C.text, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ display: "block", ...style }}
  >
    <path d={SPARK} fill={color} />
  </svg>
);

export type SparklesProps = {
  seed?: string;
  count?: number;
  /** Box inside the parent (px). Default the whole parent. */
  area?: { x: number; y: number; w: number; h: number };
  /**
   * 0..1 one-shot: each sparkle pops once at a random moment. Omit for a looping twinkle.
   */
  progress?: number;
  /** Size range (px). */
  sizes?: [number, number];
  colors?: readonly string[];
  style?: React.CSSProperties;
};

export const Sparkles: React.FC<SparklesProps> = ({
  seed = "spark",
  count = 12,
  area,
  progress,
  sizes = [10, 26],
  colors = [C.text, C.text, C.roseSoft],
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        ...(area
          ? { left: area.x, top: area.y, width: area.w, height: area.h }
          : { inset: 0 }),
        pointerEvents: "none",
        ...style,
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        const r = (k: string) => random(`${seed}-${k}-${i}`);
        const size = sizes[0] + r("s") * (sizes[1] - sizes[0]);
        let q: number;
        if (progress !== undefined) {
          const t0 = r("t") * 0.7;
          const life = 0.22 + r("l") * 0.18;
          q = clamp01((progress - t0) / life);
          if (q <= 0 || q >= 1) return null;
        } else {
          const period = (1.6 + r("p") * 1.6) * fps;
          q = ((frame + r("o") * period) % period) / period;
        }
        const env = Math.pow(Math.sin(Math.PI * q), 0.7);
        if (env < 0.01) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${r("x") * 100}%`,
              top: `${r("y") * 100}%`,
              translate: "-50% -50%",
              scale: String(
                env *
                  (progress !== undefined
                    ? interpolate(q, [0, 0.35, 1], [0.2, 1.15, 0.6])
                    : 1),
              ),
              rotate: `${q * 70 - 20}deg`,
              opacity: env,
              filter: `drop-shadow(0 0 ${size * 0.35}px rgba(255,255,255,0.55))`,
            }}
          >
            <Sparkle size={size} color={colors[i % colors.length]} />
          </div>
        );
      })}
    </div>
  );
};

/* ───────────────────────────── rings ───────────────────────────── */

/** An open ring arc with the mark's gap (±32.5° at 12 o'clock), as an SVG path. */
export const openRingPath = (
  cx: number,
  cy: number,
  r: number,
  halfGapDeg = 32.5,
) => {
  const a = (halfGapDeg * Math.PI) / 180;
  const dx = r * Math.sin(a);
  const y = cy - r * Math.cos(a);
  return `M${cx + dx} ${y}A${r} ${r} 0 1 1 ${cx - dx} ${y}`;
};

export type PulseRingsProps = {
  /** Outer diameter (px) the ripples grow to. */
  size: number;
  /** Ripple phase 0..1 (loops). Omit to loop on its own every `period` seconds. */
  progress?: number;
  period?: number;
  count?: number;
  color?: string;
  /** Peak opacity. */
  opacity?: number;
  /** Where a ripple starts, as a fraction of `size`. */
  from?: number;
  stroke?: number;
  /** The mark's gap at 12 o'clock (degrees either side). 0 = closed ring. */
  gap?: number;
  style?: React.CSSProperties;
};

/** Presence ripple: concentric open rings sharing the logo's gap, growing and fading. */
export const PulseRings: React.FC<PulseRingsProps> = ({
  size,
  progress,
  period = 2.8,
  count = 3,
  color = C.text,
  opacity = 0.55,
  from = 0.35,
  stroke = 1.5,
  gap = 32.5,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const base = progress ?? frame / (period * fps);
  const c = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        marginLeft: -size / 2,
        marginTop: -size / 2,
        overflow: "visible",
        pointerEvents: "none",
        ...style,
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        const p = (((base + i / count) % 1) + 1) % 1;
        const e = Easing.out(Easing.quad)(p);
        const r = (from + (1 - from) * e) * (c - stroke);
        const op = opacity * (1 - p) * Math.min(1, p * 6);
        return gap > 0 ? (
          <path
            key={i}
            d={openRingPath(c, c, r, gap)}
            fill="none"
            stroke={color}
            strokeOpacity={op}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        ) : (
          <circle
            key={i}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={color}
            strokeOpacity={op}
            strokeWidth={stroke}
          />
        );
      })}
    </svg>
  );
};

/** The welcome screen's three hairline rings (r 92 / 132 / 172 of 172, opacity 1 / .65 / .35). */
export const StaticRings: React.FC<{
  size: number;
  color?: string;
  gap?: number;
  stroke?: number;
  style?: React.CSSProperties;
}> = ({ size, color = C.lineStrong, gap = 0, stroke = 1, style }) => {
  const c = size / 2;
  const rings = [
    { r: 92 / 172, o: 1 },
    { r: 132 / 172, o: 0.65 },
    { r: 1, o: 0.35 },
  ];
  return (
    <svg
      width={size}
      height={size}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        marginLeft: -size / 2,
        marginTop: -size / 2,
        overflow: "visible",
        pointerEvents: "none",
        ...style,
      }}
    >
      {rings.map((g, i) =>
        gap > 0 ? (
          <path
            key={i}
            d={openRingPath(c, c, g.r * (c - stroke), gap)}
            fill="none"
            stroke={color}
            strokeOpacity={g.o}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        ) : (
          <circle
            key={i}
            cx={c}
            cy={c}
            r={g.r * (c - stroke)}
            fill="none"
            stroke={color}
            strokeOpacity={g.o}
            strokeWidth={stroke}
          />
        ),
      )}
    </svg>
  );
};

/* ───────────────────────────── Bokeh ───────────────────────────── */

export type BokehProps = {
  seed?: string;
  count?: number;
  colors?: readonly string[];
  /** Blur range (px): small blur = far & slow, big blur = near & fast (parallax). */
  blurRange?: [number, number];
  /** Diameter range (px). */
  sizeRange?: [number, number];
  /** Drift amplitude (px) for the nearest plane. */
  drift?: number;
  /** Extra horizontal pan (px) applied with parallax by depth — e.g. a camera move. */
  pan?: number;
  opacity?: number;
  style?: React.CSSProperties;
};

/** Soft out-of-focus lights (bar bokeh), deterministic, drifting with parallax. */
export const Bokeh: React.FC<BokehProps> = ({
  seed = "bokeh",
  count = 16,
  colors = [
    "255,170,90",
    "255,61,95",
    "255,210,150",
    "176,90,232",
    "255,122,144",
  ],
  blurRange = [6, 28],
  sizeRange = [40, 180],
  drift = 30,
  pan = 0,
  opacity = 0.55,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        ...style,
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        const r = (k: string) => random(`${seed}-${k}-${i}`);
        const depth = r("d"); // 0 far … 1 near
        const size =
          sizeRange[0] +
          (sizeRange[1] - sizeRange[0]) *
            (0.3 + 0.7 * depth) *
            (0.6 + 0.4 * r("s"));
        const blur = blurRange[0] + (blurRange[1] - blurRange[0]) * depth;
        const amp = drift * (0.35 + 0.65 * depth);
        const dx =
          noise2D(`${seed}x${i}`, t * 0.08, i) * amp +
          pan * (0.3 + 0.7 * depth);
        const dy = noise2D(`${seed}y${i}`, i, t * 0.08) * amp;
        const col = colors[Math.floor(r("c") * colors.length)];
        const a =
          opacity *
          (0.35 + 0.65 * r("a")) *
          (0.8 + 0.2 * Math.sin(t * (0.6 + r("w")) + i));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${r("x") * 100}%`,
              top: `${r("y") * 100}%`,
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(${col},${a}) 0%, rgba(${col},${a * 0.75}) 55%, rgba(${col},${a * 0.25}) 68%, rgba(${col},0) 72%)`,
              filter: `blur(${blur}px)`,
              translate: `${dx}px ${dy}px`,
            }}
          />
        );
      })}
    </div>
  );
};

/* ───────────────────────────── Grain ───────────────────────────── */

/** Film grain over everything (public/brand/grain.jpg), offset every 2 frames. */
export const Grain: React.FC<{
  opacity?: number;
  blend?: "overlay" | "soft-light" | "screen";
  /** Change the offset every N frames. */
  step?: number;
  style?: React.CSSProperties;
}> = ({ opacity = 0.08, blend = "overlay", step = 2, style }) => {
  const frame = useCurrentFrame();
  const k = Math.floor(frame / step);
  const ox = (random(`grain-x-${k}`) - 0.5) * 8;
  const oy = (random(`grain-y-${k}`) - 0.5) * 8;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        mixBlendMode: blend,
        opacity,
        ...style,
      }}
    >
      <Img
        src={staticFile("brand/grain.jpg")}
        style={{
          position: "absolute",
          left: "-10%",
          top: "-10%",
          width: "120%",
          height: "120%",
          objectFit: "cover",
          translate: `${ox}% ${oy}%`,
        }}
      />
    </div>
  );
};

/* ───────────────────────────── Glow ───────────────────────────── */

export type GlowProps = {
  /** The app's presets (theme/glow.ts): hero (welcome), match (match / validated / code), card (corner). */
  preset?: GlowPreset;
  /** Or a custom rose blob, in % of the box. */
  custom?: {
    x: number;
    y: number;
    rx: number;
    ry: number;
    opacity: number;
    color?: string;
  };
  /** Multiplier (0..1+). */
  opacity?: number;
  style?: React.CSSProperties;
};

/** Rose radial light. Coloured light is always a glow, never a shadow. */
export const Glow: React.FC<GlowProps> = ({
  preset = "match",
  custom,
  opacity = 1,
  style,
}) => {
  const bg = custom
    ? `radial-gradient(${custom.rx}% ${custom.ry}% at ${custom.x}% ${custom.y}%, rgba(${custom.color ?? "255,61,95"},${custom.opacity}) 0%, rgba(${custom.color ?? "255,61,95"},${custom.opacity * 0.45}) 40%, rgba(${custom.color ?? "255,61,95"},0) 80%)`
    : GLOW[preset];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: bg,
        opacity,
        pointerEvents: "none",
        ...style,
      }}
    />
  );
};

/* ───────────────────────────── interaction ───────────────────────────── */

/** A finger tap: a soft white dot pressing in + a ring expanding out. progress 0..1 over ~0.45 s. */
export const TapRipple: React.FC<{
  x: number;
  y: number;
  progress: number;
  size?: number;
  style?: React.CSSProperties;
}> = ({ x, y, progress, size = 56, style }) => {
  if (progress <= 0 || progress >= 1) return null;
  const press = Math.sin(Math.PI * clamp01(progress / 0.6));
  const ring = easeOutCubic(clamp01((progress - 0.15) / 0.85));
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 0,
        height: 0,
        pointerEvents: "none",
        zIndex: 60,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -size / 2,
          top: -size / 2,
          width: size,
          height: size,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.25) 55%, rgba(255,255,255,0) 72%)",
          opacity: press,
          scale: String(0.7 + 0.3 * press),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -size / 2,
          top: -size / 2,
          width: size,
          height: size,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.7)",
          boxSizing: "border-box",
          opacity: (1 - ring) * 0.8,
          scale: String(0.6 + ring * 1.2),
        }}
      />
    </div>
  );
};

/** A check mark drawing on (stroke-dashoffset). */
export const CheckMark: React.FC<{
  progress: number;
  size?: number;
  color?: string;
  stroke?: number;
  style?: React.CSSProperties;
}> = ({ progress, size = 28, color = C.text, stroke = 3, style }) => {
  const len = 30;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      style={{ display: "block", ...style }}
    >
      <path
        d="M6 14.5 L11.5 20 L22 8.5"
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - easeOutCubic(clamp01(progress)))}
      />
    </svg>
  );
};
