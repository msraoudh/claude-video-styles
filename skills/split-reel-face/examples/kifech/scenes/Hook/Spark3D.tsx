import { ThreeCanvas } from "@remotion/three";
import type React from "react";
import { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { EASE } from "../../edit/kit";
import { K } from "../../edit/theme";
import { pulse } from "./beat";

/**
 * Claude's spark in 3D (adapted from src/overlays/Claude.tsx ClaudeSpark3D): a coral 12-ray sunburst, extruded,
 * bevelled, clear-coated. `at` = the slam frame (GLOBAL), `out` = exit frame. The slam itself is a CSS scale on the
 * canvas wrapper (2.3 → 0.9 → 1.05 → 1, blurred while it lands) so the mesh never clips the canvas edges.
 */
const useSparkGeometry = () =>
  useMemo(() => {
    const shape = new THREE.Shape();
    const rays = 12;
    const pts: [number, number][] = [];
    for (let i = 0; i < rays * 2; i++) {
      const a = (i / (rays * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? (i % 4 === 0 ? 1.0 : 0.8) : 0.19;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    shape.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i];
      const [px, py] = pts[i - 1];
      shape.quadraticCurveTo(px + (x - px) * 0.5, py + (y - py) * 0.5, x, y);
    }
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.05, bevelSegments: 6, curveSegments: 10 });
    g.center();
    return g;
  }, []);

const SparkMesh: React.FC<{ frame: number; t: number; spinIn: number; scale: number; inPlane: boolean }> = ({ frame, t, spinIn, scale, inPlane }) => {
  const geo = useSparkGeometry();
  const settle = EASE(t / 8);
  return (
    <mesh
      geometry={geo}
      scale={[scale, scale, scale]}
      rotation={[0.3 + Math.sin(frame / 22) * 0.14, (inPlane ? 0 : -spinIn * (1 - settle)) + Math.sin(t / 17) * 0.5, frame * 0.025 - (inPlane ? spinIn * 0.5 * (1 - settle) : 0)]}
    >
      <meshPhysicalMaterial color={K.coral} roughness={0.26} metalness={0.25} clearcoat={1} clearcoatRoughness={0.14} emissive={"#5a1d0c"} emissiveIntensity={0.4} />
    </mesh>
  );
};

export const Spark3D: React.FC<{ at: number; out: number; x: number; y: number; size: number; slam?: boolean; meshScale?: number; beat?: number }> = ({
  at,
  out,
  x,
  y,
  size,
  slam = true,
  meshScale = 0.85,
  beat = 0,
}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || frame > out + 9) return null;
  const css = slam
    ? interpolate(t, [0, 4, 8, 13], [2.3, 0.9, 1.05, 1], { extrapolateRight: "clamp" })
    : interpolate(t, [0, 7, 12], [0.2, 1.08, 1], { extrapolateRight: "clamp" });
  const q = EASE((frame - out) / 8);
  const blur = slam ? Math.max(0, 4 - t) * 2.2 : Math.max(0, 5 - t) * 1.2;
  const fy = Math.sin(frame / 20) * 6;
  const glow = interpolate(t, [0, 4, 24], [1.3, 1, 0.6], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2 + fy,
        width: size,
        height: size,
        opacity: Math.min(1, t / 2 + 0.35) * (1 - q),
        transform: `scale(${css * (1 - 0.7 * q) * (1 + beat * pulse(frame))}) rotate(${q * 120}deg)`,
        filter: blur > 0.1 || q > 0 ? `blur(${blur + q * 6}px)` : undefined,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -size * 0.2,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,160,110,${0.5 * glow}) 0%, rgba(217,119,87,${0.22 * glow}) 35%, rgba(217,119,87,0) 66%)`,
        }}
      />
      <ThreeCanvas width={size} height={size} camera={{ position: [0, 0, 4], fov: 40 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 5]} intensity={2.2} />
        <pointLight position={[-3, -2, 3]} intensity={18} color={"#ffb48a"} />
        <SparkMesh frame={frame} t={t} spinIn={Math.PI * 2} scale={meshScale} inPlane={!slam} />
      </ThreeCanvas>
    </div>
  );
};
