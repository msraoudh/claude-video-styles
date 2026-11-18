import React from "react";
import { Logo } from "../kit/Logo";
import { fontInter, fontMono } from "../kit/fonts";
import { B, glass } from "../lib/look";
import { AMBER, AnamorphicFlare, clamp01, CYAN, decay, EASE_IN, EASE_IN_OUT, EASE_OUT, ICE, iv, rgba, Shockwave, type RGB } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/*
 * Concept « gitvsgithub » — « Git, c'est ton appareil photo : il enregistre les versions de ton code, sur ta machine.
 * GitHub, c'est l'Instagram du code : tu y publies ces versions en ligne. » (ep. 8, heading « Git ≠ GitHub »)
 *   0–14   the real Git logo (left) and GitHub logo (right) fly in; an « = » draws between them and an amber slash slams
 *          through it on 14 → « ≠ » (flash, shockwave, both logos are pushed apart). The ≠ stays between the two worlds.
 *   TA     « appareil »: the Git logo flies onto the corner of a glass instant camera that builds around it; a laptop
 *          rises under it with app.js on screen; viewfinder brackets lock onto the code. GitHub waits, dimmed, on the right.
 *   TV     « versions »: 3 shots, k = 12…20 frames apart. Each: a new code line, shutter press, flash + light cone on the
 *          screen, a polaroid pops out of the camera's top slot, swoops down and lands on the local stack while it
 *          develops — v1, v2, v3 — then the « sur ta machine » tag.
 *   TI     « Instagram »: the GitHub logo flies into the avatar of an Instagram-like profile card (story ring, counters,
 *          « mon-projet », grid tab, 6 tiles) + the « en ligne » tag.
 *   TP     « publies »: an amber « publier » pill; glowing copies peel off the 3 polaroids (the local ones stay), arc over
 *          the ≠ and land in the grid as posts (pop, amber heart, « 0 → 3 versions »).
 *   idle   camera breathes, caret blinks, likes keep coming, the story ring turns, light sweeps the card and the stack.
 * Phase words (item `beats`): ["appareil", "versions", "instagram", "publies"] (4), or the last three (3); anything
 * else → 18 / 36 / 66 / 80 % of the item. Gaps are clamped so every phase has room.
 * Ep. 8 (f0 ≈ 191): TA +106, TV +210, TI +396, TP +479 — gitvsgithub.sfx.json is timed on those.
 * Drawn in a 760 design space.
 */

type P2 = [number, number];
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const flyE = (u: number) => 0.55 * EASE_OUT(clamp01(u)) + 0.45 * EASE_IN_OUT(clamp01(u));
const qb = (a: P2, c: P2, b: P2, t: number): P2 => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
};
const backOut = (d: number) => (d >= 1 ? 1 : d <= 0 ? 0 : 1 + 2.2 * Math.pow(d - 1, 3) + 1.2 * Math.pow(d - 1, 2));
const popS = (age: number, n = 10) => (age <= 0 ? 0 : backOut(clamp01(age / n)));

// ── layout (760 design box) ──
const CAM = { x: 66, y: 150, w: 216, h: 138 }; // instant camera body, sits on the laptop lid
const LENS: P2 = [84, 76]; // camera-local
const FLASHW = { x: 146, y: 18, w: 52, h: 28 }; // camera-local
const BADGE: P2 = [172, 98]; // camera-local centre of the Git badge
const BADGE_S = 58;
const SLIT_X = CAM.x + 85;
const LID = { x: 30, y: 296, w: 288, h: 180 };
const STACK_Y = 590;
const SLOT = [
  { x: 90, r: -9 },
  { x: 174, r: 1.5 },
  { x: 258, r: 9 },
];
const POL = { w: 112, h: 134 };
const NEQ: P2 = [380, 406];
const GIT0: P2 = [196, 400];
const GH0: P2 = [564, 400];
const GH_IDLE: P2 = [582, 410];
const CARD = { x: 424, y: 182, w: 316, h: 452 };
const AVA_L: P2 = [64, 70]; // card-local avatar centre
const AVA: P2 = [CARD.x + AVA_L[0], CARD.y + AVA_L[1]];
const TILE = 96;
const TGAP = 6;
const GX0 = 8;
const GY0 = 244;
const tileL = (i: number): P2 => [GX0 + (i % 3) * (TILE + TGAP), GY0 + Math.floor(i / 3) * (TILE + TGAP)];
const tileC = (i: number): P2 => [CARD.x + tileL(i)[0] + TILE / 2, CARD.y + tileL(i)[1] + TILE / 2];
const TILE_R = [-4, 3, -2];
const POST_S = 0.68;
const TAG_Y = 698;
const PILL: P2 = [380, 104];
const CODE_W = [150, 196, 124, 172, 138];
const CODE_IND = [0, 26, 26, 52, 0];
const FLY = 22;
const HEART = "M12 21.2 C12 21.2 2.6 14.9 2.6 8.7 C2.6 5.5 5.1 3 8.2 3 C9.9 3 11.3 3.9 12 5.2 C12.7 3.9 14.1 3 15.8 3 C18.9 3 21.4 5.5 21.4 8.7 C21.4 14.9 12 21.2 12 21.2 Z";

const Star: React.FC<{ x: number; y: number; s: number; o: number }> = ({ x, y, s, o }) =>
  o > 0.01 ? (
    <svg width={60} height={60} viewBox="-30 -30 60 60" style={{ position: "absolute", left: x - 30, top: y - 30, transform: `scale(${s.toFixed(3)})`, opacity: o, overflow: "visible", filter: "drop-shadow(0 0 8px rgba(190,240,255,0.95))" }}>
      <path d="M0 -28 C3 -6 6 -3 28 0 C6 3 3 6 0 28 C-3 6 -6 3 -28 0 C-6 -3 -3 -6 0 -28Z" fill="#FFFFFF" />
    </svg>
  ) : null;

/** a version polaroid: white frame, a dark photo of the code (v = 0-based → 3 + v lines), the label in the margin */
const Polaroid: React.FC<{ v: number; dev: number; label: number; hot?: number; sheen?: number }> = ({ v, dev, label, hot = 0, sheen = -1 }) => (
  <div
    style={{
      position: "relative",
      width: POL.w,
      height: POL.h,
      borderRadius: 7,
      background: "linear-gradient(165deg, #FFFFFF 0%, #EEF3F8 62%, #D9E3EE 100%)",
      boxShadow: [`0 12px 26px rgba(0,0,0,0.55)`, `0 0 ${(8 + 34 * hot).toFixed(1)}px ${rgba(CYAN, 0.22 + 0.6 * hot)}`, "inset 0 -2px 0 rgba(0,0,0,0.08)"].join(", "),
      overflow: "hidden",
    }}
  >
    <div style={{ position: "absolute", left: 8, top: 8, width: 96, height: 90, borderRadius: 3, overflow: "hidden", background: "linear-gradient(160deg, #15306A 0%, #0A1838 60%, #060E24 100%)" }}>
      <div style={{ position: "absolute", left: 8, top: 7, width: 30, height: 6, borderRadius: 3, background: rgba(CYAN, 0.65) }} />
      {CODE_W.slice(0, 3 + v).map((w, j) => {
        const nw = j === 2 + v;
        return (
          <div
            key={j}
            style={{
              position: "absolute",
              left: 8 + CODE_IND[j] * 0.36,
              top: 21 + j * 13,
              width: (w - CODE_IND[j]) * 0.36,
              height: 6,
              borderRadius: 3,
              background: nw ? "#67E8F9" : "rgba(226,236,250,0.45)",
              boxShadow: nw ? "0 0 8px rgba(34,211,238,0.85)" : undefined,
            }}
          />
        );
      })}
      {/* developing: milky at first, the picture comes up */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #F6F3EC, #DEE6EE)", opacity: 1 - dev }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 42%)" }} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 3, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontInter, fontWeight: 800, fontSize: 25, letterSpacing: "-0.01em", color: "#0C1A34", opacity: label }}>v{v + 1}</div>
    {sheen >= 0 && sheen <= 1 ? (
      <div style={{ position: "absolute", top: -40, bottom: -40, width: 40, left: -60 + sheen * (POL.w + 120), transform: "skewX(-20deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.7), rgba(255,255,255,0))" }} />
    ) : null}
  </div>
);

/** small glass tag pill (« sur ta machine » / « en ligne ») */
const Tag: React.FC<{ x: number; y: number; age: number; text: string; icon: React.ReactNode; accent?: RGB; t: number }> = ({ x, y, age, text, icon, accent = CYAN, t }) => {
  if (age <= 0) return null;
  const s = popS(age, 10);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: clamp01(age / 4) }}>
      <div
        style={{
          flexShrink: 0,
          height: 46,
          padding: "0 20px 0 14px",
          borderRadius: 23,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: `linear-gradient(140deg, ${rgba(accent, 0.2)}, ${rgba(accent, 0.06)})`,
          border: `1.5px solid ${rgba(accent, 0.6 + 0.3 * decay(age, 10))}`,
          boxShadow: `0 0 ${(16 + 26 * decay(age, 10)).toFixed(1)}px ${rgba(accent, 0.3)}, 0 8px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.18)`,
          transform: `scale(${s.toFixed(4)}) translateY(${(Math.sin(t * 0.06 + x) * 2).toFixed(2)}px)`,
          whiteSpace: "nowrap",
        }}
      >
        {icon}
        <span style={{ fontFamily: fontInter, fontWeight: 700, fontSize: 23, color: "#E6FBFF", letterSpacing: "0.01em" }}>{text}</span>
      </div>
    </div>
  );
};

export const GitVsGitHubFx: ToolFx = ({ g, f0, f1, beats, size }) => {
  const t = g - f0;
  const dur = Math.max(160, f1 - f0);

  // ── phases ──
  const bt = beats
    .map((b) => b - f0)
    .filter((b) => b > 0 && b < dur)
    .sort((a, b) => a - b);
  let TA: number;
  let TV: number;
  let TI: number;
  let TP: number;
  if (bt.length === 4) {
    TA = bt[0];
    TV = bt[1];
    TI = bt[2];
    TP = bt[3];
  } else if (bt.length === 3) {
    TV = bt[0];
    TI = bt[1];
    TP = bt[2];
    TA = TV - 36;
  } else {
    TA = dur * 0.18;
    TV = dur * 0.36;
    TI = dur * 0.66;
    TP = dur * 0.8;
  }
  TA = Math.max(30, TA);
  TV = Math.max(TA + 34, TV);
  const k = Math.round(Math.min(20, Math.max(12, (TI - TV - 40) / 2)));
  TI = Math.max(TV + 2 * k + 30, TI);
  TP = Math.max(TI + 28, TP);
  const S = [TV, TV + k, TV + 2 * k];
  const TAG_L = S[2] + 40;
  const L = [0, 1, 2].map((i) => TP + 4 + 6 * i);
  const LAND_C = L.map((l) => l + FLY);

  // ── intro: logos + ≠ ──
  const push = 22 * decay(t - 14, 7);
  const flyGit = (1 - iv(t, [0, 14], [0, 1], EASE_OUT)) * 90;
  const flyGh = (1 - iv(t, [3, 17], [0, 1], EASE_OUT)) * 90;
  const introBob = Math.sin(t * 0.06) * 4;
  const neqS = lerp(1, 0.6, iv(t, [TA, TA + 20], [0, 1], EASE_IN_OUT));
  const barP = iv(t, [2, 10], [0, 1], EASE_OUT);
  const slashP = iv(t, [8, 14], [0, 1], EASE_IN);
  const slashS = t < 14 ? lerp(2.8, 1, slashP) : 1 - 0.12 * decay(t - 14, 4);
  const neqA = t - 14;
  const neqGlow = t > 30 ? 0.5 + 0.5 * Math.sin(t * 0.07) : 0;

  // ── camera ──
  const toBadge = iv(t, [TA, TA + 22], [0, 1], EASE_IN_OUT);
  const camA = iv(t, [TA + 6, TA + 20], [0, 1]);
  const camS = 0.55 + 0.45 * backOut(camA);
  const idleCam = clamp01((t - TA - 24) / 20);
  const camBob = Math.sin(t * 0.07) * 3 * idleCam;
  const lastShot = S.reduce((m, s) => (t >= s ? Math.min(m, t - s) : m), 999);
  const flash = decay(lastShot, 5);
  const press = decay(lastShot, 3.5);
  const badgeLand = t - (TA + 22);
  const lapA = iv(t, [TA + 10, TA + 26], [0, 1], EASE_OUT);
  const brA = iv(t, [TA + 28, TA + 38], [0, 1], EASE_OUT);
  const LG = [TA + 18, TA + 22, S[0] - 12, S[1] - 12, S[2] - 12];
  const grown = LG.map((l) => iv(t, [l, l + 8], [0, 1], EASE_OUT));
  const nLines = grown.filter((x) => x > 0).length;

  // git logo flight (intro place → badge on the camera)
  const badgeStage: P2 = [CAM.x + BADGE[0], CAM.y + BADGE[1] + camBob];
  const gitX = lerp(GIT0[0] - flyGit - push, badgeStage[0], toBadge);
  const gitY = lerp(GIT0[1] + introBob, badgeStage[1], toBadge) - Math.sin(toBadge * Math.PI) * 46;
  const gitSize = lerp(150, BADGE_S, toBadge);
  const gitLabelO = iv(t, [8, 18], [0, 1]) * (1 - iv(t, [TA, TA + 8], [0, 1]));

  // ── GitHub logo (intro → waiting → avatar) ──
  const toIdle = iv(t, [TA, TA + 20], [0, 1], EASE_IN_OUT);
  const toAva = iv(t, [TI, TI + 18], [0, 1], EASE_IN_OUT);
  const ghX = lerp(lerp(GH0[0] + flyGh + push, GH_IDLE[0], toIdle), AVA[0], toAva);
  const ghY = lerp(lerp(GH0[1] + Math.sin(t * 0.06 + 1.4) * 4, GH_IDLE[1] + Math.sin(t * 0.05 + 1) * 5, toIdle), AVA[1], toAva) - Math.sin(toAva * Math.PI) * 50;
  const ghSize = lerp(lerp(150, 116, toIdle), 66, toAva);
  const ghO = (1 - 0.45 * toIdle * (1 - toAva)) * (1 - iv(t, [TI + 14, TI + 20], [0, 1]));
  const ghLabelO = iv(t, [10, 20], [0, 1]) * (1 - 0.45 * toIdle) * (1 - iv(t, [TI, TI + 8], [0, 1]));

  // ── profile card ──
  const cardA = iv(t, [TI + 4, TI + 22], [0, 1]);
  const cardS = 0.55 + 0.45 * backOut(cardA);
  const ringP = iv(t, [TI + 14, TI + 32], [0, 1], EASE_OUT);
  const avaO = iv(t, [TI + 14, TI + 20], [0, 1]);
  const landedN = LAND_C.filter((l) => t >= l).length;
  const lastLand = LAND_C.reduce((m, l) => (t >= l ? Math.min(m, t - l) : m), 999);
  const heartsAt: Array<{ at: number; post: number }> = LAND_C.map((l, i) => ({ at: l, post: i }));
  const H0 = LAND_C[2] + 30;
  if (t >= H0) {
    const n = Math.floor((t - H0) / 32);
    for (let m = 0; m <= n; m++) heartsAt.push({ at: H0 + m * 32, post: [1, 2, 0][m % 3] });
  }
  const likes = 12 * landedN + 3 * Math.max(0, heartsAt.filter((h) => t >= h.at).length - landedN);
  const lastHeart = heartsAt.reduce((m, h) => (t >= h.at ? Math.min(m, t - h.at) : m), 999);
  const cardSheenAt = t < LAND_C[2] + 60 ? LAND_C[2] : LAND_C[2] + 60 + Math.floor((t - LAND_C[2] - 60) / 130) * 130;
  const cardSheen = t >= cardSheenAt ? (t - cardSheenAt) / 24 : -1;
  const pillA = t - TP;
  const upO = iv(t, [TP, TP + 8], [0, 1]) * lerp(0.6, 0.13, iv(t, [LAND_C[2] + 10, LAND_C[2] + 40], [0, 1]));

  // stack sheen (idle)
  const stSheenT = t - TAG_L - 30;
  const stSheen = (i: number) => {
    if (stSheenT < 0) return -1;
    const u = (stSheenT % 120) - i * 5;
    return u >= 0 && u <= 22 ? u / 22 : -1;
  };

  const k760 = size / 760;
  const camT = `translateY(${(camBob + 3 * press).toFixed(2)}px) scale(${(camS * (1 + 0.025 * flash)).toFixed(4)}, ${(camS * (1 - 0.035 * press)).toFixed(4)})`;
  const slitY = CAM.y - 9 + camBob;

  /* ── polaroids out of the camera (rise in the slit, swoop down to the stack) ── */
  const rising: React.ReactNode[] = [];
  const flying: React.ReactNode[] = [];
  const stack: React.ReactNode[] = [];
  S.forEach((s, i) => {
    const a = t - s;
    if (a < 2) return;
    const dev = iv(a, [6, 42], [0, 1]);
    const lab = iv(a, [30, 38], [0, 1]);
    if (a < 13) {
      const y = lerp(slitY + POL.h / 2 + 4, slitY - POL.h * 0.36, EASE_OUT(clamp01((a - 2) / 9)));
      rising.push(
        <div key={`r${i}`} style={{ position: "absolute", left: SLIT_X - POL.w / 2, top: y - POL.h / 2, transform: `rotate(${(Math.sin(a * 0.9) * 2).toFixed(2)}deg)` }}>
          <Polaroid v={i} dev={dev} label={0} hot={0.4} />
        </div>,
      );
      return;
    }
    if (a < 33) {
      const p = (a - 13) / 20;
      const start: P2 = [SLIT_X, slitY - POL.h * 0.36];
      const ctrl: P2 = [Math.max(40, SLOT[i].x - 110), 200];
      const end: P2 = [SLOT[i].x, STACK_Y];
      const at = (u: number) => qb(start, ctrl, end, flyE(u));
      [0.2, 0.1, 0].forEach((d, j) => {
        const uu = p - d;
        if (uu <= 0) return;
        const [x, y] = at(uu);
        const e = EASE_IN_OUT(clamp01(uu));
        const rot = lerp(0, SLOT[i].r, e) - Math.sin(clamp01(uu) * Math.PI) * 22;
        const sc = 1 + 0.1 * Math.sin(clamp01(uu) * Math.PI);
        flying.push(
          <div key={`f${i}-${j}`} style={{ position: "absolute", left: x - POL.w / 2, top: y - POL.h / 2, transform: `rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`, opacity: d === 0 ? 1 : 0.22 - d, filter: d === 0 ? undefined : `blur(${(d * 40).toFixed(1)}px)` }}>
            <Polaroid v={i} dev={dev} label={lab} hot={0.5} />
          </div>,
        );
      });
      return;
    }
    const la = a - 33;
    const sq = la < 14 ? Math.sin(clamp01(la / 14) * Math.PI * 2) * Math.exp(-la / 5) : 0;
    const launch = t - L[i];
    const hot = Math.max(0.9 * decay(la, 10), launch >= 0 ? 0.9 * decay(launch, 9) : 0);
    stack.push(
      <div key={`s${i}`} style={{ position: "absolute", left: SLOT[i].x - POL.w / 2, top: STACK_Y - POL.h / 2, transform: `rotate(${SLOT[i].r}deg) scale(${(1 + 0.07 * sq).toFixed(4)}, ${(1 - 0.09 * sq).toFixed(4)})`, transformOrigin: "50% 90%" }}>
        <Polaroid v={i} dev={dev} label={lab} hot={hot} sheen={stSheen(i)} />
        {la < 16 ? <div style={{ position: "absolute", inset: -4 - la * 1.8, borderRadius: 10 + la * 1.8, border: `2.5px solid ${rgba(ICE, 0.85 * (1 - la / 16))}` }} /> : null}
        {launch >= 0 && launch < 16 ? <div style={{ position: "absolute", inset: -4 - launch * 1.8, borderRadius: 10 + launch * 1.8, border: `2.5px solid ${rgba(CYAN, 0.85 * (1 - launch / 16))}` }} /> : null}
      </div>,
    );
  });

  /* ── copies flying up into the GitHub grid ── */
  const copies: React.ReactNode[] = [];
  const upPaths: Array<[P2, P2, P2]> = [0, 1, 2].map((i) => [[SLOT[i].x, STACK_Y - 20], [330 + 22 * i, -150], tileC(i)]);
  [0, 1, 2].forEach((i) => {
    const p = (t - L[i]) / FLY;
    if (p <= 0 || p >= 1) return;
    const [a, c, b] = upPaths[i];
    [0.16, 0.08, 0].forEach((d, j) => {
      const uu = p - d;
      if (uu <= 0) return;
      const e = flyE(uu);
      const [x, y] = qb(a, c, b, e);
      const sc = lerp(1, POST_S, e) * (1 + 0.12 * Math.sin(clamp01(uu) * Math.PI));
      const rot = lerp(SLOT[i].r, TILE_R[i], e) + Math.sin(clamp01(uu) * Math.PI) * 14;
      copies.push(
        <div key={`c${i}-${j}`} style={{ position: "absolute", left: x - POL.w / 2, top: y - POL.h / 2, transform: `rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`, opacity: d === 0 ? iv(p, [0, 0.1], [0.4, 1]) : 0.24 - d, filter: d === 0 ? `drop-shadow(0 0 18px ${rgba(CYAN, 0.9)})` : `blur(${(d * 40).toFixed(1)}px)` }}>
          <Polaroid v={i} dev={1} label={1} hot={1} />
        </div>,
      );
    });
  });

  /* ── hearts ── */
  const hearts = heartsAt.map((h, n) => {
    const a = t - h.at;
    if (a < 0 || a > 40) return null;
    const [cx, cy] = tileC(h.post);
    const e = EASE_OUT(clamp01(a / 40));
    const x = cx + 26 + Math.sin(a * 0.18 + n) * 6;
    const y = cy - 30 - 64 * e;
    const s = popS(a, 8) * (1 - 0.3 * e);
    return (
      <svg key={`h${n}`} width={40} height={40} viewBox="0 0 24 24" style={{ position: "absolute", left: x - 20, top: y - 20, transform: `scale(${s.toFixed(3)})`, opacity: iv(a, [0, 3, 26, 40], [0, 1, 1, 0]), overflow: "visible", filter: "drop-shadow(0 0 8px rgba(245,158,11,0.85))" }}>
        <path d={HEART} fill="#FBBF24" stroke="#FFE7B8" strokeWidth={1.2} />
      </svg>
    );
  });

  /* ── code lines on the laptop (local to the lid) ── */
  const lineEls = CODE_W.map((w, j) => {
    const gp = grown[j];
    if (gp <= 0) return null;
    const newest = j >= 2 && j === nLines - 1;
    const hot = j >= 2 ? decay(t - LG[j], 18) : 0;
    return (
      <div
        key={j}
        style={{
          position: "absolute",
          left: 28 + CODE_IND[j],
          top: 64 + j * 22,
          width: (w - CODE_IND[j]) * gp,
          height: 10,
          borderRadius: 5,
          background: newest ? `linear-gradient(90deg, ${rgba(ICE, 0.7 + 0.3 * hot)}, ${rgba(CYAN, 0.85)})` : j >= 2 ? rgba(CYAN, 0.5) : "rgba(226,236,250,0.32)",
          boxShadow: newest ? `0 0 ${(8 + 14 * hot).toFixed(1)}px ${rgba(CYAN, 0.6)}` : undefined,
        }}
      />
    );
  });
  const lastJ = nLines - 1;
  const caretOn = nLines > 0 && Math.floor(g / 16) % 2 === 0;
  const brS = 1 - 0.045 * flash + 0.012 * Math.sin(t * 0.1);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: k760 !== 1 ? `scale(${k760.toFixed(4)})` : undefined, transformOrigin: "0 0" }}>
      {/* back lights */}
      <div style={{ position: "absolute", left: -40, top: 90, width: 470, height: 600, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, 0.12 + 0.16 * flash)}, rgba(0,0,0,0))`, filter: "blur(18px)" }} />
      <div style={{ position: "absolute", left: 340, top: 90, width: 460, height: 600, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(CYAN, 0.08 + 0.1 * cardA + 0.16 * decay(lastLand, 16))}, rgba(0,0,0,0))`, filter: "blur(18px)" }} />

      {/* divider between the two worlds */}
      <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, opacity: iv(t, [TA + 10, TA + 30], [0, 1]) }}>
        <defs>
          <linearGradient id="gvgDiv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(148,190,255,0)" />
            <stop offset="0.5" stopColor="rgba(148,190,255,0.28)" />
            <stop offset="1" stopColor="rgba(148,190,255,0)" />
          </linearGradient>
        </defs>
        <rect x={379} y={150} width={2} height={NEQ[1] - 60 - 150} fill="url(#gvgDiv)" />
        <rect x={379} y={NEQ[1] + 60} width={2} height={730 - NEQ[1] - 60} fill="url(#gvgDiv)" />
      </svg>

      {/* ── laptop ── */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, opacity: lapA, transform: `translateY(${((1 - lapA) * 40).toFixed(1)}px)` }}>
        <div style={{ position: "absolute", left: LID.x, top: LID.y, width: LID.w, height: LID.h, ...glass("34,211,238", 0.8 + 0.7 * flash), borderRadius: 18, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 10, borderRadius: 10, background: "rgba(5,10,24,0.84)" }} />
          <div style={{ position: "absolute", left: 24, top: 15, display: "flex", alignItems: "center", gap: 10 }}>
            <svg width={20} height={25} viewBox="0 0 24 30">
              <path d="M2 2 H15 L22 9 V28 H2 Z" fill="none" stroke={B.cyan} strokeWidth={2.6} strokeLinejoin="round" />
              <path d="M15 2 V9 H22" fill="none" stroke={B.cyan} strokeWidth={2.6} strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 20, color: B.white }}>app.js</span>
          </div>
          <div style={{ position: "absolute", left: 10, right: 10, top: 48, height: 1, background: "rgba(255,255,255,0.09)" }} />
          {lineEls}
          {caretOn && lastJ >= 0 ? <div style={{ position: "absolute", left: 28 + CODE_IND[lastJ] + (CODE_W[lastJ] - CODE_IND[lastJ]) * grown[lastJ] + 5, top: 61 + lastJ * 22, width: 3, height: 16, background: "#A5F3FC", boxShadow: "0 0 8px #22D3EE" }} /> : null}
          {/* viewfinder brackets */}
          {brA > 0.01 ? (
            <svg width={LID.w} height={LID.h} style={{ position: "absolute", left: 0, top: 0, opacity: brA, transform: `scale(${(brS * (1 + 0.15 * (1 - brA))).toFixed(4)})`, transformOrigin: "144px 110px", overflow: "visible" }}>
              {[
                [16, 56, 1, 1],
                [272, 56, -1, 1],
                [16, 168, 1, -1],
                [272, 168, -1, -1],
              ].map(([x, y, sx, sy], j) => (
                <path key={j} d={`M${x} ${y + 20 * sy} L${x} ${y} L${x + 20 * sx} ${y}`} fill="none" stroke={flash > 0.05 ? "#FFFFFF" : "#A5F3FC"} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 ${(4 + 8 * flash).toFixed(1)}px rgba(34,211,238,0.9))` }} />
              ))}
            </svg>
          ) : null}
          {/* shot: white flash + glint */}
          {flash > 0.01 ? <div style={{ position: "absolute", inset: 0, background: "rgb(232,250,255)", opacity: 0.7 * flash }} /> : null}
          {lastShot < 16 ? <div style={{ position: "absolute", top: -60, bottom: -60, width: 80, left: -110 + (lastShot / 16) * (LID.w + 200), transform: "skewX(-20deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.5), rgba(255,255,255,0))" }} /> : null}
        </div>
        {/* base */}
        <div style={{ position: "absolute", left: LID.x - 22, top: LID.y + LID.h + 2, width: LID.w + 44, height: 16, borderRadius: "4px 4px 14px 14px", background: "linear-gradient(180deg, rgba(226,236,250,0.34), rgba(148,190,255,0.12))", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 14px 30px rgba(0,0,0,0.5)" }} />
        <div style={{ position: "absolute", left: LID.x + LID.w / 2 - 34, top: LID.y + LID.h + 2, width: 68, height: 6, borderRadius: "0 0 6px 6px", background: "rgba(5,10,24,0.6)" }} />
      </div>

      {/* light cone of the shot (camera → screen) */}
      {flash > 0.01 ? (
        <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, opacity: flash, mixBlendMode: "screen" }}>
          <defs>
            <linearGradient id="gvgCone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(240,252,255,0.75)" />
              <stop offset="0.6" stopColor="rgba(103,232,249,0.22)" />
              <stop offset="1" stopColor="rgba(103,232,249,0)" />
            </linearGradient>
          </defs>
          <path d={`M${CAM.x + LENS[0] - 30} ${CAM.y + CAM.h - 6} L${CAM.x + LENS[0] + 30} ${CAM.y + CAM.h - 6} L${LID.x + 272} ${LID.y + 168} L${LID.x + 16} ${LID.y + 168} Z`} fill="url(#gvgCone)" />
        </svg>
      ) : null}

      {/* local stack of versions */}
      {stack}

      {/* polaroids rising out of the top slot (clipped at the slit) */}
      {rising.length ? <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: Math.max(0, slitY), overflow: "hidden" }}>{rising}</div> : null}

      {/* ── the camera ── */}
      {camA > 0 ? (
        <div style={{ position: "absolute", left: CAM.x, top: CAM.y, width: CAM.w, height: CAM.h, opacity: clamp01(camA * 2.5), transform: camT, transformOrigin: "50% 100%" }}>
          {/* top ridge with the eject slit + shutter button */}
          <div style={{ position: "absolute", left: 28, top: -17, width: 114, height: 24, borderRadius: 10, background: "linear-gradient(180deg, #2A4374, #142A55)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)" }} />
          <div style={{ position: "absolute", left: SLIT_X - CAM.x - 46, top: -10, width: 92, height: 5, borderRadius: 3, background: "#01040C", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.9)" }} />
          <div style={{ position: "absolute", left: 158, top: -11 + 4 * press, width: 32, height: 13, borderRadius: 6, background: "linear-gradient(180deg, #FFD58A, #F59E0B)", boxShadow: `0 0 ${(10 + 18 * press).toFixed(1)}px ${rgba(AMBER, 0.6 + 0.3 * press)}, inset 0 1px 0 rgba(255,255,255,0.6)` }} />
          {/* body: solid underlay + glass */}
          <div style={{ position: "absolute", inset: 0, borderRadius: 30, background: "linear-gradient(160deg, #183062 0%, #0E1D40 60%, #0A1530 100%)" }} />
          <div style={{ position: "absolute", inset: 0, ...glass("34,211,238", 1 + 1.2 * flash + 0.8 * decay(badgeLand, 10)), borderRadius: 30, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: CAM.h - 22, height: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>
          {/* flash window */}
          <div
            style={{
              position: "absolute",
              left: FLASHW.x,
              top: FLASHW.y,
              width: FLASHW.w,
              height: FLASHW.h,
              borderRadius: 7,
              background: flash > 0.05 ? "#FFFFFF" : "linear-gradient(180deg, rgba(230,251,255,0.9), rgba(165,243,252,0.55))",
              backgroundImage: flash > 0.05 ? undefined : "repeating-linear-gradient(0deg, rgba(14,165,198,0.25) 0 2px, rgba(0,0,0,0) 2px 6px), linear-gradient(180deg, rgba(230,251,255,0.9), rgba(165,243,252,0.55))",
              border: "1.5px solid rgba(255,255,255,0.7)",
              boxShadow: `0 0 ${(8 + 40 * flash).toFixed(1)}px ${rgba(ICE, 0.5 + 0.5 * flash)}`,
            }}
          />
          {/* lens */}
          <svg width={140} height={140} viewBox="-70 -70 140 140" style={{ position: "absolute", left: LENS[0] - 70, top: LENS[1] - 70, overflow: "visible" }}>
            <defs>
              <radialGradient id="gvgBarrel" cx="0.45" cy="0.4" r="0.6">
                <stop offset="0" stopColor="#14306A" />
                <stop offset="1" stopColor="#030714" />
              </radialGradient>
              <radialGradient id="gvgGlass" cx="0.4" cy="0.35" r="0.7">
                <stop offset="0" stopColor="#3B82C4" />
                <stop offset="0.55" stopColor="#0E3A72" />
                <stop offset="1" stopColor="#061633" />
              </radialGradient>
            </defs>
            <circle r={54} fill="rgba(4,9,22,0.9)" stroke={rgba(CYAN, 0.6 + 0.4 * flash)} strokeWidth={3} style={{ filter: `drop-shadow(0 0 ${(8 + 16 * flash).toFixed(1)}px rgba(34,211,238,0.6))` }} />
            <circle r={46} fill="none" stroke={rgba(ICE, 0.35)} strokeWidth={2.5} strokeDasharray="5 8" transform={`rotate(${(t * 0.9).toFixed(1)})`} />
            <circle r={39} fill="url(#gvgBarrel)" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
            <circle r={24} fill="url(#gvgGlass)" stroke={rgba(CYAN, 0.7)} strokeWidth={2} />
            <circle r={9} fill="#020611" opacity={0.85} />
            <ellipse cx={-9} cy={-10} rx={8} ry={4.5} fill="rgba(255,255,255,0.75)" transform="rotate(-35 -9 -10)" />
            <circle cx={9} cy={9} r={2.6} fill="rgba(255,255,255,0.6)" />
            {flash > 0.05 ? <circle r={24} fill={`rgba(255,255,255,${(0.8 * flash).toFixed(3)})`} /> : null}
          </svg>
          {/* REC led */}
          <div style={{ position: "absolute", left: 132, top: 118, width: 9, height: 9, borderRadius: 5, background: Math.floor(g / 30) % 2 === 0 && idleCam > 0.5 ? B.cyan : rgba(CYAN, 0.25), boxShadow: Math.floor(g / 30) % 2 === 0 && idleCam > 0.5 ? `0 0 10px ${B.cyan}` : undefined }} />
          {/* the Git badge (after the logo's flight) */}
          {badgeLand >= 0 ? (
            <div style={{ position: "absolute", left: BADGE[0] - BADGE_S / 2, top: BADGE[1] - BADGE_S / 2, transform: `rotate(6deg) scale(${(1 + 0.18 * decay(badgeLand, 5) + 0.06 * flash).toFixed(3)})` }}>
              <Logo name="git" size={BADGE_S} glow={0.25 + 0.6 * flash + 0.6 * decay(badgeLand, 10)} />
            </div>
          ) : null}
          {badgeLand >= 0 && badgeLand < 18 ? <div style={{ position: "absolute", left: BADGE[0] - 30 - badgeLand * 2.4, top: BADGE[1] - 30 - badgeLand * 2.4, width: 60 + badgeLand * 4.8, height: 60 + badgeLand * 4.8, borderRadius: "50%", border: `2.5px solid ${rgba(ICE, 0.85 * (1 - badgeLand / 18))}` }} /> : null}
        </div>
      ) : null}

      {/* flash bloom + sparkle */}
      {flash > 0.01 ? <div style={{ position: "absolute", left: CAM.x + FLASHW.x + FLASHW.w / 2 - 120, top: CAM.y + FLASHW.y + FLASHW.h / 2 + camBob - 120, width: 240, height: 240, borderRadius: "50%", background: `radial-gradient(closest-side, rgba(255,255,255,${(0.85 * flash).toFixed(3)}), ${rgba(ICE, 0.35 * flash)} 40%, rgba(0,0,0,0))`, mixBlendMode: "screen" }} /> : null}
      {S.map((s, i) => {
        const a = t - s;
        return <Star key={i} x={CAM.x + FLASHW.x + FLASHW.w + 4} y={CAM.y + FLASHW.y + camBob} s={a < 0 ? 0 : iv(a, [0, 5, 16], [0.2, 1.15, 0.6], EASE_OUT)} o={a < 0 ? 0 : iv(a, [0, 2, 16], [0, 1, 0])} />;
      })}

      {/* tags */}
      <Tag
        x={174}
        y={TAG_Y}
        age={t - TAG_L}
        t={t}
        text="sur ta machine"
        icon={
          <svg width={30} height={22} viewBox="0 0 30 22">
            <rect x={5} y={2} width={20} height={13} rx={2.5} fill="none" stroke="#67E8F9" strokeWidth={2.4} />
            <path d="M1.5 19 H28.5" stroke="#67E8F9" strokeWidth={2.6} strokeLinecap="round" />
          </svg>
        }
      />
      <Tag
        x={582}
        y={TAG_Y}
        age={t - (TI + 26)}
        t={t}
        text="en ligne"
        icon={
          <div style={{ position: "relative", width: 30, height: 26, display: "flex", alignItems: "center" }}>
            <svg width={26} height={26} viewBox="0 0 26 26">
              <circle cx={13} cy={13} r={10.5} fill="none" stroke="#67E8F9" strokeWidth={2.2} />
              <ellipse cx={13} cy={13} rx={4.6} ry={10.5} fill="none" stroke="#67E8F9" strokeWidth={2} />
              <path d="M2.8 13 H23.2 M5 7.6 H21 M5 18.4 H21" stroke="#67E8F9" strokeWidth={1.8} />
            </svg>
            <div style={{ position: "absolute", left: 20, top: -2, width: 10, height: 10, borderRadius: 5, background: B.ok, border: "2px solid #06101F", boxShadow: `0 0 ${(6 + 8 * (0.5 + 0.5 * Math.sin(t * 0.15))).toFixed(1)}px ${B.ok}` }} />
          </div>
        }
      />

      {/* ── ≠ ── */}
      <div style={{ position: "absolute", left: NEQ[0], top: NEQ[1], width: 0, height: 0 }}>
        <div style={{ position: "absolute", left: -70, top: -80, width: 140, height: 160, transform: `scale(${neqS.toFixed(4)})` }}>
          {[-21, 21].map((dy, j) => (
            <div
              key={j}
              style={{
                position: "absolute",
                left: 20,
                top: 80 + dy - 8,
                width: 100,
                height: 16,
                borderRadius: 8,
                background: "linear-gradient(180deg, #FFFFFF, #CFFAFE)",
                boxShadow: `0 0 ${(14 + 10 * neqGlow).toFixed(1)}px ${rgba(CYAN, 0.55)}`,
                transform: `scaleX(${barP.toFixed(4)})`,
                opacity: clamp01(barP * 3),
              }}
            />
          ))}
          {slashP > 0 ? (
            <div
              style={{
                position: "absolute",
                left: 70 - 11,
                top: 80 - 70,
                width: 22,
                height: 140,
                borderRadius: 11,
                background: "linear-gradient(180deg, #FFD58A, #F59E0B 60%, #E08A00)",
                boxShadow: `0 0 ${(18 + 30 * decay(neqA, 8) + 10 * neqGlow).toFixed(1)}px ${rgba(AMBER, 0.75)}, inset 0 1px 0 rgba(255,255,255,0.6)`,
                transform: `rotate(28deg) scale(${slashS.toFixed(4)})`,
                opacity: clamp01(slashP * 3),
              }}
            />
          ) : null}
        </div>
        {neqA >= 0 && neqA < 10 ? <div style={{ position: "absolute", left: -110, top: -110, width: 220, height: 220, borderRadius: "50%", background: `radial-gradient(closest-side, rgba(255,240,210,${(0.9 * decay(neqA, 3)).toFixed(3)}), rgba(245,158,11,0))`, mixBlendMode: "screen" }} /> : null}
      </div>

      {/* labels of the intro */}
      {gitLabelO > 0.01 ? <div style={{ position: "absolute", left: GIT0[0] - flyGit - push - 120, width: 240, top: GIT0[1] + 92, textAlign: "center", fontFamily: fontInter, fontWeight: 800, fontSize: 38, letterSpacing: "-0.02em", color: B.white, opacity: gitLabelO, textShadow: "0 4px 18px rgba(0,0,0,0.6)" }}>Git</div> : null}
      {ghLabelO > 0.01 ? (
        <div style={{ position: "absolute", left: ghX - 120, width: 240, top: ghY + ghSize / 2 + 16, textAlign: "center", fontFamily: fontInter, fontWeight: 800, fontSize: lerp(38, 28, toIdle), letterSpacing: "-0.02em", color: B.white, opacity: ghLabelO, textShadow: "0 4px 18px rgba(0,0,0,0.6)" }}>GitHub</div>
      ) : null}

      {/* ── GitHub profile card (Instagram-like) ── */}
      {cardA > 0 ? (
        <div style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, opacity: clamp01(cardA * 2.5), transform: `scale(${(cardS * (1 + 0.015 * decay(lastLand, 6))).toFixed(4)})`, transformOrigin: `${AVA_L[0]}px ${AVA_L[1]}px` }}>
          <div style={{ position: "absolute", inset: 0, ...glass("34,211,238", 1 + 0.9 * decay(lastLand, 14) + 0.6 * decay(t - TI - 20, 12)), borderRadius: 30, overflow: "hidden" }}>
            {/* stats */}
            {[
              { x: 172, n: `${landedN}`, l: "versions", pop: decay(lastLand, 7) },
              { x: 262, n: `${likes}`, l: "j'aime", pop: decay(lastHeart, 7) },
            ].map((st, j) => (
              <div key={j} style={{ position: "absolute", left: st.x - 60, width: 120, top: 34, textAlign: "center", opacity: iv(t, [TI + 20 + 3 * j, TI + 30 + 3 * j], [0, 1]) }}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, fontFamily: fontInter, fontWeight: 800, fontSize: 36, lineHeight: 1.1, color: B.white, transform: `scale(${(1 + 0.2 * st.pop).toFixed(3)})` }}>
                  {j === 1 ? (
                    <svg width={24} height={24} viewBox="0 0 24 24">
                      <path d={HEART} fill="#FBBF24" />
                    </svg>
                  ) : null}
                  {st.n}
                </div>
                <div style={{ fontFamily: fontInter, fontWeight: 600, fontSize: 17, color: B.text2, marginTop: 2 }}>{st.l}</div>
              </div>
            ))}
            {/* name + handle */}
            <div style={{ position: "absolute", left: 22, top: 128, opacity: iv(t, [TI + 16, TI + 26], [0, 1]) }}>
              <div style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 25, letterSpacing: "-0.02em", color: B.white }}>mon-projet</div>
              <div style={{ fontFamily: fontMono, fontWeight: 500, fontSize: 16, color: "#A5F3FC", opacity: 0.85, marginTop: 2 }}>github.com/toi</div>
            </div>
            {/* grid tab */}
            <div style={{ position: "absolute", left: 0, right: 0, top: 196, height: 1, background: "rgba(255,255,255,0.1)", opacity: iv(t, [TI + 18, TI + 28], [0, 1]) }} />
            <div style={{ position: "absolute", left: CARD.w / 2 - 12, top: 205, opacity: iv(t, [TI + 18, TI + 28], [0, 1]) }}>
              <svg width={24} height={24} viewBox="0 0 24 24">
                {[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={c * 8.3} y={r * 8.3} width={6.6} height={6.6} rx={1.2} fill="#E6FBFF" />))}
              </svg>
            </div>
            <div style={{ position: "absolute", left: CARD.w / 2 - 36, top: 234, width: 72 * iv(t, [TI + 20, TI + 30], [0, 1], EASE_OUT), height: 3, borderRadius: 2, background: B.cyan, boxShadow: `0 0 8px ${B.cyan}` }} />
            {/* tiles */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const ta = t - (TI + 18 + 2 * i);
              if (ta <= 0) return null;
              const [lx, ly] = tileL(i);
              const s = popS(ta, 10);
              const post = i < 3 ? t - LAND_C[i] : -1;
              const sk = i >= 3 ? ((t * 3.2 - (i - 3) * 30) % 360) / 360 : -1;
              return (
                <div key={i} style={{ position: "absolute", left: lx, top: ly, width: TILE, height: TILE, borderRadius: 10, overflow: "hidden", background: post >= 0 ? "linear-gradient(160deg, rgba(34,211,238,0.16), rgba(10,24,56,0.6))" : "rgba(148,190,255,0.07)", border: `1px solid ${rgba(CYAN, post >= 0 ? 0.35 + 0.5 * decay(post, 10) : 0.14)}`, transform: `scale(${(s * (post >= 0 ? 1 + 0.12 * decay(post, 5) : 1)).toFixed(4)})`, opacity: clamp01(ta / 5) }}>
                  {post < 0 && i < 3 ? (
                    <svg width={TILE} height={TILE} style={{ position: "absolute", left: 0, top: 0 }}>
                      <path d={`M${TILE / 2 - 9} ${TILE / 2} H${TILE / 2 + 9} M${TILE / 2} ${TILE / 2 - 9} V${TILE / 2 + 9}`} stroke="rgba(165,243,252,0.35)" strokeWidth={3} strokeLinecap="round" />
                    </svg>
                  ) : null}
                  {sk >= 0 ? <div style={{ position: "absolute", top: -20, bottom: -20, width: 50, left: -60 + sk * 360, transform: "skewX(-18deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.07), rgba(255,255,255,0))" }} /> : null}
                  {post >= 0 ? (
                    <>
                      <div style={{ position: "absolute", left: TILE / 2 - POL.w / 2, top: TILE / 2 - POL.h / 2, transform: `rotate(${TILE_R[i]}deg) scale(${(POST_S * (1 + 0.1 * decay(post, 5))).toFixed(4)})` }}>
                        <Polaroid v={i} dev={1} label={1} hot={0.3 * decay(post, 12)} />
                      </div>
                      <div style={{ position: "absolute", inset: 0, background: "rgb(232,250,255)", opacity: 0.8 * decay(post, 4) }} />
                    </>
                  ) : null}
                </div>
              );
            })}
            {/* sheen */}
            {cardSheen >= 0 && cardSheen <= 1 ? <div style={{ position: "absolute", top: -80, bottom: -80, width: 100, left: -130 + cardSheen * (CARD.w + 260), transform: "skewX(-18deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.16), rgba(255,255,255,0))" }} /> : null}
          </div>
          {/* avatar: story ring + round GitHub logo */}
          <svg width={140} height={140} viewBox="-70 -70 140 140" style={{ position: "absolute", left: AVA_L[0] - 70, top: AVA_L[1] - 70, overflow: "visible" }}>
            <defs>
              <linearGradient id="gvgRing" x1="0" y1="0" x2="1" y2="1" gradientTransform={`rotate(${(t * 1.4).toFixed(1)} 0.5 0.5)`}>
                <stop offset="0" stopColor="#FBBF24" />
                <stop offset="0.5" stopColor="#F59E0B" />
                <stop offset="1" stopColor="#22D3EE" />
              </linearGradient>
            </defs>
            <circle r={54} fill="none" stroke="url(#gvgRing)" strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ringP} strokeLinecap="round" transform="rotate(-90)" style={{ filter: `drop-shadow(0 0 ${(6 + 10 * decay(lastLand, 10)).toFixed(1)}px rgba(245,158,11,0.6))` }} />
          </svg>
          <div style={{ position: "absolute", left: AVA_L[0] - 46, top: AVA_L[1] - 46, width: 92, height: 92, borderRadius: 46, background: "radial-gradient(circle at 40% 35%, #FFFFFF, #E2EEF8)", boxShadow: "0 8px 20px rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", opacity: avaO }}>
            <Logo name="github" size={62} plate={false} />
          </div>
        </div>
      ) : null}

      {/* GitHub logo: intro → waiting → into the avatar */}
      {ghO > 0.01 ? (
        <div style={{ position: "absolute", left: ghX - ghSize / 2, top: ghY - ghSize / 2, opacity: ghO }}>
          <Logo name="github" size={ghSize} draw={iv(t, [3, 19], [0, 1], EASE_OUT)} glow={0.3 + 0.4 * decay(neqA, 10) + 0.5 * toAva} />
        </div>
      ) : null}

      {/* Git logo: intro → flies onto the camera */}
      {badgeLand < 0 ? (
        <div style={{ position: "absolute", left: gitX - gitSize / 2, top: gitY - gitSize / 2, transform: toBadge > 0 ? `rotate(${(6 * toBadge).toFixed(2)}deg)` : undefined }}>
          <Logo name="git" size={gitSize} draw={iv(t, [0, 16], [0, 1], EASE_OUT)} glow={0.3 + 0.4 * decay(neqA, 10) + 0.4 * toBadge} />
        </div>
      ) : null}

      {/* upload arcs */}
      {upO > 0.01 ? (
        <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: upO }}>
          {upPaths.map(([a, c, b], i) => (
            <path key={i} d={`M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`} fill="none" stroke={rgba(CYAN, 0.7)} strokeWidth={3} strokeDasharray="4 12" strokeLinecap="round" strokeDashoffset={-t * 1.4} />
          ))}
        </svg>
      ) : null}

      {/* flying polaroids (shots) + copies (publish) */}
      {flying}
      {copies}
      {hearts}

      {/* « publier » pill */}
      {pillA > 0 ? (
        <div style={{ position: "absolute", left: PILL[0], top: PILL[1], width: 0, height: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: clamp01(pillA / 4) }}>
          <div
            style={{
              flexShrink: 0,
              height: 52,
              padding: "0 22px 0 16px",
              borderRadius: 26,
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "linear-gradient(140deg, rgba(245,158,11,0.32), rgba(245,158,11,0.1))",
              border: `2px solid ${rgba(AMBER, 0.9)}`,
              boxShadow: `0 0 ${(22 + 34 * decay(pillA, 10)).toFixed(1)}px ${rgba(AMBER, 0.5)}, inset 0 1px 0 rgba(255,255,255,0.35)`,
              transform: `scale(${popS(pillA, 10).toFixed(4)}) translateY(${(Math.sin(t * 0.06) * 3).toFixed(2)}px)`,
              whiteSpace: "nowrap",
            }}
          >
            <svg width={30} height={26} viewBox="0 0 30 26">
              <path d="M8 21 H6.5 A5.5 5.5 0 0 1 6 10 A8 8 0 0 1 21.5 8 A6.5 6.5 0 0 1 23 21 H22" fill="none" stroke="#FFD58A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
              <path d={`M15 ${24 - 2 * Math.abs(Math.sin(t * 0.12))} V12 M10.5 16 L15 11.5 L19.5 16`} fill="none" stroke="#FFE7B8" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 26, color: "#FFE7B8", letterSpacing: "-0.01em" }}>publier</span>
          </div>
        </div>
      ) : null}

      {/* light (flare box = the full 1080 frame width so streaks fade instead of being cut at the stage edge) */}
      <Shockwave age={neqA} x={NEQ[0]} y={NEQ[1]} col={AMBER} dur={24} strength={0.8} maxR={260} r0={30} />
      <Shockwave age={t - (TI + 20)} x={CARD.x + CARD.w / 2} y={CARD.y + CARD.h / 2} col={CYAN} dur={24} strength={0.6} maxR={280} r0={120} />
      <Shockwave age={t - LAND_C[2]} x={CARD.x + CARD.w / 2} y={CARD.y + 300} col={CYAN} dur={22} strength={0.6} maxR={240} r0={80} />
      <div style={{ position: "absolute", left: -160, top: 0, width: 1080, height: 760, pointerEvents: "none" }}>
        <AnamorphicFlare age={neqA} x={NEQ[0] + 160} y={NEQ[1]} col={AMBER} dur={30} strength={0.75} size={120} streakH={80} />
        <AnamorphicFlare age={pillA} x={PILL[0] + 160} y={PILL[1]} col={AMBER} dur={22} strength={0.32} size={90} streakH={50} />
        {S.map((s, i) => (
          <AnamorphicFlare key={i} age={t - s} x={CAM.x + FLASHW.x + FLASHW.w / 2 + 160} y={CAM.y + FLASHW.y + FLASHW.h / 2} col={ICE} dur={12} strength={0.22} size={70} streakH={30} />
        ))}
      </div>
    </div>
  );
};
