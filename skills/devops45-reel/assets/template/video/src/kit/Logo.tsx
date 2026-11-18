// Logo — the real logos of the tools and AWS services (public/logos/<key>.svg, registry in ./logos.ts).
//
//   <Logo name="docker" size={160} />            brand logo on a light frosted plate (reads in its true colours)
//   <Logo name="ec2" size={160} />               official AWS service icon (its own coloured square)
//   <Logo name="devops" size={300} draw={p} />   the DevOps infinity loop, drawn on with `draw`
//
// `logoKey(name)` turns any icon field (« Docker », « logo:k8s », « Amazon EC2 ») into a key, or null when the name
// is not a logo — the archetypes call it first, so `icon: "docker"` anywhere in episode.json shows the real logo.
import React from "react";
import { Img, staticFile } from "remotion";
import { LOGO_ALIAS, LOGOS, type LogoKey } from "./logos";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

export const logoKey = (name?: unknown): LogoKey | null => {
  if (!name || typeof name !== "string") return null;
  const k = norm(name.trim().replace(/^logo[:\-_ ]+/i, ""));
  return k ? LOGO_ALIAS[k] ?? null : null;
};
export const logoLabel = (name?: unknown): string | null => {
  const k = logoKey(name);
  return k ? LOGOS[k].label : null;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** lemniscate of Bernoulli centred on (200,100), half-width 150: t∈[-π/2,π/2] right lobe, [π/2,3π/2] left lobe */
const lem = (t: number): [number, number] => {
  const s = Math.sin(t);
  const c = Math.cos(t);
  const k = 1 + s * s;
  return [200 + (150 * c) / k, 100 + (1.25 * 150 * s * c) / k];
};
const lobe = (t0: number, t1: number) => {
  const n = 64;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const [x, y] = lem(t0 + ((t1 - t0) * i) / n);
    d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d;
};
const LEFT = lobe(Math.PI / 2, (3 * Math.PI) / 2);
const RIGHT = lobe(-Math.PI / 2, Math.PI / 2);

/** the DevOps loop: cyan « Dev » half, amber « Ops » half, a light running round it once drawn (`spin` = turns) */
const DevOpsLoop: React.FC<{ size: number; draw: number; spin: number }> = ({ size, draw, spin }) => {
  const d = clamp01(draw);
  const t = clamp01((d - 0.75) / 0.25);
  const common = { fill: "none", strokeWidth: 26, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, pathLength: 1, strokeDasharray: 1 };
  const [dx, dy] = lem(Math.PI / 2 + spin * 2 * Math.PI);
  return (
    <svg width={size} height={size / 2} viewBox="0 0 400 200" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="dvL" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#67E8F9" />
          <stop offset="1" stopColor="#0EA5E9" />
        </linearGradient>
        <linearGradient id="dvR" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBBF24" />
          <stop offset="1" stopColor="#F97316" />
        </linearGradient>
        <filter id="dvG" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <g opacity={0.55} filter="url(#dvG)">
        <path d={LEFT} {...common} stroke="url(#dvL)" strokeDashoffset={1 - d} />
        <path d={RIGHT} {...common} stroke="url(#dvR)" strokeDashoffset={1 - d} />
      </g>
      <path d={LEFT} {...common} stroke="url(#dvL)" strokeDashoffset={1 - d} />
      <path d={RIGHT} {...common} stroke="url(#dvR)" strokeDashoffset={1 - d} />
      {d >= 1 ? <circle cx={dx} cy={dy} r={10} fill="#FFFFFF" opacity={0.92} /> : null}
      <g opacity={t} fontFamily="Inter" fontWeight={800} textAnchor="middle">
        <text x={118} y={113} fontSize={38} fill="#E0F7FF" letterSpacing={-1.5}>
          Dev
        </text>
        <text x={282} y={113} fontSize={38} fill="#FFF4E0" letterSpacing={-1.5}>
          Ops
        </text>
      </g>
    </svg>
  );
};

export const Logo: React.FC<{
  name: string;
  size: number;
  /** 0→1 entrance (scale + fade; the DevOps loop draws on) */
  draw?: number;
  /** light frosted plate behind brand logos (default on); AWS icons carry their own square */
  plate?: boolean;
  /** 0..1 coloured halo */
  glow?: number;
  glowColor?: string;
  /** frames since the loop was drawn, for the running light */
  spin?: number;
  style?: React.CSSProperties;
}> = ({ name, size, draw = 1, plate = true, glow = 0, glowColor = "34,211,238", spin = 0, style }) => {
  const key = logoKey(name);
  if (!key) return null;
  const meta = LOGOS[key];
  const d = clamp01(draw);
  // entrance: spins in from a quarter turn, overshoots (back-out) and settles; blur while fast
  const bo = d >= 1 ? 1 : 1 + 2.2 * Math.pow(d - 1, 3) + 1.2 * Math.pow(d - 1, 2);
  const enter: React.CSSProperties = {
    opacity: clamp01(d * 2),
    transform: d >= 1 ? undefined : `scale(${(0.35 + 0.65 * bo).toFixed(3)}) rotate(${((1 - d) * -70).toFixed(1)}deg)`,
    filter: d < 0.85 ? `blur(${((0.85 - d) * 9).toFixed(1)}px)` : undefined,
  };
  // a glint sweeps across the plate as it lands
  const gl = d > 0.5 && d < 1 ? (d - 0.5) / 0.5 : -1;
  const glint =
    gl >= 0 ? (
      <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-30%", bottom: "-30%", width: "34%", left: `${(-40 + 150 * gl).toFixed(1)}%`, transform: "rotate(20deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.75), rgba(255,255,255,0))" }} />
      </div>
    ) : null;
  const halo = glow > 0 ? `0 0 ${(24 + 50 * glow).toFixed(0)}px rgba(${glowColor},${(0.18 + 0.4 * glow).toFixed(3)})` : "";

  if (meta.kind === "loop") {
    return (
      <div style={{ width: size, height: size / 2, ...style }}>
        <DevOpsLoop size={size} draw={d} spin={spin / 90} />
      </div>
    );
  }
  if (meta.kind === "aws") {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.2,
          overflow: "hidden",
          position: "relative",
          boxShadow: ["0 14px 34px rgba(0,0,0,0.45)", "inset 0 1px 0 rgba(255,255,255,0.35)", halo].filter(Boolean).join(", "),
          flexShrink: 0,
          ...enter,
          ...style,
        }}
      >
        <Img src={staticFile(`logos/${key}.svg`)} style={{ width: "100%", height: "100%", display: "block" }} />
        {glint}
      </div>
    );
  }
  // brand logo: wide wordmarks get a wider plate so they stay legible
  const ar = meta.ar;
  const pw = ar > 1.35 ? size * Math.min(1.6, ar * 0.62) : size;
  const inner = plate ? 0.68 : 1;
  return (
    <div
      style={{
        width: pw,
        height: size,
        borderRadius: size * 0.27,
        background: plate ? "linear-gradient(160deg, rgba(255,255,255,0.97), rgba(226,240,250,0.92))" : undefined,
        border: plate ? "1px solid rgba(255,255,255,0.9)" : undefined,
        boxShadow: plate ? ["0 14px 34px rgba(0,0,0,0.45)", "inset 0 -6px 14px rgba(14,165,233,0.10)", halo].filter(Boolean).join(", ") : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
        ...enter,
        ...style,
      }}
    >
      <Img
        src={staticFile(`logos/${key}.svg`)}
        style={{ width: (ar > 1.35 ? pw : size) * inner, height: size * inner, objectFit: "contain", display: "block" }}
      />
      {glint}
    </div>
  );
};
