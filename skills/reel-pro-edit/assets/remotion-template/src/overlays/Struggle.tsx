import type React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE_IN, EASE_OUT, SPRING_POP, drift, sec } from "../lib/motion";
import { C, DISPLAY, MONO, SERIF, UI } from "../lib/theme";
import { Emoji, enterStyle, Glass, IconCalendar, IconCheck, IconPlay, IconSparkle, IconWarning, useEnterExit } from "./ui";

type Beat = { from: number; dur: number };

/** "dans ma tête, j'avais des idées de fou" — a lightbulb and a burst of sparks around the head. */
export const IdeaBurst: React.FC<Beat> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = (t: number) => sec(t) - from;
  const bulb = spring({ frame: frame - cue(16.52), fps, config: SPRING_POP });
  const q = interpolate(frame, [dur - 8, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const burstT = frame - cue(17.33);
  const sparks = new Array(16).fill(0).map((_, i) => {
    const a = (i / 16) * Math.PI * 2 + random(`a${i}`) * 0.4;
    const dist = interpolate(burstT, [0, 22], [60, 330 + random(`d${i}`) * 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT });
    const op = burstT < 0 ? 0 : interpolate(burstT, [0, 4, 30], [0, 1, 0], { extrapolateRight: "clamp" });
    return { x: 540 + Math.cos(a) * dist * 1.1, y: 430 + Math.sin(a) * dist * 0.8, op, s: 0.6 + random(`s${i}`) * 0.9, rot: burstT * 6 * (i % 2 ? 1 : -1) };
  });
  const floaters: [string, number, number, number][] = [
    ["🎬", 190, 300, 16.9],
    ["🎨", 880, 260, 17.1],
    ["✨", 860, 560, 17.35],
    ["🎞️", 170, 600, 17.5],
  ];
  const d = drift(frame, "bulb", 10, 3);
  return (
    <AbsoluteFill style={{ opacity: 1 - q }}>
      {sparks.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: s.x - 30, top: s.y - 30, opacity: s.op, scale: String(s.s), rotate: `${s.rot}deg` }}>
          <IconSparkle size={60} color={i % 3 === 0 ? C.accent : "#FFE9A8"} stroke={2.4} style={{ filter: "drop-shadow(0 0 12px rgba(255,220,140,0.9))" }} />
        </div>
      ))}
      {floaters.map(([e, x, y, t]) => {
        const fp = spring({ frame: frame - cue(t), fps, config: SPRING_POP });
        const fd = drift(frame, e, 14, 2.6);
        return (
          <div key={e} style={{ position: "absolute", left: x - 50 + fd.x, top: y - 50 + fd.y, rotate: `${fd.r * 4}deg`, ...enterStyle(fp, 0, 30) }}>
            <Emoji e={e} size={100} style={{ filter: "drop-shadow(0 12px 22px rgba(0,0,0,0.35))" }} />
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 540 - 80 + d.x,
          top: 40 + d.y,
          scale: String(interpolate(bulb, [0, 1], [0.2, 1])),
          opacity: interpolate(bulb, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
          filter: `drop-shadow(0 0 ${30 + Math.sin(frame / 3) * 10}px rgba(255,230,120,0.95))`,
        }}
      >
        <Emoji e="💡" size={160} />
      </div>
    </AbsoluteFill>
  );
};

/** "je savais exactement ce que je voulais comme rendu" — the dream render, as a cinematic preview card. */
export const RenduCard: React.FC<Beat> = ({ from, dur }) => {
  const { p, q, frame, fps } = useEnterExit(dur);
  const cue = (t: number) => sec(t) - from;
  const shine = interpolate(frame, [cue(20.02), cue(20.02) + 14], [-40, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ok = spring({ frame: frame - cue(20.1), fps, config: SPRING_POP });
  const tc = Math.max(0, frame);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 120, right: 120, top: 830, ...enterStyle(p, q) }}>
        <div
          style={{
            position: "relative",
            height: 470,
            borderRadius: 30,
            overflow: "hidden",
            border: `2px solid ${C.stroke}`,
            boxShadow: "0 40px 90px rgba(0,0,0,0.55)",
            background: "radial-gradient(120% 90% at 70% 80%, #ff9a52 0%, #c2410c 28%, #3b0d2b 62%, #0b0b18 100%)",
          }}
        >
          {/* skyline silhouettes */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 64, height: 120, background: "linear-gradient(0deg, #08070d 0%, rgba(8,7,13,0) 100%)" }} />
          <div style={{ position: "absolute", right: 140, bottom: 64, width: 150, height: 150, borderRadius: "50%", background: "#ffd2a1", filter: "blur(2px)", opacity: 0.9, boxShadow: "0 0 80px #ffb36b" }} />
          {/* letterbox */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 64, background: "#000" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 64, background: "#000" }} />
          <div style={{ position: "absolute", left: 26, top: 16, fontFamily: MONO, fontSize: 24, color: "rgba(255,255,255,0.75)" }}>● REC 4K · 24 FPS</div>
          <div style={{ position: "absolute", right: 26, bottom: 16, fontFamily: MONO, fontSize: 24, color: "rgba(255,255,255,0.75)" }}>
            00:00:{String(Math.floor(tc / 30) % 60).padStart(2, "0")}:{String(tc % 30).padStart(2, "0")}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: SERIF, fontSize: 96, color: "#fff", textShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
            le rendu de mes rêves
          </div>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 250,
              width: 110,
              height: 110,
              marginLeft: -55,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              border: "2px solid rgba(255,255,255,0.5)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconPlay size={56} />
          </div>
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(105deg, rgba(255,255,255,0) ${shine - 12}%, rgba(255,255,255,0.45) ${shine}%, rgba(255,255,255,0) ${shine + 12}%)` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: -34 }}>
          <Glass style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 30px", borderRadius: 999, fontSize: 34, fontWeight: 800, background: "rgba(16,120,80,0.75)", ...enterStyle(ok, 0, 20) }}>
            <IconCheck size={38} stroke={3} /> validé… dans ma tête
          </Glass>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** "…c'était une autre histoire" — error windows pile up (record scratch). */
export const ErrorPopups: React.FC<Beat> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = (t: number) => sec(t) - from;
  const q = interpolate(frame, [dur - 5, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN });
  const errs: [number, string, string, number, number, number][] = [
    [22.5, "Export échoué", "Erreur 0x0042 · rendu interrompu", 110, 820, -4],
    [22.8, "Le logiciel ne répond pas", "Forcer à quitter ?", 160, 960, 3],
    [23.1, "Motivation introuvable", "Réessayer plus tard", 90, 1090, -2],
  ];
  return (
    <AbsoluteFill style={{ opacity: 1 - q }}>
      {errs.map(([t, title, sub, x, y, rot], i) => {
        const ep = spring({ frame: frame - cue(t), fps, config: { damping: 11, stiffness: 260, mass: 0.6 } });
        return (
          <Glass
            key={title}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 820,
              padding: "26px 30px",
              borderRadius: 26,
              background: "rgba(40,10,14,0.8)",
              border: "2px solid rgba(255,90,90,0.55)",
              display: "flex",
              gap: 22,
              alignItems: "center",
              rotate: `${rot}deg`,
              ...enterStyle(ep, 0, 0),
            }}
          >
            <div style={{ width: 76, height: 76, borderRadius: 20, background: C.red, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <IconWarning size={48} stroke={2.6} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 40, fontWeight: 900 }}>
                {title} {i === 2 ? <Emoji e="💀" size={40} /> : null}
              </div>
              <div style={{ fontSize: 28, fontWeight: 600, opacity: 0.75, marginTop: 4 }}>{sub}</div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, padding: "12px 22px", borderRadius: 14, background: "rgba(255,255,255,0.12)" }}>OK</div>
          </Glass>
        );
      })}
    </AbsoluteFill>
  );
};

/** "J'avais la flemme même pour apprendre à monter des vidéos…" — endless tutorials pile up, then fall. */
export const TutoStack: React.FC<Beat> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = (t: number) => sec(t) - from;
  const fall = interpolate(frame, [cue(26.66), cue(26.66) + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN });
  const tutos: [number, string, string, string, string][] = [
    [24.14, "TUTO MONTAGE COMPLET", "3:47:12", "#7c3aed", "Débutant → Pro (partie 1/12)"],
    [24.62, "COLOR GRADING ULTIME", "2:13:40", "#0ea5e9", "Le guide que personne ne finit"],
    [25.04, "APPRENDRE PREMIERE PRO", "10:02:55", "#e11d48", "Formation intégrale"],
  ];
  return (
    <AbsoluteFill>
      {tutos.map(([t, title, len, col, sub], i) => {
        const tp = spring({ frame: frame - cue(t), fps, config: SPRING_POP });
        const x = interpolate(tp, [0, 1], [900, 0]);
        const rot = [-5, 4, -2][i] + fall * [-25, 30, -12][i];
        return (
          <div
            key={title}
            style={{
              position: "absolute",
              left: 150 + i * 26,
              top: 810 + i * 120,
              width: 780,
              translate: `${x}px ${fall * (700 + i * 120)}px`,
              rotate: `${rot}deg`,
              opacity: interpolate(tp, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
            }}
          >
            <Glass style={{ display: "flex", gap: 22, padding: 18, borderRadius: 26, alignItems: "center" }}>
              <div style={{ position: "relative", width: 250, height: 140, borderRadius: 16, background: `linear-gradient(135deg, ${col}, #111)`, flexShrink: 0, overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 14, top: 12, right: 14, fontFamily: UI, fontWeight: 900, fontSize: 26, lineHeight: 1.05, color: "#fff" }}>{title}</div>
                <div style={{ position: "absolute", right: 8, bottom: 8, fontFamily: MONO, fontSize: 20, fontWeight: 700, background: "rgba(0,0,0,0.85)", padding: "2px 8px", borderRadius: 6 }}>{len}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.15 }}>{title.toLowerCase().replace(/^./, (c) => c.toUpperCase())}</div>
                <div style={{ fontSize: 24, fontWeight: 600, opacity: 0.65, marginTop: 6 }}>{sub}</div>
                <div style={{ marginTop: 12, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.15)" }}>
                  <div style={{ width: `${[3, 1, 0.5][i]}%`, height: "100%", borderRadius: 4, background: C.red }} />
                </div>
              </div>
            </Glass>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** "j'étais éclaté" — the screen cracks from the impact point. */
export const ScreenCrack: React.FC<Beat> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = (t: number) => sec(t) - from;
  const t0 = cue(27.78);
  const grow = interpolate(frame, [t0, t0 + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT });
  const q = interpolate(frame, [dur - 6, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flash = interpolate(frame, [t0, t0 + 1, t0 + 4], [0, 0.7, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const skull = spring({ frame: frame - t0 - 2, fps, config: { damping: 9, stiffness: 240, mass: 0.6 } });
  const cx = 600, cy = 1000;
  const cracks = new Array(13).fill(0).map((_, i) => {
    let x = cx, y = cy;
    const a0 = (i / 13) * Math.PI * 2 + random(`ca${i}`) * 0.3;
    let d = `M${cx} ${cy}`;
    for (let s = 0; s < 6; s++) {
      const a = a0 + (random(`cs${i}-${s}`) - 0.5) * 0.7;
      const len = 60 + random(`cl${i}-${s}`) * 150;
      x += Math.cos(a) * len; y += Math.sin(a) * len;
      d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  });
  return (
    <AbsoluteFill style={{ opacity: 1 - q }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {cracks.map((d, i) => (
          <g key={i}>
            <path d={d} stroke="rgba(0,0,0,0.45)" strokeWidth={7} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - grow} />
            <path d={d} stroke="rgba(255,255,255,0.92)" strokeWidth={3} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - grow} />
          </g>
        ))}
        <circle cx={cx} cy={cy} r={70 * grow} fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.8)" strokeWidth={3} />
      </svg>
      <div style={{ position: "absolute", left: cx - 90, top: cy - 280, scale: String(interpolate(skull, [0, 1], [0.2, 1])), opacity: interpolate(skull, [0, 0.2], [0, 1], { extrapolateRight: "clamp" }), rotate: `${interpolate(skull, [0, 1], [-30, 8])}deg` }}>
        <Emoji e="💀" size={180} style={{ filter: "drop-shadow(0 16px 30px rgba(0,0,0,0.5))" }} />
      </div>
      <AbsoluteFill style={{ backgroundColor: "white", opacity: flash }} />
    </AbsoluteFill>
  );
};

/** "je repoussais toujours, je me suis dit que c'était pas le moment" — snoozed reminders. */
export const Reminders: React.FC<Beat> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = (t: number) => sec(t) - from;
  const q = interpolate(frame, [dur - 7, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN });
  const items: [number, string][] = [
    [28.58, "demain"],
    [29.52, "lundi prochain"],
    [30.6, "le mois prochain"],
  ];
  return (
    <AbsoluteFill style={{ opacity: 1 - q, filter: `blur(${q * 10}px)` }}>
      {items.map(([t, when], i) => {
        const np = spring({ frame: frame - cue(t), fps, config: SPRING_POP });
        // older notifications get pushed down and dimmed
        const newer = items.filter(([t2]) => frame >= cue(t2) && t2 > t).length;
        return (
          <Glass
            key={when}
            style={{
              position: "absolute",
              left: 90,
              right: 90,
              top: 830 + newer * 128,
              padding: "24px 28px",
              borderRadius: 34,
              display: "flex",
              gap: 22,
              alignItems: "center",
              opacity: interpolate(np, [0, 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (1 - newer * 0.25),
              translate: `0px ${interpolate(np, [0, 1], [-60, 0])}px`,
              scale: String(interpolate(np, [0, 1], [0.9, 1]) - newer * 0.04),
            }}
          >
            <div style={{ width: 72, height: 72, borderRadius: 18, background: "#FF9F0A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <IconCalendar size={44} stroke={2.4} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 700, opacity: 0.6, letterSpacing: 1 }}>RAPPELS · maintenant</div>
              <div style={{ fontSize: 36, fontWeight: 800 }}>Commencer le montage 🎬</div>
              <div style={{ fontSize: 30, fontWeight: 600, color: C.accentSoft }}>Reporté à {when}</div>
            </div>
          </Glass>
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * Full-screen cutaway over "…ça n'arrivera jamais" (it also hides a long script glance):
 * hard cut to black, the « plus tard » bar stuck at 99 %, then it breaks into ∞ JAMAIS.
 */
export const JamaisCutaway: React.FC<Beat> = ({ from }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = (t: number) => sec(t) - from;
  const never = frame >= cue(35.3);
  const np = spring({ frame: frame - cue(35.3), fps, config: { damping: 9, stiffness: 260, mass: 0.6 } });
  const jit = never ? 0 : Math.sin(frame * 2.3) * 0.006;
  const glitch = never && frame - cue(35.3) < 5 ? (random(`jx${frame}`) - 0.5) * 40 : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#07070B" }}>
      <AbsoluteFill style={{ background: `radial-gradient(70% 45% at 50% 48%, ${never ? "rgba(255,60,60,0.28)" : "rgba(255,122,61,0.16)"} 0%, rgba(0,0,0,0) 70%)` }} />
      <div style={{ position: "absolute", left: 100, right: 100, top: 610, translate: `${glitch}px 0px` }}>
        <div style={{ fontFamily: SERIF, fontSize: 92, color: "#fff", opacity: 0.9, textAlign: "center" }}>« plus tard »</div>
        <div style={{ marginTop: 40, height: 46, borderRadius: 23, background: "rgba(255,255,255,0.1)", overflow: "hidden", border: "2px solid rgba(255,255,255,0.15)" }}>
          <div style={{ width: `${(never ? 1 : 0.99 + jit) * 100}%`, height: "100%", borderRadius: 23, background: never ? C.red : C.accent, boxShadow: `0 0 40px ${never ? C.red : C.accent}` }} />
        </div>
        <div style={{ marginTop: 26, display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 40, color: "rgba(255,255,255,0.6)" }}>
          <span>{never ? "erreur" : "chargement…"}</span>
          <span style={{ color: never ? C.red : "#fff" }}>{never ? "∞" : "99%"}</span>
        </div>
        <div
          style={{
            marginTop: 70,
            textAlign: "center",
            fontFamily: DISPLAY,
            fontSize: 300,
            lineHeight: 1,
            color: C.red,
            opacity: never ? 1 : 0,
            scale: String(interpolate(np, [0, 1], [1.8, 1])),
            textShadow: "0 0 60px rgba(255,60,60,0.55)",
          }}
        >
          JAMAIS.
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** "Sauf que ce fameux « plus tard », ça n'arrivera jamais." — a progress bar stuck at 99%, then ∞. */
export const LoadingForever: React.FC<Beat> = ({ from, dur }) => {
  const { p, q, frame, fps } = useEnterExit(dur);
  const cue = (t: number) => sec(t) - from;
  const fill = interpolate(frame, [cue(34.0), cue(34.6)], [0.1, 0.99], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT });
  const never = frame >= cue(35.3);
  const np = spring({ frame: frame - cue(35.3), fps, config: SPRING_POP });
  const jitter = frame > cue(34.6) && !never ? Math.sin(frame * 2.1) * 0.004 : 0;
  return (
    <AbsoluteFill>
      <Glass style={{ position: "absolute", left: 120, right: 120, top: 870, padding: "34px 40px", ...enterStyle(p, q), border: never ? `2px solid ${C.red}` : `2px solid ${C.stroke}` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span style={{ fontFamily: SERIF, fontSize: 66 }}>« plus tard »</span>
          <span style={{ marginLeft: "auto", fontFamily: MONO, fontWeight: 700, fontSize: never ? 64 : 40, color: never ? C.red : C.white, scale: String(never ? interpolate(np, [0, 1], [1.6, 1]) : 1) }}>
            {never ? "∞" : `${Math.round((fill + jitter) * 100)}%`}
          </span>
        </div>
        <div style={{ marginTop: 22, height: 24, borderRadius: 12, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
          <div style={{ width: `${(never ? 1 : fill + jitter) * 100}%`, height: "100%", borderRadius: 12, background: never ? C.red : C.accent, boxShadow: `0 0 26px ${never ? C.red : C.accent}` }} />
        </div>
        <div style={{ marginTop: 18, fontSize: 32, fontWeight: 800, color: never ? C.red : "rgba(255,255,255,0.7)", letterSpacing: never ? 6 : 0 }}>
          {never ? "JAMAIS." : frame > cue(34.6) ? "presque prêt… promis" : "chargement…"}
        </div>
      </Glass>
    </AbsoluteFill>
  );
};
