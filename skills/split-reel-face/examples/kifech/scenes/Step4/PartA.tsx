import type React from "react";
import { AbsoluteFill, spring, useCurrentFrame } from "remotion";
import { Caret, enter, float, Spark, typed, Wave, Window } from "../../edit/kit";
import { glass, K, MONO, UI } from "../../edit/theme";
import { Check, cl, ease, EASE_IO, Emo, lin, mix, mmss, SendArrow, T } from "./shared";
import { Timeline } from "./Timeline";

/**
 * ÉTAPE 4 — part A (55.28–67.0 s): « نعطيه الـ topic، وهو يمشي يكتب الـ script، يجينيري الصوت بـ ElevenLabs،
 * يستعمل Remotion والـ skills، الـ sound effects، الموزيكا، كل شيء يلوّجو ».
 * Stage y 1040–1450, x 60–940. Every element lands on its word (see T in ./shared).
 */

const PROMPT = "Ekteb el script 3al topic hedha";
const TOPIC = "Kifech na3mel el reels hedhom";

/* ---------------- 1. the prompt: topic chip + typed 3arbizi prompt ---------------- */
const CARD = { x: 60, y: 1116, w: 880, h: 258 };
const CHIP0 = { x: 106, y: 1206, w: 566, h: 52 };
const CHIP_DOCK = { x: 940, y: 1048, s: 0.66 }; // right-aligned at x 940

const PromptCard: React.FC = () => {
  const frame = useCurrentFrame();
  const inP = ease(frame, T.A0 + 5, 8);
  const outP = ease(frame, T.howa + 3, 8);
  if (inP <= 0 || outP >= 1) return null;
  const txt = typed(PROMPT, frame, T.give, 30);
  const sendT = frame - T.howa;
  const press = sendT >= 0 && sendT < 5 ? 0.86 : 1;
  const ring = sendT >= 0 && sendT < 14 ? sendT / 14 : 0;
  const fl = float(frame, "s4card", 3);
  return (
    <div
      style={{
        position: "absolute",
        left: CARD.x,
        top: CARD.y + fl.y,
        width: CARD.w,
        height: CARD.h,
        ...glass(),
        padding: 0,
        borderRadius: 30,
        ...enter(inP, 0, 18),
        transform: `translateY(${(1 - inP) * 18 - outP * 24}px) scale(${(0.96 + 0.04 * inP) * (1 - outP * 0.06)})`,
        opacity: inP * (1 - outP),
        filter: inP < 1 || outP > 0 ? `blur(${(1 - inP) * 6 + outP * 8}px)` : undefined,
      }}
    >
      <div style={{ position: "absolute", left: 28, top: 18, display: "flex", alignItems: "center", gap: 12 }}>
        <Spark size={30} rotate={frame * 1.5} />
        <span style={{ fontFamily: UI, fontWeight: 800, fontSize: 25, color: K.cream }}>Claude</span>
      </div>
      <div style={{ position: "absolute", right: 28, top: 22, fontFamily: MONO, fontSize: 17, color: K.dim }}>nouveau reel</div>
      {/* input */}
      <div style={{ position: "absolute", left: 24, top: 70, width: 832, height: 164, borderRadius: 22, background: "rgba(255,236,220,0.045)", border: `1.5px solid ${frame >= T.give ? "rgba(217,119,87,0.45)" : K.stroke}` }}>
        <div style={{ position: "absolute", left: 22, top: 98, fontFamily: UI, fontWeight: 500, fontSize: 30, color: txt ? K.cream : K.dim, whiteSpace: "nowrap" }}>
          {txt || "Écris à Claude…"}
          {frame >= T.give && frame < T.howa ? <Caret h={30} /> : null}
          {txt.length === PROMPT.length ? <Emo e=" ✍️" size={28} /> : null}
        </div>
        <div
          style={{
            position: "absolute",
            right: 18,
            top: 92,
            width: 56,
            height: 56,
            borderRadius: 16,
            background: txt ? `linear-gradient(180deg, ${K.coralLight}, ${K.coral})` : "rgba(255,236,220,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${press})`,
            boxShadow: txt ? `0 0 24px ${K.coralGlow}` : undefined,
          }}
        >
          <SendArrow color={txt ? "#1A0F0B" : K.dim} />
          {ring > 0 ? <div style={{ position: "absolute", inset: -14 * ring, borderRadius: 16 + 14 * ring, border: `3px solid ${K.coral}`, opacity: 1 - ring }} /> : null}
        </div>
      </div>
    </div>
  );
};

/** The topic chip: drops into the prompt ON « topic », then docks top-right as the source of everything. */
const TopicChip: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.topic - 1) return null;
  const pop = spring({ frame: frame - T.topic, fps: 30, config: { damping: 11, stiffness: 210, mass: 0.6 } });
  const d = EASE_IO((frame - (T.howa + 4)) / 12);
  const out = ease(frame, T.remotion - 4, 7);
  if (out >= 1) return null;
  const s = mix(1, CHIP_DOCK.s, d);
  const x = mix(CHIP0.x, CHIP_DOCK.x - CHIP0.w * CHIP_DOCK.s, d);
  const y = mix(CHIP0.y, CHIP_DOCK.y, d) + (1 - Math.min(1, pop)) * -46;
  const fl = float(frame, "s4topic", d * 3);
  return (
    <div
      style={{
        position: "absolute",
        left: x + fl.x,
        top: y + fl.y,
        width: CHIP0.w,
        height: CHIP0.h,
        transformOrigin: "0 0",
        transform: `scale(${s * (0.75 + 0.25 * pop)})`,
        opacity: cl(pop * 1.5) * (1 - out),
        filter: out > 0 ? `blur(${out * 6}px)` : undefined,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 20px",
        borderRadius: 999,
        background: `linear-gradient(180deg, ${K.coralLight}, ${K.coral})`,
        border: "1.5px solid rgba(255,220,200,0.6)",
        boxShadow: `0 10px 30px ${K.coralGlow}`,
        fontFamily: UI,
        fontWeight: 800,
        fontSize: 24,
        color: "#1A0F0B",
        whiteSpace: "nowrap",
      }}
    >
      <Emo e="📌" size={26} />
      <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 18, opacity: 0.7 }}>topic</span>
      <span>{TOPIC}</span>
    </div>
  );
};

/* ---------------- 2. the script writes itself, then the voice is generated ---------------- */
const SCRIPT: [string, string][] = [
  ["#", "Kifech na3mel el reels ?"],
  ["HOOK", "kollou b Claude"],
  ["01", "nlawej 3la reel mezyena"],
  ["02", "na3tiha l Claude"],
  ["03", "habbetli les outils"],
  ["04", "topic → script → voix"],
  ["05", "rendu 60 fps · GPU"],
  ["BONUS", "a3melli skill"],
];
const DOC = { w: 440, h: 336, y: 1108, x0: 320, x1: 500 };

const ScriptDoc: React.FC = () => {
  const frame = useCurrentFrame();
  // the doc opens on « يمشي » (he goes), the lines type from « يكتب » (writes)
  const inP = ease(frame, T.yemchi, 8);
  const out = ease(frame, T.remotion - 4, 7);
  if (inP <= 0 || out >= 1) return null;
  const x = mix(DOC.x0, DOC.x1, EASE_IO(lin(frame, T.gen - 2, T.gen + 10)));
  const lineAt = (i: number) => T.yekteb + i * 5;
  const typing = SCRIPT.findIndex((_, i) => frame >= lineAt(i) && frame < lineAt(i) + 8);
  const done = frame >= lineAt(SCRIPT.length - 1) + 9;
  // the voice « reads » the script: a highlight walks down the lines while the waveform generates
  const readIdx = frame >= T.eleven && frame < T.use + 8 ? Math.min(SCRIPT.length - 1, Math.floor(lin(frame, T.eleven, T.use + 8) * SCRIPT.length)) : -1;
  const fl = float(frame, "s4doc", 3);
  return (
    <Window
      w={DOC.w}
      h={DOC.h}
      style={{
        position: "absolute",
        left: x + fl.x,
        top: DOC.y + fl.y,
        ...enter(inP, out),
        transform: `translateY(${(1 - inP) * 14 - out * 30}px) scale(${0.96 + 0.04 * inP - out * 0.05})`,
      }}
      title={
        <>
          <span style={{ fontFamily: MONO, fontSize: 19, color: K.cream }}>script.md</span>
          <span
            style={{
              marginLeft: 10,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 10px",
              borderRadius: 999,
              fontFamily: UI,
              fontSize: 15,
              fontWeight: 700,
              color: done ? K.ok : K.coralLight,
              background: done ? "rgba(127,209,161,0.12)" : "rgba(217,119,87,0.14)",
            }}
          >
            {done ? <Check size={15} /> : <Spark size={14} rotate={frame * 6} />}
            {done ? "prêt" : "écrit…"}
          </span>
        </>
      }
    >
      <div style={{ marginTop: -8, fontFamily: MONO, fontSize: 19, lineHeight: 1.47, color: K.cream }}>
        {SCRIPT.map(([k, v], i) => {
          if (frame < lineAt(i)) return <div key={i} style={{ height: 19 * 1.47 }} />;
          const tv = typed(v, frame, lineAt(i) + 1, 130);
          const hl = typing === i || readIdx === i;
          return (
            <div
              key={i}
              style={{
                position: "relative",
                whiteSpace: "nowrap",
                margin: "0 -10px",
                padding: "0 10px",
                borderRadius: 6,
                background: hl ? "rgba(217,119,87,0.13)" : "transparent",
                boxShadow: readIdx === i ? `inset 3px 0 0 ${K.coral}` : undefined,
                opacity: ease(frame, lineAt(i), 3),
              }}
            >
              <span style={{ color: k === "#" ? K.coral : K.coralLight, fontWeight: 700, display: "inline-block", minWidth: k === "#" ? 26 : 72 }}>{k}</span>
              <span style={{ color: k === "#" ? K.cream : i === 5 ? K.cream : K.muted, fontWeight: k === "#" ? 700 : 500 }}>{tv}</span>
              {typing === i && tv.length < v.length ? <Caret h={20} /> : null}
            </div>
          );
        })}
      </div>
    </Window>
  );
};

const VOICE = { x: 60, y: 1108, w: 410, h: 336 };
const VoiceCard: React.FC = () => {
  const frame = useCurrentFrame();
  const inP = ease(frame, T.gen, 9);
  const out = ease(frame, T.remotion - 4, 7);
  if (inP <= 0 || out >= 1) return null;
  const g0 = T.gen + 4;
  const g1 = T.use + 6;
  const prog = lin(frame, g0, g1);
  const done = frame >= g1;
  const label = spring({ frame: frame - T.eleven, fps: 30, config: { damping: 12, stiffness: 200, mass: 0.6 } });
  const fl = float(frame, "s4voice", 3);
  return (
    <div
      style={{
        position: "absolute",
        left: VOICE.x + fl.x,
        top: VOICE.y + fl.y,
        width: VOICE.w,
        height: VOICE.h,
        ...glass(done),
        padding: 0,
        borderRadius: 26,
        overflow: "hidden",
        opacity: inP * (1 - out),
        transform: `translateX(${(1 - inP) * -36}px) translateY(${-out * 30}px) scale(${0.96 + 0.04 * inP - out * 0.05})`,
        filter: inP < 1 || out > 0 ? `blur(${(1 - inP) * 6 + out * 6}px)` : undefined,
      }}
    >
      {/* header: « génération… » then the ElevenLabs label lands ON its word */}
      {frame < T.eleven + 4 ? (
        <div style={{ position: "absolute", left: 24, top: 22, height: 40, display: "flex", alignItems: "center", gap: 10, opacity: 1 - lin(frame, T.eleven, T.eleven + 3) }}>
          <Spark size={26} rotate={frame * 7} />
          {[150, 70].map((w, i) => (
            <div key={i} style={{ width: w, height: 16, borderRadius: 8, background: `rgba(255,236,220,${0.1 + 0.05 * Math.sin(frame / 4 + i)})` }} />
          ))}
        </div>
      ) : null}
      {label > 0.01 ? (
        <div style={{ position: "absolute", left: 24, top: 22, height: 40, display: "flex", alignItems: "baseline", gap: 10, opacity: cl(label * 1.5), transform: `translateY(${(1 - Math.min(1, label)) * 14}px) scale(${0.9 + 0.1 * label})`, transformOrigin: "0 50%" }}>
          <span style={{ fontFamily: UI, fontWeight: 800, fontSize: 31, color: K.cream, letterSpacing: "-0.01em" }}>ElevenLabs</span>
          <span style={{ fontFamily: UI, fontWeight: 500, fontSize: 27, color: K.muted }}>· voix</span>
        </div>
      ) : null}
      {/* waveform generating left → right, with a write head */}
      <div style={{ position: "absolute", left: 24, top: 86, width: 362, height: 130 }}>
        <Wave w={362} h={130} bars={40} seed="s4el" progress={prog} />
        {!done ? <div style={{ position: "absolute", left: prog * 362 - 1, top: -6, width: 3, height: 142, borderRadius: 2, background: K.coralLight, boxShadow: `0 0 14px ${K.coralLight}`, opacity: prog > 0 ? 1 : 0 }} /> : null}
      </div>
      {/* file + counter */}
      <div style={{ position: "absolute", left: 24, right: 24, top: 236, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: MONO }}>
        <span style={{ fontSize: 19, color: K.muted }}>voix.mp3</span>
        <span style={{ fontSize: 22, fontWeight: 700, color: K.cream }}>
          {mmss(prog * 115)}
          <span style={{ color: K.dim, fontWeight: 500 }}> / 01:55</span>
        </span>
      </div>
      {/* status */}
      <div style={{ position: "absolute", left: 24, right: 24, top: 280, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,236,220,0.1)", overflow: "hidden" }}>
          <div style={{ width: `${prog * 100}%`, height: "100%", background: done ? K.ok : K.coral, boxShadow: `0 0 10px ${done ? "rgba(127,209,161,0.6)" : K.coralGlow}` }} />
        </div>
        <span style={{ fontFamily: UI, fontWeight: 700, fontSize: 18, color: done ? K.ok : K.muted, minWidth: 150, textAlign: "right", display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "flex-end", whiteSpace: "nowrap" }}>
          {done ? (
            <>
              <Check size={18} progress={lin(frame, g1, g1 + 6)} /> voix prête
            </>
          ) : (
            <>
              génération <span style={{ fontFamily: MONO, color: K.cream }}>{String(Math.round(prog * 100)).padStart(2, "0")} %</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
};

/** Little flow badge between the script (right) and the voice (left): RTL reading order. */
const Connector: React.FC = () => {
  const frame = useCurrentFrame();
  const inP = ease(frame, T.gen + 8, 7);
  const out = ease(frame, T.remotion - 4, 6);
  if (inP <= 0 || out >= 1) return null;
  const dots = [0, 1, 2];
  return (
    <div style={{ position: "absolute", left: 485 - 24, top: 1276 - 24, width: 48, height: 48, borderRadius: 24, background: "rgba(20,14,11,0.95)", border: `1.5px solid ${K.coral}`, boxShadow: `0 0 24px ${K.coralGlow}`, display: "flex", alignItems: "center", justifyContent: "center", opacity: inP * (1 - out), transform: `scale(${0.6 + 0.4 * inP})` }}>
      <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
        <path d="M19 12 H5 M11 6 L5 12 L11 18" stroke={K.coralLight} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {dots.map((i) => {
        const ph = ((frame + i * 6) % 18) / 18;
        return <div key={i} style={{ position: "absolute", left: 24 + 30 - ph * 60 - 3, top: 24 + 30, width: 6, height: 6, borderRadius: 3, background: K.coralLight, opacity: Math.sin(ph * Math.PI) * 0.8 }} />;
      })}
    </div>
  );
};

/* ---------------- 3. Remotion timeline: lanes, skills, SFX, music, search sweep ---------------- */
const TimelineA: React.FC = () => {
  const frame = useCurrentFrame();
  const inP = ease(frame, T.remotion - 1, 11);
  if (inP <= 0) return null;
  const push = 1 + lin(frame, T.remotion, T.A1) * 0.025;
  return (
    <Timeline
      frame={frame}
      title={
        <>
          <span style={{ fontFamily: UI, fontWeight: 800, fontSize: 20, color: K.cream }}>Remotion</span>
          <span> · Reel · 1080×1920 · 30 fps</span>
        </>
      }
      voiceAt={T.remotion + 2}
      motionAt={T.remotion + 5}
      sfxAt={T.sound}
      musicAt={T.music}
      playT={frame / 30}
      skillsAt={T.skills}
      skillsDock={T.sound - 9}
      sweepFrom={T.kol - 2}
      sweepTo={T.ylawj - 3}
      sheenAt={T.remotion + 4}
      style={{
        left: 60,
        top: 1044,
        opacity: inP,
        transformOrigin: "50% 100%",
        transform: `perspective(1400px) rotateX(${(1 - inP) * 16}deg) translateY(${(1 - inP) * 46}px) scale(${(0.95 + 0.05 * inP) * push})`,
        filter: inP < 1 ? `blur(${(1 - inP) * 8}px)` : undefined,
      }}
    />
  );
};

export const PartA: React.FC = () => {
  const frame = useCurrentFrame();
  // hand-off to the full-screen « agents » scene: everything rushes toward the camera and blurs
  const ex = ease(frame, T.handoff - 3, 8);
  if (frame > T.A1 + 6) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: 1 - ex, transformOrigin: "500px 1245px", transform: `scale(${1 + ex * 0.09})`, filter: ex > 0 ? `blur(${ex * 12}px)` : undefined }}>
      <PromptCard />
      <ScriptDoc />
      <VoiceCard />
      <Connector />
      <TopicChip />
      <TimelineA />
    </AbsoluteFill>
  );
};
