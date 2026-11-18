import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { fontInter } from "../kit/fonts";
import { SCENES } from "../data/episode";
import { PHRASES, type Word } from "../data/voice";
import { B, CAPTION_BAND } from "../lib/look";
import { useGlobalFrame } from "../lib/sync";

/**
 * Burned-in French captions, word-by-word highlight (cyan on the word being spoken).
 * Inter 800, 72 px, max 2 lines, centred in the caption band (lower-middle safe area).
 * OFF in scenes with `captions: false` (the CTA end card, or a scene whose big on-screen text carries the words).
 */
const OFF = new Set(SCENES.filter((s) => !s.captions).flatMap((s) => s.phrases));
const MAX_LINE = 19; // characters per line — keeps lines inside x 140–940 (Instagram's right-hand icon column)
const FONT = 72;

type Tok = { text: string; f: number; fe: number };

/** whisper tokens → display tokens: glue « d' + apprendre », « Abonne + -toi », « l + 'éviter » */
const tokens = (words: Word[]): Tok[] => {
  const out: Tok[] = [];
  for (const w of words) {
    const t = w.w.trim();
    if (!t) continue;
    if (out.length && (t.startsWith("'") || t.startsWith("-") || /^[.,?!…]+$/.test(t))) {
      out[out.length - 1].text += t;
      out[out.length - 1].fe = w.fe;
    } else out.push({ text: t, f: w.f, fe: w.fe });
  }
  // capital at the start of every phrase; « le soir ? » keeps French spacing before ? (narrow no-break space)
  if (out.length) out[0].text = out[0].text.charAt(0).toUpperCase() + out[0].text.slice(1);
  return out.map((t) => ({ ...t, text: t.text.replace(/\s?([?!])$/, " $1") }));
};

/** split a phrase into pages of ≤ 2 lines of ≤ MAX_LINE chars */
const pages = (toks: Tok[]): Tok[][][] => {
  const ps: Tok[][][] = [];
  let page: Tok[][] = [[]];
  let len = 0;
  for (const t of toks) {
    const add = (len ? 1 : 0) + t.text.length;
    if (len + add > MAX_LINE && page[page.length - 1].length) {
      if (page.length === 2) {
        ps.push(page);
        page = [[]];
      } else page.push([]);
      len = 0;
    }
    page[page.length - 1].push(t);
    len += (len ? 1 : 0) + t.text.length;
  }
  if (page[0].length) ps.push(page);
  return ps;
};

const PAGES = PHRASES.filter((p) => !OFF.has(p.id)).flatMap((p) => {
  // Whisper starts words early after a pause: no word may light up before the phrase's AUDIBLE onset
  const ps = pages(tokens(p.words.map((w) => ({ ...w, f: Math.max(w.f, p.from) }))));
  // a page never spills over its scene's cut (no caption over the series ident or the CTA end card)
  const sc = SCENES.find((s) => s.phrases.includes(p.id));
  const lo = sc ? sc.from : 0;
  const hi = sc ? sc.to : Infinity;
  return ps.map((pg, i) => {
    const first = pg[0][0].f;
    const next = ps[i + 1]?.[0][0].f;
    const last = pg[pg.length - 1][pg[pg.length - 1].length - 1].fe;
    return { lines: pg, from: Math.max(lo, first - 4), to: Math.min(hi, next !== undefined ? next - 4 : last + 18) };
  });
});

export const Captions: React.FC = () => {
  const g = useGlobalFrame();
  const page = PAGES.find((p) => g >= p.from && g < p.to);
  if (!page) return null;
  const local = g - page.from;
  const appear = interpolate(local, [0, 7], [0, 1], { extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const out = interpolate(g, [page.to - 5, page.to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const all = page.lines.flat();
  // current word: the last token that has started
  const cur = [...all].reverse().find((t) => g >= t.f);
  const cy = (CAPTION_BAND.top + CAPTION_BAND.bottom) / 2;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 140, right: 140, top: cy - (page.lines.length * FONT * 1.12) / 2, textAlign: "center", opacity: appear * out, transform: `translateY(${(1 - appear) * 18}px)` }}>
        {page.lines.map((line, li) => (
          <div key={li} style={{ fontFamily: fontInter, fontWeight: 800, fontSize: FONT, lineHeight: 1.12, letterSpacing: "-0.02em", color: B.white }}>
            {line.map((t, ti) => {
              const on = cur === t;
              const spoken = g >= t.f;
              const pop = on ? interpolate(g - t.f, [0, 5], [1.08, 1], { extrapolateRight: "clamp" }) : 1;
              return (
                <span key={ti} style={{
                  display: "inline-block", marginRight: ti < line.length - 1 ? "0.26em" : 0,
                  color: on ? B.cyan : B.white, opacity: spoken ? 1 : 0.55, transform: `scale(${pop})`,
                  textShadow: on ? `0 0 26px ${B.cyanGlow}, 0 4px 18px rgba(0,0,0,0.9)` : "0 4px 18px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)",
                }}>{t.text}</span>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** captions as SRT (used by audio/deliver.py) */
export const CAPTION_PAGES = PAGES;
