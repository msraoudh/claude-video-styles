import React from "react";
import { AbsoluteFill } from "remotion";
import { fontMono } from "../kit/fonts";
import { B } from "../lib/look";
import { beatPulse, useGlobalFrame } from "../lib/sync";
import { clamp01, EASE_IN, EASE_OUT, iv } from "../archetypes/title/brand/fx";
import { epNumber, epTitle, keys } from "../archetypes/title/brand/meta";
import { RingTimer } from "../archetypes/title/brand/RingTimer";

/**
 * Series HUD — on top of every body scene, from KEY.titleTo to KEY.ctaFrom: the series' ring timer, small, top-left
 * (y ≈ 70–200), counting the episode DOWN 00:45 → 00:00 over the body (cyan arc draining, amber digits rolling like an
 * odometer), + a tiny glass chip « ÉP. 7 · LINUX ». Fades in (blur → sharp) just after the ident and out before the
 * CTA; it never moves into the content area (y < 220).
 */
const SIZE = 104; // ring Ø → box ≈ 137 px (y 70–207)
const LEFT = 50;
const TOP = 68;

export const Hud: React.FC = () => {
  const g = useGlobalFrame();
  const k = keys();
  const a = k.titleTo;
  const b = k.ctaFrom;
  if (!(b > a) || g < a || g >= b) return null;
  const fin = iv(g, [a + 2, a + 18], [0, 1], EASE_OUT);
  const fout = iv(g, [b - 14, b - 1], [0, 1], EASE_IN);
  const vis = fin * (1 - fout);
  if (vis <= 0.001) return null;
  const u = clamp01((g - a) / (b - a));
  const secs = 45 * (1 - u);
  const bp = beatPulse(g, 14);
  const t = epTitle();
  const num = epNumber();
  const label = [num ? `ÉP. ${num}` : "", t.kicker ? t.kicker.toUpperCase().slice(0, 14) : ""].filter(Boolean);
  const box = SIZE * 1.32;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          top: TOP,
          display: "flex",
          alignItems: "center",
          gap: 6,
          opacity: vis,
          transform: `translateX(${((1 - fin) * -18).toFixed(1)}px) scale(${(0.92 + 0.08 * fin).toFixed(4)})`,
          transformOrigin: `${box / 2}px ${box / 2}px`,
          filter: fin < 0.99 ? `blur(${((1 - fin) * 8).toFixed(1)}px)` : undefined,
        }}
      >
        <RingTimer progress={1 - u} seconds={secs} size={SIZE} glow={0.12 + 0.22 * bp} />
        {label.length ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              height: 44,
              padding: "0 18px",
              borderRadius: 999,
              background: "linear-gradient(140deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02))",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 8px 22px rgba(0,0,0,0.45)",
              backdropFilter: "blur(12px) saturate(140%)",
              whiteSpace: "nowrap",
              fontFamily: fontMono,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: "0.12em",
            }}
          >
            {label.map((l, i) => (
              <React.Fragment key={i}>
                {i ? <span style={{ width: 5, height: 5, borderRadius: 3, background: "rgba(226,236,250,0.45)" }} /> : null}
                <span style={{ color: i === label.length - 1 && t.kicker ? B.cyan : "rgba(236,244,252,0.88)", marginRight: "-0.12em" }}>{l}</span>
              </React.Fragment>
            ))}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
