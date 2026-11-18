import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import linesData from "../data/lines.json";
import { PROJECT } from "../data/project";
import { captionY } from "./layout";
import { AR, K } from "./theme";
import { WORDS } from "./time";

/**
 * Word-by-word captions, Arabic letters with tech / English / French words in Latin (the user's choice).
 * Pages of ≤ 3 words (≤ 24 chars), reset at every line (Claude editorial reference: short rolling lines);
 * a dark pill (AIS reference) sitting on the seam in split, low on the chest in full-face, low in gfx.
 * The spoken word is coral and lifts a little; words not yet said are dimmed.
 */
type Line = { s: number; e: number };
const LINES = linesData as Line[];
type Page = { words: typeof WORDS; from: number; to: number };

const PAGES: Page[] = (() => {
  const out: Page[] = [];
  LINES.forEach((ln, li) => {
    const ws = WORDS.filter((w) => w.startMs >= ln.s * 1000 - 5 && w.startMs < ln.e * 1000 - 5);
    let cur: typeof WORDS = [];
    let len = 0;
    const flush = () => {
      if (cur.length) out.push({ words: cur, from: 0, to: 0 });
      cur = [];
      len = 0;
    };
    for (const w of ws) {
      const l = w.text.trim().length;
      if (cur.length >= 3 || (len + l > 24 && cur.length)) flush();
      cur.push(w);
      len += l + 1;
    }
    flush();
    void li;
  });
  for (let i = 0; i < out.length; i++) {
    const p = out[i];
    p.from = Math.round((p.words[0].startMs / 1000) * 30) - 2;
    const next = out[i + 1];
    const last = p.words[p.words.length - 1];
    const end = Math.round((last.endMs / 1000) * 30) + 8;
    p.to = next ? Math.min(Math.max(end, p.from + 10), Math.round((next.words[0].startMs / 1000) * 30) - 2) : end;
  }
  return out;
})();

export const Captions: React.FC<{ hide?: [number, number][] }> = ({ hide = [] }) => {
  const frame = useCurrentFrame();
  if (hide.some(([a, b]) => frame >= a && frame < b)) return null;
  const page = PAGES.find((p) => frame >= p.from && frame < p.to);
  if (!page) return null;
  const y = captionY(frame);
  const tin = interpolate(frame - page.from, [0, 4], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y - 52, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      {/* inline text (not flex) so the bidi algorithm keeps Latin runs in reading order: « والـ motion graphics » */}
      <div
        dir={PROJECT.dir}
        style={{
          display: "block",
          textAlign: "center",
          fontFamily: AR,
          fontWeight: 800,
          fontSize: 62, // also sizes the spaces between words
          lineHeight: 1.25,
          padding: "14px 30px 20px",
          borderRadius: 26,
          background: "rgba(15,11,9,0.78)",
          border: "1.5px solid rgba(255,236,220,0.14)",
          boxShadow: "0 14px 40px rgba(0,0,0,0.55)",
          transform: `translateY(${(1 - tin) * 10}px) scale(${0.97 + 0.03 * tin})`,
          opacity: tin,
          maxWidth: 940,
        }}
      >
        {page.words.map((w, i) => {
          const s = Math.round((w.startMs / 1000) * 30);
          const on = frame >= s && frame < Math.round((w.endMs / 1000) * 30) + 3;
          const said = frame >= s;
          const lift = on ? interpolate(frame - s, [0, 3], [1.08, 1.04], { extrapolateRight: "clamp" }) : 1;
          return (
            <span key={i}>
            {i > 0 ? " " : null}
            <span
              style={{
                fontFamily: AR,
                fontWeight: 800,
                lineHeight: 1.25,
                color: on ? K.coral : K.cream,
                opacity: said ? 1 : 0.45,
                display: "inline",
                fontSize: 62 * lift,
                textShadow: on ? `0 0 24px ${K.coralGlow}` : "none",
                whiteSpace: "nowrap",
              }}
            >
              {w.text.trim()}
            </span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
