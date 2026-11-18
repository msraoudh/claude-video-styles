import type React from "react";
import { Img, interpolate, OffthreadVideo, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { K } from "../../edit/theme";
import { f } from "../../edit/time";
import { B, clamp, eio, eo, G, lerp } from "./beats";

/**
 * Beat A — « bien sûr، كان تحب برشا vidéos كيما هكّا يتعملو » (103.3–106.9)
 * The user's own reels: a tidy deck lands on « sûr », lifts on « كان تحب », FANS OUT like a hand of cards on « برشا »,
 * a second, dimmer row fans behind on « vidéos » (= even more), the centre reel (playing, ig-2) steps forward on
 * « كيما هكّا », every card riffles (3D flip to another reel) on « يتعملو ». On « تقلّو » the fan collapses into a deck on
 * the left; on « باللي عملتو » the deck is absorbed, batch by batch, into the SKILL.md card (each batch writes a step).
 */

const W = 140;
const H = 249;
const N = 13;
const C = 6; // centre card (plays a real reel)
const FRONT = ["trailer-1", "intro-2", "fr-1", "ep1-2", "trailer-3", "intro-1", "", "fr-3", "ep1-1", "trailer-2", "intro-3", "fr-4", "ep1-3"];
const BACKS = ["ep1-4", "fr-2", "intro-4", "trailer-4", "fr-4", "ep1-1", "", "intro-1", "trailer-2", "ep1-3", "fr-1", "intro-2", "trailer-3"];
const BACK_ROW = ["intro-3", "fr-2", "ep1-4", "trailer-4", "intro-4", "fr-3", "ep1-2", "trailer-1", "fr-1", "intro-1", "ep1-3", "trailer-2"];

const STEP = 3.6; // degrees between cards
const PIV = 900; // pivot distance below the card centres (hand-of-cards fan)
const DECK_L = { x: 168, y: 1284, s: 0.6 }; // collapsed deck (beat B)
const SINK = { x: 330, y: 1290 }; // where the deck dives into the SKILL.md card

/** z-rank: centre first, then alternating right/left outward. */
const rankOf = (i: number) => {
  const d = i - C;
  return d === 0 ? 0 : Math.abs(d) * 2 - (d > 0 ? 1 : 0);
};
const GROUP_AT = [B.belli + 2, B.belli + 8, B.belli + 14]; // 3238 / 3244 / 3250 → hits at +8
const groupOf = (rank: number) => (rank < 5 ? 0 : rank < 9 ? 1 : 2);
const groupStart = (rank: number) => [0, 5, 9][groupOf(rank)];
export const ABSORB_HITS = GROUP_AT.map((g) => g + 8); // SKILL.md writes a pipeline step on each hit

const Face: React.FC<{ name: string; back?: boolean; dim: number; hl: number }> = ({ name, back, dim, hl }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      borderRadius: 16,
      overflow: "hidden",
      backfaceVisibility: "hidden",
      WebkitBackfaceVisibility: "hidden",
      transform: back ? "rotateY(180deg)" : undefined,
      border: `1.5px solid ${hl > 0.01 ? `rgba(240,164,135,${0.35 + 0.6 * hl})` : K.stroke}`,
      boxShadow: `0 18px 36px rgba(0,0,0,0.6)${hl > 0.01 ? `, 0 0 ${40 * hl}px ${K.coralGlow}` : ""}`,
      background: K.bg1,
    }}
  >
    {name ? <Img src={staticFile(`thumbs/${name}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
    {/* gloss + dimming */}
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 38%)" }} />
    {dim > 0.01 ? <div style={{ position: "absolute", inset: 0, background: `rgba(15,11,9,${dim})` }} /> : null}
  </div>
);

export const Fan: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < B.sur - 2 || frame > ABSORB_HITS[2] + 6) return null;

  const lift = interpolate(frame, [B.kan, B.barcha - 1], [0, 1], clamp) * (1 - eo(frame, B.barcha, 6));
  const hlC = eo(frame, B.kima, 8) * (1 - eo(frame, B.tqollou, 8)); // centre steps forward « كيما هكّا »
  const swayT = (frame - B.barcha) / 30;
  const backIn = (k: number) => spring({ frame: frame - B.videos - Math.abs(k - 5.5) * 0.8, fps, config: { damping: 15, stiffness: 140, mass: 0.8 } });
  const backOut = eo(frame, B.tqollou - 2, 9);

  const cards: React.ReactNode[] = [];

  // back row (« vidéos » → even more), behind the front fan
  if (frame >= B.videos - 1 && backOut < 1) {
    for (let k = 0; k < 12; k++) {
      const s = backIn(k);
      const ang = (k - 5.5) * 5.4 * s + Math.sin(swayT * 1.7 + 1) * 1.1;
      const D = PIV + 110;
      const x = G.cx + Math.sin((ang * Math.PI) / 180) * D;
      const y = G.cy - 62 + D - Math.cos((ang * Math.PI) / 180) * D;
      const xx = lerp(x, DECK_L.x, backOut);
      const yy = lerp(y, DECK_L.y, backOut);
      cards.push(
        <div
          key={`b${k}`}
          style={{
            position: "absolute",
            left: xx - W / 2,
            top: yy - H / 2,
            width: W,
            height: H,
            zIndex: 1,
            opacity: Math.min(1, s * 1.4) * (1 - backOut),
            transform: `rotate(${ang}deg) scale(${(0.8 + 0.04 * s) * (1 - 0.4 * backOut)})`,
          }}
        >
          <Face name={BACK_ROW[k]} dim={0.42} hl={0} />
        </div>,
      );
    }
  }

  for (let i = 0; i < N; i++) {
    const d = i - C;
    const ad = Math.abs(d);
    const r = random(`bonus-fan-${i}`) - 0.5;
    const rank = rankOf(i);

    // 1 · deck lands (« sûr »)
    const pIn = eo(frame, B.sur - 1 + rank * 0.45, 8);
    // 2 · fan out (« برشا »)
    const s = spring({ frame: frame - B.barcha - ad * 0.7, fps, config: { damping: 13, stiffness: 150, mass: 0.8 } });
    const spread = 1 + 0.3 * hlC * (d === 0 ? 0 : 1);
    const ang = d * STEP * spread + Math.sin(swayT * 1.5) * 1.2;
    const rad = (ang * Math.PI) / 180;
    const fx = G.cx + Math.sin(rad) * PIV;
    const fy = G.cy + PIV - Math.cos(rad) * PIV;
    const side = d === 0 ? 0 : d > 0 ? 1 : -1;
    const deckRot = r * 11 + side * rank * 0.35 + lift * d * 0.6 + Math.sin((frame - B.kan) / 4) * 1.2 * lift * side;
    let x = lerp(G.cx + side * rank * 2.6, fx, s);
    let y = lerp(G.cy + rank * 2.2 - lift * 14, fy, s) + (1 - pIn) * 30;
    let rot = lerp(deckRot, ang, s);
    let sc = (0.96 + 0.04 * pIn) * (1 + lift * 0.03);
    if (d === 0) {
      sc *= 1 + 0.2 * hlC;
      y -= 26 * hlC;
    }
    // float
    y += Math.sin(frame / 19 + i * 1.3) * 3 * s;

    // 3 · riffle flip (« يتعملو »), left → right, centre stays
    const flip = d === 0 ? 0 : 180 * eio(frame, B.yit3amlou + i * 0.85, 8);

    // 4 · collapse into a deck on the left (« تقلّو »)
    const col = eo(frame, B.tqollou + rank * 0.45, 11);
    x = lerp(x, DECK_L.x + side * rank * 2.4, col);
    y = lerp(y, DECK_L.y + rank * 2.2, col);
    rot = lerp(rot, r * 14, col);
    sc = lerp(sc, DECK_L.s, col);

    // 5 · absorbed into SKILL.md (« باللي عملتو »)
    const t0 = GROUP_AT[groupOf(rank)] + (rank - groupStart(rank)) * 1.1;
    const a = eio(frame, t0, 8);
    if (a >= 1) continue;
    x = lerp(x, SINK.x, a);
    y = lerp(y, SINK.y, a) - Math.sin(Math.PI * a) * 46;
    sc *= 1 - 0.82 * a;
    rot = lerp(rot, rot + 25, a);
    const op = pIn * (1 - a * a);

    const dim = d === 0 ? 0 : 0.45 * hlC;
    const hl = d === 0 ? Math.max(hlC, 0.35 * s * (1 - col)) : 0;
    cards.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: x - W / 2,
          top: y - H / 2,
          width: W,
          height: H,
          zIndex: a > 0 ? 40 : 15 - rank,
          opacity: op,
          transform: `rotate(${rot}deg) scale(${sc})`,
          filter: pIn < 1 ? `blur(${(1 - pIn) * 6}px)` : undefined,
        }}
      >
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `perspective(700px) rotateY(${flip}deg)` }}>
          {d === 0 ? (
            <div style={{ position: "absolute", inset: 0, borderRadius: 16, overflow: "hidden", border: `1.5px solid rgba(240,164,135,${0.35 + 0.6 * hl})`, boxShadow: `0 20px 40px rgba(0,0,0,0.65), 0 0 ${16 + 44 * hl}px ${K.coralGlow}`, background: K.bg1 }}>
              <Sequence from={B.sur - 2} durationInFrames={ABSORB_HITS[2] + 8 - (B.sur - 2)} layout="none">
                <OffthreadVideo src={staticFile("thumbs/ig-2.mp4")} muted trimBefore={f(21)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </Sequence>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0) 38%)" }} />
            </div>
          ) : (
            <>
              <Face name={FRONT[i]} dim={dim} hl={0} />
              <Face name={BACKS[i]} back dim={dim} hl={0} />
            </>
          )}
        </div>
      </div>,
    );
  }

  // warm light pooled under the fan
  const glowOp = eo(frame, B.sur, 10) * (1 - eo(frame, B.tqollou, 10)) * (0.5 + 0.15 * Math.sin(frame / 11));
  return (
    <>
      <div style={{ position: "absolute", left: G.cx - 380, top: G.cy - 170, width: 760, height: 360, borderRadius: "50%", background: K.coralGlow, filter: "blur(90px)", opacity: glowOp, zIndex: 0 }} />
      {cards}
    </>
  );
};
