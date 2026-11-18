import type React from "react";
import { useCurrentFrame } from "remotion";
import { Caret, EASE, Spark, Stamp, typed, Window } from "../../edit/kit";
import { K, MONO, SERIF } from "../../edit/theme";
import { B, Dot, Elbow, kf, lerp, T } from "./shared";

/**
 * Beats 2–3 (919–1057): Claude Code. « Claude يهبّطها وحدو » → the REAL yt-dlp command + a download bar to 100 % + stamp
 * « TOUT SEUL »; « ويناليزيها بالـ outils كيما ffmpeg » → the terminal compacts to the left (the file pops out on the right,
 * see Sheet.tsx), whisper then the REAL ffmpeg contact-sheet command.
 */
const ROW = 38;
type Row =
  | { at: number; kind: "prompt"; text: string }
  | { at: number; kind: "tool"; text: string; done: number; cps: number; open?: boolean }
  | { at: number; kind: "cont"; text: string; cps: number }
  | { at: number; kind: "out"; text: string; ok?: boolean }
  | { at: number; kind: "bar" };

const ROWS: Row[] = [
  { at: B.toTerm, kind: "prompt", text: "tfarrej fel vidéo hedhi w analysiha b détails…" },
  { at: B.ytType, kind: "tool", text: "yt-dlp https://www.instagram.com/p/DemwzTPJK6J/", done: B.dlDone, cps: 100 },
  { at: T.yhabet, kind: "bar" },
  { at: B.dlDone, kind: "out", ok: true, text: "reel.mp4 · 1080×1920 · 30 fps · 40 s" },
  { at: T.outils2, kind: "tool", text: "whisper reel.mp4", done: T.outils2 + 9, cps: 120 },
  { at: T.outils2 + 9, kind: "out", text: "large-v3 · 128 mots · fr" },
  { at: B.ffType, kind: "tool", text: "ffmpeg -i reel.mp4 \\", done: B.ffDone, cps: 150, open: true },
  { at: B.ffType + 6, kind: "cont", text: "  -vf fps=2,tile=5x4 \\", cps: 150 },
  { at: B.ffType + 11, kind: "cont", text: "  sheet.jpg)", cps: 150 },
  { at: B.ffDone, kind: "out", text: "80 frames → 4 sheets" },
];

const DL = (frame: number) => kf(frame, [T.yhabet, T.yhabet + 6, T.yhabet + 10, T.yhabet + 17, B.dlDone - 1], [0, 0.31, 0.46, 0.86, 1]);

export const TermPhase: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < B.toTerm || frame > T.frame + 12) return null;
  const pIn = EASE((frame - B.toTerm) / 9);
  const q = EASE((frame - T.frame) / 9);
  const c = EASE((frame - B.c3) / 12);
  const w = lerp(890, 570, c);
  const push = 1 + 0.02 * EASE((frame - B.toTerm) / 130);
  const stampO = 1 - EASE((frame - B.c3) / 6);

  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        top: 1045,
        opacity: pIn * (1 - q),
        transform: `translateX(${(1 - pIn) * 180 - q * 160}px) scale(${(0.95 + 0.05 * pIn - 0.05 * q) * push})`,
        transformOrigin: "0 200px",
        filter: pIn < 1 || q > 0 ? `blur(${(1 - pIn) * 10 + q * 9}px)` : undefined,
      }}
    >
      <Window
        w={w}
        h={400}
        style={{ background: "linear-gradient(160deg, rgba(255,236,220,0.06), rgba(255,236,220,0.0) 50%), rgba(13,9,7,0.88)" }}
        title={
          <>
            <Spark size={18} />
            <span style={{ fontFamily: MONO, fontSize: 20, color: K.cream }}>Claude Code</span>
            <span style={{ fontFamily: MONO, fontSize: 20, color: K.dim }}>~/reels</span>
          </>
        }
      >
        <div style={{ position: "relative", height: 400 - 54 - 48, overflow: "hidden", fontFamily: MONO, fontSize: 25, color: K.cream }}>
          {/* big readout of the download (phone-readable), fades when the terminal compacts */}
          {frame >= T.yhabet ? (
            <div style={{ position: "absolute", left: 4, top: 166, display: "flex", alignItems: "flex-end", gap: 22, opacity: EASE((frame - T.yhabet) / 5) * (1 - c), transform: `translateY(${(1 - EASE((frame - T.yhabet) / 5)) * 12}px)` }}>
              <div style={{ fontFamily: SERIF, fontSize: 104, lineHeight: 0.9, color: K.coral, textShadow: `0 0 30px ${K.coralGlow}`, minWidth: 210 }}>
                {Math.round(DL(frame) * 100)}
                <span style={{ fontSize: 64 }}>%</span>
              </div>
              <div style={{ paddingBottom: 8, fontFamily: MONO, fontSize: 21, lineHeight: 1.45, color: K.muted }}>
                <div style={{ color: DL(frame) >= 1 ? K.ok : K.cream }}>{DL(frame) >= 1 ? "✓ reel.mp4" : "↓ reel.mp4"}</div>
                <div>{`${(1.2 * DL(frame)).toFixed(1)} / 1.2 MiB`}</div>
              </div>
            </div>
          ) : null}
          <div style={{ transform: `translateY(${-ROW * 3 * c}px)` }}>
            {ROWS.map((r, i) => {
              const vis = frame >= r.at;
              const pr = EASE((frame - r.at) / 5);
              const fadeOld = i < 3 ? 1 - c : i === 3 ? lerp(1, 0.5, c) : 1;
              const base: React.CSSProperties = {
                height: ROW,
                display: "flex",
                alignItems: "center",
                whiteSpace: "pre",
                overflow: "hidden",
                opacity: vis ? fadeOld * (r.kind === "tool" || r.kind === "cont" ? 1 : pr) : 0,
              };
              if (r.kind === "prompt") {
                return (
                  <div key={i} style={{ ...base, color: K.dim }}>
                    <span style={{ color: K.coral, marginRight: 14 }}>›</span>
                    {r.text}
                  </div>
                );
              }
              if (r.kind === "tool") {
                const t = vis ? typed(r.text, frame, r.at, r.cps) : "";
                const full = t.length >= r.text.length;
                return (
                  <div key={i} style={base}>
                    <Dot frame={frame} doneAt={r.done} />
                    <span style={{ fontWeight: 700 }}>Bash</span>
                    <span style={{ color: K.muted }}>(</span>
                    <span>{t}</span>
                    {full && !r.open ? <span style={{ color: K.muted }}>)</span> : null}
                    {!full && vis ? <Caret h={24} /> : null}
                  </div>
                );
              }
              if (r.kind === "cont") {
                const t = vis ? typed(r.text, frame, r.at, r.cps) : "";
                return (
                  <div key={i} style={{ ...base, paddingLeft: 30 }}>
                    <span>{t}</span>
                    {vis && t.length < r.text.length ? <Caret h={24} /> : null}
                  </div>
                );
              }
              if (r.kind === "bar") {
                const p = DL(frame);
                return (
                  <div key={i} style={{ ...base, paddingLeft: 30, color: K.muted }}>
                    <Elbow />
                    <span>[download] </span>
                    <div style={{ position: "relative", width: 300, height: 14, borderRadius: 7, background: "rgba(255,236,220,0.12)", overflow: "hidden", marginRight: 16 }}>
                      <div style={{ width: `${p * 100}%`, height: "100%", borderRadius: 7, background: p >= 1 ? K.ok : `linear-gradient(90deg, ${K.coralDeep}, ${K.coralLight})`, boxShadow: `0 0 12px ${p >= 1 ? "rgba(127,209,161,0.5)" : K.coralGlow}` }} />
                      {p < 1 ? <div style={{ position: "absolute", top: 0, bottom: 0, left: `${p * 100 - 12}%`, width: "12%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)" }} /> : null}
                    </div>
                    <span style={{ color: p >= 1 ? K.ok : K.cream, fontWeight: 700 }}>{`${Math.round(p * 100)}%`.padStart(4, " ")}</span>
                    <span>{"  1.2MiB"}</span>
                  </div>
                );
              }
              return (
                <div key={i} style={{ ...base, paddingLeft: 30, color: r.ok ? K.cream : K.muted }}>
                  <Elbow />
                  {r.ok ? <span style={{ color: K.ok, marginRight: 12 }}>✓</span> : null}
                  {r.text}
                </div>
              );
            })}
          </div>
        </div>
      </Window>
      {frame >= T.wahdou && stampO > 0 ? (
        <div style={{ position: "absolute", left: 560, top: 262, opacity: stampO, whiteSpace: "nowrap" }}>
          <Stamp text="TOUT SEUL" at={T.wahdou} rotate={-7} size={44} />
        </div>
      ) : null}
    </div>
  );
};
