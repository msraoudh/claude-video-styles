// HERO · 1577–1644 — « LES 1000 VERSIONS DE LUI »: a wall of his reels (9×11 tiles, each one a real reel /
// outfit) turns over in a radial wave from the centre on the downbeat 1577 (code-slice flip again — the
// visual rhyme of the name reveal) while the camera pulls back. 1610 (beat): a depth ripple + his numbers.
import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { bassShake, beatPulse, rand, useGlobalFrame } from "../../lib/beat";
import { L } from "../../lib/look";
import { Dust, makeTiles, TileSurface, type Tile, type TilePose } from "./gl";
import { Big, cl, ease, GlassRing, glassShadow, IN_OUT, Mono, OUT, Pop } from "./fx";
import { lerpCam, planeMatrix, smooth, Stage, useImageTexture, type Cam } from "./stage3d";
import { T } from "./timeline";
import wallUrl from "./assets/reel-wall.jpg";

const CW = 180;
const CH = 320;
const COLS = 9;
const ROWS = 11;
const W = CW * COLS;
const H = CH * ROWS;
const TILES = makeTiles(COLS, ROWS, W, H);
const D_MAX = Math.hypot(4, 5);
const START = T.wall + 1;
const SPAN = 28;
const CORE = 1.2; // the 3x3 centre is already turned on the cut

const hash = (a: number, b: number) => {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

const C0: Cam = { pos: [0, 60, 1750], target: [0, 0, 0], fov: 40, roll: -3 };
const C1: Cam = { pos: [-520, -260, 5600], target: [0, -40, 0], fov: 40, roll: 2 };

const pose = (t: Tile, g: number): TilePose => {
  const d = Math.hypot(t.cx / CW, t.cy / CH);
  const rank = Math.min(1, Math.max(0, (d - CORE) / (D_MAX - CORE)));
  const pass = d < CORE ? START - 40 : START + Math.pow(rank, 0.75) * SPAN + hash(t.col, t.row) * 1.5;
  const p = Math.min(1, Math.max(0, (g - pass) / 18));
  const turn = smooth(p / 0.64);
  const ringT = Math.min(1, Math.max(0, (p - 0.64) / 0.36));
  const ringEnv = smooth(ringT / 0.12) * Math.exp(-3.3 * ringT) * (1 - smooth((ringT - 0.72) / 0.28));
  const bounce = 0.2 * 36 * Math.sin(ringT * Math.PI * 3.3) * ringEnv;
  const flight = Math.pow(Math.sin(Math.PI * p), 0.7);
  // the travelling ring of the depth field
  const u = Math.min(1, Math.max(0, (g - START) / SPAN));
  const ringR = CORE + Math.pow(u, 1 / 0.75) * (D_MAX - CORE);
  const running = g >= START - 2 && g <= START + SPAN + 8;
  const pull = running ? Math.exp(-Math.pow((d - ringR) / 1.2, 2)) * (1 - smooth(p / 0.4)) : 0;
  // the 1610 beat: a depth ripple through the finished wall
  const ra = g - T.stats;
  const rip = ra >= 0 && ra < 46 ? Math.exp(-Math.pow((d - ra * 0.22) / 0.9, 2)) * Math.exp(-ra / 18) : 0;
  const ry = 180 * turn + bounce + pull * 10 * Math.sign(t.cx || 1);
  return {
    x: 0,
    y: 0,
    z: 70 * flight + 50 * pull + 60 * rip,
    rx: -pull * 14 * Math.sign(t.cy || 1) + rip * 8 * Math.sign(t.cy || 1),
    ry,
    rz: (hash(t.col + 3, t.row) - 0.5) * 6 * flight,
    scale: 1 - 0.04 * Math.max(flight, rip),
    formation: Math.max(flight, pull, rip * 0.8),
    shade: 1 - 0.14 * Math.abs(Math.sin((ry * Math.PI) / 180)),
    front: 0,
    rear: 1,
    glow: 0.12 * flight + 0.1 * rip,
  };
};

const Stats: React.FC<{ g: number }> = ({ g }) => {
  if (g < T.stats) return null;
  const k = ease(g, T.stats, T.stats + 8, 0, 1);
  const y = ease(g, T.stats, T.stats + 12, 26, 0);
  const n = Math.round(interpolate(g, [T.stats, T.stats + 14], [0, 52], { ...cl, easing: OUT }));
  const l2 = ease(g, T.stats + 10, T.stats + 16, 0, 1);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 700 + y,
          width: 780,
          height: 470,
          borderRadius: 40,
          overflow: "hidden",
          background: "linear-gradient(150deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.04)), rgba(6,9,18,0.62)",
          backdropFilter: "blur(16px) saturate(1.2)",
          WebkitBackdropFilter: "blur(16px) saturate(1.2)",
          boxShadow: glassShadow([125, 211, 252], [167, 139, 250], 1),
          opacity: k,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 26 }}>
          <Big size={250} ls={-0.06} style={{ fontVariantNumeric: "tabular-nums" }}>
            {n}
          </Big>
          <Mono size={48} color={L.steel} ls={0.2} weight={700}>
            reels
          </Mono>
        </div>
        <div style={{ height: 2, width: 560, margin: "30px 0 26px", background: "linear-gradient(90deg, rgba(230,237,247,0), rgba(230,237,247,0.4), rgba(230,237,247,0))" }} />
        <div style={{ opacity: l2, display: "flex", gap: 22 }}>
          <Mono size={30} color={L.steel} ls={0.18} weight={700}>
            4 900 abonnés
          </Mono>
          <Mono size={30} color={L.violet} ls={0.18} weight={700}>
            ·
          </Mono>
          <Mono size={30} color={L.steel} ls={0.18} weight={700}>
            134K vues
          </Mono>
        </div>
        <GlassRing radius={40} />
      </div>
    </AbsoluteFill>
  );
};

export const Wall: React.FC = () => {
  const g = useGlobalFrame();
  const tex = useImageTexture(wallUrl);
  const cam = lerpCam(C0, C1, interpolate(g, [T.wall, T.m2a - 2], [0, 1], { ...cl, easing: Easing.bezier(0.45, 0.05, 0.25, 1) }));
  const rot = ease(g, T.wall, T.m2a, 0, 1, IN_OUT);
  const wall = planeMatrix([0, 0, 0], [-6 * rot, 16 * rot, -2 * rot]);
  const sh = bassShake(g, 6);
  const kick = beatPulse(g, 9);
  return (
    <Stage
      cam={cam}
      shake={{ x: sh.x + (rand(g * 1.9) - 0.5) * 12 * kick, y: sh.y + (rand(g * 3.1) - 0.5) * 12 * kick, r: sh.r }}
      background={<AbsoluteFill style={{ background: `radial-gradient(70% 50% at 50% 45%, rgba(60,80,150,0.22), rgba(0,0,0,0) 70%), ${L.ink}` }} />}
      three={
        <>
          <TileSurface tiles={TILES} W={W} H={H} depth={22} matrix={wall} pose={(t) => pose(t, g)} texP={tex} edge={0.6} />
          <Dust frame={g} count={300} seed={11} box={{ x: [-2600, 2600], y: [-2600, 2600], z: [-2000, 4500] }} size={[5, 14]} focus={Math.max(1500, cam.pos[2])} blur={2} amount={0.8} />
        </>
      }
      screen={
        <>
          <Pop f={g} at={T.wall} peak={0.1} />
          <Pop f={g} at={T.stats} peak={0.06} />
          <Stats g={g} />
        </>
      }
    />
  );
};
