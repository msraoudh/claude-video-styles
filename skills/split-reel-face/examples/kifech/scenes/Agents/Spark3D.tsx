import { ThreeCanvas } from "@remotion/three";
import type React from "react";
import { useMemo } from "react";
import * as THREE from "three";
import { K } from "../../edit/theme";

/**
 * The orchestrator: Claude's spark, extruded and bevelled (same recipe as overlays/Claude.tsx ClaudeSpark3D).
 * One light 3D element. Pixel radius of the ray tips ≈ PX_PER_UNIT × s.
 */
export const CANVAS = 560;
// camera z 4, fov 40 → visible height 2·4·tan(20°) = 2.912 units over CANVAS px
export const PX_PER_UNIT = CANVAS / 2.912;

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
      const [x, y] = pts[i];
      const [px, py] = pts[i - 1];
      shape.quadraticCurveTo(px + (x - px) * 0.5, py + (y - py) * 0.5, x, y);
    }
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.05, bevelSegments: 5, curveSegments: 8 });
    g.center();
    return g;
  }, []);

const Mesh: React.FC<{ s: number; rx: number; ry: number; rz: number; heat: number }> = ({ s, rx, ry, rz, heat }) => {
  const geo = useSparkGeometry();
  return (
    <mesh geometry={geo} scale={[s, s, s]} rotation={[rx, ry, rz]}>
      <meshPhysicalMaterial color={K.coral} roughness={0.28} metalness={0.25} clearcoat={1} clearcoatRoughness={0.15} emissive={"#5a1d0c"} emissiveIntensity={0.35 + heat * 0.9} />
    </mesh>
  );
};

/** Centred on (cx, cy) in screen px. s = mesh scale, heat 0–1 = extra glow (sync / done pulses). */
export const Spark3D: React.FC<{ cx: number; cy: number; s: number; rx: number; ry: number; rz: number; heat?: number; opacity?: number }> = ({
  cx,
  cy,
  s,
  rx,
  ry,
  rz,
  heat = 0,
  opacity = 1,
}) => {
  if (s <= 0.002 || opacity <= 0.01) return null;
  return (
    <div style={{ position: "absolute", left: cx - CANVAS / 2, top: cy - CANVAS / 2, width: CANVAS, height: CANVAS, opacity }}>
      <ThreeCanvas width={CANVAS} height={CANVAS} camera={{ position: [0, 0, 4], fov: 40 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 5]} intensity={2.2} />
        <pointLight position={[-3, -2, 3]} intensity={18 + heat * 20} color={"#ffb48a"} />
        <Mesh s={s} rx={rx} ry={ry} rz={rz} heat={heat} />
      </ThreeCanvas>
    </div>
  );
};
