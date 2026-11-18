import type React from "react";
import { Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AR, glass, K, MONO, SERIF, UI } from "./theme";

/**
 * Shared kit for every scene (one look for the whole reel). All times are GLOBAL frames: scenes are mounted on the
 * global timeline (no <Sequence> offset), so `useCurrentFrame()` IS the reel frame — use `wf(word, sec)` to land on words.
 * Entrance grammar = the Claude editorial reference: opacity + scale .96→1 + rise 14 px + blur 6→0 over 7 frames, ON the word.
 */
export const EASE = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

/** 0→1 entrance at frame `at` (len frames), 1→0 exit starting at `out` (if given). */
export const useIn = (at: number, len = 7, out?: number, outLen = 6) => {
  const frame = useCurrentFrame();
  const p = EASE((frame - at) / len);
  const q = out === undefined ? 0 : EASE((frame - out) / outLen);
  return { p, q, v: p * (1 - q), frame };
};

/** Springy pop 0→1(→overshoot) at `at`. */
export const usePop = (at: number, damping = 11) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping, stiffness: 190, mass: 0.7 } });
};

/** The house entrance style for a block. */
export const enter = (p: number, q = 0, rise = 14): React.CSSProperties => ({
  opacity: p * (1 - q),
  transform: `translateY(${(1 - p) * rise - q * 10}px) scale(${0.96 + 0.04 * p - 0.03 * q})`,
  filter: p < 1 || q > 0 ? `blur(${(1 - p) * 6 + q * 6}px)` : undefined,
});

/** Slow float so nothing is ever frozen. */
export const float = (frame: number, seed: string, amp = 5, period = 4.5) => {
  const ph = random(seed) * Math.PI * 2;
  const t = (frame / 30 / period) * Math.PI * 2;
  return { x: Math.sin(t + ph) * amp, y: Math.cos(t * 0.8 + ph) * amp };
};

/** Glass card. */
export const Card: React.FC<{ style?: React.CSSProperties; accent?: boolean; children?: React.ReactNode }> = ({ style, accent, children }) => (
  <div style={{ ...glass(accent), padding: 28, ...style }}>{children}</div>
);

/** Pill chip (icon/emoji + text). rtl for Arabic text. */
export const Chip: React.FC<{ children: React.ReactNode; accent?: boolean; size?: number; style?: React.CSSProperties; rtl?: boolean }> = ({
  children,
  accent,
  size = 34,
  style,
  rtl,
}) => (
  <div
    dir={rtl ? "rtl" : undefined}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: size * 0.35,
      padding: `${size * 0.32}px ${size * 0.62}px`,
      borderRadius: 999,
      fontFamily: rtl ? AR : UI,
      fontWeight: 700,
      fontSize: size,
      color: accent ? "#1A0F0B" : K.cream,
      background: accent ? `linear-gradient(180deg, ${K.coralLight}, ${K.coral})` : "rgba(255,236,220,0.08)",
      border: `1.5px solid ${accent ? "rgba(255,220,200,0.6)" : K.stroke}`,
      boxShadow: accent ? `0 10px 30px ${K.coralGlow}` : "0 8px 24px rgba(0,0,0,0.4)",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Editorial title: Arabic/cream text with Latin keywords in coral Instrument Serif italic. parts: [text, accent?] */
export const Title: React.FC<{ parts: [string, boolean?][]; size?: number; style?: React.CSSProperties }> = ({ parts, size = 64, style }) => (
  <div dir="rtl" style={{ fontFamily: AR, fontWeight: 800, fontSize: size, color: K.cream, lineHeight: 1.15, letterSpacing: "-0.01em", ...style }}>
    {parts.map(([t, a], i) =>
      a ? (
        <span key={i} dir="ltr" style={{ fontFamily: SERIF, fontWeight: 400, fontSize: size * 1.12, color: K.coral, padding: "0 0.12em" }}>
          {t}
        </span>
      ) : (
        <span key={i}>{t}</span>
      ),
    )}
  </div>
);

/** Claude's spark mark (8-ray asterisk, coral). */
export const Spark: React.FC<{ size?: number; color?: string; rotate?: number; glow?: number }> = ({ size = 48, color = K.coral, rotate = 0, glow = 0 }) => {
  const rays = Array.from({ length: 12 }, (_, i) => i);
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ transform: `rotate(${rotate}deg)`, filter: glow ? `drop-shadow(0 0 ${glow}px ${color})` : undefined }}>
      {rays.map((i) => (
        <rect key={i} x={-4.2} y={-46} width={8.4} height={40} rx={4.2} fill={color} transform={`rotate(${i * 30} 0 0) scale(1 ${i % 2 ? 0.78 : 1})`} />
      ))}
    </svg>
  );
};

/** Typewriter: the first n characters of `text` at frame (chars per second). */
export const typed = (text: string, frame: number, start: number, cps = 22) => {
  const n = Math.max(0, Math.floor(((frame - start) / 30) * cps));
  return text.slice(0, Math.min(text.length, n));
};
export const Caret: React.FC<{ color?: string; h?: number }> = ({ color = K.coral, h = 34 }) => {
  const frame = useCurrentFrame();
  return <span style={{ display: "inline-block", width: 3, height: h, background: color, marginInline: 3, verticalAlign: "middle", opacity: Math.floor(frame / 15) % 2 ? 0.2 : 1 }} />;
};

/** macOS-like window chrome (dark warm). */
export const Window: React.FC<{ title: React.ReactNode; w: number; h?: number; style?: React.CSSProperties; children?: React.ReactNode; accent?: boolean }> = ({
  title,
  w,
  h,
  style,
  children,
  accent,
}) => (
  <div style={{ ...glass(accent), width: w, height: h, padding: 0, overflow: "hidden", borderRadius: 26, ...style }}>
    <div style={{ height: 54, display: "flex", alignItems: "center", gap: 10, padding: "0 20px", borderBottom: `1px solid ${K.stroke}`, background: "rgba(255,236,220,0.04)" }}>
      {["#FF6159", "#FFBD2E", "#28C941"].map((c) => (
        <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c, opacity: 0.85 }} />
      ))}
      <div style={{ flex: 1, textAlign: "center", fontFamily: UI, fontWeight: 600, fontSize: 22, color: K.muted, marginRight: 60, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
        {title}
      </div>
    </div>
    <div style={{ padding: 24 }}>{children}</div>
  </div>
);

/** Claude app window (spark + "Claude"). */
export const ClaudeWindow: React.FC<{ w?: number; h?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ w = 900, h, style, children }) => (
  <Window
    w={w}
    h={h}
    style={style}
    title={
      <>
        <Spark size={22} /> <span style={{ color: K.cream }}>Claude</span>
      </>
    }
  >
    {children}
  </Window>
);

/** Chat bubble. me = the user (right, coral tint), else Claude (left, with spark). */
export const Bubble: React.FC<{ me?: boolean; children: React.ReactNode; style?: React.CSSProperties }> = ({ me, children, style }) => (
  <div style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start", gap: 14, ...style }}>
    {!me && <Spark size={34} />}
    <div
      style={{
        maxWidth: "82%",
        padding: "18px 24px",
        borderRadius: 24,
        borderTopRightRadius: me ? 8 : 24,
        borderTopLeftRadius: me ? 24 : 8,
        background: me ? "rgba(217,119,87,0.18)" : "rgba(255,236,220,0.06)",
        border: `1.5px solid ${me ? "rgba(217,119,87,0.45)" : K.stroke}`,
        fontFamily: UI,
        fontSize: 30,
        lineHeight: 1.35,
        color: K.cream,
      }}
    >
      {children}
    </div>
  </div>
);

/** Terminal window with lines: [{t (frame the line starts typing), text, kind: cmd|out|ok}] */
export type TermLine = { at: number; text: string; kind?: "cmd" | "out" | "ok" | "dim" };
export const Terminal: React.FC<{ lines: TermLine[]; w?: number; h?: number; title?: string; style?: React.CSSProperties; cps?: number }> = ({
  lines,
  w = 900,
  h,
  title = "Claude Code — ~/reels",
  style,
  cps = 40,
}) => {
  const frame = useCurrentFrame();
  return (
    <Window w={w} h={h} style={style} title={<span style={{ fontFamily: MONO, fontSize: 20 }}>{title}</span>}>
      <div style={{ fontFamily: MONO, fontSize: 27, lineHeight: 1.55, color: K.cream }}>
        {lines
          .filter((l) => frame >= l.at)
          .map((l, i) => {
            const isCmd = (l.kind ?? "cmd") === "cmd";
            const txt = isCmd ? typed(l.text, frame, l.at, cps) : l.text;
            const color = l.kind === "ok" ? K.ok : l.kind === "dim" ? K.dim : l.kind === "out" ? K.muted : K.cream;
            const p = EASE((frame - l.at) / 5);
            return (
              <div key={i} style={{ color, opacity: isCmd ? 1 : p, whiteSpace: "pre" }}>
                {isCmd ? <span style={{ color: K.coral }}>$ </span> : null}
                {txt}
                {isCmd && txt.length < l.text.length ? <Caret h={26} /> : null}
              </div>
            );
          })}
      </div>
    </Window>
  );
};

/** Mouse cursor with a click ripple at `clickAt`. */
export const Cursor: React.FC<{ x: number; y: number; clickAt?: number }> = ({ x, y, clickAt }) => {
  const frame = useCurrentFrame();
  const c = clickAt === undefined ? 0 : frame - clickAt;
  const press = c >= 0 && c < 6 ? 0.86 : 1;
  const ring = c >= 0 && c < 18 ? c / 18 : 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, pointerEvents: "none" }}>
      {ring > 0 && (
        <div style={{ position: "absolute", left: -40 * ring, top: -40 * ring, width: 80 * ring, height: 80 * ring, borderRadius: "50%", border: `3px solid ${K.coral}`, opacity: 1 - ring }} />
      )}
      <svg width={54} height={54} viewBox="0 0 24 24" style={{ transform: `scale(${press})`, filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6))" }}>
        <path d="M4 2 L4 19 L8.5 15 L11.5 22 L14.5 20.8 L11.6 14 L18 14 Z" fill="#fff" stroke="#111" strokeWidth={1.2} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/** Progress ring with a number in the middle. */
export const Ring: React.FC<{ size: number; progress: number; label: React.ReactNode; sub?: string; stroke?: number }> = ({ size, progress, label, sub, stroke = 12 }) => {
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,236,220,0.12)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={K.coral} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, progress)))} style={{ filter: `drop-shadow(0 0 10px ${K.coralGlow})` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: K.cream }}>
        <div style={{ fontFamily: SERIF, fontSize: size * 0.42, lineHeight: 1, color: K.coral }}>{label}</div>
        {sub ? <div style={{ fontFamily: UI, fontWeight: 600, fontSize: size * 0.09, color: K.muted, marginTop: 6 }}>{sub}</div> : null}
      </div>
    </div>
  );
};

/** Deterministic audio waveform bars (animated with `frame`). */
export const Wave: React.FC<{ w: number; h: number; bars?: number; color?: string; seed?: string; progress?: number }> = ({ w, h, bars = 48, color = K.coral, seed = "w", progress = 1 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: w / bars / 3, width: w, height: h }}>
      {Array.from({ length: bars }, (_, i) => {
        const base = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.9 + random(seed + i) * 6));
        const live = 0.7 + 0.3 * Math.sin(frame / 3 + i);
        const on = i / bars <= progress;
        return <div key={i} style={{ flex: 1, height: h * base * live, borderRadius: 4, background: on ? color : "rgba(255,236,220,0.15)" }} />;
      })}
    </div>
  );
};

/** One of the user's OWN reels (9:16 thumbnail). name: trailer-1..4, intro-1..4, ep1-1..4, fr-1..4. */
export const Thumb: React.FC<{ name: string; w: number; style?: React.CSSProperties; radius?: number }> = ({ name, w, style, radius = 22 }) => (
  <Img
    src={staticFile(`thumbs/${name}.jpg`)}
    style={{ width: w, height: (w * 16) / 9, objectFit: "cover", borderRadius: radius, border: `1.5px solid ${K.stroke}`, boxShadow: "0 18px 40px rgba(0,0,0,0.55)", ...style }}
  />
);

/** Big stamp (✓ / ✕ words), AIS reference: 3-frame slam. */
export const Stamp: React.FC<{ text: string; at: number; color?: string; rotate?: number; size?: number }> = ({ text, at, color = K.coral, rotate = -6, size = 64 }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0) return null;
  const s = interpolate(t, [0, 3, 6], [1.6, 0.95, 1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        display: "inline-block",
        transform: `rotate(${rotate}deg) scale(${s})`,
        padding: "10px 26px",
        border: `5px solid ${color}`,
        borderRadius: 16,
        color,
        fontFamily: UI,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: "0.02em",
        background: "rgba(15,11,9,0.55)",
        boxShadow: `0 0 30px ${color}55`,
      }}
    >
      {text}
    </div>
  );
};
