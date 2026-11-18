import type React from "react";
import { interpolate, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { EASE, typed, Wave } from "../../edit/kit";
import { K, MONO, UI } from "../../edit/theme";

/** Live mini previews inside each agent window (268 × 186). All times are GLOBAL frames. */
export const PW = 268;
export const PH = 186;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** The user's own clip playing (9:16) + the agent's live log on the right. */
export const VideoPreview: React.FC<{ from: number; src: string; trim: number; log: string[]; done: number; rate?: number }> = ({ from, src, trim, log, done, rate = 0.9 }) => {
  const frame = useCurrentFrame();
  const vw = 105;
  const scrub = clamp01((frame - from) / 130);
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: vw, height: PH, overflow: "hidden", background: "#000" }}>
        <Sequence from={from} layout="none" name="agent preview">
          <OffthreadVideo src={staticFile(src)} muted trimBefore={trim} playbackRate={rate} style={{ width: vw, height: PH, objectFit: "cover", filter: "contrast(1.04) saturate(0.92) sepia(0.12)" }} />
        </Sequence>
        {/* warm tint so the clips sit in the coral world */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(217,119,87,0.10), rgba(15,11,9,0.25))" }} />
        {/* scrub bar */}
        <div style={{ position: "absolute", left: 0, bottom: 0, height: 3, width: `${scrub * 100}%`, background: K.coral, boxShadow: `0 0 8px ${K.coral}` }} />
      </div>
      <div style={{ position: "absolute", left: vw + 12, top: 12, right: 8, fontFamily: MONO, fontWeight: 500, fontSize: 14, lineHeight: "27px", whiteSpace: "nowrap" }}>
        {log.map((l, k) => {
          const at = from + 10 + k * 15;
          if (frame < at) return null;
          const t = typed(l, frame, at, 40);
          const fin = t.length === l.length;
          return (
            <div key={k} style={{ color: fin ? K.muted : K.cream, opacity: EASE((frame - at) / 3) }}>
              <span style={{ color: K.coral }}>▸ </span>
              {t}
            </div>
          );
        })}
        {frame >= done ? (
          <div style={{ color: K.ok, fontWeight: 700, opacity: EASE((frame - done) / 3) }}>✓ prêt</div>
        ) : null}
      </div>
    </>
  );
};

/** étape 2 — the real commands of this project, typed in a mini terminal. */
export const TermPreview: React.FC<{ from: number; done: number }> = ({ from, done }) => {
  const frame = useCurrentFrame();
  const lines: { at: number; text: string; kind: "cmd" | "out" | "ok" }[] = [
    { at: from + 8, text: "yt-dlp …/p/DemwzTPJK6J/", kind: "cmd" },
    { at: from + 24, text: "", kind: "out" }, // download bar
    { at: from + 34, text: "ffmpeg -i reel.mp4 -vf fps=2", kind: "cmd" },
    { at: from + 50, text: "", kind: "out" }, // frame counter
    { at: from + 58, text: "whisper large-v3", kind: "cmd" },
    { at: from + 74, text: "→ 281 mots", kind: "ok" },
  ];
  const dl = clamp01((frame - (from + 24)) / 26);
  const nFrame = Math.min(230, Math.max(1, Math.floor((frame - (from + 50)) * 2.6)));
  return (
    <div style={{ position: "absolute", inset: 0, padding: "10px 12px", fontFamily: MONO, fontWeight: 500, fontSize: 13, lineHeight: "24px", color: K.cream, whiteSpace: "nowrap" }}>
      {lines.map((l, k) => {
        if (frame < l.at) return null;
        if (k === 1)
          return (
            <div key={k} style={{ color: K.muted }}>
              {"█".repeat(Math.round(dl * 12)).padEnd(12, "░")} {Math.round(dl * 100)}%
            </div>
          );
        if (k === 3)
          return (
            <div key={k} style={{ color: K.muted }}>
              → frames/{String(nFrame).padStart(3, "0")}.jpg
            </div>
          );
        if (l.kind === "ok")
          return (
            <div key={k} style={{ color: K.ok, opacity: EASE((frame - l.at) / 3) }}>
              {l.text}
            </div>
          );
        const t = typed(l.text, frame, l.at, 48);
        return (
          <div key={k}>
            <span style={{ color: K.coral }}>$ </span>
            {t}
            {t.length < l.text.length ? <span style={{ display: "inline-block", width: 7, height: 14, background: K.coral, verticalAlign: "middle" }} /> : null}
          </div>
        );
      })}
      {frame >= done ? <div style={{ position: "absolute", right: 10, top: 10, color: K.ok, fontWeight: 700 }}>✓</div> : null}
    </div>
  );
};

/** étape 4 — a mini Remotion timeline that builds itself (voice / gfx / sfx / music lanes) with a playhead. */
export const TimelinePreview: React.FC<{ from: number; done: number }> = ({ from, done }) => {
  const frame = useCurrentFrame();
  const lanes: { name: string; blocks: [number, number][]; solid?: boolean }[] = [
    { name: "VO", blocks: [[0, 0.3], [0.33, 0.28], [0.64, 0.34]], solid: true },
    { name: "GFX", blocks: [[0.02, 0.14], [0.19, 0.2], [0.42, 0.12], [0.57, 0.18], [0.79, 0.19]] },
    { name: "SFX", blocks: [[0.05, 0.03], [0.18, 0.03], [0.3, 0.03], [0.44, 0.03], [0.55, 0.03], [0.7, 0.03], [0.82, 0.03], [0.93, 0.03]] },
    { name: "♪", blocks: [[0.08, 0.9]] },
  ];
  const x0 = 46;
  const w = PW - x0 - 12;
  const build = clamp01((frame - (from + 8)) / 75);
  const play = ((frame - from) % 60) / 60;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 12, top: 8, fontFamily: MONO, fontSize: 12, color: K.dim, letterSpacing: "0.04em" }}>Remotion 4.0.535 · 60 fps</div>
      {/* ruler */}
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: x0 + (i / 11) * w, top: 30, width: 1, height: i % 2 ? 5 : 9, background: K.dim }} />
      ))}
      {lanes.map((ln, li) => {
        const y = 46 + li * 34;
        return (
          <div key={ln.name}>
            <div style={{ position: "absolute", left: 10, top: y + 5, fontFamily: MONO, fontSize: 11, fontWeight: 700, color: K.muted }}>{ln.name}</div>
            <div style={{ position: "absolute", left: x0, top: y, width: w, height: 24, borderRadius: 6, background: "rgba(255,236,220,0.04)" }} />
            {ln.blocks.map(([s, l], bi) => {
              const appear = clamp01((build - s) * 8 - li * 0.4);
              if (appear <= 0) return null;
              return (
                <div
                  key={bi}
                  style={{
                    position: "absolute",
                    left: x0 + s * w,
                    top: y + 2,
                    width: Math.max(4, l * w * appear),
                    height: 20,
                    borderRadius: 5,
                    background: ln.solid ? "rgba(245,238,228,0.28)" : li === 3 ? "rgba(217,119,87,0.38)" : `linear-gradient(180deg, ${K.coralLight}, ${K.coral})`,
                    border: li === 3 ? `1px solid rgba(217,119,87,0.7)` : undefined,
                    opacity: appear,
                  }}
                />
              );
            })}
          </div>
        );
      })}
      {/* playhead */}
      <div style={{ position: "absolute", left: x0 + play * w, top: 26, width: 2, height: 150, background: K.cream, boxShadow: `0 0 8px ${K.cream}` }} />
      <div style={{ position: "absolute", left: x0 + play * w - 5, top: 22, width: 12, height: 8, borderRadius: 2, background: K.cream }} />
      {frame >= done ? <div style={{ position: "absolute", right: 10, top: 6, fontFamily: MONO, fontSize: 14, fontWeight: 700, color: K.ok }}>✓</div> : null}
    </div>
  );
};

/** son — the SFX lane: a live waveform + the real SFX files popping in. */
export const WavePreview: React.FC<{ from: number; p: number; done: number }> = ({ from, p, done }) => {
  const frame = useCurrentFrame();
  const sfx = ["riser", "whoosh", "pop", "ding"];
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 12, top: 8, fontFamily: MONO, fontSize: 12, color: K.dim }}>sfx/ · voice ducked</div>
      <div style={{ position: "absolute", left: 12, top: 34 }}>
        <Wave w={PW - 24} h={78} bars={30} seed="agents-son" progress={Math.max(0.08, p)} />
      </div>
      <div style={{ position: "absolute", left: 12, top: 126, right: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {sfx.map((s, k) => {
          const at = from + 12 + k * 13;
          const a = EASE((frame - at) / 5);
          if (a <= 0) return null;
          return (
            <div
              key={s}
              style={{
                fontFamily: MONO,
                fontSize: 13,
                fontWeight: 700,
                color: K.cream,
                padding: "3px 9px",
                borderRadius: 999,
                background: "rgba(217,119,87,0.16)",
                border: "1px solid rgba(217,119,87,0.5)",
                opacity: a,
                transform: `scale(${0.8 + 0.2 * a})`,
              }}
            >
              {s}.wav
            </div>
          );
        })}
      </div>
      {frame >= done ? <div style={{ position: "absolute", right: 10, top: 6, fontFamily: MONO, fontSize: 14, fontWeight: 700, color: K.ok }}>✓</div> : null}
    </div>
  );
};

/** musique — the music bed ducking under the voice (the real rule of this edit) + a small EQ. */
export const DuckPreview: React.FC<{ from: number; done: number }> = ({ from, done }) => {
  const frame = useCurrentFrame();
  const w = PW - 24;
  const voice: [number, number][] = [
    [0.08, 0.3],
    [0.4, 0.62],
    [0.72, 0.95],
  ];
  // music volume curve: up in the gaps, ducked under the voice
  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = i / 60;
    const under = voice.some(([a, b]) => x >= a - 0.02 && x <= b + 0.02);
    const y = under ? 74 : 40;
    pts.push(`${12 + x * w},${y + Math.sin(i * 1.7) * 1.5}`);
  }
  const draw = clamp01((frame - (from + 8)) / 60);
  const len = 900;
  const play = ((frame - from) % 75) / 75;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 12, top: 8, fontFamily: MONO, fontSize: 12, color: K.dim }}>music bed · duck sous la voix</div>
      <svg width={PW} height={PH} style={{ position: "absolute", inset: 0 }}>
        {voice.map(([a, b], k) => (
          <rect key={k} x={12 + a * w} y={88} width={(b - a) * w} height={18} rx={4} fill="rgba(245,238,228,0.22)" />
        ))}
        <text x={14} y={101} fontFamily={MONO} fontSize={10} fill={K.dim}>
          voix
        </text>
        <polyline points={pts.join(" ")} fill="none" stroke={K.coral} strokeWidth={3} strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} style={{ filter: `drop-shadow(0 0 4px ${K.coral})` }} />
        <line x1={12 + play * w} x2={12 + play * w} y1={30} y2={110} stroke={K.cream} strokeWidth={1.5} opacity={0.7} />
      </svg>
      {/* EQ bars */}
      <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, height: 52, display: "flex", alignItems: "flex-end", gap: 4 }}>
        {Array.from({ length: 22 }, (_, i) => {
          const v = 0.25 + 0.75 * Math.abs(Math.sin(frame / 4.2 + i * 0.7 + random(`eq${i}`) * 3)) * (0.6 + 0.4 * Math.sin(i / 3));
          return <div key={i} style={{ flex: 1, height: `${Math.max(10, v * 100)}%`, borderRadius: 2, background: i % 3 === 0 ? K.coral : "rgba(217,119,87,0.45)" }} />;
        })}
      </div>
      {frame >= done ? <div style={{ position: "absolute", right: 10, top: 6, fontFamily: MONO, fontSize: 14, fontWeight: 700, color: K.ok }}>✓</div> : null}
    </div>
  );
};

/** Small helper for the UI fonts used by the window chrome. */
export const chromeFont: React.CSSProperties = { fontFamily: UI };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = clamp01;
export const at01 = (frame: number, a: number, b: number) => interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
