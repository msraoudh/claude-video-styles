// HERO — the shared 3D stage: one Three.js canvas + CSS3D layers driven by the SAME camera.
//
// World units are CSS pixels (y up), so a plane of w×h world units at the camera's "1:1 distance"
// (FPX) is exactly w×h pixels on screen. DOM planes (video screens, HUD type) are placed with the
// three.js CSS3DRenderer matrix maths, so they sit pixel-exact on the WebGL geometry.
//
// Layer order (back → front):  background DOM · `under` CSS3D (video screens) · ThreeCanvas · `over` CSS3D (HUD type) · `screen` DOM
// Things in the canvas that must pass BEHIND an `under` plane need an <Occluder> (depth only) at that plane.
//
// Everything is a pure function of the props: no useFrame, no clocks. IMPORTANT: custom React contexts
// (useGlobalFrame) do NOT reach inside <ThreeCanvas> — pass the frame in as a prop.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { AbsoluteFill, continueRender, delayRender } from "remotion";

export type V3 = [number, number, number];
export type Cam = { pos: V3; target: V3; fov?: number; roll?: number };

export const VW = 1080;
export const VH = 1920;
const DEG = Math.PI / 180;
/** focal length in px for a vertical fov (the distance at which 1 world unit = 1 screen px) */
export const fpxFor = (fov = 40) => VH / 2 / Math.tan((fov * DEG) / 2);

export const configureCamera = (c: Cam, cam: THREE.PerspectiveCamera) => {
  cam.fov = c.fov ?? 40;
  cam.aspect = VW / VH;
  cam.near = 5;
  cam.far = 60000;
  cam.up.set(0, 1, 0);
  cam.position.set(c.pos[0], c.pos[1], c.pos[2]);
  cam.lookAt(c.target[0], c.target[1], c.target[2]);
  if (c.roll) cam.rotateZ(c.roll * DEG);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
  return cam;
};

const eps = (v: number) => (Math.abs(v) < 1e-10 ? 0 : v);

/** CSS transform of the camera element (three.js CSS3DRenderer, perspective camera). */
export const cssCameraTransform = (c: Cam) => {
  const cam = configureCamera(c, new THREE.PerspectiveCamera());
  const f = cam.projectionMatrix.elements[5] * (VH / 2);
  const e = cam.matrixWorldInverse.elements;
  const m = `matrix3d(${eps(e[0])},${eps(-e[1])},${eps(e[2])},${eps(e[3])},${eps(e[4])},${eps(-e[5])},${eps(e[6])},${eps(e[7])},${eps(e[8])},${eps(-e[9])},${eps(e[10])},${eps(e[11])},${eps(e[12])},${eps(-e[13])},${eps(e[14])},${eps(e[15])})`;
  return `perspective(${f}px) translateZ(${f}px) ${m} translate(${VW / 2}px, ${VH / 2}px)`;
};

/** World matrix for a plane at `pos`, euler `rot` (degrees, XYZ), optional parent matrix. */
export const planeMatrix = (pos: V3, rot: V3 = [0, 0, 0], scale = 1, parent?: THREE.Matrix4) => {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...pos),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0] * DEG, rot[1] * DEG, rot[2] * DEG, "XYZ")),
    new THREE.Vector3(scale, scale, scale),
  );
  return parent ? parent.clone().multiply(m) : m;
};

export const cssObjectTransform = (m: THREE.Matrix4) => {
  const e = m.elements;
  return `translate(-50%,-50%) matrix3d(${eps(e[0])},${eps(e[1])},${eps(e[2])},${eps(e[3])},${eps(-e[4])},${eps(-e[5])},${eps(-e[6])},${eps(-e[7])},${eps(e[8])},${eps(e[9])},${eps(e[10])},${eps(e[11])},${eps(e[12])},${eps(e[13])},${eps(e[14])},${eps(e[15])})`;
};

/** Project a world point to screen px. z > 1 means behind the camera. */
export const project = (c: Cam, p: V3) => {
  const cam = configureCamera(c, new THREE.PerspectiveCamera());
  const v = new THREE.Vector3(...p).project(cam);
  return { x: ((v.x + 1) / 2) * VW, y: ((1 - v.y) / 2) * VH, z: v.z };
};

/** A DOM plane (w×h px) placed in the 3D world. Must be a child of a <CssLayer>. */
export const CssPlane: React.FC<{
  matrix: THREE.Matrix4;
  w: number;
  h: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  opacity?: number;
}> = ({ matrix, w, h, children, style, opacity = 1 }) => {
  if (opacity <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: w,
        height: h,
        transform: cssObjectTransform(matrix),
        backfaceVisibility: "hidden",
        opacity,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** The CSS3D view: an overflow-hidden frame with the camera element inside. */
export const CssLayer: React.FC<{ cam: Cam; children?: React.ReactNode }> = ({ cam, children }) => (
  <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: VW, height: VH, transformStyle: "preserve-3d", transform: cssCameraTransform(cam) }}>
      {children}
    </div>
  </AbsoluteFill>
);

const CamRig: React.FC<{ cam: Cam }> = ({ cam }) => {
  const { camera, scene } = useThree();
  configureCamera(cam, camera as THREE.PerspectiveCamera);
  scene.background = null;
  return null;
};

export const Stage: React.FC<{
  cam: Cam;
  background?: React.ReactNode;
  under?: React.ReactNode;
  three?: React.ReactNode;
  over?: React.ReactNode;
  screen?: React.ReactNode;
  /** whole-stage screen-space shake (px) */
  shake?: { x: number; y: number; r: number };
}> = ({ cam, background, under, three, over, screen, shake }) => (
  <AbsoluteFill style={{ overflow: "hidden" }}>
    <AbsoluteFill style={{ transform: shake ? `translate(${shake.x}px, ${shake.y}px) rotate(${shake.r}deg) scale(${1 + Math.min(0.04, Math.abs(shake.r) * 0.02 + 0.01)})` : undefined }}>
      {background ? <AbsoluteFill>{background}</AbsoluteFill> : null}
      {under ? <CssLayer cam={cam}>{under}</CssLayer> : null}
      {three ? (
        <ThreeCanvas
          width={VW}
          height={VH}
          flat
          linear
          gl={{ antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" }}
          camera={{ fov: cam.fov ?? 40, near: 5, far: 60000, position: cam.pos }}
          style={{ position: "absolute", inset: 0 }}
        >
          <CamRig cam={cam} />
          {three}
        </ThreeCanvas>
      ) : null}
      {over ? <CssLayer cam={cam}>{over}</CssLayer> : null}
    </AbsoluteFill>
    {screen ? <AbsoluteFill style={{ pointerEvents: "none" }}>{screen}</AbsoluteFill> : null}
  </AbsoluteFill>
);

/* ───────────── textures (loaded OUTSIDE the canvas, passed in as props) ───────────── */

const texCache = new Map<string, THREE.Texture>();

/** Load an image texture once, holding the render until it is decoded. */
export const useImageTexture = (url: string) => {
  const [tex, setTex] = useState<THREE.Texture | null>(() => texCache.get(url) ?? null);
  const [handle] = useState(() => (texCache.has(url) ? null : delayRender(`hero texture ${url}`)));
  useEffect(() => {
    if (tex) {
      if (handle !== null) continueRender(handle);
      return;
    }
    new THREE.TextureLoader().load(
      url,
      (t) => {
        t.colorSpace = THREE.NoColorSpace;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.anisotropy = 4;
        texCache.set(url, t);
        setTex(t);
        if (handle !== null) continueRender(handle);
      },
      undefined,
      () => {
        if (handle !== null) continueRender(handle);
      },
    );
  }, [url, tex, handle]);
  return tex;
};

/** A canvas-2D texture drawn once fonts are ready (draw gets the 2D context). */
export const useCanvasTexture = (key: string, w: number, h: number, fonts: string[], draw: (g: CanvasRenderingContext2D) => void) => {
  const [tex, setTex] = useState<THREE.Texture | null>(() => texCache.get(key) ?? null);
  const [handle] = useState(() => (texCache.has(key) ? null : delayRender(`hero canvas texture ${key}`)));
  useEffect(() => {
    if (tex) {
      if (handle !== null) continueRender(handle);
      return;
    }
    let dead = false;
    Promise.all(fonts.map((f) => document.fonts.load(f)))
      .catch(() => null)
      .then(() => {
        if (dead) return;
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const g = c.getContext("2d");
        if (g) draw(g);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.NoColorSpace;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.anisotropy = 4;
        t.needsUpdate = true;
        texCache.set(key, t);
        setTex(t);
        if (handle !== null) continueRender(handle);
      });
    return () => {
      dead = true;
    };
    // draw is static per key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tex, handle]);
  return tex;
};

/* ───────────── shared GL helpers ───────────── */

/** additive light that leaves canvas alpha untouched (so it ADDS onto the DOM layers below) */
export const additive = <M extends THREE.Material>(m: M): M => {
  m.blending = THREE.CustomBlending;
  m.blendEquation = THREE.AddEquation;
  m.blendSrc = THREE.OneFactor;
  m.blendDst = THREE.OneFactor;
  m.blendSrcAlpha = THREE.ZeroFactor;
  m.blendDstAlpha = THREE.OneFactor;
  m.transparent = true;
  m.depthWrite = false;
  return m;
};

/** Depth-only plane: hides canvas content that is behind an `under` CSS3D plane. */
export const Occluder: React.FC<{ matrix: THREE.Matrix4; w: number; h: number; radius?: number }> = ({ matrix, w, h, radius = 0 }) => {
  const geo = useMemo(() => {
    if (radius <= 0) return new THREE.PlaneGeometry(w, h);
    return new THREE.ShapeGeometry(roundedRectShape(w, h, radius), 8);
  }, [w, h, radius]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true }), []);
  const mesh = useMemo(() => {
    const m = new THREE.Mesh(geo, mat);
    m.matrixAutoUpdate = false;
    m.renderOrder = -10;
    return m;
  }, [geo, mat]);
  mesh.matrix.copy(matrix);
  mesh.matrixWorldNeedsUpdate = true;
  return <primitive object={mesh} />;
};

export const roundedRectShape = (w: number, h: number, r: number) => {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
};

/* ───────────── small maths ───────────── */
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (u: number) => {
  const v = clamp01(u);
  return v * v * v * (10 + v * (-15 + 6 * v));
};
export const lerpV = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({
  pos: lerpV(a.pos, b.pos, t),
  target: lerpV(a.target, b.target, t),
  fov: (a.fov ?? 40) + ((b.fov ?? 40) - (a.fov ?? 40)) * t,
  roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * t,
});
