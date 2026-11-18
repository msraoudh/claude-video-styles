import type React from "react";
import { Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { K, MONO, UI } from "../../edit/theme";
import { f } from "../../edit/time";
import { B, c01, eio, eo, G, lerp, LOOPS, type LoopKind } from "./beats";
import { BulbIcon, ClapIcon, PlayIcon } from "./icons";

/**
 * Beat C — « كل مرة تعطيه vidéo ولّا idée »: the machine. Left slot = what you give it (a rush, « vidéo », « idée »),
 * dashed conveyors, the skill in the middle (Hero), and on the right the finished reels pile up — the REAL output of
 * aura-trailer, « NO MORE EXCUSES » (ig-1.mp4), playing — with a ×N counter.
 */

const coreCx = G.core.x + G.core.w / 2;

const InputCard: React.FC<{ kind: LoopKind; frame: number; appear: number }> = ({ kind, frame, appear }) => {
  if (kind === "rush") {
    return (
      <div style={{ width: 110, height: 196, borderRadius: 14, overflow: "hidden", position: "relative", border: `1.5px solid ${K.stroke}`, boxShadow: "0 16px 34px rgba(0,0,0,0.6)" }}>
        <Img src={staticFile("thumbs/fr-2.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.85) brightness(0.75) contrast(0.9)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "18px 0 8px", textAlign: "center", background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.75))", fontFamily: MONO, fontWeight: 700, fontSize: 15, color: K.cream }}>rush.mp4</div>
        <div style={{ position: "absolute", left: 8, top: 8, padding: "2px 7px", borderRadius: 6, background: "rgba(0,0,0,0.55)", fontFamily: MONO, fontWeight: 700, fontSize: 12, color: K.muted, letterSpacing: "0.1em" }}>RAW</div>
      </div>
    );
  }
  const glow = 0.6 + 0.4 * Math.sin((frame - appear) / 3);
  return (
    <div
      style={{
        width: 172,
        height: 150,
        borderRadius: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: `linear-gradient(150deg, rgba(255,236,220,0.1), rgba(255,236,220,0.02) 60%), rgba(36,26,21,0.85)`,
        border: `1.5px solid ${kind === "idea" ? "rgba(217,119,87,0.6)" : K.stroke}`,
        boxShadow: `0 16px 34px rgba(0,0,0,0.55)${kind === "idea" ? `, 0 0 ${24 * glow}px ${K.coralGlow}` : ""}`,
      }}
    >
      {kind === "video" ? <ClapIcon size={58} /> : <BulbIcon size={60} glow={glow} />}
      <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 28, color: K.cream }}>{kind === "video" ? "vidéo" : "idée"}</div>
    </div>
  );
};

const OUT_W = 136;
const OUT_H = 242;

export const Loop: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < B.kol) return null;
  const focus = 1 - 0.45 * eo(frame, B.lskill, 8); // the called skill takes the light (D)
  const lanes = eo(frame, B.kol + 5, 8) * focus;

  // outputs landed so far → stack depth
  const landedAfter = (k: number) => LOOPS.filter((L, j) => j > k && frame >= L.land - 3).length;
  const count = LOOPS.filter((L) => frame >= L.land).length;
  const lastLand = [...LOOPS].reverse().find((L) => frame >= L.land)?.land ?? 0;
  const cnt = count > 0 ? eo(frame, LOOPS[0].land, 6) : 0;
  const cntPop = count > 0 ? 1 + 0.22 * Math.sin(Math.PI * c01((frame - lastLand) / 7)) : 1;
  const fire = frame >= B.hedhi ? Math.sin(Math.PI * c01((frame - B.hedhi) / 12)) : 0;

  return (
    <>
      {/* conveyors (dashes always moving → right) */}
      <svg width={1080} height={60} style={{ position: "absolute", left: 0, top: G.laneY - 30, zIndex: 8, opacity: lanes, overflow: "visible" }}>
        {[
          [248, G.core.x - 14],
          [G.core.x + G.core.w + 14, 786],
        ].map(([a, b], i) => (
          <g key={i}>
            <line x1={a} y1={30} x2={b} y2={30} stroke={K.coral} strokeWidth={3} strokeDasharray="9 9" strokeDashoffset={-frame * 2.2} strokeLinecap="round" opacity={0.75} />
            <path d={`M${b - 10} 21 L${b} 30 L${b - 10} 39`} stroke={K.coralLight} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
      </svg>
      {/* empty input slot */}
      <div style={{ position: "absolute", left: G.inX - 92, top: G.laneY - 106, width: 184, height: 212, borderRadius: 26, border: `2px dashed rgba(255,236,220,0.16)`, opacity: lanes * 0.8, zIndex: 8 }} />

      {LOOPS.map((L, k) => {
        // ---- input: appears in the slot, flies into the skill ----
        const pA = eo(frame, L.appear, 6);
        const pop = 1 + 0.12 * Math.sin(Math.PI * c01((frame - L.appear) / 7));
        const a = eio(frame, L.fly, L.hit - L.fly);
        const inVisible = frame >= L.appear - 1 && a < 1;
        const ix = lerp(G.inX, coreCx, a);
        const iy = G.laneY - Math.sin(Math.PI * a) * 26;
        const isc = (0.9 + 0.1 * pA) * pop * (1 - 0.75 * a);

        // ---- output: leaves the skill, lands on the stack ----
        const o = eio(frame, L.done, L.land - L.done);
        const outVisible = frame >= L.done;
        const depth = landedAfter(k);
        const dz = Math.min(2, depth);
        const ox = lerp(coreCx + 100, G.outX, o) - dz * 30 + fire * (k - 1) * 22;
        const oy = G.laneY - Math.sin(Math.PI * o) * 40 - dz * 6;
        const osc = lerp(0.5, 1, o) * (1 - dz * 0.07) * (1 + 0.06 * Math.sin(Math.PI * c01((frame - L.land) / 7)) * (frame >= L.land ? 1 : 0));
        const orot = lerp(-8, 0, o) - dz * 9 + fire * (k - 1) * 4;
        const isFront = depth === 0;

        return (
          <div key={k}>
            {inVisible ? (
              <div
                style={{
                  position: "absolute",
                  left: ix,
                  top: iy,
                  zIndex: 33,
                  transform: `translate(-50%, -50%) scale(${isc})`,
                  opacity: pA * (1 - a * a),
                  filter: pA < 1 || a > 0.4 ? `blur(${(1 - pA) * 6 + Math.max(0, a - 0.4) * 8}px)` : undefined,
                }}
              >
                <InputCard kind={L.kind} frame={frame} appear={L.appear} />
              </div>
            ) : null}
            {outVisible ? (
              <div
                style={{
                  position: "absolute",
                  left: ox - OUT_W / 2,
                  top: oy - OUT_H / 2,
                  width: OUT_W,
                  height: OUT_H,
                  zIndex: o < 0.45 ? 25 : o < 1 ? 36 : 20 + 3 - depth, // slides out from behind the skill
                  transform: `rotate(${orot}deg) scale(${osc})`,
                  opacity: c01(o * 3),
                  borderRadius: 16,
                  overflow: "hidden",
                  border: `1.5px solid ${isFront ? "rgba(240,164,135,0.8)" : K.stroke}`,
                  boxShadow: `0 20px 40px rgba(0,0,0,0.65)${isFront ? `, 0 0 34px ${K.coralGlow}` : ""}`,
                  background: K.bg1,
                }}
              >
                <Sequence from={L.done} layout="none">
                  <OffthreadVideo src={staticFile("thumbs/ig-1.mp4")} muted trimBefore={f(L.trim)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </Sequence>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0) 38%)" }} />
                {!isFront ? <div style={{ position: "absolute", inset: 0, background: `rgba(15,11,9,${0.35 + 0.15 * dz})` }} /> : null}
                {isFront ? (
                  <div style={{ position: "absolute", left: 8, bottom: 8, display: "flex", alignItems: "center", gap: 5, padding: "3px 8px 3px 6px", borderRadius: 8, background: "rgba(0,0,0,0.55)" }}>
                    <PlayIcon size={12} />
                    <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 12, color: K.cream }}>reel.mp4</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}

      {/* ×N counter under the stack */}
      {cnt > 0 ? (
        <div
          style={{
            position: "absolute",
            left: G.outX - 80,
            width: 160,
            top: 1384,
            zIndex: 34,
            display: "flex",
            justifyContent: "center",
            opacity: cnt,
            transform: `scale(${cntPop})`,
          }}
        >
          <div style={{ padding: "6px 16px", borderRadius: 999, background: "rgba(217,119,87,0.16)", border: "1.5px solid rgba(217,119,87,0.55)", fontFamily: MONO, fontWeight: 700, fontSize: 21, color: K.coralLight, whiteSpace: "nowrap" }}>
            ×{count} {count > 1 ? "reels" : "reel"}
          </div>
        </div>
      ) : null}
    </>
  );
};
