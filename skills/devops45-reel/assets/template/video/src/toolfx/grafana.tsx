import React from "react";
import { Logo } from "../kit/Logo";
import { fontInter, fontMono } from "../kit/fonts";
import { B, glass } from "../lib/look";
import { rand } from "../lib/sync";
import { AMBER, clamp01, CYAN, decay, EASE_OUT, iv, rgba, type RGB } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/**
 * « Grafana dessine les courbes » — a glass dashboard (Grafana logo top-left) assembles panel by panel:
 *   t 0–18 window · 10 line panel: the curve draws itself (16–60) with a glowing gradient area under it ·
 *   20 bar panel: bars grow with overshoot · 28 stat: « 2 481 » counts up · 36 gauge fills to 68 % ·
 *   70 the ONE amber moment: a highlight lands on the peak of the curve (ring, dashed drop line, « pic » tag, sparks).
 * Idle: the curve scrolls left as new points arrive at the glowing head, bars breathe, stat ticks, gauge jitters.
 * Drawn in a 760 design space, scaled to `size`.
 */
const D = 760;
const WIN = { x: 10, y: 46, w: 740, h: 668 };
const HEAD_H = 84;
const LP = { x: 18, y: 100, w: 704, h: 272 }; // line panel (window coords)
const BP = { x: 18, y: 388, w: 312, h: 262 };
const SP = { x: 340, y: 388, w: 190, h: 262 };
const GP = { x: 540, y: 388, w: 182, h: 262 };
// plot area inside the line panel
const PL = { x: 56, y: 56, w: 626, h: 180 };
const N = 22; // visible points
const DX = PL.w / (N - 1);
const PEAK = 15;

const backOut = (p: number, s = 1.70158) => {
  const q = clamp01(p) - 1;
  return 1 + (s + 1) * q * q * q + s * q * q;
};
const val = (i: number) => {
  if (i === PEAK) return 0.95;
  if (i === PEAK - 1) return 0.7;
  if (i === PEAK + 1) return 0.64;
  return 0.42 + 0.13 * Math.sin(i * 0.62) + 0.07 * Math.sin(i * 1.73 + 1) + 0.12 * (rand(i * 7.31 + 2) - 0.5);
};
const valAt = (x: number) => {
  const i = Math.floor(x);
  const f = x - i;
  return val(i) + (val(i + 1) - val(i)) * f;
};
const yOf = (v: number) => PL.y + PL.h * (1 - v) * 0.92 + PL.h * 0.04;
const group = (n: number) => {
  const s = String(Math.max(0, Math.round(n)));
  let out = "";
  for (let k = 0; k < s.length; k++) out += (k && (s.length - k) % 3 === 0 ? " " : "") + s[k];
  return out;
};

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
        const px = x + Math.cos(a) * dd, py = y + Math.sin(a) * dd + 26 * p * p;
        const tail = 9 + 16 * sp * (1 - p);
        return (
          <g key={k} opacity={(1 - p) * (0.6 + 0.4 * rand(seed + k))}>
            <line x1={px} y1={py} x2={px - Math.cos(a) * tail} y2={py - Math.sin(a) * tail} stroke={rgba(col, 0.9)} strokeWidth={3} strokeLinecap="round" />
            <circle cx={px} cy={py} r={2.4} fill="#FFFFFF" />
          </g>
        );
      })}
    </svg>
  );
};

/** a Grafana panel: dark glass, small title; pops in with `e` */
const Panel: React.FC<{ r: { x: number; y: number; w: number; h: number }; e: number; title: string; flash?: number; children?: React.ReactNode }> = ({ r, e, title, flash = 0, children }) => (
  <div
    style={{
      position: "absolute",
      left: r.x,
      top: r.y,
      width: r.w,
      height: r.h,
      borderRadius: 18,
      background: "linear-gradient(160deg, rgba(10,20,42,0.82), rgba(6,12,28,0.7))",
      border: `1px solid rgba(148,190,255,${(0.13 + 0.25 * flash).toFixed(3)})`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 26px rgba(0,0,0,0.35), 0 0 ${(40 * flash).toFixed(1)}px ${rgba(CYAN, 0.25 * flash)}`,
      overflow: "hidden",
      opacity: clamp01(e * 1.6),
      transform: `translateY(${((1 - e) * 26).toFixed(1)}px) scale(${(0.92 + 0.08 * e).toFixed(4)})`,
      filter: e < 0.97 ? `blur(${((1 - e) * 8).toFixed(2)}px)` : undefined,
    }}
  >
    <div style={{ position: "absolute", left: 18, top: 14, fontFamily: fontInter, fontWeight: 600, fontSize: 19, color: B.text2, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{title}</div>
    {children}
  </div>
);

export const GrafanaFx: ToolFx = ({ g, f0, beats, size }) => {
  const t = g - f0;
  const k = size / D;
  const beatK = beats.reduce((s, b) => s + decay(g - b, 10), 0);

  // ── window ──
  const we = EASE_OUT(iv(t, [0, 18], [0, 1]));
  const sweep = iv(t, [8, 44], [-0.4, 1.4]);
  const tiltX = Math.sin(t * 0.021) * 1.6;
  const tiltY = Math.sin(t * 0.017 + 1) * 2.2;

  // ── panels in ──
  const eL = EASE_OUT(iv(t, [10, 28], [0, 1]));
  const eB = EASE_OUT(iv(t, [20, 38], [0, 1]));
  const eS = EASE_OUT(iv(t, [28, 46], [0, 1]));
  const eG = EASE_OUT(iv(t, [36, 54], [0, 1]));

  // ── line chart: draw then scroll ──
  const draw = iv(t, [16, 60], [0, 1], (x) => 1 - Math.pow(1 - x, 2.2));
  const u = t - 92;
  const V = 1 / 26; // points per frame
  const R = 30;
  const shift = u <= 0 ? 0 : u < R ? (V * u * u) / (2 * R) : V * (u - R / 2);
  const head = shift + (N - 1) * draw;
  const pts: Array<[number, number]> = [];
  const i0 = Math.floor(shift);
  for (let i = i0; i <= Math.floor(head); i++) pts.push([(i - shift) * DX + PL.x, yOf(val(i))]);
  pts.push([(head - shift) * DX + PL.x, yOf(valAt(head))]);
  const lineD = pts.map((p, n) => `${n ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const areaD = `${lineD} L${last[0].toFixed(1)} ${PL.y + PL.h} L${pts[0][0].toFixed(1)} ${PL.y + PL.h} Z`;
  const scrolling = shift > 0;
  const ping = scrolling ? decay((shift - Math.floor(shift)) / V, 9) : 0;

  // ── peak highlight (the amber moment) ──
  const HL = 70;
  const hl = iv(t, [HL, HL + 14], [0, 1], EASE_OUT);
  const pkx = (PEAK - shift) * DX + PL.x;
  const pky = yOf(val(PEAK));
  const pkVis = clamp01((pkx - PL.x - 10) / 40) * (head >= PEAK ? 1 : 0);
  const tagDrop = backOut(iv(t, [HL + 2, HL + 18], [0, 1]), 2.2);
  const ring = iv(t, [HL, HL + 16], [0, 1], EASE_OUT);
  const hlBreath = 0.5 + 0.5 * Math.sin((t - HL) * 0.11);

  // ── bars ──
  const BARS = [0.52, 0.78, 0.4, 0.66, 0.9, 0.48, 0.7];
  const BLAB = ["api", "web", "db", "auth", "pay", "cdn", "mq"];
  const bpl = { x: 20, y: 60, w: BP.w - 40, h: BP.h - 60 - 44 };
  const slot = bpl.w / BARS.length;
  const breathe = iv(t, [70, 100], [0, 1]);

  // ── stat ──
  const sc = iv(t, [32, 74], [0, 1], (x) => 1 - Math.pow(1 - x, 3));
  const stTicks = t > 96 ? Math.floor((t - 96) / 20) : 0;
  const stat = 2481 * sc + stTicks * 3;
  const stFlash = t > 96 ? decay((t - 96) % 20, 6) : decay(t - 74, 10);

  // ── gauge ──
  const gv = 0.68 * iv(t, [40, 80], [0, 1], (x) => 1 - Math.pow(1 - x, 3)) + iv(t, [84, 110], [0, 1]) * (0.03 * Math.sin(t * 0.12) + 0.015 * Math.sin(t * 0.41));
  const GC = { x: GP.w / 2, y: 148, r: 56 };
  const A0 = (150 * Math.PI) / 180;
  const ASPAN = (240 * Math.PI) / 180;
  const arcPt = (a: number, r: number) => [GC.x + r * Math.cos(a), GC.y + r * Math.sin(a)];
  const arc = (v: number) => {
    const a1 = A0 + ASPAN * clamp01(v);
    const [sx, sy] = arcPt(A0, GC.r);
    const [ex, ey] = arcPt(a1, GC.r);
    return `M${sx.toFixed(2)} ${sy.toFixed(2)} A${GC.r} ${GC.r} 0 ${a1 - A0 > Math.PI ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
  };

  const winGlow = 0.8 + 0.25 * beatK + 0.5 * decay(t - HL, 16);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: D, height: D, transform: `scale(${k})`, transformOrigin: "0 0" }}>
      <div style={{ position: "absolute", inset: 0, perspective: 2400 }}>
        <div
          style={{
            position: "absolute",
            left: WIN.x,
            top: WIN.y,
            width: WIN.w,
            height: WIN.h,
            opacity: clamp01(we * 1.5),
            transform: `rotateX(${(tiltX + (1 - we) * 8).toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale(${(0.94 + 0.06 * we).toFixed(4)})`,
          }}
        >
          <div style={{ ...glass("34,211,238", winGlow), position: "absolute", inset: 0 }} />
          {/* light sweep across the glass */}
          {sweep > -0.4 && sweep < 1.4 ? (
            <div style={{ position: "absolute", inset: 0, borderRadius: 34, overflow: "hidden", pointerEvents: "none" }}>
              <div style={{ position: "absolute", top: -200, bottom: -200, width: 160, left: `${(sweep * 100).toFixed(1)}%`, transform: "rotate(18deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(190,240,255,0.12), rgba(255,255,255,0))" }} />
            </div>
          ) : null}

          {/* header */}
          <div style={{ position: "absolute", left: 18, top: 12, opacity: iv(t, [4, 16], [0, 1]) }}>
            <Logo name="grafana" size={64} draw={iv(t, [4, 20], [0, 1], EASE_OUT)} glow={0.3 + 0.2 * beatK} glowColor="245,158,11" />
          </div>
          <div style={{ position: "absolute", left: 98, top: 0, height: HEAD_H, display: "flex", alignItems: "center", gap: 10, fontFamily: fontInter, opacity: iv(t, [6, 18], [0, 1]), transform: `translateX(${((1 - iv(t, [6, 20], [0, 1], EASE_OUT)) * -14).toFixed(1)}px)` }}>
            <span style={{ fontWeight: 800, fontSize: 26, color: B.white, letterSpacing: "-0.02em" }}>Production</span>
            <span style={{ fontWeight: 600, fontSize: 22, color: B.text3 }}>/ API</span>
          </div>
          <div style={{ position: "absolute", right: 18, top: 22, display: "flex", gap: 10, opacity: iv(t, [8, 20], [0, 1]) }}>
            <div style={{ height: 40, padding: "0 14px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.35)", fontFamily: fontMono, fontWeight: 700, fontSize: 16, color: B.ok }}>
              <span style={{ width: 9, height: 9, borderRadius: 5, background: B.ok, boxShadow: `0 0 ${(6 + 8 * (0.5 + 0.5 * Math.sin(t * 0.18))).toFixed(1)}px ${B.ok}`, opacity: 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.18)) }} />
              live
            </div>
            <div style={{ height: 40, padding: "0 14px", borderRadius: 12, display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", fontFamily: fontMono, fontWeight: 500, fontSize: 16, color: B.text2 }}>15 min</div>
          </div>
          <div style={{ position: "absolute", left: 18, right: 18, top: HEAD_H, height: 1, background: "rgba(148,190,255,0.12)", transform: `scaleX(${iv(t, [6, 24], [0, 1], EASE_OUT).toFixed(3)})`, transformOrigin: "0 0" }} />

          {/* line chart panel */}
          <Panel r={LP} e={eL} title="Requêtes / s" flash={0.4 * decay(t - HL, 14)}>
            <div style={{ position: "absolute", left: 160, top: 19, display: "flex", alignItems: "center", gap: 8, fontFamily: fontMono, fontSize: 14, color: B.text3 }}>
              <span style={{ width: 18, height: 4, borderRadius: 2, background: B.cyan, boxShadow: `0 0 6px ${B.cyan}` }} />
              api-gateway
            </div>
            <svg width={LP.w} height={LP.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <defs>
                <linearGradient id="gfArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#22D3EE" stopOpacity={0.5} />
                  <stop offset="0.6" stopColor="#0EA5E9" stopOpacity={0.14} />
                  <stop offset="1" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gfLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#0EA5E9" />
                  <stop offset="1" stopColor="#A5F3FC" />
                </linearGradient>
                <clipPath id="gfClip">
                  <rect x={PL.x} y={PL.y - 30} width={PL.w + 4} height={PL.h + 30} />
                </clipPath>
                <filter id="gfBlur" x="-20%" y="-50%" width="140%" height="200%">
                  <feGaussianBlur stdDeviation="6" />
                </filter>
              </defs>
              {/* grid + axis */}
              {[0, 1, 2, 3].map((q) => {
                const y = PL.y + (PL.h * q) / 3;
                return (
                  <g key={q} opacity={eL}>
                    <line x1={PL.x} x2={PL.x + PL.w} y1={y} y2={y} stroke="rgba(148,190,255,0.1)" strokeWidth={1.5} strokeDasharray="4 6" />
                    <text x={PL.x - 12} y={y + 5} textAnchor="end" fontFamily={fontMono} fontSize={13} fill={B.text3}>
                      {["1,2k", "800", "400", "0"][q]}
                    </text>
                  </g>
                );
              })}
              {["-15m", "-10m", "-5m", "now"].map((s, q) => (
                <text key={s} x={PL.x + (PL.w * q) / 3} y={PL.y + PL.h + 24} textAnchor={q === 0 ? "start" : q === 3 ? "end" : "middle"} fontFamily={fontMono} fontSize={13} fill={B.text3} opacity={eL}>
                  {s}
                </text>
              ))}
              {draw > 0 ? (
                <g clipPath="url(#gfClip)">
                  <path d={areaD} fill="url(#gfArea)" />
                  <path d={lineD} fill="none" stroke={rgba(CYAN, 0.7)} strokeWidth={10} strokeLinejoin="round" strokeLinecap="round" filter="url(#gfBlur)" />
                  <path d={lineD} fill="none" stroke="url(#gfLine)" strokeWidth={4.5} strokeLinejoin="round" strokeLinecap="round" />
                  {/* peak highlight: dashed drop line + ring + dot */}
                  {hl > 0 && pkVis > 0 ? (
                    <g opacity={pkVis}>
                      <line x1={pkx} x2={pkx} y1={pky + 12} y2={pky + 12 + (PL.y + PL.h - pky - 12) * hl} stroke={rgba(AMBER, 0.75)} strokeWidth={2.5} strokeDasharray="5 6" />
                      <circle cx={pkx} cy={pky} r={12 + 36 * (1 - ring)} fill="none" stroke={rgba(AMBER, 0.95 * ring + 0.2)} strokeWidth={3} opacity={hl} />
                      <circle cx={pkx} cy={pky} r={22 + 6 * hlBreath} fill={rgba(AMBER, (0.18 + 0.12 * hlBreath) * hl)} filter="url(#gfBlur)" />
                      <circle cx={pkx} cy={pky} r={7} fill="#FFE3B0" opacity={hl} />
                    </g>
                  ) : null}
                </g>
              ) : null}
              {/* glowing head (new points arrive here) */}
              {draw > 0 ? (
                <g>
                  <circle cx={last[0]} cy={last[1]} r={10 + 16 * (1 - ping) * (ping > 0.02 ? 1 : 0)} fill="none" stroke={rgba(CYAN, 0.7 * ping)} strokeWidth={2.5} />
                  <circle cx={last[0]} cy={last[1]} r={16} fill={rgba(CYAN, 0.45)} filter="url(#gfBlur)" />
                  <circle cx={last[0]} cy={last[1]} r={6.5} fill="#FFFFFF" />
                </g>
              ) : null}
            </svg>
            {/* « pic » tag */}
            {hl > 0 && pkVis > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: pkx + 26,
                  top: pky - 21 - (1 - tagDrop) * 26,
                  width: 140,
                  height: 42,
                  borderRadius: 21,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: "rgba(20,12,2,0.88)",
                  border: `1.5px solid ${rgba(AMBER, 0.85)}`,
                  boxShadow: `0 0 ${(16 + 14 * hlBreath).toFixed(1)}px ${rgba(AMBER, 0.45)}, 0 8px 20px rgba(0,0,0,0.5)`,
                  opacity: clamp01(tagDrop * 1.4) * pkVis,
                  fontFamily: fontMono,
                  fontWeight: 700,
                  fontSize: 19,
                  color: "#FFD18A",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 17, color: B.amber }}>pic</span>1 180
              </div>
            ) : null}
          </Panel>

          {/* bar panel */}
          <Panel r={BP} e={eB} title="Latence · ms">
            <svg width={BP.w} height={BP.h} style={{ position: "absolute", left: 0, top: 0 }}>
              <defs>
                <linearGradient id="gfBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#67E8F9" />
                  <stop offset="1" stopColor="#0E7490" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <line x1={bpl.x} x2={bpl.x + bpl.w} y1={bpl.y + bpl.h} y2={bpl.y + bpl.h} stroke="rgba(148,190,255,0.18)" strokeWidth={1.5} />
              {BARS.map((b, q) => {
                const grow = backOut(iv(t, [26 + q * 3, 48 + q * 3], [0, 1]), 1.4);
                const br = 1 + breathe * (0.08 * Math.sin(t * 0.085 + q * 0.95) + 0.03 * Math.sin(t * 0.23 + q * 2));
                const h = Math.max(0, bpl.h * b * grow * br);
                const bw = slot * 0.6;
                const x = bpl.x + slot * q + (slot - bw) / 2;
                const y = bpl.y + bpl.h - h;
                return (
                  <g key={q}>
                    <rect x={x} y={y} width={bw} height={h} rx={5} fill="url(#gfBar)" />
                    <rect x={x} y={y} width={bw} height={Math.min(4, h)} rx={2} fill="#E6FBFF" opacity={0.85} />
                    <text x={x + bw / 2} y={bpl.y + bpl.h + 24} textAnchor="middle" fontFamily={fontMono} fontSize={13} fill={B.text3} opacity={eB}>
                      {BLAB[q]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </Panel>

          {/* stat panel */}
          <Panel r={SP} e={eS} title="Utilisateurs" flash={0.5 * stFlash}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", fontFamily: fontMono, fontWeight: 700, fontSize: 52, letterSpacing: "-0.04em", color: B.white, textShadow: `0 0 ${(18 + 16 * stFlash).toFixed(1)}px ${rgba(CYAN, 0.55)}` }}>{group(stat)}</div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 138, textAlign: "center", fontFamily: fontMono, fontWeight: 700, fontSize: 18, color: B.ok, opacity: iv(t, [60, 74], [0, 1]) }}>▲ 12 %</div>
            <svg width={SP.w} height={SP.h} style={{ position: "absolute", left: 0, top: 0 }}>
              {(() => {
                const sp: Array<[number, number]> = [];
                const n = 14;
                for (let q = 0; q <= n; q++) {
                  const x = (SP.w * q) / n;
                  const v = 0.35 + 0.035 * q + 0.1 * Math.sin(q * 1.3 + t * 0.03) + 0.06 * (rand(q * 3.3) - 0.5);
                  sp.push([x, SP.h - 12 - 58 * v * sc]);
                }
                const l = sp.map((p, q) => `${q ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
                return (
                  <g opacity={eS}>
                    <path d={`${l} L${SP.w} ${SP.h} L0 ${SP.h} Z`} fill={rgba(CYAN, 0.12)} />
                    <path d={l} fill="none" stroke={rgba(CYAN, 0.6)} strokeWidth={2.5} strokeLinejoin="round" />
                  </g>
                );
              })()}
            </svg>
          </Panel>

          {/* gauge panel */}
          <Panel r={GP} e={eG} title="CPU">
            <svg width={GP.w} height={GP.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <defs>
                <linearGradient id="gfGa" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0" stopColor="#0EA5E9" />
                  <stop offset="1" stopColor="#67E8F9" />
                </linearGradient>
              </defs>
              <path d={arc(1)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={14} strokeLinecap="round" />
              {gv > 0.004 ? <path d={arc(gv)} fill="none" stroke="url(#gfGa)" strokeWidth={14} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${rgba(CYAN, 0.7)})` }} /> : null}
              {Array.from({ length: 9 }, (_, q) => {
                const a = A0 + (ASPAN * q) / 8;
                const [x1, y1] = arcPt(a, GC.r + 13);
                const [x2, y2] = arcPt(a, GC.r + 18);
                return <line key={q} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(226,236,250,0.3)" strokeWidth={2} strokeLinecap="round" />;
              })}
            </svg>
            <div style={{ position: "absolute", left: 0, right: 0, top: GC.y - 24, textAlign: "center", fontFamily: fontMono, fontWeight: 700, fontSize: 38, color: B.white, textShadow: `0 0 14px ${rgba(CYAN, 0.4)}` }}>
              {Math.round(Math.max(0, gv) * 100)}
              <span style={{ fontSize: 22, color: B.text2 }}>%</span>
            </div>
          </Panel>
        </div>
      </div>

      {/* the amber moment on the peak (stage coords) */}
      <Flare age={t - HL} x={WIN.x + LP.x + pkx} y={WIN.y + LP.y + pky} col={AMBER} dur={30} strength={0.6 * pkVis} w={420} />
      <Sparks age={t - HL} x={WIN.x + LP.x + pkx} y={WIN.y + LP.y + pky} n={12} r={110} col={AMBER} seed={11} />
    </div>
  );
};
