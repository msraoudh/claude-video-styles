import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { fontInter, fontMono } from "../../kit";
import { rand, useGlobalFrame } from "../../lib/beat";
import { L } from "../../lib/look";
import { EASE_OUT } from "../../lib/motion";

/** Local helpers for the OPEN section (cold open + the world). Everything is driven by GLOBAL frames. */

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const lin = (f: number, a: number, b: number, from: number, to: number, easing?: (t: number) => number) =>
  interpolate(f, [a, b], [from, to], { ...clamp, easing });

/** Is global frame g inside any [start, start+len) window? */
export const inWindows = (g: number, starts: number[], len: number) => starts.some((s) => g >= s && g < s + len);

/** Big trailer type: Inter 800, uppercase, tight tracking. */
export const bigType = (size: number, color: string = L.steel): React.CSSProperties => ({
  fontFamily: fontInter,
  fontWeight: 800,
  fontSize: size,
  letterSpacing: "-0.045em",
  lineHeight: 0.92,
  textTransform: "uppercase",
  color,
  whiteSpace: "nowrap",
});

/** Small HUD type: JetBrains Mono caps, wide tracking. */
export const monoType = (size: number, color: string = L.steel2, spacing = 0.42): React.CSSProperties => ({
  fontFamily: fontMono,
  fontWeight: 500,
  fontSize: size,
  letterSpacing: `${spacing}em`,
  textTransform: "uppercase",
  color,
  whiteSpace: "nowrap",
});

type Tint = { color: string; outline?: boolean } | null;
export const TintCtx = React.createContext<Tint>(null);
const tintStyle = (t: Tint, color: string): React.CSSProperties =>
  !t ? { color } : t.outline ? { color: "transparent", WebkitTextStroke: `3px ${t.color}` } : { color: t.color };

/** Big trailer word (Inter 800 caps). Obeys the slam tint (ghost / outline echo copies). */
export const Big: React.FC<{ size: number; color?: string; children: React.ReactNode; style?: React.CSSProperties; glow?: string }> = ({ size, color = L.steel, children, style, glow }) => {
  const t = React.useContext(TintCtx);
  return <div style={{ ...bigType(size, color), ...tintStyle(t, color), textShadow: t || !glow ? undefined : glow, ...style }}>{children}</div>;
};
/** A coloured span that obeys the slam tint. */
export const C: React.FC<{ c: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ c, children, style }) => {
  const t = React.useContext(TintCtx);
  return <span style={{ ...tintStyle(t, c), ...style }}>{children}</span>;
};

/**
 * Text that SLAMS in at global frame `at` (VHS « REC-FREEZE » recipe): it arrives as three sheared tracking
 * bands that SNAP into register in ~5 frames, with an overshoot scale, chromatic ghosts (cyan/blood) that
 * collapse, a short shake, and optional outline echoes bursting outward (a light « portal » burst).
 * `y` = vertical centre in px. Nothing before `at` / from `until`.
 */
export const Slam: React.FC<{
  at: number;
  until?: number;
  y: number;
  children: React.ReactNode;
  from?: number;
  grow?: number;
  shake?: number;
  ghost?: number;
  bands?: number; // px shear of the 3 bands on landing (0 = off)
  echo?: string; // outline echo colour (undefined = off)
  style?: React.CSSProperties;
  x?: number;
  pulse?: number; // extra scale on each beat (pass beatPulse from caller)
}> = ({ at, until = 1e9, y, children, from = 1.32, grow = 0.035, shake = 10, ghost = 22, bands = 0, echo, style, x = 540, pulse = 0 }) => {
  const g = useGlobalFrame();
  const t = g - at;
  if (t < 0 || g >= until) return null;
  const s = lin(t, 0, 6, from, 1, EASE_OUT) * (1 + (grow * t) / 60) * (1 + pulse);
  const k = Math.exp(-t / 2.6);
  const sh = shake * k;
  const dx = (rand(g * 3.7 + at) - 0.5) * 2 * sh;
  const dy = (rand(g * 5.3 + at) - 0.5) * 2 * sh;
  const gh = ghost * k;
  const base = `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(${s})`;
  const wrap: React.CSSProperties = { position: "absolute", left: x, top: y, transform: base, textAlign: "center", ...style };
  const shear = bands * Math.max(0, 1 - t / 5) ** 2;
  const bandCuts: Array<[number, number, number]> = [
    [0, 64, -1],
    [36, 30, 0.7],
    [70, 0, -0.45],
  ];
  const body =
    shear > 0.5 ? (
      bandCuts.map(([top, bottom, dir], i) => (
        <div key={i} style={{ ...wrap, transform: `${base} translateX(${dir * shear}px)`, clipPath: `inset(${top}% -20% ${bottom}% -20%)` }}>
          {children}
        </div>
      ))
    ) : (
      <div style={wrap}>{children}</div>
    );
  const echoes = echo
    ? [0, 1, 2].map((i) => {
        const e = t - i * 2;
        if (e < 0 || e > 8) return null;
        const es = 1 + e * 0.035 * (1 + i * 0.4);
        return (
          <div key={`e${i}`} style={{ ...wrap, transform: `${base} scale(${es})`, opacity: (1 - e / 8) * 0.35 }}>
            <TintCtx.Provider value={{ color: echo, outline: true }}>{children}</TintCtx.Provider>
          </div>
        );
      })
    : null;
  return (
    <>
      {echoes}
      {gh > 0.6 ? (
        <>
          <div style={{ ...wrap, transform: `${base} translate(${gh}px, 0)`, opacity: 0.6, mixBlendMode: "screen" }}>
            <TintCtx.Provider value={{ color: L.cyan }}>{children}</TintCtx.Provider>
          </div>
          <div style={{ ...wrap, transform: `${base} translate(${-gh}px, 0)`, opacity: 0.6, mixBlendMode: "screen" }}>
            <TintCtx.Provider value={{ color: L.blood }}>{children}</TintCtx.Provider>
          </div>
        </>
      ) : null}
      {body}
    </>
  );
};
/** Thin horizontal scan line with a soft glow band. */
export const ScanLine: React.FC<{ y: number; opacity?: number; color?: string }> = ({ y, opacity = 0.3, color = L.cyan }) => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: y - 60, height: 120, opacity: opacity * 0.35, background: `linear-gradient(180deg, rgba(0,0,0,0), ${color}22 50%, rgba(0,0,0,0))` }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: y, height: 2, opacity, background: `linear-gradient(90deg, rgba(0,0,0,0), ${color} 20%, ${color} 80%, rgba(0,0,0,0))`, boxShadow: `0 0 18px ${color}` }} />
  </>
);

/** HUD corner brackets on a rectangle. */
export const Brackets: React.FC<{ x0: number; y0: number; x1: number; y1: number; len?: number; color?: string; opacity?: number }> = ({ x0, y0, x1, y1, len = 46, color = L.steel3, opacity = 1 }) => {
  const b = (style: React.CSSProperties) => <div style={{ position: "absolute", width: len, height: len, borderColor: color, borderStyle: "solid", borderWidth: 0, opacity, ...style }} />;
  return (
    <>
      {b({ left: x0, top: y0, borderLeftWidth: 2, borderTopWidth: 2 })}
      {b({ left: x1 - len, top: y0, borderRightWidth: 2, borderTopWidth: 2 })}
      {b({ left: x0, top: y1 - len, borderLeftWidth: 2, borderBottomWidth: 2 })}
      {b({ left: x1 - len, top: y1 - len, borderRightWidth: 2, borderBottomWidth: 2 })}
    </>
  );
};

/** Card background: ink + a faint cold floor glow + subtle horizontal line texture. */
export const CardBg: React.FC<{ tint?: string; glow?: number }> = ({ tint = "rgba(125,211,252,0.10)", glow = 1 }) => (
  <AbsoluteFill style={{ background: L.ink }}>
    <AbsoluteFill style={{ opacity: glow, background: `radial-gradient(ellipse 70% 38% at 50% 50%, ${tint}, rgba(0,0,0,0) 70%)` }} />
    <AbsoluteFill style={{ opacity: 0.06, backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 4px)" }} />
  </AbsoluteFill>
);

/**
 * Wireframe perspective floor (his series' grid world, pushed dark): radial lines to a vanishing point on the
 * horizon + depth lines that travel toward camera; `kick` lets the caller jolt it forward on beats. SVG.
 */
export const GridFloor: React.FC<{ y0?: number; color?: string; opacity?: number; speed?: number; kick?: number }> = ({ y0 = 1260, color = L.cyan, opacity = 0.22, speed = 0.012, kick = 0 }) => {
  const g = useGlobalFrame();
  const H = 1920, vx = 540;
  const phase = (((g * speed + kick) % 1) + 1) % 1;
  const rays: React.ReactNode[] = [];
  for (let i = -10; i <= 10; i++) rays.push(<line key={`r${i}`} x1={vx} y1={y0} x2={vx + i * 330} y2={H} />);
  const rows: React.ReactNode[] = [];
  for (let k = 0; k < 16; k++) {
    const z = k + 1 - phase;
    const y = y0 + (H - y0) / (0.55 + z * 0.55);
    rows.push(<line key={`h${k}`} x1={0} x2={1080} y1={y} y2={y} strokeOpacity={Math.min(1, (y - y0) / 260)} />);
  }
  const mask = `linear-gradient(180deg, rgba(0,0,0,0) ${y0 - 10}px, rgba(0,0,0,0.25) ${y0 + 40}px, rgba(0,0,0,1) ${y0 + 420}px)`;
  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill style={{ maskImage: mask, WebkitMaskImage: mask }}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <g stroke={color} strokeWidth={1.6} fill="none">
            {rays}
            {rows}
          </g>
        </svg>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: y0 - 1, height: 2, background: `linear-gradient(90deg, rgba(0,0,0,0), ${color}, rgba(0,0,0,0))`, boxShadow: `0 0 24px ${color}` }} />
    </AbsoluteFill>
  );
};

/** Dark radial scrim behind a text block over busy footage. */
export const Scrim: React.FC<{ y: number; w?: number; h?: number; a?: number }> = ({ y, w = 70, h = 16, a = 0.78 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse ${w}% ${h}% at 50% ${(y / 1920) * 100}%, rgba(3,6,13,${a}) 0%, rgba(3,6,13,${a * 0.6}) 50%, rgba(3,6,13,0) 100%)` }} />
);

/** Full-frame flash (white / black / colour) for 1-3 frame strobe hits. */
export const Flash: React.FC<{ color?: string; opacity?: number }> = ({ color = "#fff", opacity = 1 }) => <AbsoluteFill style={{ background: color, opacity }} />;

/**
 * Horizontal slice displacement glitch: renders `children` (a single video Shot) twice more, clipped to
 * random bands and shifted sideways, with a cyan / blood tint. Only while `on`.
 */
export const Slices: React.FC<{ on: boolean; seed: number; amount?: number; children: React.ReactNode }> = ({ on, seed, amount = 60, children }) => {
  if (!on) return <>{children}</>;
  const band = (i: number) => {
    const top = Math.floor(rand(seed * 7.1 + i * 13.3) * 80);
    const h = 4 + Math.floor(rand(seed * 3.3 + i * 5.9) * 14);
    const dx = (rand(seed * 9.7 + i * 2.1) - 0.5) * 2 * amount;
    return { top, bottom: Math.max(0, 100 - top - h), dx };
  };
  const a = band(1), b = band(2);
  return (
    <>
      {children}
      <AbsoluteFill style={{ clipPath: `inset(${a.top}% 0 ${a.bottom}% 0)`, transform: `translateX(${a.dx}px)`, filter: "hue-rotate(160deg) saturate(1.6)" }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(${b.top}% 0 ${b.bottom}% 0)`, transform: `translateX(${b.dx}px)`, filter: "grayscale(1) contrast(1.6) brightness(1.35)" }}>{children}</AbsoluteFill>
    </>
  );
};
