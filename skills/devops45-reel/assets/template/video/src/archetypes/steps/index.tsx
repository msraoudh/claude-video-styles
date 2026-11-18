import React from "react";
import type { Archetype } from "..";
import { B } from "../../lib/look";
import { beatsFor, speechSpan } from "../../lib/episode";
import { beatPulse, useGlobalFrame } from "../../lib/sync";
import { fontInter, fontMono } from "../../kit/fonts";
import { AMBER, balancedSplit, CheckGlyph, clamp, clamp01, CYAN, enter, EO, interWidth, kick, kickAny, lin, OK, pop, rgba, Shell, Stage } from "./stage";

/**
 * archetype « steps » — a numbered checklist / procedure.
 *
 * data = {
 *   heading?: string                        e.g. "3 réflexes" (digits are amber — the signal), ≤ ~28 chars
 *   items: [{ text: string, on?: word, sub?: string }]    2–5 items, text ≤ ~40 chars, sub ≤ ~44 chars
 * }
 * Empty slots (ghost outlines + dim numbers) are there from the start; each item lands on its word (glass, blur-in),
 * becomes the CURRENT step (cyan glow, spinner ring, rail fills to it), and is checked (green) when the next one lands;
 * the last one is checked near the end of the speech, then the counter turns « n/n ✓ ».
 */

const W = 870;
const LEFT = 70;
const PADX = 28;
/** sizes by item count: fewer items → bigger rows (the list must fill the hero zone on a phone) */
const tier = (n: number) =>
  n <= 2 ? { badge: 108, fmax: 64, rmin: 176, gap: 34, digit: 56, check: 66 } : n === 3 ? { badge: 100, fmax: 60, rmin: 164, gap: 30, digit: 52, check: 62 } : n === 4 ? { badge: 92, fmax: 54, rmin: 144, gap: 26, digit: 48, check: 58 } : { badge: 84, fmax: 50, rmin: 124, gap: 22, digit: 44, check: 56 };
const CY = 745;
const MAX_H = 1000;
const TRACK = -0.03;

type Item = { text: string; on?: string; sub?: string };

export const Steps: Archetype = ({ spec }) => {
  const g = useGlobalFrame();
  const d = (spec.data ?? {}) as Record<string, unknown>;
  const from = spec.from;
  const to = spec.to;
  const items: Item[] = (Array.isArray(d.items) ? d.items : [])
    .map((it) => (typeof it === "string" ? { text: it } : it && typeof it === "object" ? (it as Item) : null))
    .filter((it): it is Item => !!it && typeof it.text === "string" && it.text.trim().length > 0)
    .map((it) => ({ text: it.text.trim(), on: it.on, sub: typeof it.sub === "string" && it.sub.trim() ? it.sub.trim() : undefined }))
    .slice(0, 5);
  if (!items.length) items.push({ text: "…" });
  const n = items.length;
  const TI = tier(n);
  const BADGE = TI.badge;
  const CHECK = TI.check;
  const GAP = TI.gap;
  const TEXT_X = PADX + BADGE + 30;
  const TEXT_AVAIL = W - TEXT_X - CHECK - PADX - 24;
  const heading = typeof d.heading === "string" && d.heading.trim() ? d.heading.trim() : "";

  /* ── type sizes (deterministic width estimate; one size for every item) ── */
  const w1 = (s: string) => interWidth(s, 1, TRACK);
  const single = Math.min(...items.map((it) => TEXT_AVAIL / Math.max(0.01, w1(it.text))));
  let F: number;
  let wrap = false;
  if (single >= 38) F = Math.min(TI.fmax, Math.floor(single));
  else {
    wrap = true;
    const two = Math.min(...items.map((it) => TEXT_AVAIL / Math.max(0.01, Math.max(...balancedSplit(it.text, 2, w1).map(w1)))));
    F = clamp(Math.floor(two), 28, TI.fmax - 6);
  }
  const lines = items.map((it) => (wrap && w1(it.text) * F > TEXT_AVAIL ? balancedSplit(it.text, 2, w1) : [it.text]));
  const subF = (it: Item) => (it.sub ? Math.max(22, Math.min(Math.round(F * 0.62), Math.floor(TEXT_AVAIL / Math.max(0.01, interWidth(it.sub, 1, -0.01))))) : 0);
  const rowH = items.map((it, i) => Math.max(TI.rmin, Math.round(52 + lines[i].length * F * 1.16 + (it.sub ? subF(it) * 1.35 + 6 : 0))));
  const headF = heading ? clamp(Math.floor((W - 230) / Math.max(0.01, interWidth(heading, 1, -0.04))), 40, 92) : 0;
  const headH = heading ? Math.round(headF * 1.15) + 44 : 54;
  const total = headH + rowH.reduce((a, b) => a + b, 0) + GAP * (n - 1);
  const scale = Math.min(1, MAX_H / total);
  const T = clamp(CY - (total * scale) / 2, 250, 1250 - total * scale);

  /* ── timing ── */
  const beats = beatsFor(spec, items, 12).map((b) => clamp(b, from + 16, to - 30));
  for (let i = 1; i < n; i++) beats[i] = Math.max(beats[i], beats[i - 1] + 12);
  const [, sp1] = speechSpan(spec);
  const checks = beats.map((b, i) => (i < n - 1 ? Math.max(b + 14, beats[i + 1] - 4) : clamp(Math.max(b + 40, sp1 - 6), b + 14, to - 20)));
  const allDone = checks[n - 1];
  const cur = beats.reduce((c, b, i) => (g >= b ? i : c), -1);
  const doneN = checks.filter((c) => g >= c).length;

  const bp = beatPulse(g, 12);
  const hit = Math.min(1, 0.8 * kick(g, from + 1, 10) + 0.7 * kickAny(g, beats, 10) + 0.35 * kickAny(g, checks, 8) + 0.5 * kick(g, allDone, 12));

  // rows' y
  const ys: number[] = [];
  let y = headH;
  rowH.forEach((h) => {
    ys.push(y);
    y += h + GAP;
  });
  const cx = PADX + BADGE / 2; // rail x (row-local = group-local)
  const railTop = ys[0] + rowH[0] / 2;
  const railBot = ys[n - 1] + rowH[n - 1] / 2;
  // rail fill follows the current step (eased between beats)
  let railY = railTop;
  for (let i = 1; i < n; i++) railY += (ys[i] + rowH[i] / 2 - (ys[i - 1] + rowH[i - 1] / 2)) * EO(lin(g, beats[i] - 6, beats[i] + 8));
  const railOn = cur >= 0 ? 1 : 0;
  const finish = EO(lin(g, allDone, allDone + 16));

  return (
    <Stage spec={spec} g={g} cy={CY} hit={hit} uid={`steps-${spec.id}`}>
      <div style={{ position: "absolute", left: LEFT, top: T, width: W, height: total, transform: `scale(${scale.toFixed(4)})`, transformOrigin: "0px 0px" }}>
        {/* heading + counter */}
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: headH - 22, ...enter(g, from + 2, 16, 30, 12) }}>
          {heading ? (
            <div style={{ position: "absolute", left: 4, top: 0, fontFamily: fontInter, fontWeight: 800, fontSize: headF, lineHeight: `${Math.round(headF * 1.15)}px`, letterSpacing: "-0.04em", color: B.white, whiteSpace: "nowrap", textShadow: "0 6px 30px rgba(0,0,0,0.5)" }}>
              {heading.split(/(\d+)/).map((p, i) => (/^\d+$/.test(p) ? <span key={i} style={{ color: B.amber, textShadow: `0 0 26px ${rgba(AMBER, 0.45)}` }}>{p}</span> : <span key={i}>{p}</span>))}
            </div>
          ) : null}
          <Counter g={g} done={doneN} n={n} at={allDone} h={heading ? Math.round(headF * 1.15) : 54} />
          {/* segmented progress */}
          <div style={{ position: "absolute", left: 4, right: 4, top: heading ? Math.round(headF * 1.15) + 8 : 62, height: 6, display: "flex", gap: 8 }}>
            {items.map((_, i) => {
              const a = EO(lin(g, beats[i], beats[i] + 10));
              const dn = EO(lin(g, checks[i], checks[i] + 10));
              return (
                <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div style={{ width: `${(a * 100).toFixed(1)}%`, height: "100%", borderRadius: 3, background: dn > 0 ? `linear-gradient(90deg, ${B.ok}, ${rgba(OK, 0.7)})` : `linear-gradient(90deg, ${B.cyan}, ${rgba(CYAN, 0.6)})`, boxShadow: `0 0 ${(10 + 12 * finish).toFixed(1)}px ${dn > 0 ? rgba(OK, 0.6) : rgba(CYAN, 0.6)}` }} />
                </div>
              );
            })}
          </div>
        </div>
        {/* rail behind the rows */}
        <div style={{ position: "absolute", left: cx - 1.5, top: railTop, width: 3, height: railBot - railTop, borderRadius: 2, background: "rgba(255,255,255,0.1)", opacity: clamp01((g - from - 8) / 10) }} />
        <div style={{ position: "absolute", left: cx - 1.5, top: railTop, width: 3, height: Math.max(0, railY - railTop), borderRadius: 2, background: `linear-gradient(180deg, ${rgba(CYAN, 0.3)}, ${B.cyan})`, boxShadow: `0 0 12px ${rgba(CYAN, 0.7)}`, opacity: railOn }} />
        {items.map((it, i) => (
          <StepRow key={i} TI={TI} textX={TEXT_X} g={g} i={i} it={it} lines={lines[i]} F={F} subF={subF(it)} top={ys[i]} h={rowH[i]} beat={beats[i]} check={checks[i]} ghostAt={from + 8 + i * 4} current={cur === i && g < checks[i]} bp={bp} />
        ))}
      </div>
    </Stage>
  );
};

const Counter: React.FC<{ g: number; done: number; n: number; at: number; h: number }> = ({ g, done, n, at, h }) => {
  const fin = g >= at;
  const k = kick(g, at, 10);
  const pk = pop(g, at, 12);
  return (
    <div
      style={{
        position: "absolute",
        right: 4,
        top: (h - 54) / 2,
        height: 54,
        padding: "0 18px",
        borderRadius: 27,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: fin ? rgba(OK, 0.12) : "rgba(8,16,34,0.7)",
        border: `1px solid ${fin ? rgba(OK, 0.55) : rgba(CYAN, 0.3)}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 0 ${(18 + 30 * k).toFixed(1)}px ${fin ? rgba(OK, 0.35) : rgba(CYAN, 0.12)}`,
        transform: `scale(${(fin ? 0.9 + 0.1 * pk : 1).toFixed(3)})`,
        fontFamily: fontMono,
        fontWeight: 700,
        fontSize: 28,
        color: fin ? B.ok : B.white,
        fontVariantLigatures: "none",
      }}
    >
      {fin ? <CheckGlyph size={26} color={B.ok} stroke={3.8} p={lin(g, at + 2, at + 10)} /> : null}
      <span>{done}</span>
      <span style={{ color: fin ? rgba(OK, 0.7) : B.text3 }}>/{n}</span>
    </div>
  );
};

const StepRow: React.FC<{
  TI: ReturnType<typeof tier>;
  textX: number;
  g: number;
  i: number;
  it: Item;
  lines: string[];
  F: number;
  subF: number;
  top: number;
  h: number;
  beat: number;
  check: number;
  ghostAt: number;
  current: boolean;
  bp: number;
}> = ({ TI, textX, g, i, it, lines, F, subF, top, h, beat, check, ghostAt, current, bp }) => {
  const BADGE = TI.badge;
  const CHECK = TI.check;
  const TEXT_X = textX;
  const landed = g >= beat;
  const done = g >= check;
  const cp = pop(g, check, 12);
  const act = current ? EO(lin(g, beat, beat + 12)) : 0;
  const settle = EO(lin(g, check, check + 14));
  const sc = landed ? 1 + 0.02 * act * (1 - settle) : 1;
  const ghostA = clamp01((g - ghostAt) / 10) * (1 - clamp01((g - beat) / 6));
  const breath = 0.5 + 0.5 * Math.sin(g * 0.09 + i);
  const flash = landed ? Math.min(1, 0.7 * kick(g, beat, 9) + (current ? 0.22 + 0.25 * bp : 0) + 0.45 * kick(g, check, 9)) : 0;
  const ent = enter(g, beat, 16, 30, 14);
  const digit = String(i + 1);
  const textCol = done ? "rgba(236,242,252,0.86)" : B.white;
  return (
    <div style={{ position: "absolute", left: 0, top, width: W, height: h }}>
      {/* ghost slot */}
      {ghostA > 0.01 ? (
        <div style={{ position: "absolute", inset: 0, borderRadius: 30, border: "2px dashed rgba(148,190,255,0.24)", background: "rgba(148,190,255,0.025)", opacity: ghostA * (0.75 + 0.25 * breath) }}>
          <div style={{ position: "absolute", left: PADX - 2, top: (h - BADGE) / 2 - 2, width: BADGE, height: BADGE, borderRadius: 26, border: "1.5px solid rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontMono, fontWeight: 700, fontSize: TI.digit, color: "rgba(226,236,250,0.32)" }}>
            {digit}
          </div>
        </div>
      ) : null}
      {landed ? (
        <div style={{ position: "absolute", inset: 0, ...ent, transform: `${ent.transform} scale(${sc.toFixed(4)})`, transformOrigin: "62% 50%" }}>
          <Shell w={W} h={h} radius={30} flash={flash} sheen={lin(g, beat + 2, beat + 26)} lx={18 + i * 14} ly={20} glow={current ? 1.2 : 0.8} tint={done ? OK : CYAN}>
            {/* current-step light bar on the left edge */}
            <div style={{ position: "absolute", left: 0, top: 18, bottom: 18, width: 4, borderRadius: 2, background: done ? B.ok : B.cyan, opacity: Math.max(act * (1 - settle), 0.35 * settle), boxShadow: `0 0 14px ${done ? rgba(OK, 0.8) : rgba(CYAN, 0.8)}` }} />
            {/* number badge — amber digit, the signal */}
            <div
              style={{
                position: "absolute",
                left: PADX,
                top: (h - BADGE) / 2,
                width: BADGE,
                height: BADGE,
                borderRadius: Math.round(BADGE * 0.3),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(160deg, rgba(30,24,10,0.7), rgba(10,10,18,0.75))",
                border: `1.5px solid ${rgba(AMBER, 0.35 + 0.4 * act * (1 - settle))}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 0 ${(10 + 26 * act * (1 - settle) + 20 * kick(g, beat, 10)).toFixed(1)}px ${rgba(AMBER, 0.35)}`,
                transform: `scale(${(0.6 + 0.4 * pop(g, beat + 1, 12)).toFixed(3)})`,
              }}
            >
              <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: TI.digit, color: B.amber, textShadow: `0 0 18px ${rgba(AMBER, 0.55)}` }}>{digit}</span>
            </div>
            {/* text */}
            <div style={{ position: "absolute", left: TEXT_X, top: 0, height: h, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {lines.map((ln, k) => (
                <div key={k} style={{ fontFamily: fontInter, fontWeight: 800, fontSize: F, lineHeight: `${Math.round(F * 1.16)}px`, letterSpacing: `${TRACK}em`, color: textCol, whiteSpace: "nowrap" }}>
                  {ln}
                </div>
              ))}
              {it.sub ? (
                <div style={{ marginTop: 6, fontFamily: fontInter, fontWeight: 600, fontSize: subF, lineHeight: `${Math.round(subF * 1.35)}px`, color: B.text2, whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>{it.sub}</div>
              ) : null}
            </div>
            {/* status ring: spinner while current, green check when done */}
            <div style={{ position: "absolute", right: PADX, top: (h - CHECK) / 2, width: CHECK, height: CHECK }}>
              {!done ? (
                <svg width={CHECK} height={CHECK} viewBox="0 0 56 56" style={{ transform: `rotate(${((g - beat) * 6).toFixed(1)}deg)` }}>
                  <circle cx={28} cy={28} r={24} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={3} />
                  {current ? <circle cx={28} cy={28} r={24} fill="none" stroke={B.cyan} strokeWidth={3.5} strokeLinecap="round" strokeDasharray="38 113" style={{ filter: `drop-shadow(0 0 5px ${rgba(CYAN, 0.8)})` }} /> : null}
                </svg>
              ) : (
                <div
                  style={{
                    width: CHECK,
                    height: CHECK,
                    borderRadius: CHECK / 2,
                    background: B.ok,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 0 ${(12 + 26 * kick(g, check, 10)).toFixed(1)}px ${rgba(OK, 0.7)}`,
                    transform: `scale(${(0.4 + 0.6 * cp).toFixed(3)})`,
                  }}
                >
                  <CheckGlyph size={Math.round(CHECK * 0.64)} color={B.ink} stroke={4} p={lin(g, check + 2, check + 10)} />
                </div>
              )}
            </div>
          </Shell>
        </div>
      ) : null}
    </div>
  );
};
