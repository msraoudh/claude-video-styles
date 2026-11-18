import { Video } from "@remotion/media";
import type React from "react";
import { interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import type { Cue } from "../edit/cue";
import { Caret, EASE, enter, float, Spark, Thumb, Window } from "../edit/kit";
import { K, MONO, SERIF, UI } from "../edit/theme";
import { f, wf } from "../edit/time";

/**
 * ÉTAPE 5/5 — « كي عجبني، نقلّو c'est bon، اعمللي rendering 60 fps … format 9:16 ولّا 16:9 … GPU … rapide »
 * SPLIT mode, stage y 1040–1450 (x 60–1020, text inside x ≤ 940). GLOBAL frames.
 * One object travels through the step: the approved edit → its render settings (60 fps roll) → its format
 * (a crop frame with the user's own trailer clip morphing 9:16 ⇄ 16:9, driven by a toggle) → the GPU render
 * (chip + speed gauge + frame counter that the Reveal's time-lapse ring continues).
 */

const T = {
  start: f(86.52),
  ajbni: wf("عجبني", 87.3),
  cestbon: wf("c'est", 87.69),
  a3melli: wf("اعمللي", 88.25),
  rendering: wf("rendering", 88.71),
  sixty: wf("60", 89.27),
  fps: wf("fps", 89.52),
  na3tih: wf("نعطيه", 90.52),
  format: wf("format", 90.81),
  r916: wf("9:16", 91.91),
  r169: wf("16:9", 92.86),
  ca: wf("ça", 93.4),
  depend: wf("dépend", 93.85),
  besoin: wf("besoin", 94.33),
  yesta3mel: wf("يستعمل", 95.69),
  gpu: wf("GPU", 96.28),
  rendering2: wf("rendering", 96.82),
  rapide: wf("rapide", 97.75),
  end: f(98.0),
};

/** stage box (split mode) */
const SX = 60;
const SY = 1040;
const SW = 960;
const SH = 410;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ramp = (frame: number, at: number, len: number) => EASE((frame - at) / len);
const sp = (frame: number, at: number, damping = 13, stiffness = 170) =>
  spring({ frame: frame - at, fps: 30, config: { damping, stiffness, mass: 0.7 } });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Exit style (fast): fade + blur + drift. */
const exitStyle = (q: number, dx = 0, dy = 0, ds = -0.04): React.CSSProperties =>
  q <= 0 ? {} : { opacity: 1 - q, transform: `translate(${dx * q}px, ${dy * q}px) scale(${1 + ds * q})`, filter: `blur(${q * 8}px)` };

/** Drawn check mark (no font glyph). */
const Check: React.FC<{ size: number; p: number; bg?: string; color?: string }> = ({ size, p, bg = K.ok, color = "#0F1A12" }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ flex: "none" }}>
    <circle cx={20} cy={20} r={19} fill={bg} />
    <path d="M11 20.5 L17.5 27 L29.5 14" fill="none" stroke={color} strokeWidth={4.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={30 * (1 - clamp01(p))} />
  </svg>
);

/* ───────────────────────── PHASE A — c'est bon → render settings 60 fps ───────────────────────── */

/** Odometer digit column (0..9,0): v in [0,10]. */
const Digit: React.FC<{ v: number; h: number; blur: number; style?: React.CSSProperties }> = ({ v, h, blur, style }) => (
  <div style={{ height: h, overflow: "hidden", display: "inline-block", ...style }}>
    <div style={{ transform: `translateY(${-v * h}px)`, filter: blur > 0.3 ? `blur(${Math.min(5, blur)}px)` : undefined }}>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
        <div key={i} style={{ height: h, lineHeight: `${h}px`, textAlign: "center" }}>
          {d}
        </div>
      ))}
    </div>
  </div>
);

const PhaseA: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.start - 1 || frame > T.na3tih + 10) return null;
  const q = ramp(frame, T.na3tih, 7);
  const push = 1 + 0.025 * clamp01((frame - T.start) / 120);

  // Claude asks (left, with the finished edit attached), the user answers (right), the chat scrolls up twice
  const qIn = ramp(frame, T.start + 2, 7);
  const scroll1 = ramp(frame, T.cestbon - 2, 8);
  const lift = ramp(frame, T.rendering - 2, 9);
  const heart = sp(frame, T.ajbni, 8, 260);
  const meIn = sp(frame, T.cestbon - 1, 11, 200);
  const chk = ramp(frame, T.cestbon + 2, 7);
  const line2 = "a3melli rendering 60 fps";
  const nChars = Math.round(
    interpolate(frame, [T.a3melli, T.rendering, T.sixty, T.fps + 3], [0, 8, 18, line2.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );
  const typing = frame >= T.a3melli && nChars < line2.length;
  const line2In = ramp(frame, T.a3melli - 1, 5);

  // render card
  const cardIn = ramp(frame, T.rendering, 8);
  const fl = float(frame, "s5card", 4, 5);
  const rows: [string, string][] = [
    ["composition", "Reel"],
    ["taille", "1080 × 1920"],
    ["codec", "H.264 · CRF 18"],
    ["durée", "1:55"],
  ];
  // fps odometer 30 → 60 (tens 3→6, ones spin a full turn)
  const roll = sp(frame, T.sixty - 3, 19, 130);
  const rollPrev = sp(frame - 1, T.sixty - 3, 19, 130);
  const tens = 3 + 3 * roll;
  const ones = 10 * roll;
  const speed = Math.abs(roll - rollPrev);
  const hot = ramp(frame, T.sixty, 6);
  const fpsIn = sp(frame, T.fps - 1, 10, 210);
  const glow = interpolate(frame, [T.fps, T.fps + 5, T.fps + 24], [0, 1, 0.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shine = interpolate(frame, [T.fps + 2, T.fps + 16], [-0.3, 1.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", left: SX, top: SY, width: SW, height: SH, ...exitStyle(q, -90, 0) }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "50% 60%" }}>
        {/* Claude's question, the finished edit attached */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: lerp(lerp(122, 8, scroll1), -40, lift),
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
            ...enter(qIn),
            opacity: qIn * (1 - lift),
            transform: `translateY(${(1 - qIn) * 14}px) scale(${0.96 + 0.04 * qIn})`,
            transformOrigin: "0% 0%",
          }}
        >
          <Spark size={44} rotate={frame * 1.5} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "14px 30px 14px 14px",
              borderRadius: 26,
              borderTopLeftRadius: 8,
              background: "rgba(255,236,220,0.06)",
              border: `1.5px solid ${K.stroke}`,
              boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ position: "relative" }}>
              <Thumb name="trailer-2" w={70} radius={12} style={{ boxShadow: "0 8px 18px rgba(0,0,0,0.5)" }} />
              {/* « كي عجبني » — a like lands on the edit */}
              {heart > 0.01 ? (
                <svg
                  width={44}
                  height={40}
                  viewBox="0 0 24 22"
                  style={{ position: "absolute", left: 36, top: 74, transform: `scale(${heart}) rotate(${(1 - heart) * -30}deg)`, filter: `drop-shadow(0 4px 10px ${K.coralGlow})` }}
                >
                  <path d="M12 21 C5 15.5 1 12 1 7.2 C1 3.8 3.6 1.5 6.6 1.5 C8.8 1.5 10.8 2.8 12 4.7 C13.2 2.8 15.2 1.5 17.4 1.5 C20.4 1.5 23 3.8 23 7.2 C23 12 19 15.5 12 21 Z" fill={K.coral} stroke="#FFE3D6" strokeWidth={1.2} />
                </svg>
              ) : null}
            </div>
            <div style={{ fontFamily: UI, color: K.cream }}>
              <div style={{ fontWeight: 700, fontSize: 34 }}>Montage prêt · 1:55</div>
              <div style={{ fontWeight: 500, fontSize: 29, color: K.muted, marginTop: 8 }}>On lance le rendu ?</div>
            </div>
          </div>
        </div>

        {/* the user's answer */}
        <div
          style={{
            position: "absolute",
            right: 80,
            top: lerp(178, 0, lift),
            transformOrigin: "100% 0%",
            transform: `scale(${0.6 + 0.4 * meIn})`,
            opacity: clamp01(meIn * 1.6),
            padding: "16px 26px 16px 20px",
            borderRadius: 26,
            borderTopRightRadius: 8,
            background: "rgba(217,119,87,0.18)",
            border: "1.5px solid rgba(217,119,87,0.5)",
            boxShadow: "0 14px 36px rgba(0,0,0,0.4)",
            fontFamily: UI,
            color: K.cream,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontWeight: 800, fontSize: 36 }}>
            <Check size={40} p={chk} />
            c&apos;est bon
          </div>
          {frame >= T.a3melli - 1 ? (
            <div style={{ fontWeight: 500, fontSize: 29, marginTop: 6, paddingLeft: 54, opacity: line2In, minWidth: 330, whiteSpace: "nowrap" }}>
              {line2.slice(0, nChars)}
              {typing ? <Caret h={28} /> : null}
            </div>
          ) : null}
        </div>

        {/* render settings card */}
        {frame >= T.rendering ? (
          <div style={{ position: "absolute", left: 0, top: 128, ...enter(cardIn, 0, 34), translate: `${fl.x}px ${fl.y * 0.6}px` }}>
            <Window
              w={880}
              h={278}
              accent={glow > 0.5}
              title={
                <>
                  <span style={{ width: 12, height: 12, borderRadius: 6, background: K.coral, boxShadow: `0 0 10px ${K.coral}`, opacity: 0.6 + 0.4 * Math.sin(frame / 4) }} />
                  <span style={{ fontFamily: MONO, fontSize: 20, color: K.cream }}>render · Reel.mp4</span>
                </>
              }
            >
              <div style={{ display: "flex", height: 176, gap: 26 }}>
                <div style={{ flex: 1, fontFamily: MONO, fontSize: 24, lineHeight: "41px", paddingTop: 2 }}>
                  {rows.map(([k, v], i) => {
                    const p = ramp(frame, T.rendering + 4 + i * 3, 6);
                    return (
                      <div key={k} style={{ display: "flex", opacity: p, transform: `translateX(${(1 - p) * -14}px)` }}>
                        <span style={{ width: 178, color: K.dim }}>{k}</span>
                        <span style={{ color: K.cream }}>{v}</span>
                      </div>
                    );
                  })}
                </div>
                {/* frame rate box */}
                <div
                  style={{
                    width: 290,
                    borderLeft: `1.5px solid ${K.stroke}`,
                    paddingLeft: 26,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 18, letterSpacing: "0.18em", color: K.coral }}>FRAME RATE</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginTop: 2 }}>
                    <div
                      style={{
                        display: "flex",
                        fontFamily: SERIF,
                        fontSize: 132,
                        color: hot > 0 ? K.coral : K.muted,
                        opacity: 0.55 + 0.45 * hot,
                        textShadow: glow > 0 ? `0 0 ${30 * glow}px ${K.coralGlow}` : undefined,
                        transform: `scale(${1 + 0.08 * Math.sin(Math.PI * clamp01((frame - T.sixty) / 10))})`,
                        transformOrigin: "0% 80%",
                      }}
                    >
                      <Digit v={tens} h={128} blur={speed * 40} />
                      <Digit v={ones} h={128} blur={speed * 70} />
                    </div>
                    <div
                      style={{
                        fontFamily: UI,
                        fontWeight: 800,
                        fontSize: 40,
                        color: K.cream,
                        marginBottom: 24,
                        opacity: clamp01(fpsIn * 1.5),
                        transform: `scale(${0.5 + 0.5 * fpsIn}) translateY(${(1 - fpsIn) * 10}px)`,
                        transformOrigin: "0% 100%",
                      }}
                    >
                      fps
                    </div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 18, color: K.dim, marginTop: -4 }}>{hot > 0.5 ? "source 30 → rendu 60" : "source 30 fps"}</div>
                </div>
              </div>
              {/* light sweep on the card when « fps » lands */}
              {shine > -0.3 && shine < 1.3 ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: `linear-gradient(105deg, transparent ${shine * 100 - 12}%, rgba(255,236,220,0.13) ${shine * 100}%, transparent ${shine * 100 + 12}%)`,
                  }}
                />
              ) : null}
            </Window>
          </div>
        ) : null}
      </div>
    </div>
  );
};

/* ───────────────────────── PHASE B — format 9:16 ⇄ 16:9 ───────────────────────── */

const FRAME_CX = 316;
const FRAME_CY = 218;
const D916 = { w: 191, h: 340 };
const D169 = { w: 560, h: 315 };
const D11 = { w: 262, h: 262 };
const D45 = { w: 236, h: 295 };

/** 0 = 9:16, 1 = 16:9 (spring sum, driven by the words then the toggle) */
const ratioAt = (frame: number) => sp(frame, T.r169 - 1, 14, 150) - sp(frame, T.depend, 14, 170) + sp(frame, T.besoin, 14, 170);

/** Two labels cross-sliding with the 9:16 ⇄ 16:9 state rr (0..1). */
const Cross: React.FC<{ a: string; b: string; rr: number; style: React.CSSProperties; dy?: number }> = ({ a, b, rr, style, dy = 30 }) => {
  const blur = rr > 0.02 && rr < 0.98 ? `blur(${Math.sin(rr * Math.PI) * 4}px)` : undefined;
  return (
    <div style={{ position: "relative", ...style }}>
      <div style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap", opacity: 1 - rr, transform: `translateY(${-rr * dy}px)`, filter: blur }}>{a}</div>
      <div style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap", opacity: rr, transform: `translateY(${(1 - rr) * dy}px)`, filter: blur }}>{b}</div>
    </div>
  );
};

const PhaseB: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.na3tih + 2 || frame > T.yesta3mel + 10) return null;
  const q = ramp(frame, T.yesta3mel, 7);
  const inP = ramp(frame, T.format - 3, 8);
  // the format « picker »: 1:1 → 4:5 (dim, while « الـ format » is said) → 9:16 → 16:9 ⇄ (toggle)
  const pre45 = sp(frame, T.format + 13, 13, 200);
  const s916 = sp(frame, T.r916 - 1, 13, 190);
  const r = ratioAt(frame);
  const rr0 = clamp01(r);
  const rr = rr0 > 0.985 ? 1 : rr0 < 0.015 ? 0 : rr0;
  const w = lerp(lerp(D11.w, D45.w, pre45), lerp(D916.w, D169.w, r), s916);
  const h = lerp(lerp(D11.h, D45.h, pre45), lerp(D916.h, D169.h, r), s916);
  const left = FRAME_CX - w / 2;
  const top = FRAME_CY - h / 2;
  const push = 1 + 0.03 * clamp01((frame - T.format) / 150);
  const fl = float(frame, "s5frame", 3, 4);

  // clip inside: native 360×640, scaled to cover the frame, focus a bit above centre (faces)
  const scale = Math.max(w / 360, h / 640);
  const vx = (w - 360 * scale) / 2;
  const vy = (h - 640 * scale) * 0.45;
  const iris = ramp(frame, T.r916 - 1, 8);
  const flash = interpolate(frame, [T.r916, T.r916 + 7], [0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const morphFlash = Math.max(
    0,
    ...[T.r169, T.depend, T.besoin].map((t) => interpolate(frame, [t, t + 3, t + 9], [0, 0.22, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })),
  );
  const dimIn = ramp(frame, T.format + 2, 7);
  const sD = s916 > 0.985 ? 1 : s916;
  const pD = pre45 > 0.985 ? 1 : pre45;
  const W = Math.round(lerp(1080, lerp(1080, 1920, rr), sD));
  const H = Math.round(lerp(lerp(1080, 1350, pD), lerp(1920, 1080, rr), sD));
  const preA = ramp(frame, T.format, 6) * (1 - ramp(frame, T.format + 12, 5));
  const preB = ramp(frame, T.format + 13, 6) * (1 - ramp(frame, T.r916 - 2, 4));
  const dash = (frame * 1.2) % 24;

  // right column
  const kick = ramp(frame, T.format - 1, 7);
  const lab = ramp(frame, T.r916, 7);
  const tog = sp(frame, T.ca - 1, 12, 200);
  const need = ramp(frame, T.besoin + 2, 8);

  return (
    <div style={{ position: "absolute", left: SX, top: SY, width: SW, height: SH, ...exitStyle(q, -40, -10, -0.08) }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "35% 50%" }}>
        {/* soft coral plate behind the frame */}
        <div style={{ position: "absolute", left: FRAME_CX - 260, top: FRAME_CY - 170, width: 520, height: 340, borderRadius: "50%", background: K.coralGlow, filter: "blur(70px)", opacity: 0.35 * s916 }} />

        <div style={{ position: "absolute", inset: 0, ...enter(inP), translate: `${fl.x}px ${fl.y}px` }}>
          {/* crop-tool corner brackets */}
          {[0, 1, 2, 3].map((i) => {
            const sx = i % 2 ? 1 : -1;
            const sy = i < 2 ? -1 : 1;
            const off = 14 + 3 * Math.sin(frame / 6);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: FRAME_CX + sx * (w / 2 + off) - (sx > 0 ? 30 : 0),
                  top: FRAME_CY + sy * (h / 2 + off) - (sy > 0 ? 30 : 0),
                  width: 30,
                  height: 30,
                  borderTop: sy < 0 ? `4px solid ${K.coral}` : undefined,
                  borderBottom: sy > 0 ? `4px solid ${K.coral}` : undefined,
                  borderLeft: sx < 0 ? `4px solid ${K.coral}` : undefined,
                  borderRight: sx > 0 ? `4px solid ${K.coral}` : undefined,
                  borderRadius: 4,
                  filter: `drop-shadow(0 0 6px ${K.coralGlow})`,
                }}
              />
            );
          })}

          {/* the frame */}
          <div
            style={{
              position: "absolute",
              left,
              top,
              width: w,
              height: h,
              borderRadius: 16,
              overflow: "hidden",
              background: "rgba(15,11,9,0.7)",
              boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 ${30 * s916}px ${K.coralGlow}`,
            }}
          >
            {/* placeholder: dashed outline + thirds grid */}
            <svg width={w} height={h} style={{ position: "absolute", inset: 0, opacity: 1 - iris }}>
              <rect x={2} y={2} width={w - 4} height={h - 4} rx={14} fill="none" stroke={K.coral} strokeOpacity={0.7} strokeWidth={2.5} strokeDasharray="12 12" strokeDashoffset={-dash} />
              {[1, 2].map((k) => (
                <g key={k} stroke="rgba(255,236,220,0.18)" strokeWidth={1.5}>
                  <line x1={(w * k) / 3} y1={10} x2={(w * k) / 3} y2={h - 10} />
                  <line x1={10} y1={(h * k) / 3} x2={w - 10} y2={(h * k) / 3} />
                </g>
              ))}
            </svg>
            {/* the user's own clip — always mounted inside PhaseB so it premounts; hidden by the iris until « 9:16 » */}
            <div style={{ position: "absolute", inset: 0, clipPath: `circle(${iris * 80}% at 50% 50%)`, visibility: iris > 0 ? "visible" : "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, width: 360, height: 640, transformOrigin: "0 0", transform: `translate(${vx}px, ${vy}px) scale(${scale})` }}>
                <Sequence from={T.r916 - 6} durationInFrames={T.yesta3mel + 12 - (T.r916 - 6)} premountFor={30}>
                  <Video src={staticFile("thumbs/clip-trailer.mp4")} muted loop style={{ width: 360, height: 640 }} />
                </Sequence>
              </div>
              <div style={{ position: "absolute", inset: 0, background: "#FFF3EA", opacity: Math.max(flash, morphFlash) }} />
              <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 2px rgba(240,164,135,0.85)", borderRadius: 16 }} />
            </div>
          </div>

          {/* dimension lines (real pixel sizes, counting through the morph) */}
          <div style={{ opacity: dimIn }}>
            <div style={{ position: "absolute", left, top: top - 30, width: w, height: 2, background: "rgba(255,236,220,0.35)" }} />
            <div style={{ position: "absolute", left, top: top - 37, width: 2, height: 16, background: "rgba(255,236,220,0.5)" }} />
            <div style={{ position: "absolute", left: left + w - 2, top: top - 37, width: 2, height: 16, background: "rgba(255,236,220,0.5)" }} />
            <div style={{ position: "absolute", left: FRAME_CX - 50, top: top - 46, width: 100, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 21, color: K.cream }}>
              <span style={{ background: K.bg1, padding: "0 8px" }}>{W}</span>
            </div>
            <div style={{ position: "absolute", left: left - 30, top, width: 2, height: h, background: "rgba(255,236,220,0.35)" }} />
            <div style={{ position: "absolute", left: left - 37, top, width: 16, height: 2, background: "rgba(255,236,220,0.5)" }} />
            <div style={{ position: "absolute", left: left - 37, top: top + h - 2, width: 16, height: 2, background: "rgba(255,236,220,0.5)" }} />
            <div style={{ position: "absolute", left: left - 81, top: FRAME_CY - 13, width: 100, textAlign: "center", transform: "rotate(-90deg)", fontFamily: MONO, fontWeight: 700, fontSize: 21, color: K.cream }}>
              <span style={{ background: K.bg1, padding: "0 8px" }}>{H}</span>
            </div>
          </div>
        </div>

        {/* right column: FORMAT / ratio / pixels / where / toggle */}
        <div style={{ position: "absolute", left: 664, top: 0, width: 230, height: SH }}>
          <div style={{ position: "absolute", top: 14, fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: "0.22em", color: K.coral, ...enter(kick) }}>FORMAT</div>
          {/* picker: the candidates roll by (dim) before « 9:16 » */}
          {[
            ["1:1", "1080 × 1080", preA, T.format, T.format + 12],
            ["4:5", "1080 × 1350", preB, T.format + 13, T.r916 - 2],
          ].map(([ratio, px, v, a, b]) => {
            const p = v as number;
            if (p <= 0.001) return null;
            const goingOut = (frame as number) >= (b as number);
            const dy = goingOut ? -(1 - p) * 40 : (1 - p) * 40;
            void a;
            return (
              <div key={ratio as string} style={{ position: "absolute", left: 0, top: 0, opacity: p, transform: `translateY(${dy}px)`, filter: p < 1 ? `blur(${(1 - p) * 5}px)` : undefined }}>
                <div style={{ position: "absolute", top: 46, fontFamily: SERIF, fontSize: 120, lineHeight: 1, color: K.muted, opacity: 0.55, whiteSpace: "nowrap" }}>{ratio as string}</div>
                <div style={{ position: "absolute", top: 172, fontFamily: MONO, fontWeight: 700, fontSize: 24, color: K.dim, whiteSpace: "nowrap" }}>{px as string}</div>
              </div>
            );
          })}
          <div style={{ position: "absolute", top: 46, left: 0, ...enter(lab) }}>
            <Cross a="9:16" b="16:9" rr={rr} dy={44} style={{ fontFamily: SERIF, fontSize: 120, lineHeight: 1, color: K.coral, height: 120, textShadow: `0 0 26px ${K.coralGlow}` }} />
          </div>
          <div style={{ position: "absolute", top: 172, left: 0, ...enter(ramp(frame, T.r916 + 3, 7)) }}>
            <Cross a="1080 × 1920" b="1920 × 1080" rr={rr} style={{ fontFamily: MONO, fontWeight: 700, fontSize: 24, color: K.cream, height: 30 }} />
          </div>
          <div style={{ position: "absolute", top: 208, left: 0, ...enter(ramp(frame, T.r916 + 6, 7)) }}>
            <Cross a="Reels · TikTok" b="YouTube" rr={rr} dy={20} style={{ fontFamily: UI, fontWeight: 600, fontSize: 23, color: K.muted, height: 30 }} />
          </div>
          {/* the toggle (« ça dépend ») */}
          <div
            style={{
              position: "absolute",
              top: 266,
              left: 0,
              width: 224,
              height: 64,
              borderRadius: 32,
              background: "rgba(255,236,220,0.07)",
              border: `1.5px solid ${K.strokeHi}`,
              boxShadow: "0 10px 26px rgba(0,0,0,0.45)",
              opacity: clamp01(tog * 1.5),
              transform: `scale(${0.6 + 0.4 * tog})`,
              transformOrigin: "0% 50%",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 5,
                left: 5 + rr * 107,
                width: 107,
                height: 51,
                borderRadius: 26,
                background: `linear-gradient(180deg, ${K.coralLight}, ${K.coral})`,
                boxShadow: `0 6px 18px ${K.coralGlow}`,
              }}
            />
            {["9:16", "16:9"].map((t, i) => {
              const on = i === 0 ? 1 - rr : rr;
              return (
                <div
                  key={t}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 5 + i * 107,
                    width: 107,
                    height: 61,
                    lineHeight: "61px",
                    textAlign: "center",
                    fontFamily: UI,
                    fontWeight: 800,
                    fontSize: 25,
                    color: on > 0.5 ? "#1A0F0B" : K.muted,
                  }}
                >
                  {t}
                </div>
              );
            })}
          </div>
          <div style={{ position: "absolute", top: 346, left: 4, fontFamily: SERIF, fontSize: 34, color: K.cream, whiteSpace: "nowrap", ...enter(need) }}>
            selon le <span style={{ color: K.coral }}>besoin</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────── PHASE C — GPU chip + speed gauge ───────────────────────── */

const G = { cx: 662, cy: 214, r: 160 };
const A0 = 150; // gauge sweep 150° → 390° (open at the bottom)
const SWEEP = 240;
const pt = (a: number, r: number) => {
  const rad = (a * Math.PI) / 180;
  return { x: G.cx + r * Math.cos(rad), y: G.cy + r * Math.sin(rad) };
};
const arcPath = (a1: number, a2: number, r: number) => {
  const p1 = pt(a1, r);
  const p2 = pt(a2, r);
  const large = a2 - a1 > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`;
};

const GpuChip: React.FC<{ frame: number }> = ({ frame }) => {
  const inP = sp(frame, T.gpu - 2, 12, 160);
  const power = interpolate(frame, [T.gpu + 2, T.gpu + 6, T.gpu + 20], [0, 1, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const breathe = power > 0 ? 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(frame / 3.2)) : 0;
  const boost = ramp(frame, T.rapide, 5);
  const heat = Math.max(power, breathe * 0.8) + boost * 0.5;
  const fl = float(frame, "s5chip", 4, 3.5);
  const ry = lerp(-70, -18, inP) + Math.sin(frame / 14) * 4;
  const rx = lerp(40, 14, inP);
  const pins = Array.from({ length: 8 }, (_, i) => i);
  const PIN = "linear-gradient(180deg, #F2CFB8, #A86E55)";
  return (
    <div style={{ position: "absolute", left: 70 + fl.x, top: 70 + fl.y, width: 270, height: 270, perspective: 900, opacity: clamp01(inP * 1.4) }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          transform: `rotateX(${rx}deg) rotateY(${ry}deg) scale(${0.55 + 0.45 * inP})`,
        }}
      >
        {/* heat halo */}
        <div style={{ position: "absolute", inset: -40, borderRadius: 60, background: K.coralGlow, filter: "blur(40px)", opacity: 0.25 + 0.6 * heat }} />
        {/* pins */}
        {pins.map((i) => (
          <div key={`t${i}`} style={{ position: "absolute", left: 46 + i * 24, top: 4, width: 11, height: 26, borderRadius: 3, background: PIN }} />
        ))}
        {pins.map((i) => (
          <div key={`b${i}`} style={{ position: "absolute", left: 46 + i * 24, bottom: 4, width: 11, height: 26, borderRadius: 3, background: PIN }} />
        ))}
        {pins.map((i) => (
          <div key={`l${i}`} style={{ position: "absolute", top: 46 + i * 24, left: 4, height: 11, width: 26, borderRadius: 3, background: PIN }} />
        ))}
        {pins.map((i) => (
          <div key={`r${i}`} style={{ position: "absolute", top: 46 + i * 24, right: 4, height: 11, width: 26, borderRadius: 3, background: PIN }} />
        ))}
        {/* package (with a fake thickness) */}
        <div
          style={{
            position: "absolute",
            left: 24,
            top: 24,
            width: 222,
            height: 222,
            borderRadius: 24,
            background: "linear-gradient(145deg, #3A2A22, #1A120E 70%)",
            border: `1.5px solid ${K.strokeHi}`,
            boxShadow: "6px 9px 0 #120C09, 10px 16px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,236,220,0.25)",
          }}
        >
          <div style={{ position: "absolute", left: 14, top: 14, width: 10, height: 10, borderRadius: 5, background: K.cream, opacity: 0.7 }} />
          {/* die */}
          <div
            style={{
              position: "absolute",
              left: 36,
              top: 36,
              width: 150,
              height: 150,
              borderRadius: 16,
              background: `repeating-linear-gradient(0deg, rgba(255,236,220,0.05) 0 1px, transparent 1px 10px), repeating-linear-gradient(90deg, rgba(255,236,220,0.05) 0 1px, transparent 1px 10px), linear-gradient(135deg, rgba(217,119,87,${0.25 + 0.35 * heat}), rgba(217,119,87,0.06))`,
              border: `2px solid ${K.coral}`,
              boxShadow: `0 0 ${16 + 40 * heat}px rgba(217,119,87,${0.3 + 0.5 * heat}), inset 0 0 ${20 * heat}px rgba(240,164,135,0.5)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontFamily: UI, fontWeight: 900, fontSize: 56, color: K.cream, letterSpacing: "0.04em", lineHeight: 1, textShadow: `0 0 ${18 * heat}px ${K.coralLight}` }}>GPU</div>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 17, color: K.coralLight, marginTop: 10 }}>--gl=angle</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Gauge: React.FC<{ frame: number }> = ({ frame }) => {
  const inP = ramp(frame, T.gpu + 1, 8);
  // needle: idle → half on « GPU » → a bit more on « rendering » → MAX on « rapide » (overshoot + shiver)
  const v =
    0.06 +
    0.42 * sp(frame, T.gpu + 3, 9, 120) +
    0.14 * sp(frame, T.rendering2, 12, 140) +
    0.38 * sp(frame, T.rapide - 1, 7, 170) +
    (frame > T.rapide ? Math.sin(frame * 2.4) * 0.012 * Math.max(0, 1 - (frame - T.rapide) / 14) : 0);
  const vv = Math.min(1.03, v);
  const ang = A0 + SWEEP * vv;
  const maxP = sp(frame, T.rapide, 10, 220);
  const mult = Math.max(1, Math.min(8, Math.round(1 + 7 * Math.min(1, vv))));
  const ticks = Array.from({ length: 25 }, (_, i) => i);
  const tip = pt(ang, G.r - 32);
  const back = pt(ang + 180, 26);
  const side1 = pt(ang + 90, 9);
  const side2 = pt(ang - 90, 9);
  const e0 = pt(A0, G.r + 4);
  const e1 = pt(A0 + SWEEP, G.r + 4);
  return (
    <div style={{ position: "absolute", inset: 0, ...enter(inP) }}>
      <svg width={SW} height={SH} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="s5arc" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor={K.coralDeep} />
            <stop offset="1" stopColor={K.coralLight} />
          </linearGradient>
        </defs>
        {/* track + fill */}
        <path d={arcPath(A0, A0 + SWEEP, G.r)} stroke="rgba(255,236,220,0.1)" strokeWidth={20} fill="none" strokeLinecap="round" />
        <path d={arcPath(A0, Math.max(A0 + 0.5, ang), G.r)} stroke="url(#s5arc)" strokeWidth={20} fill="none" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 ${10 + 14 * maxP}px ${K.coralGlow})` }} />
        {/* ticks */}
        {ticks.map((i) => {
          const a = A0 + (SWEEP * i) / 24;
          const major = i % 6 === 0;
          const p1 = pt(a, G.r - 22);
          const p2 = pt(a, G.r - (major ? 46 : 34));
          const lit = A0 + SWEEP * vv >= a;
          return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={lit ? K.coralLight : "rgba(255,236,220,0.28)"} strokeWidth={major ? 4 : 2} strokeLinecap="round" />;
        })}
        {/* needle */}
        <polygon points={`${tip.x},${tip.y} ${side1.x},${side1.y} ${back.x},${back.y} ${side2.x},${side2.y}`} fill={K.cream} style={{ filter: `drop-shadow(0 0 8px ${K.coralGlow})` }} />
        <circle cx={G.cx} cy={G.cy} r={17} fill={K.bg2} stroke={K.coral} strokeWidth={4} />
        <circle cx={G.cx} cy={G.cy} r={5} fill={K.coralLight} />
      </svg>
      {/* end labels */}
      <div style={{ position: "absolute", left: e0.x - 34, top: e0.y + 12, fontFamily: MONO, fontWeight: 700, fontSize: 20, color: K.dim }}>CPU</div>
      <div
        style={{
          position: "absolute",
          left: e1.x - 40,
          top: e1.y + 8,
          padding: "3px 12px",
          borderRadius: 10,
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 20,
          color: maxP > 0.3 ? "#1A0F0B" : K.dim,
          background: maxP > 0.3 ? K.coral : "transparent",
          boxShadow: maxP > 0.3 ? `0 0 20px ${K.coralGlow}` : undefined,
          transform: `scale(${1 + 0.25 * Math.sin(Math.PI * clamp01(maxP))})`,
        }}
      >
        MAX
      </div>
      {/* readout */}
      <div style={{ position: "absolute", left: G.cx - 110, top: G.cy + 30, width: 220, textAlign: "center" }}>
        <div style={{ fontFamily: UI, fontWeight: 900, fontSize: 58, lineHeight: 1, color: maxP > 0.3 ? K.coral : K.cream, textShadow: maxP > 0.3 ? `0 0 24px ${K.coralGlow}` : undefined }}>
          ×{mult}
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 30, color: K.muted, marginTop: 2, opacity: ramp(frame, T.rapide, 6) }}>rapide</div>
      </div>
    </div>
  );
};

const PhaseC: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.yesta3mel - 1 || frame > T.end + 10) return null;
  const inP = ramp(frame, T.yesta3mel + 1, 8);
  const q = ramp(frame, T.end - 3, 9);
  const push = 1 + 0.035 * clamp01((frame - T.yesta3mel) / 70);

  // circuit traces chip → gauge: draw on « يستعمل », pulses run once the GPU is on
  const draw = ramp(frame, T.yesta3mel + 2, 12);
  const pulsesOn = frame >= T.gpu + 2;
  const traces = [
    "M 330 150 L 400 150 L 430 120 L 500 120",
    "M 330 205 L 470 205",
    "M 330 260 L 400 260 L 430 290 L 500 290",
  ];
  // render counter (frames at 60 fps of the 1:55 reel; the Reveal's time-lapse finishes it)
  const done = Math.round(interpolate(frame, [T.rendering2, T.end + 6], [0, 905], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => t * t }));
  const barIn = ramp(frame, T.rendering2 - 1, 7);

  return (
    <div style={{ position: "absolute", left: SX, top: SY, width: SW, height: SH, ...exitStyle(q, 0, -20, 0.1) }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "45% 50%" }}>
        {/* socket glow + traces */}
        <svg width={SW} height={SH} style={{ position: "absolute", inset: 0, opacity: inP }}>
          <rect x={60} y={60} width={290} height={290} rx={34} fill="rgba(255,236,220,0.03)" stroke="rgba(255,236,220,0.14)" strokeWidth={1.5} strokeDasharray="6 8" />
          {traces.map((d, i) => (
            <g key={i}>
              <path d={d} stroke="rgba(217,119,87,0.35)" strokeWidth={4} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
              {pulsesOn ? (
                <path d={d} stroke={K.coralLight} strokeWidth={5} fill="none" strokeLinecap="round" pathLength={100} strokeDasharray="14 86" strokeDashoffset={-((frame - T.gpu) * (5 + (frame > T.rapide ? 6 : 0)) + i * 30)} style={{ filter: `drop-shadow(0 0 6px ${K.coral})` }} />
              ) : null}
              <circle cx={Number(d.split(" ").slice(-2)[0])} cy={Number(d.split(" ").slice(-1)[0])} r={6} fill={K.coral} opacity={draw} />
            </g>
          ))}
        </svg>
        <GpuChip frame={frame} />
        <Gauge frame={frame} />
        {/* render progress strip */}
        <div style={{ position: "absolute", left: 0, top: 350, width: 880, ...enter(barIn) }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontWeight: 700, fontSize: 23, color: K.muted }}>
            <span>
              <span style={{ color: K.coral }}>● </span>rendering · GPU
            </span>
            <span style={{ color: K.cream }}>
              frame {String(done).padStart(4, "0")} / 6902
            </span>
          </div>
          <div style={{ marginTop: 8, height: 10, borderRadius: 5, background: "rgba(255,236,220,0.1)", overflow: "hidden" }}>
            <div
              style={{
                width: `${(done / 6902) * 100}%`,
                height: "100%",
                borderRadius: 5,
                background: `repeating-linear-gradient(115deg, ${K.coral} 0 14px, ${K.coralLight} 14px 28px)`,
                backgroundPosition: `${frame * 4}px 0`,
                boxShadow: `0 0 12px ${K.coralGlow}`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const Step5: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.start - 2 || frame > T.end + 12) return null;
  return (
    <>
      <PhaseA />
      <PhaseB />
      <PhaseC />
    </>
  );
};

export const step5Cues: Cue[] = [
  { f: T.cestbon, sfx: "pop", vol: 0.38, note: "c'est bon bubble" },
  { f: T.cestbon + 3, sfx: "tick", vol: 0.28, note: "green check" },
  { f: T.a3melli, sfx: "keypad", vol: 0.16, trimFrames: 22, note: "typing a3melli rendering" },
  { f: T.rendering, sfx: "shutter-modern", vol: 0.3, note: "render card" },
  { f: T.sixty - 2, sfx: "tick", vol: 0.2, note: "fps roll 1" },
  { f: T.sixty + 1, sfx: "tick", vol: 0.22, note: "fps roll 2" },
  { f: T.sixty + 4, sfx: "tick", vol: 0.24, note: "fps roll 3" },
  { f: T.fps, sfx: "pop", vol: 0.32, note: "fps lands" },
  { f: T.na3tih, sfx: "whip", vol: 0.28, note: "settings → format" },
  { f: T.r916, sfx: "pop", vol: 0.36, note: "9:16 frame + clip" },
  { f: T.r169 - 1, sfx: "swipe", vol: 0.36, note: "morph to 16:9" },
  { f: T.ca, sfx: "tap", vol: 0.32, note: "toggle appears" },
  { f: T.depend, sfx: "switch", vol: 0.3, note: "toggle → 9:16" },
  { f: T.besoin, sfx: "switch", vol: 0.3, note: "toggle → 16:9" },
  { f: T.yesta3mel, sfx: "whoosh", vol: 0.28, note: "format → GPU" },
  { f: T.gpu, sfx: "flash", vol: 0.45, note: "GPU chip powers on" },
  { f: T.rendering2 - 4, sfx: "riser", vol: 0.22, trimFrames: 32, note: "render revs up" },
  { f: T.rapide, sfx: "whip", vol: 0.34, note: "needle hits MAX" },
];
