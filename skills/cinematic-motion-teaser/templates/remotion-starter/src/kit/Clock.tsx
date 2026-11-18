// Clock — slot-machine digits, the live countdown and the timer ring.
//
// Every digit column is a WHEEL at a fractional position: integer j sits at
// y = (j - pos) * lineHeight, so higher digits are below. Increasing values roll
// up (the new digit comes from below), decreasing values roll down (the new
// digit drops in from above), exactly like an odometer. Mid-roll the column gets
// a vertical-only motion blur (ghost copies of the strip). Everything is a pure
// function of the props: drive `seconds` / `value` from the frame.
//
//   <Countdown seconds={2700 - frame / fps} />                 45:00 → 44:59 … ticking, rose
//   <Countdown seconds={s} size="pill" />                       the list pill (rose wash)
//   <NumberRoll value={interpolate(frame,[0,30],[3,7])} />      3 → 7, odometer
//   <NumberRoll from="0000" value="4817" progress={p} spins={2} stagger={0.12} />   slot machine
//   <TimerRing size={48} progress={0.62} />                     the chat meet card ring
import React from "react";
import { Easing } from "remotion";
import { C, T, type TypeName } from "./theme";
import { fontInter, fontMono } from "./fonts";
import { RoseLight } from "./Buttons";

const easeRoll = Easing.bezier(0.3, 0, 0.2, 1);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const mod = (a: number, b: number) => ((a % b) + b) % b;

/* ───────────────────────────── the wheel ───────────────────────────── */

export type DigitWheelProps = {
  /** Fractional wheel position; the digit shown is pos mod base. */
  pos: number;
  base?: number;
  lineHeight: number;
  /** Peak vertical motion blur (px, local units) at mid-roll. */
  blur?: number;
  /** Render integer j as this text instead of its digit (e.g. hide a leading zero). */
  glyph?: (j: number) => string;
  /** Fade the top/bottom of the window (slot look). Default true. */
  fadeEdges?: boolean;
  style?: React.CSSProperties;
};

/** One masked digit column. Inherits font, size and colour from its parent. */
export const DigitWheel: React.FC<DigitWheelProps> = ({
  pos,
  base = 10,
  lineHeight,
  blur = 0,
  glyph,
  fadeEdges = true,
  style,
}) => {
  const j0 = Math.floor(pos);
  const frac = pos - j0;
  const settled = Math.round(pos);
  const text = (j: number) => (glyph ? glyph(j) : String(mod(j, base)));
  // Vertical motion blur as ghost copies of the strip (robust under any transform).
  const sigma = frac > 0.001 && frac < 0.999 ? blur * Math.sin(Math.PI * frac) : 0;
  // More copies for bigger blur, so large digits streak smoothly instead of stacking.
  const steps = Math.min(9, Math.max(3, Math.round(sigma / 1.6)));
  const ghosts =
    sigma > 0.25
      ? Array.from({ length: steps * 2 + 1 }, (_, i) => {
          const k = i - steps;
          const w = Math.exp(-(k * k) / (2 * Math.pow(steps / 1.7, 2)));
          return { dy: (k / steps) * 1.7 * sigma, a: (0.5 * w) / Math.max(1, steps / 3) + (k === 0 ? 0.12 : 0) };
        })
      : [{ dy: 0, a: 1 }];
  const mask = "linear-gradient(rgba(0,0,0,0) 0%, #000 16%, #000 84%, rgba(0,0,0,0) 100%)";
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        height: lineHeight,
        lineHeight: `${lineHeight}px`,
        overflow: "hidden",
        verticalAlign: "top",
        WebkitMaskImage: fadeEdges ? mask : undefined,
        maskImage: fadeEdges ? mask : undefined,
        ...style,
      }}
    >
      {/* width holder: the settled glyph */}
      <span style={{ visibility: "hidden" }}>{text(settled) || "0"}</span>
      {ghosts.map((g, gi) => (
        <span
          key={gi}
          style={{ position: "absolute", left: 0, right: 0, top: g.dy, height: lineHeight, opacity: g.a }}
        >
          {[j0 - 1, j0, j0 + 1, j0 + 2].map((j) => {
            const y = (j - pos) * lineHeight;
            if (Math.abs(y) >= lineHeight + Math.abs(g.dy)) return null;
            return (
              <span
                key={j}
                style={{ position: "absolute", left: 0, right: 0, top: y, height: lineHeight, textAlign: "center" }}
              >
                {text(j)}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
};

/* ───────────────────────────── odometer maths ───────────────────────────── */

/** Roll curve inside one unit: still for most of it, an eased roll in its last `roll` fraction. */
const rollFn = (f: number, roll: number) =>
  roll >= 1 ? f : easeRoll(clamp01((f - (1 - roll)) / roll));

/** Wheel position of the column with place value `place` for a continuous value `v`. */
export const odometerPos = (v: number, place: number, roll: number) => {
  const whole = Math.floor(v / place);
  const lower = v - whole * place; // [0, place)
  const carry = lower >= place - 1 ? rollFn(lower - (place - 1), roll) : 0;
  return whole + carry;
};

/* ───────────────────────────── NumberRoll ───────────────────────────── */

type FontSpec = {
  /** A type token (default monoClock for numbers in mono, else inherits). */
  font?: TypeName;
  /** Font size override (px / pt). */
  size?: number;
  lineHeight?: number;
  color?: string;
  weight?: number;
  /** "mono" | "inter" | "inherit" (default: inherit, or the token's family). */
  family?: "mono" | "inter" | "inherit";
  letterSpacing?: number;
};

const fontCss = (
  f: FontSpec,
): { css: React.CSSProperties; lh: number | null; size: number | null } => {
  const tok = f.font ? T[f.font] : null;
  const size = f.size ?? tok?.size ?? null;
  const lh =
    f.lineHeight ??
    (tok
      ? (tok.lineHeight / tok.size) * (size ?? tok.size)
      : size
        ? size * 1.25
        : null);
  const fam = f.family ?? (tok ? tok.family : "inherit");
  return {
    size,
    lh,
    css: {
      fontFamily:
        fam === "mono" ? fontMono : fam === "inter" ? fontInter : undefined,
      fontSize: size ?? undefined,
      lineHeight: lh ? `${lh}px` : undefined,
      fontWeight: f.weight ?? tok?.weight,
      letterSpacing:
        f.letterSpacing ??
        (tok ? tok.letterSpacing * ((size ?? tok.size) / tok.size) : undefined),
      color: f.color,
      fontVariantNumeric: "tabular-nums",
    },
  };
};

export type NumberRollProps = FontSpec & {
  /**
   * number: an odometer — fractional values roll (each unit rolls during its last
   * `roll` fraction). string: the digits to land on (slot machine with `from`/`progress`).
   */
  value: number | string;
  /** String mode: the digits to start from (same length). Default all "0". */
  from?: string;
  /** String mode: 0..1 progress from `from` to `value`. Default 1. */
  progress?: number;
  /** String mode: extra full turns per column before landing (slot machine). */
  spins?: number;
  /** String mode: per-column delay as a fraction of the progress (columns land left → right). */
  stagger?: number;
  /** Number mode: fraction of each unit spent rolling (0..1]. Default 0.35. 1 = continuous. */
  roll?: number;
  /** Number mode: minimum number of digits (zero padded). */
  minDigits?: number;
  /** Peak motion blur in px (local). Default 12 % of the font size (×speed for spins). 0 = off. */
  blur?: number;
  style?: React.CSSProperties;
};

/** Slot-machine / odometer digits. Non-digit characters stay static. */
export const NumberRoll: React.FC<NumberRollProps> = ({
  value,
  from,
  progress = 1,
  spins = 0,
  stagger = 0,
  roll = 0.35,
  minDigits = 1,
  blur,
  style,
  ...font
}) => {
  const f = fontCss(font);
  // When the font size is inherited, measure in em so the wheel still works.
  const lh = f.lh ?? 20;
  const pb = blur ?? (f.size ? f.size * 0.12 : 2);
  const cols: React.ReactNode[] = [];

  if (typeof value === "number") {
    const v = Math.max(0, value);
    const n = Math.max(minDigits, String(Math.floor(v + 1)).length);
    for (let c = n - 1; c >= 0; c--) {
      const place = Math.pow(10, c);
      const pos = odometerPos(v, place, roll);
      const isLead = c > 0 && c >= minDigits;
      cols.push(
        <DigitWheel
          key={c}
          pos={pos}
          lineHeight={lh}
          blur={pb}
          glyph={isLead ? (j) => (j <= 0 ? "" : String(mod(j, 10))) : undefined}
          fadeEdges
        />,
      );
    }
  } else {
    const to = value;
    const src = (from ?? to.replace(/\d/g, "0")).padStart(to.length, "0");
    const digitIdx = [...to]
      .map((ch, i) => (/\d/.test(ch) ? i : -1))
      .filter((i) => i >= 0);
    const span = Math.max(0, 1 - stagger * Math.max(0, digitIdx.length - 1));
    [...to].forEach((ch, i) => {
      if (!/\d/.test(ch)) {
        cols.push(<span key={i}>{ch}</span>);
        return;
      }
      const order = digitIdx.indexOf(i);
      const pc =
        span > 0
          ? clamp01((progress - order * stagger) / span)
          : progress >= 1
            ? 1
            : 0;
      const a = Number(/\d/.test(src[i] ?? "0") ? src[i] : "0");
      const b = Number(ch);
      const steps = mod(b - a, 10) + 10 * spins;
      const e = easeRoll(pc);
      const pos = a + e * steps;
      // Spins blur more: scale by speed (steps), capped.
      const speed = Math.min(2.2, 0.6 + steps * 0.08);
      cols.push(
        <DigitWheel key={i} pos={pos} lineHeight={lh} blur={pb * speed} />,
      );
    });
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "flex-start",
        whiteSpace: "pre",
        ...f.css,
        ...style,
      }}
    >
      {cols}
    </span>
  );
};

/* ───────────────────────────── Countdown ───────────────────────────── */

export type Urgency = "calm" | "warn" | "critical" | "expired";
export type CountdownSize =
  | "pill"
  | "chip"
  | "bar"
  | "clock"
  | "display"
  | "hero"
  | "code";

const SIZE_TOKEN: Record<CountdownSize, TypeName> = {
  pill: "monoPill",
  chip: "monoChip",
  bar: "monoLg",
  clock: "monoClock",
  display: "monoDisplay",
  hero: "monoXl",
  code: "monoCode",
};

/** "09:41". Minutes are not capped at 59. */
export const formatClock = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

/** The app's urgency tiers: warn at <= 25 % left, critical in the last 60 s. */
export const urgencyFor = (seconds: number, totalSeconds = 45 * 60): Urgency =>
  seconds <= 0
    ? "expired"
    : seconds <= 60
      ? "critical"
      : seconds <= totalSeconds * 0.25
        ? "warn"
        : "calm";

export type CountdownProps = {
  /** Seconds left (fractional values animate the tick roll). */
  seconds: number;
  /** A size token ("clock" = the chat card's 32/40, "display" = the match card's 40/48, "pill", "chip"…) or a font size. */
  size?: CountdownSize | number;
  /** Urgency look. Bare digits stay rose (grey once expired); the pill steps up. Default calm. */
  variant?: Urgency;
  /** Draw the list pill around it (default: true for size "pill"/"chip"). */
  pill?: boolean;
  /** Animate each tick: true (0.3 s roll), a number (roll seconds) or false (snap). */
  roll?: boolean | number;
  /** Peak motion blur (px, local). */
  blur?: number;
  color?: string;
  /** Text before the clock, same font ("Valid for "). */
  prefix?: string;
  /** Pulse phase 0..1 for the critical pill's light (drive from the frame). */
  pulse?: number;
  style?: React.CSSProperties;
};

/** mm:ss in JetBrains Mono 700, each column a rolling wheel. Rose = live. */
export const Countdown: React.FC<CountdownProps> = ({
  seconds,
  size = "clock",
  variant = "calm",
  pill,
  roll = true,
  blur,
  color,
  prefix,
  pulse = 0,
  style,
}) => {
  const tokenName: TypeName =
    typeof size === "number" ? "monoClock" : SIZE_TOKEN[size];
  const tok = T[tokenName];
  const fs = typeof size === "number" ? size : tok.size;
  const lh = (tok.lineHeight / tok.size) * fs;
  const ls = tok.letterSpacing * (fs / tok.size);
  const boxed = pill ?? (size === "pill" || size === "chip");
  const chip = size === "chip";
  const v = Math.max(0, seconds);
  const r = roll === false ? 0 : typeof roll === "number" ? roll : 0.3;
  const pos = (place: number) =>
    r <= 0 ? Math.floor(v / place) : odometerPos(v, place, r);
  const pb = blur ?? fs * 0.1;
  const minutesCols = Math.floor(v / 60) >= 100 ? 3 : 2;

  const look =
    variant === "warn" || variant === "critical"
      ? { bg: C.roseFill, border: C.roseFill, digits: C.text, glow: true }
      : variant === "expired"
        ? {
            bg: C.expiredTint,
            border: C.lineStrong,
            digits: C.expired,
            glow: false,
          }
        : { bg: C.roseTint, border: C.roseLine, digits: C.rose, glow: true };
  const digitColor =
    color ?? (boxed ? look.digits : variant === "expired" ? C.text3 : C.rose);

  const digits = (
    <span
      style={{
        display: "inline-flex",
        fontFamily: fontMono,
        fontWeight: 700,
        fontSize: fs,
        lineHeight: `${lh}px`,
        letterSpacing: ls,
        color: digitColor,
        whiteSpace: "pre",
        fontVariantNumeric: "tabular-nums",
        position: "relative",
      }}
    >
      {prefix ? <span>{prefix}</span> : null}
      {minutesCols === 3 ? (
        <DigitWheel pos={pos(6000)} lineHeight={lh} blur={pb} />
      ) : null}
      <DigitWheel pos={pos(600)} lineHeight={lh} blur={pb} />
      <DigitWheel pos={pos(60)} lineHeight={lh} blur={pb} />
      <span>:</span>
      <DigitWheel pos={pos(10)} base={6} lineHeight={lh} blur={pb} />
      <DigitWheel pos={pos(1)} lineHeight={lh} blur={pb} />
    </span>
  );

  if (!boxed)
    return <span style={{ display: "inline-flex", ...style }}>{digits}</span>;

  const h = chip ? 24 : 30;
  const radius = chip ? 8 : 15;
  const lightOpacity =
    variant === "critical"
      ? 0.5 * (0.45 + 0.55 * (0.5 + 0.5 * Math.cos(pulse * Math.PI * 2)))
      : 0.5;
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        height: h,
        padding: `0 ${chip ? 8 : 11}px`,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {look.glow && !chip ? (
        <RoseLight
          inset={{ left: -10, right: -10, top: -8, bottom: -14 }}
          opacity={lightOpacity}
        />
      ) : null}
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          background: look.bg,
          border: chip ? undefined : `1px solid ${look.border}`,
          boxSizing: "border-box",
        }}
      />
      {digits}
    </span>
  );
};

/* ───────────────────────────── TimerRing ───────────────────────────── */

/** The mark's gap: ≈ 65°. */
export const MEET_GAP_DEG = 65;

export type TimerRingProps = {
  /** Diameter (pt / px). */
  size?: number;
  /** Fraction of time LEFT, 0..1. The arc runs down clockwise from the gap. */
  progress?: number;
  /** Stroke width. Default max(3, size / 24). */
  stroke?: number;
  color?: string;
  track?: string;
  /** The two white meet dots in the gap. Default: on from 120 pt (like the app). */
  dots?: boolean;
  /** The logo's gap at 12 o'clock: true (65°), a number of degrees, or false. Default: on when dots are. */
  gap?: boolean | number;
  /** Centre content (a Countdown, a photo…). */
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

/** The meet ring as a countdown: rose arc on a hairline track (TimerRing.tsx). */
export const TimerRing: React.FC<TimerRingProps> = ({
  size = 64,
  progress = 1,
  stroke,
  color = C.rose,
  track = C.lineStrong,
  dots,
  gap,
  children,
  style,
}) => {
  const sw = stroke ?? Math.max(3, Math.round(size / 24));
  const showDots = dots ?? size >= 120;
  const gapDeg =
    gap === undefined
      ? showDots
        ? MEET_GAP_DEG
        : 0
      : gap === true
        ? MEET_GAP_DEG
        : gap === false
          ? 0
          : gap;
  const p = clamp01(progress);
  const c = size / 2;
  const r = Math.max(0, (size - sw) / 2);
  const circ = 2 * Math.PI * r;
  const arc = circ * ((360 - gapDeg) / 360) * p;
  const rot = -90 + gapDeg / 2;
  const dotA = ((gapDeg || MEET_GAP_DEG) * 0.217 * Math.PI) / 180;
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        {/* the app draws the hairline track as a full circle, gap or not */}
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={sw}
        />
        {arc > 0.5 ? (
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeDasharray={`${arc} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(${rot} ${c} ${c})`}
          />
        ) : null}
        {showDots
          ? [-dotA, dotA].map((a, i) => (
              <circle
                key={i}
                cx={c + r * Math.sin(a)}
                cy={c - r * Math.cos(a)}
                r={sw * 0.46}
                fill={C.text}
              />
            ))
          : null}
      </svg>
      {children ? <div style={{ position: "relative" }}>{children}</div> : null}
    </div>
  );
};
