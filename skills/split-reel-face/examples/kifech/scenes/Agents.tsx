import type React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Cue } from "../edit/cue";
import { EASE, Spark, typed } from "../edit/kit";
import { K, MONO, SERIF, SERIF_UP, UI } from "../edit/theme";
import { wf } from "../edit/time";
import { at01, DuckPreview, lerp, PH, PW, TermPreview, TimelinePreview, VideoPreview, WavePreview } from "./Agents/previews";
import { PX_PER_UNIT, Spark3D } from "./Agents/Spark3D";

/**
 * AGENTS — 67.0–72.6 s, full-screen « mission control » (gfx mode: the face is a small circle top-right).
 * « ويفرّق الخدمة على des agents، يعني عندو équipe de montage كاملة، تخدم en parallèle »
 *
 * 67.2  ويفرّق      → Claude's 3D spark (the orchestrator) slams into the centre, orbit ring, header « 1 Claude »
 * 68.16 الخدمة      → the mission card (this very reel: 1:55 · 1080×1920 · 30 fps · 281 mots) + 8 task nodes on the orbit
 * 68.61 على         → the card is absorbed by the spark
 * 68.73 des agents  → the spark SPLITS: 8 agent windows fly out of it into a 3×3 hub grid (spark in the middle),
 *                     each with a live preview (the user's clips / mini UIs) and its own progress bar; « 8 agents »
 * 70.29 équipe…     → « 1 équipe de montage » + the crew: 8 Claude avatars; كاملة → « 8/8 »
 * 71.91 en parallèle→ every bar snaps to the same value and they race to 100 % together, glowing sync lines,
 *                     all ✓ on the same frame; 72.4 everything collapses back into the spark → split at 72.6.
 * Real data: this reel was built by 8 agents in parallel (one scene file each).
 */

// ---------------------------------------------------------------- timing (GLOBAL frames, on the words)
const T = {
  in: 2004,
  spark: wf("ويفرّق", 67.2), // 2016
  work: wf("الخدمة", 68.16), // 2045
  ala: wf("على", 68.61), // 2058
  des: wf("des", 68.73), // 2062
  agents: wf("agents", 68.92), // 2068
  equipe: wf("équipe", 70.29), // 2109
  kamla: wf("كاملة", 71.15), // 2135
  takhdem: wf("تخدم", 71.5), // 2145
  en: wf("en", 71.91), // 2157
};
const BURST = T.des + 1; // the spark splits
const DONE = T.en + 10; // every bar at 100 %, same frame
const COLLAPSE = DONE + 5; // 72.4 s
const OUT = 2192;

// ---------------------------------------------------------------- geometry (1080×1920)
const CX = 540;
const CY = 951;
const CW = 292;
const CH = 314;
const COLS = [84, 394, 704];
const ROWS = [462, 794, 1126];
const ORBIT = 270;

type Kind = "video" | "term" | "timeline" | "wave" | "duck";
type Agent = { id: string; label: string; file: string; r: number; c: number; o: number; kind: Kind; src?: string; trim?: number; log?: string[]; target: number };
// o = launch order (clockwise from top-left, like the spark spraying around itself)
const AGENTS: Agent[] = [
  { id: "hook", label: "hook", file: "Hook.tsx", r: 0, c: 0, o: 0, kind: "video", src: "thumbs/ig-1.mp4", trim: 120, log: ["ig-1…4.mp4", "punch-in 1.10", "spark 3D", "cues ×12"], target: 0.42 },
  { id: "e1", label: "étape 1", file: "Step1.tsx", r: 0, c: 1, o: 1, kind: "video", src: "thumbs/clip-trailer.mp4", trim: 0, log: ["phone feed", "4 tags", "lien copié", "♥ burst"], target: 0.31 },
  { id: "e2", label: "étape 2", file: "Step2.tsx", r: 0, c: 2, o: 2, kind: "term", target: 0.38 },
  { id: "e4", label: "étape 4", file: "Step4.tsx", r: 1, c: 2, o: 3, kind: "timeline", target: 0.46 },
  { id: "mus", label: "musique", file: "music.ts", r: 2, c: 2, o: 4, kind: "duck", target: 0.29 },
  { id: "son", label: "son", file: "Sound.tsx", r: 2, c: 1, o: 5, kind: "wave", target: 0.35 },
  { id: "e5", label: "étape 5", file: "Step5.tsx", r: 2, c: 0, o: 6, kind: "video", src: "thumbs/clip-ep1.mp4", trim: 0, log: ["60 fps", "9:16 ↔ 16:9", "GPU", "rendu"], target: 0.22 },
  { id: "e3", label: "étape 3", file: "Step3.tsx", r: 1, c: 0, o: 7, kind: "video", src: "thumbs/ig-4.mp4", trim: 1080, log: ["toolbox", "style ✓", "motions ✓", "cards ✓"], target: 0.27 },
];
const land = (a: Agent) => BURST + a.o * 2;
const cellC = (a: Agent) => ({ x: COLS[a.c] + CW / 2, y: ROWS[a.r] + CH / 2 });
const dirOf = (a: Agent) => {
  const c = cellC(a);
  const dx = c.x - CX;
  const dy = c.y - CY;
  const l = Math.hypot(dx, dy);
  return { ux: dx / l, uy: dy / l, len: l };
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const EASE_IN = (t: number) => Math.pow(clamp01(t), 2.4);
const raceAt = (frame: number) => interpolate(frame, [T.en, DONE], [0.5, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });

/** Progress of an agent: each at its own pace (monotonic, uneven), then all snap together and race at « en parallèle ». */
const progressAt = (a: Agent, frame: number) => {
  const start = land(a) + 8;
  if (frame < start) return 0;
  const q = clamp01((frame - start) / (T.en - start));
  const ph = random(`agent-${a.id}`) * Math.PI * 2;
  const qq = clamp01(q + (0.5 / (6 * Math.PI)) * (Math.sin(6 * Math.PI * q + ph) - Math.sin(ph)));
  const pre = 0.03 + (a.target - 0.03) * qq;
  const w = EASE((frame - T.en) / 4);
  return pre * (1 - w) + raceAt(frame) * w;
};

/** Window transform state: flight out of the spark, rest, collapse back in. */
const flightAt = (a: Agent, frame: number, fps: number) => {
  const sp = spring({ frame: frame - land(a), fps, config: { damping: 14, stiffness: 150, mass: 0.8 } });
  const cq = EASE_IN((frame - (COLLAPSE + a.o * 0.6)) / 8);
  const c = cellC(a);
  const d = dirOf(a);
  const sx = CX + d.ux * ORBIT - c.x;
  const sy = CY + d.uy * ORBIT - c.y;
  const t = sp;
  let tx = sx * (1 - t);
  let ty = sy * (1 - t);
  const tz = -520 * (1 - Math.min(1, t)) - 400 * cq;
  let s = 0.14 + 0.86 * t;
  tx = lerp(tx, CX - c.x, cq);
  ty = lerp(ty, CY - c.y, cq);
  s *= 1 - 0.86 * cq;
  const ry = (1 - t) * (d.ux > 0.2 ? -32 : d.ux < -0.2 ? 32 : 0) + cq * (d.ux > 0.2 ? 20 : d.ux < -0.2 ? -20 : 0);
  const rx = (1 - t) * (d.uy > 0.2 ? 26 : d.uy < -0.2 ? -26 : 0);
  const op = clamp01(sp * 2.6) * (1 - clamp01(cq * 1.3));
  const blur = (1 - Math.min(1, sp)) * 9 + cq * 9;
  return { tx, ty, tz, s, rx, ry, op, blur, sp, cq };
};

// ---------------------------------------------------------------- background: a depth tunnel converging on the spark
const Tunnel: React.FC<{ frame: number; v: number }> = ({ frame, v }) => {
  if (v <= 0.01) return null;
  const warp = 2.2 * EASE((frame - T.en) / 12) + 0.6 * EASE((frame - BURST) / 10);
  const phase = (frame * 0.035 + warp) % 1;
  const rows: React.ReactNode[] = [];
  for (let k = 0; k < 12; k++) {
    const z = k + 1 - phase; // 0..12, decreasing = coming at us
    if (z <= 0.15) continue;
    const a = clamp01(1 - z / 11) * clamp01(z * 1.5) * 0.32;
    const yF = CY + (1920 - CY) / z;
    const yC = CY - CY / z;
    rows.push(<line key={`f${k}`} x1={-200} x2={1280} y1={yF} y2={yF} stroke={K.coral} strokeOpacity={a} strokeWidth={1.4} />);
    rows.push(<line key={`c${k}`} x1={-200} x2={1280} y1={yC} y2={yC} stroke={K.coral} strokeOpacity={a * 0.7} strokeWidth={1.2} />);
  }
  const rays: React.ReactNode[] = [];
  for (let j = -9; j <= 9; j++) {
    rays.push(<line key={`rf${j}`} x1={CX} y1={CY} x2={CX + j * 170} y2={1920} stroke={K.coral} strokeOpacity={0.16} strokeWidth={1.2} />);
    rays.push(<line key={`rc${j}`} x1={CX} y1={CY} x2={CX + j * 170} y2={0} stroke={K.coral} strokeOpacity={0.1} strokeWidth={1.1} />);
  }
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: v }}>
      <defs>
        <radialGradient id="ag-tunnel-fade" cx={CX} cy={CY} r={1100} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.22" stopColor="#000" />
          <stop offset="0.5" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" />
        </radialGradient>
        <mask id="ag-tunnel-mask">
          <rect width={1080} height={1920} fill="url(#ag-tunnel-fade)" />
          {/* keep the face circle clean */}
          <circle cx={910} cy={310} r={124} fill="#000" />
        </mask>
      </defs>
      <g mask="url(#ag-tunnel-mask)">
        {rays}
        {rows}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------- header « 1 Claude » → « 8 agents » → « 1 équipe de montage » → « ×8 en parallèle »
const numEvents = (): { at: number; v: string; len: number }[] => {
  const ev = [{ at: T.spark, v: "1", len: 6 }];
  const order = [...AGENTS].sort((a, b) => a.o - b.o);
  order.forEach((a, i) => {
    if (i > 0) ev.push({ at: land(a) + 4, v: String(i + 1), len: 2 });
  });
  ev.push({ at: T.equipe, v: "1", len: 6 });
  ev.push({ at: T.en, v: "×8", len: 5 });
  return ev;
};
const NUMS = numEvents();
const WORDS: { at: number; w: string }[] = [
  { at: T.spark, w: "Claude" },
  { at: T.agents, w: "agents" },
  { at: T.equipe, w: "équipe de montage" },
  { at: T.en, w: "en parallèle" },
];

/** « ×8 »: the × is set smaller so the numeral keeps the width of one digit. */
const NumText: React.FC<{ v: string }> = ({ v }) =>
  v.startsWith("×") ? (
    <>
      <span style={{ fontSize: 84, verticalAlign: "0.12em", marginRight: 2 }}>×</span>
      {v.slice(1)}
    </>
  ) : (
    <>{v}</>
  );

const Header: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const vin = EASE((frame - T.spark) / 8);
  const vout = EASE((frame - COLLAPSE) / 7);
  if (vin <= 0) return null;
  let ni = 0;
  NUMS.forEach((e, i) => {
    if (frame >= e.at) ni = i;
  });
  const cur = NUMS[ni];
  const prev = ni > 0 ? NUMS[ni - 1] : null;
  const r = EASE((frame - cur.at) / cur.len);
  let wi = 0;
  WORDS.forEach((e, i) => {
    if (frame >= e.at) wi = i;
  });
  const wcur = WORDS[wi];
  const wprev = wi > 0 ? WORDS[wi - 1] : null;
  const wr = EASE((frame - wcur.at) / 7);
  const wq = EASE((frame - wcur.at) / 5);
  const kick = typed("MISSION CONTROL", frame, T.spark + 2, 45);
  const live = 0.5 + 0.5 * Math.sin(frame / 3.2);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 800, height: 460, opacity: vin * (1 - vout), transform: `translateY(${(1 - vin) * 14 - vout * 18}px)`, filter: vout > 0 ? `blur(${vout * 8}px)` : undefined }}>
      {/* kicker */}
      <div style={{ position: "absolute", left: 62, top: 212, display: "flex", alignItems: "center", gap: 12, fontFamily: MONO, fontWeight: 700, fontSize: 19, letterSpacing: "0.22em", color: K.coral }}>
        <div style={{ width: 10, height: 10, borderRadius: 5, background: K.coral, boxShadow: `0 0 ${6 + live * 10}px ${K.coral}`, opacity: 0.6 + 0.4 * live }} />
        <span>{kick}</span>
        <span style={{ color: K.dim, letterSpacing: "0.12em", opacity: at01(frame, T.spark + 10, T.spark + 16) }}>· claude code</span>
      </div>
      {/* numeral (odometer roll) */}
      <div style={{ position: "absolute", left: 50, top: 240, width: 160, height: 150, overflow: "hidden" }}>
        {prev && r < 1 ? (
          <div style={{ position: "absolute", inset: 0, textAlign: "center", fontFamily: SERIF_UP, fontSize: 150, lineHeight: "150px", color: K.cream, transform: `translateY(${-r * 90}px)`, opacity: 1 - r, filter: `blur(${r * 5}px)` }}>
            <NumText v={prev.v} />
          </div>
        ) : null}
        <div style={{ position: "absolute", inset: 0, textAlign: "center", fontFamily: SERIF_UP, fontSize: 150, lineHeight: "150px", color: K.cream, transform: `translateY(${(1 - r) * 90}px)`, opacity: r, filter: r < 1 ? `blur(${(1 - r) * 5}px)` : undefined }}>
          <NumText v={cur.v} />
        </div>
      </div>
      {/* keyword (serif italic coral) */}
      {wprev && wq < 1 ? (
        <div style={{ position: "absolute", left: 214, top: 278, fontFamily: SERIF, fontSize: 80, lineHeight: "96px", color: K.coral, whiteSpace: "nowrap", opacity: 1 - wq, transform: `translateY(${-wq * 16}px)`, filter: `blur(${wq * 6}px)` }}>{wprev.w}</div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 214,
          top: 278,
          fontFamily: SERIF,
          fontSize: 80,
          lineHeight: "96px",
          color: K.coral,
          whiteSpace: "nowrap",
          opacity: wr,
          transform: `translateY(${(1 - wr) * 14}px) scale(${0.96 + 0.04 * wr})`,
          transformOrigin: "0% 50%",
          filter: wr < 1 ? `blur(${(1 - wr) * 6}px)` : undefined,
          textShadow: `0 0 30px rgba(217,119,87,0.35)`,
        }}
      >
        {wcur.w}
      </div>
      <Crew frame={frame} fps={fps} />
    </div>
  );
};

/** The crew: 8 Claude avatars, each with a ring = that agent's progress. */
const Crew: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  if (frame < T.equipe) return null;
  const order = [...AGENTS].sort((a, b) => a.o - b.o);
  const chipPop = spring({ frame: frame - T.kamla, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
  const doneP = spring({ frame: frame - DONE, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
  return (
    <>
      {order.map((a, i) => {
        const pop = spring({ frame: frame - (T.equipe + 2 + i * 2), fps, config: { damping: 11, stiffness: 210, mass: 0.6 } });
        if (pop <= 0.001) return null;
        const bump = frame >= T.kamla ? Math.sin(clamp01((frame - (T.kamla + i * 1.5)) / 7) * Math.PI) : 0;
        const p = progressAt(a, frame);
        const R = 21;
        const C = 2 * Math.PI * R;
        const done = frame >= DONE;
        return (
          <div key={a.id} style={{ position: "absolute", left: 66 + i * 56, top: 398 - bump * 10, width: 46, height: 46, transform: `scale(${pop})`, opacity: clamp01(pop * 1.5) }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 23, background: "radial-gradient(circle at 35% 30%, rgba(255,236,220,0.16), rgba(36,26,21,0.92))", border: `1.5px solid ${K.stroke}`, boxShadow: "0 8px 18px rgba(0,0,0,0.5)" }} />
            <svg width={46} height={46} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <circle cx={23} cy={23} r={R} stroke={done ? K.ok : K.coral} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - p)} />
            </svg>
            <div style={{ position: "absolute", left: 11, top: 11 }}>
              <Spark size={24} rotate={frame * 2 + i * 15} />
            </div>
            {done ? (
              <div style={{ position: "absolute", right: -4, bottom: -4, width: 18, height: 18, borderRadius: 9, background: K.ok, color: "#0F0B09", fontFamily: UI, fontWeight: 900, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${doneP})` }}>✓</div>
            ) : null}
          </div>
        );
      })}
      {frame >= T.kamla ? (
        <div
          style={{
            position: "absolute",
            left: 66 + 8 * 56 + 6,
            top: 404,
            padding: "5px 14px",
            borderRadius: 999,
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 20,
            color: frame >= DONE ? "#0F0B09" : K.cream,
            background: frame >= DONE ? K.ok : "rgba(217,119,87,0.18)",
            border: `1.5px solid ${frame >= DONE ? K.ok : "rgba(217,119,87,0.6)"}`,
            transform: `scale(${frame >= DONE ? 0.9 + 0.1 * doneP : chipPop})`,
            transformOrigin: "0% 50%",
            whiteSpace: "nowrap",
          }}
        >
          {frame >= DONE ? "✓ 8/8 · 100 %" : "8/8"}
        </div>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------- the mission card (this very reel), absorbed by the spark
const Mission: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const pop = spring({ frame: frame - T.work, fps, config: { damping: 13, stiffness: 190, mass: 0.7 } });
  const ab = EASE_IN((frame - (T.ala - 2)) / 7);
  if (pop <= 0.001 || ab >= 1) return null;
  const cy0 = 450 + 100;
  const tx = lerp(0, 0, ab);
  const ty = lerp(0, CY - cy0, ab);
  const s = (0.94 + 0.06 * pop) * (1 - 0.92 * ab);
  return (
    <div
      style={{
        position: "absolute",
        left: 220,
        top: 450,
        width: 640,
        height: 200,
        transform: `translate(${tx}px, ${ty + (1 - pop) * 16}px) scale(${s})`,
        opacity: clamp01(pop * 1.6) * (1 - ab * 0.7),
        filter: ab > 0 ? `blur(${ab * 10}px)` : pop < 1 ? `blur(${(1 - Math.min(1, pop)) * 6}px)` : undefined,
        borderRadius: 26,
        background: "linear-gradient(150deg, rgba(255,236,220,0.10), rgba(255,236,220,0.02) 60%), rgba(30,21,17,0.92)",
        border: "1.5px solid rgba(217,119,87,0.55)",
        boxShadow: `0 24px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,236,220,0.22), 0 0 50px ${K.coralGlow}`,
        padding: "20px 28px",
        color: K.cream,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: MONO, fontSize: 17, color: K.dim }}>
        <span>mission.md</span>
        <div style={{ flex: 1 }} />
        <Spark size={20} />
        <span style={{ fontFamily: UI, fontWeight: 700, fontSize: 18, color: K.cream }}>Claude</span>
      </div>
      <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 38, marginTop: 10, letterSpacing: "-0.01em" }}>Monter ce reel</div>
      <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 19, color: K.muted, marginTop: 6 }}>1:55 · 1080×1920 · 30 fps · 281 mots</div>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 20, color: K.coral, marginTop: 10, opacity: at01(frame, T.work + 3, T.work + 6) }}>
        {typed("→ diviser en 8 tâches", frame, T.work + 3, 95)}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- hub: orbit, task nodes, spokes, beams, shockwaves
const Hub: React.FC<{ frame: number; sparkR: number }> = ({ frame, sparkR }) => {
  const orbitIn = EASE((frame - (T.spark + 4)) / 10) * (1 - EASE((frame - BURST) / 6));
  const spokesIn = EASE((frame - (BURST + 4)) / 8) * (1 - EASE((frame - COLLAPSE) / 6));
  const busy = frame >= T.takhdem ? 2 : 1;
  const flash = frame >= DONE ? interpolate(frame, [DONE, DONE + 2, DONE + 12], [0, 1, 0.2], { extrapolateRight: "clamp" }) : 0;
  const shock = (at: number, r0: number, r1: number, len: number, w: number) => {
    const t = (frame - at) / len;
    if (t < 0 || t > 1) return null;
    return <circle cx={CX} cy={CY} r={lerp(r0, r1, EASE(t))} fill="none" stroke={K.coralLight} strokeWidth={w * (1 - t)} opacity={(1 - t) * 0.9} />;
  };
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <filter id="ag-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* orbit ring (phase 1) */}
      {orbitIn > 0.01 ? (
        <circle cx={CX} cy={CY} r={ORBIT} fill="none" stroke={K.coral} strokeOpacity={0.75 * orbitIn} strokeWidth={2.6} strokeDasharray="5 11" strokeDashoffset={-frame * 1.5} />
      ) : null}
      {/* 8 task nodes on the orbit, aimed at their cells */}
      {AGENTS.map((a) => {
        const d = dirOf(a);
        const at = T.work + 5 + a.o;
        const p = EASE((frame - at) / 4) * (1 - EASE((frame - land(a)) / 4));
        if (p <= 0.01) return null;
        return <circle key={a.id} cx={CX + d.ux * ORBIT} cy={CY + d.uy * ORBIT} r={9 * p + 3 * Math.sin(frame / 2 + a.o) * p * 0.3} fill={K.coralLight} filter="url(#ag-glow)" opacity={p} />;
      })}
      {/* spokes from the spark to each agent, with data packets flowing out */}
      {spokesIn > 0.01
        ? AGENTS.map((a) => {
            const d = dirOf(a);
            const r0 = sparkR + 14;
            const r1 = d.len;
            const x0 = CX + d.ux * r0;
            const y0 = CY + d.uy * r0;
            const x1 = CX + d.ux * r1;
            const y1 = CY + d.uy * r1;
            const packets = [0, 0.5].map((off, k) => {
              const u = ((frame * 0.035 * busy + off + a.o * 0.13) % 1 + 1) % 1;
              const rr = lerp(r0, r1, u);
              return <circle key={k} cx={CX + d.ux * rr} cy={CY + d.uy * rr} r={4} fill={K.coralLight} opacity={spokesIn * (1 - u * 0.6)} filter="url(#ag-glow)" />;
            });
            return (
              <g key={a.id}>
                <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={K.coral} strokeOpacity={(0.45 + 0.55 * flash) * spokesIn} strokeWidth={2 + flash * 3} strokeDasharray="5 9" strokeDashoffset={-frame * 2 * busy} />
                {packets}
              </g>
            );
          })
        : null}
      {/* burst beams: the spark splits */}
      {AGENTS.map((a) => {
        const t = (frame - (BURST + a.o * 0.7)) / 10;
        if (t < 0 || t > 1) return null;
        const d = dirOf(a);
        const head = lerp(60, d.len + 160, EASE(t));
        const tail = lerp(40, d.len, EASE(Math.max(0, t - 0.15) / 0.85));
        return (
          <line
            key={`b${a.id}`}
            x1={CX + d.ux * tail}
            y1={CY + d.uy * tail}
            x2={CX + d.ux * head}
            y2={CY + d.uy * head}
            stroke={K.coralLight}
            strokeWidth={7 * (1 - t) + 1}
            strokeLinecap="round"
            opacity={1 - t}
            filter="url(#ag-glow)"
          />
        );
      })}
      {shock(T.spark, 80, 560, 16, 10)}
      {shock(BURST, 120, 640, 14, 12)}
      {shock(DONE, 110, 700, 16, 10)}
    </svg>
  );
};

// ---------------------------------------------------------------- one agent window
const AgentWindow: React.FC<{ a: Agent; frame: number; fps: number }> = ({ a, frame, fps }) => {
  const fl = flightAt(a, frame, fps);
  if (fl.op <= 0.005) return null;
  const L0 = land(a);
  const p = progressAt(a, frame);
  const done = frame >= DONE;
  const g = done ? interpolate(frame, [DONE, DONE + 2, DONE + 12], [0, 1, 0.3], { extrapolateRight: "clamp" }) : 0;
  const race = frame >= T.en ? 1 : 0;
  const tick = spring({ frame: frame - DONE, fps, config: { damping: 10, stiffness: 220, mass: 0.6 } });
  const pulse = 0.5 + 0.5 * Math.sin(frame / (frame >= T.takhdem ? 1.8 : 3.4) + a.o);
  const shine = interpolate(frame, [DONE, DONE + 9], [-200, 420], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: COLS[a.c],
        top: ROWS[a.r],
        width: CW,
        height: CH,
        transform: `translate3d(${fl.tx}px, ${fl.ty}px, ${fl.tz}px) rotateX(${fl.rx}deg) rotateY(${fl.ry}deg) scale(${fl.s})`,
        opacity: fl.op,
        filter: fl.blur > 0.2 ? `blur(${fl.blur}px)` : undefined,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 22,
          overflow: "hidden",
          background: "linear-gradient(150deg, rgba(255,236,220,0.085), rgba(255,236,220,0.02) 60%), rgba(30,21,17,0.9)",
          border: `1.5px solid ${g > 0.05 || race ? `rgba(217,119,87,${0.45 + 0.5 * g})` : K.stroke}`,
          boxShadow: `0 24px 50px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,236,220,0.2), 0 0 ${10 + 50 * g}px rgba(217,119,87,${0.15 + 0.6 * g})`,
          color: K.cream,
        }}
      >
        {/* title row */}
        <div style={{ position: "absolute", left: 14, right: 14, top: 12, height: 28, display: "flex", alignItems: "center", gap: 9 }}>
          <Spark size={22} rotate={frame * (race ? 6 : 1.6) + a.o * 20} />
          <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 21, whiteSpace: "nowrap" }}>
            <span style={{ color: K.muted, fontWeight: 600 }}>agent · </span>
            {a.label}
          </div>
          <div style={{ flex: 1 }} />
          {done ? (
            <div style={{ width: 24, height: 24, borderRadius: 12, background: K.ok, color: "#0F0B09", fontFamily: UI, fontWeight: 900, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${tick})`, boxShadow: `0 0 14px rgba(127,209,161,0.6)` }}>✓</div>
          ) : (
            <div style={{ width: 10, height: 10, borderRadius: 5, background: K.coral, boxShadow: `0 0 ${4 + pulse * 10}px ${K.coral}`, opacity: 0.55 + 0.45 * pulse }} />
          )}
        </div>
        {/* live preview */}
        <div style={{ position: "absolute", left: 12, top: 50, width: PW, height: PH, borderRadius: 14, overflow: "hidden", background: "#0B0807", border: `1px solid ${K.stroke}` }}>
          {a.kind === "video" ? <VideoPreview from={L0} src={a.src!} trim={a.trim ?? 0} log={a.log!} done={DONE} /> : null}
          {a.kind === "term" ? <TermPreview from={L0} done={DONE} /> : null}
          {a.kind === "timeline" ? <TimelinePreview from={L0} done={DONE} /> : null}
          {a.kind === "wave" ? <WavePreview from={L0} p={p} done={DONE} /> : null}
          {a.kind === "duck" ? <DuckPreview from={L0} done={DONE} /> : null}
        </div>
        {/* progress bar */}
        <div style={{ position: "absolute", left: 12, top: 250, width: PW, height: 10, borderRadius: 5, background: "rgba(255,236,220,0.1)", overflow: "hidden" }}>
          <div style={{ width: `${p * 100}%`, height: "100%", borderRadius: 5, background: `linear-gradient(90deg, ${K.coralDeep}, ${K.coral} 60%, ${K.coralLight})`, boxShadow: `0 0 12px ${K.coralGlow}` }} />
        </div>
        {/* footer: % + the real file this agent writes */}
        <div style={{ position: "absolute", left: 14, top: 270, display: "flex", alignItems: "baseline", gap: 12, whiteSpace: "nowrap" }}>
          <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 22, color: done ? K.ok : K.cream, minWidth: 64 }}>{Math.round(p * 100)} %</span>
          <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 15, color: K.dim }}>{a.file}</span>
        </div>
        {/* sync shine (same frame on every window) */}
        {done && shine < 420 ? (
          <div style={{ position: "absolute", top: -40, left: shine, width: 90, height: CH + 80, transform: "rotate(18deg)", background: "linear-gradient(90deg, transparent, rgba(255,236,220,0.22), transparent)" }} />
        ) : null}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- sync lines: the bar ends of every column, locked together
const SyncLines: React.FC<{ frame: number }> = ({ frame }) => {
  const v = EASE((frame - (T.en + 2)) / 3) * (1 - EASE((frame - (DONE + 1)) / 5));
  if (v <= 0.01) return null;
  const pr = raceAt(frame);
  const barY = (r: number) => ROWS[r] + 255;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <filter id="ag-sync" x="-200%" y="-10%" width="500%" height="120%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {COLS.map((cx, c) => {
        const x = cx + 12 + pr * PW;
        return (
          <g key={c} opacity={v} filter="url(#ag-sync)">
            <line x1={x} x2={x} y1={barY(0) - 30} y2={barY(2) + 30} stroke={K.coralLight} strokeWidth={2} strokeOpacity={0.55} />
            {[0, 1, 2].map((r) =>
              c === 1 && r === 1 ? null : (
                <g key={r}>
                  <line x1={x} x2={x} y1={barY(r) - 20} y2={barY(r) + 20} stroke="#FFE3D6" strokeWidth={4} />
                  <circle cx={x} cy={barY(r)} r={7} fill="#FFE3D6" />
                </g>
              ),
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------- the scene
export const Agents: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < T.in || frame > OUT) return null;

  const vIn = EASE((frame - (T.in + 8)) / 12);
  const vOut = EASE((frame - (COLLAPSE + 8)) / 8);

  // spark: slam in → absorb the card → split (shrinks into the hub) → pulses → absorbs the windows → gone
  const slam = spring({ frame: frame - T.spark, fps, config: { damping: 10, stiffness: 140, mass: 0.9 } });
  const absorb = Math.sin(clamp01((frame - (T.ala - 2)) / 8) * Math.PI) * 0.16;
  const shrink = EASE((frame - BURST) / 12);
  const pulseDone = frame >= DONE ? Math.sin(clamp01((frame - DONE) / 8) * Math.PI) * 0.14 : 0;
  const swallow = Math.sin(clamp01((frame - (COLLAPSE + 4)) / 8) * Math.PI) * 0.16;
  const gone = EASE_IN((frame - (COLLAPSE + 10)) / 7);
  const sBase = lerp(1.1, 0.55, shrink);
  const s = Math.max(0, slam * (sBase + absorb + pulseDone + swallow) * (1 - gone));
  const sparkR = s * PX_PER_UNIT;
  const spinRace = 3.2 * EASE((frame - T.en) / 12);
  const ry = interpolate(slam, [0, 1], [-Math.PI * 2, 0]) + Math.sin(frame / 18) * 0.5;
  const rx = 0.3 + Math.sin(frame / 22) * 0.12;
  const rz = frame * 0.02 + spinRace + 1.4 * EASE((frame - BURST) / 10);
  const heat = Math.max(0, Math.sin(clamp01((frame - BURST) / 10) * Math.PI)) * 0.8 + (frame >= DONE ? interpolate(frame, [DONE, DONE + 2, DONE + 14], [0, 1, 0.2], { extrapolateRight: "clamp" }) : 0) + (frame >= T.en && frame < DONE ? 0.35 : 0);
  const halo = clamp01(slam) * (1 - gone);

  // slow push on the whole board (never static)
  const push = 1 + 0.03 * clamp01((frame - BURST) / (COLLAPSE - BURST));
  const tilt = 9 * (1 - EASE((frame - BURST) / 22));

  // label under the spark
  const lab = EASE((frame - (T.spark + 8)) / 7) * (1 - EASE((frame - COLLAPSE) / 5));

  // flashes
  const flash = (at: number, len: number, peak: number) => (frame >= at && frame < at + len ? interpolate(frame, [at, at + 2, at + len], [0, peak, 0]) : 0);
  const f1 = flash(T.spark, 10, 0.55) + flash(BURST, 10, 0.6) + flash(DONE, 10, 0.35);

  // hand-off streak on the split seam (y 880) as the face panel comes back
  const seam = at01(frame, COLLAPSE + 8, COLLAPSE + 16);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ opacity: vIn * (1 - vOut) }}>
        {/* darken the world a touch so the board pops (the face circle stays on top visually: it is outside the dark zone) */}
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(70% 45% at ${CX}px ${CY}px, rgba(217,119,87,0.10), rgba(15,11,9,0) 60%)` }} />
        <Tunnel frame={frame} v={1} />
        <Header frame={frame} fps={fps} />
        <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: `${CX}px ${CY}px` }}>
          {/* halo */}
          <div
            style={{
              position: "absolute",
              left: CX - sparkR * 2.4,
              top: CY - sparkR * 2.4,
              width: sparkR * 4.8,
              height: sparkR * 4.8,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(240,164,135,${0.5 * halo}) 0%, rgba(217,119,87,${0.22 * halo}) 35%, rgba(217,119,87,0) 68%)`,
            }}
          />
          <Spark3D cx={CX} cy={CY} s={s} rx={rx} ry={ry} rz={rz} heat={heat} />
          {/* « orchestrator » */}
          <div
            style={{
              position: "absolute",
              left: CX - 150,
              width: 300,
              top: CY + sparkR + 10,
              textAlign: "center",
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: "0.2em",
              color: K.coral,
              opacity: lab,
            }}
          >
            {frame >= DONE ? <span style={{ color: K.ok }}>✓ 8 / 8</span> : "ORCHESTRATOR"}
          </div>
          <Hub frame={frame} sparkR={sparkR} />
          {/* the agent windows, flying out of the spark in depth */}
          <div style={{ position: "absolute", inset: 0, perspective: 1500, perspectiveOrigin: `${CX}px ${CY}px` }}>
            <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transformOrigin: `${CX}px ${CY}px`, transform: `rotateX(${tilt}deg)` }}>
              {AGENTS.map((a) => (
                <AgentWindow key={a.id} a={a} frame={frame} fps={fps} />
              ))}
            </div>
          </div>
          <SyncLines frame={frame} />
          <Mission frame={frame} fps={fps} />
        </div>
        {/* coral flash */}
        {f1 > 0.001 ? <div style={{ position: "absolute", inset: 0, background: `radial-gradient(60% 40% at ${CX}px ${CY}px, rgba(255,214,196,${f1}), rgba(217,119,87,${f1 * 0.35}) 45%, rgba(0,0,0,0) 75%)` }} /> : null}
      </AbsoluteFill>
      {seam > 0 && seam < 1 ? (
        <div
          style={{
            position: "absolute",
            top: 878,
            left: 540 - 560 * EASE(seam),
            width: 1120 * EASE(seam),
            height: 4,
            background: `linear-gradient(90deg, transparent, ${K.coralLight}, transparent)`,
            boxShadow: `0 0 24px ${K.coral}`,
            opacity: 1 - seam,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- sound
export const agentsCues: Cue[] = [
  { f: T.spark - 46, sfx: "riser", vol: 0.4, note: "agents · big riser into mission control" },
  { f: T.spark, sfx: "flash", vol: 0.45, note: "agents · orchestrator spark slams in" },
  { f: T.work, sfx: "pop", vol: 0.3, note: "agents · mission card" },
  { f: T.work + 5, sfx: "tick", vol: 0.18, note: "agents · task nodes" },
  { f: T.work + 7, sfx: "tick", vol: 0.18, note: "agents · task nodes" },
  { f: T.work + 9, sfx: "tick", vol: 0.18, note: "agents · task nodes" },
  { f: T.work + 11, sfx: "tick", vol: 0.18, note: "agents · task nodes" },
  { f: T.ala - 2, sfx: "swipe", vol: 0.3, note: "agents · card absorbed by Claude" },
  { f: BURST, sfx: "whip", vol: 0.45, note: "agents · the spark splits into 8 agents" },
  { f: BURST + 1, sfx: "shutter-modern", vol: 0.22, note: "agents · burst" },
  { f: BURST + 6, sfx: "pop", vol: 0.22, note: "agents · windows land" },
  { f: BURST + 10, sfx: "pop", vol: 0.2, note: "agents · windows land" },
  { f: BURST + 14, sfx: "pop", vol: 0.2, note: "agents · windows land" },
  { f: BURST + 18, sfx: "pop", vol: 0.2, note: "agents · windows land" },
  { f: T.equipe + 2, sfx: "tap", vol: 0.22, note: "agents · crew avatars" },
  { f: T.equipe + 8, sfx: "tick", vol: 0.15, note: "agents · crew avatars" },
  { f: T.equipe + 14, sfx: "tick", vol: 0.15, note: "agents · crew avatars" },
  { f: T.kamla, sfx: "pop", vol: 0.25, note: "agents · 8/8 chip" },
  { f: T.en, sfx: "keypad", vol: 0.22, note: "agents · race starts" },
  { f: T.en + 2, sfx: "tick", vol: 0.2, note: "agents · race" },
  { f: T.en + 4, sfx: "tick", vol: 0.2, note: "agents · race" },
  { f: T.en + 6, sfx: "tick", vol: 0.2, note: "agents · race" },
  { f: T.en + 8, sfx: "tick", vol: 0.22, note: "agents · race" },
  { f: DONE, sfx: "success", vol: 0.42, note: "agents · all 8 at 100 %", trimFrames: 36 },
  { f: COLLAPSE, sfx: "whoosh", vol: 0.38, note: "agents · collapse back into the spark" },
  { f: COLLAPSE + 6, sfx: "swipe", vol: 0.28, note: "agents · gfx → split" },
];
