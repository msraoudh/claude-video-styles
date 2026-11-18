import React from "react";
import { fontInter, fontMono } from "../kit/fonts";
import { glass } from "../lib/look";
import { beatPulse, rand } from "../lib/sync";
import { AMBER, AMBER_HOT, AnamorphicFlare, Bloom, clamp01, CYAN, decay, EASE_IN_OUT, EASE_OUT, ICE, iv, rgba, Shockwave } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/*
 * « Quatre, le partage. Ce qu'une équipe apprend, elle le transmet. »
 * 0    four teams (clusters of 3 glass avatars, a glass bulb above each) on a diamond, dim links between them.
 * 20   team A gets the idea: its bulb flickers and LIGHTS (amber flash, rays, flare).
 * 24   the idea becomes a glass doc card (« doc », « leçon ») rising out of the bulb; at 38 it copies itself.
 * 42   the two copies fly down the glowing links to B and D → their bulbs light (60, 64, chain reaction)…
 * 63   …B and D pass it on to C → C lights at 81, the whole network glows (shockwave, every link lit).
 * then idle: light pulses travel every link, bulbs breathe on the music, avatars bob.
 */

type P = [number, number];
type Key = "A" | "B" | "C" | "D";
const bez = (a: P, c: P, b: P, u: number): P => {
  const v = 1 - u;
  return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]];
};
/** tangent angle (deg) of the quadratic at u */
const bezAng = (a: P, c: P, b: P, u: number) => {
  const dx = 2 * (1 - u) * (c[0] - a[0]) + 2 * u * (b[0] - c[0]);
  const dy = 2 * (1 - u) * (c[1] - a[1]) + 2 * u * (b[1] - c[1]);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
};
const qd = (a: P, c: P, b: P) => `M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`;

const BULB_DY = 122;
const TEAM: Record<Key, P> = { A: [380, 318], B: [126, 522], D: [634, 522], C: [380, 740] };
const BULB: Record<Key, P> = {
  A: [TEAM.A[0], TEAM.A[1] - BULB_DY],
  B: [TEAM.B[0], TEAM.B[1] - BULB_DY],
  D: [TEAM.D[0], TEAM.D[1] - BULB_DY],
  C: [TEAM.C[0], TEAM.C[1] - BULB_DY],
};
const CARD: P = [380, 66];
const LIT: Record<Key, number> = { A: 20, B: 60, D: 64, C: 81 };

type Link = { a: P; c: P; b: P; t0: number; t1: number; flight: boolean };
const LINKS: Link[] = [
  { a: CARD, c: [128, 92], b: BULB.B, t0: 42, t1: 60, flight: true },
  { a: CARD, c: [632, 92], b: BULB.D, t0: 45, t1: 64, flight: true },
  { a: BULB.B, c: [236, 624], b: BULB.C, t0: 63, t1: 81, flight: true },
  { a: BULB.D, c: [524, 624], b: BULB.C, t0: 66, t1: 81, flight: true },
  { a: BULB.B, c: [380, 468], b: BULB.D, t0: 66, t1: 86, flight: false },
];
const NET = LIT.C;

/** the glass doc card — the lesson a team learnt */
const DocCard: React.FC<{ glint?: number; amber?: number }> = ({ glint = -1, amber = 0 }) => (
  <div style={{ ...glass("34,211,238", 0.7), background: "linear-gradient(140deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03)), rgba(9,20,42,0.9)", borderRadius: 20, width: 124, height: 140, padding: "14px 15px", boxSizing: "border-box", position: "relative", overflow: "hidden" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={20} height={24} viewBox="0 0 20 24" style={{ display: "block" }}>
        <path d="M2 1.5 H13 L18.5 7 V22.5 H2 Z" fill="rgba(34,211,238,0.18)" stroke="#22D3EE" strokeWidth={2} strokeLinejoin="round" />
        <path d="M13 1.5 V7 H18.5" fill="none" stroke="#22D3EE" strokeWidth={2} strokeLinejoin="round" />
      </svg>
      <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 17, color: "#67E8F9" }}>doc</span>
    </div>
    <div style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 29, color: "#F8FAFC", letterSpacing: "-0.03em", marginTop: 6, lineHeight: 1.05 }}>leçon</div>
    <div style={{ width: 44, height: 4, borderRadius: 2, marginTop: 5, background: rgba(AMBER, 0.75 + 0.25 * amber), boxShadow: `0 0 ${(6 + 12 * amber).toFixed(0)}px ${rgba(AMBER, 0.6)}` }} />
    {[0.86, 0.66, 0.76].map((w, i) => (
      <div key={i} style={{ width: `${w * 100}%`, height: 6, borderRadius: 3, marginTop: i ? 7 : 11, background: "rgba(226,236,250,0.3)" }} />
    ))}
    {glint >= 0 && glint <= 1 ? (
      <div style={{ position: "absolute", top: "-30%", bottom: "-30%", width: "40%", left: `${(-50 + 160 * glint).toFixed(1)}%`, transform: "rotate(20deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.55), rgba(255,255,255,0))" }} />
    ) : null}
  </div>
);

/** one glass avatar (head + shoulders), base centre at (x,y) */
const Avatar: React.FC<{ x: number; y: number; s: number; lit: number; dim?: number; uid: string }> = ({ x, y, s, lit, dim = 1, uid }) => {
  const stroke = `rgba(${Math.round(34 + (220 - 34) * lit)},${Math.round(211 + (245 - 211) * lit)},${Math.round(238 + (255 - 238) * lit)},${(0.7 + 0.3 * lit) * dim})`;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-34 0 C-34 -30 -22 -42 0 -42 C22 -42 34 -30 34 0 Z" fill={`url(#${uid}b)`} stroke={stroke} strokeWidth={2.6} strokeLinejoin="round" opacity={dim} />
      <circle cx={0} cy={-62} r={17} fill={`url(#${uid}h)`} stroke={stroke} strokeWidth={2.6} opacity={dim} />
      <path d="M-9 -70 A11 11 0 0 1 4 -74" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2.2} strokeLinecap="round" opacity={dim} />
    </g>
  );
};

/** a glass bulb centred at (0,0); on = 0..1 */
const Bulb: React.FC<{ x: number; y: number; on: number; flicker: number; flash: number; pulse: number; sc: number }> = ({ x, y, on, flicker, flash, pulse, sc }) => {
  const e = Math.max(on, flicker);
  const rays = on > 0.01 ? on * (0.75 + 0.25 * pulse) : 0;
  const rayLen = 13 + 14 * flash + 5 * pulse;
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`}>
      {e > 0.01 ? <circle cx={0} cy={-6} r={70 + 26 * flash} fill="url(#shrHalo)" opacity={e * (0.7 + 0.3 * pulse)} /> : null}
      {rays > 0.01
        ? Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
            if (Math.sin(a) > 0.55) return null; // no rays below the base
            const r0 = 40;
            return (
              <line key={i} x1={Math.cos(a) * r0} y1={-6 + Math.sin(a) * r0} x2={Math.cos(a) * (r0 + rayLen)} y2={-6 + Math.sin(a) * (r0 + rayLen)} stroke={rgba(AMBER_HOT, rays)} strokeWidth={4.5} strokeLinecap="round" />
            );
          })
        : null}
      {/* glass globe */}
      <path d="M-14 16 C-14 8 -28 2 -28 -12 C-28 -28 -15 -38 0 -38 C15 -38 28 -28 28 -12 C28 2 14 8 14 16 Z" fill="rgba(8,18,38,0.85)" />
      {e > 0.01 ? <path d="M-14 16 C-14 8 -28 2 -28 -12 C-28 -28 -15 -38 0 -38 C15 -38 28 -28 28 -12 C28 2 14 8 14 16 Z" fill="url(#shrGlow)" opacity={e} /> : null}
      <path
        d="M-14 16 C-14 8 -28 2 -28 -12 C-28 -28 -15 -38 0 -38 C15 -38 28 -28 28 -12 C28 2 14 8 14 16 Z"
        fill="none"
        stroke={e > 0.3 ? rgba(AMBER_HOT, 0.6 + 0.4 * e) : rgba(CYAN, 0.75)}
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
      {/* filament */}
      <path d="M-7 12 V-4 L-4 -10 L0 -4 L4 -10 L7 -4 V12" fill="none" stroke={e > 0.3 ? `rgba(255,250,235,${(0.7 + 0.3 * e).toFixed(3)})` : rgba(CYAN, 0.5)} strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M-17 -22 A20 20 0 0 1 -6 -31" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2.4} strokeLinecap="round" />
      {/* screw base */}
      <rect x={-14} y={17} width={28} height={16} rx={4} fill="rgba(34,211,238,0.22)" stroke={rgba(CYAN, 0.8)} strokeWidth={2.2} />
      <line x1={-14} y1={23} x2={14} y2={23} stroke={rgba(CYAN, 0.6)} strokeWidth={2} />
      <line x1={-14} y1={28} x2={14} y2={28} stroke={rgba(CYAN, 0.6)} strokeWidth={2} />
      <path d="M-6 33 H6 L3 38 H-3 Z" fill={rgba(CYAN, 0.7)} />
    </g>
  );
};

export const SharingFx: ToolFx = ({ g, f0, size }) => {
  const t = g - f0;
  const k = size / 760;
  const bp = beatPulse(g, 14);
  const idle = clamp01((t - 92) / 24);
  const lightOf = (key: Key) => iv(t, [LIT[key], LIT[key] + 5], [0, 1], EASE_OUT);
  const netA = iv(t, [NET, NET + 14], [0, 1], EASE_OUT);
  const netFlash = decay(t - NET, 10);

  // ── links ──
  const linkEls: React.ReactNode[] = [];
  const pulses: React.ReactNode[] = [];
  LINKS.forEach((L, i) => {
    const d = qd(L.a, L.c, L.b);
    const draw = iv(t, [4 + 3 * i, 28 + 3 * i], [0, 1], EASE_IN_OUT);
    const lit = iv(t, [L.t0, L.t1], [0, 1], EASE_IN_OUT);
    const glowA = (0.55 + 0.25 * netA + 0.35 * netFlash) * (lit > 0 ? 1 : 0);
    linkEls.push(
      <g key={i}>
        <path d={d} fill="none" stroke={rgba(CYAN, 0.2)} strokeWidth={3} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
        <path d={d} fill="none" stroke={rgba(CYAN, 0.32)} strokeWidth={3} strokeLinecap="round" strokeDasharray="2 14" opacity={draw} />
        {lit > 0.001 ? (
          <g>
            <path d={d} fill="none" stroke={rgba(CYAN, glowA * 0.55)} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray={`${lit} 2`} filter="url(#shrBlur)" />
            <path d={d} fill="none" stroke={rgba(ICE, Math.min(1, glowA + 0.15))} strokeWidth={3.6} strokeLinecap="round" pathLength={1} strokeDasharray={`${lit} 2`} />
          </g>
        ) : null}
      </g>,
    );
    // idle: light pulses travel the links
    if (idle > 0) {
      for (let j = 0; j < 2; j++) {
        const u = ((t - 92) / 64 + j * 0.5 + rand(i * 3.1) * 0.37) % 1;
        const fade = Math.sin(u * Math.PI);
        const [px, py] = bez(L.a, L.c, L.b, u);
        const [qx, qy] = bez(L.a, L.c, L.b, Math.max(0, u - 0.06));
        pulses.push(
          <g key={`${i}-${j}`} opacity={idle * fade}>
            <line x1={qx} y1={qy} x2={px} y2={py} stroke={rgba(AMBER_HOT, 0.55)} strokeWidth={7} strokeLinecap="round" filter="url(#shrBlur)" />
            <circle cx={px} cy={py} r={11} fill={rgba(AMBER, 0.35)} filter="url(#shrBlur)" />
            <circle cx={px} cy={py} r={5} fill="#FFF7E6" />
          </g>,
        );
      }
    }
  });

  // ── teams ──
  const order: Key[] = ["A", "B", "D", "C"];
  const teamEls = order.map((key, i) => {
    const [x, y] = TEAM[key];
    const en = iv(t, [2 * i, 14 + 2 * i], [0, 1], EASE_OUT);
    const lt = lightOf(key);
    const age = t - LIT[key];
    const hop = age >= 0 ? Math.sin(clamp01(age / 16) * Math.PI) * 13 : 0;
    const bob = Math.sin(g * 0.07 + i * 1.9) * 3.5 * idle;
    const sc = (0.86 + 0.14 * en) * (key === "A" ? 1.06 : 1);
    const uid = `shr${key}`;
    return (
      <g key={key} opacity={en} transform={`translate(${x} ${y - hop + bob}) scale(${sc}) translate(${-x} ${-y})`}>
        <Avatar uid={uid} x={x} y={y - 16} s={0.86} lit={lt * 0.7} dim={0.8} />
        <Avatar uid={uid} x={x - 38} y={y} s={1} lit={lt} />
        <Avatar uid={uid} x={x + 38} y={y} s={1} lit={lt} />
      </g>
    );
  });
  const bulbEls = order.map((key, i) => {
    const [x, y] = BULB[key];
    const en = iv(t, [4 + 2 * i, 16 + 2 * i], [0, 1], EASE_OUT);
    const lt = lightOf(key);
    const age = t - LIT[key];
    const flick = key === "A" && t >= 9 && t < LIT.A ? (rand(Math.floor(t / 2) * 1.3) > 0.45 ? 0.55 : 0.08) : 0;
    const hop = age >= 0 ? Math.sin(clamp01(age / 16) * Math.PI) * 18 : 0;
    const pop = age >= 0 ? 1 + 0.22 * Math.sin(clamp01(age / 12) * Math.PI) * Math.exp(-age / 10) : 1;
    const bob = Math.sin(g * 0.07 + i * 1.9 + 0.6) * 4 * idle;
    return (
      <g key={key} opacity={en}>
        <Bulb x={x} y={y - hop + bob} on={lt * (0.85 + 0.15 * bp * idle + 0.15 * netFlash)} flicker={flick} flash={decay(age, 8)} pulse={idle * (0.5 + 0.5 * Math.sin(g * 0.12 + i))} sc={(0.6 + 0.4 * en) * pop * (key === "A" ? 1.1 : 1)} />
      </g>
    );
  });

  // ── the doc card: rises out of A's bulb, then copies itself ──
  const rise = iv(t, [24, 38], [0, 1], EASE_OUT);
  const riseOver = t >= 24 ? 1 + 0.1 * Math.sin(clamp01((t - 30) / 14) * Math.PI) * (t > 30 ? 1 : 0) : 0;
  const cardX = CARD[0];
  const cardY = BULB.A[1] + (CARD[1] - BULB.A[1]) * rise + Math.sin(g * 0.06) * 4 * idle;
  const cardS = (0.15 + 0.75 * rise) * riseOver;
  const split = iv(t, [36, 44], [0, 1], EASE_OUT);
  const cards: React.ReactNode[] = [];
  const cardAt = (keyId: string, x: number, y: number, s: number, rot: number, o: number, glint = -1, blur = 0) =>
    o > 0.01 && s > 0.01 ? (
      <div key={keyId} style={{ position: "absolute", left: x, top: y, width: 0, height: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: o }}>
        <div style={{ flexShrink: 0, transform: `scale(${s.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`, filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
          <DocCard glint={glint} amber={decay(t - 36, 10)} />
        </div>
      </div>
    ) : null;

  // flying copies (with a short motion trail)
  LINKS.filter((L) => L.flight).forEach((L, i) => {
    const raw = (t - L.t0) / (L.t1 - L.t0);
    if (raw < 0 || raw > 1) {
      // before the A copies leave, show them peeling off the original
      if (i < 2 && raw < 0 && t >= 36) cards.push(cardAt(`peel${i}`, cardX + (i ? 1 : -1) * 64 * split, cardY + 10 * split, 0.9, (i ? 1 : -1) * 9 * split, split));
      return;
    }
    for (let j = 3; j >= 0; j--) {
      const u = EASE_IN_OUT(clamp01(raw - j * 0.05));
      const [x, y] = bez(L.a, L.c, L.b, u);
      const off = i < 2 ? (1 - clamp01(u * 4)) * (i ? 1 : -1) * 64 : 0;
      const s = iv(u, [0, 0.2, 0.84, 1], [0.9, 0.8, 0.72, 0.16]);
      const o = iv(u, [0, 0.05, 0.86, 1], [1, 1, 1, 0]) * (j ? 0.22 / j : 1);
      const rot = Math.max(-25, Math.min(25, (bezAng(L.a, L.c, L.b, u) - 90) * 0.18));
      cards.push(cardAt(`fly${i}-${j}`, x + off, y, s, rot, o, -1, j ? 2 + j : 0));
    }
  });
  const original = cardAt("orig", cardX, cardY, cardS, 0, rise > 0 ? iv(t, [24, 28], [0, 1]) : 0, iv(t, [36, 50], [0, 1]));

  // sparks when a bulb lights
  const sparks: React.ReactNode[] = [];
  order.forEach((key, n) => {
    const age = t - LIT[key];
    if (age < 0 || age > 22) return;
    const [bx, by] = BULB[key];
    for (let i = 0; i < 12; i++) {
      const a = rand(n * 31 + i * 7.3) * Math.PI * 2;
      const sp = 4 + rand(n * 17 + i * 3.1) * 6;
      const r = 30 + sp * age;
      const x = bx + Math.cos(a) * r;
      const y = by - 6 + Math.sin(a) * r + 0.2 * age * age;
      const al = 1 - age / 22;
      sparks.push(<circle key={`${key}${i}`} cx={x} cy={y} r={2.2 + rand(i + n) * 2} fill={rgba(i % 3 ? AMBER_HOT : ICE, al)} />);
    }
  });

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: size, height: size }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: `scale(${k})`, transformOrigin: "0 0" }}>
        <Bloom x={380} y={430} rx={420} ry={360} col={CYAN} a={0.05 + 0.1 * netA + 0.12 * netFlash} />
        <svg width={760} height={760} viewBox="0 0 760 760" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <filter id="shrBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <radialGradient id="shrHalo" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="rgba(255,196,92,0.55)" />
              <stop offset="0.4" stopColor="rgba(245,158,11,0.2)" />
              <stop offset="1" stopColor="rgba(245,158,11,0)" />
            </radialGradient>
            <radialGradient id="shrGlow" cx="0.5" cy="0.42" r="0.6">
              <stop offset="0" stopColor="#FFF6DD" />
              <stop offset="0.45" stopColor="#FFC45C" />
              <stop offset="1" stopColor="#F59E0B" />
            </radialGradient>
            {order.map((key) => (
              <React.Fragment key={key}>
                <linearGradient id={`shr${key}b`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="rgba(34,211,238,0.34)" />
                  <stop offset="1" stopColor="rgba(34,211,238,0.06)" />
                </linearGradient>
                <radialGradient id={`shr${key}h`} cx="0.4" cy="0.35" r="0.7">
                  <stop offset="0" stopColor="rgba(160,236,255,0.45)" />
                  <stop offset="1" stopColor="rgba(34,211,238,0.1)" />
                </radialGradient>
              </React.Fragment>
            ))}
          </defs>
          {linkEls}
          {pulses}
          {teamEls}
          {bulbEls}
          {sparks}
        </svg>
        {original}
        {cards}
        {order.map((key) => (
          <React.Fragment key={key}>
            <Shockwave age={t - LIT[key]} x={BULB[key][0]} y={BULB[key][1] - 6} col={AMBER} dur={20} maxR={150} r0={30} strength={0.7} />
            <AnamorphicFlare age={t - LIT[key]} x={BULB[key][0]} y={BULB[key][1] - 6} col={AMBER} dur={key === "A" ? 30 : 22} size={key === "A" ? 120 : 80} streakH={60} strength={key === "A" ? 0.8 : 0.5} />
          </React.Fragment>
        ))}
        <Shockwave age={t - NET} x={380} y={430} dur={30} maxR={560} r0={80} strength={0.75} />
      </div>
    </div>
  );
};
