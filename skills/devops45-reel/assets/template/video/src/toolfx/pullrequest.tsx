import React from "react";
import { Logo } from "../kit/Logo";
import { fontInter, fontMono } from "../kit/fonts";
import { B, glass } from "../lib/look";
import { rand } from "../lib/sync";
import { AMBER, AnamorphicFlare, clamp01, CYAN, decay, EASE_IN, EASE_IN_OUT, EASE_OUT, ICE, iv, rgba, Shockwave, type RGB } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/*
 * « Ton équipe les voit, les commente, et propose des changements. Ça s'appelle une pull request : une modif proposée,
 * relue avant d'être acceptée. » — concept animation (ep. 8). A GitHub-style pull-request card (real GitHub logo,
 * « Ajoute le login », #42 feature → main, status pill « Open », a dim « Merge » button) above a git graph (main line).
 *   0       the card lands, the main line draws with two commits.
 *   V voit      three teammates pop around the card (back-out), each with an eye badge that opens and looks at the
 *               card; a glowing « seen » ping flies from each eye into the card's 👁 counter, which ticks 1-2-3.
 *   C commente  two comment bubbles pop from the top avatars: « 👍 top » (SVG thumb, no emoji font needed) and
 *               « petit souci ligne 12 »; each sends a ping into the 💬 counter (1-2).
 *   P propose   a « feature » branch forks off main and a glass diff card (login.js, +green / −red lines, line 12 is the
 *               red one) rides the branch arrow in from the left; a dashed proposal path curves down to a target ring
 *               on main. Eyes now follow the diff.
 *   R relue     a scan bar reads the diff (✓ per line), then a green « APPROVED ✓ » stamp slams on the card
 *               (R+10: squash, ink drops, green shockwave) over « relecture en attente »; the reviewer gets a ✓;
 *               the Merge button wakes up amber.
 *   A acceptée  a cursor glides to Merge and presses it (A, amber ripple); the diff card dives along the proposal path
 *               into main (A+2→A+14), the path turns solid purple, a purple merge commit badge pops on main (A+14:
 *               shockwave, flare, sparks) and the status pill flips to a solid purple « Merged » that slides to centre.
 *   idle    avatars bob/blink and hop on the merge, bubbles bob, the proposal path flows, a light runs along main,
 *           the merge badge pulses, the stamp glints.
 * Phase words (episode item `beats`): ["voit", "commente", "propose", "relue", "acceptée"] — 5 → all; 4 → the last 4;
 * 3 → the last 3 (earlier phases fall back to the defaults). Anything else → V/C/P/R/A at 8/30/58/96/134 (scaled down
 * on short items). Gaps are clamped so every phase has room. pullrequest.sfx.json is timed on the lab
 * (beats 70/110/150 → P 58, R 98, A 138): re-time it on the episode's real phase frames.
 * Drawn in a 760 design space.
 */

type P2 = [number, number];
const GREEN: RGB = [52, 211, 153];
const RED: RGB = [248, 113, 113];
const PURPLE: RGB = [163, 113, 247];
const PURPLE_D: RGB = [137, 87, 229];
const LIME: RGB = [134, 239, 172];

const CARD = { x: 130, y: 116, w: 500, h: 250 };
const CC: P2 = [CARD.x + CARD.w / 2, CARD.y + CARD.h / 2];
const AR = 40;
const AV: Array<{ x: number; y: number; tint: RGB; eye: P2 }> = [
  { x: 70, y: 98, tint: CYAN, eye: [106, 132] },
  { x: 692, y: 98, tint: ICE, eye: [656, 132] },
  { x: 702, y: 474, tint: LIME, eye: [666, 440] },
];
const BUB = [
  { x: 128, y: 22, w: 132, h: 60, tail: "left" as const },
  { x: 310, y: 22, w: 326, h: 60, tail: "right" as const },
];
// git graph
const MY = 676; // main line
const BY = 564; // branch line
const FORK = 150;
const CURVE_END = 250;
const HEAD_X = 582; // arrow head when the diff has arrived
const MX = 650; // merge point on main
const DW = 300;
const DH = 152;
const DHEAD = 42; // diff header height
const DROW = 34; // diff row pitch
const DC: P2 = [HEAD_X - 22 - DW / 2, BY - 14 - DH / 2]; // diff card centre when parked (410, 474)
const MPT: P2 = [MX, MY];
const BTN = { x: 326, y: 188, w: 150, h: 48 }; // merge button (card-local)
const BTN_C: P2 = [CARD.x + BTN.x + BTN.w / 2, CARD.y + BTN.y + BTN.h / 2];
const STAMP_C: P2 = [CARD.x + 362, CARD.y + 142];
const EYE_CNT: P2 = [CARD.x + 70, CARD.y + 145]; // the 👁 counter digit
const COM_CNT: P2 = [CARD.x + 147, CARD.y + 145]; // the 💬 counter digit
const PING0 = 7; // a « seen » ping leaves the eye this long after its avatar pops
const PING = 11; // ping flight (frames)
const DIFF_LINES = [
  { n: "10", s: "+", code: "<Bouton/>", col: GREEN },
  { n: "11", s: "+", code: "login()", col: GREEN },
  { n: "12", s: "−", code: "vieux()", col: RED },
];

const DEF = [8, 30, 58, 96, 134];
const GAP = [0, 18, 20, 26, 26];
/** V, C, P, R, A (frames after f0) from the item's phase words */
const phases = (rel: number[], dur: number): number[] => {
  const bt = rel.filter((b) => b > 0 && b < dur).sort((a, b) => a - b);
  const n = bt.length;
  let ph: number[];
  if (n >= 3 && n <= 5) {
    const o = 5 - n;
    ph = [...DEF.slice(0, o), ...bt];
    for (let i = o - 1; i >= 0; i--) ph[i] = Math.max(2 + 4 * i, Math.min(DEF[i], ph[i + 1] - GAP[i + 1]));
  } else {
    const k = Math.min(1, Math.max(0.6, (dur - 24) / DEF[4]));
    ph = DEF.map((d) => Math.round(d * k));
  }
  for (let i = 1; i < 5; i++) ph[i] = Math.max(ph[i], ph[i - 1] + GAP[i]);
  return ph;
};

const qb = (a: P2, c: P2, b: P2, t: number): P2 => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
};
const lerp2 = (a: P2, b: P2, k: number): P2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const mix = (a: RGB, b: RGB, k: number): RGB => [Math.round(a[0] + (b[0] - a[0]) * k), Math.round(a[1] + (b[1] - a[1]) * k), Math.round(a[2] + (b[2] - a[2]) * k)];
/** pop scale: 0 → 1.18 → 1 */
const popS = (age: number, d = 8) => (age < 0 ? 0 : age < d ? iv(age, [0, d], [0, 1.18], EASE_OUT) : iv(age, [d, d + 8], [1.18, 1], EASE_OUT));

/* ───────────────────────── icons ───────────────────────── */
const PrIcon: React.FC<{ s: number; col: string }> = ({ s, col }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0, overflow: "visible" }}>
    <g fill="none" stroke={col} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={6} cy={5} r={2.6} />
      <circle cx={6} cy={19} r={2.6} />
      <path d="M6 7.6 V16.4" />
      <circle cx={18} cy={19} r={2.6} />
      <path d="M18 16.4 V9.5 Q18 6 14.5 6 H11" />
      <path d="M13.6 3.2 L10.8 6 L13.6 8.8" />
    </g>
  </svg>
);
const MergeIcon: React.FC<{ s: number; col: string }> = ({ s, col }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0, overflow: "visible" }}>
    <g fill="none" stroke={col} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={6} cy={5} r={2.6} />
      <circle cx={6} cy={19} r={2.6} />
      <path d="M6 7.6 V16.4" />
      <circle cx={18} cy={13} r={2.6} />
      <path d="M6 7.6 Q6 13 15.4 13" />
    </g>
  </svg>
);
const EyeIcon: React.FC<{ s: number; open: number; look: P2; col: string }> = ({ s, open, look, col }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block", overflow: "visible" }}>
    <g transform={`translate(12 12) scale(1 ${Math.max(0.08, open).toFixed(3)}) translate(-12 -12)`}>
      <path d="M1.5 12 Q12 2.2 22.5 12 Q12 21.8 1.5 12 Z" fill="rgba(255,255,255,0.96)" stroke={col} strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx={12 + look[0]} cy={12 + look[1]} r={4.8} fill={col} />
      <circle cx={12 + look[0]} cy={12 + look[1]} r={2.1} fill="#04121A" />
      <circle cx={13.5 + look[0]} cy={10.5 + look[1]} r={1.1} fill="#FFFFFF" />
    </g>
  </svg>
);
const ChatIcon: React.FC<{ s: number; col: string }> = ({ s, col }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
    <path d="M4 3.5 H20 A2.5 2.5 0 0 1 22.5 6 V15 A2.5 2.5 0 0 1 20 17.5 H11 L6 21.5 V17.5 H4 A2.5 2.5 0 0 1 1.5 15 V6 A2.5 2.5 0 0 1 4 3.5 Z" fill="none" stroke={col} strokeWidth={2.2} strokeLinejoin="round" />
  </svg>
);
/** thumbs up (Material icon) */
const ThumbUp: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0, overflow: "visible", filter: "drop-shadow(0 0 6px rgba(251,191,36,0.6))" }}>
    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" fill="#FBBF24" />
  </svg>
);
const Check: React.FC<{ s: number; col: string; sw?: number }> = ({ s, col, sw = 3 }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" style={{ display: "block", flexShrink: 0, overflow: "visible" }}>
    <path d="M2.5 8.5 L6.3 12.2 L13.5 4.2" fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Person: React.FC<{ tint: RGB }> = ({ tint }) => (
  <svg width={AR * 2} height={AR * 2} viewBox="0 0 80 80" style={{ position: "absolute", left: 0, top: 0 }}>
    <defs>
      <clipPath id="prAvClip">
        <circle cx={40} cy={40} r={36} />
      </clipPath>
    </defs>
    <g clipPath="url(#prAvClip)">
      <circle cx={40} cy={31} r={13} fill={rgba(tint, 0.95)} />
      <ellipse cx={40} cy={72} rx={26} ry={20} fill={rgba(tint, 0.8)} />
    </g>
  </svg>
);

export const PullRequestFx: ToolFx = ({ g, f0, f1, beats, size }) => {
  const t = g - f0;
  const dur = Math.max(150, f1 - f0);
  const [V, C, P, R, A] = phases(beats.map((b) => b - f0), dur);

  const LAND = R + 10; // stamp lands
  const FLIP = A + 6; // status pill flips to Merged
  const DOT = A + 14; // merge commit pops on main
  const stampAge = t - LAND;
  const clickAge = t - A;
  const mergeAge = t - DOT;
  const hit = decay(stampAge, 6);

  const appear = iv(t, [0, 12], [0, 1], EASE_OUT);
  const cardS = t < 14 ? iv(t, [0, 14], [0.84, 1.03], EASE_OUT) : iv(t, [14, 24], [1.03, 1], EASE_OUT);
  const bob = Math.sin(t * 0.045) * 3;
  const merged = iv(t, [FLIP, FLIP + 8], [0, 1]);
  const mergeGlow = decay(t - FLIP - 4, 16);

  // where the eyes look: the card → the diff (propose) → the merge point
  const k1 = iv(t, [P + 4, P + 14], [0, 1], EASE_IN_OUT);
  const k2 = iv(t, [A + 4, A + 14], [0, 1], EASE_IN_OUT);
  const target = lerp2(lerp2(CC, DC, k1), MPT, k2);

  // counters
  const SEEN_AT = AV.map((_, k) => V + 5 * k + PING0 + PING); // each « seen » ping lands on the counter
  const COM_AT = BUB.map((_, k) => C + 2 + 10 * k + 4 + PING);
  const nSeen = SEEN_AT.filter((f) => t >= f).length;
  const nCom = COM_AT.filter((f) => t >= f).length;

  // branch + diff
  const curveP = iv(t, [P, P + 6], [0, 1], EASE_OUT);
  const slide = iv(t, [P + 3, P + 26], [0, 1], EASE_OUT);
  const endX = CURVE_END + (HEAD_X - CURVE_END) * slide;
  const mv = iv(t, [A + 2, DOT], [0, 1], EASE_IN_OUT);
  const dPos: P2 = mv > 0 ? qb(DC, [MX, DC[1]], MPT, mv) : [endX - 22 - DW / 2, DC[1]];
  const dScale = mv > 0 ? 1 - 0.88 * mv : 1;
  const dOp = iv(t, [P + 3, P + 10], [0, 1]) * (mv > 0 ? iv(mv, [0.72, 1], [1, 0]) : 1);
  const dSkew = mv > 0 ? 0 : -12 * (1 - slide);
  const dBlur = mv > 0 ? 0 : Math.max(0, (0.55 - slide) * 12);
  const brK = iv(t, [A + 4, DOT], [0, 1]);
  const brCol = mix(ICE, PURPLE, brK);
  const propO = iv(t, [P + 20, P + 28], [0, 1]) * (1 - iv(t, [A + 2, A + 8], [0, 1]));
  const solidP = iv(t, [A + 2, DOT], [0, 1], EASE_IN_OUT);
  const headO = clamp01(slide * 4) * (1 - iv(t, [A + 2, A + 8], [0, 1]));
  const scan = iv(t, [R, R + 12], [0, 1], EASE_IN_OUT);

  // stamp
  const sf = iv(t, [R + 2, LAND], [0, 1], EASE_IN);
  const stampS = stampAge < 0 ? 2.6 - 1.6 * sf : 1 + 0.07 * Math.sin(clamp01(stampAge / 10) * Math.PI) * Math.exp(-stampAge / 8);
  const stampRot = -21 + 12 * sf;
  const sgA = stampAge > 30 ? (stampAge - 30) % 130 : -1;
  const stampGlint = sgA >= 0 && sgA < 18 ? sgA / 18 : -1;

  // merge button + cursor
  const en = iv(t, [LAND + 4, LAND + 12], [0, 1]);
  const press = clickAge >= 0 && clickAge < 10 ? Math.sin((clickAge / 10) * Math.PI) : 0;
  const btnGone = iv(t, [FLIP, FLIP + 8], [0, 1], EASE_IN);
  const cIn = iv(t, [A - 20, A - 2], [0, 1], EASE_IN_OUT);
  const cOut = iv(t, [A + 8, A + 26], [0, 1], EASE_IN_OUT);
  const cOp = iv(t, [A - 20, A - 14, A + 16, A + 26], [0, 1, 1, 0]);
  const cPos: P2 = lerp2(lerp2([744, 646], [BTN_C[0] + 10, BTN_C[1] + 6], cIn), [BTN_C[0] + 70, BTN_C[1] + 80], cOut * 0.5);

  // status pill flip
  const fl = iv(t, [FLIP, FLIP + 8], [0, 1], EASE_IN_OUT);
  const fy = Math.max(0.03, Math.abs(Math.cos(fl * Math.PI)));
  const isM = fl >= 0.5;
  const pillW = isM ? 196 : 138;
  const pillX = 24 + ((CARD.w - pillW) / 2 - 24) * iv(t, [FLIP + 6, FLIP + 20], [0, 1], EASE_IN_OUT);
  const pillPop = isM ? 1 + 0.2 * decay(t - FLIP - 4, 7) + 0.1 * iv(t, [FLIP + 6, FLIP + 20], [0, 1], EASE_OUT) : 1;

  const cardAcc = merged > 0.5 ? "163,113,247" : "34,211,238";
  const cardStrength = 1 + 0.9 * hit + 0.9 * mergeGlow;

  // idle light on main after the merge, merge badge pulses
  const runX = mergeAge > 20 ? 30 + (((mergeAge - 20) * 7) % 860) - 60 : -999;
  const pulsePh = mergeAge > 24 ? ((mergeAge - 24) % 54) / 54 : -1;

  /* ── particles ── */
  const parts: React.ReactNode[] = [];
  if (stampAge >= 0 && stampAge < 22) {
    for (let j = 0; j < 14; j++) {
      const an = (j / 14) * Math.PI * 2 + rand(j * 3.3 + 1) * 0.4;
      const sp = 5 + rand(j * 7.1 + 2) * 6;
      const r = 3 + rand(j * 1.9 + 5) * 4;
      const d = 90 + stampAge * sp;
      parts.push(<circle key={`i${j}`} cx={STAMP_C[0] + Math.cos(an) * d * 1.5} cy={STAMP_C[1] + Math.sin(an) * d * 0.6} r={r * (1 - stampAge / 26)} fill={j % 3 === 0 ? "#FFFFFF" : rgba(GREEN, 1)} opacity={1 - stampAge / 22} />);
    }
  }
  if (mergeAge >= 0 && mergeAge < 32) {
    for (let j = 0; j < 18; j++) {
      const an = -Math.PI * (0.05 + 0.9 * rand(j * 5.7 + 3));
      const sp = 4 + rand(j * 2.3 + 7) * 7;
      const sz = 4 + rand(j * 9.1 + 1) * 5;
      const x = MX + Math.cos(an) * sp * mergeAge;
      const y = MY + Math.sin(an) * sp * mergeAge + 0.22 * mergeAge * mergeAge;
      parts.push(<rect key={`m${j}`} x={x - sz / 2} y={y - sz / 2} width={sz} height={sz} rx={1.5} transform={`rotate(${(mergeAge * 12 + j * 40).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})`} fill={j % 3 === 0 ? "#FFFFFF" : j % 3 === 1 ? rgba(PURPLE, 1) : rgba(CYAN, 1)} opacity={1 - mergeAge / 32} />);
    }
  }

  const branchD = `M${FORK} ${MY} C${FORK} ${MY - 70} ${FORK + 40} ${BY} ${CURVE_END} ${BY}`;
  const propD = `M${HEAD_X} ${BY} Q${MX} ${BY} ${MX} ${MY - 2}`;

  const k760 = size / 760;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: k760 !== 1 ? `scale(${k760.toFixed(4)})` : undefined, transformOrigin: "0 0" }}>
      {/* back lights */}
      <div style={{ position: "absolute", left: CARD.x - 90, top: CARD.y - 70, width: CARD.w + 180, height: CARD.h + 140, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(merged > 0.5 ? PURPLE : CYAN, 0.15 + 0.2 * hit + 0.2 * mergeGlow)}, rgba(0,0,0,0))`, filter: "blur(24px)", opacity: appear }} />
      {mergeAge >= 0 ? <div style={{ position: "absolute", left: MX - 170, top: MY - 130, width: 340, height: 260, borderRadius: "50%", background: `radial-gradient(closest-side, ${rgba(PURPLE, 0.14 + 0.3 * decay(mergeAge, 16))}, rgba(0,0,0,0))`, filter: "blur(18px)" }} /> : null}

      {/* ── git graph ── */}
      <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <filter id="prGlow" x="-20%" y="-200%" width="140%" height="500%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        {/* main */}
        <line x1={30} y1={MY} x2={30 + 700 * iv(t, [0, 20], [0, 1], EASE_OUT)} y2={MY} stroke={rgba(CYAN, 0.7)} strokeWidth={12} strokeLinecap="round" filter="url(#prGlow)" opacity={0.7} />
        <line x1={30} y1={MY} x2={30 + 700 * iv(t, [0, 20], [0, 1], EASE_OUT)} y2={MY} stroke={B.cyan} strokeWidth={6} strokeLinecap="round" />
        {mergeAge >= 0 && mergeAge < 30 ? <line x1={MX} y1={MY} x2={730} y2={MY} stroke={rgba(PURPLE, 0.9 * decay(mergeAge, 10))} strokeWidth={10} strokeLinecap="round" filter="url(#prGlow)" /> : null}
        {runX > -40 && runX < 800 ? (
          <>
            <ellipse cx={runX} cy={MY} rx={46} ry={10} fill={rgba(ICE, 0.45)} filter="url(#prGlow)" />
            <circle cx={runX} cy={MY} r={4} fill="#FFFFFF" />
          </>
        ) : null}
        {/* feature branch */}
        {curveP > 0 ? (
          <>
            <path d={branchD} fill="none" stroke={rgba(brCol, 0.6)} strokeWidth={12} filter="url(#prGlow)" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - curveP} />
            <path d={branchD} fill="none" stroke={rgba(brCol, 1)} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - curveP} />
          </>
        ) : null}
        {slide > 0 ? (
          <>
            <line x1={CURVE_END} y1={BY} x2={endX} y2={BY} stroke={rgba(brCol, 0.6)} strokeWidth={12} filter="url(#prGlow)" />
            <line x1={CURVE_END - 1} y1={BY} x2={endX} y2={BY} stroke={rgba(brCol, 1)} strokeWidth={6} strokeLinecap="round" />
          </>
        ) : null}
        {/* proposal path (dashed) → solid purple on merge */}
        {propO > 0.01 ? <path d={propD} fill="none" stroke={rgba(ICE, 0.75 * propO)} strokeWidth={4} strokeDasharray="5 11" strokeLinecap="round" strokeDashoffset={-t * 1.3} /> : null}
        {solidP > 0 ? (
          <>
            <path d={propD} fill="none" stroke={rgba(PURPLE, 0.7)} strokeWidth={12} filter="url(#prGlow)" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - solidP} />
            <path d={propD} fill="none" stroke={rgba(mix(PURPLE, [255, 255, 255], 0.2), 1)} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - solidP} />
          </>
        ) : null}
        {/* arrow head riding the branch */}
        {headO > 0.01 ? <path d={`M${endX + 4} ${BY - 14} L${endX + 26} ${BY} L${endX + 4} ${BY + 14} Z`} fill={rgba(brCol, 1)} opacity={headO} style={{ filter: `drop-shadow(0 0 8px ${rgba(ICE, 0.9)})` }} /> : null}
        {/* target ring on main */}
        {propO > 0.01 ? <circle cx={MX} cy={MY} r={19 + 3 * Math.sin(t * 0.15)} fill="rgba(4,7,15,0.7)" stroke={rgba(ICE, 0.85 * propO)} strokeWidth={3} strokeDasharray="5 5" strokeDashoffset={t * 0.6} /> : null}
        {/* particles */}
        {parts}
      </svg>

      {/* main commits + labels */}
      {[80, FORK].map((x, i) => {
        const a = t - (10 + 4 * i);
        if (a < 0) return null;
        const hot = i === 1 ? decay(t - P, 10) : 0;
        return <div key={i} style={{ position: "absolute", left: x - 14, top: MY - 14, width: 28, height: 28, borderRadius: 14, background: `radial-gradient(circle at 40% 35%, #CFFAFE, ${B.cyan})`, border: "3px solid rgba(255,255,255,0.85)", boxShadow: `0 0 ${14 + 24 * hot}px ${rgba(CYAN, 0.75)}`, transform: `scale(${(popS(a, 6) * (1 + 0.25 * hot)).toFixed(3)})` }} />;
      })}
      <div style={{ position: "absolute", left: 34, top: MY + 24, fontFamily: fontMono, fontWeight: 700, fontSize: 22, color: B.text2, opacity: iv(t, [8, 18], [0, 1]) }}>main</div>
      <div style={{ position: "absolute", left: FORK + 18, top: BY - 46, fontFamily: fontMono, fontWeight: 700, fontSize: 20, color: merged > 0.5 ? "#D8C3FF" : "#BDF4FF", opacity: iv(t, [P + 8, P + 18], [0, 0.95]), textShadow: `0 0 14px ${rgba(merged > 0.5 ? PURPLE : CYAN, 0.6)}` }}>feature</div>

      {/* merge badge on main */}
      {mergeAge >= 0 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: MX - 24,
              top: MY - 24,
              width: 48,
              height: 48,
              borderRadius: 24,
              background: `linear-gradient(140deg, ${rgba(PURPLE, 1)}, ${rgba(PURPLE_D, 1)})`,
              border: "3px solid rgba(255,255,255,0.9)",
              boxShadow: `0 0 ${20 + 34 * decay(mergeAge, 12)}px ${rgba(PURPLE, 0.85)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${popS(mergeAge, 7).toFixed(3)})`,
            }}
          >
            <MergeIcon s={26} col="#FFFFFF" />
          </div>
          {mergeAge < 22 ? <div style={{ position: "absolute", left: MX - 24 - mergeAge * 2.6, top: MY - 24 - mergeAge * 2.6, width: 48 + mergeAge * 5.2, height: 48 + mergeAge * 5.2, borderRadius: "50%", border: `3px solid ${rgba(PURPLE, 0.85 * (1 - mergeAge / 22))}` }} /> : null}
          {pulsePh >= 0 ? <div style={{ position: "absolute", left: MX - 24 - pulsePh * 26, top: MY - 24 - pulsePh * 26, width: 48 + pulsePh * 52, height: 48 + pulsePh * 52, borderRadius: "50%", border: `2.5px solid ${rgba(PURPLE, 0.7 * (1 - pulsePh))}` }} /> : null}
        </>
      ) : null}

      {/* ── diff card riding the branch ── */}
      {dOp > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: dPos[0] - DW / 2,
            top: dPos[1] - DH / 2,
            width: DW,
            height: DH,
            opacity: dOp,
            transform: `skewX(${dSkew.toFixed(2)}deg) scale(${dScale.toFixed(4)}) translateY(${(mv > 0 ? 0 : Math.sin(t * 0.06) * 2.5).toFixed(2)}px)`,
            filter: dBlur > 0.3 ? `blur(${dBlur.toFixed(1)}px)` : undefined,
          }}
        >
          <div style={{ position: "absolute", inset: 0, ...glass(mv > 0 ? "163,113,247" : "34,211,238", 0.9 + 0.8 * mv), borderRadius: 18, overflow: "hidden", border: `1.5px solid ${mv > 0 ? rgba(PURPLE, 0.8) : "rgba(255,255,255,0.14)"}` }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: DHEAD, display: "flex", alignItems: "center", gap: 9, paddingLeft: 16, paddingRight: 16, borderBottom: "1px solid rgba(255,255,255,0.09)", boxSizing: "border-box" }}>
              <svg width={18} height={22} viewBox="0 0 24 30" style={{ flexShrink: 0 }}>
                <path d="M2 2 H15 L22 9 V28 H2 Z" fill="none" stroke={B.cyan} strokeWidth={2.6} strokeLinejoin="round" />
                <path d="M15 2 V9 H22" fill="none" stroke={B.cyan} strokeWidth={2.6} strokeLinejoin="round" />
              </svg>
              <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 22, color: B.white }}>login.js</span>
              <span style={{ marginLeft: "auto", fontFamily: fontMono, fontWeight: 700, fontSize: 22 }}>
                <span style={{ color: rgba(GREEN, 1) }}>+2</span> <span style={{ color: rgba(RED, 1) }}>−1</span>
              </span>
            </div>
            {DIFF_LINES.map((l, j) => {
              const a = t - (P + 12 + 5 * j);
              const gr = iv(a, [0, 9], [0, 1], EASE_OUT);
              const ly = DHEAD + 6 + DROW * j;
              const scanY = DHEAD + scan * (DH - DHEAD);
              const ticked = t >= R && scanY > ly + 16;
              const tickAge = ticked ? t - (R + 12 * clamp01((ly + 16 - DHEAD) / (DH - DHEAD))) : -1;
              return (
                <div key={j} style={{ position: "absolute", left: 7, right: 7, top: ly, height: DROW - 4, borderRadius: 7, background: rgba(l.col, 0.17), opacity: clamp01(gr * 2), display: "flex", alignItems: "center", gap: 9, paddingLeft: 7, boxSizing: "border-box", overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: rgba(l.col, 0.95) }} />
                  <span style={{ fontFamily: fontMono, fontWeight: 500, fontSize: 17, color: B.text3, width: 24, textAlign: "right" }}>{l.n}</span>
                  <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 24, color: rgba(l.col, 1), width: 14 }}>{l.s}</span>
                  <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 23, color: l.s === "+" ? "#D1FAE5" : "#FECACA", textDecoration: l.s === "−" ? "line-through" : undefined, textDecorationColor: rgba(RED, 0.85), clipPath: `inset(0 ${((1 - gr) * 100).toFixed(1)}% 0 0)` }}>{l.code}</span>
                  {tickAge >= 0 ? (
                    <div style={{ marginLeft: "auto", marginRight: 10, transform: `scale(${popS(tickAge, 5).toFixed(3)})` }}>
                      <Check s={19} col={rgba(GREEN, 1)} sw={3.2} />
                    </div>
                  ) : null}
                </div>
              );
            })}
            {/* review scan bar */}
            {scan > 0 && scan < 1 ? <div style={{ position: "absolute", left: 0, right: 0, top: DHEAD + scan * (DH - DHEAD) - 3, height: 6, background: `linear-gradient(90deg, rgba(0,0,0,0), ${rgba(ICE, 0.95)}, rgba(0,0,0,0))`, boxShadow: `0 0 18px ${rgba(CYAN, 0.9)}` }} /> : null}
            {mv > 0 ? <div style={{ position: "absolute", inset: 0, background: rgba(PURPLE, 0.35 * mv) }} /> : null}
          </div>
        </div>
      ) : null}

      {/* ── the pull-request card ── */}
      <div
        style={{
          position: "absolute",
          left: CARD.x,
          top: CARD.y,
          width: CARD.w,
          height: CARD.h,
          opacity: appear,
          transform: `translateY(${(bob + 5 * hit).toFixed(2)}px) scale(${(cardS * (1 + 0.012 * hit)).toFixed(4)}, ${(cardS * (1 - 0.03 * hit)).toFixed(4)})`,
        }}
      >
        <div style={{ position: "absolute", inset: 0, ...glass(cardAcc, cardStrength), borderRadius: 30, overflow: "hidden", border: `1px solid ${merged > 0.5 ? rgba(PURPLE, 0.55) : "rgba(255,255,255,0.11)"}` }}>
          <div style={{ position: "absolute", left: 22, top: 22 }}>
            <Logo name="github" size={72} draw={iv(t, [2, 18], [0, 1], EASE_OUT)} glow={0.3 + 0.4 * mergeGlow} glowColor={merged > 0.5 ? "163,113,247" : "34,211,238"} />
          </div>
          <div style={{ position: "absolute", left: 114, top: 22, fontFamily: fontInter, fontWeight: 800, fontSize: 33, letterSpacing: "-0.02em", color: B.white, whiteSpace: "nowrap" }}>Ajoute le login</div>
          <div style={{ position: "absolute", left: 114, top: 70, display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
            {isM ? <MergeIcon s={22} col="#C4A5FF" /> : <PrIcon s={22} col={rgba(GREEN, 1)} />}
            <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 21, color: B.text2 }}>#42</span>
            <span style={{ padding: "2px 10px", borderRadius: 10, border: `1px solid ${rgba(CYAN, 0.5)}`, fontFamily: fontMono, fontWeight: 500, fontSize: 18, color: "#A5F3FC" }}>feature → main</span>
          </div>
          <div style={{ position: "absolute", left: 20, right: 20, top: 116, height: 1, background: "rgba(255,255,255,0.1)" }} />
          {/* counters: seen + comments */}
          <div style={{ position: "absolute", left: 24, top: 130, display: "flex", alignItems: "center", gap: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: iv(t, [V + 2, V + 10], [0.35, 1]) }}>
              <EyeIcon s={30} open={1} look={[0, 0]} col={B.cyan} />
              <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 25, color: B.white, display: "inline-block", transform: `scale(${(1 + 0.3 * (nSeen > 0 ? decay(t - SEEN_AT[nSeen - 1], 6) : 0)).toFixed(3)})` }}>{nSeen}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: iv(t, [C + 2, C + 10], [0.35, 1]) }}>
              <ChatIcon s={27} col={B.cyan} />
              <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 25, color: B.white, display: "inline-block", transform: `scale(${(1 + 0.3 * (nCom > 0 ? decay(t - COM_AT[nCom - 1], 6) : 0)).toFixed(3)})` }}>{nCom}</span>
            </div>
          </div>
          {/* waiting for review (the stamp covers it) */}
          <div style={{ position: "absolute", left: 262, top: 136, display: "flex", alignItems: "center", gap: 9, opacity: (1 - iv(stampAge, [0, 6], [0, 1])) * iv(t, [10, 20], [0, 0.85]), whiteSpace: "nowrap" }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, border: `2px solid ${B.text3}`, boxShadow: `0 0 ${(4 + 6 * (0.5 + 0.5 * Math.sin(t * 0.12))).toFixed(1)}px rgba(226,236,250,0.4)` }} />
            <span style={{ fontFamily: fontInter, fontWeight: 600, fontSize: 20, color: B.text3 }}>relecture en attente</span>
          </div>
          {/* status pill: Open → Merged (purple) */}
          <div style={{ position: "absolute", left: pillX, top: BTN.y, width: pillW, height: BTN.h, transform: `scaleY(${fy.toFixed(4)}) scale(${pillPop.toFixed(4)})` }}>
            {!isM ? (
              <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: rgba(GREEN, 0.16), border: `1.5px solid ${rgba(GREEN, 0.75)}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
                <PrIcon s={22} col={rgba(GREEN, 1)} />
                <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 23, color: "#C7F9E3" }}>Open</span>
              </div>
            ) : (
              <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: `linear-gradient(140deg, ${rgba(PURPLE, 1)}, ${rgba(PURPLE_D, 1)})`, border: "1.5px solid rgba(255,255,255,0.4)", boxShadow: `0 0 ${(18 + 30 * mergeGlow + 6 * Math.sin(t * 0.08)).toFixed(1)}px ${rgba(PURPLE, 0.75)}, inset 0 1px 0 rgba(255,255,255,0.4)`, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <MergeIcon s={24} col="#FFFFFF" />
                <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 25, color: "#FFFFFF" }}>Merged</span>
              </div>
            )}
          </div>
          {/* merge button: dim → amber (approved) → pressed → gone */}
          {btnGone < 1 ? (
            <div style={{ position: "absolute", left: BTN.x, top: BTN.y, width: BTN.w, height: BTN.h, opacity: 1 - btnGone, transform: `scale(${((1 - 0.1 * press) * (1 - 0.4 * btnGone)).toFixed(4)})` }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: "rgba(148,163,184,0.12)", border: "1.5px solid rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, opacity: 1 - en }}>
                <MergeIcon s={22} col="rgba(226,236,250,0.4)" />
                <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 23, color: "rgba(226,236,250,0.4)" }}>Merge</span>
              </div>
              {en > 0.01 ? (
                <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: `linear-gradient(140deg, ${rgba(AMBER, 0.95)}, rgba(217,119,6,0.95))`, border: "1.5px solid rgba(255,231,184,0.85)", boxShadow: `0 0 ${(16 + 12 * (0.5 + 0.5 * Math.sin(t * 0.14)) + 30 * press).toFixed(1)}px ${rgba(AMBER, 0.6)}, inset 0 1px 0 rgba(255,255,255,0.5)`, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, opacity: en }}>
                  <MergeIcon s={22} col="#2A1600" />
                  <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 23, color: "#2A1600" }}>Merge</span>
                </div>
              ) : null}
              {press > 0.01 ? <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: "rgba(255,248,230,0.9)", opacity: 0.6 * press }} /> : null}
            </div>
          ) : null}
          {/* sheen on the stamp landing and on the merge */}
          {[stampAge, t - FLIP].map((a, i) =>
            a >= 0 && a < 18 ? <div key={i} style={{ position: "absolute", top: -60, bottom: -60, width: 90, left: -120 + (a / 18) * (CARD.w + 240), transform: "skewX(-20deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.2), rgba(255,255,255,0))" }} /> : null,
          )}
        </div>
      </div>

      {/* ── APPROVED stamp ── */}
      {t >= R + 2 ? (
        <div style={{ position: "absolute", left: STAMP_C[0] - 152, top: STAMP_C[1] - 38 + bob + 5 * hit, width: 304, height: 76, opacity: clamp01(sf * 3), transform: `rotate(${stampRot.toFixed(2)}deg) scale(${stampS.toFixed(4)})`, filter: stampAge < 0 ? `blur(${((1 - sf) * 5).toFixed(1)}px)` : undefined }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 14,
              border: `5px solid ${rgba(GREEN, 0.95)}`,
              background: "linear-gradient(140deg, rgba(10,58,44,0.92), rgba(6,34,28,0.9))",
              boxShadow: `0 0 ${(22 + 40 * hit).toFixed(0)}px ${rgba(GREEN, 0.55)}, inset 0 0 18px ${rgba(GREEN, 0.25)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", inset: 5, borderRadius: 8, border: `2px solid ${rgba(GREEN, 0.6)}` }} />
            <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 34, letterSpacing: "0.07em", color: "#D1FAE5", textShadow: `0 0 16px ${rgba(GREEN, 0.9)}` }}>APPROVED</span>
            <Check s={32} col="#6EE7B7" sw={3.6} />
            {stampGlint >= 0 ? <div style={{ position: "absolute", top: -30, bottom: -30, width: 60, left: -80 + stampGlint * 400, transform: "skewX(-20deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.45), rgba(255,255,255,0))" }} /> : null}
          </div>
        </div>
      ) : null}

      {/* ── « seen » / « comment » pings flying into the card's counters ── */}
      <svg width={760} height={760} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {[...AV.map((a, k) => ({ s: a.eye, e: EYE_CNT, a0: V + 5 * k + PING0, col: a.tint, key: `v${k}` })), ...BUB.map((b, k) => ({ s: [b.x + (b.tail === "left" ? 30 : b.w - 40), b.y + b.h] as P2, e: COM_CNT, a0: C + 2 + 10 * k + 4, col: CYAN, key: `c${k}` }))].map((pg) => {
          const p = (t - pg.a0) / PING;
          if (p <= 0 || p >= 1) return null;
          const e: P2 = [pg.e[0], pg.e[1] + bob];
          const c: P2 = [(pg.s[0] + e[0]) / 2, Math.min(pg.s[1], e[1]) - 50];
          return [0, 0.07, 0.14, 0.21].map((d, j) => {
            const q = qb(pg.s, c, e, clamp01(EASE_IN_OUT(p) - d));
            return <circle key={`${pg.key}-${j}`} cx={q[0]} cy={q[1]} r={j === 0 ? 8 : 6 - j * 1.3} fill={j === 0 ? "#FFFFFF" : rgba(pg.col, 0.6 - j * 0.15)} stroke={j === 0 ? rgba(pg.col, 1) : "none"} strokeWidth={3} style={j === 0 ? { filter: `drop-shadow(0 0 8px ${rgba(pg.col, 1)})` } : undefined} />;
          });
        })}
      </svg>
      {AV.map((a, k) => {
        const age = t - (V + 5 * k);
        if (age < 0) return null;
        const s = popS(age);
        const h = t - (DOT + 4 + 5 * k);
        const hop = h >= 0 && h < 18 ? -Math.sin((h / 18) * Math.PI) * 16 : 0;
        const by = Math.sin(t * 0.07 + k * 1.9) * 5 + hop;
        const bAge = k < 2 ? t - (C + 2 + 10 * k) : -1;
        const talk = decay(bAge, 8);
        const rev = k === 2 ? decay(stampAge, 10) : 0;
        const ring = Math.max(talk, rev);
        const ringCol = k === 2 && rev > 0.05 ? GREEN : a.tint;
        const bl = (g + k * 37) % 120;
        const blink = age > 30 && bl < 7 ? Math.max(0.08, Math.abs(bl - 3.5) / 3.5) : 1;
        const open = iv(age, [5, 12], [0.08, 1], EASE_OUT) * blink;
        const dx = target[0] - a.eye[0];
        const dy = target[1] - a.eye[1];
        const dl = Math.max(1, Math.hypot(dx, dy));
        const look: P2 = [(dx / dl) * 3.2, (dy / dl) * 3.2];
        const es = popS(age - 4, 7);
        const revOk = k === 2 ? stampAge : -1;
        return (
          <React.Fragment key={k}>
            <div
              style={{
                position: "absolute",
                left: a.x - AR,
                top: a.y - AR + by,
                width: AR * 2,
                height: AR * 2,
                borderRadius: AR,
                background: "radial-gradient(circle at 40% 30%, rgba(30,50,90,0.95), rgba(8,14,32,0.95))",
                border: `3px solid ${rgba(ringCol, 0.7 + 0.3 * ring)}`,
                boxShadow: `0 0 ${14 + 26 * ring}px ${rgba(ringCol, 0.5 + 0.4 * ring)}, 0 10px 24px rgba(0,0,0,0.5)`,
                transform: `scale(${(s * (1 + 0.08 * ring)).toFixed(3)})`,
                overflow: "hidden",
              }}
            >
              <Person tint={a.tint} />
            </div>
            {/* eye badge */}
            <div
              style={{
                position: "absolute",
                left: a.eye[0] - 21,
                top: a.eye[1] - 21 + by,
                width: 42,
                height: 42,
                borderRadius: 21,
                background: "linear-gradient(150deg, #1B3260, #0B1630)",
                border: `2px solid ${rgba(a.tint, 0.85)}`,
                boxShadow: `0 0 14px ${rgba(a.tint, 0.55)}, 0 6px 14px rgba(0,0,0,0.5)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${es.toFixed(3)})`,
              }}
            >
              <EyeIcon s={30} open={open} look={look} col={rgba(a.tint, 1)} />
            </div>
            {/* reviewer's ✓ */}
            {revOk >= 0 ? (
              <div style={{ position: "absolute", left: a.x - AR - 4, top: a.y + AR * 0.25 + by, width: 30, height: 30, borderRadius: 15, background: B.ok, border: "2.5px solid #04121A", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${popS(revOk, 6).toFixed(3)})` }}>
                <Check s={16} col="#04121A" sw={3} />
              </div>
            ) : null}
          </React.Fragment>
        );
      })}

      {/* ── comment bubbles ── */}
      {BUB.map((b, k) => {
        const age = t - (C + 2 + 10 * k);
        if (age < 0) return null;
        const s = popS(age, 9);
        const by = Math.sin(t * 0.06 + k * 2.4) * 3.5;
        const left = b.tail === "left";
        return (
          <div key={k} style={{ position: "absolute", left: b.x, top: b.y + by, width: b.w, height: b.h, opacity: clamp01(s * 2), transform: `scale(${s.toFixed(4)})`, transformOrigin: left ? "10% 120%" : "90% 120%" }}>
            <svg width={30} height={24} viewBox="0 0 30 24" style={{ position: "absolute", top: b.h - 3, left: left ? 8 : b.w - 38, overflow: "visible" }}>
              <path d={left ? "M4 0 L0 22 L26 0 Z" : "M4 0 L30 22 L26 0 Z"} fill="#10203F" stroke={rgba(CYAN, 0.55)} strokeWidth={1.5} strokeLinejoin="round" />
              <path d={left ? "M5.5 -2 L25 -2" : "M5 -2 L24.5 -2"} stroke="#10203F" strokeWidth={4} />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 22,
                background: "linear-gradient(160deg, #1B3260, #10203F)",
                border: `1.5px solid ${rgba(CYAN, 0.55)}`,
                boxShadow: `0 0 ${(18 + 26 * decay(age, 10)).toFixed(0)}px ${rgba(CYAN, 0.35)}, 0 10px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.25)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                whiteSpace: "nowrap",
              }}
            >
              {k === 0 ? (
                <>
                  <ThumbUp s={30} />
                  <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 29, color: B.white }}>top</span>
                </>
              ) : (
                <span style={{ fontFamily: fontInter, fontWeight: 700, fontSize: 24, color: B.white }}>
                  petit souci <span style={{ fontFamily: fontMono, fontWeight: 700, color: "#A5F3FC" }}>ligne 12</span>
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* ── cursor pressing Merge ── */}
      {cOp > 0.01 ? (
        <>
          {clickAge >= 0 && clickAge < 18 ? <div style={{ position: "absolute", left: BTN_C[0] - 14 - clickAge * 5, top: BTN_C[1] - 14 - clickAge * 5, width: 28 + clickAge * 10, height: 28 + clickAge * 10, borderRadius: "50%", border: `3px solid ${rgba(AMBER, 0.9 * (1 - clickAge / 18))}` }} /> : null}
          <svg width={30} height={40} viewBox="0 0 20 28" style={{ position: "absolute", left: cPos[0] - 3, top: cPos[1] - 3, opacity: cOp, overflow: "visible", transform: `scale(${(1 - 0.15 * press).toFixed(3)})`, transformOrigin: "3px 3px", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.6))" }}>
            <path d="M2 2 L2 22 L7.5 17 L11 25.5 L14.5 24 L11 15.8 L18.5 15.8 Z" fill="#FFFFFF" stroke="#04121A" strokeWidth={1.6} strokeLinejoin="round" />
          </svg>
        </>
      ) : null}

      <Shockwave age={stampAge} x={STAMP_C[0]} y={STAMP_C[1]} col={GREEN} dur={22} strength={0.7} maxR={240} r0={90} />
      <AnamorphicFlare age={t - A} x={BTN_C[0]} y={BTN_C[1]} col={AMBER} dur={22} strength={0.4} size={80} streakH={50} />
      <Shockwave age={mergeAge} x={MX} y={MY} col={PURPLE} dur={24} strength={0.85} maxR={260} r0={24} />
      <AnamorphicFlare age={mergeAge} x={MX} y={MY} col={PURPLE} dur={30} strength={0.7} size={110} streakH={70} />
    </div>
  );
};
