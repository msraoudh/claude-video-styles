import React from "react";
import { Logo } from "../kit/Logo";
import { fontInter, fontMono } from "../kit/fonts";
import { glass } from "../lib/look";
import { beatPulse, rand } from "../lib/sync";
import { AMBER, AnamorphicFlare, clamp01, CYAN, decay, EASE_IN, EASE_IN_OUT, EASE_OUT, ICE, iv, rgba, Shockwave, type RGB } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/* ───────────────────────── shared: a 3D-ish glass shipping container (also used by kubernetes.tsx) ───────────────────────── */

export type BoxProps = {
  /** unique per instance in the DOM (svg gradient ids) */
  uid: string;
  /** front face width / height; dx,d = depth offset of the top/side faces */
  w: number;
  h: number;
  dx?: number;
  d?: number;
  /** lid angle in degrees: 0 closed, ~120 wide open (hinged on the back edge) */
  lid?: number;
  tint?: RGB;
  /** 0..1 white flash */
  flash?: number;
  /** 0..1 position of a light band running across the ribs (null = none) */
  sweep?: number | null;
  /** 0..1 glow inside the open box */
  inner?: number;
  ribs?: number;
  /** <0 none, else 0..1 brightness of a green "running" LED */
  led?: number;
  sw?: number;
};

export const boxSize = (w: number, h: number) => ({ dx: w * 0.22, d: w * 0.16, W: w * 1.22, H: h + w * 0.16 });

export const ContainerBox: React.FC<BoxProps> = ({ uid, w, h, dx = w * 0.22, d = w * 0.16, lid = 0, tint = CYAN, flash = 0, sweep = null, inner = 0, ribs = 12, led = -1, sw = 2.5 }) => {
  const c = (a: number) => rgba(tint, a);
  const th = (Math.max(0, lid) * Math.PI) / 180;
  const L = Math.hypot(dx, d) * 1.35;
  const vx = -dx * Math.cos(th);
  const vy = d * Math.cos(th) - L * Math.sin(th);
  const open = lid > 0.5;
  const under = lid > 90;
  const sx = sweep === null ? -99999 : -w * 0.25 + sweep * w * 1.5;
  const front = `M0 ${d} H${w} V${d + h} H0 Z`;
  const side = `M${w} ${d} L${w + dx} 0 V${h} L${w} ${d + h} Z`;
  const top = `M0 ${d} L${dx} 0 H${w + dx} L${w} ${d} Z`;
  const nl = Math.max(2, Math.round(ribs * 0.6));
  const lidEl = (
    <g>
      <path d={`M${dx} 0 H${w + dx} L${(w + dx + vx).toFixed(2)} ${vy.toFixed(2)} L${(dx + vx).toFixed(2)} ${vy.toFixed(2)} Z`} fill={`url(#${uid}${under ? "u" : "t"})`} stroke={c(0.85)} strokeWidth={sw} strokeLinejoin="round" />
      {Array.from({ length: nl - 1 }, (_, i) => {
        const x = dx + (w * (i + 1)) / nl;
        return <line key={i} x1={x} y1={0} x2={x + vx} y2={vy} stroke={c(under ? 0.18 : 0.32)} strokeWidth={sw * 0.7} />;
      })}
      {!under ? <path d={`M${(dx + vx).toFixed(2)} ${vy.toFixed(2)} H${(w + dx + vx).toFixed(2)}`} stroke="rgba(255,255,255,0.55)" strokeWidth={sw * 0.7} /> : null}
    </g>
  );
  const cs = Math.max(4, w * 0.035);
  const ribBoost = (x: number) => Math.exp(-Math.pow((x - sx) / (w * 0.09), 2));
  const ms = Math.max(2, Math.round((ribs * dx) / w) + 1);
  return (
    <svg width={w + dx} height={h + d} viewBox={`0 0 ${w + dx} ${h + d}`} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c(0.4)} />
          <stop offset="1" stopColor={c(0.1)} />
        </linearGradient>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c(0.22)} />
          <stop offset="1" stopColor={c(0.05)} />
        </linearGradient>
        <linearGradient id={`${uid}t`} x1="0" y1="1" x2="0.4" y2="0">
          <stop offset="0" stopColor={c(0.55)} />
          <stop offset="1" stopColor={c(0.26)} />
        </linearGradient>
        <linearGradient id={`${uid}u`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="rgba(5,12,26,0.92)" />
          <stop offset="1" stopColor={c(0.2)} />
        </linearGradient>
        <radialGradient id={`${uid}o`} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor={c(Math.min(1, 0.25 + 0.7 * inner))} />
          <stop offset="1" stopColor="rgba(5,12,26,0)" />
        </radialGradient>
        <linearGradient id={`${uid}w`} gradientUnits="userSpaceOnUse" x1={sx - w * 0.2} y1={0} x2={sx + w * 0.2} y2={0}>
          <stop offset="0" stopColor="rgba(255,255,255,0)" />
          <stop offset="0.5" stopColor="rgba(255,255,255,0.26)" />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      {open ? (
        <g>
          <path d={top} fill="#050C1A" />
          <path d={top} fill={`url(#${uid}o)`} />
        </g>
      ) : null}
      {under ? lidEl : null}
      {/* side face */}
      <path d={side} fill={`url(#${uid}s)`} stroke={c(0.6)} strokeWidth={sw} strokeLinejoin="round" />
      {Array.from({ length: ms }, (_, k) => {
        const f = (k + 1) / (ms + 1);
        const x = w + dx * f;
        const y1 = d - d * f + h * 0.08;
        return <line key={k} x1={x} y1={y1} x2={x} y2={y1 + h * 0.84} stroke={c(0.28)} strokeWidth={sw * 0.8} />;
      })}
      {/* front face */}
      <path d={front} fill={`url(#${uid}f)`} stroke={c(0.9)} strokeWidth={sw} strokeLinejoin="round" />
      <rect x={0} y={d} width={w} height={h * 0.07} fill={c(0.38)} />
      <rect x={0} y={d + h * 0.93} width={w} height={h * 0.07} fill={c(0.3)} />
      {Array.from({ length: ribs - 1 }, (_, i) => {
        const x = (w * (i + 1)) / ribs;
        const b = ribBoost(x);
        const col =
          b > 0.02
            ? `rgba(${Math.round(tint[0] + (255 - tint[0]) * b)},${Math.round(tint[1] + (255 - tint[1]) * b)},${Math.round(tint[2] + (255 - tint[2]) * b)},${(0.34 + 0.6 * b).toFixed(3)})`
            : c(0.34);
        return (
          <g key={i}>
            <line x1={x + sw * 1.1} y1={d + h * 0.1} x2={x + sw * 1.1} y2={d + h * 0.9} stroke="rgba(0,0,0,0.28)" strokeWidth={sw * 0.8} />
            <line x1={x} y1={d + h * 0.1} x2={x} y2={d + h * 0.9} stroke={col} strokeWidth={sw * (0.9 + 0.5 * b)} />
          </g>
        );
      })}
      {sweep !== null ? <rect x={0} y={d} width={w} height={h} fill={`url(#${uid}w)`} /> : null}
      {[
        [0, d],
        [w - cs, d],
        [0, d + h - cs],
        [w - cs, d + h - cs],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={cs} height={cs} rx={cs * 0.2} fill={c(0.75)} />
      ))}
      {/* lid (= top face when closed) */}
      {!under ? lidEl : null}
      <path d={`M0 ${d} H${w}`} stroke="rgba(255,255,255,0.5)" strokeWidth={sw * 0.7} />
      {led >= 0 ? (
        <g>
          <circle cx={w * 0.9} cy={d + h * 0.24} r={h * 0.2} fill={`rgba(52,211,153,${(0.25 * led).toFixed(3)})`} />
          <circle cx={w * 0.9} cy={d + h * 0.24} r={h * 0.075} fill={`rgba(110,240,190,${(0.4 + 0.6 * led).toFixed(3)})`} />
        </g>
      ) : null}
      {flash > 0.005 ? <path d={`${front} ${side} ${top}`} fill="#EFFCFF" opacity={Math.min(0.9, flash)} /> : null}
    </svg>
  );
};

/* ───────────────────────── tile icons ───────────────────────── */

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
const GEAR = gearPath(40, 40, 33, 25, 8);

type Kind = "code" | "libs" | "config";
const TILE = 136;
const Tile: React.FC<{ kind: Kind; glow: number }> = ({ kind, glow }) => {
  const ic = "#67E8F9";
  return (
    <div style={{ ...glass("34,211,238", 0.8 + glow), width: TILE, height: TILE, borderRadius: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
      {kind === "code" ? (
        <div style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 46, color: ic, letterSpacing: "-0.06em", lineHeight: 1, height: 70, display: "flex", alignItems: "center", textShadow: "0 0 18px rgba(34,211,238,0.6)" }}>{"</>"}</div>
      ) : (
        <svg width={70} height={70} viewBox="0 0 80 80" style={{ overflow: "visible", filter: "drop-shadow(0 0 8px rgba(34,211,238,0.6))" }}>
          {kind === "config" ? (
            <g fill="none" stroke={ic} strokeWidth={6} strokeLinejoin="round">
              <path d={GEAR} />
              <circle cx={40} cy={40} r={10} />
            </g>
          ) : (
            <g fill="none" stroke={ic} strokeWidth={5.5} strokeLinejoin="round" strokeLinecap="round">
              <path d="M40 8 L68 23 V55 L40 71 L12 55 V23 Z" />
              <path d="M12 23 L40 39 L68 23 M40 39 V71" />
              <path d="M26 15.5 L54 31" stroke="rgba(103,232,249,0.6)" />
            </g>
          )}
        </svg>
      )}
      <div style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 23, color: "rgba(240,250,255,0.92)", letterSpacing: "-0.01em" }}>{kind}</div>
    </div>
  );
};

/* ───────────────────────── Docker: the app is packed into a box ───────────────────────── */
/*
 * t = g - f0
 * 0–14    the open container (lid up, dark glowing inside) settles; « code », « libs », « config » glass tiles pop in above
 * 22–54   a suction cone + motes: each tile curls, shrinks and dives into the box (inside glows at every catch)
 * 55–63   the lid slams (EASE_IN) → squash & bounce, white flash, shockwave, flare, cyan sparks
 * 70–78   the real Docker logo stamps onto the front (2.5× → 1, amber ring + amber sparks, the box shakes)
 * 86–108  the box shrinks down onto a cyan rail that draws out; 100–124 two identical copies slide out from behind it,
 *         chips « PC », « serveur », « cloud » pop under them (« ça tourne partout pareil »)
 * idle    containers bob, light runs along the ribs, a light runs along the rail, LEDs pulse
 */

const BW_ = 380;
const BH_ = 230;
const SZ = boxSize(BW_, BH_); // dx 83.6, d 60.8, W 463.6, H 290.8
const CX = 380; // bbox centre x (stage)
const BOT0 = 604; // bbox bottom at the start
const RAIL = 486; // rail y
const S1 = 0.5; // final scale on the rail
const OPEN = { x: CX - SZ.W / 2 + SZ.dx / 2 + BW_ / 2, y: BOT0 - SZ.H + SZ.d / 2 };
const LOGO_AT = { x: BW_ / 2, y: SZ.d + BH_ / 2 }; // local (front face centre)
const COPY_X = [CX - 252, CX + 252];
const CHIPS = [
  { x: CX - 252, t: "PC" },
  { x: CX, t: "serveur" },
  { x: CX + 252, t: "cloud" },
];
const TILES: Array<{ kind: Kind; x: number; y: number; in: number; go: number }> = [
  { kind: "code", x: 150, y: 150, in: 2, go: 22 },
  { kind: "libs", x: 380, y: 96, in: 7, go: 30 },
  { kind: "config", x: 610, y: 150, in: 12, go: 38 },
];
const FLY = 16;
const SLAM = 63;
const STAMP = 78;
const MOVE = [86, 108];
const COPY0 = 100;

/** one packed container (box + Docker logo) in its own bbox div */
const Packed: React.FC<{ uid: string; lid: number; flash: number; sweep: number | null; inner: number; logoS: number; logoO: number; glow: number; ring: number; ringA: number }> = ({ uid, lid, flash, sweep, inner, logoS, logoO, glow, ring, ringA }) => (
  <div style={{ position: "relative", width: SZ.W, height: SZ.H }}>
    <ContainerBox uid={uid} w={BW_} h={BH_} lid={lid} flash={flash} sweep={sweep} inner={inner} ribs={14} sw={3} />
    <div style={{ position: "absolute", left: LOGO_AT.x, top: LOGO_AT.y, width: 0, height: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {ringA > 0.01 ? (
        <div style={{ position: "absolute", width: 170, height: 170, borderRadius: "50%", border: `5px solid ${rgba(AMBER, ringA)}`, boxShadow: `0 0 30px ${rgba(AMBER, ringA * 0.7)}, inset 0 0 20px ${rgba(AMBER, ringA * 0.4)}`, transform: `scale(${ring.toFixed(3)})` }} />
      ) : null}
      {logoO > 0.01 ? (
        <div style={{ opacity: logoO, transform: `scale(${logoS.toFixed(3)})`, flexShrink: 0 }}>
          <Logo name="docker" size={118} glow={glow} />
        </div>
      ) : null}
    </div>
  </div>
);

export const DockerFx: ToolFx = ({ g, f0, size }) => {
  const t = g - f0;
  const k = size / 760;
  const bp = beatPulse(g, 14);

  // ── entrance of the box (the archetype already slides the stage in: keep it subtle) ──
  const enter = iv(t, [0, 14], [0, 1], EASE_OUT);

  // ── suction ──
  const absorbs = TILES.map((tl) => tl.go + FLY);
  const innerKick = absorbs.reduce((m, a) => Math.max(m, decay(t - a, 7)), 0);
  const beamA = iv(t, [12, 22, 54, 62], [0, 1, 1, 0]);

  // ── lid ──
  let lid = 118 * iv(t, [0, 14], [0.7, 1], EASE_OUT);
  if (t >= 55) lid = 118 * (1 - iv(t, [55, SLAM], [0, 1], EASE_IN));
  if (t >= SLAM) lid = Math.max(0, 9 * Math.sin(clamp01((t - SLAM) / 9) * Math.PI) * Math.exp(-(t - SLAM) / 6));
  const slamA = t - SLAM;
  const sq = slamA >= 0 ? Math.sin(clamp01(slamA / 20) * Math.PI * 2) * Math.exp(-slamA / 7) : 0;
  const bump = absorbs.reduce((m, a) => m + (t >= a ? Math.sin(clamp01((t - a) / 10) * Math.PI) * Math.exp(-(t - a) / 6) * 0.025 : 0), 0);
  const flash = decay(slamA, 6) * 0.85 + 0.25 * decay(t - (STAMP + 2), 5);

  // ── stamp ──
  const stA = t - STAMP;
  let logoS = iv(t, [STAMP - 8, STAMP], [2.5, 1], EASE_IN);
  if (stA >= 0) logoS = 1 - 0.12 * Math.sin(clamp01(stA / 14) * Math.PI * 2) * Math.exp(-stA / 6);
  const logoO = iv(t, [STAMP - 8, STAMP - 4], [0, 1]);
  const shake = stA >= 0 ? Math.sin(stA * 2.4) * 5 * Math.exp(-stA / 5) : 0;
  const ring = iv(stA, [0, 18], [0.6, 1.9], EASE_OUT);
  const ringA = stA >= 0 ? iv(stA, [0, 2, 18], [0, 0.95, 0]) : 0;

  // ── onto the rail ──
  const mv = iv(t, MOVE, [0, 1], EASE_IN_OUT);
  const railP = iv(t, [MOVE[0] - 2, MOVE[1] + 2], [0, 1], EASE_OUT);
  const idle = clamp01((t - 118) / 30);
  const sweepOf = (ph: number) => {
    if (t < 4) return null;
    if (t < 40) return iv(t, [4, 36], [0, 1]);
    if (t < 120) return null;
    const u = ((t - 120 + ph) % 84) / 84;
    return u < 0.62 ? u / 0.62 : null;
  };

  const bob = (i: number) => Math.sin(g * 0.075 + i * 1.7) * 5 * idle;
  const mainSc = (1 + (S1 - 1) * mv) * (0.94 + 0.06 * enter);
  const mainTy = (RAIL - BOT0) * mv + bob(1);
  const glow = 0.25 + 0.35 * bp * idle + 0.6 * decay(stA, 8);

  const boxDiv = (key: string, x: number, ty: number, sc: number, sx: number, sy: number, o: number, child: React.ReactNode) => (
    <div key={key} style={{ position: "absolute", left: x - SZ.W / 2, top: BOT0 - SZ.H, width: SZ.W, height: SZ.H, opacity: o, transform: `translate(0px, ${ty.toFixed(2)}px) scale(${(sc * sx).toFixed(4)}, ${(sc * sy).toFixed(4)})`, transformOrigin: "50% 100%" }}>
      {child}
    </div>
  );

  // sparks at the slam (cyan) and at the stamp (amber)
  const sparks: React.ReactNode[] = [];
  const burst = (age: number, n: number, seed: number, ox: number, oy: number, spread: number, col: RGB, life: number) => {
    if (age < 0 || age > life) return;
    for (let i = 0; i < n; i++) {
      const r1 = rand(seed + i * 7.1);
      const r2 = rand(seed + i * 3.3 + 1);
      const r3 = rand(seed + i * 5.7 + 2);
      const x0 = ox + (r1 - 0.5) * spread;
      const vx = (r1 - 0.5) * 16 + (r3 - 0.5) * 6;
      const vy = -4 - r2 * 11;
      const x = x0 + vx * age;
      const y = oy + vy * age + 0.42 * age * age;
      const a = 1 - age / life;
      const len = 3 + r3 * 4;
      sparks.push(<line key={`${seed}-${i}`} x1={x} y1={y} x2={x - vx * len * 0.25} y2={y - (vy + 0.84 * age) * len * 0.25} stroke={rgba(i % 3 === 0 ? ICE : col, a)} strokeWidth={3 + r2 * 2.5} strokeLinecap="round" />);
    }
  };
  burst(slamA, 18, 11, OPEN.x - SZ.dx / 2, BOT0 - BH_, BW_, CYAN, 26);
  burst(stA, 10, 47, CX - SZ.dx / 2, BOT0 - BH_ / 2, 60, AMBER, 22);

  // particles pulled into the box
  const motes: React.ReactNode[] = [];
  if (beamA > 0.01) {
    for (let i = 0; i < 16; i++) {
      const sp = 0.012 + rand(i * 9.1) * 0.01;
      const u = (rand(i * 2.7) + t * sp) % 1; // 0 top → 1 at the opening
      const xTop = OPEN.x + (rand(i * 4.4) - 0.5) * 520;
      const x = xTop + (OPEN.x - xTop) * u * u;
      const y = 30 + (OPEN.y - 30) * u;
      motes.push(<circle key={i} cx={x} cy={y} r={2 + rand(i) * 2.5} fill={rgba(ICE, beamA * 0.75 * Math.sin(u * Math.PI))} />);
    }
  }

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: k !== 1 ? `scale(${k})` : undefined, transformOrigin: "0 0" }}>
      {/* floor light */}
      <div style={{ position: "absolute", left: 40, top: 420, width: 680, height: 300, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, 0.14 + 0.06 * bp)}, rgba(34,211,238,0))`, opacity: enter }} />

      {/* suction cone */}
      <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: beamA }}>
        <defs>
          <linearGradient id="dkBeam" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={rgba(CYAN, 0.32 + 0.3 * innerKick)} />
            <stop offset="1" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
        </defs>
        <path d={`M${OPEN.x - 170} ${OPEN.y} L${OPEN.x + 170} ${OPEN.y} L${OPEN.x + 330} 20 L${OPEN.x - 330} 20 Z`} fill="url(#dkBeam)" />
        {motes}
      </svg>

      {/* the rail */}
      <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {railP > 0.01 ? (
          <g>
            <line x1={CX - 360 * railP} y1={RAIL + 2} x2={CX + 360 * railP} y2={RAIL + 2} stroke={rgba(CYAN, 0.35)} strokeWidth={12} strokeLinecap="round" opacity={0.35} />
            <line x1={CX - 360 * railP} y1={RAIL + 2} x2={CX + 360 * railP} y2={RAIL + 2} stroke={rgba(CYAN, 0.95)} strokeWidth={3.5} strokeLinecap="round" />
            {Array.from({ length: 19 }, (_, i) => {
              const x = CX - 360 + i * 40;
              return Math.abs(x - CX) <= 360 * railP ? <line key={i} x1={x} y1={RAIL + 9} x2={x - 8} y2={RAIL + 20} stroke={rgba(CYAN, 0.35)} strokeWidth={3} strokeLinecap="round" /> : null;
            })}
            {idle > 0 ? <circle cx={CX - 360 + (((t - 118) * 7) % 720)} cy={RAIL + 2} r={7} fill="#EFFCFF" opacity={idle * 0.9} style={{ filter: "drop-shadow(0 0 8px rgba(34,211,238,0.9))" }} /> : null}
          </g>
        ) : null}
      </svg>

      {/* identical copies slide out from behind */}
      {COPY_X.map((x, i) => {
        const cp = iv(t, [COPY0 + 4 * i, COPY0 + 4 * i + 20], [0, 1], EASE_OUT);
        if (cp <= 0) return null;
        const xx = CX + (x - CX) * cp;
        const ck = decay(t - (COPY0 + 4 * i + 14), 7);
        return boxDiv(
          `c${i}`,
          xx,
          RAIL - BOT0 + bob(i * 2),
          S1,
          1,
          1,
          iv(cp, [0, 0.35], [0, 1]),
          <Packed uid={`dkc${i}`} lid={0} flash={0.35 * ck + (1 - cp) * 0.4} sweep={sweepOf(28 + 28 * i)} inner={0} logoS={1} logoO={1} glow={glow * 0.8} ring={1} ringA={0} />,
        );
      })}

      {/* the main container */}
      {boxDiv(
        "main",
        CX + shake,
        mainTy - 10 * (1 - enter),
        mainSc,
        1 + 0.08 * sq + bump,
        1 - 0.11 * sq - bump,
        enter,
        <Packed uid="dkm" lid={lid} flash={flash} sweep={sweepOf(0)} inner={0.35 + 0.65 * innerKick} logoS={logoS} logoO={logoO} glow={glow} ring={ring} ringA={ringA} />,
      )}

      {/* where it runs: the same box everywhere */}
      {CHIPS.map((c, i) => {
        const p = iv(t, [114 + 4 * i, 126 + 4 * i], [0, 1], EASE_OUT);
        if (p <= 0) return null;
        const dot = 0.55 + 0.45 * Math.sin(g * 0.16 + i * 0.5);
        return (
          <div key={i} style={{ position: "absolute", left: c.x, top: RAIL + 46, width: 0, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${((1 - p) * 16).toFixed(1)}px)` }}>
            <div style={{ ...glass("34,211,238", 0.5), borderRadius: 999, padding: "10px 22px 10px 18px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, whiteSpace: "nowrap" }}>
              <div style={{ width: 13, height: 13, borderRadius: "50%", background: "#34D399", boxShadow: `0 0 ${(6 + 10 * dot).toFixed(1)}px rgba(52,211,153,${(0.5 + 0.4 * dot).toFixed(2)})` }} />
              <span style={{ fontFamily: fontInter, fontWeight: 700, fontSize: 28, color: "#F8FAFC", letterSpacing: "-0.01em" }}>{c.t}</span>
            </div>
          </div>
        );
      })}

      {/* the app's pieces */}
      {TILES.map((tl, i) => {
        const pin = iv(t, [tl.in, tl.in + 14], [0, 1], EASE_OUT);
        const over = t >= tl.in ? 1 + 0.1 * Math.sin(clamp01((t - tl.in) / 14) * Math.PI) : 0;
        const u = iv(t, [tl.go, tl.go + FLY], [0, 1], EASE_IN);
        if (pin <= 0 || u >= 1) return null;
        const hover = Math.sin(g * 0.11 + i * 2) * 6 * (1 - u);
        // quadratic path into the opening
        const qx = tl.x + (OPEN.x - tl.x) * 0.15;
        const qy = OPEN.y - 120;
        const x = (1 - u) * (1 - u) * tl.x + 2 * (1 - u) * u * qx + u * u * OPEN.x;
        const y = (1 - u) * (1 - u) * tl.y + 2 * (1 - u) * u * qy + u * u * OPEN.y + hover;
        const sc = pin * (u > 0 ? 1 - 0.85 * u : over);
        const rot = (tl.x < CX ? 1 : tl.x > CX ? -1 : 0) * 35 * u + Math.sin(g * 0.07 + i) * 3 * (1 - u);
        const o = pin * iv(u, [0.7, 1], [1, 0]);
        return (
          <div key={tl.kind} style={{ position: "absolute", left: x - TILE / 2, top: y - TILE / 2, width: TILE, height: TILE, opacity: o, transform: `rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)}, ${(sc * (1 + 0.25 * u)).toFixed(3)})`, filter: u > 0.05 ? `blur(${(u * 3).toFixed(2)}px)` : undefined }}>
            <Tile kind={tl.kind} glow={0.3 * u} />
          </div>
        );
      })}

      <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {sparks}
      </svg>
      <Shockwave age={slamA} x={OPEN.x - SZ.dx / 2} y={BOT0 - BH_ / 2} dur={26} maxR={520} r0={120} strength={0.9} />
      <AnamorphicFlare age={slamA} x={OPEN.x - SZ.dx / 2} y={BOT0 - BH_} dur={30} size={150} streakH={110} strength={0.8} />
      <AnamorphicFlare age={stA} x={CX - SZ.dx / 2} y={BOT0 - SZ.H + LOGO_AT.y} col={AMBER} dur={26} size={110} streakH={70} strength={0.65} />
    </div>
  );
};
