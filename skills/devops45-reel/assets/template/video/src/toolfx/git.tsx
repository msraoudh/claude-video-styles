import React from "react";
import { Logo } from "../kit/Logo";
import { fontInter, fontMono } from "../kit/fonts";
import { B, glass } from "../lib/look";
import { AMBER, AnamorphicFlare, clamp01, CYAN, decay, EASE_IN_OUT, EASE_OUT, ICE, iv, rgba, Shockwave } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/**
 * Git — « tu ranges chaque version dans Git ».
 * 0     a glass document card « app.js » above a timeline that draws on from the real Git logo.
 * 4/24/44  the document changes (a new line grows); camera-flash glint; a snapshot copy flies down onto the timeline and
 *       lands as a commit dot v1, v2, v3.
 * 66    a branch splits off upward from v2 (dot « branche »), then curves back down and merges as v4 (amber, flare) ≈ 98.
 * idle  a light runs along the line, the latest dot pulses; every 150 frames an amber « remonter le temps » pill
 *       travels back to v1 and the document shows its v1 state, then returns to the latest.
 */
const LY = 540; // timeline y
const LX0 = 134;
const LX1 = 724;
const DOTS = [222, 342, 462, 612];
const CARD = { x: 250, y: 40, w: 260, h: 250 };
const CC = { x: CARD.x + CARD.w / 2, y: CARD.y + CARD.h / 2 };
const CHG = [4, 24, 44];
const FL = CHG.map((c) => c + 8);
const BR0 = 64;
const BR1 = 80;
const MG0 = 82;
const MG1 = 98;
const LAND = [...FL.map((f) => f + 16), MG1];
const LINE_W = [176, 124, 190, 142, 168, 112];
const LINE_AT = [-99, -99, CHG[0], CHG[1], CHG[2], MG1 - 6];
const BRANCH = { x: 472, y: 410 };
const P_UP: [number, number][] = [[DOTS[1], LY], [DOTS[1] + 70, LY], [BRANCH.x - 70, BRANCH.y], [BRANCH.x, BRANCH.y]];
const P_DN: [number, number][] = [[BRANCH.x, BRANCH.y], [BRANCH.x + 70, BRANCH.y], [DOTS[3] - 70, LY], [DOTS[3], LY]];
const bez = (p: [number, number][], t: number): [number, number] => {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0], a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1]];
};
const dPath = (p: [number, number][]) => `M${p[0][0]} ${p[0][1]} C${p[1][0]} ${p[1][1]} ${p[2][0]} ${p[2][1]} ${p[3][0]} ${p[3][1]}`;

// rewind cycle
const TR = 124;
const PR = 150;

const Star: React.FC<{ x: number; y: number; s: number; o: number; col?: string }> = ({ x, y, s, o, col = "#FFFFFF" }) =>
  o > 0.01 ? (
    <svg width={60} height={60} viewBox="-30 -30 60 60" style={{ position: "absolute", left: x - 30, top: y - 30, transform: `scale(${s.toFixed(3)})`, opacity: o, overflow: "visible", filter: "drop-shadow(0 0 8px rgba(190,240,255,0.95))" }}>
      <path d="M0 -28 C3 -6 6 -3 28 0 C6 3 3 6 0 28 C-3 6 -6 3 -28 0 C-6 -3 -3 -6 0 -28Z" fill={col} />
    </svg>
  ) : null;

/** the document lines (also used for the flying snapshot) */
const DocLines: React.FC<{ t: number; count: number; amberAge: number[] }> = ({ t, count, amberAge }) => (
  <>
    {LINE_W.map((w, j) => {
      const grow = j < 2 ? 1 : iv(t, [LINE_AT[j], LINE_AT[j] + 10], [0, 1], EASE_OUT);
      const vis = j < count ? 1 : 0;
      if (grow <= 0 || vis <= 0) return null;
      const a = amberAge[j] ?? 99;
      const hot = decay(a, 14);
      return (
        <div
          key={j}
          style={{
            position: "absolute",
            left: 28 + (j === 3 || j === 4 ? 26 : 0),
            top: 82 + j * 26,
            width: w * grow - (j === 3 || j === 4 ? 26 : 0),
            height: 12,
            borderRadius: 6,
            background: hot > 0.02 ? `linear-gradient(90deg, ${rgba(AMBER, 0.5 + 0.5 * hot)}, ${rgba(CYAN, 0.6)})` : j === count - 1 && j >= 2 ? rgba(CYAN, 0.62) : "rgba(226,236,250,0.32)",
            boxShadow: hot > 0.02 ? `0 0 14px ${rgba(AMBER, 0.6 * hot)}` : undefined,
          }}
        />
      );
    })}
  </>
);

export const GitFx: ToolFx = ({ g, f0, size }) => {
  const t = g - f0;

  const appear = iv(t, [0, 12], [0, 1], EASE_OUT);
  const lineDraw = iv(t, [0, 20], [0, 1], EASE_OUT);
  const nLanded = LAND.filter((l) => t >= l).length;

  // rewind state
  const u = t >= TR ? (t - TR) % PR : -1;
  const rwO = u >= 0 ? iv(u, [0, 8, 84, 98], [0, 1, 1, 0]) : 0;
  const px = u >= 0 ? iv(u, [6, 46], [DOTS[3], DOTS[0]], EASE_IN_OUT) : DOTS[3];
  const rewinding = u >= 0 && u < 90;
  const viewV = rewinding ? Math.max(1, DOTS.filter((x) => x <= px + 6).length) : nLanded;
  const atV1 = u >= 46 && u < 90 ? iv(u, [46, 52, 82, 90], [0, 1, 1, 0]) : 0;

  // doc lines count: 2 base + one per version shown (the merge brings the 6th)
  const liveCount = 2 + CHG.filter((c) => t >= c).length + (t >= MG1 - 6 ? 1 : 0);
  const count = rewinding ? 2 + viewV : liveCount;
  const amberAge = LINE_W.map((_, j) => (j >= 2 ? t - LINE_AT[j] : 99));

  // flash per snapshot (and on merge)
  const flashAges = [...FL.map((f) => t - f), t - MG1];
  const flash = flashAges.reduce((m, a, i) => Math.max(m, decay(a, 5) * (a >= 0 ? 1 : 0) * (i === 3 ? 0.25 : 1)), 0);

  // bright segment of the main line grows to the last landed main dot (flights grow it)
  let brightTo = LX0;
  [0, 1, 2].forEach((i) => {
    brightTo = Math.max(brightTo, iv(t, [FL[i], LAND[i]], [i === 0 ? LX0 : DOTS[i - 1], DOTS[i]], EASE_IN_OUT));
  });
  brightTo = Math.max(brightTo, iv(t, [MG0, MG1], [DOTS[2], DOTS[3]], EASE_IN_OUT));

  const upP = iv(t, [BR0, BR1], [0, 1], EASE_IN_OUT);
  const dnP = iv(t, [MG0, MG1], [0, 1], EASE_IN_OUT);
  const bob = Math.sin(t * 0.05) * 4;
  const mergeAge = t - MG1;

  // idle light
  const runX = t > 104 ? LX0 + (((t - 104) * 6) % (LX1 - LX0 + 120)) - 60 : -999;
  const pulsePh = t > 104 ? ((t - 104) % 48) / 48 : -1;

  const dotNode = (i: number) => {
    const age = t - LAND[i];
    if (age < 0) return null;
    const s = age < 6 ? iv(age, [0, 6], [0, 1.4], EASE_OUT) : iv(age, [6, 14], [1.4, 1], EASE_OUT);
    const merge = i === 3;
    const passed = rewinding && Math.abs(px - DOTS[i]) < 30 ? 1 - Math.abs(px - DOTS[i]) / 30 : 0;
    const v1hot = i === 0 ? atV1 : 0;
    const col = merge ? AMBER : CYAN;
    return (
      <React.Fragment key={i}>
        <div
          style={{
            position: "absolute",
            left: DOTS[i] - 17,
            top: LY - 17,
            width: 34,
            height: 34,
            borderRadius: 17,
            background: merge ? `radial-gradient(circle at 40% 35%, #FFE1A3, ${B.amber})` : `radial-gradient(circle at 40% 35%, #CFFAFE, ${B.cyan})`,
            border: "3px solid rgba(255,255,255,0.85)",
            boxShadow: `0 0 ${18 + 30 * (decay(age, 10) + passed + v1hot)}px ${rgba(v1hot > 0.05 ? AMBER : col, 0.75)}`,
            transform: `scale(${(s * (1 + 0.25 * passed + 0.2 * v1hot)).toFixed(3)})`,
          }}
        />
        {/* landing ring */}
        {age < 22 ? (
          <div
            style={{
              position: "absolute",
              left: DOTS[i] - 17 - age * 2.2,
              top: LY - 17 - age * 2.2,
              width: 34 + age * 4.4,
              height: 34 + age * 4.4,
              borderRadius: "50%",
              border: `2.5px solid ${rgba(col, 0.8 * (1 - age / 22))}`,
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            left: DOTS[i] - 40,
            width: 80,
            top: LY + 30,
            textAlign: "center",
            fontFamily: fontMono,
            fontWeight: 700,
            fontSize: 28,
            color: merge || v1hot > 0.05 ? "#FFD58A" : B.white,
            opacity: iv(age, [2, 10], [0, 1]),
            transform: `translateY(${((1 - iv(age, [2, 12], [0, 1], EASE_OUT)) * 10).toFixed(1)}px)`,
            textShadow: `0 0 16px ${rgba(merge ? AMBER : CYAN, 0.5)}`,
          }}
        >
          v{i + 1}
        </div>
      </React.Fragment>
    );
  };

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: `scale(${(size / 760).toFixed(4)})`, transformOrigin: "0 0" }}>
      {/* back light under the card */}
      <div style={{ position: "absolute", left: 160, top: 0, width: 440, height: 360, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, 0.14 + 0.2 * flash)}, rgba(0,0,0,0))`, filter: "blur(24px)", opacity: appear }} />

      {/* ── document card ── */}
      <div
        style={{
          position: "absolute",
          left: CARD.x,
          top: CARD.y,
          width: CARD.w,
          height: CARD.h,
          opacity: appear,
          transform: `translateY(${(bob + (1 - appear) * 20).toFixed(2)}px) scale(${(0.9 + 0.1 * appear + 0.03 * flash).toFixed(4)}) perspective(1600px) rotateY(${(Math.sin(t * 0.03) * 3).toFixed(2)}deg)`,
        }}
      >
        <div style={{ position: "absolute", inset: 0, ...glass(atV1 > 0.05 ? "245,158,11" : "34,211,238", 1 + flash), borderRadius: 26, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 60, borderBottom: "1px solid rgba(255,255,255,0.09)", display: "flex", alignItems: "center", gap: 12, paddingLeft: 24 }}>
            <svg width={24} height={30} viewBox="0 0 24 30">
              <path d="M2 2 H15 L22 9 V28 H2 Z" fill="none" stroke={B.cyan} strokeWidth={2.4} strokeLinejoin="round" />
              <path d="M15 2 V9 H22" fill="none" stroke={B.cyan} strokeWidth={2.4} strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 24, color: B.white }}>app.js</span>
          </div>
          <DocLines t={t} count={count} amberAge={amberAge} />
          {/* rewind tint + v1 badge */}
          {atV1 > 0.02 ? (
            <>
              <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(0deg, rgba(245,158,11,0.05) 0 2px, rgba(0,0,0,0) 2px 6px)`, opacity: atV1 }} />
              <div style={{ position: "absolute", right: 16, top: 14, padding: "4px 12px", borderRadius: 12, background: rgba(AMBER, 0.2), border: `1.5px solid ${rgba(AMBER, 0.8)}`, fontFamily: fontMono, fontWeight: 700, fontSize: 22, color: "#FFD58A", opacity: atV1 }}>v1</div>
            </>
          ) : null}
          {/* camera flash + glint */}
          <div style={{ position: "absolute", inset: 0, background: "rgb(225,248,255)", opacity: 0.75 * flash }} />
          {flashAges.map((a, i) =>
            a >= 0 && a < 16 ? (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: -60,
                  bottom: -60,
                  width: 70,
                  left: -100 + (a / 16) * (CARD.w + 180),
                  transform: "skewX(-20deg)",
                  background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.55), rgba(255,255,255,0))",
                }}
              />
            ) : null,
          )}
        </div>
      </div>
      {flashAges.map((a, i) => (
        <Star key={i} x={CARD.x + CARD.w - 14} y={CARD.y + 16 + bob} s={a < 0 ? 0 : iv(a, [0, 5, 16], [0.2, 1.1, 0.6], EASE_OUT)} o={a < 0 ? 0 : iv(a, [0, 2, 16], [0, 1, 0])} />
      ))}

      {/* ── timeline ── */}
      <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <filter id="gitGlow" x="-20%" y="-200%" width="140%" height="500%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        {/* base line (future part dimmer) */}
        <line x1={LX0} y1={LY} x2={LX0 + (LX1 - LX0) * lineDraw} y2={LY} stroke={rgba(CYAN, 0.28)} strokeWidth={6} strokeLinecap="round" />
        {/* bright history */}
        <line x1={LX0} y1={LY} x2={brightTo} y2={LY} stroke={rgba(CYAN, 0.75)} strokeWidth={12} strokeLinecap="round" filter="url(#gitGlow)" />
        <line x1={LX0} y1={LY} x2={brightTo} y2={LY} stroke={B.cyan} strokeWidth={6} strokeLinecap="round" />
        {/* branch */}
        {upP > 0 ? (
          <>
            <path d={dPath(P_UP)} fill="none" stroke={rgba(ICE, 0.6)} strokeWidth={12} filter="url(#gitGlow)" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - upP} />
            <path d={dPath(P_UP)} fill="none" stroke="#A5F3FC" strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - upP} />
          </>
        ) : null}
        {dnP > 0 ? (
          <>
            <path d={dPath(P_DN)} fill="none" stroke={rgba(ICE, 0.6)} strokeWidth={12} filter="url(#gitGlow)" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - dnP} />
            <path d={dPath(P_DN)} fill="none" stroke="#A5F3FC" strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - dnP} />
          </>
        ) : null}
        {/* travelling head on the branch */}
        {upP > 0 && upP < 1 ? <circle cx={bez(P_UP, upP)[0]} cy={bez(P_UP, upP)[1]} r={8} fill="#FFFFFF" style={{ filter: "drop-shadow(0 0 8px #A5F3FC)" }} /> : null}
        {dnP > 0 && dnP < 1 ? <circle cx={bez(P_DN, dnP)[0]} cy={bez(P_DN, dnP)[1]} r={8} fill="#FFFFFF" style={{ filter: "drop-shadow(0 0 8px #A5F3FC)" }} /> : null}
        {/* idle running light */}
        {runX > LX0 - 40 && runX < LX1 + 40 ? (
          <>
            <ellipse cx={runX} cy={LY} rx={46} ry={10} fill={rgba(ICE, 0.45)} filter="url(#gitGlow)" />
            <circle cx={runX} cy={LY} r={4} fill="#FFFFFF" />
          </>
        ) : null}
        {/* rewind trail */}
        {rwO > 0.01 ? (
          <g opacity={rwO}>
            <line x1={px + 14} y1={LY + 92} x2={DOTS[3]} y2={LY + 92} stroke={rgba(AMBER, 0.8)} strokeWidth={4} strokeDasharray="10 9" strokeLinecap="round" />
            <path d={`M${px + 4} ${LY + 92} l16 -11 v22 z`} fill={B.amber} />
          </g>
        ) : null}
      </svg>

      {/* branch dot */}
      {t >= BR1 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: BRANCH.x - 15,
              top: BRANCH.y - 15,
              width: 30,
              height: 30,
              borderRadius: 15,
              background: "radial-gradient(circle at 40% 35%, #FFFFFF, #A5F3FC)",
              border: "3px solid rgba(255,255,255,0.85)",
              boxShadow: `0 0 ${16 + 24 * decay(t - BR1, 10)}px ${rgba(ICE, 0.8)}`,
              transform: `scale(${(t - BR1 < 6 ? iv(t - BR1, [0, 6], [0, 1.35], EASE_OUT) : iv(t - BR1, [6, 14], [1.35, 1])).toFixed(3)})`,
            }}
          />
          <div style={{ position: "absolute", left: BRANCH.x - 80, width: 160, top: BRANCH.y - 56, textAlign: "center", fontFamily: fontInter, fontWeight: 700, fontSize: 21, letterSpacing: "0.06em", color: "#BDF4FF", opacity: iv(t - BR1, [2, 12], [0, 0.9]) }}>
            branche
          </div>
        </>
      ) : null}

      {/* main dots */}
      {[0, 1, 2, 3].map(dotNode)}

      {/* latest dot pulse */}
      {pulsePh >= 0 && !rewinding ? (
        <div
          style={{
            position: "absolute",
            left: DOTS[3] - 17 - pulsePh * 30,
            top: LY - 17 - pulsePh * 30,
            width: 34 + pulsePh * 60,
            height: 34 + pulsePh * 60,
            borderRadius: "50%",
            border: `2.5px solid ${rgba(AMBER, 0.7 * (1 - pulsePh))}`,
          }}
        />
      ) : null}

      {/* git logo at the start of the line */}
      <div style={{ position: "absolute", left: 22, top: LY - 50 }}>
        <Logo name="git" size={100} draw={iv(t, [0, 16], [0, 1], EASE_OUT)} glow={0.3 + 0.15 * Math.sin(t * 0.08) + 0.4 * decay(mergeAge, 14)} />
      </div>

      {/* snapshot copies flying down */}
      {[0, 1, 2].map((i) => {
        const p = clamp01((t - FL[i]) / (LAND[i] - FL[i]));
        if (t < FL[i] || t > LAND[i]) return null;
        const x = CC.x + (DOTS[i] - CC.x) * EASE_IN_OUT(p);
        const y = CC.y + 30 + (LY - CC.y - 30) * Math.pow(p, 1.3);
        const s = iv(p, [0, 1], [0.82, 0.12]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - CARD.w / 2,
              top: y - CARD.h / 2,
              width: CARD.w,
              height: CARD.h,
              transform: `scale(${s.toFixed(3)}) rotate(${(-10 * (1 - p)).toFixed(1)}deg)`,
              opacity: iv(p, [0, 0.12, 0.8, 1], [0, 1, 1, 0.2]),
              borderRadius: 26,
              background: "linear-gradient(150deg, rgba(207,250,254,0.35), rgba(34,211,238,0.12))",
              border: "2px solid rgba(207,250,254,0.9)",
              boxShadow: `0 0 40px ${rgba(CYAN, 0.7)}`,
            }}
          >
            <DocLines t={t} count={3 + i} amberAge={[]} />
          </div>
        );
      })}

      {/* rewind pill */}
      {rwO > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: Math.max(4, Math.min(760 - 270, px - 30)),
            top: LY + 120,
            height: 50,
            padding: "0 20px 0 14px",
            borderRadius: 25,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "linear-gradient(140deg, rgba(245,158,11,0.28), rgba(245,158,11,0.10))",
            border: `1.5px solid ${rgba(AMBER, 0.85)}`,
            boxShadow: `0 0 26px ${rgba(AMBER, 0.35)}`,
            opacity: rwO,
            transform: `scale(${(0.85 + 0.15 * rwO).toFixed(3)})`,
            whiteSpace: "nowrap",
          }}
        >
          <svg width={30} height={20} viewBox="0 0 30 20">
            <path d="M14 2 L2 10 L14 18 Z M28 2 L16 10 L28 18 Z" fill="#FFD58A" />
          </svg>
          <span style={{ fontFamily: fontInter, fontWeight: 700, fontSize: 22, color: "#FFE7B8" }}>remonter le temps</span>
        </div>
      ) : null}

      <Shockwave age={mergeAge} x={DOTS[3]} y={LY} col={AMBER} dur={24} strength={0.8} maxR={180} r0={20} />
      <AnamorphicFlare age={mergeAge} x={DOTS[3]} y={LY} col={AMBER} dur={32} strength={0.7} size={110} streakH={80} />
    </div>
  );
};
