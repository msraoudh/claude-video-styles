import type React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE, enter, Spark, typed } from "../../edit/kit";
import { glass, K, MONO, UI } from "../../edit/theme";
import { B, clamp01, kf, T } from "./shared";

/**
 * Beat 5 (1090–1182): « وبعد يقلّي كل شيء: بشنوّة، وكيفاش، وشنوّة الـ outils » → Claude's reply, in French, with the REAL
 * measurements of the reference (refs/DemwzTPJK6J-analysis.md). The highlight follows the voice: بشنوّة → Couleur,
 * كيفاش → Motion, شنوّة الـ outils → the tool chips pop into their slots.
 */
const ROWS: { k: string; v: string; swatch?: boolean; blur?: boolean }[] = [
  { k: "HOOK", v: "« 7 étapes » · 0–3 s" },
  { k: "LAYOUT", v: "faceless · 1 objet / écran" },
  { k: "COULEUR", v: "terracotta #CF6F56", swatch: true },
  { k: "MOTION", v: "blur 6→0 · 6 frames", blur: true },
  { k: "SONS", v: "voix seule · 3 SFX" },
];
const TOOLS = ["Remotion", "ffmpeg", "Whisper"];
const ROW_Y0 = 90;
const ROW_H = 57;

export const ReplyPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < B.replyIn || frame > T.end + 10) return null;
  const pIn = EASE((frame - B.replyIn) / 7);
  const q = EASE((frame - T.end) / 8);
  const push = 1 + 0.018 * clamp01((frame - B.replyIn) / 90);
  const spin = 300 * EASE((frame - B.replyIn) / 16) + frame * 0.4;
  const rowAt = (k: number) => T.yqolli + 4 + 4 * k;

  const hlRow = kf(frame, [T.kifech, T.kifech + 6], [2, 3]);
  const hlO = EASE((frame - T.bchnowa) / 5) * (1 - EASE((frame - T.wchnowa) / 6));
  const toolsGlow = Math.max(0, 1 - Math.abs(frame - (T.outils3 + 2)) / 12);

  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        top: 1045,
        width: 890,
        height: 400,
        ...glass(true),
        borderRadius: 28,
        padding: 0,
        overflow: "hidden",
        opacity: pIn * (1 - q),
        transform: `translateY(${(1 - pIn) * 18 - q * 12}px) scale(${(0.96 + 0.04 * pIn - 0.03 * q) * push})`,
        filter: pIn < 1 || q > 0 ? `blur(${(1 - pIn) * 6 + q * 6}px)` : undefined,
      }}
    >
      {/* header */}
      <div style={{ position: "absolute", left: 26, top: 20, right: 26, height: 46, display: "flex", alignItems: "center", gap: 14 }}>
        <Spark size={38} rotate={spin} glow={8} />
        <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 29, color: K.cream, whiteSpace: "nowrap" }}>{typed("Voilà comment il est fait :", frame, T.yqolli, 60)}</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: MONO, fontSize: 18, color: K.muted, opacity: EASE((frame - (T.yqolli + 6)) / 6), whiteSpace: "nowrap" }}>80 frames · 128 mots</div>
      </div>
      <div style={{ position: "absolute", left: 26, right: 26, top: 78, height: 1, background: K.stroke }} />

      {/* highlight bar (SKILL.md-style current line) */}
      <div
        style={{
          position: "absolute",
          left: 14,
          top: ROW_Y0 + hlRow * ROW_H + 2,
          width: 566,
          height: ROW_H - 4,
          borderRadius: 12,
          background: "rgba(217,119,87,0.16)",
          borderLeft: `4px solid ${K.coral}`,
          opacity: hlO,
        }}
      />

      {/* analysis rows */}
      {ROWS.map((r, k) => {
        const p = EASE((frame - rowAt(k)) / 6);
        const isHl = hlO > 0.5 && Math.round(hlRow) === k;
        const sw = r.swatch ? spring({ frame: frame - T.bchnowa, fps, config: { damping: 9, stiffness: 240, mass: 0.5 } }) : 0;
        // Motion row: on « كيفاش » the value itself plays the blur-in it describes (6→0 px over 6 frames)
        const d = r.blur ? frame - T.kifech : 99;
        const bl = d >= 0 && d < 7 ? 1 - EASE(d / 6) : 0;
        return (
          <div key={r.k} style={{ position: "absolute", left: 30, top: ROW_Y0 + k * ROW_H, height: ROW_H, width: 550, display: "flex", alignItems: "center", ...enter(p, 0, 10) }}>
            <div style={{ width: 142, fontFamily: UI, fontWeight: 800, fontSize: 21, letterSpacing: "0.14em", color: isHl ? K.coralLight : K.coral }}>{r.k}</div>
            {r.swatch ? (
              <div style={{ width: 24, height: 24, borderRadius: 12, background: "#CF6F56", marginRight: 12, boxShadow: `0 0 ${10 + 14 * Math.max(0, sw - 0.6)}px ${K.coralGlow}`, transform: `scale(${1 + 0.35 * Math.max(0, Math.min(1, sw)) * (1 - clamp01((frame - T.bchnowa - 8) / 8))})` }} />
            ) : null}
            <div
              style={{
                fontFamily: UI,
                fontWeight: 600,
                fontSize: 29,
                color: K.cream,
                whiteSpace: "nowrap",
                filter: bl > 0 ? `blur(${bl * 6}px)` : undefined,
                opacity: 1 - 0.6 * bl,
                transform: bl > 0 ? `translateY(${bl * 8}px) scale(${1 - 0.04 * bl})` : undefined,
              }}
            >
              {r.v}
            </div>
          </div>
        );
      })}

      {/* tools column */}
      <div style={{ position: "absolute", left: 600, top: 92, bottom: 22, width: 1, background: K.stroke }} />
      <div style={{ position: "absolute", left: 626, top: ROW_Y0 + 10, ...enter(EASE((frame - rowAt(4)) / 6), 0, 10) }}>
        <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 21, letterSpacing: "0.14em", color: K.coral }}>OUTILS</div>
      </div>
      {TOOLS.map((t, k) => {
        const at = T.wchnowa + 5 * k;
        const p = spring({ frame: frame - at, fps, config: { damping: 10, stiffness: 210, mass: 0.6 } });
        const y = ROW_Y0 + 52 + k * 72;
        const slotO = EASE((frame - rowAt(4)) / 6);
        return (
          <div key={t} style={{ position: "absolute", left: 626, top: y, width: 230, height: 58 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 999, border: `1.5px dashed rgba(255,236,220,0.2)`, opacity: slotO * (1 - Math.min(1, p)) }} />
            {frame >= at ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "0 22px",
                  fontFamily: UI,
                  fontWeight: 700,
                  fontSize: 28,
                  color: k === 0 ? "#1A0F0B" : K.cream,
                  background: k === 0 ? `linear-gradient(180deg, ${K.coralLight}, ${K.coral})` : "rgba(255,236,220,0.08)",
                  border: `1.5px solid ${k === 0 ? "rgba(255,220,200,0.6)" : "rgba(217,119,87,0.5)"}`,
                  boxShadow: `0 10px 26px rgba(0,0,0,0.4), 0 0 ${24 * toolsGlow}px ${K.coralGlow}`,
                  transform: `scale(${0.5 + 0.5 * p})`,
                  opacity: Math.min(1, p),
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: 5, background: k === 0 ? "#1A0F0B" : K.coral }} />
                {t}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
