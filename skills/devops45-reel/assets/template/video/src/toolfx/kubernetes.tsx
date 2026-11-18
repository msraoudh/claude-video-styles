import React from "react";
import { Logo } from "../kit/Logo";
import { fontMono } from "../kit/fonts";
import { glass } from "../lib/look";
import { beatPulse, rand } from "../lib/sync";
import { AMBER, clamp01, CYAN, decay, EASE_IN_OUT, EASE_OUT, ICE, iv, rgba, type RGB } from "../archetypes/title/brand/fx";
import { boxSize, ContainerBox } from "./docker";
import type { ToolFx } from "./types";

/*
 * Kubernetes runs the boxes.  t = g - f0
 * 0–12    the real Kubernetes helm spins up like a captain's wheel (fast, easing out), 3 glass « node » cards with rails below
 * 6–48    9 little containers shoot out of the wheel in a cascade, arc down and land on the rails (squash + rail glow)
 * 56–66   the middle container of node 2 turns red and shakes; 66 it cracks (shards) and 70 falls off its rail
 * 70–88   the wheel kicks (extra spin, amber ring) and sends a fresh container (amber trail) that lands in the gap
 * 90      a green check pops above it
 * idle    the wheel keeps turning, all containers + server LEDs pulse in sync (heartbeat), lights run along the rails
 */

const MW = 100;
const MH = 58;
const MS = boxSize(MW, MH); // W 122, H 74
const WC = { x: 380, y: 136 };
const WS = 196;
const NODE_T = [288, 430, 572];
const NODE_H = 124;
const NX = 40;
const NW = 680;
const RAIL_DY = 106;
const railY = (n: number) => NODE_T[n] + RAIL_DY;
const SLOT_X = [334, 474, 614];
const launch = (k: number) => 6 + 3 * k;
const FL = 18;
const BAD = 4; // node 2, middle slot
const RED_T = 56;
const CRACK = 66;
const FALL = 70;
const SEND = 72;
const FL2 = 16;
const LAND2 = SEND + FL2;
const CHECK = LAND2 + 2;
const RED: RGB = [248, 113, 113];
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t].map(Math.round) as RGB;

const target = (k: number) => ({ x: SLOT_X[k % 3], y: railY(Math.floor(k / 3)) - MS.H / 2 });
const bez = (u: number, a: { x: number; y: number }, c: { x: number; y: number }, b: { x: number; y: number }) => ({
  x: (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * c.x + u * u * b.x,
  y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * c.y + u * u * b.y,
});
const flightPos = (k: number, u: number) => {
  const b = target(k);
  return bez(u, WC, { x: b.x * 0.75 + WC.x * 0.25, y: WC.y + 20 }, b);
};
const squash = (age: number) => (age >= 0 ? Math.sin(clamp01(age / 16) * Math.PI * 2) * Math.exp(-age / 6) : 0);

const CRACK_D = `M${MW * 0.34} ${MS.d} L${MW * 0.48} ${MS.d + MH * 0.34} L${MW * 0.4} ${MS.d + MH * 0.56} L${MW * 0.62} ${MS.d + MH * 0.78} L${MW * 0.56} ${MS.d + MH}`;

export const KubernetesFx: ToolFx = ({ g, f0, size, logo }) => {
  const t = g - f0;
  const k = size / 760;
  const bp = beatPulse(g, 14);

  // ── wheel ──
  const spin = 420 * EASE_OUT(clamp01(t / 56)) + 0.5 * t + 100 * iv(t, [SEND - 4, SEND + 16], [0, 1], EASE_OUT);
  const launchKick = Array.from({ length: 9 }, (_, i) => decay(t - launch(i), 4)).reduce((m, v) => Math.max(m, v), 0);
  const sendKick = decay(t - SEND, 9);
  const wheelSc = iv(t, [0, 14], [0.82, 1], EASE_OUT) + 0.05 * launchKick + 0.1 * sendKick;
  const amberRingA = t >= SEND - 2 ? iv(t - (SEND - 2), [0, 2, 22], [0, 1, 0]) : 0;
  const amberRingS = iv(t - (SEND - 2), [0, 22], [0.7, 1.8], EASE_OUT);

  // ── heartbeat (all in sync once everything runs) ──
  const live = clamp01((t - 48) / 12);
  const hb = live * Math.pow(0.5 + 0.5 * Math.sin(((t - 48) * 2 * Math.PI) / 40 - Math.PI / 2), 4);

  // ── node cards ──
  const nodes = NODE_T.map((top, n) => {
    const e = iv(t, [n * 3, n * 3 + 16], [0, 1], EASE_OUT);
    const runX = 150 + (((t - 50) * 6 + n * 170) % 500);
    return (
      <div key={n} style={{ position: "absolute", left: NX, top, width: NW, height: NODE_H, opacity: e, transform: `translateY(${((1 - e) * 24).toFixed(1)}px)` }}>
        <div style={{ ...glass("34,211,238", 0.55), position: "absolute", inset: 0, borderRadius: 28 }} />
        <div style={{ position: "absolute", left: 26, top: 16, fontFamily: fontMono, fontWeight: 700, fontSize: 21, color: "rgba(103,232,249,0.85)", letterSpacing: "0.02em" }}>{`node ${n + 1}`}</div>
        {[0, 1, 2].map((r) => (
          <div key={r} style={{ position: "absolute", left: 26, top: 52 + r * 20, width: 98, height: 13, borderRadius: 7, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(34,211,238,0.28)" }}>
            <div style={{ position: "absolute", right: 4, top: 2.5, width: 6, height: 6, borderRadius: "50%", background: "#34D399", opacity: 0.35 + 0.65 * (r === 1 ? hb : live * (0.5 + 0.5 * Math.sin(g * 0.3 + r * 2 + n))), boxShadow: "0 0 6px rgba(52,211,153,0.9)" }} />
          </div>
        ))}
        <svg width={NW} height={NODE_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <line x1={150} y1={RAIL_DY + 1} x2={NW - 22} y2={RAIL_DY + 1} stroke={rgba(CYAN, 0.25)} strokeWidth={10} strokeLinecap="round" />
          <line x1={150} y1={RAIL_DY + 1} x2={NW - 22} y2={RAIL_DY + 1} stroke={rgba(CYAN, 0.85)} strokeWidth={3} strokeLinecap="round" />
          {live > 0 ? <circle cx={runX} cy={RAIL_DY + 1} r={5} fill="#EFFCFF" opacity={0.85 * live} style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,0.95))" }} /> : null}
        </svg>
      </div>
    );
  });

  // ── containers ──
  const landed: React.ReactNode[] = [];
  const flying: React.ReactNode[] = [];
  const fx: React.ReactNode[] = [];
  const boxAt = (key: string, cx: number, bottom: number, sc: number, sx: number, sy: number, rot: number, o: number, node: React.ReactNode) => (
    <div key={key} style={{ position: "absolute", left: cx - MS.W / 2, top: bottom - MS.H, width: MS.W, height: MS.H, opacity: o, transform: `rotate(${rot.toFixed(2)}deg) scale(${(sc * sx).toFixed(4)}, ${(sc * sy).toFixed(4)})`, transformOrigin: "50% 100%" }}>
      {node}
    </div>
  );
  const ghost = (key: string, p: { x: number; y: number }, sc: number, a: number, col: RGB) => (
    <div key={key} style={{ position: "absolute", left: p.x - (MW * sc) / 2, top: p.y - (MH * sc) / 2, width: MW * sc, height: MH * sc, borderRadius: 8, border: `2px solid ${rgba(col, a)}`, background: rgba(col, a * 0.25) }} />
  );
  const railGlow = (key: string, x: number, y: number, a: number, col: RGB) =>
    a > 0.01 ? <div key={key} style={{ position: "absolute", left: x - 90, top: y - 14, width: 180, height: 28, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(col, 0.75 * a)}, ${rgba(col, 0)})` }} /> : null;

  for (let i = 0; i < 9; i++) {
    const s = launch(i);
    const u = iv(t, [s, s + FL], [0, 1], EASE_IN_OUT);
    if (t < s) continue;
    const b = target(i);
    const by = b.y + MS.H / 2;
    const bob = Math.sin(g * 0.09 + i * 0.8) * 1.5 * live;
    if (u < 1) {
      const p = flightPos(i, u);
      const sc = iv(u, [0, 0.55], [0.3, 1], EASE_OUT);
      [0.12, 0.24].forEach((du, j) => {
        if (u - du > 0.02) flying.push(ghost(`g${i}-${j}`, flightPos(i, u - du), iv(u - du, [0, 0.55], [0.3, 1]), 0.2 - j * 0.09, CYAN));
      });
      flying.push(boxAt(`f${i}`, p.x, p.y + MS.H / 2, sc, 1, 1, (1 - u) * -10, iv(u, [0, 0.12], [0, 1]), <ContainerBox uid={`k8f${i}`} w={MW} h={MH} ribs={7} sw={2} />));
      continue;
    }
    const age = t - (s + FL);
    fx.push(railGlow(`rg${i}`, b.x - MS.dx / 2, by, decay(age, 8), CYAN));
    if (i === BAD && t >= RED_T) {
      // the crash
      const r = iv(t, [RED_T, RED_T + 6], [0, 1]);
      const shake = t < FALL ? Math.sin(t * 2.7) * 4 * r : 0;
      const fa = Math.max(0, t - FALL);
      const fy = 0.55 * fa * fa;
      const o = iv(t, [FALL, FALL + 18], [1, 0]);
      const crack = iv(t, [CRACK, CRACK + 4], [0, 1]);
      if (o > 0.01) {
        fx.push(
          <div key="redglow" style={{ position: "absolute", left: b.x - 110, top: by - 100, width: 220, height: 130, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(RED, 0.45 * r * o)}, rgba(248,113,113,0))` }} />,
        );
        landed.push(
          boxAt(
            `l${i}`,
            b.x + shake,
            by + fy,
            1,
            1,
            1,
            fa * 2.4,
            o,
            <div style={{ position: "relative", width: MS.W, height: MS.H }}>
              <ContainerBox uid={`k8l${i}`} w={MW} h={MH} ribs={7} sw={2} tint={mixRGB(CYAN, RED, r)} flash={0.5 * decay(t - CRACK, 4)} />
              {crack > 0 ? (
                <svg width={MS.W} height={MS.H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                  <path d={CRACK_D} fill="none" stroke="#FFF1F1" strokeWidth={3} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - crack} />
                </svg>
              ) : null}
            </div>,
          ),
        );
      }
      // shards
      const sa = t - CRACK;
      if (sa >= 0 && sa < 26) {
        const pts: React.ReactNode[] = [];
        for (let j = 0; j < 8; j++) {
          const r1 = rand(91 + j * 3.1);
          const r2 = rand(17 + j * 7.7);
          const vx = (r1 - 0.5) * 12;
          const vy = -3 - r2 * 7;
          const x = b.x - MS.dx / 2 + vx * sa;
          const y = by - MH / 2 + vy * sa + 0.45 * sa * sa;
          const s2 = 5 + r2 * 6;
          pts.push(<path key={j} d={`M${x} ${y - s2} L${x + s2} ${y + s2 * 0.7} L${x - s2 * 0.8} ${y + s2 * 0.5} Z`} fill={rgba(j % 2 ? RED : [255, 220, 220], 1 - sa / 26)} transform={`rotate(${(sa * 14 * (r1 - 0.5)).toFixed(1)} ${x} ${y})`} />);
        }
        fx.push(
          <svg key="shards" width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {pts}
          </svg>,
        );
      }
      continue;
    }
    const sq = squash(age);
    landed.push(boxAt(`l${i}`, b.x, by + bob, 1, 1 + 0.14 * sq, 1 - 0.2 * sq, 0, 1, <ContainerBox uid={`k8l${i}`} w={MW} h={MH} ribs={7} sw={2} flash={0.14 * hb + 0.4 * decay(age, 4)} led={live > 0 ? 0.25 + 0.75 * hb : -1} />));
  }

  // ── the replacement ──
  if (t >= SEND) {
    const b = target(BAD);
    const by = b.y + MS.H / 2;
    const u = iv(t, [SEND, LAND2], [0, 1], EASE_IN_OUT);
    if (u < 1) {
      const pos = (uu: number) => bez(uu, WC, { x: b.x * 0.75 + WC.x * 0.25, y: WC.y + 20 }, b);
      const p = pos(u);
      [0.1, 0.2, 0.3].forEach((du, j) => {
        if (u - du > 0.02) flying.push(ghost(`rg-${j}`, pos(u - du), iv(u - du, [0, 0.55], [0.3, 1]), 0.28 - j * 0.08, AMBER));
      });
      flying.push(
        <div key="rhalo" style={{ position: "absolute", left: p.x - 90, top: p.y - 70, width: 180, height: 140, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(AMBER, 0.45)}, rgba(245,158,11,0))` }} />,
      );
      flying.push(boxAt("rf", p.x, p.y + MS.H / 2, iv(u, [0, 0.55], [0.3, 1], EASE_OUT), 1, 1, (1 - u) * -12, iv(u, [0, 0.12], [0, 1]), <ContainerBox uid="k8rf" w={MW} h={MH} ribs={7} sw={2} flash={0.25} />));
    } else {
      const age = t - LAND2;
      const sq = squash(age);
      fx.push(railGlow("rgR", b.x - MS.dx / 2, by, decay(age, 10), AMBER));
      landed.push(boxAt("lR", b.x, by + Math.sin(g * 0.09 + BAD * 0.8) * 1.5 * live, 1, 1 + 0.14 * sq, 1 - 0.2 * sq, 0, 1, <ContainerBox uid="k8lR" w={MW} h={MH} ribs={7} sw={2} flash={0.14 * hb + 0.6 * decay(age, 5)} led={0.25 + 0.75 * hb} />));
      // green check
      const cp = iv(t, [CHECK, CHECK + 10], [0, 1], EASE_OUT);
      const over = t >= CHECK ? 1 + 0.25 * Math.sin(clamp01((t - CHECK) / 12) * Math.PI) : 0;
      const shrink = iv(t, [CHECK + 50, CHECK + 64], [1, 0.72], EASE_IN_OUT);
      const draw = iv(t, [CHECK + 3, CHECK + 12], [0, 1], EASE_OUT);
      if (cp > 0) {
        fx.push(
          <div key="check" style={{ position: "absolute", left: b.x + 36 - 30, top: by - MS.H - 40, width: 60, height: 60, borderRadius: "50%", opacity: cp, transform: `scale(${(cp * over * shrink).toFixed(3)})`, background: "radial-gradient(circle at 40% 35%, rgba(52,211,153,0.45), rgba(16,80,60,0.85))", border: "3px solid #34D399", boxShadow: `0 0 ${(18 + 14 * hb).toFixed(1)}px rgba(52,211,153,0.7)` }}>
            <svg width={60} height={60} viewBox="0 0 60 60" style={{ position: "absolute", left: -3, top: -3 }}>
              <path d="M17 31 L26 40 L43 21" fill="none" stroke="#ECFDF5" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
            </svg>
          </div>,
        );
      }
    }
  }

  // ── wheel ──
  const haloCol = mixRGB(CYAN, AMBER, Math.min(1, sendKick * 1.2));
  const wheel = (
    <div key="wheel" style={{ position: "absolute", left: WC.x, top: WC.y, width: 0, height: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(haloCol, 0.3 + 0.18 * launchKick + 0.12 * bp + 0.25 * sendKick)}, ${rgba(haloCol, 0)})` }} />
      <div style={{ position: "absolute", width: WS + 44, height: WS + 44, borderRadius: "50%", border: `2px dashed ${rgba(CYAN, 0.35)}`, transform: `rotate(${(-spin * 0.4).toFixed(2)}deg)` }} />
      {amberRingA > 0.01 ? <div style={{ position: "absolute", width: WS + 20, height: WS + 20, borderRadius: "50%", border: `5px solid ${rgba(AMBER, amberRingA)}`, boxShadow: `0 0 28px ${rgba(AMBER, amberRingA * 0.7)}`, transform: `scale(${amberRingS.toFixed(3)})` }} /> : null}
      <div style={{ flexShrink: 0, transform: `rotate(${spin.toFixed(2)}deg) scale(${wheelSc.toFixed(4)})`, filter: "drop-shadow(0 10px 26px rgba(50,109,230,0.55)) drop-shadow(0 0 14px rgba(34,211,238,0.35))" }}>
        <Logo name={logo} size={WS} plate={false} />
      </div>
    </div>
  );

  // a little light sparkle where each container leaves the wheel
  const motes: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const a = t - launch(i);
    if (a < 0 || a > 10) continue;
    const ang = rand(i * 5.3) * Math.PI * 2;
    const r = 30 + a * 7;
    motes.push(<circle key={i} cx={WC.x + Math.cos(ang) * r} cy={WC.y + Math.sin(ang) * r} r={4} fill={rgba(ICE, 1 - a / 10)} />);
  }

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: k !== 1 ? `scale(${k})` : undefined, transformOrigin: "0 0" }}>
      {nodes}
      {fx}
      {landed}
      {wheel}
      <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {motes}
      </svg>
      {flying}
    </div>
  );
};
