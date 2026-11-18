import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useMemo, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { bassShake, useGlobalFrame } from "../../lib/beat";
import { L } from "../../lib/look";
import e01 from "./assets/e01.jpg";
import e02 from "./assets/e02.jpg";
import e03 from "./assets/e03.jpg";
import e04 from "./assets/e04.jpg";
import e05 from "./assets/e05.jpg";
import e06 from "./assets/e06.jpg";
import e07 from "./assets/e07.jpg";
import e08 from "./assets/e08.jpg";
import e09 from "./assets/e09.jpg";
import { Stage } from "./FX";
import { clamp01, decayAny, EO, lin, smooth } from "./lib";
import { Mono } from "./Type";

/**
 * « SES ÉPISODES » — port of the cuboid-carousel technique (HyperFrames block: a chain of rounded, bevelled cuboids
 * carrying card content rides a travelling wave) to @remotion/three, frame-driven and beat-synced:
 * his episode frames sit on the cuboid faces; on every 808 the wave advances one card: the next cuboid turns from
 * edge-on to face-on and slides to the hero slot, the previous one swings away. Dark metal body, glossy face,
 * RoomEnvironment reflections on the bevels (the "liquid glass" read of his series).
 */
export const CARDS: { src: string; label: string }[] = [
  { src: e01, label: "IA × MÉTIERS DE L'IT" },
  { src: e02, label: "L'IA A SCANNÉ CHAQUE MÉTIER" },
  { src: e03, label: "ZONE VERTE · 20–39 %" },
  { src: e04, label: "ZONE ROUGE · 80–95 %" },
  { src: e06, label: "CLOUD · IAAS" },
  { src: e07, label: "BACKEND · DON'T PANIC." },
  { src: e08, label: "LE WEB · FRONT · BACK · DB" },
  { src: e09, label: "FRONTEND · REACT" },
  { src: e05, label: "CLOUD" },
];

/** steps of the wave: the first one is the fly-in, then one card per 808 */
export const STEPS = [2292, 2325, 2358, 2390, 2423, 2455, 2488, 2520];

const W = 1.5, H = 2.667, D = 0.15, R = 0.11, BS = 0.035, BT = 0.04;

const roundedRect = (w: number, h: number, r: number) => {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  s.closePath();
  return s;
};

/** carousel position (hero index, float) at global frame g */
export const heroIndex = (g: number) => {
  let idx = lin(g, STEPS[0], STEPS[0] + 12, -0.38, 0, EO);
  for (let i = 1; i < STEPS.length; i++) {
    const t = clamp01((g - STEPS[i]) / 15);
    // ease-out with a small overshoot (back-out), settles exactly
    const c1 = 1.25, c3 = c1 + 1;
    idx += t <= 0 ? 0 : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
  return idx;
};

const Chain: React.FC<{ g: number; tex: THREE.Texture[] }> = ({ g, tex }) => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const env = useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const rt = pm.fromScene(new RoomEnvironment(), 0.04);
    pm.dispose();
    return rt.texture;
  }, [gl]);
  scene.environment = env;
  const geo = useMemo(() => {
    const body = new THREE.ExtrudeGeometry(roundedRect(W - 2 * BS, H - 2 * BS, R - BS), {
      depth: D - 2 * BT,
      bevelEnabled: true,
      bevelThickness: BT,
      bevelSize: BS,
      bevelSegments: 4,
      curveSegments: 10,
    });
    body.translate(0, 0, -(D - 2 * BT) / 2);
    body.computeVertexNormals();
    const fw = W - 0.05, fh = H - 0.05;
    const face = new THREE.ShapeGeometry(roundedRect(fw, fh, R - 0.03), 10);
    const pos = face.attributes.position as THREE.BufferAttribute;
    const uv = face.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + fw / 2) / fw, (pos.getY(i) + fh / 2) / fh);
    uv.needsUpdate = true;
    // the liquid-glass ring of light around the face (his series card recipe: gradient border ring)
    const ringShape = roundedRect(W - 0.012, H - 0.012, R - 0.006);
    ringShape.holes.push(roundedRect(fw - 0.004, fh - 0.004, R - 0.032));
    const ring = new THREE.ShapeGeometry(ringShape, 10);
    return { body, face, ring };
  }, []);
  const mats = useMemo(() => {
    const body = new THREE.MeshStandardMaterial({ color: new THREE.Color("#141922"), metalness: 0.85, roughness: 0.28, envMapIntensity: 1.5 });
    const ring = new THREE.MeshBasicMaterial({ color: new THREE.Color("#cfe9ff"), transparent: true, opacity: 0.5 });
    const faces = tex.map((t) => new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.9, roughness: 0.22, metalness: 0.05, envMapIntensity: 0.55 }));
    return { body, faces, ring };
  }, [tex]);
  const idx = heroIndex(g);
  const kick = decayAny(g, STEPS, 7);
  const sh = bassShake(g, 1);
  camera.position.set(0.35 + sh.x * 0.004, 0.12 + sh.y * 0.004, 10.0 - 0.35 * kick + 0.5 * (1 - lin(g, STEPS[0], STEPS[0] + 40, 0, 1)));
  camera.lookAt(0.05, 0.02, 0);
  camera.rotation.z += sh.r * 0.01;
  // specular sweep light after each step
  let sweep = -6;
  for (const s of STEPS) if (g >= s) sweep = -3.2 + ((g - s) / 18) * 6.4;
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[-3, 4, 5]} intensity={1.3} color="#dfe8ff" />
      <directionalLight position={[4, -1.5, -3]} intensity={2.4} color="#7dd3fc" />
      <directionalLight position={[-4, -3, 1]} intensity={1.1} color="#a78bfa" />
      <pointLight position={[sweep, 1.0, 2.8]} intensity={sweep > -3.3 && sweep < 3.3 ? 1.6 : 0} distance={7} color="#ffffff" />
      {CARDS.map((_, i) => {
        const u = i - idx;
        const b = Math.exp(-(u * u) / 0.16);
        const fut = clamp01((u - 0.08) / 0.92);
        const past = clamp01(-u / 1.1);
        const x = u <= 0 ? u * 1.85 : u <= 1 ? u * 1.22 : 1.22 + (u - 1) * 0.36;
        const z = 0.62 * b - 0.55 * Math.min(Math.abs(u), 3) - (u > 1 ? (u - 1) * 0.25 : 0);
        const y = 0.04 * Math.sin(g * 0.045 + i * 1.3) + (u > 1 ? (u - 1) * 0.05 : 0);
        const ry = -(Math.PI / 2) * 0.86 * smooth(fut) + 0.62 * smooth(past);
        const rx = 0.05 * Math.sin(g * 0.06 - i * 0.8) * (1 - b * 0.6);
        const rz = 0.025 * Math.sin(g * 0.035 + i);
        const sc = 1 + 0.06 * b + 0.03 * kick * b;
        const fm = mats.faces[i];
        fm.emissiveIntensity = 0.42 + 0.55 * b;
        return (
          <group key={i} position={[x, y, z]} rotation={[rx, ry, rz]} scale={sc}>
            <mesh geometry={geo.body} material={mats.body} />
            <mesh geometry={geo.face} material={fm} position={[0, 0, D / 2 + 0.004]} />
            <mesh geometry={geo.ring} material={mats.ring} position={[0, 0, D / 2 + 0.005]} />
          </group>
        );
      })}
    </>
  );
};

export const Carousel: React.FC<{ from: number }> = ({ from }) => {
  const g = useGlobalFrame();
  const [handle] = useState(() => delayRender("escalate: episode textures"));
  const tex = useMemo(() => {
    const loader = new THREE.TextureLoader();
    let n = 0;
    return CARDS.map((c) => {
      const t = loader.load(
        c.src,
        () => {
          n++;
          if (n === CARDS.length) continueRender(handle);
        },
        undefined,
        (e) => cancelRender(e),
      );
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    });
  }, [handle]);
  const idx = heroIndex(g);
  const hero = Math.max(0, Math.min(7, Math.round(idx)));
  const lastStep = STEPS.filter((s) => g >= s).pop() ?? from;
  const labelIn = lin(g, lastStep, lastStep + 6, 0, 1);
  const count = `0${hero + 1} / 08`;
  return (
    <>
      <Stage glow={[60, 100, 170]} glowA={0.4} gy={48} grid={0.5} />
      <ThreeCanvas width={1080} height={1920} flat camera={{ fov: 30, position: [0, 0, 9], near: 0.1, far: 60 }} style={{ position: "absolute", inset: 0 }}>
        <Chain g={g} tex={tex} />
      </ThreeCanvas>
      <Mono text="SES ÉPISODES" x={540} y={232} size={30} color={L.steel} dot={L.blood} />
      <div style={{ opacity: labelIn, transform: `translateY(${(1 - labelIn) * 10}px)` }}>
        <Mono text={`${count}  ·  ${CARDS[hero].label}`} x={540} y={284} size={21} color={L.steel2} track={0.3} />
      </div>
    </>
  );
};
