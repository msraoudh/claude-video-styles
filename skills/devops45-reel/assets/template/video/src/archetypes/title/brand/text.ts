import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { INTER, MONO } from "../../../kit/fonts";

/**
 * Text measuring for variable content (signature pieces). Canvas measureText with the REAL fonts:
 * `useFontsReady()` holds the frame (delayRender) until Inter 800 / JetBrains Mono are loaded and re-renders, so a
 * layout is never computed with fallback metrics. Results are cached only once the fonts are ready.
 */
let READY = false;
const loadAll = () =>
  Promise.all([
    document.fonts.load(`800 100px ${INTER}`),
    document.fonts.load(`700 100px ${INTER}`),
    document.fonts.load(`500 100px "${MONO}"`),
    document.fonts.load(`700 100px "${MONO}"`),
  ]).then(() => document.fonts.ready);

export const useFontsReady = () => {
  const [ready, setReady] = useState(READY);
  const [handle] = useState(() => (READY ? null : delayRender("signature: fonts for text measuring", { timeoutInMilliseconds: 25000 })));
  useEffect(() => {
    if (READY) {
      if (handle !== null) continueRender(handle);
      return;
    }
    let alive = true;
    loadAll()
      .catch(() => undefined)
      .then(() => {
        READY = true;
        if (alive) setReady(true);
        if (handle !== null) continueRender(handle);
      });
    return () => {
      alive = false;
    };
  }, [handle]);
  return ready;
};

let CTX: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

/** advance width (px) of `text` in a font, with letter-spacing `trackEm` (em) applied between characters */
export const textWidth = (text: string, size: number, weight = 800, mono = false, trackEm = 0): number => {
  const key = `${mono ? "m" : "i"}|${weight}|${size}|${trackEm}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  if (!CTX) CTX = document.createElement("canvas").getContext("2d");
  let w: number;
  if (CTX) {
    CTX.font = `${weight} ${size}px ${mono ? `"${MONO}"` : INTER}`;
    w = CTX.measureText(text).width;
  } else w = text.length * size * (mono ? 0.6 : 0.58);
  w += Array.from(text).length * trackEm * size;
  if (READY) cache.set(key, w);
  return w;
};

export type Wrapped = { size: number; lines: string[][]; widths: number[] };

/** greedy word wrap at a font size; returns lines of words */
export const wrapWords = (words: string[], size: number, maxW: number, weight = 800, trackEm = -0.03): Wrapped => {
  const space = textWidth(" ", size, weight, false, 0) + 0.04 * size;
  const lines: string[][] = [[]];
  const widths: number[] = [0];
  for (const w of words) {
    const ww = textWidth(w, size, weight, false, trackEm);
    const li = lines.length - 1;
    const add = lines[li].length ? space + ww : ww;
    if (lines[li].length && widths[li] + add > maxW) {
      lines.push([w]);
      widths.push(ww);
    } else {
      lines[li].push(w);
      widths[li] += add;
    }
  }
  return { size, lines, widths };
};

/**
 * Largest font size in [min, max] at which `words` fit in ≤ maxLines lines of maxW px and no single word overflows.
 * If even `min` needs more lines, returns the `min` layout (more lines) — callers cap the block height.
 */
export const fitWords = (words: string[], o: { maxW: number; maxLines: number; min: number; max: number; step?: number; weight?: number; trackEm?: number }): Wrapped => {
  const step = o.step ?? 2;
  for (let s = o.max; s >= o.min; s -= step) {
    const r = wrapWords(words, s, o.maxW, o.weight ?? 800, o.trackEm ?? -0.03);
    if (r.lines.length <= o.maxLines && Math.max(...r.widths) <= o.maxW + 0.5) return r;
  }
  // last resort: shrink until the longest single word fits
  let s = o.min;
  let r = wrapWords(words, s, o.maxW, o.weight ?? 800, o.trackEm ?? -0.03);
  while (Math.max(...r.widths) > o.maxW && s > 28) {
    s -= 2;
    r = wrapWords(words, s, o.maxW, o.weight ?? 800, o.trackEm ?? -0.03);
  }
  return r;
};

/** French typography: narrow no-break space before ? ! : ; (and none doubled) */
export const frenchSpacing = (s: string) => s.replace(/\s*([?!:;])/g, " $1").replace(/«\s*/g, "« ").replace(/\s*»/g, " »");

/** words of a line; punctuation glued with a narrow no-break space stays with its word */
export const splitWords = (s: string) => frenchSpacing(s.trim()).split(/\s+/).filter(Boolean);

/** fit a mono string (commands) in maxW: returns font size (and a truncated string if even `min` is too wide) */
export const fitMono = (text: string, maxW: number, max: number, min: number, weight = 700): { size: number; text: string } => {
  for (let s = max; s >= min; s -= 2) if (textWidth(text, s, weight, true) <= maxW) return { size: s, text };
  let t = text;
  while (t.length > 4 && textWidth(t + "…", min, weight, true) > maxW) t = t.slice(0, -1);
  return { size: min, text: t === text ? t : t + "…" };
};
