import { ThreeCanvas } from "@remotion/three";
import type React from "react";
import { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { EASE_IN, EASE_IN_OUT, EASE_OUT, SPRING_POP, drift, sec } from "../lib/motion";import { C, UI } from "../lib/theme";
import { Emoji, enterStyle, Glass, IconCheck, SparkMark } from "./ui";

type Beat = { from: number; dur: number };

/** A coral sunburst, extruded and bevelled. */
const useSparkGeometry = () =>
  useMemo(() => {
    const shape = new THREE.Shape();
    const rays = 12;
    const pts: [number, number][] = [];
    for (let i = 0; i < rays * 2; i++) {
      const a = (i / (rays * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? (i % 4 === 0 ? 1.0 : 0.82) : 0.2;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    shape.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      // rounded tips: approach each point through a quadratic curve
      const [x, y] = pts[i];
      const [px, py] = pts[i - 1];
      shape.quadraticCurveTo(px + (x - px) * 0.5, py + (y - py) * 0.5, x, y);
    }
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.05, bevelSegments: 6, curveSegments: 10 });
    g.center();
    return g;
  }, []);

const Spark: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const geo = useSparkGeometry();
  const p = spring({ frame, fps, config: { damping: 11, stiffness: 120, mass: 0.9 } });
  const s = interpolate(p, [0, 1], [0.001, 1.25]);
  return (
    <mesh geometry={geo} scale={[s, s, s]} rotation={[0.3 + Math.sin(frame / 22) * 0.12, interpolate(p, [0, 1], [-Math.PI * 2, 0]) + Math.sin(frame / 18) * 0.55, frame * 0.02]}>
      <meshPhysicalMaterial color={C.claude} roughness={0.28} metalness={0.25} clearcoat={1} clearcoatRoughness={0.15} emissive={"#5a1d0c"} emissiveIntensity={0.35} />
    </mesh>
  );
};

/** 3D spark that bursts in next to the user's head on "Claude". */
export const ClaudeSpark3D: React.FC<Beat> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const q = interpolate(frame, [dur - 8, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN });
  const d = drift(frame, "spark", 12, 3.5);
  const glow = interpolate(frame, [0, 6, 30], [0, 1, 0.55], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: 1 - q }}>
      <div
        style={{
          position: "absolute",
          left: 690 + d.x,
          top: 150 + d.y,
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,150,100,${0.55 * glow}) 0%, rgba(255,120,70,0) 65%)`,
        }}
      />
      <div style={{ position: "absolute", left: 690 + d.x, top: 150 + d.y, width: 380, height: 380 }}>
        <ThreeCanvas width={380} height={380} camera={{ position: [0, 0, 4], fov: 40 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 4, 5]} intensity={2.2} />
          <pointLight position={[-3, -2, 3]} intensity={18} color={"#ffb48a"} />
          <Spark frame={frame} fps={fps} />
        </ThreeCanvas>
      </div>
    </AbsoluteFill>
  );
};

/** Claude chat card: the prompt types itself, then each thing the user lists gets ticked. */
export const ClaudeCard: React.FC<Beat> = ({ from, dur }) => {
  const { p, q, frame, fps } = useEnterExit2(dur);
  const cue = (t: number) => sec(t) - from;
  const prompt = "Aide-moi à monter ma vidéo";
  const typed = Math.round(interpolate(frame, [cue(37.2), cue(37.95)], [0, prompt.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const items: [number, string, string][] = [
    [38.0, "Apprendre", "📚"],
    [38.4, "Monter mes vidéos", "🎬"],
    [39.88, "Couleurs", "🎨"],
    [40.4, "Animations", "🌀"],
    [41.2, "Effets", "✨"],
  ];
  // "les animations": every chip wiggles once
  const wiggleT = frame - cue(40.4);
  const animWiggle = (i: number) => (wiggleT >= 0 && wiggleT < 16 ? Math.sin(wiggleT * 1.3 + i) * (1 - wiggleT / 16) * 10 : 0);
  return (
    <AbsoluteFill>
      <Glass style={{ position: "absolute", left: 90, right: 90, top: 790, padding: "28px 32px", borderRadius: 40, ...enterStyle(p, q) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <SparkMark size={52} rotate={frame * 2} />
          <span style={{ fontFamily: UI, fontWeight: 800, fontSize: 40 }}>Claude</span>
          <span style={{ marginLeft: "auto", fontSize: 24, fontWeight: 700, padding: "8px 16px", borderRadius: 999, background: "rgba(52,211,153,0.18)", color: C.green }}>● en ligne</span>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <div style={{ maxWidth: 760, padding: "18px 26px", borderRadius: "28px 28px 8px 28px", background: C.accent, fontSize: 36, fontWeight: 700 }}>
            {prompt.slice(0, typed)}
            {typed < prompt.length ? <span style={{ opacity: frame % 10 < 5 ? 1 : 0 }}>|</span> : <Emoji e=" 🎬" size={34} />}
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 22 }}>
          {items.map(([t, label, e], i) => {
            if (frame < cue(t)) return null; // a chip takes space only once it is said
            const ip = spring({ frame: frame - cue(t), fps, config: SPRING_POP });
            const tick = interpolate(frame, [cue(t) + 3, cue(t) + 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 22px",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.1)",
                  border: `2px solid ${tick > 0.5 ? "rgba(52,211,153,0.6)" : "rgba(255,255,255,0.15)"}`,
                  fontSize: 32,
                  fontWeight: 800,
                  rotate: `${animWiggle(i)}deg`,
                  ...enterStyle(ip, 0, 24),
                }}
              >
                <Emoji e={e} size={32} />
                {label}
                <div style={{ width: 38, height: 38, borderRadius: 12, background: tick > 0 ? C.green : "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconCheck size={30} stroke={3.4} progress={tick} />
                </div>
              </div>
            );
          })}
        </div>
      </Glass>
    </AbsoluteFill>
  );
};

/** enter/exit using local frame, softer spring for a large card */
const useEnterExit2 = (dur: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 16, stiffness: 150, mass: 0.8 } });
  const q = interpolate(frame, [dur - 6, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN });
  return { p, q, frame, fps };
};

/**
 * "les couleurs" — before/after grade. Lives INSIDE the Footage camera: a flat, washed-out
 * backdrop filter covers the plate, then a glowing divider sweeps it away.
 */
export const ColorWipe: React.FC<Beat> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const cue = (t: number) => sec(t) - from;
  const flatIn = interpolate(frame, [0, 5], [0, 1], { extrapolateRight: "clamp" });
  const sweep = interpolate(frame, [cue(39.88), cue(39.88) + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IN_OUT });
  const leftEdge = sweep * 1180 - 50; // px where the flat area starts
  const vividBoost = interpolate(frame, [cue(39.88) + 10, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      {/* graded side gets an extra pop while the wipe is fresh */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: Math.max(0, leftEdge),
          backdropFilter: `saturate(${1 + 0.35 * vividBoost}) contrast(${1 + 0.08 * vividBoost})`,
          WebkitBackdropFilter: `saturate(${1 + 0.35 * vividBoost}) contrast(${1 + 0.08 * vividBoost})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: Math.max(0, leftEdge),
          right: 0,
          opacity: flatIn,
          backdropFilter: "saturate(0.25) contrast(0.82) brightness(1.06)",
          WebkitBackdropFilter: "saturate(0.25) contrast(0.82) brightness(1.06)",
        }}
      />
      {sweep > 0 && sweep < 1 ? (
        <div style={{ position: "absolute", top: 0, bottom: 0, left: leftEdge - 3, width: 6, background: "#fff", boxShadow: `0 0 40px 12px ${C.accent}, 0 0 8px #fff` }} />
      ) : null}
      {/* tiny labels on each side while the divider travels */}
      <div style={{ position: "absolute", top: 230, right: 70, fontFamily: UI, fontWeight: 900, fontSize: 34, letterSpacing: 4, color: "#fff", opacity: (1 - sweep) * flatIn, textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>AVANT</div>
      <div style={{ position: "absolute", top: 230, left: 70, fontFamily: UI, fontWeight: 900, fontSize: 34, letterSpacing: 4, color: C.accent, opacity: interpolate(sweep, [0.2, 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * interpolate(frame, [dur - 6, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>APRÈS</div>
    </AbsoluteFill>
  );
};

/** "les effets" — a short RGB glitch hit over everything. */
export const GlitchHit: React.FC<Beat> = ({ dur }) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [0, dur], [1, 0], { extrapolateRight: "clamp", easing: EASE_OUT });
  const bars = new Array(7).fill(0).map((_, i) => ({ y: ((i * 271 + frame * 97) % 1920), h: 20 + ((i * 53 + frame * 31) % 90), x: ((i % 2 ? 1 : -1) * (30 + ((frame * 17 + i * 41) % 60))) }));
  return (
    <AbsoluteFill style={{ opacity: k, mixBlendMode: "screen" }}>
      {bars.map((b, i) => (
        <div key={i} style={{ position: "absolute", left: b.x, right: -b.x, top: b.y, height: b.h, background: i % 3 === 0 ? "rgba(255,0,80,0.35)" : i % 3 === 1 ? "rgba(0,220,255,0.35)" : "rgba(255,255,255,0.25)" }} />
      ))}
    </AbsoluteFill>
  );
};

/** Diagonal light streak used as an accent wipe (Claude reveal, French sweep). */
export const LightStreak: React.FC<Beat & { colors?: string[]; angle?: number }> = ({ dur, colors = ["rgba(255,255,255,0)", "rgba(255,210,170,0.85)", "rgba(255,255,255,0)"], angle = 115 }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, dur], [-120, 220], { extrapolateRight: "clamp", easing: EASE_OUT });
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${colors[0]} ${x - 25}%, ${colors[1]} ${x}%, ${colors[2]} ${x + 25}%)`,
        mixBlendMode: "screen",
        opacity: interpolate(frame, [0, 3, dur - 4, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}
    />
  );
};
