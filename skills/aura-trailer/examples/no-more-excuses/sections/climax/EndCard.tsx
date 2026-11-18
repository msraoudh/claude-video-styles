import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, Sequence, random, staticFile } from "remotion";
import { Shot } from "../../components/Shot";
import { MASTER } from "../../data/footage";
import { fontInter, fontMono } from "../../kit/fonts";
import { bassShake, useGlobalFrame } from "../../lib/beat";
import { GRADE, L } from "../../lib/look";
import { EASE_IN, EASE_IN_OUT, EASE_OUT, iv, RGBSplitDefs, Scanlines, smooth } from "./fx";
import { LINES, T, tapeElapsed, tapeRate } from "./timing";

/**
 * END 3451–3600.
 *  3451  hero shot (his own « No more excuses » reel), punch-in on the beat.
 *  3474  TAPE STOP — the picture follows the exact rate curve of the audio tape stop (mix.py: (1 - t/34)^1.6):
 *        it decelerates to a freeze, drains, RGB-splits, tracking noise rolls through.
 *  3488  old-CRT power-down: collapse to a hot horizontal line (3495), line → dot, dot pops on 3498, dies by 3511.
 *  3513  end card: MED YOURNAME (mono, decoded) / @yourhandle / Nouveaux épisodes chaque semaine, and his liquid-glass
 *        talking-head card (9-layer glass shadow, his series recipe) lip-synced on « Reste dans le coin. » (G).
 */
const at = (gf: number) => gf - T.start;
const G = LINES.G;
const HERO = { clip: "f07", at: 0.35 };

/* ───────────── hero + tape stop + CRT ───────────── */
const Hero: React.FC = () => {
  const g = useGlobalFrame();
  const since = g - T.tape;
  // clip time follows the tape: real time until 3474, then the integral of the tape-stop rate
  const speed = (lf: number) => {
    const gf = T.hero + lf;
    const pre = Math.min(gf, T.tape) - T.hero;
    return HERO.at + (pre + tapeElapsed(gf - T.tape)) / 60;
  };
  const rate = tapeRate(since);
  const slow = 1 - rate; // 0 → 1 as the tape dies
  const punch = iv(g - T.hero, [0, 8], [1.18, 1.06], EASE_OUT) + 0.04 * smooth((g - T.hero) / 23);
  const sh = bassShake(g, since < 0 ? 10 : 10 * rate);
  // tape: the picture sags, drains, splits
  const sag = 26 * smooth(since / TAPE_VIS);
  const split = since < 0 ? 0 : 3 + 13 * smooth(since / 20);
  const drain = smooth(since / 22);
  // CRT power-down
  const sy = g < T.crtLine ? 1 : iv(g, [T.crtLine, T.crtDot - 1], [1, 0.0035], EASE_IN_OUT);
  const sx = g < T.crtDot ? 1 : iv(g, [T.crtDot, T.crtPop], [1, 0.012], EASE_IN);
  const hot = iv(g, [T.crtLine, T.crtDot - 1], [1, 3.2], EASE_IN_OUT);
  const lineA = iv(g, [T.crtLine + 3, T.crtDot - 1, T.crtPop, T.crtPop + 1], [0, 1, 1, 0]);
  const dotAge = g - T.crtPop;
  const picA = g < T.crtDot ? 1 : 0;
  const filterId = "hero-rgb";
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <RGBSplitDefs id={filterId} dx={split} />
      {picA ? (
        <AbsoluteFill style={{ transform: `scale(${sx}, ${sy})`, transformOrigin: "50% 50%" }}>
          <AbsoluteFill
            style={{
              transform: `translate(${sh.x}px, ${sh.y + sag}px) rotate(${sh.r}deg) scale(${punch})`,
              filter: `${split > 0.5 ? `url(#${filterId})` : ""} saturate(${(1 - 0.75 * drain).toFixed(3)}) brightness(${((1 - 0.25 * drain) * hot).toFixed(3)}) contrast(${(1 + 0.35 * slow).toFixed(3)})`,
            }}
          >
            <Shot clip={HERO.clip} speed={speed} grade="cold" filter="brightness(0.82) contrast(1.12) saturate(0.78)" />
          </AbsoluteFill>
          <Scanlines a={0.55 * drain} gap={5} />
          {/* tracking-noise band rolling down while the tape dies */}
          {since >= 0 && g < T.crtLine + 4 ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: ((since * 61) % 2100) - 120,
                height: 70 + 50 * drain,
                mixBlendMode: "screen",
                opacity: 0.55 * drain,
                backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.0) 0px, rgba(255,255,255,0.35) ${1 + (since % 3)}px, rgba(255,255,255,0) ${3 + (since % 2)}px)`,
                transform: `translateX(${(random(`tn${g}`) - 0.5) * 40}px)`,
              }}
            />
          ) : null}
          {/* the picture collapsing into a hot line */}
          <AbsoluteFill style={{ background: "rgba(220,240,255,1)", opacity: iv(g, [T.crtLine + 2, T.crtDot], [0, 0.85]), mixBlendMode: "screen" }} />
        </AbsoluteFill>
      ) : null}
      {/* the line itself (keeps a real thickness while the picture is squashed) */}
      {lineA > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 540 * sx,
            width: 1080 * sx,
            top: 960 - 3,
            height: 6,
            background: "#fff",
            opacity: lineA,
            borderRadius: 3,
            boxShadow: "0 0 18px 6px rgba(190,225,255,0.9), 0 0 70px 20px rgba(120,180,255,0.45)",
          }}
        />
      ) : null}
      {/* the dot */}
      {dotAge >= 0 && g < T.crtOff ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle ${Math.max(4, 46 * Math.exp(-dotAge / 3) + 6)}px at 540px 960px, rgba(255,255,255,${iv(dotAge, [0, 10, 13], [1, 0.6, 0]).toFixed(3)}) 0%, rgba(170,210,255,${iv(dotAge, [0, 13], [0.6, 0]).toFixed(3)}) 35%, rgba(0,0,0,0) 100%)`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
const TAPE_VIS = 22;

/* ───────────── end card ───────────── */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@";
const Decode: React.FC<{ text: string; f0: number; perChar?: number; style: React.CSSProperties }> = ({ text, f0, perChar = 1.2, style }) => {
  const g = useGlobalFrame();
  const a = g - f0;
  if (a < 0) return null;
  const chars = Array.from(text).map((ch, i) => {
    if (ch === " ") return " ";
    const resolveAt = 3 + i * perChar;
    if (a >= resolveAt) return ch;
    if (a < i * 0.6) return " ";
    return GLYPHS[Math.floor(random(`dc${i}-${Math.floor(g / 2)}`) * GLYPHS.length)];
  });
  return <div style={style}>{chars.join("")}</div>;
};

/** The 9-layer iOS Liquid-Glass shadow stack of his series (cinematic-reel-builder/rules/talking-head.md). */
const glassShadow = (accent: string, secondary: string) =>
  [
    "0 0 0 0.5px rgba(255,255,255,0.18)",
    "0 6px 18px rgba(0,0,0,0.55)",
    "0 38px 80px rgba(0,0,0,0.5)",
    `0 0 90px rgba(${accent}, 0.28)`,
    `0 -22px 70px rgba(${secondary}, 0.18)`,
    "inset 0 0.6px 0 rgba(255,255,255,0.55)",
    "inset 0 16px 28px -16px rgba(255,255,255,0.22)",
    "inset 0 -0.6px 0 rgba(0,0,0,0.5)",
    "inset 0 -18px 32px -16px rgba(0,0,0,0.55)",
  ].join(", ");

const CARD = { w: 452, h: 556, top: 812, r: 36 };
// crop of the master (1080x1920) shown in the card: his head + shoulders
const CROP = { x: 50, y: 0, w: 900 };

const TalkingCard: React.FC = () => {
  const g = useGlobalFrame();
  const a = g - T.cardIn;
  const k = CARD.w / CROP.w;
  // lip-sync G: frozen on its first frame until the line, frozen on its last frame after it
  const srcT = G.srcIn + Math.max(0, Math.min(g, T.gEnd - 1) - G.from) / 60;
  const rise = iv(a, [0, 26], [46, 0], EASE_OUT);
  const op = iv(a, [0, 9], [0, 1]);
  const sc = iv(a, [0, 26], [0.95, 1], EASE_OUT);
  const accent = "125,211,252";
  const secondary = "167,139,250";
  const sweep = iv(g, [T.gFrom + 4, T.gFrom + 40], [-0.6, 1.6]);
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - CARD.w / 2,
        top: CARD.top,
        width: CARD.w,
        height: CARD.h,
        borderRadius: CARD.r,
        overflow: "hidden",
        boxShadow: glassShadow(accent, secondary),
        background: L.ink,
        isolation: "isolate",
        opacity: op,
        transform: `translateY(${rise}px) scale(${sc})`,
      }}
    >
      <div style={{ position: "absolute", left: -CROP.x * k, top: -CROP.y * k, width: 1080 * k, height: 1920 * k }}>
        <Freeze frame={Math.round(srcT * 60)}>
          <OffthreadVideo src={staticFile(MASTER.video)} muted style={{ width: "100%", height: "100%", display: "block", objectFit: "cover", filter: `${GRADE.cold} brightness(1.05)` }} />
        </Freeze>
      </div>
      {/* inner bloom / base shadow / speculars / counter-specular (the series card) */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "32%", background: "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 40%, transparent 100%)", mixBlendMode: "screen" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "32%", background: "linear-gradient(0deg, rgba(0,0,0,0.38) 0%, transparent 100%)" }} />
      <div style={{ position: "absolute", top: -8, left: -8, width: "55%", height: "45%", background: "radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 30%, transparent 60%)", mixBlendMode: "screen" }} />
      <div style={{ position: "absolute", bottom: -8, right: -8, width: "45%", height: "35%", background: `radial-gradient(ellipse at 75% 80%, rgba(${secondary}, 0.18) 0%, transparent 60%)`, mixBlendMode: "screen" }} />
      {/* one low light sweep once it has settled */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          mixBlendMode: "screen",
          background: `linear-gradient(115deg, transparent ${((sweep - 0.18) * 100).toFixed(1)}%, rgba(255,255,255,0.13) ${(sweep * 100).toFixed(1)}%, transparent ${((sweep + 0.18) * 100).toFixed(1)}%)`,
        }}
      />
      {/* gradient border ring (1.5 px, mask-composite) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: CARD.r,
          padding: 1.5,
          background: `linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 25%, rgba(${accent}, 0.18) 60%, rgba(255,255,255,0.28) 100%)`,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.025), transparent 60%), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.02), transparent 50%)", mixBlendMode: "overlay" }} />
    </div>
  );
};

const EndCardScene: React.FC = () => {
  const g = useGlobalFrame();
  const a = g - T.reveal;
  const handleIn = iv(a, [0, 12], [0, 1], EASE_OUT);
  const shine = iv(g, [T.reveal + 8, T.reveal + 44], [-30, 130]);
  const glowBreath = 0.85 + 0.15 * Math.sin((g - T.reveal) / 14);
  return (
    <AbsoluteFill style={{ background: L.ink }}>
      {/* quiet aurora behind the card, so the glass halo has something to sit on */}
      <AbsoluteFill
        style={{
          opacity: iv(a, [0, 30], [0, 1]) * glowBreath,
          background:
            "radial-gradient(ellipse 60% 30% at 50% 58%, rgba(125,211,252,0.10) 0%, rgba(125,211,252,0) 70%), radial-gradient(ellipse 50% 26% at 54% 66%, rgba(167,139,250,0.10) 0%, rgba(167,139,250,0) 70%), radial-gradient(ellipse 80% 22% at 50% 31%, rgba(230,237,247,0.05) 0%, rgba(0,0,0,0) 70%)",
        }}
      />
      <Decode
        text="MED YOURNAME"
        f0={T.reveal}
        perChar={1.3}
        style={{ position: "absolute", left: 0, right: 0, top: 486, textAlign: "center", fontFamily: fontMono, fontWeight: 700, fontSize: 32, letterSpacing: "0.55em", paddingLeft: "0.55em", color: L.steel2 }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 548,
          textAlign: "center",
          fontFamily: fontInter,
          fontWeight: 800,
          fontSize: 124,
          lineHeight: 1.05,
          letterSpacing: "-0.045em",
          clipPath: `inset(0 ${((1 - handleIn) * 100).toFixed(2)}% 0 0)`,
          transform: `translateY(${(1 - handleIn) * 18}px)`,
          filter: handleIn < 0.98 ? `blur(${((1 - handleIn) * 10).toFixed(1)}px)` : undefined,
          color: "transparent",
          backgroundImage: `linear-gradient(100deg, ${L.steel} ${shine - 18}%, #ffffff ${shine - 4}%, rgba(170,220,255,1) ${shine}%, #ffffff ${shine + 4}%, ${L.steel} ${shine + 18}%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
      >
        @yourhandle
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 712,
          textAlign: "center",
          fontFamily: fontMono,
          fontWeight: 500,
          fontSize: 28,
          letterSpacing: "0.3em",
          paddingLeft: "0.3em",
          color: L.steel3,
          opacity: iv(a, [8, 18], [0, 1]),
          transform: `translateY(${iv(a, [8, 22], [10, 0], EASE_OUT)}px)`,
        }}
      >
        NOUVEAUX ÉPISODES CHAQUE SEMAINE
      </div>
      <TalkingCard />
    </AbsoluteFill>
  );
};

export const EndCard: React.FC = () => (
  <AbsoluteFill>
    <Sequence from={at(T.hero)} durationInFrames={T.crtOff - T.hero} name="hero → tape stop → CRT off" premountFor={10}>
      <Hero />
    </Sequence>
    <Sequence from={at(T.reveal)} durationInFrames={T.end - T.reveal} name="end card" premountFor={20}>
      <EndCardScene />
    </Sequence>
  </AbsoluteFill>
);
