import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { LINES, f, type Word } from "../lib/time";
import { CAP_FONT } from "../theme";
import { gradText, isArabic, K, SILVER } from "../fx/fx";

/** v5 captions: words only, NO card/bar behind them (the user). v4 captions (the user 2026-11-11): big and readable at full size, on a see-through liquid-glass bar, WHITE words typing in
 *  one by one, the stressed word on a red plate. Showcase draws them on the canvas under the card (y 1610);
 *  the full-screen Reel keeps its default y (chest). 1–3 words per chunk, at most 2 lines inside x 40–1040. */
type Chunk = { s: number; e: number; words: Word[] };
const CHUNKS: Chunk[] = [];
for (const l of LINES) {
  let cur: Word[] = [];
  const flush = (e: number) => {
    if (cur.length) CHUNKS.push({ s: f(cur[0].s), e, words: cur });
    cur = [];
  };
  l.words.forEach((wd, i) => {
    if (wd.text === "…") return;
    const len = cur.reduce((a, x) => a + x.text.length, 0) + wd.text.length;
    if (cur.length && (cur.length >= 3 || len > 22)) flush(f(wd.s));
    cur.push(wd);
    if (/[،,.?؟]$/.test(wd.text) && i < l.words.length - 1) flush(f(l.words[i + 1].s));
  });
  flush(f(l.e));
}
for (let i = 0; i < CHUNKS.length - 1; i++) CHUNKS[i].e = Math.min(CHUNKS[i].e, CHUNKS[i + 1].s);

export const Captions: React.FC<{ hidden: [number, number][]; y?: number }> = ({ hidden, y = 1290 }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (hidden.some(([a, b]) => fr >= a && fr < b)) return null;
  const ch = CHUNKS.find((c) => fr >= c.s && fr < c.e);
  if (!ch) return null;
  const ar = ch.words.some((x) => isArabic(x.text));
  const chars = ch.words.reduce((a, x) => a + x.text.length, 0);
  const fs = chars > 18 ? 60 : chars > 12 ? 66 : 72; // long chunks a bit smaller so they hold on 1–2 lines
  const bar = spring({ frame: fr - ch.s, fps, config: { damping: 18, stiffness: 240 } });
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          position: "relative",
          maxWidth: 1000,
          transform: `translateY(-50%) translateY(${(1 - bar) * 18}px) scale(${0.94 + 0.06 * bar})`,
          opacity: Math.min(1, bar * 2),
          padding: "6px 10px",
          direction: ar ? "rtl" : "ltr",
        }}
      >
        <div style={{ position: "relative", display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", columnGap: fs * 0.28, rowGap: 2 }}>
          {ch.words.map((wd, i) => {
            const st = f(wd.s);
            const shown = fr >= st;
            const s = spring({ frame: fr - st, fps, config: { damping: 14, stiffness: 300, mass: 0.4 } });
            const txt = wd.text.replace(/[،,]$/, "");
            const base: React.CSSProperties = { opacity: shown ? 1 : 0, transform: `translateY(${(1 - s) * 14}px) scale(${0.88 + 0.12 * s})`, display: "inline-block", fontFamily: CAP_FONT, fontWeight: 900, fontSize: fs, lineHeight: 1.22, whiteSpace: "nowrap", color: K.white };
            return wd.key ? (
              <span key={i} style={{ ...base, position: "relative" }}>
                <span style={{ ...gradText(SILVER), filter: "drop-shadow(0 3px 8px rgba(0,0,0,.8)) drop-shadow(0 0 2px rgba(0,0,0,.9))" }}>{txt}</span>
                {/* key word: same metal text, a red underline marks it */}
                <span style={{ position: "absolute", left: "4%", right: "4%", bottom: fs * 0.02, height: Math.max(6, fs * 0.1), borderRadius: 99, background: K.red, boxShadow: `0 0 14px ${K.glowSoft}`, transform: `scaleX(${s})`, transformOrigin: "left" }} />
              </span>
            ) : (
              <span key={i} style={{ ...base, ...gradText(SILVER), filter: "drop-shadow(0 3px 8px rgba(0,0,0,.8)) drop-shadow(0 0 2px rgba(0,0,0,.9))" }}>{txt}</span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
