import { Video } from "@remotion/media";
import type React from "react";
import { AbsoluteFill, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE } from "../../edit/kit";
import { layoutAt, MODES, WALL_TILE } from "../../edit/layout";
import { K, MONO, SERIF } from "../../edit/theme";
import { f, wf } from "../../edit/time";

/**
 * « الـ reels هذوما » (0.6–2.62 s): the user's own shot is the centre card (layout mode "wall", drawn by Face at
 * WALL_TILE); around it a 3D cover-flow of their LAST 4 Instagram reels (ig-1..4, newest first), each PLAYING its
 * liveliest seconds. The cards live in a container clipped with a hole = the face box, so anything "behind" the
 * centre card (entering, turning, flying out) is hidden by it — the user's shot reads as one reel among the reels.
 */
export const W0 = f(0.6); // face starts shrinking (layout)
export const W1 = f(2.62); // face zooms back
export const REELS_AT = wf("reels", 0.7);
export const TURN_AT = wf("motion", 1.34);
export const FLY_OUT = f(2.5);

const CX = WALL_TILE.x + WALL_TILE.w / 2; // 540
const CY = WALL_TILE.y + WALL_TILE.h / 2; // 866.5
const PERSP = 1400;

type Pose = { dx: number; dy: number; z: number; rot: number; w: number };
const L2: Pose = { dx: -524, dy: -46, z: -260, rot: 42, w: 210 };
const L1: Pose = { dx: -305, dy: 10, z: -60, rot: 32, w: 210 };
const R1: Pose = { ...L1, dx: -L1.dx, rot: -L1.rot };
const R2: Pose = { ...L2, dx: -L2.dx, rot: -L2.rot };
/** closed loop: L2 → L1 → (behind the centre card) → R1 → R2 → (far behind) → L2 */
const PATH: [number, Pose][] = [
  [0, L2],
  [1, L1],
  [1.33, { dx: -180, dy: -4, z: -320, rot: 16, w: 210 }],
  [1.5, { dx: 0, dy: -12, z: -420, rot: 0, w: 210 }],
  [1.67, { dx: 180, dy: -4, z: -320, rot: -16, w: 210 }],
  [2, R1],
  [3, R2],
  [3.33, { dx: 360, dy: -70, z: -640, rot: -28, w: 210 }],
  [3.5, { dx: 0, dy: -80, z: -820, rot: 0, w: 210 }],
  [3.67, { dx: -360, dy: -70, z: -640, rot: 28, w: 210 }],
  [4, L2],
];
const poseAt = (u: number): Pose => {
  const v = ((u % 4) + 4) % 4;
  for (let i = 0; i < PATH.length - 1; i++) {
    const [a, pa] = PATH[i];
    const [b, pb] = PATH[i + 1];
    if (v >= a && v <= b) {
      const k = (v - a) / (b - a);
      const m = (x: keyof Pose) => pa[x] + (pb[x] - pa[x]) * k;
      return { dx: m("dx"), dy: m("dy"), z: m("z"), rot: m("rot"), w: m("w") };
    }
  }
  return L2;
};

/** the user's last 4 reels (newest first) and the liveliest seconds of each (from refs/mine/sheet-ig-N.jpg at 4 fps) */
const CARDS = [
  { src: "ig-1", seg: 3.7, slot: 0, enter: REELS_AT, note: "TOI. → EN 2026 → L'IA CODE → −42" },
  { src: "ig-2", seg: 20.2, slot: 1, enter: REELS_AT + 4, note: "Alors… MONTE → flash → 01" },
  { src: "ig-3", seg: 16.4, slot: 2, enter: REELS_AT + 6, note: "la porte junior se ferme → s'ouvre (green flash)" },
  { src: "ig-4", seg: 33.9, slot: 3, enter: REELS_AT + 2, note: "Claude pour m'aider (spark + Claude card)" },
];
export const CARD_POPS = CARDS.map((c) => c.enter + 6);

const io = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/** rounded-rect hole (evenodd) = current face box, in the container's coordinates */
const holePath = (b: { x: number; y: number; w: number; h: number; r: number }) => {
  const { x, y, w, h } = b;
  const r = Math.max(0, Math.min(b.r, w / 2, h / 2));
  return `path(evenodd, "M-400 -400 H1480 V2320 H-400 Z M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z")`;
};

const ReelCard: React.FC<{ i: number }> = ({ i }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = CARDS[i];
  const left = c.slot <= 1;
  // entrance: slides in from its side (spring), turn: one slot along the loop, drift: slow sway
  const sp = spring({ frame: frame - c.enter, fps, config: { damping: 15, stiffness: 120, mass: 0.8 } });
  const turn = io((frame - TURN_AT) / 20);
  const u = c.slot + turn;
  const base = poseAt(u);
  const side = Math.sign(base.dx) || (left ? -1 : 1);
  const drift = Math.sin(frame / 26 + i * 1.7);
  const out = EASE((frame - FLY_OUT) / 15);
  const dx = base.dx + side * (1 - sp) * 820 + side * out * 640;
  const z = base.z + (1 - sp) * 60 + out * 120;
  const rot = base.rot + side * (1 - sp) * 34 + drift * 3 + side * out * 26;
  const dy = base.dy + Math.cos(frame / 31 + i) * 7 - out * 30;
  const w = base.w;
  const h = (w * 16) / 9;
  // speed (for a touch of motion blur during the turn)
  const speed = Math.abs(io((frame + 1 - TURN_AT) / 20) - io((frame - 1 - TURN_AT) / 20));
  const blur = speed * 28 + (1 - sp) * 6 + out * 9;
  const dim = interpolate(z, [-820, -300, -60], [0.45, 0.72, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const vis = Math.min(1, Math.max(0, (frame - c.enter) / 4)) * (1 - out);
  const push = 1 + Math.max(0, frame - c.enter) * 0.0009;
  const playP = Math.min(1, Math.max(0, (frame - c.enter) / (W1 - c.enter)));
  return (
    <div
      style={{
        position: "absolute",
        left: CX - w / 2,
        top: CY - h / 2,
        width: w,
        height: h,
        zIndex: Math.round(2000 + z),
        opacity: vis,
        transform: `translate3d(${dx}px, ${dy}px, ${z}px) rotateY(${rot}deg)`,
        filter: `brightness(${dim})${blur > 0.3 ? ` blur(${blur.toFixed(2)}px)` : ""}`,
        WebkitBoxReflect: "below 18px linear-gradient(transparent 58%, rgba(255,255,255,0.26))",
      }}
    >
      {/* coral glass frame */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 26,
          padding: 7,
          background: "linear-gradient(150deg, rgba(255,205,180,0.34), rgba(217,119,87,0.12) 45%, rgba(36,26,21,0.78))",
          border: "1.5px solid rgba(240,164,135,0.7)",
          boxShadow: "0 0 34px rgba(217,119,87,0.38), 0 26px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,236,220,0.35)",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 19, overflow: "hidden", background: K.bg0 }}>
          <Sequence from={c.enter - 4} durationInFrames={W1 + 16 - (c.enter - 4)} layout="none" name={`${c.src} @${c.seg}s`}>
            <Video
              src={staticFile(`thumbs/${c.src}.mp4`)}
              trimBefore={Math.round(c.seg * 30)}
              muted
              objectFit="cover"
              style={{ width: "100%", height: "100%", transform: `scale(${push})` }}
            />
          </Sequence>
          {/* glass sheen + play progress */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(125deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 32%)" }} />
          <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, height: 4, borderRadius: 2, background: "rgba(255,236,220,0.22)" }}>
            <div style={{ width: `${playP * 100}%`, height: "100%", borderRadius: 2, background: K.coral, boxShadow: `0 0 8px ${K.coralGlow}` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

/** coral glass frame + glow around the user's own shot (follows the morphing face box) and its floor reflection */
const CentreFrame: React.FC = () => {
  const frame = useCurrentFrame();
  const { box, face } = layoutAt(frame);
  const wall = 1 - face;
  if (wall < 0.01) return null;
  const pad = 7;
  return (
    <div
      style={{
        position: "absolute",
        left: box.x - pad,
        top: box.y - pad,
        width: box.w + pad * 2,
        height: box.h + pad * 2,
        borderRadius: box.r + pad,
        border: "2px solid rgba(240,164,135,0.85)",
        boxShadow: `0 0 0 1px rgba(255,236,220,0.18) inset, 0 0 60px rgba(217,119,87,${0.55 * wall}), 0 0 140px rgba(217,119,87,${0.25 * wall})`,
        opacity: wall,
        zIndex: 3000,
      }}
    >
      {/* tiny live tag on the frame (top-left, on the wall of the shot, never on the face) */}
      <div
        style={{
          position: "absolute",
          left: 18,
          top: -17,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "5px 12px",
          borderRadius: 999,
          background: "rgba(15,11,9,0.9)",
          border: "1.5px solid rgba(240,164,135,0.7)",
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 17,
          letterSpacing: "0.14em",
          color: K.cream,
        }}
      >
        <div style={{ width: 9, height: 9, borderRadius: 5, background: K.coral, opacity: Math.floor(frame / 8) % 2 ? 0.35 : 1 }} />
        CE REEL
      </div>
    </div>
  );
};

/** the user's own shot, mirrored on the floor under the centre card (same source + push as Face) */
const CentreReflection: React.FC = () => {
  const frame = useCurrentFrame();
  const { box, face } = layoutAt(frame);
  const wall = 1 - face;
  if (wall < 0.01) return null;
  let t0 = 0;
  for (const [t] of MODES) if (frame >= f(t)) t0 = f(t);
  const push = 1 + Math.min(0.06, ((frame - t0) / 30) * 0.012);
  const s = box.w / 1080;
  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y + box.h + 18,
        width: box.w,
        height: box.h * 0.42,
        overflow: "hidden",
        borderRadius: box.r,
        opacity: 0.55 * wall,
        WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0) 100%)",
        maskImage: "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0) 100%)",
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, width: box.w, height: box.h, transform: "scaleY(-1)", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `scale(${s}) translate(560px, 760px) scale(${push}) translate(-560px, -760px)` }}>
          <Video src={staticFile("footage/talk-v1.mp4")} trimBefore={W0 - 2} muted style={{ width: 1080, height: 1920, filter: "contrast(1.06) saturate(1.04) brightness(0.9) sepia(0.06)" }} />
        </div>
      </div>
    </div>
  );
};

/** small meta label above the centre card (real data) */
const Header: React.FC = () => {
  const frame = useCurrentFrame();
  const p = EASE((frame - (REELS_AT + 8)) / 8);
  const q = EASE((frame - FLY_OUT) / 7);
  const v = p * (1 - q);
  if (v <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 322,
        display: "flex",
        justifyContent: "center",
        opacity: v,
        transform: `translateY(${(1 - p) * 14 - q * 20}px)`,
        filter: v < 1 ? `blur(${(1 - v) * 6}px)` : undefined,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: MONO, fontWeight: 700, fontSize: 23, letterSpacing: "0.18em", color: K.muted }}>
        <span style={{ color: K.coral }}>@yourhandle</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>4 DERNIERS REELS</span>
      </div>
    </div>
  );
};

/** soft coral floor light under the carousel (sells the reflections) */
const Floor: React.FC = () => {
  const frame = useCurrentFrame();
  const { face } = layoutAt(frame);
  const wall = 1 - face;
  if (wall < 0.01) return null;
  return (
    <>
      <div style={{ position: "absolute", left: 40, right: 40, top: 1150, height: 260, borderRadius: "50%", background: "radial-gradient(ellipse at 50% 30%, rgba(217,119,87,0.22), rgba(217,119,87,0) 70%)", opacity: wall }} />
      <div style={{ position: "absolute", left: 90, right: 90, top: 1226, height: 2, background: "linear-gradient(90deg, transparent, rgba(240,164,135,0.45), transparent)", opacity: wall * 0.7 }} />
    </>
  );
};

export const MOTION_CHIP_AT = TURN_AT;

export const Carousel: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < W0 - 2 || frame > W1 + 16) return null;
  const { box } = layoutAt(frame);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Floor />
      <Sequence from={W0 - 2} durationInFrames={W1 + 18 - W0} layout="none" name="centre reflection">
        <CentreReflection />
      </Sequence>
      <AbsoluteFill style={{ perspective: PERSP, perspectiveOrigin: `${CX}px ${CY}px`, clipPath: holePath(box) }}>
        {CARDS.map((_, i) => (
          <ReelCard key={i} i={i} />
        ))}
      </AbsoluteFill>
      <CentreFrame />
      <Header />
    </AbsoluteFill>
  );
};

/** « motion graphics » chip above the centre card (wall phase); flies to the left of the head when the face zooms back */
export const MotionChipWall: React.FC = () => {
  const frame = useCurrentFrame();
  const p = EASE((frame - MOTION_CHIP_AT) / 7);
  const fly = io((frame - (W1 - 4)) / 12);
  if (frame < MOTION_CHIP_AT || fly >= 1) return null;
  const x = interpolate(fly, [0, 1], [540, 128]);
  const y = interpolate(fly, [0, 1], [452, 500]);
  const s = interpolate(fly, [0, 1], [1, 0.42]);
  const o = p * (1 - EASE((fly - 0.7) / 0.3));
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) translateY(${(1 - p) * 14}px) scale(${(0.96 + 0.04 * p) * s})`,
        opacity: o,
        filter: p < 1 || fly > 0 ? `blur(${(1 - p) * 6 + fly * 4}px)` : undefined,
        zIndex: 4000,
      }}
    >
      <div
        style={{
          padding: "6px 34px 12px",
          borderRadius: 999,
          background: "linear-gradient(150deg, rgba(255,236,220,0.1), rgba(255,236,220,0.02) 60%), rgba(36,26,21,0.72)",
          border: "1.5px solid rgba(217,119,87,0.55)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.5), 0 0 40px rgba(217,119,87,0.3)",
          fontFamily: SERIF,
          fontSize: 66,
          lineHeight: 1.1,
          color: K.coral,
          whiteSpace: "nowrap",
        }}
      >
        motion graphics
      </div>
    </div>
  );
};

export const carouselCueNotes = CARDS.map((c) => `${c.src} pop`);
