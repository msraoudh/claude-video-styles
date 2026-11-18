import React from "react";
import { AbsoluteFill, Sequence, random } from "remotion";
import { fontInter } from "../../kit/fonts";
import { useGlobalFrame } from "../../lib/beat";
import { L } from "../../lib/look";
import { FACE_KEY, IsolatedFace } from "./Face";
import { SwapWorld } from "./SwapWorld";
import { EASE_IN_OUT, EASE_OUT, GlitchBands, iv, smooth } from "./fx";
import { LINES, T } from "./timing";

/**
 * SILENCE 2856–3107. The song is gone; only his voice.
 *  2856–2932  line D, lip-synced, his room pushed into darkness, slow push. « PLUS » / « TARD » land in blood red
 *             on the spoken words.
 *  2932       « ça » — a starburst PORTAL bursts open out of the words (covers his glance away from the lens)
 *  2932–3000  3D wireframe world: PLUS TARD comes through the portal, on « jamais » (2957) every letter turns
 *             edge-on and becomes « JAMAIS. », which lights up and then rushes past the lens.
 *  3000–3099  line E — the darkest, most intimate shot: only his face lit, extreme slow push toward his eyes.
 *  3099–3106  black (the shards of the title are already flying in the fog).
 */
const at = (gf: number) => gf - T.start;
const D = LINES.D;
const E = LINES.E;

const WORD_Y = { plus: 1060, tard: 1300 };
const PORTAL = { x: 540, y: 1250 };

/* ───────────── line D: his face + the two blood-red words ───────────── */
const DFace: React.FC = () => {
  const g = useGlobalFrame();
  const lead = D.from - T.start; // 7 frames of held first frame while the exposure comes up
  const speed = (lf: number) => D.srcIn + Math.max(0, lf - lead) / 60;
  const up = iv(g, [T.start, D.from + 10], [0, 1], EASE_OUT);
  const push = iv(g, [T.start, T.ca + 12], [1.0, 1.13], EASE_IN_OUT);
  return (
    <AbsoluteFill style={{ opacity: up }}>
      <IsolatedFace
        speed={speed}
        scale={push}
        ty={iv(g, [T.start, T.ca], [0, 40])}
        bg="brightness(0.30) saturate(0.5)"
        fg="brightness(1.08) contrast(1.05)"
        mask={FACE_KEY(0.95)}
        rim={0.7}
      />
    </AbsoluteFill>
  );
};

const Word: React.FC<{ text: string; f0: number; y: number; color: string; size: number; glow: string }> = ({ text, f0, y, color, size, glow }) => {
  const g = useGlobalFrame();
  if (g < f0) return null;
  const a = g - f0;
  const s = iv(a, [0, 5], [1.22, 1], EASE_OUT);
  const o = 1;
  // sucked into the portal
  const suck = smooth((g - T.ca) / 7);
  const dy = (PORTAL.y - y) * suck * 0.7;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        textAlign: "center",
        fontFamily: fontInter,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.045em",
        color,
        opacity: o * (1 - suck),
        transform: `translateY(${dy}px) scale(${s * (1 - 0.55 * suck)})`,
        filter: suck > 0.02 ? `blur(${(suck * 14).toFixed(1)}px)` : undefined,
        textShadow: `0 0 40px ${glow}, 0 0 110px ${glow}`,
      }}
    >
      {text}
    </div>
  );
};

const DWords: React.FC = () => {
  const g = useGlobalFrame();
  const jitter = Math.max(iv(g - T.plus, [0, 1, 4], [0, 1, 0]), iv(g - T.tard, [0, 1, 4], [0, 1, 0]));
  return (
    <GlitchBands amount={jitter * 0.6} seed={Math.floor(g / 2)} maxShift={50}>
      <Word text="PLUS" f0={T.plus} y={WORD_Y.plus} color={L.blood} size={250} glow="rgba(255,46,77,0.45)" />
      <Word text="TARD" f0={T.tard} y={WORD_Y.tard} color={L.blood} size={250} glow="rgba(255,46,77,0.45)" />
    </GlitchBands>
  );
};

/* ───────────── the portal (starburst iris) ───────────── */
/** a torn, shard-like hole (irregular radius per vertex, uneven angles) — reality rips open */
const starburst = (r: number, n: number, rot: number, seed: number) => {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const k = 0.66 + 0.56 * random(`po${seed}-${i}`);
    const th = rot + (i / n) * Math.PI * 2 + (random(`pa${seed}-${i}`) - 0.5) * (Math.PI / n) * 0.9;
    pts.push([PORTAL.x + Math.cos(th) * r * k, PORTAL.y + Math.sin(th) * r * k]);
  }
  return pts;
};

const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const g = useGlobalFrame();
  const a = g - T.ca;
  const r = iv(a, [0, 3, 17], [0, 300, 2300], (t) => t * t * (3 - 2 * t));
  const rot = a * 0.02;
  const pts = starburst(r, 13, rot, 7);
  const poly = pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(", ");
  const svgPts = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const rimA = iv(a, [0, 2, 15, 19], [0, 1, 0.75, 0]);
  const open = a >= 19;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={open ? undefined : { clipPath: `polygon(${poly})` }}>{children}</AbsoluteFill>
      {rimA > 0.01 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <filter id="portal-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="9" />
            </filter>
          </defs>
          <polygon points={svgPts} fill="none" stroke="rgba(255,46,77,0.9)" strokeWidth={18} opacity={rimA} filter="url(#portal-glow)" transform="translate(7 0)" />
          <polygon points={svgPts} fill="none" stroke="rgba(125,211,252,0.8)" strokeWidth={14} opacity={rimA * 0.8} filter="url(#portal-glow)" transform="translate(-7 0)" />
          <polygon points={svgPts} fill="none" stroke="#ffffff" strokeWidth={3} opacity={rimA} />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

/* ───────────── line E: the darkest shot ───────────── */
const EFace: React.FC = () => {
  const g = useGlobalFrame();
  const speed = (lf: number) => E.srcIn - (E.from - T.eCut) / 60 + lf / 60;
  const p = iv(g, [T.eCut, T.eEnd], [0, 1]);
  // extreme slow push — continuous, a touch faster in the middle, toward his eyes
  const e = EASE_IN_OUT(p) * 0.65 + p * 0.35;
  const scale = 1.04 + 0.52 * e;
  const ty = 250 * e;
  const breathe = Math.sin((g - T.eCut) / 23) * 0.004;
  const fadeIn = iv(g, [T.eCut, T.eCut + 4], [0.2, 1]);
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <IsolatedFace
        speed={speed}
        scale={scale + breathe}
        ty={ty}
        origin="50% 21%"
        bg="brightness(0.13) saturate(0.4)"
        fg="brightness(0.9) contrast(1.14) saturate(0.8) hue-rotate(-6deg)"
        mask={FACE_KEY(1, "50% 23%")}
        rim={0.45}
        rimColor="110,150,255"
      />
      {/* a cold top light falling on him, everything else is night */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 45% at 50% 30%, rgba(0,0,0,0) 36%, rgba(0,0,0,0.68) 100%)" }} />
    </AbsoluteFill>
  );
};

export const Silence: React.FC = () => (
  <AbsoluteFill>
    {/* D: face from the section start (held first frame) to the end of the portal opening */}
    <Sequence from={at(T.start)} durationInFrames={T.ca + 20 - T.start} name="D face" premountFor={10}>
      <DFace />
    </Sequence>
    <Sequence from={at(T.plus)} durationInFrames={T.ca + 8 - T.plus} name="PLUS TARD 2D" premountFor={0}>
      <DWords />
    </Sequence>
    {/* the wireframe world through the portal */}
    <Sequence from={at(T.ca)} durationInFrames={T.eCut - T.ca} name="PLUS TARD → JAMAIS. (3D)" premountFor={20}>
      <Portal>
        <SwapWorldFromGlobal />
      </Portal>
    </Sequence>
    {/* E */}
    <Sequence from={at(T.eCut)} durationInFrames={T.eEnd - T.eCut} name="E face" premountFor={20}>
      <EFace />
    </Sequence>
  </AbsoluteFill>
);

const SwapWorldFromGlobal: React.FC = () => {
  const g = useGlobalFrame();
  return <SwapWorld g={g} />;
};
