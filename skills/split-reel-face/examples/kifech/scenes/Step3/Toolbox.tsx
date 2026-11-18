import type React from "react";
import { interpolate, spring, useCurrentFrame } from "remotion";
import { Caret, EASE, float, Spark, typed } from "../../edit/kit";
import { glass, K, MONO, UI } from "../../edit/theme";
import { IcCheck, IcCube, IcFilm, IcFont, IcPlay, IcSend, IcSpeaker, IcWave } from "./icons";
import { clamp01, T } from "./t";

/**
 * Beat A — « نقلّو بهي، هبّطلي الـ outils هاذم الكل » (39.08–43.04).
 * The user's prompt is typed in 3arbizi in Claude's input, sent on « هبّطلي » (download for me), then the 6 tools of
 * THIS project drop into an open toolbox one by one, each one installs (progress line) and gets its ✓;
 * « الكل » (all) = 6/6, the box glows.
 */
const TOOLS: { name: string; sub: string; Icon: React.FC<{ size?: number; color?: string }> }[] = [
  { name: "Remotion", sub: "v4.0.535", Icon: IcPlay },
  { name: "ffmpeg", sub: "v9.0.2", Icon: IcFilm },
  { name: "Whisper", sub: "large-v3", Icon: IcWave },
  { name: "Fonts", sub: "4 familles", Icon: IcFont },
  { name: "SFX pack", sub: "25 × .wav", Icon: IcSpeaker },
  { name: "three.js", sub: "r178", Icon: IcCube },
];
const PROMPT = "behi, habbetli les outils hedhom lkol";

const BOX = { x: 60, y: 1180, w: 880, h: 266 };
const PAD = 18;
const GX = 16;
const GY = 14;
const CW = (BOX.w - PAD * 2 - GX * 2) / 3;
const CH = (BOX.h - PAD * 2 - GY) / 2;
const slot = (i: number) => ({ x: BOX.x + PAD + (i % 3) * (CW + GX), y: BOX.y + PAD + Math.floor(i / 3) * (CH + GY) });
export const DROP = (i: number) => T.send + 5 + i * 4;
export const DONE = (i: number) => DROP(i) + 19;
const TYPE_AT = T.prompt + 1;
const CPS = 30;

const ToolCard: React.FC<{ i: number }> = ({ i }) => {
  const frame = useCurrentFrame();
  const d = DROP(i);
  if (frame < d) return null;
  const sp = spring({ frame: frame - d, fps: 30, config: { damping: 13, stiffness: 210, mass: 0.75 } });
  const op = EASE((frame - d) / 4);
  const blur = (1 - EASE((frame - d) / 6)) * 6;
  const pr = interpolate(frame, [d + 6, DONE(i)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const done = frame >= DONE(i);
  const ck = done ? spring({ frame: frame - DONE(i), fps: 30, config: { damping: 9, stiffness: 240, mass: 0.6 } }) : 0;
  const flash = done ? Math.exp(-(frame - DONE(i)) / 6) : 0;
  const s = slot(i);
  const fl = float(frame, `s3tool${i}`, 2.2, 3.4);
  const rot = (1 - sp) * (i % 2 ? 9 : -9);
  const { Icon, name, sub } = TOOLS[i];
  return (
    <div
      style={{
        position: "absolute",
        left: s.x,
        top: s.y,
        width: CW,
        height: CH,
        transform: `translate(${fl.x * 0.4}px, ${(1 - sp) * -160 + fl.y * 0.5}px) rotate(${rot}deg)`,
        opacity: op,
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
      }}
    >
      <div
        style={{
          ...glass(false),
          position: "relative",
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          borderRadius: 22,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 18px",
          overflow: "hidden",
          border: `1.5px solid ${done ? `rgba(217,119,87,${0.35 + 0.5 * flash})` : K.stroke}`,
          boxShadow: `0 18px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,236,220,0.2)${flash > 0.02 ? `, 0 0 ${34 * flash}px ${K.coralGlow}` : ""}`,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            flexShrink: 0,
            borderRadius: 18,
            background: "linear-gradient(160deg, rgba(217,119,87,0.26), rgba(217,119,87,0.08))",
            border: "1.5px solid rgba(217,119,87,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={38} color={K.coralLight} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 29, color: K.cream, lineHeight: 1.05, whiteSpace: "nowrap" }}>{name}</div>
          <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 18, color: done ? K.coralLight : K.muted, whiteSpace: "nowrap" }}>{sub}</div>
        </div>
        {/* install progress line */}
        <div style={{ position: "absolute", left: 18, right: 18, bottom: 11, height: 4, borderRadius: 2, background: "rgba(255,236,220,0.08)", overflow: "hidden", opacity: 1 - flash * 0 - (done ? EASE((frame - DONE(i) - 6) / 8) : 0) }}>
          <div style={{ width: `${pr * 100}%`, height: "100%", background: `linear-gradient(90deg, ${K.coralDeep}, ${K.coralLight})`, boxShadow: `0 0 10px ${K.coralGlow}` }} />
        </div>
      </div>
      {/* ✓ badge on the corner */}
      {done ? (
        <div
          style={{
            position: "absolute",
            right: -10,
            top: -12,
            width: 40,
            height: 40,
            borderRadius: 20,
            background: "#16231C",
            border: `2px solid ${K.ok}`,
            boxShadow: `0 0 ${16 + 20 * flash}px rgba(127,209,161,${0.35 + 0.4 * flash})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${ck})`,
          }}
        >
          <IcCheck size={30} draw={EASE((frame - DONE(i)) / 6)} width={4.4} />
        </div>
      ) : null}
    </div>
  );
};

export const Toolbox: React.FC = () => {
  const frame = useCurrentFrame();
  // prompt bar
  const pIn = EASE((frame - (T.start + 2)) / 8);
  const txt = typed(PROMPT, frame, TYPE_AT, CPS);
  const sent = frame >= T.send;
  const sendQ = EASE((frame - T.send) / 5);
  const statusP = EASE((frame - T.send - 3) / 7);
  const allDone = frame >= T.kol;
  const press = frame >= T.send && frame < T.send + 6 ? 0.86 : 1;
  const ring = clamp01((frame - T.send) / 14);
  // box
  const boxIn = EASE((frame - (T.start + 6)) / 9);
  let bump = 0;
  for (let i = 0; i < TOOLS.length; i++) {
    const k = frame - (DROP(i) + 5);
    if (k >= 0 && k < 7) bump += Math.sin((k / 7) * Math.PI) * 4;
  }
  const n = TOOLS.filter((_, i) => frame >= DONE(i)).length;
  const glow = allDone ? Math.exp(-(frame - T.kol) / 12) : 0;
  const lid = allDone ? 1 : 0.35 + 0.1 * n;
  const sweep = allDone ? clamp01((frame - T.kol) / 16) : -1;

  return (
    <>
      {/* ——— Claude input: prompt typed in 3arbizi, then Claude's status ——— */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 1046,
          width: 880,
          height: 80,
          boxSizing: "border-box",
          ...glass(sent),
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          padding: "0 14px 0 24px",
          gap: 16,
          opacity: pIn,
          transform: `translateY(${(1 - pIn) * 14}px) scale(${0.96 + 0.04 * pIn})`,
          filter: pIn < 1 ? `blur(${(1 - pIn) * 6}px)` : undefined,
          overflow: "hidden",
        }}
      >
        <Spark size={34} rotate={sent && !allDone ? (frame - T.send) * 7 : 0} glow={sent ? 8 : 0} />
        <div style={{ position: "relative", flex: 1, height: 80 }}>
          {/* typed prompt */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: 80,
              display: "flex",
              alignItems: "center",
              fontFamily: UI,
              fontWeight: 600,
              fontSize: 31,
              color: txt.length ? K.cream : K.dim,
              whiteSpace: "nowrap",
              opacity: 1 - sendQ,
              transform: `translateY(${-sendQ * 34}px)`,
            }}
          >
            {txt.length ? txt : "Écris à Claude…"}
            {!sent ? <Caret h={32} /> : null}
          </div>
          {/* Claude status after send */}
          {sent ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: 80,
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontFamily: UI,
                fontWeight: 600,
                fontSize: 29,
                color: allDone ? K.cream : K.muted,
                whiteSpace: "nowrap",
                opacity: statusP,
                transform: `translateY(${(1 - statusP) * 30}px)`,
              }}
            >
              {allDone ? (
                <>
                  <span>
                    Les <b style={{ color: K.coralLight }}>6 outils</b> sont installés
                  </span>
                  <IcCheck size={34} draw={EASE((frame - T.kol) / 7)} />
                </>
              ) : (
                <>
                  <span>Installation des outils</span>
                  <span style={{ fontFamily: MONO, fontSize: 24, color: K.coral }}>{"·".repeat(1 + (Math.floor((frame - T.send) / 5) % 3))}</span>
                </>
              )}
            </div>
          ) : null}
        </div>
        {/* send button */}
        <div style={{ position: "relative", width: 54, height: 54, flexShrink: 0 }}>
          {ring > 0 && ring < 1 ? (
            <div style={{ position: "absolute", left: 27 - 40 * ring, top: 27 - 40 * ring, width: 80 * ring, height: 80 * ring, borderRadius: "50%", border: `3px solid ${K.coral}`, opacity: 1 - ring }} />
          ) : null}
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              background: txt.length && !allDone ? `linear-gradient(180deg, ${K.coralLight}, ${K.coral})` : "rgba(255,236,220,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${press})`,
              boxShadow: txt.length && !sent ? `0 0 22px ${K.coralGlow}` : undefined,
            }}
          >
            {allDone ? <IcCheck size={34} color={K.ok} /> : <IcSend size={30} color={txt.length ? "#1A0F0B" : K.muted} />}
          </div>
        </div>
      </div>

      {/* ——— the toolbox ——— */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translateY(${bump}px)` }}>
        {/* handle */}
        <svg
          width={200}
          height={50}
          viewBox="0 0 200 50"
          style={{ position: "absolute", left: BOX.x + BOX.w / 2 - 100, top: BOX.y - 44, opacity: boxIn, transform: `translateY(${(1 - boxIn) * 14}px)` }}
        >
          <path d="M22 50 V26 Q22 8 40 8 H160 Q178 8 178 26 V50" fill="none" stroke="rgba(255,236,220,0.22)" strokeWidth={14} strokeLinecap="round" />
          <path d="M22 50 V26 Q22 8 40 8 H160 Q178 8 178 26 V50" fill="none" stroke={K.coral} strokeOpacity={lid} strokeWidth={3} strokeLinecap="round" />
        </svg>
        {/* labels on the lid */}
        <div style={{ position: "absolute", left: BOX.x + 6, top: BOX.y - 34, fontFamily: MONO, fontWeight: 500, fontSize: 19, color: K.muted, opacity: boxIn }}>~/reels/toolkit</div>
        <div
          style={{
            position: "absolute",
            left: BOX.x + BOX.w - 150,
            width: 144,
            textAlign: "right",
            top: BOX.y - 38,
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 24,
            color: allDone ? K.ok : K.coral,
            opacity: boxIn,
            transform: `scale(${1 + 0.18 * glow})`,
            transformOrigin: "100% 50%",
          }}
        >
          {n}/6 {allDone ? "✓" : ""}
        </div>
        {/* body */}
        <div
          style={{
            position: "absolute",
            left: BOX.x,
            top: BOX.y,
            width: BOX.w,
            height: BOX.h,
            boxSizing: "border-box",
            borderRadius: 30,
            background: "linear-gradient(180deg, rgba(255,236,220,0.07), rgba(255,236,220,0.02) 70%), rgba(28,20,16,0.7)",
            border: `1.5px solid ${K.stroke}`,
            borderTop: `3px solid rgba(217,119,87,${lid})`,
            boxShadow: `0 24px 60px rgba(0,0,0,0.55), inset 0 10px 30px rgba(0,0,0,0.45)${glow > 0.02 ? `, 0 0 ${70 * glow}px ${K.coralGlow}` : ""}`,
            opacity: boxIn,
            transform: `translateY(${(1 - boxIn) * 16}px) scale(${0.97 + 0.03 * boxIn})`,
            overflow: "hidden",
          }}
        >
          {sweep >= 0 && sweep < 1 ? (
            <div
              style={{
                position: "absolute",
                top: -40,
                bottom: -40,
                left: -200 + sweep * (BOX.w + 400),
                width: 160,
                background: "linear-gradient(90deg, transparent, rgba(255,220,200,0.16), transparent)",
                transform: "skewX(-18deg)",
              }}
            />
          ) : null}
        </div>
        {/* empty dashed slots, waiting */}
        {TOOLS.map((_, i) => {
          const s = slot(i);
          const a = EASE((frame - (T.start + 10 + i * 2)) / 7);
          const gone = EASE((frame - (DROP(i) + 4)) / 4);
          if (a <= 0 || gone >= 1) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: s.x,
                top: s.y,
                width: CW,
                height: CH,
                boxSizing: "border-box",
                borderRadius: 22,
                border: `2px dashed rgba(255,236,220,${0.16 + 0.06 * Math.sin(frame / 6 + i)})`,
                opacity: a * (1 - gone),
              }}
            />
          );
        })}
        {TOOLS.map((_, i) => (
          <ToolCard key={i} i={i} />
        ))}
      </div>
    </>
  );
};
