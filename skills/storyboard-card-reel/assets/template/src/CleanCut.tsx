import { AbsoluteFill, Html5Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import clean from "./data/clean.json";

type Piece = { a: number; b: number; t0: number; n: number; camF: number; text: string };
const PIECES = clean.pieces as Piece[];
export const CLEAN_TOTAL = clean.totalF;
export const FACE_FILE = "footage/talk-clean-v2.mp4";
export const VOICE_FILE = "audio/voice-clean-v2.wav";

// one label per kept line (consecutive pieces of the same line share it)
const LINES: { t0: number; n: number; text: string; a: number; idx: number }[] = [];
PIECES.forEach((p) => {
  const last = LINES[LINES.length - 1];
  if (last && last.text === p.text) last.n = p.t0 + p.n - last.t0;
  else LINES.push({ t0: p.t0, n: p.n, text: p.text, a: p.a, idx: LINES.length + 1 });
});

const Clock: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top: 40, right: 40, color: "#ddd", fontFamily: "Inter, sans-serif", fontSize: 28, background: "rgba(0,0,0,.55)", padding: "6px 14px", borderRadius: 10 }}>
      {(f / 30).toFixed(2)} s / {(CLEAN_TOTAL / 30).toFixed(1)} s
    </div>
  );
};

/** Clean cut only: no effects, no music. */
export const CleanCut: React.FC<{ labels: boolean }> = ({ labels }) => (
  <AbsoluteFill style={{ background: "#0B0B0B" }}>
    <OffthreadVideo src={staticFile(FACE_FILE)} muted style={{ width: "100%", height: "100%" }} />
    {labels
      ? LINES.map((l) => (
          <Sequence key={l.idx} from={l.t0} durationInFrames={l.n} layout="none">
            <div style={{ position: "absolute", left: 40, right: 40, bottom: 200, padding: "16px 22px", borderRadius: 16, background: "rgba(10,10,10,.8)", border: "1px solid #5a1016", color: "#F4EDE4", fontFamily: "Inter, sans-serif", fontSize: 30, lineHeight: 1.3 }}>
              <span style={{ color: "#C8102E", fontWeight: 800 }}>#{l.idx} · mic {l.a.toFixed(2)} s</span>
              <br />« {l.text} »
            </div>
          </Sequence>
        ))
      : null}
    <Html5Audio src={staticFile(VOICE_FILE)} />
    <Clock />
  </AbsoluteFill>
);
