import React from "react";
import { AbsoluteFill, spring } from "remotion";
import type { Archetype } from "..";
import type { SceneSpec } from "../../data/episode";
import { fontInter, fontMono } from "../../kit/fonts";
import { Icon } from "../../kit/Icon";
import { B } from "../../lib/look";
import { SPRING_POP } from "../../lib/motion";
import { beatPulse, useGlobalFrame } from "../../lib/sync";
import { Backdrop } from "../title/brand/Backdrop";
import { AMBER_HOT, AnamorphicFlare, clamp01, decay, EASE_IN, EASE_OUT, iv, Shockwave, smooth } from "../title/brand/fx";
import { epHandle, epPage, epTitle, keys, wordAt, words as sceneWords } from "../title/brand/meta";
import { RingTimer } from "../title/brand/RingTimer";
import { fitMono, textWidth, useFontsReady } from "../title/brand/text";

/**
 * archetype "cta" — the standard END CARD, identical every day (captions OFF: the big type carries the words).
 * Port of the brand intro's S6, every beat on its spoken word (fallbacks when a word is missing):
 *   « Abonne »  the AMBER « Abonne-toi » pill pops centre stage, a soft finger glides in · « -toi » the tap: press,
 *               ripple, « + » → « ✓ » · the pill glides down
 *   « Cloud » … « Community »  the ring timer lands at 00:00 + the cyan wordmark word by word; the handle types in;
 *               the recap chip of today's topic (`$ command` / title line) slides in
 *   « Une » « leçon » « par » « jour » · « 45 » (amber pop) « secondes » — « Une leçon par jour · 45 secondes »
 *   build       the ring counts 00:00 → 00:45 from « Cloud » to the final hit, warp streaks speed up, bloom rises
 *   KEY.finalHit (just after the last word) the ONE flash: the ring closes at 00:45 + chase light, shockwave,
 *               the card punches and locks (viewfinder brackets), sheen across the wordmark → hold + glow to the end.
 * data: {} (nothing needed). Optional: { recap?: string } to override the recap chip text.
 * Below y 1000 everything stays at x ≤ 940 (Instagram's icon column).
 */

const RING_Y = 520;
const RING_SIZE = 236;
const WM_W = 800;
const WM_Y = [790, 894];
const HANDLE_Y = 980;
const PILL_Y = 1100;
const ROW_Y = 1232;
const RECAP_Y = 1372;
const CONTENT_CY = 900;
const TR = -0.03;

type TT = {
  start: number; pill: number; tap: number; move: number; cloud: number; wm: number[]; handle: number; recap: number;
  une: number; lecon: number; par: number; jour: number; n45: number; secondes: number; hit: number; end: number;
};

/** every beat of the end card from the spoken words (monotonic, with fallbacks) */
const timing = (spec: SceneSpec, wmWords: string[]): TT => {
  const ws = sceneWords(spec);
  const a = ws.length ? ws[0].f : spec.from + 8;
  const S = spec.from;
  let last = S;
  const at = (keys: string[], fb: number, gap = 3) => {
    const f = wordAt(spec, keys, last);
    const v = Math.max(last + gap, f !== undefined ? f - 2 : fb);
    last = v;
    return v;
  };
  const abonne = wordAt(spec, ["abonne"]);
  const pill = Math.max(S, (abonne ?? Math.max(S + 6, a)) - 4);
  last = pill;
  const tap = at(["toi"], pill + 18, 10);
  const move = tap + 13;
  last = tap;
  const cloud = at([wmWords[0] ?? "cloud"], tap + 24, 8);
  const wm = [cloud];
  for (let i = 1; i < wmWords.length; i++) wm.push(at([wmWords[i]], last + 22, 6));
  const handle = last + 10;
  const recap = last + 20;
  const une = at(["une", "un", "1"], last + 46, 8);
  const lecon = at(["lecon"], une + 10);
  const par = at(["par"], lecon + 20);
  const jour = at(["jour"], par + 10);
  const n45f = wordAt(spec, ["45", "quarante"], jour);
  const sec = wordAt(spec, ["secondes"], jour);
  const n45 = Math.max(jour + 6, n45f !== undefined ? n45f - 2 : sec !== undefined ? sec - 22 : jour + 40);
  const secondes = Math.max(n45 + 8, sec !== undefined ? sec - 2 : n45 + 22);
  const k = keys();
  const lastFe = ws.length ? ws[ws.length - 1].fe : secondes + 30;
  const hit0 = k.finalHit > S && k.finalHit < spec.to ? k.finalHit : lastFe + 2;
  const hit = Math.min(spec.to - 12, Math.max(secondes + 8, hit0));
  return { start: S, pill, tap, move, cloud, wm, handle, recap, une, lecon, par, jour, n45, secondes, hit, end: spec.to };
};

/* ───────────────────────── wordmark ───────────────────────── */

const splitTwo = (words: string[]): string[][] => {
  if (words.length <= 1) return [words];
  let best = 1;
  let bestD = Infinity;
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return [words.slice(0, best), words.slice(best)];
};

const Wordmark: React.FC<{ g: number; T: TT; lines: string[][] }> = ({ g, T, lines }) => {
  const sheen = g >= T.hit ? iv(g - T.hit, [0, 22], [0, 1], EASE_OUT) : -1;
  let idx = 0;
  return (
    <>
      {lines.map((line, li) => {
        const em = textWidth(line.join(" "), 100, 800, false, TR) / 100;
        const size = Math.min(110, WM_W / Math.max(1, em));
        return (
          <div
            key={li}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: WM_Y[li],
              transform: "translateY(-50%)",
              display: "flex",
              justifyContent: "center",
              gap: `${(0.26 * size).toFixed(1)}px`,
              fontFamily: fontInter,
              fontWeight: 800,
              fontSize: size,
              lineHeight: 1,
              letterSpacing: `${TR}em`,
              whiteSpace: "nowrap",
            }}
          >
            {line.map((w, wi) => {
              const f = T.wm[idx++] ?? T.cloud;
              const a = g - f;
              if (a < 0) return <span key={wi} style={{ opacity: 0 }}>{w}</span>;
              const p = iv(a, [0, 9], [0, 1], EASE_OUT);
              const s0 = w.length > 6 ? 1.14 : 1.3;
              const s = s0 - (s0 - 1) * p;
              const hot = decay(a, 5);
              const pos = sheen < 0 ? 140 : 140 - 180 * sheen + wi * 12 + li * 18;
              return (
                <span
                  key={wi}
                  style={{
                    display: "inline-block",
                    transform: `scale(${s.toFixed(4)})`,
                    transformOrigin: wi === 0 ? "100% 55%" : "0% 55%",
                    opacity: iv(p, [0, 0.35], [0, 1]),
                    filter: p < 0.99 ? `blur(${((1 - p) * 12).toFixed(1)}px)` : undefined,
                    color: "transparent",
                    backgroundImage: `linear-gradient(100deg, ${B.cyan} 0%, ${B.cyan} 42%, #f2feff 50%, ${B.cyan} 58%, ${B.cyan} 100%)`,
                    backgroundSize: "260% 100%",
                    backgroundPosition: `${pos.toFixed(1)}% 0%`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    textShadow: `0 0 ${(26 + 40 * hot).toFixed(0)}px rgba(34,211,238,${(0.35 + 0.4 * hot).toFixed(3)})`,
                  }}
                >
                  {w}
                </span>
              );
            })}
          </div>
        );
      })}
    </>
  );
};

/* ───────────────────────── handle ───────────────────────── */

const Handle: React.FC<{ g: number; T: TT; text: string }> = ({ g, T, text }) => {
  const a = g - T.handle;
  if (a < 0) return null;
  const size = Math.min(34, (WM_W * 0.95) / (text.length * 0.6));
  const n = Math.min(text.length, Math.floor(a * 1.1) + 1);
  const typing = n < text.length;
  const blinkOn = typing || Math.floor(a / 16) % 2 === 0;
  const cursorA = g < T.une ? 1 : iv(g, [T.une, T.une + 10], [1, 0]);
  const cw = textWidth(text, size, 500, true) / Math.max(1, text.length);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: HANDLE_Y, transform: "translateY(-50%)", display: "flex", justifyContent: "center", fontFamily: fontMono, fontWeight: 500, fontSize: size, color: "rgba(232,240,250,0.86)", whiteSpace: "pre", textShadow: "0 2px 14px rgba(0,0,0,0.7)" }}>
      <span>{text.slice(0, n)}</span>
      <span style={{ opacity: 0 }}>{text.slice(n)}</span>
      <span style={{ position: "relative", display: "inline-block", width: 0 }}>
        <span style={{ position: "absolute", left: -((text.length - n) * cw) + 4, top: size * 0.12, width: size * 0.47, height: size * 1.1, borderRadius: 2, background: B.amber, boxShadow: `0 0 14px ${B.amberGlow}`, opacity: blinkOn ? cursorA : 0 }} />
      </span>
    </div>
  );
};

/* ───────────────────────── the amber action pill + the finger tap ───────────────────────── */

const pillPose = (g: number, T: TT) => {
  const inP = spring({ frame: g - T.pill, fps: 60, config: SPRING_POP });
  const mv = iv(g, [T.move, T.move + 22], [0, 1], EASE_OUT);
  const y = 960 + (PILL_Y - 960) * mv + (1 - inP) * 50;
  const s = (1.22 - 0.22 * mv) * (0.72 + 0.28 * inP);
  return { y, s, op: g < T.pill ? 0 : clamp01(inP * 1.6) };
};
const TAP_DX = 128;
const TAP_DY = 30;

const Pill: React.FC<{ g: number; T: TT }> = ({ g, T }) => {
  const { y, s, op } = pillPose(g, T);
  if (op <= 0) return null;
  const a = g - T.tap;
  const press = a < -3 ? 1 : a < 2 ? iv(a, [-3, 2], [1, 0.93]) : 0.93 + 0.07 * spring({ frame: a - 2, fps: 60, config: SPRING_POP });
  const flash = decay(a, 7);
  const tapped = a >= 0;
  const plusOut = iv(a, [0, 7], [0, 1], EASE_OUT);
  const check = iv(a, [4, 16], [0, 1], EASE_OUT);
  const hitGlow = decay(g - T.hit, 10);
  const breathe = 0.5 + 0.5 * Math.sin(g / 14);
  const glow = 0.4 + 0.15 * breathe + 0.6 * flash + 0.6 * hitGlow + 0.2 * beatPulse(g, 12);
  return (
    <div style={{ position: "absolute", left: 540, top: y, transform: `translate(-50%, -50%) scale(${(s * press).toFixed(4)})`, opacity: op }}>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 24,
          height: 118,
          padding: "0 58px 0 26px",
          borderRadius: 999,
          background: "linear-gradient(180deg, #FCC94A 0%, #F59E0B 52%, #E7890A 100%)",
          boxShadow: [
            "inset 0 2px 0 rgba(255,255,255,0.55)",
            "inset 0 -3px 0 rgba(120,60,0,0.35)",
            "0 0 0 1px rgba(255,214,140,0.55)",
            "0 22px 44px rgba(0,0,0,0.5)",
            `0 0 ${(60 + 50 * glow).toFixed(0)}px rgba(245,158,11,${(0.3 + 0.35 * glow).toFixed(3)})`,
          ].join(", "),
          filter: flash > 0.02 ? `brightness(${(1 + 0.35 * flash).toFixed(3)})` : undefined,
        }}
      >
        <div style={{ position: "relative", width: 68, height: 68, borderRadius: "50%", background: "#1A1003", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)" }}>
          <svg width={68} height={68} viewBox="0 0 68 68" style={{ position: "absolute", inset: 0 }}>
            <g transform={`rotate(${(90 * plusOut).toFixed(1)} 34 34) translate(34 34) scale(${(1 - plusOut).toFixed(3)}) translate(-34 -34)`} opacity={1 - plusOut}>
              <path d="M34 20 V48 M20 34 H48" stroke="#FBBF24" strokeWidth={6} strokeLinecap="round" fill="none" />
            </g>
            {tapped ? <path d="M21 35 L30 44 L48 25" stroke="#FBBF24" strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={42} strokeDashoffset={42 * (1 - check)} /> : null}
          </svg>
        </div>
        <div style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 54, letterSpacing: "-0.025em", color: "#170E02", whiteSpace: "nowrap", lineHeight: 1 }}>Abonne-toi</div>
      </div>
    </div>
  );
};

/** soft finger: a translucent touch disc that glides in, presses on « -toi », lifts and leaves */
const Finger: React.FC<{ g: number; T: TT }> = ({ g, T }) => {
  const a0 = Math.max(T.pill + 3, T.tap - 34);
  if (g < a0 || g > T.tap + 34) return null;
  const { y: py, s: ps } = pillPose(T.tap, T);
  const tx = 540 + TAP_DX * ps;
  const ty = py + TAP_DY * ps;
  const inP = iv(g, [a0, T.tap - 6], [0, 1], EASE_OUT);
  const outP = iv(g, [T.tap + 6, T.tap + 30], [0, 1], EASE_IN);
  const x = tx + (1 - inP) * 330 + outP * 360 - Math.sin(Math.PI * inP) * 40;
  const y = ty + (1 - inP) * 520 + outP * 260 + Math.sin(Math.PI * outP) * -60;
  const a = g - T.tap;
  const press = a < -3 ? 1 : a < 4 ? iv(a, [-3, 0, 4], [1, 0.78, 0.86]) : iv(a, [4, 10], [0.86, 1.05]);
  const op = iv(g, [a0, a0 + 8], [0, 1]) * (1 - outP);
  const ripple = a >= 0 ? iv(a, [0, 24], [0, 1], EASE_OUT) : -1;
  return (
    <>
      {ripple >= 0 && ripple < 1 ? (
        <div style={{ position: "absolute", left: tx, top: ty, width: 0, height: 0 }}>
          {[0, 1].map((k) => {
            const r = (40 + 300 * ripple) * (k ? 0.62 : 1);
            return (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: -r,
                  top: -r,
                  width: r * 2,
                  height: r * 2,
                  borderRadius: "50%",
                  border: `${k ? 2 : 3}px solid ${k ? "rgba(255,236,200,0.9)" : "rgba(252,201,74,0.95)"}`,
                  opacity: (1 - ripple) * (k ? 0.6 : 0.85),
                  boxShadow: k ? undefined : "0 0 24px rgba(245,158,11,0.6)",
                }}
              />
            );
          })}
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: 62,
          height: 62,
          transform: `translate(-50%, -50%) scale(${press.toFixed(3)})`,
          borderRadius: "50%",
          opacity: op,
          background: "radial-gradient(circle at 42% 38%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.42) 45%, rgba(255,255,255,0.16) 72%, rgba(255,255,255,0.05) 100%)",
          border: "2px solid rgba(255,255,255,0.75)",
          boxShadow: "0 10px 28px rgba(0,0,0,0.45), 0 0 26px rgba(255,255,255,0.25)",
        }}
      />
    </>
  );
};

/* ───────────────────────── « Une leçon par jour · 45 secondes » ───────────────────────── */

type Tok = { t: string; f: number; kind?: "dot" | "n45" };
const Row: React.FC<{ g: number; T: TT }> = ({ g, T }) => {
  const ROW: Tok[] = [
    { t: "Une", f: T.une },
    { t: "leçon", f: T.lecon },
    { t: "par", f: T.par },
    { t: "jour", f: T.jour },
    { t: "·", f: T.n45 - 3, kind: "dot" },
    { t: "45", f: T.n45, kind: "n45" },
    { t: "secondes", f: T.secondes },
  ];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: ROW_Y, transform: "translateY(-50%)", display: "flex", justifyContent: "center", alignItems: "baseline", gap: 15, fontFamily: fontInter, fontWeight: 700, fontSize: 50, letterSpacing: "-0.02em", color: B.white, whiteSpace: "nowrap", lineHeight: 1.2 }}>
      {ROW.map((k, i) => {
        const a = g - k.f;
        const p = a < 0 ? 0 : iv(a, [0, 10], [0, 1], EASE_OUT);
        if (k.kind === "n45") {
          const pop = a < 0 ? 0 : spring({ frame: a, fps: 60, config: SPRING_POP });
          const hot = decay(a, 8) + 0.8 * decay(g - T.hit, 10);
          return (
            <span key={i} style={{ display: "inline-block", fontWeight: 800, fontSize: 60, color: B.amber, opacity: clamp01(pop * 2), transform: `scale(${(0.4 + 0.6 * pop).toFixed(4)})`, transformOrigin: "50% 70%", textShadow: `0 0 ${(20 + 30 * hot).toFixed(0)}px rgba(245,158,11,${(0.5 + 0.4 * Math.min(1, hot)).toFixed(3)})`, marginLeft: 4 }}>
              {k.t}
            </span>
          );
        }
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              color: k.kind === "dot" ? B.cyan : B.white,
              opacity: iv(p, [0, 0.4], [0, 1]),
              transform: `translateY(${((1 - p) * 26).toFixed(1)}px)`,
              filter: p > 0 && p < 0.99 ? `blur(${((1 - p) * 8).toFixed(1)}px)` : undefined,
              textShadow: k.kind === "dot" ? `0 0 16px ${B.cyanGlow}` : "0 3px 16px rgba(0,0,0,0.7)",
              fontWeight: k.kind === "dot" ? 800 : 700,
            }}
          >
            {k.t}
          </span>
        );
      })}
    </div>
  );
};

/* ───────────────────────── recap chip: today's topic ───────────────────────── */

const Recap: React.FC<{ g: number; T: TT; command?: string; line?: string }> = ({ g, T, command, line }) => {
  if (!command && !line) return null;
  const p = iv(g - T.recap, [0, 14], [0, 1], EASE_OUT);
  if (p <= 0) return null;
  const hitGlow = decay(g - T.hit, 12);
  // « Leçon du jour » label + the command; a long command drops the label rather than shrinking below 30 px
  const labelW = textWidth("Leçon du jour", 32, 700, false);
  const withLabel = command ? textWidth(command + "$ ", 30, 700, true) <= 780 - labelW - 190 : textWidth(line ?? "", 30, 800, false) <= 780 - labelW - 150;
  const label = withLabel ? "Leçon du jour" : "";
  const maxText = 780 - (withLabel ? labelW : 0) - 150;
  const cmd = command ? fitMono(command, maxText - 40, 42, 24) : null;
  const ln = !command && line ? fitMono(line, maxText, 34, 22, 700) : null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: RECAP_Y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          transform: `translateY(calc(-50% + ${((1 - p) * 30).toFixed(1)}px)) scale(${(0.94 + 0.06 * p).toFixed(4)})`,
          opacity: iv(p, [0, 0.4], [0, 1]),
          filter: p < 0.99 ? `blur(${((1 - p) * 10).toFixed(1)}px)` : undefined,
          display: "flex",
          alignItems: "center",
          gap: 16,
          height: 88,
          padding: "0 30px 0 18px",
          borderRadius: 999,
          background: "linear-gradient(140deg, rgba(255,255,255,0.10), rgba(255,255,255,0.025))",
          border: "1px solid rgba(255,255,255,0.13)",
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 12px 32px rgba(0,0,0,0.45), 0 0 ${(30 + 40 * hitGlow).toFixed(0)}px rgba(34,211,238,${(0.14 + 0.25 * hitGlow).toFixed(3)})`,
          backdropFilter: "blur(14px) saturate(140%)",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ width: 54, height: 54, borderRadius: 27, background: "rgba(34,211,238,0.16)", border: "1px solid rgba(34,211,238,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="check" size={30} color={B.cyan} weight="bold" />
        </div>
        {label ? <span style={{ fontFamily: fontInter, fontWeight: 700, fontSize: 32, color: "rgba(226,236,250,0.78)", letterSpacing: "-0.01em" }}>{label}</span> : null}
        {cmd ? (
          <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: cmd.size, color: "#EAF6FF" }}>
            <span style={{ color: B.amber, textShadow: `0 0 12px ${B.amberGlow}` }}>$ </span>
            {cmd.text}
          </span>
        ) : ln ? (
          <span style={{ fontFamily: fontInter, fontWeight: 800, fontSize: ln.size, color: B.white }}>{ln.text}</span>
        ) : null}
      </div>
    </div>
  );
};

/* ───────────────────────── the lock: viewfinder corners snap shut on the final hit ───────────────────────── */

const BOX = { x0: 118, y0: 346, x1: 962, y1: 1452 };
const LockBrackets: React.FC<{ g: number; T: TT }> = ({ g, T }) => {
  const a = g - (T.hit - 7);
  if (a < 0) return null;
  const p = iv(a, [0, 7], [0, 1], EASE_IN);
  const ring = decay(g - T.hit, 8);
  const breathe = 0.5 + 0.5 * Math.sin((g - T.hit) / 16);
  const off = (1 - p) * 70;
  const L = 74;
  const col = `rgba(34,211,238,${(0.5 + 0.1 * breathe + 0.4 * ring).toFixed(3)})`;
  const corner = (x: number, y: number, sx: number, sy: number, k: number) => (
    <div
      key={k}
      style={{
        position: "absolute",
        left: x - sx * off - (sx > 0 ? 0 : L),
        top: y - sy * off - (sy > 0 ? 0 : L),
        width: L,
        height: L,
        opacity: iv(p, [0, 0.4], [0, 1]),
        borderLeft: sx > 0 ? `4px solid ${col}` : undefined,
        borderRight: sx < 0 ? `4px solid ${col}` : undefined,
        borderTop: sy > 0 ? `4px solid ${col}` : undefined,
        borderBottom: sy < 0 ? `4px solid ${col}` : undefined,
        borderRadius: 6,
        filter: `drop-shadow(0 0 ${(8 + 18 * ring).toFixed(0)}px rgba(34,211,238,0.9))`,
      }}
    />
  );
  return (
    <>
      {corner(BOX.x0, BOX.y0, 1, 1, 0)}
      {corner(BOX.x1, BOX.y0, -1, 1, 1)}
      {corner(BOX.x0, BOX.y1, 1, -1, 2)}
      {corner(BOX.x1, BOX.y1, -1, -1, 3)}
    </>
  );
};

/* ───────────────────────── the end-card ───────────────────────── */

export const Cta: Archetype = ({ spec }) => {
  useFontsReady();
  const g = useGlobalFrame();
  const wmWords = epPage().toUpperCase().split(/\s+/).filter(Boolean);
  const T = timing(spec, wmWords);
  const lines = splitTwo(wmWords);
  const title = epTitle();
  const d = (spec.data ?? {}) as { recap?: string };
  const hitA = g - T.hit;
  // energy of the build (« Cloud » → the hit) and the inhale right before the hit
  const build = hitA >= 0 ? 0 : iv(g, [T.cloud, T.hit - 4], [0, 1], EASE_IN);
  const inhale = hitA >= 0 ? 0 : iv(g, [T.hit - 14, T.hit - 1], [0, 1], EASE_IN);
  // ring timer: lands at 00:00 on « Cloud », counts to 00:45, completes ON the final hit
  const u = clamp01((g - T.cloud) / Math.max(1, T.hit - T.cloud));
  const secs = 45 * Math.pow(u, 1.25);
  const ringIn = g < T.cloud ? 0 : spring({ frame: g - T.cloud, fps: 60, config: SPRING_POP });
  const ringPop = hitA < 0 ? 1 : 0.86 + 0.14 * spring({ frame: hitA, fps: 60, config: SPRING_POP });
  const chase = hitA < 0 ? null : clamp01(hitA / 36);
  const holdGlow = hitA >= 0 ? 0.25 + 0.12 * Math.sin(hitA / 18) : 0;
  const ringGlow = clamp01(0.25 + 0.5 * build + 0.9 * decay(hitA, 14) + holdGlow);
  const sweep = hitA > 36 ? (hitA - 36) * 1.6 : null; // the hold: a slow orbiting light keeps the ring alive
  const cardS = hitA < 0 ? 1 + 0.028 * build - 0.03 * inhale : 1 + 0.05 * decay(hitA, 4.5) + 0.006 * smooth(hitA / 60);
  const t = (g - spec.from) / 60;
  const zoomBuild = hitA < 0 ? 0.09 * build * build : 0.09 * (1 - smooth(hitA / 50));
  const push = (1 + 0.035 * t) * (1 + zoomBuild);
  const bloom = hitA < 0 ? (0.75 + 0.5 * build) * (1 - 0.45 * inhale) : 1 + 0.9 * decay(hitA, 10) + 0.12 * Math.sin(hitA / 18);
  const warp = g >= T.cloud && hitA < 0 ? iv(g, [T.cloud, T.hit - 4], [0.08, 1], EASE_IN) : 0;
  const wu = clamp01((g - T.cloud) / Math.max(1, T.hit - 4 - T.cloud));
  const warpT = 1.4 * wu + 3.4 * wu * wu * wu;
  const pill = pillPose(g, T);
  const warm = 0.55 + 0.25 * decay(g - T.tap, 12) + 0.5 * decay(hitA, 10);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop id="cta" g={g} t={t} bloom={bloom} bloomAt={640} push={push} warp={warp} warpT={warpT} warpAt={{ x: 540, y: RING_Y }} warm={warm} warmAt={pill.y} />
      <AbsoluteFill style={{ transform: `scale(${cardS.toFixed(4)})`, transformOrigin: `540px ${CONTENT_CY}px` }}>
        {ringIn > 0 ? (
          <div style={{ position: "absolute", left: 540, top: RING_Y, transform: `translate(-50%, -50%) scale(${(0.6 + 0.4 * ringIn).toFixed(4)})`, opacity: clamp01(ringIn * 1.8) }}>
            <RingTimer progress={secs / 45} seconds={secs} size={RING_SIZE} pop={ringPop} chase={chase} glow={ringGlow} sweep={sweep} />
          </div>
        ) : null}
        <Wordmark g={g} T={T} lines={lines} />
        <Handle g={g} T={T} text={epHandle()} />
        <Row g={g} T={T} />
        <Recap g={g} T={T} command={d.recap ? undefined : title.command} line={d.recap ?? title.line} />
        <Pill g={g} T={T} />
        <Finger g={g} T={T} />
        <LockBrackets g={g} T={T} />
      </AbsoluteFill>
      {hitA >= 0 && hitA < 6 ? (
        <AbsoluteFill
          style={{
            mixBlendMode: "screen",
            background: `radial-gradient(circle 1300px at 540px ${RING_Y}px, rgba(235,252,255,${(0.9 * iv(hitA, [0, 1, 2, 5], [1, 0.5, 0.2, 0])).toFixed(3)}) 0%, rgba(120,230,250,${(0.6 * iv(hitA, [0, 1, 2, 5], [1, 0.5, 0.2, 0])).toFixed(3)}) 30%, rgba(34,211,238,${(0.25 * iv(hitA, [0, 1, 2, 5], [1, 0.5, 0.2, 0])).toFixed(3)}) 65%, rgba(34,211,238,0.02) 100%)`,
          }}
        />
      ) : null}
      <Shockwave age={hitA} x={540} y={RING_Y} dur={28} strength={0.7} maxR={1500} r0={150} />
      <AnamorphicFlare age={hitA} x={540} y={RING_Y} dur={46} strength={0.8} size={200} />
      <AnamorphicFlare age={g - T.n45} x={540 + 150} y={ROW_Y} col={AMBER_HOT} dur={24} strength={0.28} size={90} streakH={70} />
    </AbsoluteFill>
  );
};
