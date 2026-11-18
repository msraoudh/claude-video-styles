import React from "react";
import { Logo } from "../kit/Logo";
import { fontInter, fontMono } from "../kit/fonts";
import { B, glass } from "../lib/look";
import { rand } from "../lib/sync";
import { AMBER, clamp01, CYAN, decay, EASE_OUT, ICE, iv, rgba, smooth, type RGB } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/**
 * « Prometheus mesure » — three servers on the left, each with a gauge whose needle swings to its value (CPU, RAM,
 * req/s, numbers ticking up). Metric dots (tiny mono labels) stream along curved paths into the Prometheus hub on
 * the right. The FIRST dot is amber: it lands, the hub flashes amber (shockwave, flare, sparks) and the sample counter
 * starts. Idle: dots keep streaming, needles jitter, LEDs blink, the hub pulses on every arrival and its rings turn.
 *   t (frames after f0)  0–24 servers + hub pop · 8–34 paths draw · 18–55 needles swing · 22 first dot leaves ·
 *   56 first ingest (amber) · then a steady stream.
 * Drawn in a 760 design space, scaled to `size`.
 */
const D = 760;
const HUB = { x: 608, y: 380 };
const CARD = { x: 14, w: 286, h: 172 };
const GA = { x: 208, y: 110, r: 50 }; // gauge inside a card
const TRAVEL = 34;

type Row = { y: number; name: string; metric: string; tag: string; target: number; per: number; fmt: (v: number) => string };
const ROWS: Row[] = [
  { y: 150, name: "node-1", metric: "CPU", tag: "cpu", target: 0.72, per: 30, fmt: (v) => `${Math.round(v * 100)}%` },
  { y: 380, name: "node-2", metric: "RAM", tag: "ram", target: 0.58, per: 38, fmt: (v) => `${(v * 8).toFixed(1)} Go` },
  { y: 610, name: "node-3", metric: "REQ/s", tag: "req", target: 0.84, per: 34, fmt: (v) => `${Math.round(v * 1500)}` },
];
const emit0 = (i: number) => 22 + i * 8;

type P = { x: number; y: number };
type C4 = [P, P, P, P];
const ctrl = (i: number, bob: number, hubBob: number): C4 => {
  const y = ROWS[i].y + bob;
  const p0 = { x: CARD.x + CARD.w + 4, y };
  const p3 = { x: HUB.x - 112, y: HUB.y + (ROWS[i].y - HUB.y) * 0.16 + hubBob };
  return [p0, { x: p0.x + 96, y }, { x: p3.x - 84, y: p3.y }, p3];
};
const bez = (c: C4, t: number): P => {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, cc = 3 * u * t * t, d = t * t * t;
  return { x: a * c[0].x + b * c[1].x + cc * c[2].x + d * c[3].x, y: a * c[0].y + b * c[1].y + cc * c[2].y + d * c[3].y };
};
const pathD = (c: C4) => `M${c[0].x.toFixed(1)} ${c[0].y.toFixed(1)} C${c[1].x.toFixed(1)} ${c[1].y.toFixed(1)} ${c[2].x.toFixed(1)} ${c[2].y.toFixed(1)} ${c[3].x.toFixed(1)} ${c[3].y.toFixed(1)}`;

/** damped spring 0→1 (overshoots ~17 %) */
const spring = (age: number, dur = 34) => {
  if (age <= 0) return 0;
  const u = age / dur;
  return 1 - Math.exp(-4.5 * u) * Math.cos(8 * u);
};
const backOut = (p: number) => {
  const c1 = 1.70158, c3 = c1 + 1, q = clamp01(p) - 1;
  return 1 + c3 * q * q * q + c1 * q * q;
};
const group = (n: number) => {
  const s = String(Math.max(0, Math.round(n)));
  let out = "";
  for (let k = 0; k < s.length; k++) out += (k && (s.length - k) % 3 === 0 ? " " : "") + s[k];
  return out;
};
const mix = (a: RGB, b: RGB, m: number): RGB => [0, 1, 2].map((j) => Math.round(a[j] + (b[j] - a[j]) * m)) as RGB;

/** self-contained anamorphic flare (fades to 0 inside its own box — no hard edge at the stage border) */
const Flare: React.FC<{ age: number; x: number; y: number; col: RGB; dur: number; strength: number; w: number }> = ({ age, x, y, col, dur, strength, w }) => {
  if (age < 0 || age > dur) return null;
  const env = (age < 2 ? age / 2 : Math.exp(-(age - 2) / (dur * 0.3))) * iv(age, [dur - 6, dur], [1, 0]) * strength;
  if (env < 0.004) return null;
  const W = w * iv(age, [0, dur], [0.5, 1.25], EASE_OUT);
  const bar = (h: number, ww: number, core: string, mid: string) => (
    <div style={{ position: "absolute", left: x - ww / 2, top: y - h / 2, width: ww, height: h, mixBlendMode: "screen", pointerEvents: "none", background: `radial-gradient(closest-side, ${core} 0%, ${mid} 35%, rgba(0,0,0,0) 100%)` }} />
  );
  return (
    <>
      {bar(90, W * 1.1, rgba(col, 0.32 * env), rgba(col, 0.1 * env))}
      {bar(9, W, `rgba(255,255,255,${(0.9 * env).toFixed(3)})`, rgba(col, 0.6 * env))}
      {bar(200, 200, `rgba(255,245,225,${(0.6 * env).toFixed(3)})`, rgba(col, 0.3 * env))}
    </>
  );
};

const Sparks: React.FC<{ age: number; x: number; y: number; n: number; r: number; col: RGB; seed: number; dur?: number }> = ({ age, x, y, n, r, col, seed, dur = 34 }) => {
  if (age < 0 || age > dur) return null;
  const p = age / dur;
  return (
    <svg width={D} height={D} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", mixBlendMode: "screen" }}>
      {Array.from({ length: n }, (_, k) => {
        const a = rand(seed * 31 + k) * Math.PI * 2;
        const sp = 0.45 + 0.55 * rand(seed * 17 + k * 3);
        const dd = r * sp * EASE_OUT(p);
        const px = x + Math.cos(a) * dd, py = y + Math.sin(a) * dd + 30 * p * p;
        const tail = 10 + 18 * sp * (1 - p);
        return (
          <g key={k} opacity={(1 - p) * (0.6 + 0.4 * rand(seed + k))}>
            <line x1={px} y1={py} x2={px - Math.cos(a) * tail} y2={py - Math.sin(a) * tail} stroke={rgba(col, 0.9)} strokeWidth={3} strokeLinecap="round" />
            <circle cx={px} cy={py} r={2.6} fill="#FFFFFF" />
          </g>
        );
      })}
    </svg>
  );
};

/** a semicircle gauge: needle at `v` (0..1) */
const Gauge: React.FC<{ v: number; on: number; flash: number }> = ({ v, on, flash }) => {
  const { x, y, r } = GA;
  const vv = clamp01(v);
  const th = Math.PI + vv * Math.PI;
  const ex = x + r * Math.cos(th), ey = y + r * Math.sin(th);
  const nx = x + (r - 8) * Math.cos(th), ny = y + (r - 8) * Math.sin(th);
  return (
    <g opacity={on}>
      <path d={`M${x - r} ${y} A${r} ${r} 0 0 1 ${x + r} ${y}`} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth={10} strokeLinecap="round" />
      {vv > 0.005 ? (
        <path d={`M${x - r} ${y} A${r} ${r} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`} fill="none" stroke="url(#prGa)" strokeWidth={10} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 ${(6 + 8 * flash).toFixed(1)}px ${rgba(CYAN, 0.7)})` }} />
      ) : null}
      {Array.from({ length: 7 }, (_, k) => {
        const a = Math.PI + (k / 6) * Math.PI;
        return <line key={k} x1={x + (r + 10) * Math.cos(a)} y1={y + (r + 10) * Math.sin(a)} x2={x + (r + 15) * Math.cos(a)} y2={y + (r + 15) * Math.sin(a)} stroke="rgba(226,236,250,0.35)" strokeWidth={2} strokeLinecap="round" />;
      })}
      <line x1={x} y1={y} x2={nx} y2={ny} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${rgba(CYAN, 0.9)})` }} />
      <circle cx={x} cy={y} r={7} fill="#FFFFFF" />
      <circle cx={x} cy={y} r={3} fill={B.cyan} />
    </g>
  );
};

export const PrometheusFx: ToolFx = ({ g, f0, beats, size }) => {
  const t = g - f0;
  const k = size / D;

  // ── dots: emissions & arrivals (deterministic schedule) ──
  type Dot = { i: number; n: number; e: number };
  const live: Dot[] = [];
  const arrivals: number[] = [];
  ROWS.forEach((row, i) => {
    for (let n = 0; n < 400; n++) {
      const e = emit0(i) + n * row.per;
      if (e > t) break;
      if (t - e <= TRAVEL) live.push({ i, n, e });
      else arrivals.push(e + TRAVEL);
    }
  });
  const A1 = emit0(0) + TRAVEL; // first ingest — the amber moment
  const pulse = Math.min(1.4, arrivals.reduce((s, a) => s + decay(t - a, 9), 0));
  const beatK = beats.reduce((s, b) => s + decay(g - b, 10), 0);
  const amberMix = decay(t - A1, 22);
  const lastEmit = (i: number) => {
    const row = ROWS[i];
    if (t < emit0(i)) return -1e9;
    return t - (emit0(i) + Math.floor((t - emit0(i)) / row.per) * row.per);
  };

  // ── hub ──
  const hubIn = iv(t, [4, 28], [0, 1]);
  const hubS = (0.55 + 0.45 * backOut(hubIn)) * (1 + 0.05 * pulse + 0.07 * decay(t - A1, 10));
  const hubBob = Math.sin(t * 0.045) * 4;
  const hy = HUB.y + hubBob;
  const glowCol = mix(CYAN, AMBER, amberMix);
  const glowStr = `${glowCol[0]},${glowCol[1]},${glowCol[2]}`;

  // counter
  const cIn = iv(t, [A1 - 6, A1 + 10], [0, 1], EASE_OUT);
  const count = 18240 + arrivals.reduce((s, a) => s + smooth((t - a) / 12) * 3, 0);
  const bobOf = (i: number) => Math.sin(t * 0.05 + i * 1.7) * 3;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: D, height: D, transform: `scale(${k})`, transformOrigin: "0 0" }}>
      {/* depth light behind the hub */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(300px 300px at ${HUB.x}px ${hy}px, ${rgba(glowCol, 0.16 + 0.08 * pulse)} 0%, rgba(0,0,0,0) 100%)`, opacity: hubIn }} />

      {/* servers */}
      {ROWS.map((row, i) => {
        const e = EASE_OUT(iv(t, [i * 5, 22 + i * 5], [0, 1]));
        const sw = spring(t - (18 + i * 7));
        const idle = iv(t, [64, 100], [0, 1]);
        const jit = idle * (0.035 * Math.sin(t * 0.13 + i * 2.1) + 0.02 * Math.sin(t * 0.37 + i));
        const v = row.target * sw + jit;
        const flash = decay(lastEmit(i), 8);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: CARD.x,
              top: row.y - CARD.h / 2 + bobOf(i),
              width: CARD.w,
              height: CARD.h,
              opacity: e,
              transform: `translateX(${((1 - e) * -40).toFixed(1)}px) scale(${(0.9 + 0.1 * e).toFixed(3)})`,
              filter: e < 0.97 ? `blur(${((1 - e) * 10).toFixed(2)}px)` : undefined,
            }}
          >
            <div style={{ ...glass("34,211,238", 0.6 + 0.5 * flash), position: "absolute", inset: 0, borderRadius: 28 }} />
            {/* name */}
            <div style={{ position: "absolute", left: 20, top: 16, display: "flex", alignItems: "center", gap: 8, fontFamily: fontMono, fontWeight: 500, fontSize: 17, color: B.text3 }}>
              <span style={{ width: 9, height: 9, borderRadius: 5, background: B.ok, boxShadow: `0 0 8px ${B.ok}`, opacity: 0.6 + 0.4 * Math.sin(t * 0.2 + i) }} />
              {row.name}
            </div>
            {/* rack blades */}
            {[0, 1, 2].map((j) => {
              const ledOn = (n: number) => rand(Math.floor((t + i * 13 + j * 7 + n * 3) / 5) * 31 + i * 5 + j * 11 + n) > 0.4 || flash > 0.4;
              return (
                <div key={j} style={{ position: "absolute", left: 20, top: 52 + j * 36, width: 108, height: 26, borderRadius: 7, background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {[0, 1, 2, 3].map((q) => (
                    <div key={q} style={{ position: "absolute", left: 10 + q * 8, top: 7, width: 3, height: 12, borderRadius: 2, background: "rgba(226,236,250,0.18)" }} />
                  ))}
                  {[0, 1].map((n) => (
                    <div key={n} style={{ position: "absolute", right: 10 + n * 15, top: 8, width: 8, height: 8, borderRadius: 4, background: ledOn(n) ? (n ? B.cyan : B.ok) : "rgba(255,255,255,0.12)", boxShadow: ledOn(n) ? `0 0 8px ${n ? B.cyan : B.ok}` : undefined }} />
                  ))}
                </div>
              );
            })}
            {/* metric name + gauge + value */}
            <div style={{ position: "absolute", left: GA.x - 60, width: 120, top: 18, textAlign: "center", fontFamily: fontMono, fontWeight: 700, fontSize: 16, letterSpacing: "0.08em", color: rgba(CYAN, 0.85) }}>{row.metric}</div>
            <svg width={CARD.w} height={CARD.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <defs>
                <linearGradient id="prGa" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#0EA5E9" />
                  <stop offset="1" stopColor="#67E8F9" />
                </linearGradient>
              </defs>
              <Gauge v={v} on={iv(t, [8 + i * 5, 24 + i * 5], [0, 1])} flash={flash} />
            </svg>
            <div style={{ position: "absolute", left: GA.x - 70, width: 140, top: GA.y + 10, textAlign: "center", fontFamily: fontMono, fontWeight: 700, fontSize: 28, color: B.white, textShadow: `0 0 16px ${rgba(CYAN, 0.35)}`, opacity: iv(t, [14 + i * 6, 26 + i * 6], [0, 1]) }}>
              {row.fmt(Math.max(0, v))}
            </div>
            {/* output port */}
            <div style={{ position: "absolute", right: -9, top: CARD.h / 2 - 9, width: 18, height: 18, borderRadius: 9, background: "#0B1530", border: `2px solid ${rgba(CYAN, 0.6 + 0.4 * flash)}`, boxShadow: `0 0 ${(6 + 18 * flash).toFixed(1)}px ${rgba(CYAN, 0.5 + 0.5 * flash)}` }} />
          </div>
        );
      })}

      {/* paths, dots, arrival rings */}
      <svg width={D} height={D} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <filter id="prBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        {ROWS.map((row, i) => {
          const cc = ctrl(i, bobOf(i), hubBob);
          const dl = iv(t, [8 + i * 4, 32 + i * 4], [0, 1], EASE_OUT);
          return (
            <g key={i}>
              <path d={pathD(cc)} fill="none" stroke={rgba(CYAN, 0.16)} strokeWidth={10} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - dl} strokeLinecap="round" filter="url(#prBlur)" />
              <path d={pathD(cc)} fill="none" stroke={rgba(CYAN, 0.5)} strokeWidth={2.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - dl} strokeLinecap="round" />
              {dl >= 1 ? <path d={pathD(cc)} fill="none" stroke={rgba(ICE, 0.55)} strokeWidth={2.5} strokeDasharray="4 22" strokeDashoffset={-t * 1.6} strokeLinecap="round" /> : null}
              {live
                .filter((d) => d.i === i)
                .map((d) => {
                  const u = (t - d.e) / TRAVEL;
                  const ue = u * u * (3 - 2 * u) * 0.7 + u * 0.3;
                  const first = d.i === 0 && d.n === 0;
                  const col = first ? AMBER : CYAN;
                  const p = bez(cc, ue);
                  const fade = clamp01((1 - u) / 0.12);
                  const lab = clamp01(u / 0.12) * clamp01((0.8 - u) / 0.15);
                  return (
                    <g key={d.n}>
                      {[5, 4, 3, 2, 1].map((j) => {
                        const q = bez(cc, Math.max(0, ue - j * 0.028));
                        return <circle key={j} cx={q.x} cy={q.y} r={(first ? 9 : 7) * (1 - j * 0.14)} fill={rgba(col, 0.32 * (1 - j / 6) * fade)} />;
                      })}
                      <circle cx={p.x} cy={p.y} r={first ? 22 : 16} fill={rgba(col, 0.35 * fade)} filter="url(#prBlur)" />
                      <circle cx={p.x} cy={p.y} r={first ? 10 : 8} fill={first ? "#FFE3B0" : "#E6FBFF"} opacity={fade} />
                      <text x={p.x} y={p.y - 20} textAnchor="middle" fontFamily={fontMono} fontWeight={700} fontSize={16} fill={first ? rgba(AMBER, 0.95) : rgba(ICE, 0.85)} opacity={lab}>
                        {row.tag}
                      </text>
                    </g>
                  );
                })}
            </g>
          );
        })}
        {/* arrival rings around the hub */}
        {arrivals
          .filter((a) => t - a >= 0 && t - a < 26)
          .map((a, n) => {
            const age = t - a;
            const p = EASE_OUT(age / 26);
            const col = a === A1 ? AMBER : CYAN;
            return <circle key={n} cx={HUB.x} cy={hy} r={92 + 70 * p} fill="none" stroke={rgba(col, (a === A1 ? 0.9 : 0.5) * (1 - age / 26))} strokeWidth={a === A1 ? 5 : 3} />;
          })}
      </svg>

      {/* the hub */}
      <div style={{ position: "absolute", left: HUB.x - 130, top: hy - 130, width: 260, height: 260, opacity: clamp01(hubIn * 2), transform: `scale(${hubS.toFixed(4)})` }}>
        <svg width={260} height={260} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <g transform={`rotate(${(t * 0.9).toFixed(2)} 130 130)`}>
            <circle cx={130} cy={130} r={118} fill="none" stroke={rgba(CYAN, 0.38 + 0.3 * beatK)} strokeWidth={2.5} strokeDasharray="3 13" strokeLinecap="round" />
          </g>
          <g transform={`rotate(${(-t * 2.2).toFixed(2)} 130 130)`}>
            <circle cx={130} cy={130} r={104} fill="none" stroke={rgba(CYAN, 0.14)} strokeWidth={3} />
            <circle cx={130} cy={130} r={104} fill="none" stroke={rgba(glowCol, 0.85)} strokeWidth={3.5} strokeDasharray={`${(60 + 40 * pulse).toFixed(1)} 654`} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${rgba(glowCol, 0.9)})` }} />
          </g>
        </svg>
        <div
          style={{
            ...glass(glowStr, 1 + 0.8 * pulse + 1.2 * amberMix),
            position: "absolute",
            left: 38,
            top: 38,
            width: 184,
            height: 184,
            borderRadius: 92,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "absolute", inset: 0, borderRadius: 92, background: `radial-gradient(circle at 50% 50%, ${rgba(glowCol, 0.22 + 0.25 * pulse)} 0%, rgba(0,0,0,0) 70%)` }} />
          <Logo name="prometheus" size={118} draw={iv(t, [8, 26], [0, 1], EASE_OUT)} glow={0.35 + 0.4 * pulse + 0.6 * amberMix} glowColor={glowStr} />
        </div>
      </div>

      {/* sample counter */}
      <div
        style={{
          ...glass("34,211,238", 0.5),
          position: "absolute",
          left: HUB.x - 118,
          top: hy + 146,
          width: 236,
          height: 78,
          borderRadius: 22,
          opacity: cIn,
          transform: `translateY(${((1 - cIn) * 16).toFixed(1)}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <div style={{ fontFamily: fontInter, fontWeight: 700, fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", color: B.text3 }}>échantillons</div>
        <div style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 32, color: B.white, textShadow: `0 0 ${(10 + 14 * pulse).toFixed(1)}px ${rgba(CYAN, 0.5)}` }}>{group(count)}</div>
      </div>

      {/* the first ingest: amber hit */}
      {t - A1 >= 0 && t - A1 <= 28 ? (
        <svg width={D} height={D} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", mixBlendMode: "screen" }}>
          <circle cx={HUB.x} cy={hy} r={90 + 190 * EASE_OUT((t - A1) / 28)} fill="none" stroke={rgba(AMBER, 0.35 * (1 - (t - A1) / 28))} strokeWidth={26} filter="url(#prBlur)" />
          <circle cx={HUB.x} cy={hy} r={90 + 190 * EASE_OUT((t - A1) / 28)} fill="none" stroke={rgba([255, 236, 200], 0.6 * (1 - (t - A1) / 28))} strokeWidth={3} />
        </svg>
      ) : null}
      <Flare age={t - A1} x={HUB.x} y={hy} col={AMBER} dur={34} strength={0.8} w={560} />
      <Sparks age={t - A1} x={HUB.x - 92} y={hy + 6} n={14} r={150} col={AMBER} seed={5} />
    </div>
  );
};
