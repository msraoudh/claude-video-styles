import React from "react";
import { Logo } from "../kit/Logo";
import { fontInter, fontMono } from "../kit/fonts";
import { B, glass } from "../lib/look";
import { beatPulse, rand } from "../lib/sync";
import { AMBER, clamp01, CYAN, decay, EASE_IN_OUT, EASE_OUT, ICE, iv, rgba, type RGB } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/**
 * Terraform: « Terraform crée les serveurs » — l'infra écrite dans un fichier.
 *   0     a blueprint card « main.tf » (Terraform logo on its corner) types its code: resource "server" … count = 3.
 *   36    a small « $ terraform apply » pill pops and is pressed (the amber 3 flashes).
 *   44    three beams shoot from the file down to the floor; three isometric servers draw on as cyan wireframes,
 *   64    then fill solid bottom → top with a light front, rack lines and status LEDs switch on (small landing pop).
 *   84    a network line links them, the pill turns « ✓ 3 créés ».
 *   idle  LEDs blink, packets run on the network and down the beams, a scan line passes over the blueprint.
 */
const OK: RGB = [52, 211, 153];
const CARD = { x: 110, y: 20, w: 540, h: 276 };
const O = { x: 380, y: 352 }; // beam origin (under the apply pill)
const SV = [
  { cx: 150, by: 684 },
  { cx: 380, by: 704 },
  { cx: 610, by: 684 },
];
const A = 104; // right (front) face width along the iso axis
const D = 70; // left face width
const H = 140;
const C30 = 0.866;

type Pt = { x: number; y: number };
const iso = (cx: number, by: number) => {
  const F = { x: cx, y: by };
  const R = { x: cx + C30 * A, y: by - 0.5 * A };
  const L = { x: cx - C30 * D, y: by - 0.5 * D };
  const K = { x: cx + C30 * (A - D), y: by - 0.5 * (A + D) };
  const up = (p: Pt) => ({ x: p.x, y: p.y - H });
  return { F, R, L, K, FH: up(F), RH: up(R), LH: up(L), KH: up(K), top: { x: cx + (C30 * (A - D)) / 2, y: by - 0.25 * (A + D) - H } };
};
const pts = (...p: Pt[]) => p.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");
const M = (p: Pt) => `M${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
const Lt = (p: Pt) => `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`;

type Tok = [string, string];
const KW = B.cyan;
const STR = "#BAE6FD";
const ATTR = B.white;
const PUN = "rgba(226,236,250,0.55)";
const CODE: Tok[][] = [
  [["resource", KW], [" ", PUN], ['"server"', STR], [" ", PUN], ['"web"', STR], [" {", PUN]],
  [["  count", ATTR], [" = ", PUN], ["3", B.amber]],
  [["  size ", ATTR], [" = ", PUN], ['"large"', STR]],
  [["}", PUN]],
];
const LEN = CODE.map((l) => l.reduce((n, [s]) => n + s.length, 0));
const TOTAL = LEN.reduce((a, b) => a + b, 0);

export const TerraformFx: ToolFx = ({ g, f0, beats, size, logo }) => {
  const t = g - f0;
  const bp = beatPulse(g, 14);
  const lastBeat = beats.filter((b) => b <= g).pop();
  const beatK = lastBeat === undefined ? 0 : decay(g - lastBeat, 10);
  const id = `tf${f0}`;

  // ── card ──
  const eCard = iv(t, [0, 14], [0, 1], EASE_OUT);
  const eLogo = iv(t, [4, 20], [0, 1], EASE_OUT);
  const typed = Math.floor(iv(t, [6, 38], [0, TOTAL]));
  const typing = typed < TOTAL;
  const applyAt = 44;
  const threeK = decay(t - applyAt, 12) + 0.25 * beatK;
  const scanA = t < 96 ? iv(t, [38, 58], [0, 1]) : ((t - 96) % 70) / 40;
  const scanOn = (t >= 38 && t < 58) || (t >= 96 && scanA < 1);
  const cardFlash = decay(t - applyAt, 14);

  // ── pill ──
  const ePill = iv(t, [32, 42], [0, 1], EASE_OUT);
  const press = t >= applyAt ? 1 - 0.07 * Math.sin(clamp01((t - applyAt) / 8) * Math.PI) : 1;
  const done = iv(t, [86, 94], [0, 1], EASE_OUT);

  // per-line typing
  let left = typed;
  const lines = CODE.map((toks, li) => {
    const n = Math.max(0, Math.min(LEN[li], left));
    left -= LEN[li];
    let rem = n;
    const spans = toks.map(([s, c], k) => {
      const part = s.slice(0, Math.max(0, rem));
      rem -= s.length;
      const isThree = s === "3";
      return (
        <span
          key={k}
          style={{
            color: c,
            display: isThree ? "inline-block" : undefined,
            transform: isThree ? `scale(${(1 + 0.45 * threeK).toFixed(3)})` : undefined,
            textShadow: isThree ? `0 0 ${(10 + 30 * threeK).toFixed(0)}px ${rgba(AMBER, 0.6 + 0.4 * clamp01(threeK))}` : c === KW ? `0 0 14px ${rgba(CYAN, 0.45)}` : undefined,
          }}
        >
          {part}
        </span>
      );
    });
    return { spans, n, full: n >= LEN[li] };
  });
  const curLine = typing ? lines.findIndex((l) => !l.full) : 3;
  const cursorOn = typing || Math.floor(t / 16) % 2 === 0;

  // ── beams / servers timing ──
  const beam = (i: number) => iv(t, [applyAt + i * 4, applyAt + 10 + i * 4], [0, 1], EASE_OUT);
  const wire = (i: number) => iv(t, [50 + i * 5, 68 + i * 5], [0, 1], EASE_IN_OUT);
  const fill = (i: number) => iv(t, [62 + i * 5, 78 + i * 5], [0, 1], EASE_IN_OUT);
  const net = iv(t, [80, 96], [0, 1], EASE_IN_OUT);

  const N = SV.map((s) => ({ x: s.cx, y: s.by + 16 }));
  const segLen = [Math.hypot(N[1].x - N[0].x, N[1].y - N[0].y), Math.hypot(N[2].x - N[1].x, N[2].y - N[1].y)];
  const netAt = (p: number): Pt => {
    const d = p * (segLen[0] + segLen[1]);
    if (d <= segLen[0]) {
      const k = d / segLen[0];
      return { x: N[0].x + (N[1].x - N[0].x) * k, y: N[0].y + (N[1].y - N[0].y) * k };
    }
    const k = (d - segLen[0]) / segLen[1];
    return { x: N[1].x + (N[2].x - N[1].x) * k, y: N[1].y + (N[2].y - N[1].y) * k };
  };

  const server = (i: number) => {
    const s = SV[i];
    const q = iso(s.cx, s.by);
    const w = wire(i);
    const f = fill(i);
    if (w <= 0) return null;
    const landAge = t - (78 + i * 5);
    const pop = landAge >= 0 ? Math.sin(landAge * 0.6) * Math.exp(-landAge / 6) : 0;
    const sc = 1 + 0.05 * pop;
    const topY = q.KH.y;
    const span = s.by + 2 - topY;
    const fy = topY + (1 - f) * span;
    const edges = `${M(q.L)} ${Lt(q.F)} ${Lt(q.R)} ${M(q.L)} ${Lt(q.LH)} ${M(q.F)} ${Lt(q.FH)} ${M(q.R)} ${Lt(q.RH)} ${M(q.LH)} ${Lt(q.FH)} ${Lt(q.RH)} ${Lt(q.KH)} Z`;
    const hidden = `${M(q.L)} ${Lt(q.K)} ${Lt(q.R)} ${M(q.K)} ${Lt(q.KH)}`;
    const on = f >= 1;
    const led = (k: number) => {
      if (!on) return 0;
      const ph = Math.floor((t + k * 5 + i * 11) / (9 + (k % 3) * 4));
      return rand(ph * 31.7 + i * 7 + k * 3) > 0.28 ? 1 : 0.25;
    };
    const unit = H / 3;
    return (
      <g key={i} transform={`translate(${s.cx} ${s.by}) scale(${sc.toFixed(4)}) translate(${-s.cx} ${-s.by})`}>
        <defs>
          <clipPath id={`${id}-fill-${i}`}>
            <rect x={s.cx - 90} y={fy} width={200} height={s.by + 4 - fy} />
          </clipPath>
          <clipPath id={`${id}-sil-${i}`}>
            <polygon points={pts(q.L, q.F, q.R, q.RH, q.KH, q.LH)} />
          </clipPath>
        </defs>
        {/* floor glow */}
        <ellipse cx={s.cx + 15} cy={s.by - 40} rx={120} ry={56} fill={`url(#${id}-floor)`} opacity={0.4 + 0.6 * f} />
        {/* hidden edges (blueprint) */}
        <path d={hidden} fill="none" stroke={rgba(CYAN, 0.35 * w * (1 - f))} strokeWidth={1.5} strokeDasharray="5 6" />
        {/* solid faces, filling bottom → top */}
        <g clipPath={`url(#${id}-fill-${i})`}>
          <polygon points={pts(q.L, q.F, q.FH, q.LH)} fill={`url(#${id}-left)`} />
          <polygon points={pts(q.F, q.R, q.RH, q.FH)} fill={`url(#${id}-right)`} />
          <polygon points={pts(q.LH, q.FH, q.RH, q.KH)} fill={`url(#${id}-top)`} />
          {/* front panel: rack units, LEDs, vents */}
          <g transform={`matrix(${C30} -0.5 0 1 ${q.FH.x} ${q.FH.y})`}>
            {[1, 2].map((k) => (
              <line key={k} x1={4} y1={unit * k} x2={A - 4} y2={unit * k} stroke="rgba(190,240,255,0.35)" strokeWidth={1.5} />
            ))}
            {[0, 1, 2].map((u) => (
              <g key={u}>
                <circle cx={14} cy={unit * u + unit / 2} r={6.5} fill={u === 0 ? rgba(OK, 0.25 + 0.75 * led(u * 2)) : rgba(CYAN, 0.25 + 0.75 * led(u * 2))} style={led(u * 2) > 0.5 ? { filter: `drop-shadow(0 0 5px ${u === 0 ? rgba(OK, 1) : rgba(CYAN, 1)})` } : undefined} />
                <circle cx={30} cy={unit * u + unit / 2} r={5} fill={rgba(OK, 0.2 + 0.8 * led(u * 2 + 1))} style={led(u * 2 + 1) > 0.5 ? { filter: `drop-shadow(0 0 5px ${rgba(OK, 1)})` } : undefined} />
                {[-8, 0, 8].map((dy) => (
                  <line key={dy} x1={44} y1={unit * u + unit / 2 + dy} x2={A - 12} y2={unit * u + unit / 2 + dy} stroke="rgba(150,210,255,0.3)" strokeWidth={2.5} strokeLinecap="round" />
                ))}
              </g>
            ))}
          </g>
          <g transform={`matrix(${C30} 0.5 0 1 ${q.LH.x} ${q.LH.y})`}>
            {[0, 1, 2, 3].map((k) => (
              <line key={k} x1={14 + k * 13} y1={18} x2={14 + k * 13} y2={H - 18} stroke="rgba(150,210,255,0.16)" strokeWidth={3} strokeLinecap="round" />
            ))}
          </g>
        </g>
        {/* the materialising light front */}
        {f > 0 && f < 1 ? (
          <g clipPath={`url(#${id}-sil-${i})`}>
            <rect x={s.cx - 90} y={fy - 10} width={200} height={20} fill={rgba(CYAN, 0.35)} style={{ mixBlendMode: "screen" }} />
            <rect x={s.cx - 90} y={fy - 1.5} width={200} height={3} fill={rgba(ICE, 0.95)} />
          </g>
        ) : null}
        {/* wireframe */}
        <path d={edges} fill="none" stroke={rgba(ICE, 0.95)} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - w} style={{ filter: `drop-shadow(0 0 ${(6 + 6 * (1 - f) + 4 * bp).toFixed(1)}px ${rgba(CYAN, 0.9)})` }} />
        {/* name */}
        <text x={s.cx + 10} y={s.by + 46} textAnchor="middle" fontFamily={fontMono} fontWeight={700} fontSize={19} fill={rgba(ICE, 0.75)} opacity={f}>
          web-{i + 1}
        </text>
      </g>
    );
  };

  // beams + dots
  const beamEls: React.ReactNode[] = [];
  SV.forEach((s, i) => {
    const q = iso(s.cx, s.by);
    const T = q.top;
    const b = beam(i);
    if (b <= 0) return;
    const hx = O.x + (T.x - O.x) * b;
    const hy = O.y + (T.y - O.y) * b;
    const arrive = decay(t - (applyAt + 10 + i * 4), 10);
    const strong = b < 1 ? 1 : 0.18 + 0.8 * arrive;
    beamEls.push(
      <g key={i}>
        <line x1={O.x} y1={O.y} x2={hx} y2={hy} stroke={rgba(CYAN, 0.35 * strong)} strokeWidth={14} strokeLinecap="round" style={{ mixBlendMode: "screen" }} />
        <line x1={O.x} y1={O.y} x2={hx} y2={hy} stroke={rgba(ICE, 0.95 * strong)} strokeWidth={3} strokeLinecap="round" strokeDasharray={b >= 1 && arrive < 0.3 ? "6 8" : undefined} />
        {b < 1 ? <circle cx={hx} cy={hy} r={9} fill="#FFFFFF" style={{ filter: `drop-shadow(0 0 12px ${rgba(CYAN, 1)})` }} /> : null}
        {b >= 1 ? <circle cx={T.x} cy={T.y} r={10 + 40 * (1 - arrive)} fill="none" stroke={rgba(ICE, 0.8 * arrive)} strokeWidth={3} /> : null}
        {b >= 1 && t > 90
          ? [0, 1].map((k) => {
              const p = ((t * 0.018 + k * 0.5 + i * 0.21) % 1 + 1) % 1;
              return <circle key={k} cx={O.x + (T.x - O.x) * p} cy={O.y + (T.y - O.y) * p} r={4} fill={rgba(ICE, 0.9 * Math.sin(p * Math.PI))} />;
            })
          : null}
      </g>,
    );
  });

  const netPath = `${M(N[0])} ${Lt(N[1])} ${Lt(N[2])}`;
  const scanY = CARD.y + 66 + clamp01(scanA) * (CARD.h - 72);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: size, height: size }}>
      {/* back light */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 380, height: 380, background: `radial-gradient(55% 45% at 50% 60%, ${rgba(CYAN, 0.1 + 0.04 * bp)}, rgba(0,0,0,0))` }} />

      {/* beams, network, servers */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id={`${id}-right`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#24709E" />
            <stop offset="0.55" stopColor="#123A63" />
            <stop offset="1" stopColor="#0B2244" />
          </linearGradient>
          <linearGradient id={`${id}-left`} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0E2A4E" />
            <stop offset="1" stopColor="#071730" />
          </linearGradient>
          <linearGradient id={`${id}-top`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7FDDF5" />
            <stop offset="1" stopColor="#2C8DB8" />
          </linearGradient>
          <radialGradient id={`${id}-floor`}>
            <stop offset="0" stopColor={rgba(CYAN, 0.35)} />
            <stop offset="1" stopColor={rgba(CYAN, 0)} />
          </radialGradient>
        </defs>
        {beamEls}
        {/* network line */}
        {net > 0 ? (
          <>
            <path d={netPath} fill="none" stroke={rgba(CYAN, 0.3)} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - net} style={{ mixBlendMode: "screen" }} />
            <path d={netPath} fill="none" stroke={rgba(ICE, 0.9)} strokeWidth={3} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - net} />
            {N.map((p, k) => (
              <circle key={k} cx={p.x} cy={p.y} r={7 * clamp01((net - k * 0.45) * 4)} fill={B.cyan} style={{ filter: `drop-shadow(0 0 8px ${rgba(CYAN, 1)})` }} />
            ))}
            {net >= 1
              ? [0, 1, 2].map((k) => {
                  const ph = (t * 0.012 + k / 3) % 1;
                  const p = netAt(ph < 0.5 ? ph * 2 : 2 - ph * 2);
                  return <circle key={`p${k}`} cx={p.x} cy={p.y} r={5} fill="#FFFFFF" style={{ filter: `drop-shadow(0 0 8px ${rgba(CYAN, 1)})` }} />;
                })
              : null}
          </>
        ) : null}
        {/* the planned footprints on the floor (blueprint), before anything exists */}
        {SV.map((sv, i) => {
          const q = iso(sv.cx, sv.by);
          const e = iv(t, [8 + i * 4, 24 + i * 4], [0, 1], EASE_OUT);
          const a = e * (0.5 - 0.35 * fill(i)) * (0.8 + 0.2 * Math.sin(t * 0.15 + i));
          return a > 0.01 ? <polygon key={`fp${i}`} points={pts(q.L, q.F, q.R, q.K)} fill={rgba(CYAN, 0.06 * e)} stroke={rgba(CYAN, a)} strokeWidth={2} strokeDasharray="7 7" strokeDashoffset={-t * 0.6} /> : null;
        })}
        {/* back servers first (sides), middle one in front */}
        {server(0)}
        {server(2)}
        {server(1)}
      </svg>

      {/* main.tf blueprint card */}
      <div
        style={{
          ...glass("34,211,238", 0.8 + cardFlash),
          position: "absolute",
          left: CARD.x,
          top: CARD.y,
          width: CARD.w,
          height: CARD.h,
          borderRadius: 30,
          overflow: "hidden",
          opacity: eCard,
          transform: `translateY(${((1 - eCard) * 24 + Math.sin(t * 0.06) * 3).toFixed(2)}px) scale(${(0.96 + 0.04 * eCard).toFixed(3)})`,
          border: `1.5px solid ${rgba(CYAN, 0.25 + 0.55 * cardFlash)}`,
        }}
      >
        {/* blueprint grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(${rgba(CYAN, 0.07)} 1px, transparent 1px), linear-gradient(90deg, ${rgba(CYAN, 0.07)} 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
            backgroundPosition: "-1px -1px",
          }}
        />
        {/* header */}
        <div style={{ position: "absolute", left: 24, top: 16, height: 36, display: "flex", alignItems: "center", gap: 12 }}>
          <svg width={26} height={32} viewBox="0 0 26 32">
            <path d="M2 2 H17 L24 9 V30 H2 Z" fill={rgba(CYAN, 0.15)} stroke={B.cyan} strokeWidth={2.2} strokeLinejoin="round" />
            <path d="M17 2 V9 H24" fill="none" stroke={B.cyan} strokeWidth={2.2} strokeLinejoin="round" />
          </svg>
          <div style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 25, color: B.white }}>main.tf</div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 64, height: 1, background: "rgba(255,255,255,0.1)" }} />
        {/* code */}
        <div style={{ position: "absolute", left: 28, top: 84, fontFamily: fontMono, fontWeight: 700, fontSize: 30, lineHeight: "46px", whiteSpace: "pre" }}>
          {lines.map((l, li) => (
            <div key={li} style={{ height: 46, position: "relative" }}>
              {li === 1 && threeK > 0.02 ? <div style={{ position: "absolute", left: -12, right: -230, top: 2, bottom: 2, borderRadius: 10, background: rgba(AMBER, 0.12 * clamp01(threeK)) }} /> : null}
              <span style={{ position: "relative" }}>{l.spans}</span>
              {li === curLine && cursorOn ? <span style={{ display: "inline-block", width: 15, height: 32, marginLeft: 2, verticalAlign: "-5px", background: B.amber, boxShadow: `0 0 10px ${rgba(AMBER, 0.8)}` }} /> : null}
            </div>
          ))}
        </div>
        {/* scan line */}
        {scanOn ? (
          <>
            <div style={{ position: "absolute", left: 0, right: 0, top: scanY - 30, height: 30, background: `linear-gradient(180deg, rgba(0,0,0,0), ${rgba(CYAN, 0.16)})` }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: scanY - 1, height: 2, background: rgba(ICE, 0.8), boxShadow: `0 0 12px ${rgba(CYAN, 0.9)}` }} />
          </>
        ) : null}
      </div>
      {/* Terraform logo on the card corner */}
      <div style={{ position: "absolute", left: CARD.x + CARD.w - 70, top: CARD.y - 16, transform: `rotate(${(6 + Math.sin(t * 0.05) * 2).toFixed(2)}deg) scale(${(1 + 0.04 * bp).toFixed(3)})` }}>
        <Logo name={logo} size={92} draw={eLogo} glow={0.4 + 0.4 * cardFlash} />
      </div>

      {/* apply pill */}
      <div
        style={{
          position: "absolute",
          left: O.x - 150,
          top: 300,
          width: 300,
          height: 46,
          borderRadius: 23,
          background: "rgba(8,16,34,0.92)",
          border: `1.5px solid ${done > 0 ? rgba(OK, 0.4 + 0.5 * done) : rgba(CYAN, 0.4 + 0.5 * cardFlash)}`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.16), 0 10px 26px rgba(0,0,0,0.5), 0 0 ${(18 + 40 * cardFlash).toFixed(0)}px ${done > 0 ? rgba(OK, 0.3) : rgba(CYAN, 0.25 + 0.4 * cardFlash)}`,
          opacity: clamp01(ePill * 2),
          transform: `scale(${((0.6 + 0.4 * ePill) * press).toFixed(3)})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          fontFamily: fontMono,
          fontWeight: 700,
          fontSize: 22,
          color: B.white,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, opacity: 1 - done, transform: `translateY(${(-done * 20).toFixed(1)}px)` }}>
          <span style={{ color: B.amber }}>$</span>
          <span>terraform apply</span>
          {t >= applyAt ? (
            <svg width={20} height={20} viewBox="-10 -10 20 20">
              <circle r={7.5} fill="none" stroke={B.cyan} strokeWidth={2.6} strokeLinecap="round" pathLength={1} strokeDasharray="0.3 0.7" transform={`rotate(${(t * 14) % 360})`} />
            </svg>
          ) : null}
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, opacity: done, transform: `translateY(${((1 - done) * 20).toFixed(1)}px)`, fontFamily: fontInter, fontWeight: 800, fontSize: 23 }}>
          <svg width={24} height={24} viewBox="-12 -12 24 24">
            <circle r={11} fill={rgba(OK, 0.95)} />
            <path d="M-5 0 L-1.5 4 L5.5 -4" fill="none" stroke="#FFFFFF" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>3 serveurs créés</span>
        </div>
        {/* press sheen */}
        <div style={{ position: "absolute", top: 0, bottom: 0, width: 60, left: -80 + 440 * iv(t, [applyAt, applyAt + 14], [0, 1]), background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.3), rgba(255,255,255,0))", transform: "skewX(-18deg)" }} />
      </div>
    </div>
  );
};
