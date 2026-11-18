import type React from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";
import { EASE, float, typed } from "../../edit/kit";
import { K, MONO, SERIF, SERIF_UP, UI } from "../../edit/theme";
import { IcDropper } from "./icons";
import { MOCK_BASE_H, MOCK_BASE_W, ReelMock } from "./ReelMock";
import { clamp01, T } from "./t";

/**
 * Beat E — « نقلّو راهو باش نبدّلوها selon الـ vibe متاعنا » (53.02–55.28).
 * An eyedropper samples the reference reel's palette (5 real colours of DemwzTPJK6J), the swatches fly out into a row;
 * on « نبدّلوها » a slider runs from « réf. » to « notre vibe », and every swatch flips to OUR colour as the knob
 * passes under it (hex codes scramble); on « vibe » the reference card itself turns into our warm-dark + coral look.
 */
const REF = ["#F6F6EC", "#CF6F56", "#1C1B18", "#8A877F", "#F8E4DB"];
const OUR = ["#0F0B09", "#D97757", "#F5EEE4", "#B9A898", "#F0A487"];
const ROLE = ["fond", "accent", "texte", "nuance", "lumière"];
const CARD = { x: 70, y: 1074, w: 200 };
const CS = CARD.w / MOCK_BASE_W;
const CARD_H = MOCK_BASE_H * CS;
/** where the dropper samples each colour on the mini card (base coords). */
const PTS: [number, number][] = [
  [178, 344],
  [152, 60],
  [44, 58],
  [107, 286],
  [37, 149],
];
const SW = { x0: 300, y: 1146, w: 112, h: 156, gap: 20 };
const swX = (i: number) => SW.x0 + i * (SW.w + SW.gap);
const TRACK = { x0: 300, x1: 920, y: 1376 };
const sampleAt = (i: number) => T.eIn + 4 + i * 3;
const knob = (fr: number) =>
  interpolate(fr, [T.nbadl, T.vibe + 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
/** frame at which the knob passes under swatch i (computed once). */
const CROSS = REF.map((_, i) => {
  const c = (swX(i) + SW.w / 2 - TRACK.x0) / (TRACK.x1 - TRACK.x0);
  for (let fr = T.nbadl; fr <= T.vibe + 2; fr++) if (knob(fr) >= c) return fr;
  return T.vibe;
});
const HEXCH = "0123456789ABCDEF";
const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};

const Swatch: React.FC<{ i: number }> = ({ i }) => {
  const frame = useCurrentFrame();
  const s0 = sampleAt(i);
  if (frame < s0) return null;
  const fly = EASE((frame - s0) / 9);
  const [px, py] = PTS[i];
  const fromX = CARD.x + px * CS;
  const fromY = CARD.y + py * CS;
  const toX = swX(i) + SW.w / 2;
  const toY = SW.y + SW.h / 2;
  const cx = fromX + (toX - fromX) * fly;
  const cy = fromY + (toY - fromY) * fly - Math.sin(fly * Math.PI) * 20;
  const sc = 0.22 + 0.78 * fly;
  const fp = EASE((frame - CROSS[i]) / 9);
  const lift = Math.sin(fp * Math.PI);
  const fl = float(frame, `s3sw${i}`, 2.5, 3.8);
  const shimmer = clamp01((frame - (T.vibe + 4) - i * 2) / 10);
  const face = (col: string, back: boolean) => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 22,
        background: `linear-gradient(160deg, ${col}, ${col})`,
        border: `1.5px solid ${lum(col) < 0.12 ? "rgba(255,236,220,0.3)" : "rgba(255,255,255,0.25)"}`,
        boxShadow: `0 16px 36px rgba(0,0,0,0.55)${back && i === 1 ? `, 0 0 30px ${K.coralGlow}` : ""}`,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: back ? "rotateY(180deg)" : undefined,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", left: 12, bottom: 10, fontFamily: UI, fontWeight: 700, fontSize: 17, color: lum(col) > 0.55 ? "rgba(20,14,11,0.75)" : "rgba(245,238,228,0.85)" }}>{ROLE[i]}</div>
      {back && shimmer > 0 && shimmer < 1 ? (
        <div style={{ position: "absolute", top: -20, bottom: -20, left: -80 + shimmer * 260, width: 60, background: "linear-gradient(90deg, transparent, rgba(255,240,230,0.35), transparent)", transform: "skewX(-18deg)" }} />
      ) : null}
    </div>
  );
  // hex code (scrambles while flipping)
  const target = fp < 0.5 ? REF[i] : OUR[i];
  const scr = fp > 0.08 && fp < 0.92;
  const hex = scr ? "#" + Array.from({ length: 6 }, (_, j) => HEXCH[Math.floor(random(`hx${i}-${frame}-${j}`) * 16)]).join("") : target;
  const hexIn = frame >= s0 + 8 ? typed(hex, frame, s0 + 8, 90) : "";
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: cx - SW.w / 2,
          top: cy - SW.h / 2,
          width: SW.w,
          height: SW.h,
          perspective: 700,
          opacity: EASE((frame - s0) / 3),
          transform: `translate(${fl.x * fly * 0.5}px, ${fl.y * fly * 0.5 - lift * 16}px) scale(${sc * (1 + 0.06 * lift)})`,
        }}
      >
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${fp * 180}deg)` }}>
          {face(REF[i], false)}
          {face(OUR[i], true)}
        </div>
      </div>
      <div style={{ position: "absolute", left: swX(i), width: SW.w, top: SW.y + SW.h + 10, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 18, color: fp >= 0.5 ? (i === 1 ? K.coral : K.cream) : K.muted, whiteSpace: "nowrap" }}>
        {hexIn}
      </div>
    </>
  );
};

export const Palette: React.FC = () => {
  const frame = useCurrentFrame();
  const cardIn = EASE((frame - T.eIn) / 8);
  const morph = EASE((frame - (T.vibe - 3)) / 10);
  const flash = frame >= T.vibe ? Math.exp(-(frame - T.vibe) / 5) : 0;
  const fc = float(frame, "s3pal", 3.5, 4.2);
  // dropper hops between the sample points
  const dropOn = frame >= T.eIn + 2 && frame < sampleAt(4) + 8;
  let dx = PTS[0][0];
  let dy = PTS[0][1];
  for (let i = 1; i < PTS.length; i++) {
    const p = EASE((frame - (sampleAt(i) - 3)) / 3);
    dx += (PTS[i][0] - PTS[i - 1][0]) * p;
    dy += (PTS[i][1] - PTS[i - 1][1]) * p;
  }
  const dropOp = EASE((frame - (T.eIn + 2)) / 4) * (1 - EASE((frame - (sampleAt(4) + 3)) / 5));
  // title
  const tIn = EASE((frame - (T.eIn + 4)) / 7);
  const sw = EASE((frame - T.vibe) / 6);
  // slider
  const trIn = EASE((frame - (T.eIn + 14)) / 9);
  const kp = knob(frame);
  const kx = TRACK.x0 + (TRACK.x1 - TRACK.x0) * kp;
  const moving = frame >= T.nbadl && frame <= T.vibe + 1;
  const arrive = frame >= T.vibe + 1 ? Math.exp(-(frame - T.vibe - 1) / 6) : 0;

  return (
    <>
      {/* the reference card (morphs into our look on « vibe ») */}
      <div
        style={{
          position: "absolute",
          left: CARD.x,
          top: CARD.y,
          perspective: 900,
          opacity: cardIn,
          filter: cardIn < 1 ? `blur(${(1 - cardIn) * 6}px)` : undefined,
          transform: `translate(${(1 - cardIn) * -30 + fc.x * 0.5}px, ${(1 - cardIn) * 14 + fc.y}px) scale(${0.96 + 0.04 * cardIn})`,
        }}
      >
        <ReelMock w={CARD.w} t={morph} style={{ transform: "rotateY(8deg)" }} fanSpread={0.8} />
        {flash > 0.02 ? <div style={{ position: "absolute", inset: 0, borderRadius: 20, background: "rgba(255,214,196,0.55)", opacity: flash, transform: "rotateY(8deg)" }} /> : null}
        {dropOn ? (
          <div style={{ position: "absolute", left: dx * CS - 8, top: dy * CS - 40, opacity: dropOp, filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6))" }}>
            <IcDropper size={46} color={K.coralLight} />
          </div>
        ) : null}
      </div>
      {/* tab RÉF. → NOUS */}
      <div style={{ position: "absolute", left: CARD.x + CARD.w / 2 - 60, width: 120, top: CARD.y - 18, display: "flex", justifyContent: "center", opacity: cardIn, zIndex: 5 }}>
        <div
          style={{
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: "0.14em",
            padding: "6px 14px",
            borderRadius: 999,
            color: morph > 0.5 ? "#1A0F0B" : K.cream,
            background: morph > 0.5 ? `linear-gradient(180deg, ${K.coralLight}, ${K.coral})` : "rgba(30,22,18,0.92)",
            border: `1.5px solid ${morph > 0.5 ? "rgba(255,220,200,0.6)" : K.strokeHi}`,
            boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
          }}
        >
          {morph > 0.5 ? "NOUS" : "RÉF."}
        </div>
      </div>
      {/* subtle card-height guide (keeps the composition anchored) */}
      <div style={{ position: "absolute", left: CARD.x + CARD.w + 14, top: CARD.y + 20, width: 2, height: CARD_H - 40, background: "linear-gradient(180deg, transparent, rgba(255,236,220,0.12), transparent)", opacity: cardIn }} />

      {/* title */}
      <div style={{ position: "absolute", left: 300, top: 1040, opacity: tIn, transform: `translateY(${(1 - tIn) * 12}px)`, filter: tIn < 1 ? `blur(${(1 - tIn) * 6}px)` : undefined }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 18, letterSpacing: "0.2em", color: K.coral }}>PALETTE</div>
        <div style={{ position: "relative", height: 70 }}>
          <div style={{ position: "absolute", left: 0, top: 0, fontFamily: SERIF_UP, fontSize: 54, color: K.muted, whiteSpace: "nowrap", opacity: 1 - sw, filter: sw > 0 ? `blur(${sw * 6}px)` : undefined, transform: `translateY(${-sw * 14}px)` }}>
            leur palette
          </div>
          <div style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap", opacity: sw, filter: sw < 1 ? `blur(${(1 - sw) * 6}px)` : undefined, transform: `translateY(${(1 - sw) * 14}px) scale(${0.96 + 0.04 * sw + 0.05 * flash})`, transformOrigin: "0 50%" }}>
            <span style={{ fontFamily: UI, fontWeight: 800, fontSize: 46, color: K.cream }}>notre </span>
            <span style={{ fontFamily: SERIF, fontSize: 62, color: K.coral, textShadow: `0 0 ${24 * flash + 8}px ${K.coralGlow}` }}>vibe</span>
          </div>
        </div>
      </div>

      {REF.map((_, i) => (
        <Swatch key={i} i={i} />
      ))}

      {/* slider réf. → notre vibe */}
      <div style={{ opacity: trIn }}>
        <div style={{ position: "absolute", left: TRACK.x0, top: TRACK.y - 3, width: (TRACK.x1 - TRACK.x0) * trIn, height: 6, borderRadius: 3, background: "rgba(255,236,220,0.12)" }} />
        <div style={{ position: "absolute", left: TRACK.x0, top: TRACK.y - 3, width: kx - TRACK.x0, height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${K.coralDeep}, ${K.coral})`, boxShadow: `0 0 12px ${K.coralGlow}` }} />
        <div
          style={{
            position: "absolute",
            left: kx - 17,
            top: TRACK.y - 17,
            width: 34,
            height: 34,
            borderRadius: 17,
            background: `radial-gradient(circle at 40% 35%, ${K.coralLight}, ${K.coral})`,
            border: "2.5px solid rgba(255,236,220,0.85)",
            boxShadow: `0 0 ${moving ? 26 : 14 + 30 * arrive}px ${K.coral}, 0 6px 14px rgba(0,0,0,0.5)`,
            transform: `scale(${1 + 0.25 * arrive})`,
          }}
        />
        <div style={{ position: "absolute", left: TRACK.x0, top: TRACK.y + 24, fontFamily: MONO, fontWeight: 700, fontSize: 18, color: kp < 0.5 ? K.cream : K.muted }}>réf.</div>
        <div style={{ position: "absolute", left: TRACK.x1 - 200, width: 200, textAlign: "right", top: TRACK.y + 24, fontFamily: MONO, fontWeight: 700, fontSize: 18, color: kp >= 0.98 ? K.coral : K.muted }}>notre vibe</div>
      </div>
    </>
  );
};
