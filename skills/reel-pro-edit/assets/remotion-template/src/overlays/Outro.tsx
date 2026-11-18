import type React from "react";
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Cutout } from "../components/Behind";
import { EASE_IN, EASE_IN_OUT, EASE_OUT, SPRING_POP, drift, sec } from "../lib/motion";
import { C, DISPLAY, SERIF, UI } from "../lib/theme";
import { Emoji, enterStyle, Glass, IconCheck, IconChip, IconCloud, IconCursor, IconNews, IconSparkle } from "./ui";

type Beat = { from: number; dur: number };

/**
 * THE DROP — "pourquoi j'attends encore ?". the user's room is replaced by a hot orange stage,
 * giant words slam in behind him on each word. Lives inside the Footage camera.
 */
export const DropStage: React.FC<Beat & { name: string }> = ({ from, dur, name }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence name={name} from={from} durationInFrames={dur} premountFor={fps}>
      <DropBackdrop from={from} dur={dur} />
      <Cutout from={from} />
    </Sequence>
  );
};

const DropBackdrop: React.FC<Beat> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = (t: number) => sec(t) - from;
  const out = interpolate(frame, [dur - 4, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN });
  // the word being said lights up white in every row of the wall
  const words: [number, string][] = [
    [43.93, "POURQUOI"],
    [44.08, "J'ATTENDS"],
    [44.38, "ENCORE ?"],
  ];
  const current = words.filter(([t]) => frame >= cue(t)).length - 1;
  const ROWS = 7;
  return (
    <AbsoluteFill style={{ clipPath: `inset(0 ${out * 100}% 0 0)` }}>
      <AbsoluteFill style={{ background: `radial-gradient(90% 60% at 40% 35%, #FF9A5C 0%, ${C.accent} 45%, #E2461B 100%)` }} />
      <AbsoluteFill style={{ rotate: "-8deg", scale: "1.25" }}>
        {new Array(ROWS).fill(0).map((_, r) => {
          const p = spring({ frame: frame - r, fps, config: { damping: 12, stiffness: 320, mass: 0.6 } });
          const dir = r % 2 === 0 ? -1 : 1;
          const x = dir * (frame * 9 + r * 140) - 600;
          return (
            <div
              key={r}
              style={{
                position: "absolute",
                top: 20 + r * 245,
                left: x,
                whiteSpace: "nowrap",
                fontFamily: DISPLAY,
                fontSize: 230,
                lineHeight: "230px",
                letterSpacing: -2,
                opacity: interpolate(p, [0, 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                scale: String(interpolate(p, [0, 1], [1.6, 1])),
              }}
            >
              {new Array(3).fill(0).flatMap((__, k) =>
                words.map(([, w], i) => (
                  <span key={`${k}-${w}`} style={{ color: i === current ? C.white : "rgba(20,8,4,0.88)", marginRight: 60, textShadow: i === current ? "0 14px 40px rgba(120,30,0,0.45)" : "none" }}>
                    {w}
                  </span>
                )),
              )}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** White flash (used on the drop and on hard hits). */
export const Flash: React.FC<{ dur: number; peak?: number }> = ({ dur, peak = 0.9 }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ backgroundColor: "#fff", opacity: interpolate(frame, [0, 1, dur], [peak, peak, 0], { extrapolateRight: "clamp", easing: EASE_OUT }) }} />;
};

/** "je me lance enfin" — a rocket crosses the frame leaving a warm trail. */
export const Rocket: React.FC<Beat> = ({ dur }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, dur], [0, 1], { extrapolateRight: "clamp", easing: EASE_IN_OUT });
  const x = interpolate(t, [0, 1], [880, 1180]);
  const y = interpolate(t, [0, 1], [1150, -200]);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="trail" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor={C.accent} stopOpacity={0} />
            <stop offset="1" stopColor="#FFE2B8" stopOpacity={0.95} />
          </linearGradient>
        </defs>
        <path d={`M880 1150 L${x} ${y}`} stroke="url(#trail)" strokeWidth={22} strokeLinecap="round" style={{ filter: "blur(4px)" }} />
      </svg>
      <div style={{ position: "absolute", left: x - 70, top: y - 70, rotate: "0deg" }}>
        <Emoji e="🚀" size={140} style={{ filter: "drop-shadow(0 0 30px rgba(255,170,90,0.9))" }} />
      </div>
    </AbsoluteFill>
  );
};

/** "partager mes projets, la tech, le cloud, ma spécialité, mes découvertes, mes galères" — cards fan out. */
export const FanCards: React.FC<Beat> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = (t: number) => sec(t) - from;
  const q = interpolate(frame, [dur - 8, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN });
  const cards: [number, string, string][] = [
    [47.22, "🛠️", "PROJETS"],
    [47.84, "💻", "TECH"],
    [48.34, "☁️", "CLOUD"],
    [49.52, "🧠", "MA SPÉCIALITÉ"],
    [50.54, "🔭", "DÉCOUVERTES"],
    [51.22, "💀", "GALÈRES"],
  ];
  const shown = cards.filter(([t]) => frame >= cue(t)).length;
  return (
    <AbsoluteFill style={{ opacity: 1 - q, translate: `0px ${q * 80}px` }}>
      {cards.map(([t, e, label], i) => {
        const cp = spring({ frame: frame - cue(t), fps, config: SPRING_POP });
        // the fan re-spreads each time a card joins
        const spread = shown <= 1 ? 0 : (i - (shown - 1) / 2) * Math.min(14, 60 / Math.max(1, shown - 1));
        const ang = frame >= cue(t) ? spread : 0;
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: 540 - 130,
              top: 840,
              width: 260,
              height: 330,
              transformOrigin: "50% 160%",
              rotate: `${ang}deg`,
              opacity: interpolate(cp, [0, 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              scale: String(interpolate(cp, [0, 1], [0.5, 1])),
              translate: `0px ${interpolate(cp, [0, 1], [200, 0])}px`,
            }}
          >
            <Glass style={{ width: "100%", height: "100%", borderRadius: 30, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, background: i === cards.length - 1 ? "rgba(255,77,77,0.92)" : "rgba(255,255,255,0.9)", color: i === cards.length - 1 ? C.white : C.ink, border: "2px solid rgba(255,255,255,0.6)" }}>
              <Emoji e={e} size={100} />
              <div style={{ fontFamily: UI, fontWeight: 900, fontSize: label.length > 10 ? 30 : 38, letterSpacing: 1, textAlign: "center", padding: "0 10px" }}>{label}</div>
            </Glass>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** "Et maintenant, en français." — a tricolour sweep + a VERSION FR tag. */
export const FrenchSweep: React.FC<Beat> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = (t: number) => sec(t) - from;
  const x = interpolate(frame, [cue(52.5), cue(52.5) + 12], [-1300, 1300], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN_OUT });
  const tag = spring({ frame: frame - cue(52.62), fps, config: SPRING_POP });
  const q = interpolate(frame, [dur - 6, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: x, top: -300, width: 900, height: 2600, rotate: "18deg", display: "flex", opacity: 0.55, filter: "blur(6px)", mixBlendMode: "screen" }}>
        <div style={{ flex: 1, background: C.frBlue }} />
        <div style={{ flex: 1, background: "#ffffff" }} />
        <div style={{ flex: 1, background: C.frRed }} />
      </div>
      <Glass style={{ position: "absolute", left: 300, right: 300, top: 930, padding: "20px 0", borderRadius: 999, display: "flex", justifyContent: "center", alignItems: "center", gap: 14, fontSize: 40, fontWeight: 900, letterSpacing: 2, ...enterStyle(tag, q, 30) }}>
        <Emoji e="🇫🇷" size={46} /> VERSION FR
      </Glass>
    </AbsoluteFill>
  );
};

/** "On va voir si les Français valident ou si je vais parler tout seul." — a poll sticker. */
export const Poll: React.FC<Beat> = ({ from, dur }) => {
  const { p, q, frame, fps } = useEnterExitLocal(dur);
  const cue = (t: number) => sec(t) - from;
  const oui = interpolate(frame, [cue(54.42), cue(54.42) + 18], [0, 0.87], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT });
  const seul = interpolate(frame, [cue(55.5), cue(55.5) + 14], [0, 0.13], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT });
  const tap = spring({ frame: frame - cue(54.42), fps, config: SPRING_POP });
  const row = (label: string, emoji: string, v: number, col: string, win: boolean) => (
    <div style={{ position: "relative", height: 96, borderRadius: 26, background: "#EFEFF2", overflow: "hidden", marginTop: 18 }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${v * 100}%`, background: col, borderRadius: 26 }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 30px", gap: 14, fontFamily: UI, fontWeight: 900, fontSize: 38, color: "#111" }}>
        <Emoji e={emoji} size={40} />
        {label}
        {win ? <IconCheck size={40} color="#111" stroke={3.4} progress={tap} /> : null}
        <span style={{ marginLeft: "auto" }}>{Math.round(v * 100)}%</span>
      </div>
    </div>
  );
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 130, right: 130, top: 820, rotate: "-3deg", ...enterStyle(p, q) }}>
        <div style={{ background: "#fff", borderRadius: 40, padding: "34px 30px 30px", boxShadow: "0 40px 90px rgba(0,0,0,0.45)" }}>
          <div style={{ fontFamily: UI, fontWeight: 900, fontSize: 50, color: "#111", textAlign: "center", letterSpacing: -1 }}>Les Français valident ?</div>
          {row("OUI", "🔥", oui, "linear-gradient(90deg, #FFB38A, #FF7A3D)", true)}
          {row("je parle tout seul", "🦗", seul, "#C9CBD3", false)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const useEnterExitLocal = (dur: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: SPRING_POP });
  const q = interpolate(frame, [dur - 7, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN });
  return { p, q, frame, fps };
};

/** "Bah bref." — a fast horizontal whip with motion streaks. */
export const Whip: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, dur], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: interpolate(t, [0, 0.3, 1], [0, 1, 0]) }}>
      {new Array(9).fill(0).map((_, i) => (
        <div key={i} style={{ position: "absolute", top: 120 + i * 200 + ((i * 37) % 60), left: interpolate(t, [0, 1], [1200, -1600 - i * 80]), width: 900 + i * 60, height: 10 + (i % 3) * 8, borderRadius: 10, background: "rgba(255,255,255,0.75)", filter: "blur(5px)" }} />
      ))}
    </AbsoluteFill>
  );
};

/**
 * "si tu t'intéresses à la tech, à l'IA, au cloud, à des news, et que t'aimes découvrir des nouveaux trucs"
 * Chips orbit the user's head: the far half of the orbit is drawn BEHIND him (cutout in between).
 */
export const OrbitStage: React.FC<Beat & { name: string }> = ({ from, dur, name }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence name={name} from={from} durationInFrames={dur} premountFor={fps}>
      <OrbitChips from={from} dur={dur} layer="back" />
      <Cutout from={from} />
      <OrbitChips from={from} dur={dur} layer="front" />
    </Sequence>
  );
};

const ORBIT: [number, string, React.ReactNode][] = [
  [58.4, "TECH", <IconChip key="a" size={38} color={C.accent} />],
  [58.86, "IA", <IconSparkle key="b" size={38} color={C.accent} />],
  [59.5, "CLOUD", <IconCloud key="c" size={38} color={C.accent} />],
  [60.26, "NEWS", <IconNews key="d" size={38} color={C.accent} />],
  [61.6, "NOUVEAUX TRUCS", <Emoji key="e" e="✨" size={34} />],
];

const OrbitChips: React.FC<Beat & { layer: "back" | "front" }> = ({ from, dur, layer }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = (t: number) => sec(t) - from;
  const q = interpolate(frame, [dur - 8, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN });
  return (
    <AbsoluteFill style={{ opacity: 1 - q }}>
      {ORBIT.map(([t, label, icon], i) => {
        const a = (i / ORBIT.length) * Math.PI * 2 + frame * 0.03;
        const depth = Math.sin(a); // >0 = in front of the user
        if ((layer === "front") !== depth > 0) return null;
        const cp = spring({ frame: frame - cue(t), fps, config: SPRING_POP });
        const x = 390 + Math.cos(a) * 430;
        const y = 440 + depth * 140;
        const s = interpolate(depth, [-1, 1], [0.7, 1.15]) * interpolate(cp, [0, 1], [0.3, 1]);
        return (
          <Glass
            key={label}
            style={{
              position: "absolute",
              left: x,
              top: y,
              translate: "-50% -50%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "18px 30px",
              borderRadius: 999,
              fontSize: 46,
              fontWeight: 900,
              whiteSpace: "nowrap",
              scale: String(s),
              opacity: interpolate(cp, [0, 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * interpolate(depth, [-1, 1], [0.55, 1]),
              filter: `blur(${interpolate(depth, [-1, 0], [3, 0], { extrapolateRight: "clamp" })}px)`,
            }}
          >
            {icon}
            {label}
          </Glass>
        );
      })}
    </AbsoluteFill>
  );
};

/** "reste dans le coin. Salut !" — follow card, a cursor clicks S'abonner, then a wave. */
export const FollowCTA: React.FC<Beat> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = (t: number) => sec(t) - from;
  const p = spring({ frame, fps, config: SPRING_POP });
  const click = cue(62.78);
  const followed = frame >= click;
  const press = interpolate(frame, [click - 2, click, click + 4], [1, 0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cur = interpolate(frame, [4, click], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN_OUT });
  const wave = spring({ frame: frame - cue(63.33), fps, config: SPRING_POP });
  const d = drift(frame, "cta", 6, 3);
  return (
    <AbsoluteFill>
      <Glass style={{ position: "absolute", left: 110, right: 110, top: 900 + d.y, padding: "28px 30px", borderRadius: 40, display: "flex", alignItems: "center", gap: 24, ...enterStyle(p, 0) }}>
        <div style={{ width: 110, height: 110, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accentSoft}, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 72, color: "#fff", flexShrink: 0, boxShadow: `0 0 0 5px rgba(255,255,255,0.25)` }}>
          S
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 46, fontWeight: 900 }}>the user</div>
          <div style={{ fontSize: 28, fontWeight: 600, opacity: 0.7 }}>tech · cloud · IA · mes galères</div>
        </div>
        <div
          style={{
            padding: "22px 30px",
            borderRadius: 22,
            fontSize: 34,
            fontWeight: 900,
            background: followed ? "rgba(255,255,255,0.16)" : C.accent,
            scale: String(press),
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {followed ? <IconCheck size={34} stroke={3.4} /> : null}
          {followed ? "Abonné" : "S'abonner"}
        </div>
      </Glass>
      <div style={{ position: "absolute", left: interpolate(cur, [0, 1], [1100, 830]), top: interpolate(cur, [0, 1], [1500, 985]) + d.y, scale: String(press), opacity: interpolate(frame, [4, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <IconCursor size={86} />
      </div>
      <div style={{ position: "absolute", left: 800, top: 300, scale: String(interpolate(wave, [0, 1], [0.2, 1])), opacity: interpolate(wave, [0, 0.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), rotate: `${Math.sin(Math.max(0, frame - cue(63.33)) / 2.2) * 18}deg`, transformOrigin: "70% 90%" }}>
        <Emoji e="👋" size={170} style={{ filter: "drop-shadow(0 14px 30px rgba(0,0,0,0.4))" }} />
      </div>
    </AbsoluteFill>
  );
};
