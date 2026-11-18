import type React from "react";
import { interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Cursor, EASE, Ring, Spark, Stamp, Wave } from "../../edit/kit";
import { AR, glass, K, L, MONO, SERIF, UI } from "../../edit/theme";
import { pulse } from "./beat";

export { beatFrame, pulse } from "./beat";

/**
 * Face-mode pieces of the Hook (the face fills the frame: everything lives on the sides of the head x < 230 / x > 850,
 * or on the chest under the caption pill y ≥ 1305). All frames GLOBAL.
 */
export const io = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const ramp = (frame: number, at: number, len: number) => EASE((frame - at) / len);

/** house entrance + fast exit wrapper (absolute). */
const Block: React.FC<{ at: number; out: number; x: number; y: number; w?: number; rotate?: number; seed: string; children: React.ReactNode; len?: number; style?: React.CSSProperties; floatAmp?: number; beat?: number }> = ({
  at,
  out,
  x,
  y,
  w,
  rotate = 0,
  seed,
  children,
  len = 7,
  style,
  floatAmp = 5,
  beat = 0,
}) => {
  const frame = useCurrentFrame();
  const p = ramp(frame, at, len);
  const q = ramp(frame, out, 6);
  const v = p * (1 - q);
  if (frame < at || v <= 0.001) return null;
  const ph = random(seed) * Math.PI * 2;
  const fx = Math.sin(frame / 30 / 4.2 * Math.PI * 2 + ph) * floatAmp;
  const fy = Math.cos(frame / 30 / 3.6 * Math.PI * 2 + ph) * floatAmp;
  return (
    <div
      style={{
        position: "absolute",
        left: x + fx,
        top: y + fy,
        width: w,
        opacity: v,
        transform: `translateY(${(1 - p) * 14 - q * 10}px) scale(${(0.96 + 0.04 * p - 0.06 * q) * (1 + beat * pulse(frame))}) rotate(${rotate}deg)`,
        filter: v < 1 ? `blur(${(1 - p) * 6 + q * 8}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* ---------------------------------------------------------------- icons (vector, no emoji) */
const Ico: React.FC<{ k: string; size?: number; color?: string }> = ({ k, size = 34, color = K.cream }) => {
  const s = { width: size, height: size };
  const st = { fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (k === "play") return <svg {...s} viewBox="0 0 24 24"><path d="M8 5.5 L18.5 12 L8 18.5 Z" fill={color} /></svg>;
  if (k === "cut")
    return (
      <svg {...s} viewBox="0 0 24 24">
        <circle cx="6" cy="7" r="3" {...st} />
        <circle cx="6" cy="17" r="3" {...st} />
        <path d="M8.5 8.8 L20 17.5 M8.5 15.2 L20 6.5" {...st} />
      </svg>
    );
  if (k === "note")
    return (
      <svg {...s} viewBox="0 0 24 24">
        <ellipse cx="8" cy="18" rx="3.6" ry="2.7" fill={color} />
        <path d="M11.5 18 V4 C15 4.6 17.6 6.6 18.6 9.6" {...st} strokeWidth={2.2} />
      </svg>
    );
  if (k === "text")
    return (
      <div style={{ ...s, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: size * 0.95, color, lineHeight: 1 }}>Aa</div>
    );
  if (k === "spark") return <svg {...s} viewBox="0 0 24 24"><path d="M12 2.5 L13.9 10.1 L21.5 12 L13.9 13.9 L12 21.5 L10.1 13.9 L2.5 12 L10.1 10.1 Z" fill={color} /></svg>;
  if (k === "color")
    return (
      <svg {...s} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" {...st} />
        <path d="M12 4 A8 8 0 0 1 12 20 Z" fill={color} />
      </svg>
    );
  return null;
};

/* ---------------------------------------------------------------- 2.62–4.38 : « motion graphics » · « الصوت » · « كل شيء » */
/** left of the head: « motion graphics » (2 lines, coral serif italic) — continues the chip that flew out of the wall */
export const MotionCard: React.FC<{ at: number; out: number }> = ({ at, out }) => (
  <Block at={at} out={out} x={14} y={418} w={190} rotate={-4} seed="mg" len={8} beat={0.035}>
    <div style={{ ...glass(true), borderRadius: 26, padding: "16px 18px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: "0.16em", color: K.muted }}>
        <Ico k="spark" size={16} color={K.coral} /> MOTION
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 52, lineHeight: 0.98, color: K.coral, marginTop: 6 }}>
        motion
        <br />
        graphics
      </div>
    </div>
  </Block>
);

/** right of the head: « الصوت » — lands ON the music's first 808 hit (3.03 s) with a bass shockwave, then breathes on the beat */
export const SOUND_X = 856;
export const SOUND_Y = 418;
export const SoundCard: React.FC<{ at: number; out: number; swell: number }> = ({ at, out, swell }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0) return null;
  const q = ramp(frame, out, 6);
  if (q >= 1) return null;
  const slam = interpolate(t, [0, 3, 7, 11], [1.45, 0.93, 1.05, 1], { extrapolateRight: "clamp" });
  const pl = pulse(frame);
  const sw = 1 + 0.35 * Math.max(0, 1 - Math.abs(frame - swell - 3) / 7) + 0.3 * pl;
  const blur = Math.max(0, 2 - t) * 2 + q * 8;
  const cx = SOUND_X + 98;
  const cy = SOUND_Y + 66;
  const ring = (d: number, len: number, r1: number, wd: number) => {
    const k = (t - d) / len;
    if (k < 0 || k > 1) return null;
    const r = 70 + EASE(k) * r1;
    return (
      <div
        key={`r${d}`}
        style={{ position: "absolute", left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `${wd * (1 - k) + 1}px solid ${K.coralLight}`, boxShadow: `0 0 26px ${K.coralGlow}`, opacity: (1 - k) * 0.85 }}
      />
    );
  };
  const flash = interpolate(t, [0, 1, 9], [0, 0.42, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fl = Math.sin(frame / 22) * 4;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${cx}px ${cy}px, rgba(255,190,150,0.95) 0%, rgba(217,119,87,0.5) 18%, rgba(217,119,87,0) 48%)`, mixBlendMode: "screen", opacity: flash }} />
      {ring(0, 12, 170, 9)}
      {ring(2, 14, 110, 4)}
      <div
        style={{
          position: "absolute",
          left: SOUND_X,
          top: SOUND_Y + fl,
          width: 196,
          opacity: Math.min(1, t / 2 + 0.7) * (1 - q),
          transform: `rotate(4deg) scale(${slam * (1 + 0.045 * pl) * (1 - 0.06 * q)})`,
          filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
        }}
      >
        <div style={{ ...glass(t < 10 || pl > 0.5), borderRadius: 26, padding: "16px 18px 14px", boxShadow: `0 24px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,236,220,0.22), 0 0 ${30 + 40 * pl}px rgba(217,119,87,${0.25 + 0.35 * pl})` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ width: 34, height: 34, borderRadius: 17, background: `linear-gradient(180deg, ${K.coralLight}, ${K.coral})`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.2 * pl})` }}>
              <Ico k="note" size={20} color="#1A0F0B" />
            </div>
            <div dir="rtl" style={{ fontFamily: AR, fontWeight: 800, fontSize: 36, color: K.cream }}>
              الصوت
            </div>
          </div>
          <div style={{ marginTop: 12, transform: `scaleY(${sw})` }}>
            <Wave w={158} h={52} bars={18} seed="hook-voice" progress={Math.min(1, t / 10)} />
          </div>
        </div>
      </div>
    </>
  );
};

/** « كل شيء »: a burst of tool tiles on both sides of the head (cut, music, text, effects, colour, play) */
const TILES: { k: string; label: string; x: number; y: number; d: number; accent?: boolean }[] = [
  { k: "cut", label: "cut", x: 12, y: 606, d: 0 },
  { k: "text", label: "texte", x: 108, y: 690, d: 2, accent: true },
  { k: "color", label: "couleur", x: 12, y: 774, d: 4 },
  { k: "play", label: "anim", x: 970, y: 606, d: 1, accent: true },
  { k: "spark", label: "effets", x: 874, y: 690, d: 3 },
  { k: "note", label: "musique", x: 970, y: 774, d: 5 },
];
export const TILE_TICKS = TILES.map((t) => t.d);
export const Burst: React.FC<{ at: number; out: number }> = ({ at, out }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      {TILES.map((t, i) => {
        const a = at + t.d * 2;
        if (frame < a) return null;
        const sp = spring({ frame: frame - a, fps, config: { damping: 10, stiffness: 210, mass: 0.6 } });
        const q = ramp(frame, out + (i % 3), 6);
        const fl = Math.sin(frame / 14 + i * 1.3) * 4;
        // they burst outward from the head side
        const fromX = t.x < 540 ? 60 : -60;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: t.x + (1 - Math.min(1, sp)) * fromX,
              top: t.y + fl,
              width: 92,
              height: 92,
              borderRadius: 24,
              flexDirection: "column",
              gap: 4,
              ...glass(t.accent),
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: Math.min(1, sp * 1.5) * (1 - q),
              transform: `scale(${sp * (1 - 0.4 * q) * (1 + 0.05 * pulse(frame))}) rotate(${(1 - sp) * (t.x < 540 ? -40 : 40) + Math.sin(frame / 20 + i) * 4}deg)`,
              filter: q > 0 ? `blur(${q * 8}px)` : undefined,
            }}
          >
            <Ico k={t.k} size={36} color={t.accent ? K.coral : K.cream} />
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", color: K.muted }}>{t.label}</div>
          </div>
        );
      })}
    </>
  );
};

/* ---------------------------------------------------------------- 4.38–5.9 : « ما نستعمل حتى logiciel de montage » */
const CLIPS: [number, number, number, number][] = [
  // track, start, width, tone (0 cream, 1 coral)
  [0, 0, 120, 0],
  [0, 126, 84, 1],
  [0, 216, 150, 0],
  [0, 372, 70, 1],
  [1, 30, 190, 0],
  [1, 230, 120, 0],
  [1, 356, 86, 1],
  [2, 0, 300, 1],
  [2, 306, 140, 0],
];
export const TimelineCard: React.FC<{ at: number; strike: number; blow: number }> = ({ at, strike, blow }) => {
  const frame = useCurrentFrame();
  const p = ramp(frame, at, 8);
  if (frame < at || frame > blow + 12) return null;
  const s = frame - strike;
  const struck = s >= 0;
  const shake = s >= 0 && s < 8 ? Math.sin(s * 2.6) * (8 - s) * 1.4 : 0;
  const b = ramp(frame, blow, 9);
  const play = Math.min(1, Math.max(0, (Math.min(frame, strike) - at) / 40));
  const tc = Math.floor(12 * 30 + (Math.min(frame, strike) - at) * 1.0);
  const tcs = `00:00:${String(Math.floor(tc / 30)).padStart(2, "0")}:${String(tc % 30).padStart(2, "0")}`;
  const lineA = interpolate(s, [0, 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineB = interpolate(s, [2, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const W = 548;
  const H = 158;
  return (
    <div
      style={{
        position: "absolute",
        left: 70 + shake - b * 120,
        top: 1308 + b * 160,
        width: W,
        height: H,
        opacity: p * (1 - b),
        transformOrigin: "0 0",
        transform: `translateY(${(1 - p) * 14}px) scale(${1.1 * (0.96 + 0.04 * p) * (1 + 0.02 * pulse(frame))}) rotate(${b * -14}deg)`,
        filter: p < 1 || b > 0 ? `blur(${(1 - p) * 6 + b * 10}px)` : undefined,
      }}
    >
      <div style={{ ...glass(), borderRadius: 22, width: W, height: H, padding: 0, overflow: "hidden", filter: struck ? "grayscale(0.85) brightness(0.72)" : undefined }}>
        <div style={{ height: 34, display: "flex", alignItems: "center", gap: 7, padding: "0 14px", borderBottom: `1px solid ${K.stroke}`, background: "rgba(255,236,220,0.04)" }}>
          {["#FF6159", "#FFBD2E", "#28C941"].map((c) => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: 5, background: c, opacity: 0.8 }} />
          ))}
          <div style={{ marginLeft: 8, fontFamily: MONO, fontWeight: 500, fontSize: 15, color: K.muted }}>montage_final_v12.prj</div>
          <div style={{ marginLeft: "auto", fontFamily: MONO, fontWeight: 700, fontSize: 15, color: K.coralLight }}>{tcs}</div>
        </div>
        <div style={{ position: "relative", padding: "10px 14px 0 50px" }}>
          {["V1", "A1", "A2"].map((t, i) => (
            <div key={t} style={{ position: "absolute", left: 14, top: 12 + i * 36, fontFamily: MONO, fontSize: 14, color: K.dim }}>
              {t}
            </div>
          ))}
          <div style={{ position: "relative", height: 108 }}>
            {CLIPS.map(([tr, x, w, tone], i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x,
                  top: tr * 36,
                  width: w,
                  height: 28,
                  borderRadius: 7,
                  background: tone ? "rgba(217,119,87,0.55)" : "rgba(245,238,228,0.2)",
                  border: `1px solid ${tone ? "rgba(240,164,135,0.7)" : "rgba(255,236,220,0.22)"}`,
                }}
              />
            ))}
            {/* playhead */}
            <div style={{ position: "absolute", left: play * 470, top: -8, width: 2, height: 112, background: K.coral, boxShadow: `0 0 10px ${K.coralGlow}` }} />
          </div>
        </div>
      </div>
      {/* the strike: two coral slashes */}
      {struck ? (
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <line x1={30} y1={20} x2={30 + (W - 60) * lineA} y2={20 + (H - 40) * lineA} stroke={K.coral} strokeWidth={10} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${K.coralGlow})` }} />
          <line x1={W - 30} y1={20} x2={W - 30 - (W - 60) * lineB} y2={20 + (H - 40) * lineB} stroke={K.coral} strokeWidth={10} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${K.coralGlow})` }} />
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: 250, top: 36, whiteSpace: "nowrap" }}>
        <Stamp text="0 logiciel" at={strike + 3} size={50} rotate={-8} />
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- 5.92–6.9 : « كلّو بـ Claude » (2D part of THE MOMENT) */
export const SPARK_X = 924;
export const SPARK_Y = 330;
export const ClaudeHit: React.FC<{ at: number; out: number }> = ({ at, out }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || frame > out + 10) return null;
  const flash = interpolate(t, [0, 1, 10], [0, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ring = (d: number, len: number, maxR: number, wdt: number) => {
    const k = (t - d) / len;
    if (k < 0 || k > 1) return null;
    const r = 30 + EASE(k) * maxR;
    return (
      <div
        key={d}
        style={{
          position: "absolute",
          left: SPARK_X - r,
          top: SPARK_Y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: "50%",
          border: `${wdt * (1 - k) + 1}px solid ${K.coralLight}`,
          boxShadow: `0 0 30px ${K.coralGlow}, inset 0 0 30px ${K.coralGlow}`,
          opacity: (1 - k) * (maxR > 500 ? 0.35 : 0.95),
        }}
      />
    );
  };
  const q = ramp(frame, out, 7);
  const wordP = ramp(frame, at + 2, 7);
  return (
    <>
      {/* coral light flash from the spark (screen) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at ${SPARK_X}px ${SPARK_Y}px, rgba(255,190,150,1) 0%, rgba(217,119,87,0.7) 22%, rgba(217,119,87,0) 70%)`,
          mixBlendMode: "screen",
          opacity: flash,
        }}
      />
      {ring(0, 16, 760, 6)}
      {ring(2, 14, 300, 10)}
      {/* sparks flying out (to the right/up/down, away from the face) */}
      {Array.from({ length: 14 }, (_, i) => {
        const a = -Math.PI * 0.62 + (i / 13) * Math.PI * 1.24 + (random(`ang${i}`) - 0.5) * 0.2;
        const sp = 160 + random(`sp${i}`) * 220;
        const k = EASE(t / 18);
        const life = 1 - Math.min(1, t / (14 + random(`l${i}`) * 10));
        if (life <= 0) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: SPARK_X + Math.cos(a) * sp * k - 5,
              top: SPARK_Y + Math.sin(a) * sp * k - 5,
              width: 10,
              height: 10,
              borderRadius: 5,
              background: i % 3 ? K.coralLight : "#FFE6D6",
              boxShadow: `0 0 12px ${K.coral}`,
              opacity: life,
            }}
          />
        );
      })}
      {/* « Claude » under the spark */}
      <div
        style={{
          position: "absolute",
          left: SPARK_X - 130,
          width: 260,
          top: SPARK_Y + 150,
          textAlign: "center",
          fontFamily: SERIF,
          fontSize: 76,
          lineHeight: 1,
          color: K.coral,
          textShadow: `0 0 30px ${K.coralGlow}, 0 6px 24px rgba(0,0,0,0.6)`,
          opacity: wordP * (1 - q),
          transform: `translateY(${(1 - wordP) * 16}px) scale(${0.96 + 0.04 * wordP})`,
          filter: wordP < 1 || q > 0 ? `blur(${(1 - wordP) * 6 + q * 6}px)` : undefined,
        }}
      >
        Claude
      </div>
    </>
  );
};

/* ---------------------------------------------------------------- 6.92–9.62 : ring 60 · les étapes · easy peasy */
export const RingCount: React.FC<{ at: number; out: number }> = ({ at, out }) => {
  const frame = useCurrentFrame();
  const n = Math.round(interpolate(frame, [at, at + 26], [0, 60], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (x) => 1 - Math.pow(1 - x, 2) }));
  return (
    <Block at={at - 2} out={out} x={20} y={636} seed="ring" len={7} beat={0.03}>
      <div style={{ position: "relative", width: 190, height: 190 }}>
        <div style={{ position: "absolute", inset: -10, borderRadius: "50%", border: "1.5px dashed rgba(240,164,135,0.35)", transform: `rotate(${frame * 1.5}deg)` }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", ...glass(), padding: 0 }} />
        <div style={{ position: "absolute", inset: 0 }}>
          <Ring size={190} progress={n / 60} label={n} sub="secondes" stroke={11} />
        </div>
      </div>
    </Block>
  );
};

const STEPS = ["reel", "Claude", "style", "script", "rendu"];
/** progress-bar segments of StageHeader (RTL: step 1 on the right) — the pills fly into them at the split */
const segX = (n: number) => {
  const segW = (L.W - 2 * L.side - 4 * 10) / 5;
  return L.W - L.side - n * segW - (n - 1) * 10; // left x of segment n
};
export const StepPills: React.FC<{ at: number; split: number }> = ({ at, split }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const segW = (L.W - 2 * L.side - 4 * 10) / 5;
  const PW = 160;
  const PH = 70;
  const GAP = 10;
  const rowW = 5 * PW + 4 * GAP;
  const x0 = 100 + 0 * rowW;
  const k = io((frame - split) / 13);
  return (
    <>
      {STEPS.map((s, i) => {
        const n = i + 1;
        const a = at + i * 3;
        if (frame < a) return null;
        const sp = spring({ frame: frame - a, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
        // RTL row: step 1 on the right
        const px = x0 + (4 - i) * (PW + GAP);
        const py = 1310 + Math.sin(frame / 15 + i) * 3;
        const x = interpolate(k, [0, 1], [px, segX(n)]);
        const y = interpolate(k, [0, 1], [py, L.progressY]);
        const w = interpolate(k, [0, 1], [PW, segW]);
        const h = interpolate(k, [0, 1], [PH, 8]);
        const fadeOut = 1 - ramp(frame, split + 10, 6);
        const lit = frame >= a + 4;
        return (
          <div
            key={s}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: w,
              height: h,
              borderRadius: interpolate(k, [0, 1], [20, 4]),
              ...glass(n === 1),
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              opacity: Math.min(1, sp * 1.4) * fadeOut,
              transform: `translateY(${(1 - Math.min(1, sp)) * 22}px) scale(${(0.9 + 0.1 * sp) * (1 + 0.04 * pulse(frame) * (1 - k))})`,
              background: k > 0.05 ? `rgba(217,119,87,${0.25 + 0.5 * k})` : glass(n === 1).background,
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9, opacity: 1 - EASE(k * 3) }}>
              <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 22, color: lit ? K.coral : K.dim }}>{String(n).padStart(2, "0")}</span>
              <span style={{ fontFamily: UI, fontWeight: 700, fontSize: 27, color: K.cream }}>{s}</span>
            </div>
          </div>
        );
      })}
    </>
  );
};

/** die-cut sticker « easy peasy » (used at 9.14 and as the callback at 100.44) */
export const Sticker: React.FC<{ at: number; out: number; wobble?: number; x?: number; y?: number; rotate?: number; beatOn?: boolean }> = ({ at, out, wobble, x = 846, y = 612, rotate = 7, beatOn = false }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0) return null;
  const q = ramp(frame, out, 6);
  if (q >= 1) return null;
  const s = interpolate(t, [0, 3, 6, 10], [1.9, 0.9, 1.06, 1], { extrapolateRight: "clamp" });
  const r0 = interpolate(t, [0, 6], [22, 0], { extrapolateRight: "clamp" });
  const w = wobble !== undefined && frame >= wobble ? Math.sin((frame - wobble) * 1.4) * Math.max(0, 1 - (frame - wobble) / 12) * 9 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + Math.sin(frame / 16) * 4,
        transformOrigin: "50% 50%",
        transform: `rotate(${rotate + r0 + w}deg) scale(${s * (1 - 0.3 * q) * (1 + (beatOn ? 0.045 * pulse(frame) : 0))})`,
        opacity: Math.min(1, t / 2) * (1 - q),
        filter: t < 3 || q > 0 ? `blur(${Math.max(0, 3 - t) * 1.5 + q * 8}px)` : undefined,
      }}
    >
      <div
        style={{
          position: "relative",
          padding: "14px 22px 16px",
          borderRadius: 30,
          background: `linear-gradient(170deg, ${K.coralLight}, ${K.coral} 60%, ${K.coralDeep})`,
          border: "7px solid #FFF6EE",
          boxShadow: "0 16px 34px rgba(0,0,0,0.55), 0 0 40px rgba(217,119,87,0.45)",
          fontFamily: UI,
          fontWeight: 900,
          fontSize: 48,
          lineHeight: 0.95,
          letterSpacing: "-0.02em",
          color: "#1A0F0B",
          textAlign: "center",
        }}
      >
        easy
        <br />
        peasy
        <div style={{ position: "absolute", right: -16, top: -30, transform: `rotate(${frame * 3}deg)` }}>
          <Spark size={44} color="#FFF6EE" />
        </div>
        <div style={{ position: "absolute", left: -20, bottom: -18, transform: `rotate(${-frame * 2}deg)` }}>
          <Spark size={26} color={K.coralLight} />
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- 100.44–103.26 : « ساهلة الحكاية، ما فيها حتى شي » */
/** a « difficulté » meter that drains to 0 on « ما فيها حتى شي » */
export const Difficulty: React.FC<{ at: number; drain: number; zero: number; out: number }> = ({ at, drain, zero, out }) => {
  const frame = useCurrentFrame();
  const segs = 5;
  const left = Math.max(0, segs - Math.floor(Math.max(0, frame - drain) / ((zero - drain) / segs)));
  const isZero = frame >= zero;
  const zp = ramp(frame, zero, 6);
  return (
    <Block at={at} out={out} x={20} y={620} w={204} rotate={-4} seed="diff">
      <div style={{ ...glass(isZero), borderRadius: 26, padding: "16px 18px 18px" }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: "0.16em", color: K.muted }}>DIFFICULTÉ</div>
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          {Array.from({ length: segs }, (_, i) => (
            <div key={i} style={{ flex: 1, height: 16, borderRadius: 5, background: i < left ? K.coral : "rgba(255,236,220,0.12)", boxShadow: i < left ? `0 0 10px ${K.coralGlow}` : undefined }} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <div style={{ fontFamily: SERIF, fontSize: 78, lineHeight: 1, color: isZero ? K.coral : K.cream, transform: `scale(${1 + 0.25 * Math.max(0, 1 - Math.abs(frame - zero - 2) / 6)})`, transformOrigin: "left center" }}>
            {isZero ? 0 : left * 2}
          </div>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              border: `3px solid ${K.ok}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: zp,
              transform: `scale(${0.6 + 0.4 * zp})`,
            }}
          >
            <svg width={26} height={26} viewBox="0 0 24 24">
              <path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke={K.ok} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={24} strokeDashoffset={24 * (1 - zp)} />
            </svg>
          </div>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 14, color: K.dim, marginTop: 2 }}>/ 10</div>
      </div>
    </Block>
  );
};

/* ---------------------------------------------------------------- 113.42–end : follow pill + cursor click on « voilà » */
export const FollowPill: React.FC<{ at: number; click: number }> = ({ at, click }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const sp = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const done = frame >= click + 2;
  const bp = ramp(frame, click + 2, 6);
  const X = 166;
  const Y = 1308;
  const W = 760;
  const H = 124;
  const btnX = X + W - 214;
  const btnY = Y + 28;
  // cursor path: from bottom-right into the button, click on « voilà »
  const c = io((frame - (at + 3)) / (click - at - 5));
  const cx = interpolate(c, [0, 1], [1010, btnX + 92]);
  const cy = interpolate(c, [0, 1], [1640, btnY + 36]) + Math.sin(c * Math.PI) * -40;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: X,
          top: Y,
          width: W,
          height: H,
          opacity: Math.min(1, sp * 1.4),
          transform: `translateY(${(1 - Math.min(1, sp)) * 40}px) scale(${0.94 + 0.06 * sp})`,
          filter: sp < 0.7 ? `blur(${(0.7 - sp) * 8}px)` : undefined,
        }}
      >
        <div style={{ ...glass(true), borderRadius: 999, width: W, height: H, padding: "0 18px", display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              background: `linear-gradient(160deg, ${K.coralLight}, ${K.coralDeep})`,
              border: "2px solid rgba(255,236,220,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: SERIF,
              fontSize: 48,
              color: "#FFF6EE",
            }}
          >
            ms
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 40, color: K.cream, letterSpacing: "-0.01em" }}>@yourhandle</div>
            <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 19, color: K.muted, letterSpacing: "0.12em", marginTop: 2 }}>TECH · CLOUD · IA</div>
          </div>
          <div
            style={{
              width: 196,
              height: 68,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              fontFamily: UI,
              fontWeight: 800,
              fontSize: 30,
              color: done ? K.cream : "#1A0F0B",
              background: done ? "rgba(127,209,161,0.12)" : `linear-gradient(180deg, ${K.coralLight}, ${K.coral})`,
              border: done ? `2px solid ${K.ok}` : "1.5px solid rgba(255,220,200,0.6)",
              boxShadow: done ? "none" : `0 10px 30px ${K.coralGlow}`,
              transform: `scale(${frame >= click && frame < click + 5 ? 0.92 : 1 + 0.08 * Math.max(0, 1 - Math.abs(frame - click - 6) / 5)})`,
            }}
          >
            {done ? (
              <>
                <svg width={26} height={26} viewBox="0 0 24 24">
                  <path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke={K.ok} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={24} strokeDashoffset={24 * (1 - bp)} />
                </svg>
                Suivi
              </>
            ) : (
              "Suivre"
            )}
          </div>
        </div>
        {/* little coral confetti from the button */}
        {done
          ? Array.from({ length: 10 }, (_, i) => {
              const t = frame - click - 2;
              const a = -Math.PI / 2 + ((i - 4.5) / 9) * Math.PI * 1.1;
              const d = EASE(t / 14) * (70 + random(`cf${i}`) * 60);
              const life = 1 - Math.min(1, t / 16);
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: W - 116 + Math.cos(a) * d * 1.4,
                    top: 62 + Math.sin(a) * d + t * t * 0.08,
                    width: 9,
                    height: 9,
                    borderRadius: i % 2 ? 5 : 2,
                    background: i % 3 ? K.coral : K.coralLight,
                    opacity: life,
                    transform: `rotate(${t * 20 + i * 30}deg)`,
                  }}
                />
              );
            })
          : null}
      </div>
      {frame >= at + 3 ? <Cursor x={cx} y={cy} clickAt={click} /> : null}
    </>
  );
};
