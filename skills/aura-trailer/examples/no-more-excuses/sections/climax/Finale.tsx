import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Shot } from "../../components/Shot";
import { fontInter, fontMono } from "../../kit/fonts";
import { bassShake, useGlobalFrame } from "../../lib/beat";
import type { Grade } from "../../lib/look";
import { L } from "../../lib/look";
import { EASE_OUT, FlashFrame, GlitchBands, hitEnv, iv } from "./fx";
import { T } from "./timing";
import { textAdvance } from "./glyphs";

/**
 * FINALE 3237–3451 (the hero shot 3451→ lives in EndCard: it carries the tape stop).
 * Strobe montage cut on the 808s / beat subdivisions. Four « chapters », each word held for a whole beat while
 * four clips strobe under it (quarter-beat cuts), then a bar of faces (quarters), a bar of faces at eighths with
 * black/white flash frames, into the hero.
 *  beats 3253 3285(808 3286) 3321(808 3319) 3355 3387 3419 3451
 */
const at = (gf: number) => gf - T.start;

type Cut = { f: number; clip: string; at: number; grade?: Grade; filter?: string; speed?: number; z?: [number, number]; focus?: string };

const INVERT = "invert(1) hue-rotate(180deg) brightness(0.9) contrast(1.1)"; // his n8n canvases in dark mode
const FACE_LOOK = "brightness(0.8) contrast(1.12) saturate(0.78)"; // his faces sit in the cold, dark world of the trailer
const CUTS: Cut[] = [
  // BIG HIT 3237: two slow-mo hero flashes
  { f: 3237, clip: "f16", at: 0.5, speed: 0.3, z: [1.3, 1.12] },
  { f: 3245, clip: "f22", at: 1.0, speed: 0.3, z: [1.2, 1.1] },
  // 01 CLOUD.
  { f: 3253, clip: "e06", at: 0.9, grade: "screen" },
  { f: 3261, clip: "m07", at: 2.05, grade: "screen" },
  { f: 3270, clip: "f21", at: 1.1 },
  { f: 3278, clip: "e05", at: 2.2, grade: "screen" },
  // 02 IA.
  { f: 3286, clip: "e02", at: 1.2, grade: "screen" },
  { f: 3294, clip: "s07", at: 0.6, grade: "screen", z: [1.25, 1.15] },
  { f: 3303, clip: "s08", at: 1.0, grade: "screen" },
  { f: 3311, clip: "f15", at: 1.2 },
  // 03 AUTOMATION.
  { f: 3319, clip: "s04", at: 1.0, grade: "screen", filter: INVERT, z: [1.15, 1.05] },
  { f: 3328, clip: "s05", at: 1.2, grade: "screen", filter: INVERT, z: [1.15, 1.05] },
  { f: 3337, clip: "f26", at: 1.2, z: [1.15, 1.05] },
  { f: 3346, clip: "s03", at: 1.4, grade: "screen", filter: INVERT, z: [1.15, 1.05] },
  // 04 CONTENU.
  { f: 3355, clip: "m02", at: 1.3, grade: "screen" },
  { f: 3363, clip: "e08", at: 2.2, grade: "screen" },
  { f: 3371, clip: "m03", at: 0.35, grade: "screen" },
  { f: 3379, clip: "s06", at: 1.8, grade: "screen", z: [1.55, 1.38] },
  // bar of faces (quarters)
  { f: 3387, clip: "f20", at: 1.1 },
  { f: 3395, clip: "f09", at: 0.3 },
  { f: 3403, clip: "f17", at: 2.1 },
  { f: 3411, clip: "f18", at: 1.2 },
  // bar of faces (eighths) with flash frames
  { f: 3419, clip: "f05", at: 1.2, grade: "mono" },
  { f: 3423, clip: "f13", at: 1.6 },
  { f: 3427, clip: "f23", at: 1.3, grade: "mono" },
  { f: 3431, clip: "f01", at: 0.6 },
  { f: 3435, clip: "f14", at: 1.2, grade: "mono" },
  { f: 3439, clip: "f19", at: 2.0 },
  { f: 3443, clip: "f24", at: 1.2, grade: "mono" },
  { f: 3447, clip: "f25", at: 0.8 },
];
const FINALE_END = T.hero;

const WORDS: Array<{ f: number; to: number; text: string; n: string }> = [
  { f: 3253, to: 3286, text: "CLOUD.", n: "01" },
  { f: 3286, to: 3319, text: "IA.", n: "02" },
  { f: 3319, to: 3355, text: "AUTOMATION.", n: "03" },
  { f: 3355, to: 3387, text: "CONTENU.", n: "04" },
];

const CutShot: React.FC<{ c: Cut; len: number; idx: number }> = ({ c, len, idx }) => {
  const g = useGlobalFrame();
  const lf = g - c.f;
  const z = c.z ?? (idx % 2 ? [1.02, 1.12] : [1.14, 1.03]);
  const s = iv(lf, [0, len], z, EASE_OUT);
  const sh = bassShake(g, 7);
  const isFace = c.clip.startsWith("f");
  const inWord = WORDS.some((w) => c.f >= w.f && c.f < w.to);
  return (
    <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) scale(${s})` }}>
      <Shot clip={c.clip} at={c.at} speed={c.speed ?? 1} grade={c.grade ?? "cold"} filter={`${c.filter ?? ""} ${isFace ? FACE_LOOK : ""} ${inWord ? "brightness(0.62)" : ""}`} focus={c.focus} />
    </AbsoluteFill>
  );
};

const WordCard: React.FC<{ w: (typeof WORDS)[number] }> = ({ w }) => {
  const g = useGlobalFrame();
  const a = g - w.f;
  const slam = iv(a, [0, 5], [1.2, 1], EASE_OUT);
  // a small jolt on every quarter cut under it
  const lastCut = CUTS.filter((c) => c.f <= g).pop()?.f ?? w.f;
  const jolt = iv(g - lastCut, [0, 4], [1.035, 1], EASE_OUT);
  const glitch = iv(a, [0, 1, 4], [1, 0.8, 0]);
  const size = Math.min(210, Math.floor(870 / textAdvance(w.text, 1, -0.045))); // fits the safe width (x 90–990)
  return (
    <AbsoluteFill>
      {/* dark backing so the word reads on any clip */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 16% at 50% 50%, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0) 100%)" }} />
      <GlitchBands amount={glitch * 0.7} seed={w.f + Math.floor(g / 2)} maxShift={70}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${slam * jolt})` }}>
          <div style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 30, letterSpacing: "0.5em", paddingLeft: "0.5em", color: L.steel2, marginBottom: 26 }}>{w.n} / 04</div>
          <div
            style={{
              fontFamily: fontInter,
              fontWeight: 800,
              fontSize: size,
              lineHeight: 1,
              letterSpacing: "-0.045em",
              color: L.steel,
              textShadow: "0 0 50px rgba(0,0,0,0.85), 0 0 24px rgba(160,200,255,0.25)",
              whiteSpace: "nowrap",
            }}
          >
            {w.text}
          </div>
        </AbsoluteFill>
      </GlitchBands>
    </AbsoluteFill>
  );
};

const Flashes: React.FC = () => {
  const g = useGlobalFrame();
  // white flash frames on the strong 808s of the montage (TrailerFX owns the 3237 one), black+white in the eighths
  const w =
    hitEnv(g - 3286, [0, 1, 3], [0.6, 0.35, 0]) +
    hitEnv(g - 3319, [0, 1, 3], [0.7, 0.4, 0]) +
    hitEnv(g - 3387, [0, 1, 3], [0.5, 0.25, 0]) +
    [3423, 3431, 3439, 3447].reduce((s, f) => s + (g === f ? 0.55 : 0), 0);
  const b = [3419, 3427, 3435, 3443].some((f) => g === f) ? 0.75 : 0;
  return (
    <>
      <FlashFrame a={b} color="#000" blend="normal" />
      <FlashFrame a={w} />
    </>
  );
};

export const Finale: React.FC = () => (
  <AbsoluteFill>
    {CUTS.map((c, i) => {
      const end = i < CUTS.length - 1 ? CUTS[i + 1].f : FINALE_END;
      return (
        <Sequence key={c.f} from={at(c.f)} durationInFrames={end - c.f} name={`${c.f} ${c.clip}`} premountFor={6}>
          <CutShot c={c} len={end - c.f} idx={i} />
        </Sequence>
      );
    })}
    {WORDS.map((w) => (
      <Sequence key={w.text} from={at(w.f)} durationInFrames={w.to - w.f} name={w.text} premountFor={0}>
        <WordCard w={w} />
      </Sequence>
    ))}
    <Sequence from={at(T.hit2)} durationInFrames={FINALE_END - T.hit2} name="finale flashes" premountFor={0}>
      <Flashes />
    </Sequence>
  </AbsoluteFill>
);
