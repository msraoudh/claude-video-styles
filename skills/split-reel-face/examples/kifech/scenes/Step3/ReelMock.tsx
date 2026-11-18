import type React from "react";
import { Img, interpolateColors, staticFile } from "remotion";
import { AR, K, MONO, SERIF, SERIF_UP, UI } from "../../edit/theme";

/**
 * A 9:16 mini-mock of a reel "step" screen, drawn at a base width of 210 px and scaled.
 * `t` morphs the palette: 0 = the analysed reference (DemwzTPJK6J: cream paper + terracotta, ink), 1 = OUR vibe
 * (warm dark + Claude coral + cream). `ours` switches the content (our header, Arabic title, the user's own thumbnails).
 */
const PAL: [string, string, string][] = [
  ["bg", "#F6F6EC", "#221813"],
  ["bg2", "#E9DFD1", "#0F0B09"],
  ["ink", "#1C1B18", "#F5EEE4"],
  ["accent", "#CF6F56", "#D97757"],
  ["muted", "#8A877F", "#B9A898"],
  ["surface", "#FCFFFF", "#2E211B"],
  ["seg", "#E2E2D8", "#3D2D25"],
  ["pale", "#FBDED9", "#5A3326"],
  ["line", "#DCD8CF", "#54443A"],
  ["headInk", "#FFFFFF", "#1A0F0B"],
  ["edge", "#D9D2C4", "#4A382F"],
];
type PalKey = "bg" | "bg2" | "ink" | "accent" | "muted" | "surface" | "seg" | "pale" | "line" | "headInk" | "edge";
export const mixPal = (t: number) => {
  const out = {} as Record<PalKey, string>;
  for (const [k, a, b] of PAL) out[k as PalKey] = interpolateColors(t, [0, 1], [a, b]);
  return out;
};

export const MOCK_BASE_W = 210;
export const MOCK_BASE_H = (210 * 16) / 9; // 373.3
/** Element regions in base coords (for highlights and connectors). */
export const MOCK_REGION = {
  title: { x: 8, y: 34, w: 194, h: 46 },
  inner: { x: 13, y: 93, w: 184, h: 160 },
  fan: { x: 22, y: 256, w: 166, h: 104 },
};
export const regionCenterY = (k: keyof typeof MOCK_REGION) => MOCK_REGION[k].y + MOCK_REGION[k].h / 2;

const REF_FAN = [
  ["#EFCFC2", "#CF6F56"],
  ["#E3E1D8", "#8A877F"],
  ["#F3DDD5", "#D58A73"],
];
const OUR_FAN = ["trailer-1", "intro-2", "ep1-3"];

export const ReelMock: React.FC<{
  w: number;
  t: number;
  ours?: boolean;
  hl?: { title?: number; inner?: number; fan?: number };
  innerP?: number;
  fanSpread?: number;
  style?: React.CSSProperties;
}> = ({ w, t, ours = false, hl = {}, innerP = 1, fanSpread = 1, style }) => {
  const s = w / MOCK_BASE_W;
  const c = mixPal(t);
  const segs = ours ? 5 : 7;
  const active = ours ? 3 : 2;
  const ip = Math.min(1, Math.max(0, innerP));
  const shadowA = 0.1 + 0.45 * t;

  const highlight = (k: keyof typeof MOCK_REGION, v = 0) => {
    if (v <= 0.01) return null;
    const r = MOCK_REGION[k];
    return (
      <div
        style={{
          position: "absolute",
          left: r.x,
          top: r.y,
          width: r.w,
          height: r.h,
          borderRadius: 10,
          border: `2px dashed ${K.coral}`,
          background: `rgba(217,119,87,${0.1 * v})`,
          boxShadow: `0 0 ${18 * v}px rgba(217,119,87,${0.55 * v})`,
          opacity: Math.min(1, v),
        }}
      />
    );
  };

  const innerCard = (op: number, dy: number, sc: number, blur: number, key: string) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: 20,
        top: 100,
        width: 170,
        height: 146,
        borderRadius: 12,
        background: c.surface,
        border: `1px solid ${c.edge}`,
        boxShadow: `0 10px 22px rgba(0,0,0,${shadowA})`,
        overflow: "hidden",
        opacity: op,
        transform: `translateY(${dy}px) scale(${sc})`,
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
      }}
    >
      <div style={{ height: 32, background: c.accent, padding: "5px 10px", boxSizing: "border-box" }}>
        <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 6, letterSpacing: "0.14em", color: c.headInk, opacity: 0.8 }}>{ours ? "@MS_YOURNAME" : "MA MARQUE"}</div>
        <div style={{ fontFamily: UI, fontWeight: 900, fontSize: 11, color: c.headInk, lineHeight: 1.2 }}>{ours ? "NOTRE KIT" : "GUIDE DE STYLE"}</div>
      </div>
      {[118, 96, 108, 80].map((lw, i) => (
        <div key={i} style={{ position: "absolute", left: 12, top: 44 + i * 24, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 11, height: 11, borderRadius: 6, background: c.pale, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={8} height={8} viewBox="0 0 10 10">
              <path d="M2 5.2 L4.2 7.4 L8 3" fill="none" stroke={c.accent} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ width: lw, height: 6, borderRadius: 3, background: c.line }} />
        </div>
      ))}
    </div>
  );

  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: MOCK_BASE_H * s,
        borderRadius: 20,
        overflow: "hidden",
        border: `1.5px solid ${ours || t > 0.5 ? K.strokeHi : "rgba(255,255,255,0.5)"}`,
        boxShadow: `0 22px 50px rgba(0,0,0,0.6)${ours || t > 0.5 ? `, 0 0 40px ${K.coralGlow}` : ""}`,
        background: `radial-gradient(90% 60% at 50% 30%, ${c.bg} 0%, ${c.bg} 40%, ${c.bg2} 100%)`,
        ...style,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, width: MOCK_BASE_W, height: MOCK_BASE_H, transform: `scale(${s})`, transformOrigin: "0 0" }}>
        {/* segmented progress */}
        <div style={{ position: "absolute", left: 14, right: 14, top: 16, display: "flex", gap: 4, flexDirection: ours ? "row-reverse" : "row" }}>
          {Array.from({ length: segs }, (_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < active ? c.accent : c.seg }} />
          ))}
        </div>
        {/* kicker */}
        <div
          style={{
            position: "absolute",
            top: 26,
            left: ours ? undefined : 14,
            right: ours ? 14 : undefined,
            fontFamily: ours ? MONO : UI,
            fontWeight: 700,
            fontSize: ours ? 8 : 8.5,
            letterSpacing: ours ? "0.14em" : "0.02em",
            color: c.accent,
          }}
        >
          {ours ? "ÉTAPE 3/5" : "Étape 2"}
        </div>
        {/* title */}
        {ours ? (
          <div dir="rtl" style={{ position: "absolute", top: 40, right: 14, fontFamily: AR, fontWeight: 800, fontSize: 19, color: c.ink, whiteSpace: "nowrap", lineHeight: 1.6 }}>
            نفس الـ <span style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 25, color: c.accent }}>style</span>
          </div>
        ) : (
          <div style={{ position: "absolute", top: 40, left: 14, fontFamily: SERIF_UP, fontSize: 27, color: c.ink, whiteSpace: "nowrap", lineHeight: 1.3 }}>
            Guide de <span style={{ fontFamily: SERIF, color: c.accent }}>style</span>
          </div>
        )}
        {/* inner card (+ motion ghosts while it (re)enters) */}
        {ip < 1 ? innerCard(0.22 * (1 - ip) * (ip > 0 ? 1 : 0), (1 - ip) * 34, 0.94, 3, "g2") : null}
        {ip < 1 ? innerCard(0.35 * (1 - ip) * (ip > 0 ? 1 : 0), (1 - ip) * 24, 0.95, 2, "g1") : null}
        {innerCard(ip, (1 - ip) * 14, 0.96 + 0.04 * ip, (1 - ip) * 6, "main")}
        {/* fan of reference cards */}
        <div style={{ position: "absolute", left: 105, top: 262 }}>
          {[0, 1, 2].map((i) => {
            const k = i - 1;
            const rot = k * 13 * fanSpread;
            const dx = k * 40 * fanSpread;
            const dy = Math.abs(k) * 6 * fanSpread;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: -22 + dx,
                  top: dy,
                  width: 44,
                  height: 78,
                  borderRadius: 7,
                  overflow: "hidden",
                  transform: `rotate(${rot}deg)`,
                  transformOrigin: "50% 100%",
                  boxShadow: `0 6px 14px rgba(0,0,0,${0.12 + 0.4 * t})`,
                  border: `1px solid ${c.edge}`,
                  zIndex: i === 1 ? 2 : 1,
                  background: ours ? "#000" : `linear-gradient(160deg, ${REF_FAN[i][0]}, #FFFFFF)`,
                }}
              >
                {ours ? (
                  <Img src={staticFile(`thumbs/${OUR_FAN[i]}.jpg`)} style={{ width: 44, height: 78, objectFit: "cover" }} />
                ) : (
                  <>
                    <div style={{ position: "absolute", left: 8, top: 10, width: 28, height: 28, borderRadius: 14, background: REF_FAN[i][1], opacity: 0.65 }} />
                    <div style={{ position: "absolute", left: 7, top: 48, width: 30, height: 4, borderRadius: 2, background: REF_FAN[i][1], opacity: 0.5 }} />
                    <div style={{ position: "absolute", left: 7, top: 56, width: 20, height: 4, borderRadius: 2, background: REF_FAN[i][1], opacity: 0.35 }} />
                  </>
                )}
              </div>
            );
          })}
        </div>
        {highlight("title", hl.title)}
        {highlight("inner", hl.inner)}
        {highlight("fan", hl.fan)}
      </div>
    </div>
  );
};
