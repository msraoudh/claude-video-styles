import React from "react";
import { Shot } from "../../components/Shot";
import { bassShake, useGlobalFrame } from "../../lib/beat";
import { decay, decayAny, EO, lin, rgba } from "./lib";

type RGB = [number, number, number];

/**
 * the user's series PIP card recipe (cinematic-reel-builder/rules/talking-head.md): the 9-layer iOS liquid-glass
 * shadow stack + top bloom, bottom inner shadow, specular, counter-specular, gradient ring, micro-grain.
 * Here it frames one of my previous reels for him, slammed in with a 3D tilt (evidence hit).
 */
export const glassStack = (accent: RGB, second: RGB) =>
  [
    "0 0 0 0.5px rgba(255,255,255,0.18)",
    "0 6px 18px rgba(0,0,0,0.55)",
    "0 38px 80px rgba(0,0,0,0.5)",
    `0 0 90px ${rgba(accent, 0.28)}`,
    `0 -22px 70px ${rgba(second, 0.18)}`,
    "inset 0 0.6px 0 rgba(255,255,255,0.55)",
    "inset 0 16px 28px -16px rgba(255,255,255,0.22)",
    "inset 0 -0.6px 0 rgba(0,0,0,0.5)",
    "inset 0 -18px 32px -16px rgba(0,0,0,0.55)",
  ].join(", ");

export const GlassSkin: React.FC<{ radius: number; accent: RGB; second: RGB; sheen?: number }> = ({ radius, accent, second, sheen = -1 }) => (
  <>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "32%", background: "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 40%, transparent 100%)", mixBlendMode: "screen" }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "32%", background: "linear-gradient(0deg, rgba(0,0,0,0.38) 0%, transparent 100%)" }} />
    <div style={{ position: "absolute", top: -8, left: -8, width: "55%", height: "45%", background: "radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 30%, transparent 60%)", mixBlendMode: "screen" }} />
    <div style={{ position: "absolute", bottom: -8, right: -8, width: "45%", height: "35%", background: `radial-gradient(ellipse at 75% 80%, ${rgba(second, 0.18)} 0%, transparent 60%)`, mixBlendMode: "screen" }} />
    {sheen >= 0 && sheen <= 1 ? (
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, transparent ${(sheen * 140 - 30).toFixed(1)}%, rgba(255,255,255,0.22) ${(sheen * 140 - 18).toFixed(1)}%, transparent ${(sheen * 140 - 6).toFixed(1)}%)`, mixBlendMode: "screen" }} />
    ) : null}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        padding: 1.5,
        background: `linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 25%, ${rgba(accent, 0.18)} 60%, rgba(255,255,255,0.28) 100%)`,
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }}
    />
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.025), transparent 60%), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.02), transparent 50%)", mixBlendMode: "overlay" }} />
  </>
);

/** A previous reel (m02/m03/m04) as an evidence card: slams in tilted on the 808, settles, kicks on `kicks`. */
export const EvidenceCard: React.FC<{ clip: string; at: number; from: number; to: number; accent: RGB; second?: RGB; speed?: number; tiltFrom?: number; kicks?: number[]; focus?: string; scaleIn?: number }> = ({ clip, at, from, to, accent, second = [167, 139, 250], speed = 1, tiltFrom = 1, kicks = [], focus = "50% 50%", scaleIn = 1 }) => {
  const g = useGlobalFrame();
  const W = 784, H = 1394, R = 48;
  const p = lin(g, from, from + 9, 0, 1, EO);
  const drift = (g - from) / Math.max(1, to - from);
  const ry = tiltFrom * (24 * (1 - p) + 7 - 10 * drift);
  const rx = 9 * (1 - p) + 2.5;
  const z = -380 * (1 - p) + 30 * drift;
  const k = decayAny(g, kicks, 6);
  const sc = (1.0 + 0.05 * k) * scaleIn;
  const sh = bassShake(g, 9);
  const flash = decay(g, from, 2);
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1700 }}>
      <div
        style={{
          position: "absolute",
          left: 540 - W / 2 + sh.x,
          top: 902 - H / 2 + sh.y,
          width: W,
          height: H,
          transform: `translateZ(${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) scale(${sc.toFixed(4)})`,
          borderRadius: R,
          overflow: "hidden",
          boxShadow: glassStack(accent, second),
          background: "#03060d",
          isolation: "isolate",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H }}>
          <Shot clip={clip} at={at} speed={speed} grade="screen" focus={focus} />
        </div>
        <GlassSkin radius={R} accent={accent} second={second} sheen={lin(g, from + 6, from + 26, 0, 1)} />
        {flash > 0.02 ? <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash * 0.6, mixBlendMode: "screen" }} /> : null}
      </div>
    </div>
  );
};
