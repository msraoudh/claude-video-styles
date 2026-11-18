// HERO · « LES 1000 VERSIONS DE LUI » — his many reels / outfits cut on the beat.
// Montage I 943–1171 (cuts every 2 beats → every beat, flash frames on the half-beats),
// Montage II 1644–1803 (every beat → every half-beat, freeze + mono, ramps, glitch, final push into 1804).
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { ramp, Shot } from "../../components/Shot";
import { bassShake, beatPulse, rand, useGlobalFrame } from "../../lib/beat";
import { L, type Grade } from "../../lib/look";
import { At, cl, ease, GlitchSlices, IN, Mono, OUT, Pop, RgbSplit } from "./fx";
import { FLASHES, T } from "./timeline";

export type Cut = {
  from: number;
  to: number;
  clip: string;
  at: number;
  /** speed or a ramp built with ramp(at, rampAtLocal, slow) */
  speed?: number | ((lf: number) => number);
  focus?: string;
  grade?: Grade;
  /** scale on the cut frame, snapping to 1 over `snapLen` frames (the edit's punch-in on every cut) */
  snap?: number;
  snapLen?: number;
  /** slow in-shot push: scale multiplier reached at the end of the shot */
  push?: number;
  punch?: number;
  shake?: number;
  /** extra base scale (e.g. to crop burned-in overlays) */
  base?: number;
  filter?: string;
  /** frames of glitch slices from the cut */
  glitch?: number;
  /** px of RGB split */
  rgb?: number | ((g: number) => number);
  pop?: number;
};

const CutShot: React.FC<{ c: Cut }> = ({ c }) => {
  const g = useGlobalFrame();
  const snap = c.snap ?? 1.1;
  const sLen = c.snapLen ?? 6;
  const s0 = interpolate(g, [c.from, c.from + sLen], [snap, 1], { ...cl, easing: OUT });
  const pushK = interpolate(g, [c.from, c.to], [1, c.push ?? 1.04], cl);
  const scale = (c.base ?? 1) * s0 * pushK;
  const shot = (
    <Shot
      clip={c.clip}
      at={c.at}
      speed={c.speed ?? 1}
      focus={c.focus ?? "50% 32%"}
      grade={c.grade ?? "cold"}
      scale={scale}
      punch={c.punch ?? 0.05}
      shake={c.shake ?? 7}
      filter={c.grade === "mono" ? c.filter : `contrast(1.1) brightness(0.93) ${c.filter ?? ""}`}
    />
  );
  const rgb = typeof c.rgb === "function" ? c.rgb(g) : (c.rgb ?? 0);
  const glitchK = c.glitch ? interpolate(g - c.from, [0, c.glitch], [1, 0], cl) : 0;
  return (
    <AbsoluteFill>
      <GlitchSlices f={g} seed={c.from} amount={glitchK} bands={4}>
        <RgbSplit px={rgb}>{shot}</RgbSplit>
      </GlitchSlices>
      {c.grade === "mono" ? null : <ColdLook />}
      <Pop f={g} at={c.from} peak={c.pop ?? 0.1} />
    </AbsoluteFill>
  );
};

/** Local thriller look on top of GRADE.cold: navy soft-light in the mids, deeper blacks. (No vignette/grain: TrailerFX owns those.) */
export const ColdLook: React.FC<{ k?: number }> = ({ k = 1 }) => (
  <>
    <AbsoluteFill style={{ background: "rgb(128,128,128)", mixBlendMode: "saturation", opacity: 0.3 * k, pointerEvents: "none" }} />
    <AbsoluteFill style={{ background: "#9db2d8", mixBlendMode: "multiply", opacity: 0.55 * k, pointerEvents: "none" }} />
    <AbsoluteFill style={{ background: "#0d1a33", mixBlendMode: "soft-light", opacity: 0.3 * k, pointerEvents: "none" }} />
  </>
);

export const Cuts: React.FC<{ cuts: Cut[] }> = ({ cuts }) => (
  <>
    {cuts.map((c) => (
      <At key={`${c.clip}-${c.from}`} from={c.from} to={c.to} name={`${c.clip} @${c.from}`}>
        <CutShot c={c} />
      </At>
    ))}
  </>
);

/* ───────── Montage I ───────── */
export const M1_CUTS: Cut[] = [
  // the dossier portrait comes alive (match cut from the dive: same clip, same frame)
  { from: T.m1, to: T.m1b, clip: "f18", at: 1.8, focus: "50% 32%", snap: 1.09, snapLen: 10, push: 1.05, pop: 0.18 },
  { from: T.m1b, to: T.m1c, clip: "f16", at: 0.55, focus: "50% 30%", push: 1.06 },
  { from: T.m1c, to: T.m1d, clip: "f06", at: 1.05, focus: "50% 26%", snap: 1.16, push: 1.03 },
  { from: T.m1d, to: T.m1e, clip: "f20", at: 1.12, focus: "50% 30%", snap: 1.14 },
  // ramps into slow-mo so the freeze of line B lands on a held breath
  { from: T.m1e, to: T.bFreeze, clip: "f19", at: 1.55, speed: ramp(1.55, 12, 0.3), focus: "50% 32%", snap: 1.14, push: 1.08 },
];

const FlashFrames: React.FC = () => (
  <>
    {FLASHES.map((fl) => (
      <At key={fl.f} from={fl.f} to={fl.f + fl.len} name={`flash ${fl.clip}`}>
        <AbsoluteFill>
          <Shot clip={fl.clip} at={fl.at} speed={0} grade="mono" scale={1.12} focus="50% 30%" />
          <AbsoluteFill style={{ background: "#fff", mixBlendMode: "screen", opacity: 0.18 }} />
        </AbsoluteFill>
      </At>
    ))}
  </>
);

/** small archive HUD over the montage: reel id + a timecode that jumps reel to reel */
const ArchiveHud: React.FC<{ cuts: Cut[]; from: number; to: number }> = ({ cuts, from, to }) => {
  const g = useGlobalFrame();
  if (g < from || g >= to) return null;
  const idx = Math.max(0, cuts.findIndex((c) => g >= c.from && g < c.to));
  const c = cuts[idx];
  const reel = 3 + Math.floor(rand(c.from) * 48);
  const tsec = Math.floor(rand(c.from + 1) * 50) + (g - c.from) / 60 + c.at;
  const tc = `00:00:${String(Math.floor(tsec)).padStart(2, "0")}:${String(Math.floor((tsec % 1) * 30)).padStart(2, "0")}`;
  const k = ease(g, from, from + 8, 0, 1);
  return (
    <AbsoluteFill style={{ opacity: k * 0.9, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 90, top: 236, display: "flex", gap: 18, alignItems: "center" }}>
        <div style={{ width: 10, height: 10, borderRadius: 5, background: L.blood, boxShadow: `0 0 10px ${L.blood}`, opacity: g % 30 < 18 ? 1 : 0.25 }} />
        <Mono size={25} color={L.steel}>
          Archives · reel {String(reel).padStart(2, "0")}/52
        </Mono>
      </div>
      <div style={{ position: "absolute", left: 90, top: 1500 }}>
        <Mono size={24} color={L.steel2} ls={0.24}>
          {tc}
        </Mono>
      </div>
    </AbsoluteFill>
  );
};

export const Montage1: React.FC = () => (
  <>
    <Cuts cuts={M1_CUTS} />
    <FlashFrames />
    <ArchiveHud cuts={M1_CUTS} from={T.m1 + 4} to={T.bFreeze} />
  </>
);

/* ───────── Montage II (builds to 1804) ───────── */
const tension = (g: number) => interpolate(g, [T.m2c, SEC_LAST], [0, 1], cl);
const SEC_LAST = 1803;

export const M2_CUTS: Cut[] = [
  { from: T.m2a, to: T.m2b, clip: "f09", at: 0.75, focus: "50% 30%", snap: 1.14, push: 1.06, shake: 8 },
  { from: T.m2b, to: T.m2c, clip: "f11", at: 0.25, speed: ramp(0.25, 9, 0.3), focus: "50% 28%", base: 1.06, snap: 1.12, push: 1.08 },
  // half-beat strobe from the downbeat 1704
  // downbeat: his « No more excuses » reel
  { from: T.m2c, to: T.m2d, clip: "f07", at: 1.05, focus: "50% 26%", base: 1.08, snap: 1.2, shake: 10, pop: 0.3 },
  { from: T.m2d, to: T.m2e, clip: "f24", at: 1.2, focus: "50% 26%", snap: 1.18, shake: 10 },
  { from: T.m2e, to: T.m2f, clip: "f05", at: 0.9, focus: "50% 30%", snap: 1.2, shake: 11, rgb: 3 },
  // freeze + mono (camera shutter)
  { from: T.m2f, to: T.m2g, clip: "f10", at: 0.55, speed: 0, grade: "mono", focus: "50% 30%", snap: 1.05, push: 1.07, shake: 4, pop: 0.45 },
  { from: T.m2g, to: T.m2h, clip: "f15", at: 1.0, focus: "50% 28%", snap: 1.2, shake: 12, glitch: 4 },
  { from: T.m2h, to: T.last, clip: "f25", at: 1.0, speed: 0.35, focus: "50% 30%", snap: 1.18, shake: 12, rgb: 5 },
  // the last beat: his eyes, frozen, the camera sucked in, the world closing in → 1804 (escalate)
  {
    from: T.last,
    to: SEC_LAST + 1,
    clip: "f14",
    at: 1.25,
    speed: 0,
    grade: "mono",
    focus: "50% 34%",
    snap: 1.0,
    push: 1.32,
    shake: 16,
    filter: "contrast(1.3) brightness(0.8)",
    rgb: (g) => interpolate(g, [T.last, SEC_LAST], [2, 14], cl),
    pop: 0.5,
  },
];

const Closing: React.FC = () => {
  const g = useGlobalFrame();
  const k = tension(g);
  // darkness creeping from the edges over the strobe, then closing to a slit on the last frames
  const end = interpolate(g, [T.last + 2, SEC_LAST], [0, 1], { ...cl, easing: IN });
  const inner = 70 - 40 * k - 25 * end;
  const sh = bassShake(g, 4 + 10 * k);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 62% at 50% 40%, rgba(0,0,0,0) ${Math.max(5, inner)}%, rgba(0,0,0,${(0.35 + 0.5 * k).toFixed(3)}) 100%)`,
          transform: `translate(${sh.x * 0.3}px, ${sh.y * 0.3}px)`,
        }}
      />
      {end > 0 ? <AbsoluteFill style={{ background: "#000", opacity: 0.85 * end * end }} /> : null}
      {/* the beat pumps light into the strobe */}
      <AbsoluteFill style={{ background: "#cfdcff", mixBlendMode: "screen", opacity: 0.08 * beatPulse(g, 6) * k }} />
    </AbsoluteFill>
  );
};

export const Montage2: React.FC = () => (
  <>
    <Cuts cuts={M2_CUTS} />
    <At from={T.m2c} to={SEC_LAST + 1} name="tension">
      <Closing />
    </At>
  </>
);
