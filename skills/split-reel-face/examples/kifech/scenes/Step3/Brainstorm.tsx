import type React from "react";
import { interpolate, spring, useCurrentFrame } from "remotion";
import { Caret, EASE, float, Spark } from "../../edit/kit";
import { glass, K, MONO, SERIF, UI } from "../../edit/theme";
import { IcBulb, IcCheck, IcClapper, IcLoop, IcSend } from "./icons";
import { clamp01, T } from "./t";

/**
 * Beat C — « نقلّو brainstormi معايا، و act as expert motion graphics editor » (47.15–51.2)
 * + Beat D — « ديما نحكيلو نفس الحكاية » (51.2–53.0).
 * The prompt is typed in Latin word by word ON the spoken words; idea bubbles pop while he says « brainstormi معايا »,
 * get sucked into the centre on « act as », and the role badge STAMPS on « expert » (its words light up on
 * motion / graphics / editor). On « ديما » the prompt becomes a stack (the same brief every time) with a spinning loop chip.
 */
const PX = 60;
const PY = 1046;
const PW = 880;
const PH = 128;
const WORDS: [string, number][] = [
  ["brainstormi", T.brain],
  ["m3aya,", T.m3aya],
  ["w", T.w],
  ["act", T.act],
  ["as", T.as],
  ["expert", T.expert],
  ["motion", T.motion],
  ["graphics", T.graphics],
  ["editor", T.editor],
];
const ROLE_FROM = 3; // "act as expert motion graphics editor" = the role part (expert… turns coral on the stamp)
const SEND = T.editor + 12;

const IDEAS: { t: string; x: number; y: number; at: number; claude: boolean }[] = [
  { t: "hook en 1 s", x: 72, y: 1200, at: T.brain + 3, claude: false },
  { t: "split + stamps", x: 664, y: 1196, at: T.brain + 9, claude: true },
  { t: "serif italique", x: 352, y: 1252, at: T.m3aya + 1, claude: false },
  { t: "SFX sur chaque mot", x: 596, y: 1314, at: T.m3aya + 7, claude: true },
  { t: "spark 3D", x: 116, y: 1334, at: T.w + 1, claude: false },
  { t: "kinetic type", x: 396, y: 1388, at: T.act, claude: true },
];

const BADGE = { x: 100, y: 1302, w: 800, h: 112 };
const BC = { x: BADGE.x + BADGE.w / 2, y: BADGE.y + BADGE.h / 2 };

/** Characters of word i shown at `frame` (typed during its own spoken duration). */
const shown = (i: number, frame: number) => {
  const [w, at] = WORDS[i];
  const next = i + 1 < WORDS.length ? WORDS[i + 1][1] : at + 16;
  const fpc = Math.min(1.8, Math.max(0.6, (next - at - 1) / (w.length + 0.5)));
  const n = Math.floor((frame - (at - 1)) / fpc) + 1;
  return Math.max(0, Math.min(w.length, n));
};

const Bubble: React.FC<{ i: number }> = ({ i }) => {
  const frame = useCurrentFrame();
  const it = IDEAS[i];
  if (frame < it.at) return null;
  const sp = spring({ frame: frame - it.at, fps: 30, config: { damping: 10, stiffness: 200, mass: 0.6 } });
  const op = EASE((frame - it.at) / 4);
  // converge into the badge on « act as » → « expert »
  const c = interpolate(frame, [T.as - 3, T.expert], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ci = c * c;
  if (ci >= 1) return null;
  const fl = float(frame, `s3idea${i}`, 5, 3.2 + i * 0.3);
  const wGuess = 74 + it.t.length * 14.5;
  const cx = it.x + wGuess / 2;
  const cy = it.y + 25;
  const dx = (BC.x - cx) * ci;
  const dy = (BC.y - cy) * ci;
  return (
    <div
      style={{
        position: "absolute",
        left: it.x,
        top: it.y,
        transform: `translate(${dx + fl.x * (1 - ci)}px, ${dy + fl.y * (1 - ci)}px) scale(${(0.6 + 0.4 * sp) * (1 - 0.7 * ci)})`,
        opacity: op * (1 - ci),
        filter: ci > 0.05 ? `blur(${ci * 4}px)` : undefined,
      }}
    >
      <div
        style={{
          ...glass(it.claude),
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 20px 10px 14px",
          borderRadius: 999,
          fontFamily: UI,
          fontWeight: 600,
          fontSize: 26,
          color: K.cream,
          whiteSpace: "nowrap",
        }}
      >
        {it.claude ? <Spark size={26} /> : <IcBulb size={28} color={K.coralLight} />}
        {it.t}
      </div>
    </div>
  );
};

export const Brainstorm: React.FC = () => {
  const frame = useCurrentFrame();
  const pIn = EASE((frame - T.cIn) / 8);
  // impact shake on the stamp
  const k = frame - T.expert;
  const amp = k >= 0 && k < 9 ? 7 * (1 - k / 9) : 0;
  const shx = Math.sin(k * 2.3) * amp;
  const shy = Math.cos(k * 1.7) * amp * 0.6;
  // badge
  const bOn = frame >= T.expert;
  const slam = bOn ? interpolate(k, [0, 3, 6], [1.55, 0.95, 1], { extrapolateRight: "clamp" }) : 0;
  const bOp = bOn ? EASE(k / 2) : 0;
  const wave = bOn ? clamp01(k / 16) : 0;
  const bf = float(frame, "s3badge", 3, 4.4);
  const activated = frame >= T.editor + 8;
  const lightAt = [T.expert, T.motion, T.graphics, T.editor];
  const litW = (j: number) => EASE((frame - lightAt[j]) / 5);
  const sweep = clamp01((frame - (T.editor + 4)) / 14);
  // prompt
  const typingDone = frame >= T.editor + 10;
  const sendPulse = (at: number) => (frame >= at && frame < at + 6 ? 0.86 : 1);
  const press = Math.min(sendPulse(SEND), sendPulse(T.hkeya));
  const sendRing = (at: number) => clamp01((frame - at) / 14);
  const resend = frame >= T.hkeya ? clamp01((frame - T.hkeya) / 14) : 0;
  // D — loop / repeat
  const dIn = frame >= T.dima ? spring({ frame: frame - T.dima, fps: 30, config: { damping: 11, stiffness: 200, mass: 0.6 } }) : 0;
  const ghost = (j: number) => EASE((frame - (T.dima + 2 + j * 4)) / 7);
  const count = frame >= T.dima ? Math.min(9, 1 + Math.floor((frame - T.dima) / 5)) : 0;
  const countPop = frame >= T.dima ? 1 + 0.25 * Math.exp(-(((frame - T.dima) % 5) / 2)) : 1;
  // the 🔁 icon turns half a turn on every count (repeat, repeat…)
  const loopK = Math.max(0, frame - T.dima);
  const loopRot = (Math.floor(loopK / 5) + EASE((loopK % 5) / 3)) * 180;

  const promptCard = (key: string, extra: React.CSSProperties, content: boolean) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: PX,
        top: PY,
        width: PW,
        height: PH,
        boxSizing: "border-box",
        ...glass(frame >= T.expert),
        borderRadius: 30,
        ...extra,
      }}
    >
      {content ? (
        <>
          <div style={{ position: "absolute", left: 24, top: 22 }}>
            <Spark size={36} glow={6} rotate={frame < T.editor ? (frame - T.cIn) * 2 : 0} />
          </div>
          <div style={{ position: "absolute", left: 80, top: 16, width: 690, fontFamily: UI, fontWeight: 600, fontSize: 33, lineHeight: 1.36, color: K.cream }}>
            {frame < T.brain ? (
              <span style={{ color: K.dim }}>
                Écris à Claude…
                <Caret h={30} />
              </span>
            ) : (
              <>
                {WORDS.map(([w], i) => {
                  const n = shown(i, frame);
                  if (n <= 0) return null;
                  const hot = i >= ROLE_FROM + 2 && frame >= T.expert;
                  return (
                    <span key={i}>
                      {i > 0 ? " " : null}
                      <span style={{ color: hot ? K.coralLight : K.cream, fontWeight: hot ? 700 : 600 }}>{w.slice(0, n)}</span>
                    </span>
                  );
                })}
                {!typingDone || Math.floor(frame / 15) % 2 === 0 ? <Caret h={30} /> : null}
              </>
            )}
            {/* « نفس الحكاية » — the same story, re-sent: an underline sweep under the prompt */}
            {resend > 0 && resend < 1 ? (
              <div style={{ position: "absolute", left: 0, top: 92, height: 3, width: 690 * EASE(resend), borderRadius: 2, background: `linear-gradient(90deg, ${K.coral}, ${K.coralLight})`, boxShadow: `0 0 10px ${K.coral}`, opacity: 1 - EASE((resend - 0.7) / 0.3) }} />
            ) : null}
          </div>
          {/* send */}
          <div style={{ position: "absolute", right: 16, bottom: 16, width: 56, height: 56 }}>
            {[SEND, T.hkeya].map((at) => {
              const r = sendRing(at);
              return r > 0 && r < 1 ? <div key={at} style={{ position: "absolute", left: 28 - 42 * r, top: 28 - 42 * r, width: 84 * r, height: 84 * r, borderRadius: "50%", border: `3px solid ${K.coral}`, opacity: 1 - r }} /> : null;
            })}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                background: frame >= T.brain ? `linear-gradient(180deg, ${K.coralLight}, ${K.coral})` : "rgba(255,236,220,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${press})`,
                boxShadow: frame >= T.brain ? `0 0 22px ${K.coralGlow}` : undefined,
              }}
            >
              <IcSend size={30} color={frame >= T.brain ? "#1A0F0B" : K.muted} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translate(${shx}px, ${shy}px)` }}>
      {/* ghost copies behind the prompt = the same brief, again and again */}
      {[1, 0].map((j) => {
        const g = ghost(j);
        if (g <= 0) return null;
        return promptCard(`ghost${j}`, { transform: `translateY(${(j + 1) * 14 * g}px) scale(${1 - (j + 1) * 0.025})`, opacity: (0.55 - j * 0.22) * g, filter: "blur(0.5px)" }, false);
      })}
      {promptCard("main", { opacity: pIn, transform: `translateY(${(1 - pIn) * 14}px) scale(${0.96 + 0.04 * pIn})`, filter: pIn < 1 ? `blur(${(1 - pIn) * 6}px)` : undefined }, true)}

      {/* loop chip « à chaque vidéo » */}
      {frame >= T.dima ? (
        <div
          style={{
            position: "absolute",
            left: 572,
            top: PY + PH - 10,
            transform: `scale(${dIn}) translateY(${(1 - dIn) * 10}px)`,
            transformOrigin: "80% 0%",
            zIndex: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "8px 20px 8px 9px",
              borderRadius: 999,
              background: "rgba(30,22,18,0.94)",
              border: `1.5px solid rgba(217,119,87,0.7)`,
              boxShadow: `0 10px 26px rgba(0,0,0,0.5), 0 0 22px ${K.coralGlow}`,
              fontFamily: UI,
              fontWeight: 700,
              fontSize: 27,
              color: K.cream,
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ width: 50, height: 50, borderRadius: 25, background: "rgba(217,119,87,0.2)", border: "1.5px solid rgba(217,119,87,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IcLoop size={36} color={K.coralLight} style={{ transform: `rotate(${loopRot}deg)` }} />
            </div>
            à chaque vidéo
            <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 24, color: K.coral, display: "inline-block", transform: `scale(${countPop})`, minWidth: 40 }}>×{count}</span>
          </div>
        </div>
      ) : null}

      {/* brainstorm bubbles */}
      {IDEAS.map((_, i) => (
        <Bubble key={i} i={i} />
      ))}

      {/* shockwave + flash at the stamp */}
      {bOn && wave < 1 ? (
        <>
          <div style={{ position: "absolute", left: BC.x - 460 * wave, top: BC.y - 460 * wave, width: 920 * wave, height: 920 * wave, borderRadius: "50%", border: `4px solid ${K.coral}`, opacity: (1 - wave) * 0.8 }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1036, height: 420, background: `radial-gradient(50% 50% at 50% 70%, rgba(255,214,196,0.45), transparent)`, opacity: Math.max(0, 1 - k / 6) }} />
        </>
      ) : null}

      {/* the role badge */}
      {bOn ? (
        <div
          style={{
            position: "absolute",
            left: BADGE.x,
            top: BADGE.y,
            width: BADGE.w,
            height: BADGE.h,
            transform: `translate(${bf.x * 0.6}px, ${bf.y * 0.6}px) rotate(-2.5deg) scale(${slam})`,
            opacity: bOp,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              boxSizing: "border-box",
              borderRadius: 24,
              border: `3.5px solid ${K.coral}`,
              background: "linear-gradient(150deg, rgba(255,236,220,0.08), rgba(255,236,220,0.01) 60%), rgba(22,15,12,0.9)",
              boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 ${40 + 30 * Math.max(0, 1 - k / 10)}px ${K.coralGlow}, inset 0 1px 0 rgba(255,236,220,0.2)`,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              gap: 22,
              padding: "0 28px",
            }}
          >
            <div style={{ width: 72, height: 72, flexShrink: 0, borderRadius: 20, background: "rgba(217,119,87,0.16)", border: "1.5px solid rgba(217,119,87,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IcClapper size={46} color={K.coralLight} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: MONO, fontWeight: 700, fontSize: 16, letterSpacing: "0.2em", color: activated ? K.ok : K.coral }}>
                {activated ? (
                  <>
                    RÔLE ACTIVÉ <IcCheck size={20} draw={EASE((frame - T.editor - 8) / 5)} width={5} />
                  </>
                ) : (
                  "RÔLE · ACT AS"
                )}
              </div>
              <div style={{ whiteSpace: "nowrap", lineHeight: 1.05 }}>
                {[
                  ["Expert ", 0, false],
                  ["motion ", 1, true],
                  ["graphics", 2, true],
                  [" editor", 3, false],
                ].map(([w, j, serif]) => {
                  const v = litW(j as number);
                  return (
                    <span
                      key={j as number}
                      style={{
                        fontFamily: serif ? SERIF : UI,
                        fontWeight: serif ? 400 : 800,
                        fontSize: serif ? 50 : 42,
                        color: serif ? K.coral : K.cream,
                        opacity: 0.28 + 0.72 * v,
                        display: "inline-block",
                        whiteSpace: "pre",
                        transform: `translateY(${(1 - v) * 6}px)`,
                        textShadow: v > 0 && v < 1 ? `0 0 18px ${K.coralGlow}` : undefined,
                      }}
                    >
                      {w as string}
                    </span>
                  );
                })}
              </div>
            </div>
            {/* shimmer once the role is complete */}
            {sweep > 0 && sweep < 1 ? (
              <div style={{ position: "absolute", top: -30, bottom: -30, left: -180 + sweep * (BADGE.w + 360), width: 140, background: "linear-gradient(90deg, transparent, rgba(255,226,210,0.22), transparent)", transform: "skewX(-20deg)" }} />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
