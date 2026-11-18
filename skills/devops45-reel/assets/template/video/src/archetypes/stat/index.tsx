import React from "react";
import { AbsoluteFill } from "remotion";
import type { Archetype } from "..";
import { DigitWheel } from "../../kit/Clock";
import { fontInter } from "../../kit/fonts";
import { B } from "../../lib/look";
import { beatFor, speechSpan } from "../../lib/episode";
import { beatPulse, useGlobalFrame } from "../../lib/sync";
import { AMBER, clamp01, CYAN, EIO, EO, fitWrap, frType, Grade, inter, kick, lin, mix, mono, Particles, pop, rgba, Shell, Shock, Sparks, Streak, textW, World } from "./fx";

/**
 * archetype « stat » — one big number.
 *   data = { value: number | string ("99.9", "1,5", "10000", "p99", "99.9%"), unit?, prefix?, label (≤ 40 chars), on?,
 *            context? (e.g. "source : Google SRE book"), series?: number[] (optional sparkline) }
 * The digits spin as a slot machine from the scene start (dim, « scanning »), accelerate, then decelerate and LAND
 * column by column, the last one exactly on the `on` word (beat − 2 frames): each landed column turns amber (the brand
 * number colour), then the hit — amber shockwave, sparks, warm light bloom, rim flash, 5 px shake, one light streak.
 * Label from the start (blur-in), context line after the hit, optional sparkline drawn up to the landing.
 */
type StatData = { value?: number | string; unit?: string; prefix?: string; label?: string; on?: string; context?: string; series?: number[] };

const CX = 524;
const CARD_W = 820;

/** value → static lead text, digits string (French format) and trailing text */
const parseValue = (v: unknown) => {
  let lead = "";
  let trail = "";
  let num: string | null = null;
  if (typeof v === "number" && Number.isFinite(v)) {
    const s = String(Math.abs(v));
    const dec = s.includes(".") ? Math.min(2, s.split(".")[1].length) : 0;
    num = Math.abs(v).toFixed(dec);
    if (v < 0) lead = "−";
  } else {
    const s = String(v ?? "").trim();
    const m = s.match(/^(.*?)(\d[\d\s  ]*(?:[.,]\d+)?)(.*)$/);
    if (m) {
      lead = m[1];
      num = m[2].replace(/[\s  ]/g, "").replace(",", ".");
      trail = m[3];
    } else lead = s;
  }
  if (num === null) return { lead, digits: "", trail };
  const [int, dec] = num.split(".");
  // French: decimal comma, narrow no-break space every 3 digits from 10 000 up
  const grouped = int.length >= 5 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : int;
  return { lead, digits: dec ? `${grouped},${dec}` : grouped, trail };
};

/** remaining wheel distance T frames before landing: cubic decel (R), linear accel (A), idle spin before */
const V0 = 0.16;
const VMAX = 0.95;
const R = 26;
const A = 34;
const remaining = (T: number) => {
  if (T <= 0) return 0;
  if (T <= R) return ((VMAX * R) / 3) * Math.pow(T / R, 3);
  const dR = (VMAX * R) / 3;
  if (T <= R + A) {
    const x = T - R;
    return dR + VMAX * x + ((V0 - VMAX) * x * x) / (2 * A);
  }
  const dA = dR + VMAX * A + ((V0 - VMAX) * A) / 2;
  return dA + V0 * (T - R - A);
};
const speed = (T: number) => (T <= 0 ? 0 : T <= R ? VMAX * Math.pow(T / R, 2) : T <= R + A ? VMAX + ((V0 - VMAX) * (T - R)) / A : V0);

export const Stat: Archetype = ({ spec }) => {
  const g = useGlobalFrame();
  const d: StatData = spec.data ?? {};
  const t = g - spec.from;
  const dur = Math.max(1, spec.to - spec.from);
  const pv = parseValue(d.value);
  const prefix = [d.prefix ? String(d.prefix) : "", pv.lead].filter(Boolean).join(" ").trim();
  // a lead glued to the number (« p99 », « x10 ») stays glued and a bit bigger
  const glued = !d.prefix && !!pv.lead && /[A-Za-z]$/.test(pv.lead);
  const pct = pv.trail.trim().startsWith("%");
  const unit = [pct ? pv.trail.trim().slice(1).trim() : pv.trail.trim(), d.unit ? String(d.unit) : ""].filter(Boolean).join(" ");
  const label = frType(String(d.label ?? ""));
  const context = d.context ? frType(String(d.context)) : "";
  const series = Array.isArray(d.series) ? d.series.map(Number).filter((x) => Number.isFinite(x)) : [];
  const hasSeries = series.length >= 2;

  // the landing beat (default: 60 % into the speech)
  const [s0, s1] = speechSpan(spec);
  let land = beatFor(spec, d.on ? { on: d.on } : undefined, 3, 5);
  if (!d.on) land = Math.round(s0 + (s1 - s0) * 0.6) - 2;
  land = Math.max(spec.from + 14, Math.min(spec.to - 10, land));

  // ── number row sizing (fits 700 px)
  const digits = pv.digits;
  const textOnly = !digits;
  const bigText = textOnly ? frType(pv.lead || String(d.value ?? "")) : digits;
  const preK = glued ? 0.5 : 0.42;
  const unitK = pct ? 0.62 : 0.3;
  const measure = (fs: number) =>
    textW(textOnly ? bigText : digits.replace(/\d/g, "0"), fs, 800, "inter", -0.04) +
    (prefix && !textOnly ? textW(prefix, fs * preK, 700) + fs * 0.08 : 0) +
    (pct ? textW("%", fs * unitK, 800) + fs * 0.04 : 0) +
    (unit ? textW(unit, fs * 0.3, 700) + fs * 0.08 : 0);
  let fs = textOnly ? 220 : 350;
  const maxRow = 700;
  const m0 = measure(fs);
  if (m0 > maxRow) fs = Math.max(90, (fs * maxRow) / m0);
  const lh = Math.round(fs * 1.04);

  const lab = fitWrap(label, 56, 38, 700, 2, 700, "inter", -0.02);
  const ctxFit = context ? fitWrap(context, 26, 20, 700, 1, 500, "mono") : null;

  // ── card layout (centred in the hero zone 240–1270)
  const padT = 64;
  const numH = lh;
  const sparkH = hasSeries ? 130 : 0;
  const labH = label ? lab.lines.length * lab.size * 1.18 : 0;
  const ctxH = ctxFit ? 64 : 0;
  const cardH = padT + numH + (hasSeries ? 24 + sparkH : 0) + 34 + 2 + 30 + labH + ctxH + 58;
  const cardY = Math.max(250, 760 - cardH / 2);
  const cardX = CX - CARD_W / 2;

  // ── timing
  const entry = clamp01((t - 1) / 14);
  const ep = EO(entry);
  const landed = g >= land;
  const hit = kick(g, land, 9);
  const bp = beatPulse(g, 14);
  const shake = kick(g, land, 5);
  const sx = shake * 5 * Math.sin(g * 2.3);
  const sy = shake * 4 * Math.cos(g * 1.7);
  const push = 1 + 0.035 * EIO(clamp01(t / dur)) + 0.025 * EO(clamp01((g - land) / 40));
  const warm = clamp01((g - land + 6) / 20) * (0.75 + 0.35 * bp);
  const tilt = Math.sin(t * 0.018) * 1.4;
  const tiltX = Math.cos(t * 0.014) * 0.9;

  // ── digits: one wheel per digit, columns land left → right, the last on `land`
  const chars = [...digits];
  const dIdx = chars.map((c, i) => (/\d/.test(c) ? i : -1)).filter((i) => i >= 0);
  const nd = dIdx.length;
  const STAG = 3;
  const numberCenterY = cardY + padT + numH / 2;

  const digitNodes = chars.map((c, i) => {
    if (!/\d/.test(c)) {
      return (
        <span key={i} style={{ color: landed ? B.amber : "rgba(226,236,250,0.5)", display: "inline-block", lineHeight: `${lh}px`, height: lh, marginLeft: c === "," ? -fs * 0.02 : 0 }}>
          {c === " " ? " " : c}
        </span>
      );
    }
    const order = dIdx.indexOf(i);
    const L = land - (nd - 1 - order) * STAG;
    const T = L - g;
    const pos = Number(c) - remaining(T);
    const v = speed(T);
    const done = T <= 0;
    const turn = kick(g, L, 8);
    return (
      <span
        key={i}
        style={{
          display: "inline-block",
          color: done ? B.amber : "rgba(226,236,250,0.55)",
          textShadow: done ? `0 0 ${(30 + 40 * turn + 14 * bp).toFixed(1)}px ${rgba(AMBER, 0.55 + 0.3 * turn)}` : `0 0 22px ${rgba(CYAN, 0.35)}`,
          transform: `scale(${(1 + 0.08 * turn).toFixed(4)})`,
          transformOrigin: "50% 60%",
        }}
      >
        <DigitWheel pos={pos} lineHeight={lh} blur={Math.min(fs * 0.13, v * fs * 0.16)} fadeEdges />
      </span>
    );
  });

  // ── sparkline (optional): drawn from the start, its last point lands with the number
  let spark: React.ReactNode = null;
  if (hasSeries) {
    const w = 700;
    const h = sparkH;
    const lo = Math.min(...series);
    const hi = Math.max(...series);
    const yOf = (x: number) => h - 14 - ((x - lo) / Math.max(1e-6, hi - lo)) * (h - 34);
    const rev = lin(g, spec.from + 6, land, 0.02, 1, EIO);
    const N = series.length;
    const pts: string[] = [];
    for (let k = 0; k < N; k++) {
      const x = k / (N - 1);
      if (x > rev) break;
      pts.push(`${(x * w).toFixed(1)},${yOf(series[k]).toFixed(1)}`);
    }
    const fk = rev * (N - 1);
    const k0 = Math.floor(fk);
    const hv = mix(series[Math.min(N - 1, k0)], series[Math.min(N - 1, k0 + 1)], fk - k0);
    const hx = rev * w;
    const hy = yOf(hv);
    pts.push(`${hx.toFixed(1)},${hy.toFixed(1)}`);
    const line = `M${pts.join(" L")}`;
    const area = `${line} L${hx.toFixed(1)},${h} L0,${h} Z`;
    spark = (
      <svg width={w} height={h} style={{ position: "absolute", left: (CARD_W - w) / 2, top: padT + numH + 24, overflow: "visible" }}>
        <defs>
          <linearGradient id="stat-area" x1="0" y1="0" x2="0" y2={h} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={B.cyan} stopOpacity={0.28} />
            <stop offset="1" stopColor={B.cyan} stopOpacity={0} />
          </linearGradient>
          <filter id="stat-glow" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation={6} />
          </filter>
        </defs>
        <line x1={0} x2={w} y1={h} y2={h} stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
        <path d={area} fill="url(#stat-area)" />
        <path d={line} stroke={B.cyan} strokeWidth={9} fill="none" opacity={0.45} filter="url(#stat-glow)" strokeLinejoin="round" />
        <path d={line} stroke={B.cyan} strokeWidth={4.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {landed ? (
          <g>
            {[0, 1].map((r) => {
              const tt = (((g - land) / 34 + r * 0.5) % 1 + 1) % 1;
              return <circle key={r} cx={hx} cy={hy} r={10 + 40 * EO(tt)} fill="none" stroke={B.amber} strokeWidth={3} opacity={(1 - tt) * 0.8} />;
            })}
            <circle cx={hx} cy={hy} r={11 * (0.6 + 0.4 * pop(g, land, 10))} fill={B.amber} />
          </g>
        ) : (
          <>
            <circle cx={hx} cy={hy} r={16} fill={rgba(CYAN, 0.22)} />
            <circle cx={hx} cy={hy} r={7.5} fill={B.white} stroke={B.cyan} strokeWidth={3} />
          </>
        )}
      </svg>
    );
  }

  const labTop = padT + numH + (hasSeries ? 24 + sparkH : 0) + 34;
  const ctxIn = clamp01((g - land - 12) / 12);
  const rowDim = landed ? 1 : 0.9;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <World g={g} t={t} hit={hit} warm={warm} seed={3} />
      <AbsoluteFill style={{ transform: `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) scale(${push.toFixed(4)})`, transformOrigin: `${CX}px ${numberCenterY.toFixed(0)}px` }}>
        {/* warm light behind the number */}
        <div
          style={{
            position: "absolute",
            left: CX - 520,
            top: numberCenterY - 420,
            width: 1040,
            height: 840,
            borderRadius: "50%",
            background: `radial-gradient(closest-side, ${rgba(AMBER, 0.32 * warm + 0.25 * hit)} 0%, ${rgba(AMBER, 0.1 * warm)} 45%, ${rgba(AMBER, 0)} 100%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: cardX,
            top: cardY,
            width: CARD_W,
            height: cardH,
            transform: `translateY(${((1 - ep) * 40).toFixed(1)}px) scale(${(0.94 + 0.06 * ep).toFixed(4)}) perspective(2200px) rotateY(${tilt.toFixed(2)}deg) rotateX(${tiltX.toFixed(2)}deg)`,
            opacity: entry < 1 ? clamp01(entry * 1.8) : undefined,
            filter: entry < 1 ? `blur(${(12 * (1 - ep)).toFixed(2)}px)` : undefined,
          }}
        >
          <Shell
            w={CARD_W}
            h={cardH}
            tint={landed ? AMBER : CYAN}
            flash={hit}
            glow={0.8 + 0.4 * bp}
            sheen={g < land ? lin(g, spec.from + 4, spec.from + 34) : lin(g, land + 2, land + 30)}
            lx={30 + Math.sin(t * 0.02) * 14}
            ly={12}
          >
            {/* number row */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: padT,
                height: numH,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fontInter,
                fontWeight: 800,
                fontSize: fs,
                letterSpacing: "-0.04em",
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
                opacity: rowDim,
              }}
            >
              {prefix && !textOnly ? (
                <span style={{ ...inter(fs * preK, 700), color: landed ? B.white : B.text2, marginRight: glued ? fs * 0.01 : fs * 0.08, alignSelf: glued ? "flex-end" : "center", marginBottom: glued ? fs * 0.14 : 0, letterSpacing: "-0.02em" }}>{prefix}</span>
              ) : null}
              {textOnly ? (
                <span
                  style={{
                    color: landed ? B.amber : "rgba(226,236,250,0.35)",
                    filter: landed ? undefined : "blur(6px)",
                    textShadow: landed ? `0 0 ${(30 + 40 * hit + 14 * bp).toFixed(1)}px ${rgba(AMBER, 0.6)}` : undefined,
                    transform: `scale(${(1 + 0.1 * hit).toFixed(4)})`,
                    display: "inline-block",
                  }}
                >
                  {bigText}
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "flex-start", height: lh }}>{digitNodes}</span>
              )}
              {pct ? <span style={{ ...inter(fs * unitK, 800), color: landed ? B.amber : "rgba(226,236,250,0.5)", marginLeft: fs * 0.04, alignSelf: "center", marginTop: fs * 0.08 }}>%</span> : null}
              {unit ? (
                <span style={{ ...inter(fs * 0.3, 700), color: landed ? B.white : B.text2, marginLeft: fs * 0.08, alignSelf: "flex-end", marginBottom: fs * 0.16, letterSpacing: "-0.01em" }}>{unit}</span>
              ) : null}
            </div>
            {spark}
            {/* hairline + label */}
            <div style={{ position: "absolute", left: 60, right: 60, top: labTop, height: 2, background: `linear-gradient(90deg, rgba(255,255,255,0), ${rgba(landed ? AMBER : CYAN, 0.45)}, rgba(255,255,255,0))`, transform: `scaleX(${EO(clamp01((t - 6) / 20)).toFixed(3)})` }} />
            {label ? (
              <div style={{ position: "absolute", left: 50, right: 50, top: labTop + 32, textAlign: "center" }}>
                {lab.lines.map((ln, i) => {
                  const p = EO(clamp01((t - 8 - i * 4) / 14));
                  return (
                    <div
                      key={i}
                      style={{
                        ...inter(lab.size, 700),
                        lineHeight: 1.18,
                        letterSpacing: "-0.02em",
                        color: B.white,
                        opacity: clamp01(p * 1.6),
                        transform: `translateY(${((1 - p) * 18).toFixed(1)}px)`,
                        filter: p < 0.999 ? `blur(${(10 * (1 - p)).toFixed(2)}px)` : undefined,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ln}
                    </div>
                  );
                })}
              </div>
            ) : null}
            {ctxFit ? (
              <div
                style={{
                  position: "absolute",
                  left: 50,
                  right: 50,
                  top: labTop + 32 + labH + 22,
                  textAlign: "center",
                  ...mono(ctxFit.size, 500),
                  color: B.text3,
                  opacity: ctxIn,
                  transform: `translateY(${((1 - EO(ctxIn)) * 10).toFixed(1)}px)`,
                  whiteSpace: "nowrap",
                }}
              >
                {ctxFit.lines[0]}
              </div>
            ) : null}
          </Shell>
        </div>
        <Shock g={g} at={land} x={CX} y={numberCenterY} r0={fs * 0.3} r1={560} dur={40} width={5} />
        <Sparks g={g} at={land} x={CX} y={numberCenterY} n={18} dist={360} />
        {/* slow amber echo rings after the hit (the p95 point language) */}
        {landed ? (
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
            {[0, 1].map((r) => {
              const tt = ((((g - land - 40) / 90 + r * 0.5) % 1) + 1) % 1;
              if (g < land + 40) return null;
              return <ellipse key={r} cx={CX} cy={numberCenterY} rx={CARD_W * 0.5 + 120 * EO(tt)} ry={numH * 0.9 + 90 * EO(tt)} fill="none" stroke={rgba(AMBER, (1 - tt) * 0.22)} strokeWidth={2} />;
            })}
          </svg>
        ) : null}
        <Particles t={t} front boost={hit} />
      </AbsoluteFill>
      <Grade />
      <Streak g={g} at={land} dir={1} />
    </AbsoluteFill>
  );
};
