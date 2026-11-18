import React from "react";
import { AbsoluteFill } from "remotion";
import { Shot } from "../../components/Shot";
import { fontInter } from "../../kit/fonts";
import { bassShake, useGlobalFrame } from "../../lib/beat";
import { L, type Grade } from "../../lib/look";
import { Cutout, placeHead } from "./Cutout";
import { Beams, Dust, Falloff, Flare, Flash, Glitch, Shockwave, Stage } from "./FX";
import { decay, decayAny, EIO, EO, H808, lin } from "./lib";
import { SliceWall, type WallLine } from "./SliceWall";
import { Slam } from "./Type";

/* ------------------------------------------------------------------------------------------------ */
/* Face strobe shot                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

/**
 * One face clip of the strobe: zoom-in on the cut (1.14 → 1, the "punch on jump cut" from his reel), 808 punches,
 * sub-bass shake, a 2-frame flash and an RGB split that decays from the cut. Optional glitch slices.
 */
export const FaceShot: React.FC<{
  id: string;
  clip: string;
  at: number;
  from: number;
  speed?: number | ((lf: number) => number);
  focus?: string;
  grade?: Grade;
  filter?: string;
  zoom?: number;
  rgb?: number;
  slice?: number;
  flash?: number;
  base?: number;
}> = ({ id, clip, at, from, speed = 1, focus = "50% 38%", grade = "cold", filter, zoom = 0.14, rgb = 10, slice = 0, flash = 0.22, base = 1.04 }) => {
  const g = useGlobalFrame();
  const p = lin(g, from, from + 9, 0, 1, EO);
  const hit = decayAny(g, H808, 5);
  const scale = base * (1 + zoom * (1 - p)) * (1 + 0.04 * hit);
  const r = rgb * decay(g, from, 3) + 4 * hit;
  const sl = slice * decay(g, from, 2.5);
  return (
    <AbsoluteFill style={{ background: L.ink }}>
      <Glitch id={id} rgb={r} slice={sl} seed={(from % 97) + 3} expo={1 + 1.6 * flash * decay(g, from, 1.6)}>
        <Shot clip={clip} at={at} speed={speed} focus={focus} grade={grade} filter={filter ?? (grade === "cold" ? "brightness(0.95) saturate(0.8) contrast(1.06)" : undefined)} scale={scale} shake={12} />
        <div style={{ position: "absolute", inset: 0, background: "#a3b6d8", mixBlendMode: "multiply", opacity: grade === "screen" ? 0 : 1 }} />
      </Glitch>
      <Falloff a={0.55} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------------ */
/* Text behind him                                                                                   */
/* ------------------------------------------------------------------------------------------------ */

/** « ADAPTE- » (1804) « TOI. » (1836) — the bass section opens on his own slogan, behind him. */
export const TbsAdapte: React.FC = () => {
  const g = useGlobalFrame();
  const s = 0.8 + 0.035 * lin(g, 1804, 1869, 0, 1, EIO) + 0.014 * decay(g, 1836, 6);
  const pos = placeHead(s, 664, 940);
  return (
    <AbsoluteFill>
      <Glitch id="adapte" rgb={12 * decay(g, 1804, 3) + 9 * decay(g, 1836, 3)} slice={18 * decay(g, 1836, 2)} seed={11} expo={1 + 0.3 * decay(g, 1836, 1.5)}>
        <Stage glow={[70, 110, 170]} glowA={0.34} gx={62} gy={46} />
        <Beams intensity={0.5} x={64} y={-6} seed="adapte" />
        <Dust a={0.35} seed="adust" cx={620} />
        <Slam text="ADAPTE-" at={1804} x={52} y={262} size={222} />
        <Slam text="TOI." at={1836} x={42} y={448} size={430} />
        <Cutout at={35.3} speed={0.12} s={s} x={pos.x} y={pos.y} shake={7} />
        <Falloff a={0.5} />
      </Glitch>
      <Flash at={1804} frames={0.7} strength={0.85} />
    </AbsoluteFill>
  );
};

const Marquee: React.FC<{ text: string; y: number; size: number; dir: 1 | -1; off: number; outline?: boolean; opacity?: number; color?: string }> = ({ text, y, size, dir, off, outline, opacity = 1, color = L.steel }) => {
  const unit = (text.length * 0.6 + 0.2) * size; // rough advance of one repetition
  const o = ((off % unit) + unit) % unit;
  const tx = dir > 0 ? -unit + o : -o;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: y,
        transform: `translateX(${tx.toFixed(1)}px)`,
        whiteSpace: "nowrap",
        fontFamily: fontInter,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 0.82,
        letterSpacing: "-0.04em",
        color: outline ? "transparent" : color,
        WebkitTextStroke: outline ? `3px ${color}` : undefined,
        opacity,
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <span key={i} style={{ display: "inline-block", width: unit }}>
          {text}
        </span>
      ))}
    </div>
  );
};

/** « MOVE ON. » — rows of his slogan scrolling behind him, kicking forward on each 808. */
export const TbsMoveOn: React.FC<{ from: number; to: number; at?: number }> = ({ from, to, at = 24.2 }) => {
  const g = useGlobalFrame();
  const kicks = H808.filter((h) => h >= from && h < to);
  let kick = 0;
  for (const k of kicks) kick += 210 * lin(g, k, k + 12, 0, 1, EO);
  const off = (g - from) * 4.2 + kick;
  const s = 0.8 + 0.03 * lin(g, from, to, 0, 1, EIO) + 0.012 * decayAny(g, kicks, 6);
  const pos = placeHead(s, 540, 950);
  const appear = lin(g, from, from + 6, 0, 1, EO);
  const rows: { y: number; dir: 1 | -1; outline: boolean; op: number }[] = [
    { y: 236, dir: -1, outline: true, op: 0.32 },
    { y: 430, dir: 1, outline: false, op: 1 },
    { y: 624, dir: -1, outline: true, op: 0.5 },
    { y: 818, dir: 1, outline: true, op: 0.3 },
    { y: 1012, dir: -1, outline: true, op: 0.18 },
  ];
  return (
    <AbsoluteFill>
      <Glitch id="moveon" rgb={12 * decay(g, from, 3) + 6 * decayAny(g, kicks, 3)} slice={14 * decay(g, from + 32, 2)} seed={23} expo={1 + 0.35 * decay(g, from, 1.5)}>
        <Stage glow={[80, 100, 160]} glowA={0.3} gx={50} gy={48} />
        <Beams intensity={0.4} x={50} y={-6} seed="moveon" />
        <div style={{ position: "absolute", inset: 0, opacity: appear, transform: `scale(${1.12 - 0.12 * appear})`, transformOrigin: "50% 40%" }}>
          {rows.map((r, i) => (
            <Marquee key={i} text="MOVE ON." y={r.y} size={196} dir={r.dir} off={off * (i % 2 ? 1.15 : 1)} outline={r.outline} opacity={r.op} />
          ))}
        </div>
        <Cutout at={at} speed={0.1} s={s} x={pos.x} y={pos.y} shake={7} />
        <Falloff a={0.5} />
      </Glitch>
    </AbsoluteFill>
  );
};

/**
 * SIGNATURE — « FOCUS / ON THE / VALUE. » built word by word on the beats as a sliced tile wall behind him,
 * then on the BIG 808 (2260) a shockwave from his head turns every tile over: « DOMINE. ».
 */
export const TbsDomine: React.FC = () => {
  const g = useGlobalFrame();
  const BIGF = 2260;
  const front: WallLine[] = [
    { text: "FOCUS", y: 262, size: 236, at: 2195 },
    { text: "ON THE", y: 470, size: 236, at: 2214 },
    { text: "VALUE.", y: 678, size: 236, at: 2226 },
  ];
  const back: WallLine[] = [
    { text: "DOMINE.", y: 262, size: 236, outline: true, color: L.acid, opacity: 0.45 },
    { text: "DOMINE.", y: 470, size: 236, color: "#ffffff" },
    { text: "DOMINE.", y: 678, size: 236, outline: true, color: L.acid, opacity: 0.45 },
    { text: "DOMINE.", y: 886, size: 236, outline: true, color: L.steel, opacity: 0.22 },
  ];
  const big = decay(g, BIGF, 10);
  const s = 0.66 + 0.06 * decay(g, BIGF, 12) + 0.01 * decayAny(g, [2195, 2214, 2226], 6);
  const pos = placeHead(s, 540, 1078);
  const cam = 1 + 0.035 * lin(g, 2195, 2259, 0, 1, EIO) + 0.06 * big;
  const sh = bassShake(g, 6 + 18 * big);
  const pre = lin(g, 2246, 2259, 0, 1, EIO);
  return (
    <AbsoluteFill>
      <Glitch id="domine" rgb={16 * decay(g, BIGF, 4) + 10 * decay(g, 2277, 3) + 5 * decayAny(g, [2195, 2214, 2226], 2)} slice={44 * decay(g, 2277, 3) + 26 * decay(g, BIGF, 2)} seed={41} expo={1 + 0.35 * decay(g, 2195, 1.5) + 0.2 * decayAny(g, [2214, 2226], 1.5)}>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${sh.x}px, ${sh.y}px) scale(${cam})`, transformOrigin: "540px 880px" }}>
          <Stage glow={g >= BIGF ? [120, 170, 60] : [70, 100, 160]} glowA={0.26 + 0.25 * big + 0.12 * pre} gx={50} gy={52} />
          <Beams intensity={0.35 + 0.4 * big} x={50} y={-8} seed="domine" col={g >= BIGF ? [190, 255, 120] : [150, 200, 255]} />
          <SliceWall front={front} back={back} flipAt={BIGF} ox={540} oy={1010} />
          <Shockwave at={BIGF} x={540} y={1010} frames={28} max={1500} />
          <Cutout at={40.0} speed={0.05} s={s} x={pos.x} y={pos.y} shake={0} rimCol={g >= BIGF ? "rgba(182,255,59,0.5)" : "rgba(125,211,252,0.45)"} />
          <Flare at={BIGF} x={540} y={960} col={[182, 255, 59]} dur={34} strength={0.9} />
          <Falloff a={0.45} />
          {/* the breath before the slam: the light gets sucked out over the last half-beat */}
          {pre > 0.01 && g < BIGF ? <div style={{ position: "absolute", inset: 0, background: "#000", opacity: 0.38 * pre }} /> : null}
        </div>
      </Glitch>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------------ */
/* Recap flashes in the final strobe                                                                 */
/* ------------------------------------------------------------------------------------------------ */

export const Recap: React.FC<{
  id: string;
  from: number;
  at: number;
  hx: number;
  hy: number;
  s: number;
  words: { text: string; x: number; y: number; size: number; color?: string; outline?: boolean }[];
  invert?: boolean;
  grade?: Grade;
}> = ({ id, from, at, hx, hy, s, words, invert = false, grade = "mono" }) => {
  const g = useGlobalFrame();
  const sc = s * (1 + 0.06 * (1 - lin(g, from, from + 8, 0, 1, EO)));
  const pos = placeHead(sc, hx, hy);
  return (
    <AbsoluteFill style={{ background: invert ? "#f2f5fa" : L.ink }}>
      <Glitch id={id} rgb={14 * decay(g, from, 3)} slice={22 * decay(g, from, 2)} seed={(from % 89) + 5} expo={invert ? 1 : 1 + 0.35 * decay(g, from, 1.5)}>
        {invert ? null : <Stage glow={[90, 110, 150]} glowA={0.28} />}
        {words.map((w, i) => (
          <Slam key={i} text={w.text} at={from} x={w.x} y={w.y} size={w.size} color={w.color ?? (invert ? "#05070c" : L.steel)} outline={w.outline} from={1.1} />
        ))}
        <Cutout at={at} speed={0} s={sc} x={pos.x} y={pos.y} shake={14} grade={grade} filter={invert ? "brightness(0.25) contrast(1.6)" : undefined} rim={invert ? 0 : 0.35} shadow={invert ? 0 : 0.5} />
        {invert ? null : <Falloff a={0.45} />}
      </Glitch>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------------ */
/* The dip — line C « Je me suis dit que c'était pas le moment… je commencerais plus tard. »         */
/* ------------------------------------------------------------------------------------------------ */

const C_FROM = 2709;
const C_SRC = 27.31;

/** 2697–2785: the strobe stops dead on a frozen frame of him (B&W); at 2709 he starts talking (lip-synced). */
export const DipTalk: React.FC<{ from: number }> = ({ from }) => {
  const g = useGlobalFrame();
  const lead = C_FROM - from; // frames frozen before the line starts
  const speed = (lf: number) => (lf < lead ? C_SRC : C_SRC + (lf - lead) / 60);
  const dim = lin(g, 2746, 2770, 0, 1, EIO); // the music drops out → the light dies
  const s = 0.98 + 0.08 * lin(g, from, 2785, 0, 1, EIO) + 0.02 * decay(g, 2717, 7);
  const pos = placeHead(s, 540 - 20 * lin(g, 2748, 2785, 0, 1, EIO), 780);
  const frozen = g < C_FROM;
  const live = lin(g, C_FROM, C_FROM + 8, 0, 1);
  const filter = frozen ? "grayscale(1) contrast(1.35) brightness(0.95)" : `grayscale(${(1 - live) * 0.8}) brightness(${(0.95 - 0.28 * dim).toFixed(3)}) contrast(1.12)`;
  return (
    <AbsoluteFill style={{ background: "#020409" }}>
      <Glitch id="diptalk" rgb={9 * decay(g, from, 3)} slice={0} expo={1 + 0.4 * decay(g, from, 1.5)}>
        <Stage glow={[50, 80, 130]} glowA={0.3 - 0.2 * dim} gx={50} gy={34} />
        <Beams intensity={0.42 - 0.3 * dim} x={50} y={-8} seed="dip" spread={[150, 210]} />
        <Dust a={0.5 - 0.25 * dim} seed="dipdust" />
        <Cutout at={C_SRC} speed={speed} s={s} x={pos.x} y={pos.y} rot={-1.6 * lin(g, 2748, 2785, 0, 1, EIO)} shake={frozen ? 0 : 4 - 3 * dim} grade="cold" filter={filter} rim={0.3} rimCol={`rgba(125,211,252,${(0.35 - 0.2 * dim).toFixed(3)})`} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, rgba(0,0,0,${(0.35 + 0.3 * dim).toFixed(3)}) 0%, rgba(0,0,0,${(0.12 + 0.2 * dim).toFixed(3)}) 42%, rgba(0,0,0,0) 68%)` }} />
        <Falloff a={0.62 + 0.2 * dim} top={0.35} />
      </Glitch>
    </AbsoluteFill>
  );
};

/** 2785–2808 « je commencerais… » — cutaway: the escalator going down (my reel for him), slowed, dark red. */
export const DipEscalator: React.FC<{ from: number }> = ({ from }) => {
  const g = useGlobalFrame();
  const s = 1.7 + 0.08 * lin(g, from, from + 23, 0, 1, EIO);
  return (
    <AbsoluteFill style={{ background: "#020409" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${s})`, transformOrigin: "50% 4%" }}>
        <Shot clip="m02" at={1.0} speed={0.35} grade="night" filter="saturate(1.4) hue-rotate(-12deg)" />
      </div>
      <Falloff a={0.7} top={0.3} />
    </AbsoluteFill>
  );
};

/** 2808–2845 « …plus tard. » — back on him, wider; PLUS / TARD. slam behind him in blood red on the word frames. */
export const DipPlusTard: React.FC<{ from: number; plus: number; tard: number }> = ({ from, plus, tard }) => {
  const g = useGlobalFrame();
  const at = C_SRC + (from - C_FROM) / 60;
  const s = 0.85 + 0.03 * lin(g, from, 2845, 0, 1, EIO);
  const pos = placeHead(s, 640, 1034);
  return (
    <AbsoluteFill style={{ background: "#020409" }}>
      <Glitch id="plustard" rgb={7 * decay(g, from, 3) + 8 * decay(g, plus, 3) + 8 * decay(g, tard, 3)} slice={10 * decay(g, tard, 2)} seed={67} expo={1 + 0.15 * decay(g, plus, 2) + 0.15 * decay(g, tard, 2)}>
        <Stage glow={[120, 20, 40]} glowA={0.22 + 0.1 * decay(g, tard, 10)} gx={50} gy={30} />
        <Dust a={0.35} col={[255, 120, 130]} seed="reddust" />
        <Slam text="PLUS" at={plus} x={40} y={246} size={400} color={L.blood} glow="rgba(255,46,77,0.35)" />
        <Slam text="TARD." at={tard} x={44} y={560} size={340} color={L.blood} glow="rgba(255,46,77,0.35)" />
        <Cutout at={at} speed={1} s={s} x={pos.x} y={pos.y} grade="cold" filter="brightness(0.72) contrast(1.15) saturate(0.8)" rim={0.3} rimCol="rgba(255,46,77,0.28)" shake={2} />
        <Falloff a={0.7} top={0.2} />
      </Glitch>
    </AbsoluteFill>
  );
};

/** 2845 dip hit → end hard: red/white slam on the frozen PLUS TARD frame, then the picture collapses like a CRT going off. */
export const DipEnd: React.FC<{ from: number }> = ({ from }) => {
  const g = useGlobalFrame();
  const t = g - from;
  const at = C_SRC + (from - C_FROM) / 60;
  const sy = t < 2 ? 1 : lin(g, from + 2, from + 6, 1, 0.006, EIO);
  const sx = lin(g, from + 6, from + 9, 1, 0, EIO);
  const pos = placeHead(0.92, 640, 1034);
  const bright = t < 2 ? 1.4 : 1 + 2.5 * lin(g, from + 2, from + 6, 0, 1);
  if (t >= 10) return <AbsoluteFill style={{ background: "#000" }} />;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${sx}, ${sy})`, transformOrigin: "50% 52%", filter: `brightness(${bright.toFixed(2)})` }}>
        <Glitch id="dipend" rgb={22} slice={t < 3 ? 40 : 0} seed={71}>
          <AbsoluteFill style={{ background: "#020409" }} />
          <Slam text="PLUS" at={from - 40} x={40} y={246} size={400} color={L.blood} />
          <Slam text="TARD." at={from - 40} x={44} y={560} size={340} color={L.blood} />
          <Cutout at={at} speed={0} s={0.92} x={pos.x} y={pos.y} grade="mono" rim={0} shake={18} />
        </Glitch>
      </div>
      {t < 2 ? <div style={{ position: "absolute", inset: 0, background: L.blood, opacity: 0.35, mixBlendMode: "screen" }} /> : null}
    </AbsoluteFill>
  );
};
