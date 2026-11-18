import type React from "react";
import { spring, useCurrentFrame } from "remotion";
import { EASE, float, typed } from "../../edit/kit";
import { glass, K, MONO, SERIF } from "../../edit/theme";
import { IcCheck, IcSwap } from "./icons";
import { MOCK_BASE_H, MOCK_BASE_W, ReelMock, regionCenterY } from "./ReelMock";
import { T } from "./t";

/**
 * Beat B — « باش نعملو حاجة بنفس الـ style، نفس الـ motions، نفس الـ cards » (43.04–47.15).
 * Left: the analysed reference reel (stylised mock, cream + terracotta). Right: OUR card (warm dark + coral).
 * Between them 3 match rows; each lights ON its word with a ✓, a connector to the matching element of both cards,
 * and the element reacts on both cards at once (title highlight / the inner card replays its entrance / the fan spreads).
 */
const W = 210;
const H = MOCK_BASE_H * (W / MOCK_BASE_W);
const CY = 1072;
const REF_X = 80;
const OUR_X = 710;
const MID_X = 330;
const MID_W = 340;
const ROWS: { k: "title" | "inner" | "fan"; label: string; sub: string; at: number }[] = [
  { k: "title", label: "style", sub: "serif italique · 1 accent", at: T.style },
  { k: "inner", label: "motions", sub: "blur 6→0 · .96→1 · 6 fr", at: T.motions },
  { k: "fan", label: "cards", sub: "cartes · ombre douce", at: T.cards },
];
const rowY = (k: "title" | "inner" | "fan") => CY + regionCenterY(k) * (W / MOCK_BASE_W);

const CheckDot: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const on = frame >= at;
  const sp = on ? spring({ frame: frame - at, fps: 30, config: { damping: 9, stiffness: 230, mass: 0.6 } }) : 0;
  const burst = on ? Math.min(1, (frame - at) / 14) : 0;
  return (
    <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 22, border: `2px dashed ${K.dim}`, opacity: 1 - EASE((frame - at) / 4) }} />
      {on ? (
        <>
          {burst < 1 ? (
            <div style={{ position: "absolute", left: 22 - 40 * burst, top: 22 - 40 * burst, width: 80 * burst, height: 80 * burst, borderRadius: "50%", border: `3px solid ${K.ok}`, opacity: 1 - burst }} />
          ) : null}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 22,
              background: "#16231C",
              border: `2px solid ${K.ok}`,
              boxShadow: `0 0 18px rgba(127,209,161,0.45)`,
              transform: `scale(${sp})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IcCheck size={32} draw={EASE((frame - at - 1) / 6)} width={4.4} />
          </div>
        </>
      ) : null}
    </div>
  );
};

export const Match: React.FC = () => {
  const frame = useCurrentFrame();
  const a = EASE((frame - T.bStart) / 8);
  const b = EASE((frame - (T.bStart + 4)) / 8);
  const lit = ROWS.map((r) => EASE((frame - r.at) / 6));
  const flash = (at: number) => (frame >= at ? 0.55 + 0.45 * Math.exp(-(frame - at) / 8) : 0);
  const match = Math.round(((lit[0] + lit[1] + lit[2]) / 3) * 100);
  // the inner card builds once, then REPLAYS its entrance on « motions » (same motion on both cards)
  const innerP = frame < T.motions ? EASE((frame - (T.bStart + 10)) / 7) : EASE((frame - T.motions - 1) / 7);
  const fanSpread =
    frame < T.cards
      ? 0.55 * EASE((frame - (T.bStart + 14)) / 9)
      : 0.55 + 0.45 * spring({ frame: frame - T.cards, fps: 30, config: { damping: 8, stiffness: 170, mass: 0.7 } });
  const hl = { title: flash(T.style) * lit[0], inner: flash(T.motions) * lit[1], fan: flash(T.cards) * lit[2] };
  const fa = float(frame, "s3ref", 4, 4.2);
  const fb = float(frame, "s3our", 4, 4.6);
  // analysis scan line running down both cards
  const scanT = ((frame - T.bStart) % 40) / 40;
  const scanY = CY + scanT * H;
  const head = EASE((frame - (T.bStart + 6)) / 7);

  const tab = (x: number, text: string, p: number, accent = false) => (
    <div
      style={{
        position: "absolute",
        left: x + W / 2 - 60,
        width: 120,
        top: CY - 18,
        display: "flex",
        justifyContent: "center",
        opacity: p,
        zIndex: 5,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 17,
          letterSpacing: "0.14em",
          padding: "6px 14px",
          borderRadius: 999,
          color: accent ? "#1A0F0B" : K.cream,
          background: accent ? `linear-gradient(180deg, ${K.coralLight}, ${K.coral})` : "rgba(30,22,18,0.92)",
          border: `1.5px solid ${accent ? "rgba(255,220,200,0.6)" : K.strokeHi}`,
          boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
        }}
      >
        {text}
      </div>
    </div>
  );

  return (
    <>
      {/* header: ↔ with a match ring */}
      <div style={{ position: "absolute", left: MID_X, width: MID_W, top: 1040, height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, opacity: head, transform: `translateY(${(1 - head) * 10}px)` }}>
        <div style={{ position: "relative", width: 46, height: 46 }}>
          <svg width={46} height={46} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx={23} cy={23} r={20} stroke="rgba(255,236,220,0.14)" strokeWidth={3.5} fill="none" />
            <circle cx={23} cy={23} r={20} stroke={match >= 100 ? K.ok : K.coral} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeDasharray={125.7} strokeDashoffset={125.7 * (1 - match / 100)} />
          </svg>
          <IcSwap size={28} style={{ position: "absolute", left: 9, top: 9 }} />
        </div>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 22, color: K.muted, whiteSpace: "nowrap" }}>
          match <span style={{ color: match >= 100 ? K.ok : K.coral }}>{match}%</span>
        </div>
      </div>

      {/* reference card (left) */}
      <div style={{ position: "absolute", left: REF_X, top: CY, perspective: 900, opacity: a, filter: a < 1 ? `blur(${(1 - a) * 6}px)` : undefined, transform: `translate(${(1 - a) * -40 + fa.x * 0.5}px, ${(1 - a) * 14 + fa.y}px) scale(${0.96 + 0.04 * a})` }}>
        <ReelMock w={W} t={0} hl={hl} innerP={innerP} fanSpread={fanSpread} style={{ transform: "rotateY(9deg)" }} />
      </div>
      {tab(REF_X, "RÉF.", a)}

      {/* our card (right) */}
      <div style={{ position: "absolute", left: OUR_X, top: CY, perspective: 900, opacity: b, filter: b < 1 ? `blur(${(1 - b) * 6}px)` : undefined, transform: `translate(${(1 - b) * 40 + fb.x * 0.5}px, ${(1 - b) * 14 + fb.y}px) scale(${0.96 + 0.04 * b})` }}>
        <ReelMock w={W} t={1} ours hl={hl} innerP={innerP} fanSpread={fanSpread} style={{ transform: "rotateY(-9deg)" }} />
      </div>
      {tab(OUR_X, "NOUS", b, true)}

      {/* scan line over both cards (analysis) */}
      {frame >= T.bStart + 10 ? (
        <>
          {[REF_X, OUR_X].map((x) => (
            <div
              key={x}
              style={{
                position: "absolute",
                left: x + 6,
                width: W - 12,
                top: scanY,
                height: 2,
                background: `linear-gradient(90deg, transparent, ${K.coralLight}, transparent)`,
                boxShadow: `0 0 14px ${K.coral}`,
                opacity: 0.45 * Math.sin(scanT * Math.PI),
              }}
            />
          ))}
        </>
      ) : null}

      {/* match rows + connectors */}
      {ROWS.map((r, i) => {
        const y = rowY(r.k);
        const pIn = EASE((frame - (T.bStart + 8 + i * 4)) / 7);
        const l = lit[i];
        const conn = EASE((frame - r.at) / 8);
        const dot = ((frame - r.at) % 30) / 30;
        return (
          <div key={r.k}>
            {/* connectors (ref → row, row → ours) */}
            {[
              [REF_X + W + 2, MID_X - 2],
              [MID_X + MID_W + 2, OUR_X - 2],
            ].map(([x0, x1], j) => (
              <div key={j} style={{ position: "absolute", left: x0, top: y - 1.5, width: (x1 - x0) * conn, height: 3, borderRadius: 2, background: K.coral, boxShadow: `0 0 10px ${K.coralGlow}`, opacity: 0.9 }}>
                {conn >= 1 ? <div style={{ position: "absolute", left: dot * (x1 - x0) - 4, top: -3, width: 9, height: 9, borderRadius: 5, background: K.coralLight, boxShadow: `0 0 10px ${K.coral}` }} /> : null}
              </div>
            ))}
            <div
              style={{
                position: "absolute",
                left: MID_X,
                top: y - 37,
                width: MID_W,
                height: 74,
                boxSizing: "border-box",
                ...glass(l > 0.5),
                borderRadius: 22,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "0 16px",
                opacity: pIn * (0.55 + 0.45 * l),
                transform: `translateY(${(1 - pIn) * 14}px) scale(${(0.96 + 0.04 * pIn) * (1 + 0.05 * (frame >= r.at ? Math.exp(-(frame - r.at) / 5) : 0))})`,
                filter: pIn < 1 ? `blur(${(1 - pIn) * 6}px)` : undefined,
              }}
            >
              <CheckDot at={r.at} />
              <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                <div style={{ fontFamily: SERIF, fontSize: 40, lineHeight: 0.95, color: l > 0 ? K.coral : K.dim, whiteSpace: "nowrap" }}>{r.label}</div>
                <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 15, color: K.muted, whiteSpace: "nowrap", height: 18 }}>{frame >= r.at ? typed(r.sub, frame, r.at + 3, 60) : ""}</div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};
