// HERO · 1171–1295 — line B « Dans ma tête, j'avais les idées de fou. » (master-v4, lip-synced).
// 1171 (beat): his face frozen in mono (shutter) — it comes alive in colour on the first word (1188 = B.from,
// source time B.srcIn). 1203 (downbeat): jump punch-in. 1236 (beat): jump-cut wide — the room falls to black,
// he is isolated, « IDÉES » (1248, on the word) and « DE FOU » (1261) land BEHIND him (plate → text → matte).
// 1266 (beat): punch on « FOU ». The Shot/Matte for the talking part is ONE continuous Sequence from B.from
// with at = B.srcIn, so the lips stay exact whatever the framing does.
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { Matte, Shot } from "../../components/Shot";
import { bassShake, beatPulse, useGlobalFrame } from "../../lib/beat";
import { L } from "../../lib/look";
import { At, Big, cl, ease, OUT, Pop, RgbSplit } from "./fx";
import { ColdLook } from "./Montage";
import { B, T } from "./timeline";

/** wide framing: the plate shrinks toward the bottom so the space above his head is free for the words */
const WIDE = 0.7;
const EDGE_FEATHER = "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 3%, #000 8%), linear-gradient(to right, transparent 0%, #000 9%, #000 91%, transparent 100%)";

/** source time: lip-synced from B.from, held on the last frame once the line is over (no silent lips) */
const talkTime = (lf: number) => B.srcIn + Math.min(lf, B.durationInFrames) / 60;

const framing = (g: number) => {
  if (g < T.bPunch) return { s: 1.0 + 0.02 * ease(g, B.from, T.bPunch, 0, 1), ox: 50, oy: 36, wide: false };
  if (g < T.bWide) return { s: ease(g, T.bPunch, T.bPunch + 5, 1.2, 1.13) + 0.015 * ease(g, T.bPunch, T.bWide, 0, 1), ox: 50, oy: 30, wide: false };
  return { s: WIDE, ox: 50, oy: 100, wide: true };
};

const Words: React.FC<{ g: number }> = ({ g }) => {
  const land = (at: number) => ({
    o: ease(g, at, at + 4, 0, 1),
    s: ease(g, at, at + 7, 1.28, 1),
    b: ease(g, at, at + 6, 14, 0),
  });
  const a = land(1248);
  const b = land(1261);
  const fou = g >= 1268 ? ease(g, 1268, 1276, 1, 0) : 0;
  const glow = 0.35 + 0.65 * fou;
  return (
    <AbsoluteFill>
      {g >= 1248 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 236, display: "flex", justifyContent: "center", opacity: a.o, transform: `scale(${a.s})`, filter: `blur(${a.b}px)` }}>
          <Big size={270} ls={-0.05} style={{ textShadow: "0 0 60px rgba(125,170,255,0.25)" }}>
            Idées
          </Big>
        </div>
      ) : null}
      {g >= 1261 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 452, display: "flex", justifyContent: "center", opacity: b.o, transform: `scale(${b.s})`, filter: `blur(${b.b}px)` }}>
          <Big size={270} ls={-0.05}>
            De{" "}
            <span style={{ color: fou > 0.05 ? "#e9e2ff" : L.steel, textShadow: `0 0 ${40 + 60 * fou}px rgba(167,139,250,${glow.toFixed(2)})` }}>Fou</span>
          </Big>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const Talking: React.FC = () => {
  const g = useGlobalFrame();
  const fr = framing(g);
  const fouPunch = g >= T.bFou ? ease(g, T.bFou, T.bFou + 5, 1.16, 1.1) : 1;
  const sh = bassShake(g, fr.wide ? 5 : 7);
  const kick = beatPulse(g, 8);
  const plateStyle: React.CSSProperties = {
    transform: `scale(${fr.s})`,
    transformOrigin: `${fr.ox}% ${fr.oy}%`,
  };
  // the room falls to black in the wide (subject isolated by the matte)
  const darkPlate = "brightness(0.42) saturate(0.6)";
  const rgb = g >= 1268 && g < 1271 ? 6 : 0;
  return (
    <AbsoluteFill style={{ background: L.ink }}>
      <AbsoluteFill
        style={{
          transform: `translate(${sh.x}px, ${sh.y}px) scale(${fouPunch * (1 + 0.012 * kick)})`,
          transformOrigin: "50% 42%",
        }}
      >
        <RgbSplit px={rgb}>
          {fr.wide ? (
            <>
              {/* the room is gone: he stands in the dark, a cold light behind him, the words behind his head */}
              <AbsoluteFill style={{ background: "radial-gradient(ellipse 58% 36% at 50% 66%, rgba(70,100,190,0.34) 0%, rgba(25,35,80,0.14) 45%, rgba(0,0,0,0) 75%)" }} />
              <Words g={g} />
              {/* the master's frame edges (his hair touches the top, his arms the sides) are feathered so he emerges from the dark */}
              <AbsoluteFill style={{ ...plateStyle, maskImage: EDGE_FEATHER, WebkitMaskImage: EDGE_FEATHER, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}>
                <Matte at={B.srcIn} speed={talkTime} focus="50% 40%" grade="cold" filter="brightness(0.95) contrast(1.06)" />
              </AbsoluteFill>
              <AbsoluteFill style={{ background: "#14284e", mixBlendMode: "soft-light", opacity: 0.4 }} />
            </>
          ) : (
            <>
              <AbsoluteFill style={plateStyle}>
                <Shot clip="master-v4" at={B.srcIn} speed={talkTime} focus="50% 40%" grade="cold" filter={darkPlate} />
              </AbsoluteFill>
              {/* the blue wall sinks, he stays lit (matte on top of the darkened plate) */}
              <AbsoluteFill style={plateStyle}>
                <Matte at={B.srcIn} speed={talkTime} focus="50% 40%" grade="cold" filter="brightness(0.95)" />
              </AbsoluteFill>
              <ColdLook k={0.6} />
            </>
          )}
        </RgbSplit>
      </AbsoluteFill>
      <Pop f={g} at={T.bPunch} peak={0.12} />
      <Pop f={g} at={T.bWide} peak={0.2} />
      <Pop f={g} at={T.bFou} peak={0.14} col={[200, 180, 255]} />
    </AbsoluteFill>
  );
};

const Frozen: React.FC = () => {
  const g = useGlobalFrame();
  // eases to exactly the talking framing (scale 1) so the release on « dans » is seamless, not a cut
  const s = interpolate(g, [T.bFreeze, B.from], [1.07, 1.0], { ...cl, easing: OUT });
  return (
    <AbsoluteFill style={{ background: L.ink }}>
      <Shot clip="master-v4" at={B.srcIn} speed={0} grade="mono" focus="50% 40%" scale={s} filter="brightness(0.4)" />
      <Matte at={B.srcIn} speed={0} grade="mono" focus="50% 40%" scale={s} />
      {/* shutter: two white frames, then the freeze holds its breath */}
      <AbsoluteFill style={{ background: "#fff", opacity: interpolate(g - T.bFreeze, [0, 1, 3], [0.7, 0.4, 0], cl) }} />
    </AbsoluteFill>
  );
};

export const LineB: React.FC = () => (
  <>
    <At from={T.bFreeze} to={B.from} name="B freeze">
      <Frozen />
    </At>
    <At from={B.from} to={T.w1} name="B talking (lip-sync)">
      <Talking />
    </At>
  </>
);
