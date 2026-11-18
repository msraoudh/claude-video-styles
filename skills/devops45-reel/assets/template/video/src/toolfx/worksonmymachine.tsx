import React from "react";
import { Logo } from "../kit/Logo";
import { fontInter, fontMono } from "../kit/fonts";
import { B, glass } from "../lib/look";
import { beatPulse, rand } from "../lib/sync";
import { AMBER, AnamorphicFlare, clamp01, CYAN, decay, EASE_IN_OUT, EASE_OUT, ICE, iv, rgba, Shockwave, type RGB } from "../archetypes/title/brand/fx";
import { ContainerBox } from "./docker";
import type { ToolFx } from "./types";

/*
 * Concept « worksonmymachine » — « Ton appli marche sur ton PC, mais plante sur le serveur ? Docker est né pour ça. »
 * (ep. 9 « Docker, c'est quoi ? »; label under the stage « Ça marche chez moi »).
 * LEFT a glass laptop « ton PC » runs the app window « mon-app » made of three pieces: code </>, libs « v2 », réglages ⚙.
 * RIGHT a glass server rack « serveur » (7 units, blinking LEDs).
 *   0       laptop + rack settle, the app boots (progress bar).
 *   TOK     « marche »: ✓ « ça marche » pops in the window (green burst + ring, the PC pill's dot turns green).
 *   SA→SB   a copy of the window peels off and flies along a high arc (dashed trail) onto the rack; it lands (squash,
 *           cyan ring) and starts booting…
 *   TCR     « plante »: CRASH — red header « ✗ erreur », glitch slices + chroma split, the window sags, the rack shakes,
 *           LEDs go red, smoke rises, red sparks + flare; the libs tile turns red « v1 » with a ≠ badge and the ⚙ tile
 *           falls out of the window, leaving a dashed « ? » slot.
 *   TPC     « serveur »: the two bad pieces slide into an error list — « version ≠ », « réglages ? ».
 *   TDK     « Docker »: the real Docker whale (Logo kit) on a frosted plate flies in from the top right and lands top
 *           centre as the hero (amber ring, cyan shockwave, flare, sparks); a cyan bridge draws from it down to the
 *           laptop and the rack — the hint: a small container rides the bridge from the PC to the server.
 *   idle    the container keeps riding (the plate pulses as it passes behind), the plate bobs + glints, smoke keeps
 *           rising, glitch bursts (calmer after Docker), LEDs blink, the ✓ breathes.
 * Phase words (item `beats`): ["marche", "serveur", "plante", "docker"] — sorted by time that is marche < plante <
 * serveur < docker → TOK / TCR / TPC / TDK. 3 words → TOK / TCR / TDK. Anything else → 14 / 46 / 66 % of the item.
 * Gaps are clamped (TCR ≥ TOK+46, TPC ≥ TCR+12, TDK ≥ TPC+16). Give the item `on: "appli"` so f0 comes before « marche ».
 * Drawn in a 760 design space.
 */

type P2 = [number, number];
type Q3 = [P2, P2, P2];

const RED: RGB = [248, 113, 113];
const GREEN: RGB = [52, 211, 153];

// app window (window-local coords inside)
const WW = 296;
const WH = 214;
const HB = 46; // title bar
const TS = 78; // tile
const TY = 99; // tile row centre
const TX = [54, 148, 242];
const LIST_Y = [92, 168];
const ICON_X = 50;
const CHECK = { x: 62, y: 178 };

// stage layout
const LAP = { x: 20, y: 356, w: 340, h: 258 }; // laptop lid
const LWIN = { x: 42, y: 378 }; // laptop app window
const RACK = { x: 474, y: 228, w: 236, h: 412 };
const SWIN = { x: 444, y: 328 }; // the copy on the server
const FLOOR = 640;
const PILL_Y = 700;
const HERO = { x: 390, y: 130, w: 232, h: 166 };
const FL: Q3 = [
  [LWIN.x + WW / 2, LWIN.y + WH / 2],
  [390, -190],
  [SWIN.x + WW / 2, SWIN.y + WH / 2],
]; // flight of the copy (apex ≈ y 136, under the future hero)
const BR: Q3 = [
  [LAP.x + LAP.w / 2, LAP.y - 6],
  [391, -40],
  [RACK.x + RACK.w / 2, RACK.y - 6],
]; // Docker's bridge (apex hidden behind the plate)

const q = (P: Q3, u: number): P2 => {
  const a = (1 - u) * (1 - u);
  const b = 2 * (1 - u) * u;
  const c = u * u;
  return [a * P[0][0] + b * P[1][0] + c * P[2][0], a * P[0][1] + b * P[1][1] + c * P[2][1]];
};
const arcD = (P: Q3, u0: number, u1: number, n = 36) => {
  let d = "";
  for (let i = 0; i <= n; i++) {
    const [x, y] = q(P, u0 + ((u1 - u0) * i) / n);
    d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d;
};
const backOut = (d: number) => (d >= 1 ? 1 : d <= 0 ? 0 : 1 + 2.2 * Math.pow(d - 1, 3) + 1.2 * Math.pow(d - 1, 2));

const gearPath = (cx: number, cy: number, R: number, r: number, n: number) => {
  const pts: string[] = [];
  const per = (2 * Math.PI) / n;
  const p = (rr: number, aa: number) => `${(cx + rr * Math.cos(aa)).toFixed(2)} ${(cy + rr * Math.sin(aa)).toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const a = i * per;
    pts.push(p(r, a - per * 0.32), p(R, a - per * 0.18), p(R, a + per * 0.18), p(r, a + per * 0.32));
  }
  return `M${pts.join(" L")} Z`;
};
const GEAR = gearPath(25, 25, 21, 15, 8);

/* ───────────────────────── the app window ───────────────────────── */

type WinP = {
  prog: number; // boot progress 0..1
  ok: number; // 0..1 ✓ « ça marche »
  okAge: number; // frames since the ✓ (<0 none)
  err: number; // 0..1 crashed
  errAge: number;
  bad: number; // 0..1 libs tile → red « v1 » ≠
  fall: number; // frames since the ⚙ tile started falling (<0 = in place)
  list: number; // 0..1 tiles → error list
  sweep: number; // <0 none, 0..1 light sweep
  flash: number; // white flash
  glow: number; // outer glow
};

const tileFace = (col: RGB, a: number): React.CSSProperties => ({
  position: "absolute",
  inset: 0,
  borderRadius: 20,
  background: `linear-gradient(150deg, ${rgba(col, 0.26 * a)}, ${rgba(col, 0.07 * a)})`,
  border: `1.5px solid ${rgba(col, 0.6 * a)}`,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,${(0.2 * a).toFixed(3)}), 0 0 16px ${rgba(col, 0.22 * a)}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const Win: React.FC<WinP> = ({ prog, ok, okAge, err, errAge, bad, fall, list, sweep, flash, glow }) => {
  const gc: RGB = err > 0.05 ? RED : ok > 0.05 ? GREEN : CYAN;
  const edge = err > 0.01 ? rgba(RED, 0.45 + 0.5 * err) : ok > 0.01 ? rgba(GREEN, 0.45 + 0.35 * ok) : rgba(CYAN, 0.5);
  const errPop = errAge >= 0 ? 1 + 0.3 * decay(errAge, 5) : 1;
  const listIn = iv(list, [0.35, 1], [0, 1]);
  const rowA = 1 - iv(list, [0, 0.45], [0, 1]);
  const falling = fall >= 0;
  const fy = falling ? 2 * fall + 0.6 * fall * fall : 0;
  const fo = falling ? iv(fall, [8, 18], [1, 0]) : 1;
  const slot = falling ? iv(fall, [2, 8], [0, 1]) : 0;
  const okS = okAge >= 0 ? backOut(iv(okAge, [0, 10], [0, 1])) : 0;
  const tile = (x: number, y: number, s: number, o: number, r: number, key: string, child: React.ReactNode) =>
    o > 0.005 ? (
      <div key={key} style={{ position: "absolute", left: x - TS / 2, top: y - TS / 2, width: TS, height: TS, opacity: o, transform: `rotate(${r.toFixed(2)}deg) scale(${s.toFixed(4)})` }}>
        {child}
      </div>
    ) : null;
  const libX = TX[1] + (ICON_X - TX[1]) * list;
  const libY = TY + (LIST_Y[0] - TY) * list;
  const cfgX = TX[2] + (ICON_X - TX[2]) * list;
  const cfgY = TY + (LIST_Y[1] - TY) * list;
  const ls = 1 - 0.28 * list;
  return (
    <div
      style={{
        position: "relative",
        width: WW,
        height: WH,
        borderRadius: 20,
        overflow: "hidden",
        background: "linear-gradient(165deg, #152C57 0%, #0D1D3F 55%, #0A1631 100%)",
        border: `1.5px solid ${edge}`,
        boxShadow: `0 18px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.16), 0 0 ${(14 + 34 * glow).toFixed(1)}px ${rgba(gc, 0.18 + 0.32 * Math.min(1, glow))}`,
      }}
    >
      {/* title bar */}
      <div style={{ position: "absolute", left: 0, top: 0, width: WW, height: HB, background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))", borderBottom: "1px solid rgba(255,255,255,0.09)" }} />
      {err > 0.01 ? <div style={{ position: "absolute", left: 0, top: 0, width: WW, height: HB, opacity: err, background: "linear-gradient(90deg, #E5383B 0%, #C0262D 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)" }} /> : null}
      {[0, 1, 2].map((j) => (
        <div key={j} style={{ position: "absolute", left: 16 + j * 18, top: HB / 2 - 6, width: 12, height: 12, borderRadius: 6, background: err > 0.5 ? `rgba(255,235,235,${[0.85, 0.55, 0.35][j]})` : rgba(CYAN, [0.6, 0.38, 0.24][j]) }} />
      ))}
      <div style={{ position: "absolute", left: 76, top: 0, height: HB, display: "flex", alignItems: "center", fontFamily: fontMono, fontWeight: 700, fontSize: 21, color: "rgba(226,236,250,0.85)", opacity: 1 - err, whiteSpace: "nowrap" }}>mon-app</div>
      {err > 0.01 ? (
        <div style={{ position: "absolute", left: 76, top: 0, height: HB, display: "flex", alignItems: "center", gap: 10, opacity: err, transform: `scale(${errPop.toFixed(3)})`, transformOrigin: "0% 50%", whiteSpace: "nowrap" }}>
          <svg width={20} height={20} viewBox="0 0 20 20">
            <path d="M3 3 L17 17 M17 3 L3 17" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 29, color: "#FFFFFF", letterSpacing: "-0.01em", textShadow: "0 1px 6px rgba(80,0,0,0.5)" }}>erreur</span>
        </div>
      ) : null}

      {/* code tile */}
      {tile(TX[0] - 40 * list, TY, 1 - 0.4 * list, 1 - iv(list, [0, 0.5], [0, 1]), 0, "code", (
        <div style={tileFace(CYAN, 1)}>
          <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 31, color: "#67E8F9", letterSpacing: "-0.06em", textShadow: "0 0 14px rgba(34,211,238,0.6)" }}>{"</>"}</span>
        </div>
      ))}
      {/* libs tile: v2 → red v1 ≠ */}
      {tile(libX, libY, ls, 1, 0, "libs", (
        <>
          <div style={{ ...tileFace(CYAN, 1 - bad) }}>
            <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 35, color: "#A5F3FC", textShadow: "0 0 14px rgba(34,211,238,0.6)", opacity: 1 - bad }}>v2</span>
          </div>
          {bad > 0.01 ? (
            <div style={{ ...tileFace(RED, bad) }}>
              <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 35, color: "#FECACA", textShadow: "0 0 14px rgba(248,113,113,0.7)", opacity: bad }}>v1</span>
            </div>
          ) : null}
          {bad * (1 - listIn) > 0.01 ? (
            <div style={{ position: "absolute", right: -12, top: -12, width: 34, height: 34, borderRadius: 17, background: "linear-gradient(150deg, #FF6B6B, #DC2626)", border: "2px solid #0D1D3F", display: "flex", alignItems: "center", justifyContent: "center", opacity: bad * (1 - listIn), transform: `scale(${backOut(bad).toFixed(3)})`, boxShadow: "0 0 12px rgba(248,113,113,0.8)" }}>
              <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 24, color: "#FFFFFF", lineHeight: 1, marginTop: -2 }}>≠</span>
            </div>
          ) : null}
        </>
      ))}
      {/* the empty slot left by réglages */}
      {tile(cfgX, cfgY, ls, slot, 0, "slot", (
        <div style={{ position: "absolute", inset: 0, borderRadius: 20, border: `2.5px dashed ${rgba(RED, 0.9)}`, background: rgba(RED, 0.1), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 44, color: "#FCA5A5", textShadow: "0 0 14px rgba(248,113,113,0.7)", lineHeight: 1 }}>?</span>
        </div>
      ))}
      {/* réglages tile (falls out on the crash) */}
      {tile(TX[2] + (falling ? fall * 0.8 : 0), TY + fy, 1, fo, falling ? 4.5 * fall : 0, "cfg", (
        <div style={tileFace(CYAN, 1)}>
          <svg width={46} height={46} viewBox="0 0 50 50" style={{ overflow: "visible", filter: "drop-shadow(0 0 7px rgba(34,211,238,0.6))" }}>
            <g fill="none" stroke="#67E8F9" strokeWidth={5} strokeLinejoin="round">
              <path d={GEAR} />
              <circle cx={25} cy={25} r={6.5} />
            </g>
          </svg>
        </div>
      ))}

      {/* status row: boot bar → ✓ ça marche */}
      {rowA > 0.01 ? (
        <div style={{ position: "absolute", left: 0, top: 152, width: WW, height: 52, opacity: rowA }}>
          {ok < 0.99 ? (
            <div style={{ position: "absolute", left: 40, top: 20, width: 216, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.08)", overflow: "hidden", opacity: 1 - ok }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 216 * clamp01(prog), borderRadius: 6, background: "linear-gradient(90deg, #0EA5C6, #67E8F9)", boxShadow: "0 0 10px rgba(34,211,238,0.8)" }} />
              {err > 0.01 ? <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 216 * clamp01(prog), borderRadius: 6, background: "linear-gradient(90deg, #B91C1C, #F87171)", opacity: err }} /> : null}
            </div>
          ) : null}
          {okS > 0.01 ? (
            <>
              <div style={{ position: "absolute", left: CHECK.x - 21, top: 5, width: 42, height: 42, borderRadius: 21, background: "linear-gradient(150deg, #6EE7B7, #10B981)", boxShadow: `0 0 ${(12 + 22 * decay(okAge, 10)).toFixed(1)}px rgba(52,211,153,0.85)`, transform: `scale(${okS.toFixed(3)})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={26} height={26} viewBox="0 0 26 26">
                  <path d="M5 13.5 L10.5 19 L21 7.5" fill="none" stroke="#FFFFFF" strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ position: "absolute", left: 96, top: 0, height: 52, display: "flex", alignItems: "center", whiteSpace: "nowrap", opacity: iv(okAge, [2, 8], [0, 1]), transform: `translateX(${((1 - iv(okAge, [2, 12], [0, 1], EASE_OUT)) * -14).toFixed(1)}px)` }}>
                <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 31, color: "#ECFDF5", letterSpacing: "-0.02em", textShadow: "0 0 16px rgba(52,211,153,0.6)" }}>ça marche</span>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {/* error list */}
      {listIn > 0.01
        ? [
            ["version", "≠"],
            ["réglages", "?"],
          ].map(([w, s], j) => {
            const p = iv(list, [0.35 + 0.15 * j, 0.85 + 0.15 * j], [0, 1], EASE_OUT);
            return (
              <div key={w} style={{ position: "absolute", left: 92, top: LIST_Y[j] - 26, height: 52, display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap", opacity: p, transform: `translateX(${((1 - p) * 34).toFixed(1)}px)` }}>
                <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 31, color: B.white, letterSpacing: "-0.02em" }}>{w}</span>
                <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 34, color: "#F87171", textShadow: "0 0 14px rgba(248,113,113,0.7)" }}>{s}</span>
              </div>
            );
          })
        : null}

      {sweep >= 0 && sweep <= 1 ? <div style={{ position: "absolute", top: -60, bottom: -60, width: 80, left: -120 + sweep * (WW + 200), transform: "skewX(-18deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.16), rgba(255,255,255,0))" }} /> : null}
      {flash > 0.01 ? <div style={{ position: "absolute", inset: 0, background: "rgb(236,252,255)", opacity: Math.min(0.9, flash) }} /> : null}
    </div>
  );
};

/* ───────────────────────── the scene ───────────────────────── */

export const WorksOnMyMachineFx: ToolFx = ({ g, f0, f1, beats, size }) => {
  const t = g - f0;
  const k = size / 760;
  const dur = Math.max(150, f1 - f0);

  // ── phases (see header) ──
  const bt = beats
    .map((b) => b - f0)
    .filter((b) => b > 0 && b < dur)
    .sort((a, b) => a - b);
  const n = bt.length;
  const ph = n === 3 || n === 4;
  const TOK = Math.max(16, ph ? bt[0] : dur * 0.14);
  const TCR = Math.max(TOK + 46, ph ? bt[1] : dur * 0.46);
  const TPC = Math.max(TCR + 12, n === 4 ? bt[2] : TCR + 18);
  const TDK = Math.max(TPC + 16, TCR + 36, ph ? bt[n - 1] : dur * 0.66);
  const SB = TCR - 12; // the copy lands on the server
  const SA = Math.max(TOK + 12, SB - 30); // …after lifting off the laptop

  const bp = beatPulse(g, 14);
  const appear = iv(t, [0, 14], [0, 1], EASE_OUT);
  const okAge = t - TOK;
  const ok = iv(t, [TOK, TOK + 6], [0, 1]);
  const fu = iv(t, [SA, SB], [0, 1], EASE_IN_OUT);
  const flying = t >= SA && t < SB;
  const landed = t >= SB;
  const lAge = t - SB;
  const cAge = t - TCR;
  const err = iv(t, [TCR, TCR + 3], [0, 1]);
  const dAge = t - TDK;
  const calm = t >= TDK ? 0.55 : 1;

  // glitch: a burst on the crash, then short bursts (calmer once Docker is here)
  let gl = cAge >= 0 && cAge < 24 ? Math.exp(-cAge / 8) : 0;
  if (cAge >= 28) {
    const per = t < TDK ? 46 : 86;
    const u = (cAge - 28) % per;
    if (u < 7) gl = Math.max(gl, (t < TDK ? 0.8 : 0.45) * Math.sin((u / 7) * Math.PI));
  }
  const shA = cAge >= 0 ? Math.exp(-cAge / 6) : 0;
  const shX = (cAge >= 0 ? Math.sin(cAge * 2.7) * 10 * shA : 0) + (gl > 0.3 ? (rand(Math.floor(t) * 1.3) - 0.5) * 6 * gl : 0);
  const shY = cAge >= 0 ? Math.cos(cAge * 3.4) * 5 * shA : 0;
  const lsq = lAge >= 0 ? Math.sin(clamp01(lAge / 12) * Math.PI * 2) * Math.exp(-lAge / 5) : 0;
  const sag = cAge >= 0 ? iv(cAge, [0, 10], [0, 1], EASE_OUT) + (cAge > 10 ? 0.3 * Math.sin(clamp01((cAge - 10) / 12) * Math.PI) * Math.exp(-(cAge - 10) / 8) : 0) : 0;

  // ── windows ──
  const lapSweep = t > 20 ? ((t - 20) % 160) / 30 : -1;
  const lw: WinP = {
    prog: iv(t, [3, TOK - 1], [0, 1]),
    ok,
    okAge,
    err: 0,
    errAge: -1,
    bad: 0,
    fall: -1,
    list: 0,
    sweep: lapSweep,
    flash: t >= SA ? 0.35 * decay(t - SA, 5) : 0,
    glow: 0.35 + 0.8 * decay(okAge, 12) + 0.25 * ok * (0.5 + 0.5 * Math.sin(g * 0.08)),
  };
  const cw: WinP = { prog: 0, ok: 0, okAge: -1, err: 0, errAge: -1, bad: 0, fall: -1, list: 0, sweep: -1, flash: 0.55 * decay(t - SA, 6), glow: 0.9 };
  const sw: WinP = {
    prog: iv(t, [SB + 2, TCR], [0, 0.7]),
    ok: 0,
    okAge: -1,
    err,
    errAge: cAge,
    bad: iv(t, [TCR + 1, TCR + 7], [0, 1]),
    fall: cAge >= 2 ? cAge - 2 : -1,
    list: iv(t, [TPC, TPC + 14], [0, 1], EASE_IN_OUT),
    sweep: -1,
    flash: lAge >= 0 ? 0.6 * decay(lAge, 5) : 0,
    glow: 0.5 + 0.9 * decay(cAge, 10) + (err > 0 ? 0.3 * calm * (0.5 + 0.5 * Math.sin(g * 0.15)) : 0),
  };
  const winS = <Win {...sw} />;
  const sliceEdges = [0, 17, 36, 55, 74, 100];

  // ── sparks / motes ──
  const sparks: React.ReactNode[] = [];
  const burst = (age: number, cnt: number, seed: number, ox: number, oy: number, spread: number, col: RGB, life: number, up = 1) => {
    if (age < 0 || age > life) return;
    for (let i = 0; i < cnt; i++) {
      const r1 = rand(seed + i * 7.1);
      const r2 = rand(seed + i * 3.3 + 1);
      const r3 = rand(seed + i * 5.7 + 2);
      const vx = (r1 - 0.5) * 15 + (r3 - 0.5) * 5;
      const vy = (-3 - r2 * 10) * up;
      const x = ox + (r1 - 0.5) * spread + vx * age;
      const y = oy + vy * age + 0.4 * age * age;
      const a = 1 - age / life;
      const len = 3 + r3 * 4;
      sparks.push(<line key={`${seed}-${i}`} x1={x} y1={y} x2={x - vx * len * 0.25} y2={y - (vy + 0.8 * age) * len * 0.25} stroke={rgba(i % 3 === 0 ? ICE : col, a)} strokeWidth={3 + r2 * 2.5} strokeLinecap="round" />);
    }
  };
  const CK: P2 = [LWIN.x + CHECK.x, LWIN.y + 152 + 26];
  burst(okAge, 12, 5, CK[0], CK[1], 30, GREEN, 22);
  burst(cAge, 18, 61, SWIN.x + WW / 2, SWIN.y + 10, WW * 0.8, RED, 26);
  // Docker: radial burst around the plate
  if (dAge >= 0 && dAge < 26) {
    for (let i = 0; i < 18; i++) {
      const an = (i / 18) * Math.PI * 2 + rand(i * 2.3) * 0.3;
      const v = 7 + rand(i * 4.9) * 6;
      const r0 = 90 + v * dAge;
      const a = 1 - dAge / 26;
      const col = i % 4 === 0 ? AMBER : i % 2 ? CYAN : ICE;
      sparks.push(<line key={`d${i}`} x1={HERO.x + Math.cos(an) * r0} y1={HERO.y + Math.sin(an) * r0 * 0.8} x2={HERO.x + Math.cos(an) * (r0 + 16 * a)} y2={HERO.y + Math.sin(an) * (r0 + 16 * a) * 0.8} stroke={rgba(col, a)} strokeWidth={3.5} strokeLinecap="round" />);
    }
  }

  // ── smoke from the crashed server ──
  const smoke: React.ReactNode[] = [];
  if (cAge >= 0) {
    const SP = 6;
    const LIFE = 66;
    const k0 = Math.max(0, Math.ceil((cAge - LIFE) / SP));
    const k1 = Math.floor(cAge / SP);
    for (let j = k0; j <= k1; j++) {
      const a = cAge - j * SP;
      const r1 = rand(j * 3.7 + 1);
      const r2 = rand(j * 5.1 + 2);
      const r3 = rand(j * 7.9 + 3);
      const x = SWIN.x + 50 + r1 * (WW - 90) + (r2 - 0.5) * 20 + Math.sin(a * 0.06 + j) * 10 + a * 0.3;
      const y = SWIN.y - 4 - a * (1.4 + r3 * 0.9) - 10 * Math.min(1, a / 8);
      const R = 26 + a * 0.95 + r3 * 16;
      const env = Math.min(1, Math.sin(clamp01(a / LIFE) * Math.PI) * 1.6) * (j < 5 ? 1 : 0.85) * (t >= TDK ? 0.75 : 1);
      const ember = iv(a, [0, 16], [1, 0]);
      smoke.push(
        <div
          key={j}
          style={{
            position: "absolute",
            left: x - R,
            top: y - R,
            width: R * 2,
            height: R * 2,
            borderRadius: "50%",
            background: `radial-gradient(closest-side, rgba(${Math.round(176 + 70 * ember)},${Math.round(184 - 50 * ember)},${Math.round(204 - 70 * ember)},${(0.7 * env).toFixed(3)}), rgba(130,140,162,${(0.38 * env).toFixed(3)}) 58%, rgba(130,140,162,0))`,
          }}
        />,
      );
    }
  }

  // ── Docker hero ──
  const hIn = iv(t, [TDK - 14, TDK], [0, 1], EASE_OUT);
  const ride = dAge >= 20 ? ((dAge - 20) % 84) / 84 : -1;
  const rideE = ride >= 0 ? ride * ride * (3 - 2 * ride) : -1;
  const rp = rideE >= 0 ? Math.exp(-Math.pow((rideE - 0.5) / 0.07, 2)) : 0;
  const hSq = dAge >= 0 ? Math.sin(clamp01(dAge / 14) * Math.PI * 2) * Math.exp(-dAge / 6) : 0;
  const hIdle = clamp01((dAge - 16) / 20);
  const hx = HERO.x + (1 - hIn) * 330;
  const hy = HERO.y - (1 - hIn) * 280 + Math.sin(g * 0.07) * 5 * hIdle;
  const hRot = dAge < 0 ? 38 * (1 - hIn) : -5 * Math.sin(dAge * 0.5) * Math.exp(-dAge / 7);
  const hSc = (0.55 + 0.45 * hIn) * (1 + 0.04 * rp);
  const ringA = dAge >= 0 ? iv(dAge, [0, 2, 20], [0, 0.95, 0]) : 0;
  const ringS = iv(dAge, [0, 20], [1, 1.55], EASE_OUT);
  const ga0 = dAge - 2;
  const ga = ga0 >= 0 ? (ga0 < 40 ? ga0 : (ga0 - 40) % 100) : -1;
  const glint = ga >= 0 && ga < 18 ? ga / 18 : -1;
  const bridgeP = iv(dAge, [0, 16], [0, 1], EASE_OUT);
  const hero = (dx: number, dy: number, o: number, blur: number, key: string) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: hx + dx - HERO.w / 2,
        top: hy + dy - HERO.h / 2,
        width: HERO.w,
        height: HERO.h,
        opacity: o,
        transform: `rotate(${hRot.toFixed(2)}deg) scale(${(hSc * (1 + 0.08 * hSq)).toFixed(4)}, ${(hSc * (1 - 0.08 * hSq)).toFixed(4)})`,
        filter: blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined,
      }}
    >
      {ringA > 0.01 ? <div style={{ position: "absolute", inset: -10, borderRadius: 54, border: `5px solid ${rgba(AMBER, ringA)}`, boxShadow: `0 0 30px ${rgba(AMBER, ringA * 0.7)}, inset 0 0 20px ${rgba(AMBER, ringA * 0.4)}`, transform: `scale(${ringS.toFixed(3)})` }} /> : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 46,
          overflow: "hidden",
          background: "linear-gradient(160deg, rgba(255,255,255,0.98), rgba(222,238,250,0.93))",
          border: "1px solid rgba(255,255,255,0.95)",
          boxShadow: [
            "0 18px 40px rgba(0,0,0,0.5)",
            "inset 0 -8px 18px rgba(14,165,233,0.12)",
            `0 0 ${(44 + 30 * bp + 40 * rp + 60 * decay(dAge, 10)).toFixed(0)}px rgba(34,211,238,${(0.32 + 0.18 * bp + 0.3 * rp).toFixed(3)})`,
          ].join(", "),
        }}
      >
        {glint >= 0 ? <div style={{ position: "absolute", top: -60, bottom: -60, width: 70, left: -110 + glint * (HERO.w + 180), transform: "skewX(-20deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.9), rgba(255,255,255,0))" }} /> : null}
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Logo name="docker" size={196} plate={false} />
      </div>
    </div>
  );

  // ── pills ──
  const pill = (x: number, label: string, dot: RGB, pop: number, key: string) => {
    const pa = iv(t, [6, 18], [0, 1], EASE_OUT);
    return (
      <div key={key} style={{ position: "absolute", left: x, top: PILL_Y - 25, width: 0, display: "flex", justifyContent: "center", opacity: pa, transform: `translateY(${((1 - pa) * 14).toFixed(1)}px) scale(${(1 + 0.14 * pop).toFixed(3)})` }}>
        <div style={{ ...glass("34,211,238", 0.5), borderRadius: 999, padding: "9px 24px 9px 18px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, whiteSpace: "nowrap" }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: rgba(dot, 1), boxShadow: `0 0 ${(8 + 10 * pop).toFixed(1)}px ${rgba(dot, 0.85)}` }} />
          <span style={{ fontFamily: fontInter, fontWeight: 700, fontSize: 29, color: B.white, letterSpacing: "-0.01em" }}>{label}</span>
        </div>
      </div>
    );
  };

  // ── rack ──
  const ledOf = (i: number, j: number): [RGB, number] => {
    if (cAge >= 0) return [RED, (Math.floor(cAge / 5) + i + j) % 2 === 0 ? 1 : 0.22];
    const on = Math.sin(g * 0.13 + i * 1.9 + j * 2.7) > -0.3;
    return [j === 0 ? GREEN : CYAN, on ? 1 : 0.3];
  };
  const units = Array.from({ length: 7 }, (_, i) => {
    const y = RACK.y + 30 + i * 54;
    const x = RACK.x + 14;
    const w = RACK.w - 28;
    return (
      <g key={i}>
        <rect x={x} y={y} width={w} height={46} rx={9} fill="url(#womUnit)" stroke={rgba(CYAN, 0.3)} strokeWidth={1.2} />
        <rect x={x + 1} y={y + 1} width={w - 2} height={2} rx={1} fill="rgba(255,255,255,0.12)" />
        {Array.from({ length: 6 }, (_, v) => (
          <rect key={v} x={x + 14 + v * 9} y={y + 12} width={3.4} height={22} rx={1.7} fill="rgba(148,190,255,0.24)" />
        ))}
        <rect x={x + 82} y={y + 19} width={62} height={8} rx={4} fill={rgba(CYAN, 0.22)} />
        {[0, 1].map((j) => {
          const [c, a] = ledOf(i, j);
          return (
            <g key={j}>
              <circle cx={x + 168 + j * 18} cy={y + 23} r={11} fill={rgba(c, 0.22 * a)} />
              <circle cx={x + 168 + j * 18} cy={y + 23} r={5.5} fill={rgba(c, 0.35 + 0.65 * a)} />
            </g>
          );
        })}
      </g>
    );
  });

  const sweepBridge = dAge >= 0;
  const rideAt = rideE >= 0 ? q(BR, rideE) : null;
  const rideTan = rideE >= 0 ? (() => {
    const [ax, ay] = q(BR, Math.max(0, rideE - 0.01));
    const [bx, by] = q(BR, Math.min(1, rideE + 0.01));
    return (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
  })() : 0;
  const rideO = ride >= 0 ? iv(ride, [0, 0.08, 0.9, 1], [0, 1, 1, 0]) : 0;

  const trailO = flying ? 0.85 : landed ? iv(lAge, [0, 18], [0.85, 0]) : 0;
  const redGlow = err * calm * (0.75 + 0.25 * Math.sin(g * 0.12)) + 0.5 * decay(cAge, 8);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: k !== 1 ? `scale(${k})` : undefined, transformOrigin: "0 0" }}>
      {/* back lights */}
      <div style={{ position: "absolute", left: -60, top: 300, width: 500, height: 440, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(ok > 0.5 ? GREEN : CYAN, 0.12 + 0.1 * decay(okAge, 14))}, rgba(0,0,0,0))`, opacity: appear }} />
      <div style={{ position: "absolute", left: 360, top: 180, width: 460, height: 540, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, 0.12)}, rgba(0,0,0,0))`, opacity: appear }} />
      {redGlow > 0.01 ? <div style={{ position: "absolute", left: 340, top: 160, width: 500, height: 560, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(RED, 0.22)}, rgba(0,0,0,0))`, opacity: Math.min(1, redGlow) }} /> : null}
      {hIn > 0.01 ? <div style={{ position: "absolute", left: HERO.x - 260, top: HERO.y - 170, width: 520, height: 340, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, 0.16 + 0.08 * bp + 0.2 * decay(dAge, 12))}, rgba(0,0,0,0))`, opacity: hIn }} /> : null}

      {/* floor */}
      <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: appear }}>
        <defs>
          <linearGradient id="womFloor" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(34,211,238,0)" />
            <stop offset="0.5" stopColor="rgba(34,211,238,0.45)" />
            <stop offset="1" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
          <radialGradient id="womShadow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="rgba(0,0,0,0.55)" />
            <stop offset="1" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        <ellipse cx={LAP.x + LAP.w / 2} cy={FLOOR + 6} rx={210} ry={22} fill="url(#womShadow)" />
        <ellipse cx={RACK.x + RACK.w / 2} cy={FLOOR + 6} rx={160} ry={20} fill="url(#womShadow)" />
        <rect x={0} y={FLOOR + 2} width={760} height={2.5} fill="url(#womFloor)" />
      </svg>

      {/* the copy's flight trail */}
      {trailO > 0.01 ? (
        <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: trailO }}>
          <path d={arcD(FL, 0, landed ? 1 : fu)} fill="none" stroke={rgba(CYAN, 0.75)} strokeWidth={4} strokeDasharray="4 14" strokeDashoffset={-t * 2} strokeLinecap="round" />
        </svg>
      ) : null}

      {/* Docker's bridge + the container riding it (behind the plate) */}
      {sweepBridge ? (
        <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <filter id="womGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>
          <path d={arcD(BR, 0.5 - 0.5 * bridgeP, 0.5 + 0.5 * bridgeP, 48)} fill="none" stroke={rgba(CYAN, 0.6)} strokeWidth={14} strokeLinecap="round" filter="url(#womGlow)" />
          <path d={arcD(BR, 0.5 - 0.5 * bridgeP, 0.5 + 0.5 * bridgeP, 48)} fill="none" stroke="#A5F3FC" strokeWidth={4} strokeLinecap="round" />
          {bridgeP > 0.98 ? <path d={arcD(BR, 0, 1, 48)} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" strokeDasharray="2 26" strokeDashoffset={-t * 1.6} opacity={0.75} /> : null}
        </svg>
      ) : null}
      {rideAt && rideO > 0.01 ? (
        <div style={{ position: "absolute", left: rideAt[0] - 38, top: rideAt[1] - 30, width: 76, height: 50, opacity: rideO, transform: `rotate(${(rideTan * 0.35).toFixed(2)}deg) scale(1.15)`, filter: "drop-shadow(0 0 10px rgba(34,211,238,0.8))" }}>
          <ContainerBox uid="womRide" w={62} h={40} ribs={7} sw={2} led={0.6 + 0.4 * Math.sin(g * 0.3)} />
        </div>
      ) : null}

      {/* ── laptop « ton PC » ── */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, opacity: appear, transform: `translateY(${((1 - appear) * 18).toFixed(1)}px)` }}>
        <div
          style={{
            position: "absolute",
            left: LAP.x,
            top: LAP.y,
            width: LAP.w,
            height: LAP.h,
            borderRadius: 24,
            background: "linear-gradient(160deg, #1C3462 0%, #11224B 50%, #0B1736 100%)",
            border: "1.5px solid rgba(148,190,255,0.34)",
            boxShadow: `0 20px 44px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.24), 0 0 ${(40 + 30 * decay(okAge, 12)).toFixed(0)}px ${rgba(ok > 0.5 ? GREEN : CYAN, 0.14 + 0.2 * decay(okAge, 12))}`,
          }}
        >
          <div style={{ position: "absolute", left: LAP.w / 2 - 4, top: 3, width: 8, height: 8, borderRadius: 4, background: "rgba(148,190,255,0.35)" }} />
          <div style={{ position: "absolute", left: 12, top: 12, width: LAP.w - 24, height: LAP.h - 24, borderRadius: 14, overflow: "hidden", background: "linear-gradient(180deg, #0A1834 0%, #060F24 100%)", boxShadow: "inset 0 0 30px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(34,211,238,0.16)" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(148,190,255,0.10) 1.4px, rgba(0,0,0,0) 1.6px)", backgroundSize: "24px 24px" }} />
          </div>
        </div>
        <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <linearGradient id="womDeck" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2A4677" />
              <stop offset="1" stopColor="#13244A" />
            </linearGradient>
          </defs>
          <path d={`M${LAP.x - 6} ${LAP.y + LAP.h} H${LAP.x + LAP.w + 6} L${LAP.x + LAP.w + 20} ${FLOOR - 4} Q${LAP.x + LAP.w + 20} ${FLOOR} ${LAP.x + LAP.w + 16} ${FLOOR} H${LAP.x - 16} Q${LAP.x - 20} ${FLOOR} ${LAP.x - 20} ${FLOOR - 4} Z`} fill="url(#womDeck)" stroke="rgba(148,190,255,0.4)" strokeWidth={1.5} strokeLinejoin="round" />
          <path d={`M${LAP.x - 6} ${LAP.y + LAP.h + 1} H${LAP.x + LAP.w + 6}`} stroke="rgba(165,243,252,0.6)" strokeWidth={2} />
          <rect x={LAP.x + LAP.w / 2 - 34} y={LAP.y + LAP.h} width={68} height={6} rx={3} fill="rgba(4,9,22,0.6)" />
        </svg>
        <div style={{ position: "absolute", left: LWIN.x, top: LWIN.y }}>
          <Win {...lw} />
        </div>
      </div>
      {/* ✓ ring */}
      {okAge >= 0 && okAge < 20 ? <div style={{ position: "absolute", left: CK[0] - 21 - okAge * 3, top: CK[1] - 21 - okAge * 3, width: 42 + okAge * 6, height: 42 + okAge * 6, borderRadius: "50%", border: `3px solid ${rgba(GREEN, 0.9 * (1 - okAge / 20))}` }} /> : null}

      {/* ── server rack « serveur » ── */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, opacity: appear, transform: `translate(${shX.toFixed(2)}px, ${(shY + (1 - appear) * 18).toFixed(2)}px)` }}>
        <div style={{ position: "absolute", left: RACK.x, top: RACK.y, width: RACK.w, height: RACK.h, ...glass("34,211,238", 0.7), borderRadius: 22 }} />
        <div style={{ position: "absolute", left: RACK.x + 7, top: RACK.y + 7, width: RACK.w - 14, height: RACK.h - 14, borderRadius: 16, background: "linear-gradient(180deg, rgba(6,12,28,0.82), rgba(4,9,22,0.92))", border: "1px solid rgba(148,190,255,0.12)" }} />
        <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <linearGradient id="womUnit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#152C55" />
              <stop offset="1" stopColor="#0B1A37" />
            </linearGradient>
          </defs>
          <rect x={RACK.x + 24} y={RACK.y + 13} width={RACK.w - 48} height={7} rx={3.5} fill={cAge >= 0 ? rgba(RED, 0.5 + 0.5 * ((Math.floor(cAge / 5) % 2) ? 0.3 : 1)) : rgba(CYAN, 0.55 + 0.25 * Math.sin(g * 0.1))} style={{ filter: `drop-shadow(0 0 6px ${cAge >= 0 ? "rgba(248,113,113,0.9)" : "rgba(34,211,238,0.8)"})` }} />
          {units}
          <rect x={RACK.x + 22} y={RACK.y + RACK.h} width={26} height={8} rx={3} fill="rgba(148,190,255,0.3)" />
          <rect x={RACK.x + RACK.w - 48} y={RACK.y + RACK.h} width={26} height={8} rx={3} fill="rgba(148,190,255,0.3)" />
        </svg>
        {smoke}
        {/* the app on the server */}
        {landed ? (
          <div
            style={{
              position: "absolute",
              left: SWIN.x,
              top: SWIN.y,
              width: WW,
              height: WH,
              transform: `translateY(${(7 * sag).toFixed(2)}px) rotate(${(2.6 * sag).toFixed(3)}deg) scale(${(1 + 0.05 * lsq).toFixed(4)}, ${(1 - 0.06 * lsq).toFixed(4)})`,
              transformOrigin: "6% 0%",
            }}
          >
            {gl > 0.04 ? (
              <>
                <div style={{ position: "absolute", inset: 0, borderRadius: 20, border: "3px solid rgba(255,45,85,0.75)", transform: `translateX(${(9 * gl).toFixed(1)}px)`, opacity: gl }} />
                <div style={{ position: "absolute", inset: 0, borderRadius: 20, border: "3px solid rgba(34,211,238,0.75)", transform: `translateX(${(-9 * gl).toFixed(1)}px)`, opacity: gl }} />
                {sliceEdges.slice(0, -1).map((top, j) => {
                  const r = rand(Math.floor(t) * 7.3 + j * 3.1);
                  const off = r > 0.35 ? (rand(Math.floor(t) * 3.7 + j * 5.3) - 0.5) * 46 * gl : 0;
                  return (
                    <div key={j} style={{ position: "absolute", left: 0, top: 0, width: WW, height: WH, clipPath: `inset(${top}% 0 ${100 - sliceEdges[j + 1]}% 0)`, transform: `translateX(${off.toFixed(1)}px)` }}>
                      {winS}
                    </div>
                  );
                })}
                {[0, 1, 2].map((j) => {
                  const y = rand(Math.floor(t) * 5.1 + j * 9.7) * WH;
                  return <div key={`n${j}`} style={{ position: "absolute", left: -10, width: WW + 20, top: y, height: 3 + j * 2, background: j % 2 ? "rgba(255,90,110,0.7)" : "rgba(220,250,255,0.6)", opacity: gl }} />;
                })}
              </>
            ) : (
              winS
            )}
            {cAge >= 0 && cAge < 14 ? <div style={{ position: "absolute", inset: 0, borderRadius: 20, background: rgba(RED, 0.55), opacity: decay(cAge, 4), mixBlendMode: "screen" }} /> : null}
          </div>
        ) : null}
        {/* landing ring */}
        {lAge >= 0 && lAge < 16 ? <div style={{ position: "absolute", left: SWIN.x - lAge * 2, top: SWIN.y - lAge * 2, width: WW + lAge * 4, height: WH + lAge * 4, borderRadius: 20 + lAge * 2, border: `3px solid ${rgba(ICE, 0.9 * (1 - lAge / 16))}` }} /> : null}
      </div>

      {/* the flying copy */}
      {flying
        ? [0.14, 0.07, 0].map((d, j) => {
            const u = Math.max(0, fu - d);
            const [x, y] = q(FL, u);
            const s = 1 - 0.38 * Math.sin(u * Math.PI);
            const r = 9 * Math.sin(u * Math.PI * 2);
            const ghost = d > 0;
            if (ghost && fu - d <= 0) return null;
            return (
              <div key={j} style={{ position: "absolute", left: x - WW / 2, top: y - WH / 2, width: WW, height: WH, opacity: ghost ? [0.14, 0.26][j] : 1, transform: `rotate(${r.toFixed(2)}deg) scale(${s.toFixed(4)})`, filter: ghost ? `blur(${(8 - 3 * j).toFixed(0)}px)` : undefined }}>
                <Win {...cw} />
              </div>
            );
          })
        : null}

      {/* Docker hero (trail while flying in) */}
      {hIn > 0.01 && hIn < 0.97 ? [2, 1].map((j) => hero(j * 46 * (1 - hIn), -j * 40 * (1 - hIn), 0.16 / j, 8 + 6 * j, `hg${j}`)) : null}
      {hIn > 0.01 ? hero(0, 0, iv(hIn, [0, 0.25], [0, 1]), (1 - hIn) * 10, "h") : null}

      <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
        {sparks}
      </svg>

      {/* labels */}
      {pill(LAP.x + LAP.w / 2, "ton PC", ok > 0.5 ? GREEN : CYAN, decay(okAge, 7), "pc")}
      {pill(RACK.x + RACK.w / 2, "serveur", cAge >= 0 ? RED : CYAN, Math.max(decay(cAge, 7), decay(t - TPC, 7)), "srv")}

      {/* stage-level light: box = full 1080 frame width (stage sits at x 160) so streaks fade instead of being cut */}
      <div style={{ position: "absolute", left: -160, top: 0, width: 1080, height: 760, pointerEvents: "none" }}>
        <AnamorphicFlare age={cAge} x={160 + SWIN.x + WW / 2} y={SWIN.y + 20} col={RED} dur={26} size={120} streakH={70} strength={0.6} />
        <Shockwave age={dAge} x={160 + HERO.x} y={HERO.y} dur={26} maxR={520} r0={110} strength={0.85} />
        <AnamorphicFlare age={dAge} x={160 + HERO.x} y={HERO.y} dur={32} size={170} streakH={110} strength={0.85} />
      </div>
    </div>
  );
};
