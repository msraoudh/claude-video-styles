// HERO · 1295–1577 — « HE BUILDS ». Right after « j'avais les idées de fou », the ideas he actually built:
// his real work screens as liquid-glass monitors orbiting a fibonacci dot sphere (the "mind" — orbit-card
// technique), the camera flying station to station on the bars. Intercut with two face shots (music only).
//   1295 n8n  ·  1354 face  ·  1383 secrétaire IA (SUCCESS on 1415)  ·  1447 face  ·  1479 Blender × Claude  ·  1545 reverse engineering
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { Shot } from "../../components/Shot";
import { bassShake, beatPulse, rand, useGlobalFrame } from "../../lib/beat";
import { L } from "../../lib/look";
import { DotSphere, Dust } from "./gl";
import { At, cl, ease, GlassRing, glassShadow, GlitchBands, IN_OUT, Mono, OUT, Pop, type RGB, TypeOn } from "./fx";
import { Cuts, type Cut } from "./Montage";
import { CssPlane, Occluder, planeMatrix, project, Stage, type Cam, type V3 } from "./stage3d";
import { T } from "./timeline";

const RR = 2100; // ring radius of the stations
const SPHERE_R = 1250;
const DEG = Math.PI / 180;

type Screen = { clip: string; at: number; w: number; h: number; local: V3; rotY: number; dark?: boolean };
type Station = { theta: number; accent: RGB; idx: string; label: string; sub: string; screens: Screen[] };

const WIDE_W = 940;
const WIDE_H = Math.round((940 * 860) / 1080); // 748
const DRAGON_H = Math.round((940 * 840) / 1080);

/** n8n + the executions table are white UIs: shown in "dark mode" (inverted, hues restored) so they live in the night */
const DARK_UI = "invert(0.93) hue-rotate(180deg) contrast(1.12) saturate(1.35) brightness(0.92)";

const STATIONS: Station[] = [
  {
    theta: 0,
    accent: [182, 255, 59],
    idx: "01",
    label: "AUTOMATION · n8n",
    sub: "Workflows · agents IA",
    screens: [
      { clip: "s04", at: 0.2, w: WIDE_W, h: WIDE_H, local: [0, 0, 0], rotY: 0, dark: true },
      { clip: "s01", at: 0.6, w: 560, h: 446, local: [600, 470, -420], rotY: -16, dark: true },
    ],
  },
  {
    theta: 90,
    accent: [167, 139, 250],
    idx: "02",
    label: "SECRÉTAIRE IA",
    sub: "MedSec · ElevenLabs",
    screens: [
      { clip: "s05", at: 0.3, w: WIDE_W, h: WIDE_H, local: [0, 0, 0], rotY: 0, dark: true },
      { clip: "s03", at: 0.8, w: 560, h: 446, local: [-610, -470, -420], rotY: 16, dark: true },
    ],
  },
  {
    theta: 180,
    accent: [255, 150, 80],
    idx: "03",
    label: "BLENDER × CLAUDE",
    sub: "Généré avec Claude Opus",
    screens: [
      { clip: "s07", at: 0.15, w: WIDE_W, h: DRAGON_H, local: [0, 0, 0], rotY: 0 },
      { clip: "s06", at: 1.4, w: 560, h: 436, local: [590, 450, -420], rotY: -16 },
    ],
  },
  {
    theta: 270,
    accent: [125, 211, 252],
    idx: "04",
    label: "REVERSE ENGINEERING",
    sub: "Craft apps",
    screens: [
      { clip: "s08", at: 0.4, w: 560, h: 996, local: [-150, 0, 0], rotY: 4 },
      { clip: "s09", at: 1.0, w: 470, h: 836, local: [380, 90, -380], rotY: -12 },
    ],
  },
];

const stationMatrix = (s: Station) => planeMatrix([Math.sin(s.theta * DEG) * RR, 0, Math.cos(s.theta * DEG) * RR], [0, s.theta, 0]);

/** camera on a cylinder around the sphere: angle phi (deg), radius rc, height h, looking at station screen height ty */
const orbitCam = (phi: number, rc: number, h: number, look: V3, roll = 0, fov = 40): Cam => ({
  pos: [Math.sin(phi * DEG) * rc, h, Math.cos(phi * DEG) * rc],
  target: look,
  fov,
  roll,
});
const lookAtStation = (theta: number, y = -140, inward = 0): V3 => [Math.sin(theta * DEG) * (RR - inward), y, Math.cos(theta * DEG) * (RR - inward)];

type Flight = { from: number; to: number; settle: number; phi: [number, number, number]; rc: [number, number, number]; h: [number, number, number]; theta: number; roll?: [number, number]; ty?: number };

const FLIGHTS: Flight[] = [
  { from: T.w1, to: T.f1, settle: T.w1 + 26, theta: 0, phi: [-26, 6, 10], rc: [6000, 5150, 4980], h: [760, 170, 120], roll: [-6, 0] },
  { from: T.w2, to: T.f2, settle: T.w2 + 24, theta: 90, phi: [62, 96, 100], rc: [5800, 5150, 4960], h: [-420, 150, 110], roll: [5, 0] },
  { from: T.w3, to: T.w4, settle: T.w3 + 26, theta: 180, phi: [152, 186, 190], rc: [5900, 5100, 4900], h: [-620, 120, 80], roll: [-4, 0] },
  { from: T.w4, to: T.wall, settle: T.w4 + 15, theta: 270, phi: [238, 263, 266], rc: [5500, 4800, 4700], h: [600, 60, 40], roll: [7, 0], ty: -40 },
];

const camAt = (g: number): { cam: Cam; fl: Flight } => {
  const fl = FLIGHTS.find((f) => g >= f.from && g < f.to) ?? FLIGHTS[0];
  const a = ease(g, fl.from, fl.settle, 0, 1, OUT);
  const b = ease(g, fl.settle, fl.to, 0, 1, IN_OUT);
  const v = (k: [number, number, number]) => (g < fl.settle ? k[0] + (k[1] - k[0]) * a : k[1] + (k[2] - k[1]) * b);
  const roll = fl.roll ? fl.roll[0] + (fl.roll[1] - fl.roll[0]) * a : 0;
  const phi = v(fl.phi);
  // the look point slides with the flight so the screen is framed upper-middle
  const look = lookAtStation(fl.theta, fl.ty ?? -150);
  return { cam: orbitCam(phi, v(fl.rc), v(fl.h), look, roll), fl };
};

const angDist = (a: number, b: number) => {
  const d = (((a - b) % 360) + 540) % 360 - 180;
  return Math.abs(d);
};

/* ───────── the glass monitor (CSS3D, under the canvas) ───────── */
const Monitor: React.FC<{ s: Screen; st: Station; parent: ReturnType<typeof planeMatrix>; g: number; hot: number }> = ({ s, st, parent, g, hot }) => {
  const m = planeMatrix(s.local, [0, s.rotY, 0], 1, parent);
  const pad = 16;
  const k = 0.7 + 0.6 * hot + 0.3 * beatPulse(g, 14);
  const scan = st.idx === "02" ? interpolate(g, [T.w2hit, T.w2hit + 26], [0, 1], cl) : 0;
  return (
    <CssPlane matrix={m} w={s.w + pad * 2} h={s.h + pad * 2}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 30,
          background: "linear-gradient(150deg, rgba(190,210,255,0.22) 0%, rgba(30,40,70,0.6) 26%, rgba(6,9,18,0.94) 70%, rgba(140,160,230,0.16) 100%)",
          boxShadow: glassShadow(st.accent, [125, 211, 252], k),
        }}
      >
        <div style={{ position: "absolute", left: pad, top: pad, width: s.w, height: s.h, borderRadius: 16, overflow: "hidden", background: "#000" }}>
          <Shot clip={s.clip} at={s.at} speed={1} grade="screen" filter={s.dark ? DARK_UI : "brightness(1.05)"} focus="50% 50%" />
          {/* glass reflection + faint scanlines: it is a screen in a dark room */}
          <AbsoluteFill style={{ background: "linear-gradient(125deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 32%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.05) 100%)" }} />
          <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 4px)", opacity: 0.5 }} />
          {scan > 0 && scan < 1 ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: `${scan * 100}%`, height: 3, background: L.acid, boxShadow: `0 0 24px 6px rgba(182,255,59,0.45)` }} />
          ) : null}
          <AbsoluteFill style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.65)" }} />
        </div>
        <GlassRing radius={30} accent={st.accent} />
      </div>
    </CssPlane>
  );
};

/* ───────── labels (CSS3D, over the canvas) ───────── */
const Label: React.FC<{ st: Station; parent: ReturnType<typeof planeMatrix>; g: number; start: number; cps: number }> = ({ st, parent, g, start, cps }) => {
  const main = st.screens[0];
  const x = main.local[0] - main.w / 2 + 380;
  const y = main.local[1] - main.h / 2 - 78;
  const o = ease(g, start, start + 6, 0, 1);
  const col = `rgb(${st.accent.join(",")})`;
  return (
    <>
      <CssPlane matrix={planeMatrix([x, y, 30], [0, main.rotY, 0], 1, parent)} w={760} h={56} opacity={o}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: col, boxShadow: `0 0 14px ${col}` }} />
          <Mono size={42} color={L.steel} ls={0.2} weight={700} style={{ textTransform: "none" }}>
            <TypeOn text={st.label} f={g} start={start} cps={cps} cursor={col} />
          </Mono>
        </div>
      </CssPlane>
      <CssPlane matrix={planeMatrix([x, y - 52, 30], [0, main.rotY, 0], 1, parent)} w={760} h={40} opacity={o * ease(g, start + 8, start + 14, 0, 1)}>
        <Mono size={26} color={L.steel2} ls={0.3} style={{ paddingLeft: 30 }}>
          {st.idx} / 04 · {st.sub}
        </Mono>
      </CssPlane>
    </>
  );
};

const SuccessChip: React.FC<{ parent: ReturnType<typeof planeMatrix>; g: number }> = ({ parent, g }) => {
  if (g < T.w2hit) return null;
  const s = ease(g, T.w2hit, T.w2hit + 8, 0.6, 1);
  const o = ease(g, T.w2hit, T.w2hit + 4, 0, 1);
  return (
    <CssPlane matrix={planeMatrix([WIDE_W / 2 - 150, WIDE_H / 2 + 10, 60], [0, 0, 0], 1, parent)} w={330} h={70} opacity={o}>
      <div
        style={{
          transform: `scale(${s})`,
          height: 70,
          borderRadius: 35,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          background: "rgba(10,16,10,0.72)",
          border: "1px solid rgba(182,255,59,0.55)",
          boxShadow: "0 0 40px rgba(182,255,59,0.35), inset 0 1px 0 rgba(255,255,255,0.3)",
        }}
      >
        <div style={{ width: 14, height: 14, borderRadius: 7, background: L.acid, boxShadow: `0 0 12px ${L.acid}` }} />
        <Mono size={28} color={L.acid} ls={0.24} weight={700}>
          Success ✓
        </Mono>
      </div>
    </CssPlane>
  );
};

const World: React.FC = () => {
  const g = useGlobalFrame();
  const { cam, fl } = camAt(g);
  const phi = Math.atan2(cam.pos[0], cam.pos[2]) / DEG;
  const visible = STATIONS.filter((s) => angDist(s.theta, phi) < 70 || s.theta === fl.theta);
  const sphereP = project(cam, [0, 0, 0]);
  const pulse = beatPulse(g, 16);
  const hot = (st: Station) => (st.theta === fl.theta ? ease(g, fl.from, fl.settle, 0, 1) : 0.2);
  const sh = bassShake(g, 5);
  const kick = beatPulse(g, 9);
  const shake = { x: sh.x + (rand(g * 1.3) - 0.5) * 10 * kick, y: sh.y + (rand(g * 2.9 + 3) - 0.5) * 10 * kick, r: sh.r };
  const fire = fl.theta === 180 ? interpolate(g, [T.w3hit, T.w3hit + 2, T.w3hit + 26], [0, 1, 0], cl) : 0;
  return (
    <Stage
      cam={cam}
      shake={shake}
      background={
        <AbsoluteFill style={{ background: L.ink }}>
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle ${Math.round(900 + 200 * pulse)}px at ${sphereP.x.toFixed(0)}px ${sphereP.y.toFixed(0)}px, rgba(90,110,220,${(0.16 + 0.06 * pulse).toFixed(3)}) 0%, rgba(60,40,140,0.06) 45%, rgba(0,0,0,0) 75%)`,
            }}
          />
        </AbsoluteFill>
      }
      under={
        <>
          {visible.map((st) => (
            <React.Fragment key={st.idx}>
              {st.screens.map((s) => (
                <Monitor key={s.clip} s={s} st={st} parent={stationMatrix(st)} g={g} hot={hot(st)} />
              ))}
            </React.Fragment>
          ))}
        </>
      }
      three={
        <>
          {visible.map((st) =>
            st.screens.map((s) => <Occluder key={s.clip} matrix={planeMatrix(s.local, [0, s.rotY, 0], 1, stationMatrix(st))} w={s.w + 32} h={s.h + 32} radius={30} />),
          )}
          <DotSphere frame={g} center={[0, 0, 0]} radius={SPHERE_R} count={2200} spin={g * 0.22} tilt={-16} size={15} amount={1.35} pulse={pulse * 0.6} focus={5200} />
          <Dust frame={g} count={380} seed={3} box={{ x: [-6000, 6000], y: [-2600, 2600], z: [-6000, 6000] }} size={[6, 16]} focus={5000} blur={1.6} amount={0.8} />
        </>
      }
      over={
        <>
          {STATIONS.filter((st) => st.theta === fl.theta).map((st) => (
            <Label key={st.idx} st={st} parent={stationMatrix(st)} g={g} start={fl.from + (st.theta === 270 ? 1 : 6)} cps={st.theta === 270 ? 3 : 1.7} />
          ))}
          {fl.theta === 90 ? <SuccessChip parent={stationMatrix(STATIONS[1])} g={g} /> : null}
        </>
      }
      screen={
        <>
          <Pop f={g} at={fl.from} peak={0.07} />
          {fire > 0 ? <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(255,150,70,0.5), rgba(255,80,40,0) 70%)", mixBlendMode: "screen", opacity: fire * 0.5 }} /> : null}
        </>
      }
    />
  );
};

const FACES: Cut[] = [
  { from: T.f1, to: T.w2, clip: "f21", at: 0.9, focus: "50% 28%", snap: 1.16, push: 1.05 },
  { from: T.f2, to: T.w3, clip: "f22", at: 1.0, focus: "50% 28%", snap: 1.16, push: 1.05 },
];

export const Builds: React.FC = () => {
  const g = useGlobalFrame();
  const glitch = g >= T.w4 && g < T.w4 + 2 ? 0.35 : 0;
  return (
    <>
      {[
        [T.w1, T.f1],
        [T.w2, T.f2],
        [T.w3, T.wall],
      ].map(([a, b]) => (
        <At key={a} from={a} to={b} name={`world ${a}`}>
          <World />
          <GlitchBands f={g} seed={a} amount={glitch} />
        </At>
      ))}
      <Cuts cuts={FACES} />
    </>
  );
};
