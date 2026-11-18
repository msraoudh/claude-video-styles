import { lightLeak } from "@remotion/effects/light-leak";
import type React from "react";
import { AbsoluteFill, Easing, interpolate, random, Sequence, Solid, useCurrentFrame, useVideoConfig } from "remotion";
import { beatFrames, CTA, CUE, f, rgba, SPARK, type RGB } from "./cues";
import { lookAt, type Look } from "./looks";

/**
 * "Colours from angles": practical-looking light that enters from the corners and edges,
 * drifts and breathes, plus one-shot light cues (flares, leaks, bursts) on the story beats.
 * Every element blends with 'screen' (light only adds) except the flicker/slam (darkness).
 *
 * Wrappers must never create a stacking context (no opacity/transform/filter on wrappers),
 * otherwise the blend modes stop reaching the footage.
 */
const fill: React.CSSProperties = { position: "absolute", inset: 0, pointerEvents: "none" };
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ------------------------------------------------------------------ */
/* Ambient light                                                       */
/* ------------------------------------------------------------------ */

/** Irregular volumetric rays from a source just outside the frame (conic gradient, soft-edged rays). */
const Beams: React.FC<{
  intensity: number;
  col: RGB;
  side: "right" | "left";
  seed: string;
}> = ({ intensity, col, side, seed }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (intensity < 0.005) return null;
  const t = frame / fps;
  const sx = side === "right" ? 108 : -8;
  const sy = -7;
  // rays fan toward the face: right source points down-left, left source points down-right
  const a0 = side === "right" ? 196 : 112;
  const a1 = side === "right" ? 252 : 168;
  const sweep = 2.4 * Math.sin((t / 13) * Math.PI * 2 + (side === "right" ? 0 : 2)); // slow sweep, degrees
  const N = 9;
  const stops: string[] = ["rgba(0,0,0,0) 0deg"];
  for (let i = 0; i < N; i++) {
    const jitter = (random(`${seed}-j${i}`) - 0.5) * 0.5;
    const centre = a0 + ((a1 - a0) * (i + 0.5 + jitter)) / N + sweep * (0.6 + 0.4 * random(`${seed}-s${i}`));
    const width = 1.1 + random(`${seed}-w${i}`) * 2.2;
    const base = 0.3 + random(`${seed}-a${i}`) * 0.7;
    const period = 2.6 + random(`${seed}-p${i}`) * 4;
    const flicker = 0.6 + 0.4 * Math.sin((t / period) * Math.PI * 2 + random(`${seed}-ph${i}`) * 6.283);
    const a = base * flicker;
    stops.push(`rgba(0,0,0,0) ${(centre - width).toFixed(2)}deg`);
    stops.push(`${rgba(col, a)} ${centre.toFixed(2)}deg`);
    stops.push(`rgba(0,0,0,0) ${(centre + width * 1.3).toFixed(2)}deg`);
  }
  stops.push("rgba(0,0,0,0) 360deg");
  const mask = `radial-gradient(circle at ${sx}% ${sy}%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 28%, rgba(0,0,0,0) 72%)`;
  const bg = `conic-gradient(from 0deg at ${sx}% ${sy}%, ${stops.join(", ")})`;
  const k = Math.min(1, intensity);
  // overlay = the light *colours* the surfaces it hits; a little screen = the haze glowing in the air
  return (
    <>
      <div style={{ ...fill, mixBlendMode: "overlay", opacity: k, background: bg, maskImage: mask, WebkitMaskImage: mask }} />
      <div style={{ ...fill, mixBlendMode: "screen", opacity: k * 0.35, background: bg, maskImage: mask, WebkitMaskImage: mask }} />
    </>
  );
};

/** Corner key + edge light + opposite-corner colour, breathing, and pumping on the beat after the drop. */
export const AmbientLight: React.FC<{ look: Look; amount?: number }> = ({ look, amount = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const since = frame - f(CUE.drop);
  const bl = beatFrames(fps);
  const beat = since >= 0 ? Math.exp(-(since % bl) / (0.14 * fps)) : 0;
  const pump = 1 + 0.28 * look.pulse * beat;
  const breatheKey = 0.88 + 0.12 * Math.sin((t / 6.5) * Math.PI * 2);
  const breatheRim = 0.86 + 0.14 * Math.sin((t / 8.3) * Math.PI * 2 + 2.1);
  const key = look.key * amount * breatheKey * pump;
  const rim = look.rim * amount * breatheRim * (1 + 0.15 * look.pulse * beat);
  // the sources drift a little, like a sun behind moving leaves / a softbox someone holds
  const kx = 100 + 3 * Math.sin((t / 11) * Math.PI * 2);
  const ky = 2 + 2.5 * Math.cos((t / 9) * Math.PI * 2);
  const rx = 0 + 3 * Math.sin((t / 10) * Math.PI * 2 + 1);
  const ry = 100 - 2 * Math.cos((t / 12) * Math.PI * 2);
  return (
    <>
      {key > 0.005 ? (
        <>
          {/* coloured key wash from the top-right corner: soft-light tints what it touches without blowing it out */}
          <div
            style={{
              ...fill,
              mixBlendMode: "soft-light",
              background: `radial-gradient(ellipse 95% 60% at ${kx.toFixed(2)}% ${ky.toFixed(2)}%, ${rgba(look.keyCol, 0.95 * key)} 0%, ${rgba(look.keyCol, 0.5 * key)} 40%, ${rgba(look.keyCol, 0)} 85%)`,
            }}
          />
          {/* the source glow itself (screen), kept tight in the corner */}
          <div
            style={{
              ...fill,
              mixBlendMode: "screen",
              background: `radial-gradient(ellipse 55% 30% at ${kx.toFixed(2)}% ${ky.toFixed(2)}%, ${rgba(look.keyCol, 0.42 * key)} 0%, ${rgba(look.keyCol, 0.12 * key)} 45%, ${rgba(look.keyCol, 0)} 80%)`,
            }}
          />
          {/* edge light: a thin hot strip hugging the right edge, upper half */}
          <div
            style={{
              ...fill,
              mixBlendMode: "screen",
              background: `linear-gradient(270deg, ${rgba(look.keyCol, 0.42 * key)} 0%, ${rgba(look.keyCol, 0.1 * key)} 7%, ${rgba(look.keyCol, 0)} 16%)`,
              maskImage: "linear-gradient(180deg, #000 0%, #000 30%, transparent 62%)",
              WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 30%, transparent 62%)",
            }}
          />
        </>
      ) : null}
      {rim > 0.005 ? (
        <>
          <div
            style={{
              ...fill,
              mixBlendMode: "screen",
              background: `radial-gradient(ellipse 78% 42% at ${rx.toFixed(2)}% ${ry.toFixed(2)}%, ${rgba(look.rimCol, 0.6 * rim)} 0%, ${rgba(look.rimCol, 0.2 * rim)} 40%, ${rgba(look.rimCol, 0)} 80%)`,
            }}
          />
          <div
            style={{
              ...fill,
              mixBlendMode: "screen",
              background: `linear-gradient(90deg, ${rgba(look.rimCol, 0.36 * rim)} 0%, ${rgba(look.rimCol, 0.08 * rim)} 6%, ${rgba(look.rimCol, 0)} 14%)`,
              maskImage: "linear-gradient(0deg, #000 0%, #000 25%, transparent 60%)",
              WebkitMaskImage: "linear-gradient(0deg, #000 0%, #000 25%, transparent 60%)",
            }}
          />
        </>
      ) : null}
      <Beams intensity={look.beamsWarm * amount * pump} col={look.keyCol} side="right" seed="warm" />
      <Beams intensity={look.beamsCool * amount} col={[150, 190, 255]} side="left" seed="cool" />
    </>
  );
};

/* ------------------------------------------------------------------ */
/* One-shot light cues                                                 */
/* ------------------------------------------------------------------ */

/** Anamorphic lens flare: long horizontal streak, hot core, and ghosts mirrored through the centre. */
export const AnamorphicFlare: React.FC<{
  /** position as fractions of the frame */
  x: number;
  y: number;
  col: RGB;
  /** frames */
  dur: number;
  strength?: number;
  /** core size in px */
  size?: number;
  ghosts?: boolean;
}> = ({ x, y, col, dur, strength = 1, size = 150, ghosts = true }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const attack = 3;
  const env = frame < attack ? interpolate(frame, [0, attack], [0, 1], clamp) : Math.exp(-(frame - attack) / Math.max(1, dur * 0.32));
  const fade = interpolate(frame, [dur - 4, dur], [1, 0], clamp);
  const a = env * fade * strength;
  if (a < 0.003) return null;
  const w = interpolate(frame, [0, dur], [0.45, 1.3], { ...clamp, easing: OUT });
  const px = x * width;
  const py = y * height;
  const streak = (h: number, core: string, mid: string, ww: number) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: py - h / 2,
        height: h,
        mixBlendMode: "screen",
        background: `radial-gradient(ellipse ${(ww * 100).toFixed(1)}% 50% at ${px}px 50%, ${core} 0%, ${mid} 32%, rgba(0,0,0,0) 100%)`,
      }}
    />
  );
  const cx = width / 2;
  const cy = height / 2;
  const ghostList = ghosts ? [0.45, 0.85, 1.35, 1.75] : [];
  return (
    <>
      {streak(170, rgba(col, 0.38 * a), rgba(col, 0.12 * a), w * 1.1)}
      {streak(16, `rgba(255,255,255,${(0.95 * a).toFixed(3)})`, rgba(col, 0.7 * a), w)}
      <div
        style={{
          ...fill,
          mixBlendMode: "screen",
          background: `radial-gradient(circle ${size}px at ${px}px ${py}px, rgba(255,250,240,${(0.9 * a).toFixed(3)}) 0%, ${rgba(col, 0.45 * a)} 22%, rgba(0,0,0,0) 100%)`,
        }}
      />
      {ghostList.map((s, i) => {
        const gx = px + (cx - px) * s * 1.15;
        const gy = py + (cy - py) * s * 1.15;
        const r = 26 + 60 * random(`ghost${i}`) * (0.6 + s * 0.4);
        const gc: RGB = i % 2 === 0 ? [120, 200, 255] : col;
        return (
          <div
            key={i}
            style={{
              ...fill,
              mixBlendMode: "screen",
              background: `radial-gradient(circle ${Math.round(r)}px at ${gx.toFixed(1)}px ${gy.toFixed(1)}px, ${rgba(gc, 0.1 * a)} 0%, ${rgba(gc, 0.16 * a)} 70%, rgba(0,0,0,0) 100%)`,
            }}
          />
        );
      })}
    </>
  );
};

/** Leak masks: keep the face clear / keep the leak on the right side. */
const FACE_CLEAR = "radial-gradient(ellipse 46% 30% at 40% 31%, transparent 35%, rgba(0,0,0,0.6) 70%, #000 100%)";
const RIGHT_SIDE = "linear-gradient(270deg, #000 0%, #000 30%, transparent 75%)";

/** Organic light leak (WebGL, @remotion/effects) screened over the shot. The leak PEAKS at `at`. */
export const LeakAt: React.FC<{
  name: string;
  /** cut-timeline seconds where the leak PEAKS */
  at: number;
  /** seconds */
  len?: number;
  seed: number;
  /**
   * Hue rotation passed to lightLeak(). NOTE: in @remotion/effects 4.0.535 the rotation runs the
   * opposite way to the docs: 0 = yellow, ~20 = orange, ~35 = red, ~75 = magenta/pink, ~190 = blue,
   * 300+ = green. Measured on renders.
   */
  hue?: number;
  strength?: number;
  /** where the leak may appear (CSS mask). Default keeps the face clear so skin stays natural. */
  mask?: string;
}> = ({ name, at, len = 1, seed, hue = 20, strength = 0.4, mask = FACE_CLEAR }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const dur = Math.max(2, Math.round(len * fps));
  const from = f(at) - Math.round(dur / 2);
  return (
    <Solid
      name={name}
      from={from}
      durationInFrames={dur}
      premountFor={fps}
      width={width}
      height={height}
      effects={[
        lightLeak({
          seed,
          hueShift: hue,
          progress: interpolate(frame, [from, from + dur - 1], [0, 1], clamp),
        }),
      ]}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        mixBlendMode: "screen",
        opacity: strength,
        pointerEvents: "none",
        ...(mask ? { maskImage: mask, WebkitMaskImage: mask } : {}),
      }}
    />
  );
};

/** DROP: explosive orange → magenta light burst with a spinning starburst. */
/** Strength of the big one-shot bursts (drop, Claude bloom, launch). Toned down on request: "too many colours". */
const BURST = 0.45;

const DropBurst: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // the light explodes from BEHIND his head (where the stage is), not on his face
  const ox = 54;
  const oy = 15;
  const bloom = BURST * interpolate(frame, [0, 1, 9], [1, 1, 0], { ...clamp, easing: Easing.out(Easing.quad) });
  const grow = interpolate(frame, [0, 16], [0, 1], { ...clamp, easing: OUT });
  const ringA = BURST * interpolate(frame, [0, 2, 18], [0, 1, 0], clamp);
  const R = 160 + 1900 * grow;
  const rays = BURST * interpolate(frame, [0, 1, 14], [0, 0.6, 0], clamp);
  const sustain = BURST * interpolate(frame, [6, 16, dur - 6, dur], [0, 0.32, 0.26, 0], clamp);
  const rot = frame * 0.9;
  const mask = `radial-gradient(circle at ${ox}% ${oy}%, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0) 85%)`;
  const t = frame / fps;
  const px = (v: number) => `${Math.max(0, Math.round(v))}px`;
  return (
    <>
      {/* 1. the hit: a hot warm bloom for a few frames */}
      <div
        style={{
          ...fill,
          mixBlendMode: "screen",
          background: `radial-gradient(circle 1100px at ${ox}% ${oy}%, rgba(255,214,170,${(0.85 * bloom).toFixed(3)}) 0%, rgba(255,120,50,${(0.6 * bloom).toFixed(3)}) 38%, rgba(255,50,130,${(0.3 * bloom).toFixed(3)}) 70%, rgba(255,50,130,0) 100%)`,
        }}
      />
      {/* 2. shockwave ring of orange → magenta light racing outward */}
      <div
        style={{
          ...fill,
          mixBlendMode: "screen",
          background: `radial-gradient(circle at ${ox}% ${oy}%, rgba(0,0,0,0) ${px(R - 300)}, rgba(255,150,70,${(0.75 * ringA).toFixed(3)}) ${px(R - 90)}, rgba(255,60,140,${(0.55 * ringA).toFixed(3)}) ${px(R + 20)}, rgba(0,0,0,0) ${px(R + 160)})`,
        }}
      />
      {/* 3. starburst */}
      <div
        style={{
          ...fill,
          mixBlendMode: "screen",
          opacity: rays,
          background: `repeating-conic-gradient(from ${rot.toFixed(1)}deg at ${ox}% ${oy}%, rgba(255,180,110,0.7) 0deg, rgba(255,180,110,0) 2.4deg, rgba(255,70,140,0) 7deg, rgba(255,70,140,0.4) 9.5deg, rgba(255,70,140,0) 12deg)`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
      {/* 4. stage lights stay on: magenta from the left edge, orange from the right */}
      <div
        style={{
          ...fill,
          mixBlendMode: "screen",
          background: `radial-gradient(ellipse 50% 55% at 0% ${55 + 6 * Math.sin(t * 5)}%, rgba(255,40,140,${(0.45 * sustain).toFixed(3)}) 0%, rgba(255,40,140,0) 70%), radial-gradient(ellipse 55% 60% at 100% ${34 + 6 * Math.cos(t * 4)}%, rgba(255,120,40,${(0.6 * sustain).toFixed(3)}) 0%, rgba(255,120,40,0) 70%)`,
        }}
      />
    </>
  );
};

/** Record scratch: the practical lights fail — a cold pop, a blackout, two flickers, recovery. */
const LightsFail: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const pop = interpolate(frame, [0, 1, 4], [0.32, 0.32, 0], clamp);
  // deterministic flicker pattern
  const base = interpolate(frame, [2, 4, dur * 0.55, dur], [0, 0.55, 0.42, 0], clamp);
  const flick = frame > 4 && random(`flicker${frame}`) > 0.72 ? -0.35 : 0;
  const dark = Math.max(0, base + flick * (base > 0.2 ? 1 : 0));
  return (
    <>
      <div style={{ ...fill, mixBlendMode: "screen", backgroundColor: "rgb(190,215,255)", opacity: pop }} />
      <div style={{ ...fill, backgroundColor: "#000", opacity: dark }} />
    </>
  );
};

/** "éclaté": cold strobe, then the darkness slams in from the edges and slowly lets go. */
const Slam: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const strobe = interpolate(frame, [0, 1, 2, 3, 4, 7], [0.5, 0.1, 0.42, 0.05, 0.2, 0], clamp);
  const slam = interpolate(frame, [1, 3, dur], [0, 1, 0], { ...clamp, easing: [OUT, Easing.inOut(Easing.quad)] });
  const inner = 18 + 30 * (1 - slam);
  return (
    <>
      <div style={{ ...fill, mixBlendMode: "screen", backgroundColor: "rgb(200,225,255)", opacity: strobe }} />
      <div
        style={{
          ...fill,
          background: `radial-gradient(ellipse 70% 52% at 42% 34%, rgba(0,0,0,0) ${inner.toFixed(1)}%, rgba(0,0,0,${(0.82 * slam).toFixed(3)}) 100%)`,
        }}
      />
    </>
  );
};

/** "Claude": a big warm bloom opening from the right, where the 3D spark lives. */
const ClaudeBloom: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const rise = interpolate(frame, [0, 12], [0, 1], { ...clamp, easing: OUT });
  const env =
    interpolate(frame, [0, 6, 20, 50], [0, 1, 0.55, 0.26], clamp) * // settles low so the face never washes out
    interpolate(frame, [dur - 8, dur], [1, 0], clamp) *
    (0.92 + 0.08 * Math.sin(t * 2.4)) *
    BURST;
  const px = SPARK.x * width;
  const py = SPARK.y * height;
  const r = 420 + 760 * rise;
  return (
    <>
      {/* coral light washing over the room from the spark (colours what it touches) */}
      <div
        style={{
          ...fill,
          mixBlendMode: "soft-light",
          background: `radial-gradient(circle ${Math.round(r * 1.3)}px at ${px}px ${py}px, rgba(255,140,95,${(0.5 * env).toFixed(3)}) 0%, rgba(217,119,87,${(0.32 * env).toFixed(3)}) 45%, rgba(217,119,87,0) 100%)`,
        }}
      />
      {/* the bloom itself */}
      <div
        style={{
          ...fill,
          mixBlendMode: "screen",
          background: `radial-gradient(circle ${Math.round(r)}px at ${px}px ${py}px, rgba(255,238,220,${(0.6 * env).toFixed(3)}) 0%, rgba(217,119,87,${(0.42 * env).toFixed(3)}) 22%, rgba(255,122,61,${(0.22 * env).toFixed(3)}) 52%, rgba(255,122,61,0) 100%)`,
        }}
      />
      {/* light spilling off the right edge, down the frame */}
      <div
        style={{
          ...fill,
          mixBlendMode: "screen",
          background: `linear-gradient(270deg, rgba(255,150,100,${(0.4 * env).toFixed(3)}) 0%, rgba(217,119,87,${(0.12 * env).toFixed(3)}) 14%, rgba(0,0,0,0) 34%)`,
          maskImage: "linear-gradient(180deg, #000 0%, #000 35%, transparent 80%)",
          WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 35%, transparent 80%)",
        }}
      />
    </>
  );
};

/** "je me lance": a warm band of light launches from the bottom to the top of the frame. */
const LaunchSweep: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const p = interpolate(frame, [0, dur], [0, 1], { ...clamp, easing: IN_OUT });
  const y = interpolate(p, [0, 1], [height + 400, -600]);
  const a = BURST * interpolate(frame, [0, 4, dur - 4, dur], [0, 1, 1, 0], clamp);
  return (
    <div
      style={{
        ...fill,
        mixBlendMode: "screen",
        background: `linear-gradient(180deg, rgba(0,0,0,0) ${y - 420}px, rgba(255,170,90,${(0.42 * a).toFixed(3)}) ${y - 60}px, rgba(255,236,210,${(0.55 * a).toFixed(3)}) ${y}px, rgba(255,120,60,${(0.25 * a).toFixed(3)}) ${y + 140}px, rgba(0,0,0,0) ${y + 520}px)`,
      }}
    />
  );
};

/** "en français": blue light from the left, red from the right, white in the middle — tricolour from the angles. */
/** Tricolour sweep from the angles — currently not used (toned down on request). */
export const Tricolore: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [0, 6, dur * 0.5, dur], [0, 1, 0.7, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const s = interpolate(frame, [0, dur], [0, 6], clamp);
  return (
    <>
      <div
        style={{
          ...fill,
          mixBlendMode: "screen",
          background: `radial-gradient(ellipse 62% 58% at ${-4 + s}% 46%, rgba(30,91,255,${(0.8 * a).toFixed(3)}) 0%, rgba(30,91,255,${(0.25 * a).toFixed(3)}) 40%, rgba(30,91,255,0) 75%)`,
        }}
      />
      <div
        style={{
          ...fill,
          mixBlendMode: "screen",
          background: `radial-gradient(ellipse 62% 58% at ${104 - s}% 40%, rgba(255,59,71,${(0.75 * a).toFixed(3)}) 0%, rgba(255,59,71,${(0.22 * a).toFixed(3)}) 40%, rgba(255,59,71,0) 75%)`,
        }}
      />
    </>
  );
};

/** Exposure pop on a hard punch-in (one or two frames of extra light). */
const Pop: React.FC<{ col?: RGB; peak?: number }> = ({ col = [255, 255, 255], peak = 0.18 }) => {
  const frame = useCurrentFrame();
  return <div style={{ ...fill, mixBlendMode: "screen", backgroundColor: rgba(col, 1), opacity: interpolate(frame, [0, 1, 5], [peak, peak, 0], clamp) }} />;
};

/* ------------------------------------------------------------------ */
/* The light track                                                     */
/* ------------------------------------------------------------------ */

const WARM: RGB = [255, 160, 80];
const COLD: RGB = [120, 175, 255];

export const CinematicLight: React.FC<{ amount?: number; cues?: boolean; leaks?: boolean }> = ({ amount = 1, cues = true, leaks = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const look = lookAt(frame);
  const S = (s: number) => Math.round(s * fps); // seconds -> frames for DURATIONS only
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AmbientLight look={look} amount={amount} />

      {cues ? (
        <>
          {/* 1.3 s — FRANÇAIS: golden flare on the word behind the head */}
          <Sequence name="Flare: FRANÇAIS" from={f(CUE.francais)} durationInFrames={S(0.9)} premountFor={fps}>
            <AnamorphicFlare x={0.86} y={0.15} col={WARM} dur={S(0.9)} strength={0.75 * amount} />
          </Sequence>

          {/* 14.76 s — LE MONTAGE VIDÉO: cold anamorphic streak across the eye line + exposure pop */}
          <Sequence name="Pop: MONTAGE" from={f(CUE.montage)} durationInFrames={6} premountFor={fps}>
            <Pop col={[200, 225, 255]} peak={0.16 * amount} />
          </Sequence>
          <Sequence name="Flare: MONTAGE" from={f(CUE.montage)} durationInFrames={S(0.8)} premountFor={fps}>
            <AnamorphicFlare x={0.8} y={0.24} col={COLD} dur={S(0.8)} strength={0.8 * amount} />
          </Sequence>

          {/* 22.46 s — record scratch: the lights fail for the 1 s of silence */}
          <Sequence name="Lights fail (scratch)" from={f(CUE.scratch)} durationInFrames={S(1.1)} premountFor={fps}>
            <LightsFail dur={S(1.1)} />
          </Sequence>

          {/* 27.78 s — éclaté: cold strobe + darkness slam */}
          <Sequence name="Strobe + slam (éclaté)" from={f(CUE.eclate)} durationInFrames={S(0.8)} premountFor={fps}>
            <Slam dur={S(0.8)} />
          </Sequence>

          {/* 36.92 s — Claude: big warm bloom from the spark, held until "mais wesh" */}
          <Sequence name="Bloom: Claude" from={f(CUE.claude)} durationInFrames={f(CUE.wesh) - f(CUE.claude)} premountFor={fps}>
            <ClaudeBloom dur={f(CUE.wesh) - f(CUE.claude)} />
          </Sequence>
          <Sequence name="Flare: Claude" from={f(CUE.claude)} durationInFrames={S(1)} premountFor={fps}>
            <AnamorphicFlare x={SPARK.x} y={SPARK.y} col={[255, 140, 95]} dur={S(1)} strength={0.9 * amount} size={190} />
          </Sequence>

          {/* 43.93 s — DROP: explosive warm burst */}
          <Sequence name="Burst: DROP" from={f(CUE.drop)} durationInFrames={f(CUE.lance) - f(CUE.drop)} premountFor={fps}>
            <DropBurst dur={f(CUE.lance) - f(CUE.drop)} />
          </Sequence>
          <Sequence name="Flare: DROP" from={f(CUE.drop)} durationInFrames={S(0.9)} premountFor={fps}>
            <AnamorphicFlare x={0.54} y={0.15} col={[255, 110, 70]} dur={S(0.9)} strength={amount} size={260} />
          </Sequence>

          {/* 45.1 s — je me lance: warm light launches upward */}
          <Sequence name="Launch sweep" from={f(CUE.lance)} durationInFrames={S(0.8)} premountFor={fps}>
            <LaunchSweep dur={S(0.8)} />
          </Sequence>

          <Sequence name="Flare: VERSION FR" from={f(CUE.versionFr)} durationInFrames={S(0.7)} premountFor={fps}>
            <AnamorphicFlare x={0.5} y={0.42} col={[235, 240, 255]} dur={S(0.7)} strength={0.6 * amount} ghosts={false} />
          </Sequence>

          {/* 62.78 s — abonné: a warm glint on the button */}
          <Sequence name="Glint: abonné" from={f(CUE.abonne)} durationInFrames={S(0.8)} premountFor={fps}>
            <AnamorphicFlare x={CTA.x} y={CTA.y} col={WARM} dur={S(0.8)} strength={0.7 * amount} size={120} />
          </Sequence>
        </>
      ) : null}

      {leaks ? (
        <>
          {/* light leaks on the key hits and on a few jump cuts (peak = the cut) */}
          <LeakAt name="Leak: FRANÇAIS" at={CUE.francais + 0.15} len={1.1} seed={3} hue={18} strength={0.5 * amount} mask={RIGHT_SIDE} />
          <LeakAt name="Leak: cut (the user)" at={6.2} len={0.8} seed={11} hue={22} strength={0.3 * amount} />
          <LeakAt name="Leak: cut (tester)" at={9.23} len={0.7} seed={21} hue={34} strength={0.28 * amount} />
          <LeakAt name="Leak: into the struggle" at={CUE.struggle} len={1.2} seed={5} hue={190} strength={0.32 * amount} />
          <LeakAt name="Leak: Claude" at={CUE.claude + 0.3} len={1.3} seed={9} hue={24} strength={0.5 * amount} mask={RIGHT_SIDE} />
          <LeakAt name="Leak: DROP" at={CUE.drop + 0.55} len={1} seed={7} hue={42} strength={0.42 * amount} />
          <LeakAt name="Leak: JE ME LANCE" at={CUE.lance + 0.25} len={1} seed={4} hue={18} strength={0.45 * amount} />
          <LeakAt name="Leak: cut (projets)" at={46.6} len={0.7} seed={14} hue={16} strength={0.28 * amount} />
          <LeakAt name="Leak: cut (galères)" at={50.47} len={0.7} seed={17} hue={40} strength={0.28 * amount} />
          <LeakAt name="Leak: bah bref" at={CUE.bref} len={0.8} seed={12} hue={62} strength={0.4 * amount} />
          <LeakAt name="Leak: cut (tech)" at={57.57} len={0.7} seed={23} hue={16} strength={0.28 * amount} />
          <LeakAt name="Leak: abonné" at={CUE.abonne + 0.3} len={1.4} seed={6} hue={20} strength={0.4 * amount} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};
