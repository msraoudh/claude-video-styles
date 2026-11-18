import React from "react";
import { AbsoluteFill } from "remotion";
import type { Archetype } from "..";
import { fontInter, fontMono } from "../../kit/fonts";
import { B } from "../../lib/look";
import { beatFor, beatsFor } from "../../lib/episode";
import { beatPulse, useGlobalFrame } from "../../lib/sync";
import { AMBER, CheckGlyph, clamp01, CYAN, EIO, EO, frType, Grade, inter, kick, kickAny, lin, mix, mono, NodeGlyph, OK, Particles, rgba, Shell, Shock, Streak, textW, World } from "./fx";

/**
 * archetype « incident » — a calm, premium mini production incident (no red, no alarm drama).
 *   data = { timeline: [{ time, text (≤ 36 chars), tone: "warn" | "ok" | "info", on? }] (2–4, max 5),
 *            lesson?: { text, on? }, title?: string (default « Incident »), where?: string (default « prod ») }
 * A glass incident card (header: status pill) whose log GROWS one event per word: the rail draws to the new dot, the row
 * lands with a tone flash — warn = amber (breathing dot), ok = emerald (check drawn), info = cyan. When an `ok` event
 * lands, every earlier warn row HEALS (amber → muted check, the brand intro's CrashLoopBackOff → Running moment), an
 * emerald wave climbs the rail and the status pill flips « en cours » → « résolu ✓ ». The lesson closes the scene as
 * a cyan glass « À RETENIR » card under the log (the log steps back). `code` in backticks, flags (-tulpn), :ports and
 * paths render in mono cyan.
 */
type Ev = { time?: string; text?: string; tone?: string; on?: string };
type IncData = { timeline?: Ev[]; lesson?: { text?: string; on?: string } | string; title?: string; where?: string };
type Tok = { w: string; code: boolean };

const CX = 524;
const W = 832;
const TOP = 262;
const BOTTOM = 1265;

const isCodeWord = (w: string, next?: string) =>
  /^-{1,2}[a-z]/i.test(w) || (/^[:/$~]/.test(w) && /\w/.test(w)) || /[=_/\\]|\.\w+\(|^\w+\.\w{2,4}$/.test(w) || (!!next && /^-{1,2}[a-z]/i.test(next) && /^[a-z][a-z0-9._-]{0,14}$/.test(w));

/** words with a code flag; `backticks` mark code explicitly */
const tokenize = (text: string): Tok[] => {
  const out: Tok[] = [];
  const parts = String(text ?? "").split(/`([^`]+)`/);
  parts.forEach((p, i) => {
    const ws = p.split(/[ \t\n]+/).filter(Boolean);
    ws.forEach((w, j) => out.push({ w, code: i % 2 === 1 || isCodeWord(w, ws[j + 1]) }));
  });
  return out;
};
const tokW = (tk: Tok, fs: number, weight: number) => (tk.code ? textW(tk.w, fs * 0.9, 700, "mono") : textW(tk.w, fs, weight, "inter", -0.015));
const wrapToks = (toks: Tok[], fs: number, maxW: number, weight: number) => {
  const lines: Tok[][] = [];
  let cur: Tok[] = [];
  let cw = 0;
  const sp = fs * 0.27;
  for (const tk of toks) {
    const w = tokW(tk, fs, weight);
    if (cur.length && cw + sp + w > maxW) {
      lines.push(cur);
      cur = [tk];
      cw = w;
    } else {
      cw += (cur.length ? sp : 0) + w;
      cur.push(tk);
    }
  }
  if (cur.length) lines.push(cur);
  if (lines.length === 2 && toks.length > 2) {
    const lw = (l: Tok[]) => l.reduce((a, tk, i) => a + tokW(tk, fs, weight) + (i ? sp : 0), 0);
    let best = lines;
    let bw = Math.max(lw(lines[0]), lw(lines[1]));
    for (let k = 1; k < toks.length; k++) {
      const a = toks.slice(0, k);
      const b = toks.slice(k);
      const w = Math.max(lw(a), lw(b));
      if (w <= maxW && w < bw - 0.5) {
        bw = w;
        best = [a, b];
      }
    }
    return best;
  }
  return lines;
};
const fitToks = (toks: Tok[], max: number, min: number, maxW: number, maxLines: number, weight: number) => {
  let fs = max;
  for (let k = 0; k < 30; k++) {
    const lines = wrapToks(toks, fs, maxW, weight);
    const widest = Math.max(0, ...lines.map((l) => l.reduce((a, tk, i) => a + tokW(tk, fs, weight) + (i ? fs * 0.27 : 0), 0)));
    if ((lines.length <= maxLines && widest <= maxW) || fs <= min) return { fs, lines };
    fs = Math.max(min, fs * 0.95);
  }
  return { fs, lines: wrapToks(toks, fs, maxW, weight) };
};
/** prefer ONE line when it still reads big (≥ 82 % of max), else the largest size on ≤ maxLines */
const fitPref = (toks: Tok[], max: number, min: number, maxW: number, maxLines: number, weight: number) => {
  const one = fitToks(toks, max, Math.max(min, max * 0.82), maxW, 1, weight);
  const w = one.lines[0]?.reduce((a, tk, i) => a + tokW(tk, one.fs, weight) + (i ? one.fs * 0.27 : 0), 0) ?? 0;
  if (one.lines.length === 1 && w <= maxW) return one;
  return fitToks(toks, max, min, maxW, maxLines, weight);
};
const Rich: React.FC<{ lines: Tok[][]; fs: number; weight: number; color: string; code?: string; lh?: number }> = ({ lines, fs, weight, color, code = B.cyan, lh = 1.22 }) => (
  <>
    {lines.map((ln, i) => (
      <div key={i} style={{ fontFamily: fontInter, fontWeight: weight, fontSize: fs, lineHeight: lh, letterSpacing: "-0.015em", color, whiteSpace: "nowrap" }}>
        {ln.map((tk, j) => (
          <React.Fragment key={j}>
            {j ? " " : ""}
            {tk.code ? <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: fs * 0.9, color: code, letterSpacing: 0 }}>{tk.w}</span> : tk.w}
          </React.Fragment>
        ))}
      </div>
    ))}
  </>
);

const TONE = { warn: AMBER, ok: OK, info: CYAN } as const;
type Tone = keyof typeof TONE;
const toneOf = (s?: string): Tone => (s === "ok" || s === "warn" || s === "info" ? s : s === "fix" || s === "success" ? "ok" : s === "alert" || s === "error" ? "warn" : "info");
const toneHex = (t: Tone) => (t === "warn" ? B.amber : t === "ok" ? B.ok : B.cyan);

/** a small bulb glyph for « à retenir » */
const Bulb: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: "block" }}>
    <path d="M24 46 C24 40 16 36 16 25 C16 16 23.2 9 32 9 C40.8 9 48 16 48 25 C48 36 40 40 40 46 Z" fill="none" stroke={color} strokeWidth={5} strokeLinejoin="round" />
    <path d="M25 53 H39 M28 59 H36" stroke={color} strokeWidth={5} strokeLinecap="round" />
  </svg>
);

export const Incident: Archetype = ({ spec }) => {
  const g = useGlobalFrame();
  const d: IncData = spec.data ?? {};
  const t = g - spec.from;
  const dur = Math.max(1, spec.to - spec.from);
  const evs = (Array.isArray(d.timeline) ? d.timeline : [])
    .filter((e) => e && String(e.text ?? "").trim() !== "")
    .slice(0, 5)
    .map((e) => ({ time: frType(String(e.time ?? "").trim()), text: frType(String(e.text).trim()), tone: toneOf(e.tone), on: e.on }));
  const n = evs.length;
  const lesson = typeof d.lesson === "string" ? { text: d.lesson } : d.lesson;
  const lessonText = lesson?.text ? frType(String(lesson.text).trim()) : "";
  const title = frType(String(d.title ?? "Incident"));
  const where = d.where === "" ? "" : frType(String(d.where ?? "prod"));

  // ── beats (every row lands on its word; the lesson after the last row)
  const beats = n ? beatsFor(spec, evs, 10) : [];
  const lastB = beats[n - 1] ?? spec.from + 6;
  let lb = lessonText ? beatFor(spec, lesson, n, n + 1) : Infinity;
  if (lessonText) lb = Math.min(Math.max(lb, lastB + 12), Math.max(lastB + 6, spec.to - 14));
  const okIdx = evs.findIndex((e, i) => e.tone === "ok" && evs.slice(0, i).some((p) => p.tone === "warn"));
  const okB = okIdx >= 0 ? beats[okIdx] : Infinity;

  // ── layout
  const RAIL_X = 58;
  const timeFs = 30;
  const ROW_PAD = 26;
  const PILL_H = 48;
  const DOT_Y = ROW_PAD + PILL_H / 2;
  const timeW = Math.min(250, Math.max(110, ...evs.map((e) => (e.time ? textW(e.time, timeFs, 700, "mono") + 34 : 0))));
  const hasTime = evs.some((e) => e.time);
  const textX = 96 + (hasTime ? timeW + 22 : 0);
  const textMaxW = W - textX - 34;
  const fits = evs.map((e) => fitPref(tokenize(e.text), 46, 34, textMaxW, 2, 700));
  const rowH = fits.map((f) => Math.max(ROW_PAD * 2 + PILL_H, f.lines.length * f.fs * 1.22 + ROW_PAD * 2 - 2));
  const GAP = 12;
  const HEAD = 150;
  const cardFinal = HEAD + 18 + rowH.reduce((a, b) => a + b, 0) + GAP * Math.max(0, n - 1) + 28;
  const lesFit = lessonText ? fitPref(tokenize(lessonText), 58, 38, W - 90, 2, 800) : null;
  const lesH = lesFit ? 100 + lesFit.lines.length * lesFit.fs * 1.14 + 44 : 0;
  const LGAP = 28;
  const total = cardFinal + (lesFit ? LGAP + lesH : 0);
  const s = Math.min(1, (BOTTOM - TOP) / total);

  // growing log: each row opens 4 frames before its beat
  const grow = beats.map((b) => EO(clamp01((g - b + 5) / 13)));
  const rowTop: number[] = [];
  let acc = HEAD + 18;
  evs.forEach((_, i) => {
    rowTop.push(acc);
    acc += (rowH[i] + GAP) * grow[i];
  });
  const cardH = Math.max(HEAD + 40, acc - (n ? GAP * grow[n - 1] : 0) + 28 * (n ? grow[0] : 0));
  // the stack re-centres smoothly as the log grows and the lesson arrives
  const lesGrow = lessonText ? EO(clamp01((g - lb + 6) / 16)) : 0;
  const curTotal = cardH + (lesFit ? (LGAP + lesH) * lesGrow : 0);
  const stackTop = Math.max(TOP, (TOP + BOTTOM) / 2 - (curTotal * s) / 2);

  // ── state
  const [status, statusAt] = ((): ["watch" | "warn" | "ok" | "post", number] => {
    let st: "watch" | "warn" | "ok" | "post" = "watch";
    let at = spec.from;
    for (let k = 0; k < n; k++) {
      if (g >= beats[k] && evs[k].tone !== "info") {
        st = evs[k].tone === "ok" ? "ok" : "warn";
        at = beats[k];
      }
    }
    if (g >= lb && st !== "ok") return ["post", lb];
    return [st, at];
  })();
  const heal = (k: number) => (evs[k].tone === "warn" && k < okIdx ? clamp01((g - (okB + 3 + k * 5)) / 8) : 0);
  const lesP = lessonText ? EO(clamp01((g - lb + 2) / 14)) : 0;
  const bp = beatPulse(g, 14);
  const hits = [...beats, ...(Number.isFinite(lb) ? [lb] : [])];
  const hit = kickAny(g, hits, 9);
  const shake = kickAny(g, beats.filter((_, k) => evs[k].tone === "warn"), 4);
  const sx = shake * 3 * Math.sin(g * 2.3);
  const sy = shake * 3 * Math.cos(g * 1.7);
  const push = 1 + 0.04 * EIO(clamp01(t / dur));
  const entry = clamp01((t + 2) / 10);
  const ep = EO(entry);
  const tilt = Math.sin(t * 0.018) * 1.2;
  const tiltX = Math.cos(t * 0.015) * 0.8;
  const dim = 1 - 0.38 * lesP;
  const breath = 0.55 + 0.45 * Math.sin(g * 0.18);

  const stTone = status === "ok" ? OK : status === "warn" ? AMBER : CYAN;
  const stHex = status === "ok" ? B.ok : status === "warn" ? B.amber : B.cyan;
  const stLabel = status === "ok" ? "résolu" : status === "warn" ? "en cours" : status === "post" ? "post-mortem" : "surveillance";
  const stKick = kick(g, statusAt, 7);

  const railTo = (k: number) => rowTop[k] + DOT_Y; // dot centre (card coords)
  const lastLanded = beats.reduce((m, b, k) => (g >= b - 8 ? k : m), -1);
  const railEnd = lastLanded >= 0 ? mix(lastLanded > 0 ? railTo(lastLanded - 1) : railTo(0), railTo(lastLanded), EO(clamp01((g - beats[lastLanded] + 8) / 8))) : railTo(0);

  // world-space anchor for global FX
  const cardScreenX = CX - (W * s) / 2;
  const toScreenY = (y: number) => stackTop + y * s;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <World g={g} t={t} hit={hit * 0.7} seed={5} warm={0} />
      <AbsoluteFill style={{ transform: `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) scale(${push.toFixed(4)})`, transformOrigin: `${CX}px 760px` }}>
        <div style={{ position: "absolute", left: CX - W / 2, top: stackTop, width: W, transform: `scale(${s.toFixed(4)})`, transformOrigin: "50% 0%" }}>
          {/* ── the incident card */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: W,
              height: cardH,
              transform: `translateY(${((1 - ep) * 34).toFixed(1)}px) scale(${((0.94 + 0.06 * ep) * (1 - 0.03 * lesP)).toFixed(4)}) perspective(2200px) rotateY(${tilt.toFixed(2)}deg) rotateX(${tiltX.toFixed(2)}deg)`,
              transformOrigin: "50% 0%",
              opacity: entry < 1 ? clamp01(entry * 1.8) : undefined,
              filter: entry < 1 ? `blur(${(12 * (1 - ep)).toFixed(2)}px)` : undefined,
            }}
          >
            <Shell w={W} h={cardH} tint={stTone} flash={Math.max(stKick * 0.8, kick(g, okB, 10))} glow={(0.75 + 0.35 * bp) * dim} sheen={lin(g, spec.from + 2, spec.from + 30)} lx={30 + Math.sin(t * 0.02) * 12} ly={8}>
              <div style={{ position: "absolute", inset: 0, opacity: dim }}>
                {/* header */}
                <div
                  style={{
                    position: "absolute",
                    left: 36,
                    top: 37,
                    width: 76,
                    height: 76,
                    borderRadius: 20,
                    background: rgba(stTone, 0.1),
                    border: `1px solid ${rgba(stTone, 0.32)}`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), 0 0 ${(22 + 26 * stKick).toFixed(1)}px ${rgba(stTone, 0.14 + 0.3 * stKick)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <NodeGlyph name={status === "ok" ? "check" : status === "warn" ? "warning" : "bell"} size={44} color={B.white} accent={stHex} />
                </div>
                <div style={{ position: "absolute", left: 134, top: 37, height: 76, display: "flex", alignItems: "center", whiteSpace: "nowrap", maxWidth: W - 134 - 270, overflow: "hidden" }}>
                  <span style={{ ...inter(54, 800), color: B.white, letterSpacing: "-0.035em" }}>{title}</span>
                  {where ? <span style={{ ...inter(36, 700), color: B.text2, marginLeft: 12 }}>· {where}</span> : null}
                </div>
                <div
                  style={{
                    position: "absolute",
                    right: 34,
                    top: 49,
                    height: 52,
                    padding: "0 20px",
                    borderRadius: 26,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    ...mono(25, 700),
                    color: stHex,
                    background: rgba(stTone, 0.1 + 0.06 * stKick),
                    border: `1px solid ${rgba(stTone, 0.42)}`,
                    transform: `scale(${(1 + 0.12 * stKick).toFixed(3)})`,
                    transformOrigin: "100% 50%",
                    whiteSpace: "nowrap",
                  }}
                >
                  {status === "ok" ? (
                    <CheckGlyph size={24} color={B.ok} stroke={3.6} p={clamp01((g - statusAt) / 10)} />
                  ) : (
                    <span style={{ width: 11, height: 11, borderRadius: 6, background: stHex, opacity: status === "warn" ? breath : 0.9, boxShadow: `0 0 10px ${rgba(stTone, 0.7)}` }} />
                  )}
                  {stLabel}
                </div>
                <div style={{ position: "absolute", left: 36, right: 36, top: HEAD, height: 1, background: "linear-gradient(90deg, rgba(255,255,255,0.13), rgba(255,255,255,0.03))" }} />

                {/* rail */}
                {n ? (
                  <svg width={W} height={Math.max(cardH, 10)} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                    <defs>
                      <filter id="inc-glow" x="-200%" y="-20%" width="500%" height="140%">
                        <feGaussianBlur stdDeviation={4} />
                      </filter>
                    </defs>
                    <line x1={RAIL_X} x2={RAIL_X} y1={railTo(0)} y2={railEnd} stroke={B.cyan} strokeWidth={7} opacity={0.35} filter="url(#inc-glow)" />
                    <line x1={RAIL_X} x2={RAIL_X} y1={railTo(0)} y2={railEnd} stroke={rgba(CYAN, 0.75)} strokeWidth={3} strokeLinecap="round" />
                    {/* light runner down the rail */}
                    {railEnd - railTo(0) > 30 ? (
                      <circle cx={RAIL_X} cy={mix(railTo(0), railEnd, ((t * 0.012) % 1 + 1) % 1)} r={4.5} fill="rgb(220,252,255)" opacity={0.85} />
                    ) : null}
                    {/* emerald wave climbing the rail when the fix lands */}
                    {Number.isFinite(okB) && g >= okB && g < okB + 24 ? (
                      <circle cx={RAIL_X} cy={mix(railTo(okIdx), railTo(0), EO((g - okB) / 24))} r={10} fill={rgba(OK, 0.9 * (1 - (g - okB) / 24))} filter="url(#inc-glow)" />
                    ) : null}
                  </svg>
                ) : null}

                {/* rows */}
                {evs.map((e, k) => {
                  const b = beats[k];
                  if (g < b - 6) return null;
                  const p = EO(clamp01((g - b + 4) / 13));
                  const h = heal(k);
                  const tone: Tone = e.tone;
                  const tc = h > 0.5 ? OK : TONE[tone];
                  const flash = kick(g, b, 10);
                  const healFlash = h > 0 ? kick(g, okB + 3 + k * 5, 8) : 0;
                  const isLive = tone === "warn" && h < 0.5;
                  const top = rowTop[k];
                  const textCol = h > 0.5 ? B.text2 : B.white;
                  return (
                    <div key={k} style={{ position: "absolute", left: 0, top, width: W, height: rowH[k], opacity: clamp01(p * 1.6), transform: `translateY(${((1 - p) * 18).toFixed(1)}px)`, filter: p < 0.999 ? `blur(${(10 * (1 - p)).toFixed(2)}px)` : undefined }}>
                      <div
                        style={{
                          position: "absolute",
                          left: 86,
                          right: 22,
                          top: 0,
                          bottom: 0,
                          borderRadius: 20,
                          background: h > 0.5 ? rgba(OK, 0.03 + 0.08 * healFlash) : tone === "info" ? "rgba(255,255,255,0.03)" : rgba(tc, 0.05 + 0.08 * flash),
                          border: `1px solid ${h > 0.5 ? rgba(OK, 0.12 + 0.35 * healFlash) : tone === "info" ? "rgba(255,255,255,0.07)" : rgba(tc, 0.2 + 0.4 * flash)}`,
                          boxShadow: `0 0 ${(26 * Math.max(flash, healFlash)).toFixed(1)}px ${rgba(tc, 0.35)}`,
                        }}
                      />
                      {/* dot on the rail */}
                      <div style={{ position: "absolute", left: RAIL_X - 15, top: DOT_Y - 17, width: 34, height: 34, borderRadius: 17, background: "rgba(6,12,28,0.95)", border: `2.5px solid ${toneHex(h > 0.5 ? "ok" : tone)}`, boxShadow: `0 0 ${(isLive ? 10 + 12 * breath : 12).toFixed(1)}px ${rgba(tc, isLive ? 0.4 + 0.4 * breath : 0.5)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {tone === "ok" || h > 0 ? (
                          <CheckGlyph size={22} color={B.ok} stroke={3.4} p={tone === "ok" ? clamp01((g - b) / 10) : h} />
                        ) : (
                          <span style={{ width: 10, height: 10, borderRadius: 5, background: toneHex(tone), opacity: isLive ? 0.6 + 0.4 * breath : 1 }} />
                        )}
                      </div>
                      {e.time ? (
                        <div
                          style={{
                            position: "absolute",
                            left: 106,
                            top: ROW_PAD,
                            height: PILL_H,
                            minWidth: timeW - 8,
                            padding: "0 14px",
                            boxSizing: "border-box",
                            borderRadius: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            ...mono(timeFs, 700),
                            color: h > 0.5 ? rgba(OK, 0.8) : toneHex(tone),
                            background: rgba(tc, 0.1),
                            border: `1px solid ${rgba(tc, 0.28)}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {e.time}
                        </div>
                      ) : null}
                      <div style={{ position: "absolute", left: textX + 14, top: ROW_PAD + (PILL_H - fits[k].fs * 1.22) / 2 }}>
                        <Rich lines={fits[k].lines} fs={fits[k].fs} weight={700} color={textCol} code={h > 0.5 ? B.text2 : B.cyan} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Shell>
          </div>

          {/* ── « à retenir » */}
          {lesFit && g >= lb - 4 ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: cardFinal + LGAP,
                width: W,
                height: lesH,
                transform: `translateY(${((1 - lesP) * 60).toFixed(1)}px) scale(${(0.92 + 0.08 * lesP).toFixed(4)})`,
                opacity: clamp01(lesP * 1.8),
                filter: lesP < 0.999 ? `blur(${(12 * (1 - lesP)).toFixed(2)}px)` : undefined,
              }}
            >
              <Shell w={W} h={lesH} tint={CYAN} flash={kick(g, lb, 12)} glow={1 + 0.4 * bp} sheen={lin(g, lb + 2, lb + 28)} lx={18} ly={20}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: `linear-gradient(180deg, ${B.amber}, ${rgba(AMBER, 0.4)})` }} />
                <div style={{ position: "absolute", left: 44, top: 34, display: "flex", alignItems: "center", gap: 14 }}>
                  <Bulb size={36} color={B.amber} />
                  <span style={{ ...inter(26, 700), letterSpacing: "0.18em", color: B.amber, textTransform: "uppercase" }}>À retenir</span>
                </div>
                <div style={{ position: "absolute", left: 44, top: 98 }}>
                  <Rich lines={lesFit.lines} fs={lesFit.fs} weight={800} color={B.white} lh={1.14} />
                </div>
              </Shell>
            </div>
          ) : null}
        </div>
        {/* event pings (screen space) */}
        {evs.map((e, k) => (
          <Shock key={k} g={g} at={beats[k]} x={cardScreenX + RAIL_X * s} y={toScreenY(rowTop[k] + DOT_Y)} r0={16} r1={120} dur={26} width={3} tint={TONE[e.tone]} count={1} />
        ))}
        {Number.isFinite(okB) ? <Shock g={g} at={okB} x={cardScreenX + RAIL_X * s} y={toScreenY(rowTop[okIdx] + DOT_Y)} r0={20} r1={260} dur={34} width={4} tint={OK} count={2} /> : null}
        <Particles t={t} front boost={hit} />
      </AbsoluteFill>
      <Grade />
      {Number.isFinite(okB) ? <Streak g={g} at={okB} dir={1} /> : null}
      {Number.isFinite(lb) ? <Streak g={g} at={lb} dir={-1} /> : null}
    </AbsoluteFill>
  );
};
