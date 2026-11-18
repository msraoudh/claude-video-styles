// HERO · 757–943 — NAME REVEAL (the section's signature moment).
// A liquid-glass dossier slab made of 576 tiles flies out of the dark on the drop. A sweeping depth field
// (code-slice-hero technique) turns over only the cells that touch the name → « MED YOURNAME » made of flipped
// tiles in < 1 s. 788: a depth ripple + the handle. 820 (downbeat, camera cut): the whole slab turns over
// to his portrait. 851: name block / tags / route. 882 (camera cut): face lock-on. 912: the camera dives
// into the portrait, 943 = match cut to the same frame of f18 coming alive (Montage).
import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, interpolate } from "remotion";
import { bassShake, beatPulse, rand, useGlobalFrame } from "../../lib/beat";
import { L } from "../../lib/look";
import { Dust, makeTiles, restPose, sweepCursorX, sweepPose, TileSurface, type Sweep, type Tile, type TilePose } from "./gl";
import { Brackets, Big, cl, ease, Flare, GlassRing, glassShadow, IN_OUT, Mono, OUT, TypeOn } from "./fx";
import { CssPlane, lerpCam, Occluder, planeMatrix, project, Stage, useCanvasTexture, useImageTexture, type Cam } from "./stage3d";
import { T } from "./timeline";
import portraitUrl from "./assets/portrait-f18.jpg";

const SW = 900;
const SH = 1600;
const COLS = 18;
const ROWS = 32;
const TILES = makeTiles(COLS, ROWS, SW, SH);
const TEX_K = 2; // name texture at 2x
const NAME_FONT = 340;
// baselines in surface coords (y up)
const BASE1 = 23;
const BASE2 = -269;

const drawName = (g: CanvasRenderingContext2D) => {
  const w = SW * TEX_K;
  const h = SH * TEX_K;
  g.fillStyle = "rgb(9,13,22)";
  g.fillRect(0, 0, w, h);
  g.font = `800 ${NAME_FONT * TEX_K}px Inter`;
  (g as unknown as { letterSpacing: string }).letterSpacing = `${-0.045 * NAME_FONT * TEX_K}px`;
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  const line = (txt: string, baseY: number) => {
    const y = (SH / 2 - baseY) * TEX_K;
    const grad = g.createLinearGradient(0, y - NAME_FONT * 0.75 * TEX_K, 0, y);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, "#c8d6f2");
    g.fillStyle = grad;
    g.fillText(txt, w / 2 + 8 * TEX_K, y);
  };
  line("MED", BASE1);
  line("YOURNAME", BASE2);
};

/** which tiles touch the name (they are the only ones that flip on the drop) */
const computeInk = (c: HTMLCanvasElement) => {
  const g = c.getContext("2d");
  const ink = new Uint8Array(TILES.length);
  if (!g) return ink;
  const data = g.getImageData(0, 0, c.width, c.height).data;
  const cw = c.width / COLS;
  const ch = c.height / ROWS;
  for (const t of TILES) {
    const x0 = Math.floor(t.col * cw);
    const y0 = Math.floor(t.row * ch);
    let hit = 0;
    for (let y = y0; y < y0 + ch && !hit; y += 3)
      for (let x = x0; x < x0 + cw; x += 3) {
        if (data[(y * c.width + x) * 4] > 120) {
          hit = 1;
          break;
        }
      }
    ink[t.i] = hit;
  }
  return ink;
};

const S1: Omit<Sweep, "flips"> = { start: 759, dur: 24, dir: 1, power: 1.6, flipDur: 18, radius: 300, depth: 120, tilt: 45, bounce: 0.22, noise: 1.4 };
const S2: Omit<Sweep, "flips"> = { start: 822, dur: 28, dir: -1, power: 1.8, flipDur: 20, radius: 340, depth: 140, tilt: 45, bounce: 0.18, noise: 1.2 };
const LAND = 779;

/* ───────── camera & slab choreography ───────── */
const A1a: Cam = { pos: [0, 30, 3250], target: [0, 0, 0], fov: 40 };
const A1b: Cam = { pos: [0, 10, 2880], target: [0, -10, 0], fov: 40 };
const A2a: Cam = { pos: [1150, -900, 2700], target: [-40, -330, 0], fov: 38, roll: 4 };
const A2b: Cam = { pos: [980, -760, 2420], target: [-40, -310, 0], fov: 38, roll: 2 };
const A3a: Cam = { pos: [0, -10, 2880], target: [0, -10, 0], fov: 40 };
const A3b: Cam = { pos: [0, 0, 2710], target: [0, 0, 0], fov: 40 };
const DIVE: Cam = { pos: [0, 30, 2030], target: [0, 30, 0], fov: 40 };

const cameraAt = (g: number): Cam => {
  if (g < T.angle2) return lerpCam(A1a, A1b, ease(g, T.drop, T.angle2, 0, 1, IN_OUT));
  if (g < T.angle3) return lerpCam(A2a, A2b, ease(g, T.angle2, T.angle3, 0, 1, OUT));
  if (g < T.dive) return lerpCam(A3a, A3b, ease(g, T.angle3, T.dive, 0, 1, OUT));
  // the dive accelerates and is fully past the slab edges by 940 (match cut on 943)
  return lerpCam(A3b, DIVE, Math.pow(Math.min(1, Math.max(0, (g - T.dive) / (T.m1 - 3 - T.dive))), 2.2));
};

const slabAt = (g: number) => {
  const k = ease(g, T.drop, LAND, 0, 1, OUT);
  const z = -5200 * (1 - k);
  let ry = -42 + 32 * k + Math.max(0, g - LAND) * 0.07;
  let rx = 24 - 19 * k + Math.sin(g / 40) * 0.6;
  let rz = -8 + 6.5 * k;
  let y = 0;
  if (g >= T.angle2) {
    const a = ease(g, T.angle2, T.angle3, 0, 1, OUT);
    ry = -7 - 9 * a;
    rx = 4 - 2 * a;
    rz = -1.5 + a;
  }
  if (g >= T.angle3) {
    const a = ease(g, T.angle3, T.dive - 6, 0, 1, IN_OUT);
    ry = -16 * (1 - a);
    rx = 2 * (1 - a);
    rz = -0.5 * (1 - a);
  }
  if (g >= T.dive - 6) {
    ry = 0;
    rx = 0;
    rz = 0;
  }
  // the landing kicks the slab back a touch
  const land = g >= LAND ? Math.exp(-(g - LAND) / 5) * Math.sin((g - LAND) * 0.9) : 0;
  y += land * 6;
  return { m: planeMatrix([0, y, z + land * -40], [rx, ry, rz]), z };
};

/* ───────── background ───────── */
const Backdrop: React.FC<{ g: number }> = ({ g }) => {
  const pump = 1 + 0.35 * beatPulse(g, 14);
  const open = ease(g, T.drop, T.drop + 30, 0.4, 1);
  return (
    <AbsoluteFill style={{ background: L.ink }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(58% 40% at 50% 40%, rgba(70,105,180,${(0.2 * pump * open).toFixed(3)}) 0%, rgba(40,60,120,${(0.08 * open).toFixed(3)}) 45%, rgba(0,0,0,0) 75%)`,
        }}
      />
      {/* two cold shafts from above, slowly scissoring */}
      {[0, 1].map((i) => {
        const a = (i === 0 ? -14 : 12) + Math.sin(g / 70 + i * 2) * 3;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 540 - 260,
              top: -300,
              width: 520,
              height: 2000,
              transformOrigin: "50% 0%",
              transform: `rotate(${a}deg)`,
              background: `radial-gradient(ellipse 50% 100% at 50% 0%, rgba(150,190,255,${(0.085 * pump * open).toFixed(3)}) 0%, rgba(150,190,255,0.025) 50%, rgba(0,0,0,0) 80%)`,
              clipPath: "polygon(44% 0, 56% 0, 100% 100%, 0 100%)",
              mixBlendMode: "screen",
              filter: "blur(20px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ───────── HUD on the slab (CSS3D, over the canvas) ───────── */
const HUD_Z = 18;

const SlabHud: React.FC<{ g: number; slab: THREE.Matrix4 }> = ({ g, slab }) => {
  const at = (x: number, y: number, z = HUD_Z) => planeMatrix([x, y, z], [0, 0, 0], 1, slab);
  const fadeOut = ease(g, T.dive, T.dive + 12, 1, 0);
  const header = ease(g, T.drop + 6, T.drop + 16, 0, 1) * fadeOut;
  const handle1 = g < T.angle2 ? ease(g, T.ripple, T.ripple + 6, 0, 1) * ease(g, T.angle2 - 4, T.angle2, 1, 0) : 0;
  const block = ease(g, T.hud, T.hud + 10, 0, 1) * fadeOut;
  const rise = ease(g, T.hud, T.hud + 14, 26, 0);
  const lock = g >= T.angle3 ? ease(g, T.angle3, T.angle3 + 8, 0, 1) * fadeOut : 0;
  const snap = ease(g, T.angle3, T.angle3 + 8, 1.35, 1);
  const blink = g >= T.angle3 && (g - T.angle3) % 12 < 8 ? 1 : 0.35;
  return (
    <>
      {/* header strip */}
      <CssPlane matrix={at(0, SH / 2 - 62)} w={SW - 90} h={40} opacity={header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "100%" }}>
          <Mono size={26} color={L.steel2}>Dossier Nº 001</Mono>
          <Mono size={26} color={L.steel}>
            <span style={{ color: L.blood, marginRight: 12 }}>●</span>Classifié
          </Mono>
        </div>
      </CssPlane>
      <CssPlane matrix={at(0, SH / 2 - 92)} w={SW - 90} h={2} opacity={header * 0.6}>
        <div style={{ width: "100%", height: 1.5, background: "linear-gradient(90deg, rgba(230,237,247,0.5), rgba(230,237,247,0.05))" }} />
      </CssPlane>
      {/* drop: the handle under the flipped name */}
      <CssPlane matrix={at(0, -390)} w={SW} h={60} opacity={handle1}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Mono size={46} color={L.steel} ls={0.08} weight={700} style={{ textTransform: "none" }}>
            <span style={{ color: L.violet }}>@</span>
            <TypeOn text="yourhandle" f={g} start={T.ripple} cps={1.4} cursor={L.violet} />
          </Mono>
        </div>
      </CssPlane>
      {/* portrait side: name block at the bottom */}
      <CssPlane matrix={at(-SW / 2 + 58 + 380, -372 + rise)} w={760} h={130} opacity={block}>
        <Big size={132} style={{ textShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>
          Med the user
        </Big>
      </CssPlane>
      <CssPlane matrix={at(-SW / 2 + 58 + 380, -466 + rise)} w={760} h={50} opacity={block}>
        <Mono size={36} color={L.steel} ls={0.06} weight={700} style={{ textTransform: "none" }}>
          <span style={{ color: L.violet }}>@</span>yourhandle
        </Mono>
      </CssPlane>
      <CssPlane matrix={at(-SW / 2 + 58 + 380, -522 + rise)} w={760} h={40} opacity={block}>
        <Mono size={22} color={L.steel2} ls={0.32}>
          <TypeOn text="Tech · Cloud · IA · Automation" f={g} start={T.hud + 4} cps={1.5} />
        </Mono>
      </CssPlane>
      <CssPlane matrix={at(-SW / 2 + 58 + 380, -574 + rise)} w={760} h={44} opacity={block}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Mono size={22} color={L.steel} ls={0.32} weight={700}>
            Tunis
          </Mono>
          <div style={{ position: "relative", width: 150, height: 2, background: "rgba(230,237,247,0.18)" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: 2, width: `${ease(g, T.hud + 10, T.hud + 26, 0, 100, IN_OUT)}%`, background: L.acid, boxShadow: `0 0 10px ${L.acid}` }} />
            <div style={{ position: "absolute", left: `${ease(g, T.hud + 10, T.hud + 26, 0, 100, IN_OUT)}%`, top: -4, width: 10, height: 10, marginLeft: -5, borderRadius: 5, background: L.acid, boxShadow: `0 0 12px ${L.acid}` }} />
          </div>
          <Mono size={22} color={L.steel} ls={0.32} weight={700} style={{ opacity: ease(g, T.hud + 22, T.hud + 28, 0.25, 1) }}>
            France
          </Mono>
        </div>
      </CssPlane>
      {/* face lock-on */}
      <CssPlane matrix={at(0, 0, HUD_Z + 4)} w={SW} h={SH} opacity={lock}>
        <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: SH, transform: `scale(${snap})`, transformOrigin: "50% 36%" }}>
          <Brackets x={200} y={470} w={520} h={540} color={L.violet} arm={54} thick={4} />
          <div style={{ position: "absolute", left: 200, top: 470 - 62, padding: "8px 12px", background: "rgba(3,6,13,0.72)", borderRadius: 8, border: `1px solid rgba(167,139,250,0.45)` }}>
            <Mono size={26} color={L.violet} ls={0.28} weight={700} style={{ opacity: blink }}>
              <TypeOn text="Sujet identifié · 99,7 %" f={g} start={T.angle3 + 4} cps={1.8} cursor={L.violet} />
            </Mono>
          </div>
        </div>
      </CssPlane>
    </>
  );
};

/* ───────── the glass body behind the tiles (CSS3D, under the canvas) ───────── */
const SlabGlass: React.FC<{ g: number; slab: THREE.Matrix4 }> = ({ g, slab }) => {
  const m = planeMatrix([0, 0, -12], [0, 0, 0], 1, slab);
  const k = 0.8 + 0.5 * beatPulse(g, 16);
  const sweep = interpolate(g, [T.drop + 2, T.drop + 34], [0, 1], cl);
  return (
    <CssPlane matrix={m} w={SW + 44} h={SH + 44}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 54,
          background: "linear-gradient(150deg, rgba(160,190,255,0.20) 0%, rgba(30,40,70,0.55) 30%, rgba(8,12,22,0.92) 70%, rgba(120,150,230,0.18) 100%)",
          boxShadow: glassShadow([125, 211, 252], [167, 139, 250], k),
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(110deg, transparent ${(sweep * 140 - 30).toFixed(1)}%, rgba(255,255,255,0.55) ${(sweep * 140 - 18).toFixed(1)}%, transparent ${(sweep * 140 - 6).toFixed(1)}%)`,
            mixBlendMode: "screen",
          }}
        />
        <GlassRing radius={54} width={2} />
      </div>
    </CssPlane>
  );
};

export const NameReveal: React.FC = () => {
  const g = useGlobalFrame();
  const texN = useCanvasTexture("hero-name-v1", SW * TEX_K, SH * TEX_K, [`800 ${NAME_FONT * TEX_K}px Inter`], drawName);
  const texP = useImageTexture(portraitUrl);
  const ink = useMemo(() => (texN ? computeInk(texN.image as HTMLCanvasElement) : new Uint8Array(TILES.length)), [texN]);
  const cam = cameraAt(g);
  const slab = slabAt(g);

  const s1: Sweep = { ...S1, flips: (t) => ink[t.i] === 1 };
  const s2: Sweep = { ...S2, flips: () => true };
  const rippleAge = g - T.ripple;
  const landAge = g - LAND;
  const pose = (t: Tile): TilePose => {
    if (g < S1.start - 1 && g >= 0) {
      const p = restPose(0, ink[t.i] ? 0 : 1);
      return p;
    }
    const a = sweepPose(s1, t, SW, g);
    const b = sweepPose(s2, t, SW, g);
    const isInk = ink[t.i] === 1;
    let z = a.z + b.z;
    let rx = a.rx + b.rx;
    let formation = Math.max(a.formation, b.formation);
    let glow = 0.16 * a.flight + 0.1 * b.flight;
    if (rippleAge >= 0 && rippleAge < 50) {
      const dist = Math.hypot(t.cx, t.cy * 0.8);
      const rr = rippleAge * 52;
      const amp = Math.exp(-rippleAge / 16);
      const w = Math.exp(-Math.pow((dist - rr) / 120, 2)) * amp;
      z += 46 * w;
      rx += 10 * w * Math.sign(t.cy || 1);
      formation = Math.max(formation, 0.7 * w);
      glow += 0.14 * w;
    }
    if (landAge >= 0 && landAge < 18) glow += 0.12 * Math.exp(-landAge / 4);
    const ry = a.ry + b.ry;
    return {
      x: a.x + b.x,
      y: a.y + b.y,
      z,
      rx,
      ry,
      rz: a.rz + b.rz,
      scale: 1,
      formation,
      shade: 1 - 0.14 * Math.abs(Math.sin((ry * Math.PI) / 180)) - 0.02 * formation,
      front: isInk && a.turned ? 1 : 0,
      rear: isInk ? 0 : 1,
      glow,
    };
  };

  // the light that rides the sweep cursor
  const c1 = g >= S1.start && g <= S1.start + S1.dur + 10;
  const c2 = g >= S2.start && g <= S2.start + S2.dur + 10;
  const cursor = c1
    ? { x: sweepCursorX(s1, SW, g), y: 0, r: 460, k: interpolate(g, [S1.start, S1.start + 4, S1.start + S1.dur, S1.start + S1.dur + 10], [0, 1, 0.8, 0], cl) }
    : c2
      ? { x: sweepCursorX(s2, SW, g), y: -100, r: 520, k: interpolate(g, [S2.start, S2.start + 4, S2.start + S2.dur, S2.start + S2.dur + 10], [0, 0.8, 0.6, 0], cl) }
      : { x: 0, y: 0, r: 1, k: 0 };
  // screen position of that light (for the anamorphic streak)
  const cw = new THREE.Vector3(cursor.x, cursor.y, 30).applyMatrix4(slab.m);
  const cp = project(cam, [cw.x, cw.y, cw.z]);

  const sh = bassShake(g, 6);
  const kick = beatPulse(g, 9);
  const shake = { x: sh.x + (rand(g * 1.7) - 0.5) * 14 * kick, y: sh.y + (rand(g * 2.3 + 4) - 0.5) * 14 * kick, r: sh.r };
  const bright = g < T.drop + 3 ? 0.6 : 1;
  return (
    <Stage
      cam={cam}
      shake={g < T.dive ? shake : { x: sh.x * 0.5, y: sh.y * 0.5, r: 0 }}
      background={<Backdrop g={g} />}
      under={<SlabGlass g={g} slab={slab.m} />}
      three={
        <>
          <Occluder matrix={planeMatrix([0, 0, -12], [0, 0, 0], 1, slab.m)} w={SW + 44} h={SH + 44} radius={54} />
          <TileSurface tiles={TILES} W={SW} H={SH} depth={16} matrix={slab.m} pose={pose} texN={texN} texP={texP} cursor={cursor} bright={bright} />
          <Dust
            frame={g}
            count={460}
            seed={7}
            focus={Math.hypot(cam.pos[0], cam.pos[1], cam.pos[2] - slab.z)}
            blur={2.6}
            amount={g < T.dive ? 1 : 0.6}
            box={{ x: [-1700, 1700], y: [-2100, 2100], z: [-3000, 2300] }}
            burst={{ age: landAge, origin: [0, 0, 0], power: 520 }}
          />
        </>
      }
      over={<SlabHud g={g} slab={slab.m} />}
      screen={
        <>
          {c1 ? <Flare f={g} start={S1.start} dur={S1.dur + 14} x={cp.x} y={cp.y} strength={0.75} col={[150, 195, 255]} size={140} /> : null}
          {c2 ? <Flare f={g} start={S2.start} dur={S2.dur + 14} x={cp.x} y={cp.y} strength={0.45} col={[180, 160, 255]} size={120} ghosts={false} /> : null}
          {/* the dive: light floods in just before the match cut */}
          <AbsoluteFill style={{ background: "#dfe8ff", mixBlendMode: "screen", opacity: interpolate(g, [T.m1 - 8, T.m1 - 1], [0, 0.22], cl) }} />
          {/* first frames: the slab is still a silhouette in the dark */}
          <AbsoluteFill style={{ background: L.ink, opacity: interpolate(g, [T.drop, T.drop + 3], [0.5, 0], cl) }} />
        </>
      }
    />
  );
};

