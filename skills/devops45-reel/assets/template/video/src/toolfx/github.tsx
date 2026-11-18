import React from "react";
import { Logo } from "../kit/Logo";
import { fontInter, fontMono } from "../kit/fonts";
import { B, glass } from "../lib/look";
import { AMBER, AnamorphicFlare, clamp01, CYAN, decay, EASE_IN_OUT, EASE_OUT, ICE, iv, rgba, Shockwave } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/**
 * GitHub — « souvent en ligne sur GitHub ».
 * 0     a laptop (bottom left) with a small git timeline on its screen; a glass repo card « mon-projet » (top right)
 *       with the real GitHub logo.
 * 12    an amber « git push » pill pops; three glowing packets arc from the laptop up into the repo, each arrival adds a
 *       commit row (the third one ≈ f0+54 makes the card ring with light).
 * 60    three teammate avatars pop under the card; packets go down to them (« pull ») and each gets a ✓ copy badge.
 * idle  packets keep flowing (push up, pull down), avatars bob, the laptop timeline shimmers.
 */
type P2 = [number, number];
const qb = (a: P2, c: P2, b: P2, t: number): P2 => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
};

// layout (760 design box)
const LAP = { x: 34, y: 452, w: 262, h: 164 }; // screen
const CARD = { x: 392, y: 70, w: 324, h: 396 };
const PUSH: [P2, P2, P2] = [[LAP.x + LAP.w - 30, LAP.y + 8], [LAP.x + LAP.w + 10, 210], [CARD.x - 6, 250]];
const AV = [
  { x: 440, y: 590, tint: CYAN },
  { x: 576, y: 640, tint: ICE },
  { x: 706, y: 586, tint: [134, 239, 172] as [number, number, number] },
];
const AR = 40;
const pullPath = (k: number): [P2, P2, P2] => {
  const a = AV[k];
  const sx = Math.max(CARD.x + 40, Math.min(CARD.x + CARD.w - 40, a.x));
  const s: P2 = [sx, CARD.y + CARD.h - 4];
  const e: P2 = [a.x, a.y - AR - 4];
  return [s, [(s[0] + e[0]) / 2 + (k === 1 ? 0 : k === 0 ? -20 : 20), (s[1] + e[1]) / 2], e];
};

const LAUNCH = [16, 26, 36];
const FLY = 18;
const ARRIVE = LAUNCH.map((l) => l + FLY);
const AV_POP = [60, 68, 76];
const PULL0 = [80, 86, 92];
const PFLY = 16;
const HASH = ["a1f3c9e", "7be2041", "c93d1ef"];
const MSG = [150, 110, 132];

const Packet: React.FC<{ path: [P2, P2, P2]; p: number; col?: [number, number, number]; s?: number }> = ({ path, p, col = CYAN, s = 1 }) => {
  if (p <= 0 || p >= 1) return null;
  const pts = [0, 0.05, 0.1, 0.15].map((d) => ({ d, q: qb(path[0], path[1], path[2], clamp01(EASE_IN_OUT(p) - d)) }));
  return (
    <>
      {pts.map(({ d, q }, k) => {
        const r = (k === 0 ? 11 : 9 - k * 2) * s;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: q[0] - r,
              top: q[1] - r,
              width: r * 2,
              height: r * 2,
              borderRadius: k === 0 ? 5 * s : r,
              background: k === 0 ? `linear-gradient(140deg, #FFFFFF, ${rgba(col, 1)})` : rgba(col, 0.55 - d * 2.5),
              boxShadow: k === 0 ? `0 0 18px ${rgba(col, 0.95)}, 0 0 4px #fff` : undefined,
              transform: k === 0 ? `rotate(${(p * 180).toFixed(1)}deg)` : undefined,
              opacity: iv(p, [0, 0.08, 0.92, 1], [0, 1, 1, 0]),
            }}
          />
        );
      })}
    </>
  );
};

const Person: React.FC<{ tint: [number, number, number] }> = ({ tint }) => (
  <svg width={AR * 2} height={AR * 2} viewBox="0 0 80 80" style={{ position: "absolute", left: 0, top: 0 }}>
    <defs>
      <clipPath id="avClip">
        <circle cx={40} cy={40} r={36} />
      </clipPath>
    </defs>
    <g clipPath="url(#avClip)">
      <circle cx={40} cy={31} r={13} fill={rgba(tint, 0.95)} />
      <ellipse cx={40} cy={72} rx={26} ry={20} fill={rgba(tint, 0.8)} />
    </g>
  </svg>
);

export const GitHubFx: ToolFx = ({ g, f0, size }) => {
  const t = g - f0;
  const appear = iv(t, [0, 12], [0, 1], EASE_OUT);
  const cardS = t < 14 ? iv(t, [0, 14], [0.8, 1.03], EASE_OUT) : iv(t, [14, 24], [1.03, 1], EASE_OUT);
  const rows = ARRIVE.filter((a) => t >= a).length;
  const lastArr = t - ARRIVE[2];
  const cardBob = Math.sin(t * 0.04) * 4;

  // idle push packets: every 28 frames from 64 ; idle pulls every 42 frames per avatar from 112
  const pushPs: number[] = LAUNCH.map((l) => (t - l) / FLY);
  if (t > 64) {
    const n = Math.floor((t - 64) / 28);
    for (let k = Math.max(0, n - 1); k <= n; k++) pushPs.push((t - 64 - k * 28) / FLY);
  }
  const arrivals = [...ARRIVE, ...(t > 64 ? [64 + Math.floor((t - 64 - FLY) / 28) * 28 + FLY] : [])].filter((a) => t >= a);
  const lastAnyArr = arrivals.length ? t - Math.max(...arrivals) : 99;
  const pushPill = t < 12 ? 0 : t < 18 ? iv(t, [12, 18], [0, 1.15], EASE_OUT) : iv(t, [18, 26], [1.15, 1]);

  const pushPath = (
    <path d={`M${PUSH[0][0]} ${PUSH[0][1]} Q${PUSH[1][0]} ${PUSH[1][1]} ${PUSH[2][0]} ${PUSH[2][1]}`} fill="none" stroke={rgba(CYAN, 0.45)} strokeWidth={4} strokeDasharray="4 12" strokeLinecap="round" strokeDashoffset={-t * 1.2} pathLength={undefined} />
  );

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: `scale(${(size / 760).toFixed(4)})`, transformOrigin: "0 0" }}>
      {/* back light behind the repo */}
      <div style={{ position: "absolute", left: CARD.x - 80, top: CARD.y - 60, width: CARD.w + 160, height: CARD.h + 120, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, 0.16 + 0.22 * decay(lastArr, 18))}, rgba(0,0,0,0))`, filter: "blur(26px)", opacity: appear }} />

      {/* ── laptop ── */}
      <div style={{ position: "absolute", left: 0, top: 0, opacity: appear, transform: `translateY(${((1 - appear) * 24).toFixed(1)}px)` }}>
        <div style={{ position: "absolute", left: LAP.x, top: LAP.y, width: LAP.w, height: LAP.h, ...glass("34,211,238", 0.8), borderRadius: 18, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 10, borderRadius: 10, background: "rgba(5,10,24,0.78)" }} />
          <div style={{ position: "absolute", left: 22, top: 20 }}>
            <Logo name="git" size={40} draw={iv(t, [2, 16], [0, 1], EASE_OUT)} />
          </div>
          <div style={{ position: "absolute", left: 74, top: 30, fontFamily: fontMono, fontWeight: 700, fontSize: 18, color: B.text2 }}>local</div>
          <svg width={LAP.w} height={LAP.h} style={{ position: "absolute", left: 0, top: 0 }}>
            <line x1={34} y1={108} x2={LAP.w - 30} y2={108} stroke={rgba(CYAN, 0.7)} strokeWidth={4} strokeLinecap="round" />
            {[0, 1, 2].map((k) => {
              const x = 64 + k * 66;
              const hot = decay(t - LAUNCH[k], 10);
              return <circle key={k} cx={x} cy={108} r={10 + 3 * hot} fill={hot > 0.05 ? "#FFFFFF" : B.cyan} stroke="rgba(255,255,255,0.8)" strokeWidth={2} style={{ filter: `drop-shadow(0 0 ${6 + 10 * hot}px ${B.cyan})` }} />;
            })}
            {t > 30 ? <circle cx={34 + (((t - 30) * 3) % (LAP.w - 64))} cy={108} r={3.5} fill="#FFFFFF" /> : null}
            {[0, 1, 2].map((k) => (
              <text key={k} x={64 + k * 66} y={140} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight={700} fontSize={16} fill="rgba(226,236,250,0.65)">
                v{k + 1}
              </text>
            ))}
          </svg>
        </div>
        {/* base */}
        <div style={{ position: "absolute", left: LAP.x - 22, top: LAP.y + LAP.h + 2, width: LAP.w + 44, height: 18, borderRadius: "4px 4px 14px 14px", background: "linear-gradient(180deg, rgba(226,236,250,0.32), rgba(148,190,255,0.12))", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 14px 30px rgba(0,0,0,0.5)" }} />
        <div style={{ position: "absolute", left: LAP.x + LAP.w / 2 - 34, top: LAP.y + LAP.h + 2, width: 68, height: 6, borderRadius: "0 0 6px 6px", background: "rgba(5,10,24,0.6)" }} />
        <div style={{ position: "absolute", left: LAP.x, width: LAP.w, top: LAP.y + LAP.h + 34, textAlign: "center", fontFamily: fontInter, fontWeight: 600, fontSize: 21, color: B.text3, letterSpacing: "0.04em" }}>ton PC</div>
      </div>

      {/* push route */}
      <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: iv(t, [8, 16], [0, 1]) }}>
        {pushPath}
        <path d={`M${PUSH[2][0] - 2} ${PUSH[2][1]} l-16 -9 v18 z`} fill={rgba(CYAN, 0.7)} />
        {/* pull routes */}
        {AV.map((_, k) => {
          const [s, c, e] = pullPath(k);
          return <path key={k} d={`M${s[0]} ${s[1]} Q${c[0]} ${c[1]} ${e[0]} ${e[1]}`} fill="none" stroke={rgba(CYAN, 0.32)} strokeWidth={3} strokeDasharray="3 10" strokeLinecap="round" strokeDashoffset={-t * 1.1} opacity={iv(t, [AV_POP[k], AV_POP[k] + 10], [0, 1])} />;
        })}
      </svg>

      {/* « git push » pill */}
      <div
        style={{
          position: "absolute",
          left: 36,
          top: 318,
          padding: "8px 20px",
          borderRadius: 26,
          background: "linear-gradient(140deg, rgba(245,158,11,0.3), rgba(245,158,11,0.1))",
          border: `1.5px solid ${rgba(AMBER, 0.9)}`,
          boxShadow: `0 0 ${20 + 30 * decay(t - 12, 12)}px ${rgba(AMBER, 0.45)}`,
          fontFamily: fontMono,
          fontWeight: 700,
          fontSize: 28,
          color: "#FFE7B8",
          transform: `scale(${pushPill.toFixed(3)}) translateY(${(Math.sin(t * 0.06) * 3).toFixed(2)}px)`,
          opacity: clamp01(pushPill * 1.5),
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ color: B.amber }}>$</span> git push
      </div>

      {/* ── repo card ── */}
      <div
        style={{
          position: "absolute",
          left: CARD.x,
          top: CARD.y,
          width: CARD.w,
          height: CARD.h,
          opacity: appear,
          transform: `translateY(${cardBob.toFixed(2)}px) scale(${(cardS * (1 + 0.025 * decay(lastAnyArr, 6))).toFixed(4)})`,
        }}
      >
        <div style={{ position: "absolute", inset: 0, ...glass("34,211,238", 1 + 0.9 * decay(lastArr, 16) + 0.3 * decay(lastAnyArr, 8)), borderRadius: 30, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 22, top: 22 }}>
            <Logo name="github" size={80} draw={iv(t, [2, 18], [0, 1], EASE_OUT)} glow={0.3 + 0.4 * decay(lastArr, 16)} />
          </div>
          <div style={{ position: "absolute", left: 120, top: 30, fontFamily: fontInter, fontWeight: 800, fontSize: 30, letterSpacing: "-0.02em", color: B.white }}>mon-projet</div>
          <div style={{ position: "absolute", left: 120, top: 72, display: "flex", alignItems: "center", gap: 10, fontFamily: fontMono, fontWeight: 500, fontSize: 18, color: B.text2 }}>
            <span style={{ padding: "2px 10px", borderRadius: 10, border: `1px solid ${rgba(CYAN, 0.5)}`, color: "#A5F3FC" }}>main</span>
            <span>
              {rows} commit{rows > 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ position: "absolute", left: 20, right: 20, top: 124, height: 1, background: "rgba(255,255,255,0.1)" }} />
          {[0, 1, 2].map((i) => {
            const a = t - ARRIVE[i];
            if (a < 0) return null;
            const e = iv(a, [0, 10], [0, 1], EASE_OUT);
            const hot = decay(a, 10);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 18,
                  right: 18,
                  top: 142 + i * 76,
                  height: 62,
                  borderRadius: 16,
                  background: `linear-gradient(90deg, ${rgba(CYAN, 0.08 + 0.25 * hot)}, rgba(255,255,255,0.02))`,
                  border: `1px solid ${rgba(CYAN, 0.18 + 0.5 * hot)}`,
                  opacity: e,
                  transform: `translateX(${((1 - e) * -40).toFixed(1)}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  paddingLeft: 16,
                  boxSizing: "border-box",
                }}
              >
                <div style={{ width: 16, height: 16, borderRadius: 8, background: B.cyan, boxShadow: `0 0 ${8 + 14 * hot}px ${B.cyan}`, flexShrink: 0 }} />
                <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 22, color: B.white }}>{HASH[i]}</span>
                <div style={{ width: MSG[i] * iv(a, [4, 16], [0, 1], EASE_OUT), height: 12, borderRadius: 6, background: "rgba(226,236,250,0.28)" }} />
              </div>
            );
          })}
          {/* sheen on arrivals */}
          {lastAnyArr < 18 ? (
            <div style={{ position: "absolute", top: -60, bottom: -60, width: 90, left: -120 + (lastAnyArr / 18) * (CARD.w + 220), transform: "skewX(-20deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.18), rgba(255,255,255,0))" }} />
          ) : null}
        </div>
      </div>

      {/* push packets */}
      {pushPs.map((p, k) => (
        <Packet key={`p${k}`} path={PUSH} p={p} />
      ))}

      {/* avatars + pulls */}
      {AV.map((a, k) => {
        const age = t - AV_POP[k];
        if (age < 0) return null;
        const s = age < 7 ? iv(age, [0, 7], [0, 1.2], EASE_OUT) : iv(age, [7, 15], [1.2, 1], EASE_OUT);
        const by = Math.sin(t * 0.07 + k * 1.9) * 6;
        const pulls: number[] = [(t - PULL0[k]) / PFLY];
        if (t > 112) {
          const n = Math.floor((t - 112 - k * 14) / 42);
          for (let m = Math.max(0, n - 1); m <= n; m++) pulls.push((t - 112 - k * 14 - m * 42) / PFLY);
        }
        const got = t - (PULL0[k] + PFLY);
        const lastGot = pulls.map((p) => (p >= 1 ? (p - 1) * PFLY : 99)).reduce((m, v) => Math.min(m, v), 99);
        const ring = decay(lastGot, 8);
        return (
          <React.Fragment key={k}>
            {pulls.map((p, m) => (
              <Packet key={m} path={pullPath(k)} p={p} col={a.tint} s={0.8} />
            ))}
            <div
              style={{
                position: "absolute",
                left: a.x - AR,
                top: a.y - AR + by,
                width: AR * 2,
                height: AR * 2,
                borderRadius: AR,
                background: "radial-gradient(circle at 40% 30%, rgba(30,50,90,0.95), rgba(8,14,32,0.95))",
                border: `3px solid ${rgba(a.tint, 0.7 + 0.3 * ring)}`,
                boxShadow: `0 0 ${14 + 26 * ring}px ${rgba(a.tint, 0.5 + 0.4 * ring)}, 0 10px 24px rgba(0,0,0,0.5)`,
                transform: `scale(${(s * (1 + 0.08 * ring)).toFixed(3)})`,
                overflow: "hidden",
              }}
            >
              <Person tint={a.tint} />
            </div>
            {got >= 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: a.x + AR * 0.45,
                  top: a.y + AR * 0.3 + by,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: B.ok,
                  border: "2.5px solid #04121A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${(got < 6 ? iv(got, [0, 6], [0, 1.3], EASE_OUT) : iv(got, [6, 12], [1.3, 1])).toFixed(3)})`,
                }}
              >
                <svg width={16} height={16} viewBox="0 0 16 16">
                  <path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="#04121A" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ) : null}
          </React.Fragment>
        );
      })}

      {/* « pull » tag */}
      <div style={{ position: "absolute", left: 494, top: 496, fontFamily: fontMono, fontWeight: 700, fontSize: 22, color: "#A5F3FC", opacity: iv(t, [84, 96], [0, 0.9]), textShadow: `0 0 14px ${rgba(CYAN, 0.6)}` }}>pull</div>

      <Shockwave age={lastArr} x={CARD.x + CARD.w / 2} y={CARD.y + CARD.h / 2} col={CYAN} dur={24} strength={0.7} maxR={260} r0={120} />
      <AnamorphicFlare age={t - 12} x={140} y={344} col={AMBER} dur={26} strength={0.45} size={90} streakH={60} />
    </div>
  );
};
