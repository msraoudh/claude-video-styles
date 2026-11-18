import type React from "react";
import { useCurrentFrame } from "remotion";
import { Caret, Spark } from "../../edit/kit";
import { K, MONO, UI } from "../../edit/theme";
import { c01, eo } from "./beats";
import { BoltIcon, SendIcon } from "./icons";

/**
 * The Claude input pill (rebuilt): the user's 3arbizi prompt types itself, the send button turns coral, clicks on
 * `sendAt`. Optional skill attachment chip (⚡ aura-trailer) pops in at `chipAt`.
 */
export const Prompt: React.FC<{
  text: string;
  at: number; // pill enters
  typeAt: number;
  cps: number;
  sendAt: number;
  out: number; // exit starts
  x: number;
  y: number;
  w: number;
  chipAt?: number;
}> = ({ text, at, typeAt, cps, sendAt, out, x, y, w, chipAt }) => {
  const frame = useCurrentFrame();
  const p = eo(frame, at, 7);
  const q = eo(frame, out, 7);
  if (p <= 0 || q >= 1) return null;
  const n = Math.max(0, Math.min(text.length, Math.floor(((frame - typeAt) / 30) * cps)));
  const typing = n > 0 && n < text.length;
  const hasText = n > 0;
  const press = frame >= sendAt && frame < sendAt + 5 ? 0.86 : 1;
  const ring = frame >= sendAt && frame < sendAt + 14 ? (frame - sendAt) / 14 : 0;
  const chip = chipAt === undefined ? 0 : eo(frame, chipAt, 7);
  const chipPop = chipAt === undefined ? 1 : 1 + 0.18 * Math.sin(Math.PI * c01((frame - chipAt) / 8));
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: 66,
        zIndex: 50,
        opacity: p * (1 - q),
        transform: `translateY(${(1 - p) * 14 - q * 16}px) scale(${0.96 + 0.04 * p})`,
        filter: p < 1 || q > 0 ? `blur(${(1 - p) * 6 + q * 6}px)` : undefined,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 10px 0 26px",
        borderRadius: 33,
        background: `linear-gradient(180deg, rgba(255,236,220,0.1), rgba(255,236,220,0.04)), ${K.glass}`,
        border: `1.5px solid ${hasText ? "rgba(217,119,87,0.55)" : K.stroke}`,
        boxShadow: `0 18px 44px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,236,220,0.2)${hasText ? `, 0 0 30px rgba(217,119,87,0.18)` : ""}`,
        boxSizing: "border-box",
      }}
    >
      <Spark size={24} rotate={frame * 1.5} />
      <div style={{ flex: 1, fontFamily: UI, fontWeight: 600, fontSize: 28, color: K.cream, whiteSpace: "nowrap", overflow: "hidden", display: "flex", alignItems: "center" }}>
        {hasText ? text.slice(0, n) : <span style={{ color: K.dim }}>Écris à Claude…</span>}
        {typing || (!hasText && frame >= typeAt - 6) ? <Caret h={30} /> : null}
      </div>
      {chip > 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px 6px 10px",
            borderRadius: 999,
            background: `linear-gradient(180deg, ${K.coralLight}, ${K.coral})`,
            border: "1.5px solid rgba(255,220,200,0.6)",
            boxShadow: `0 8px 22px ${K.coralGlow}`,
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 21,
            color: "#1A0F0B",
            opacity: chip,
            transform: `scale(${(0.6 + 0.4 * chip) * chipPop})`,
            whiteSpace: "nowrap",
          }}
        >
          <BoltIcon size={20} />
          aura-trailer
        </div>
      ) : null}
      <div style={{ position: "relative", width: 46, height: 46, flexShrink: 0 }}>
        {ring > 0 ? <div style={{ position: "absolute", left: 23 - 40 * ring, top: 23 - 40 * ring, width: 80 * ring, height: 80 * ring, borderRadius: "50%", border: `3px solid ${K.coral}`, opacity: 1 - ring }} /> : null}
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: hasText ? `linear-gradient(180deg, ${K.coralLight}, ${K.coral})` : "rgba(255,236,220,0.12)",
            transform: `scale(${press})`,
            boxShadow: hasText ? `0 6px 18px ${K.coralGlow}` : undefined,
          }}
        >
          <SendIcon size={22} color={hasText ? "#1A0F0B" : K.muted} />
        </div>
      </div>
    </div>
  );
};
