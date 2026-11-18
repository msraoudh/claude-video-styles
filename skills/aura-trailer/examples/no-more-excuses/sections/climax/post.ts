import * as THREE from "three";
import { newScene } from "./three-shim";

/**
 * Minimal frame-driven post pass for an R3F scene inside <ThreeCanvas>: render the scene into a half-float
 * target, then draw a full-screen quad with our own shader (glitch / chromatic split / haze).
 * Tone mapping + output colour space are applied in the quad (three only applies them on the default framebuffer).
 * Drive it from useFrame(..., 1) so R3F does not render on its own.
 */
export const POST_VS = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const makePost = (w: number, h: number, fragmentShader: string, uniforms: Record<string, THREE.IUniform>) => {
  const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 });
  const mat = new THREE.ShaderMaterial({
    vertexShader: POST_VS,
    fragmentShader,
    uniforms: { tDiffuse: { value: rt.texture }, ...uniforms },
    depthTest: false,
    depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  const scene = newScene();
  scene.add(quad);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const render = (gl: THREE.WebGLRenderer, s: THREE.Object3D, c: THREE.Camera, clear: THREE.Color) => {
    gl.setRenderTarget(rt);
    gl.setClearColor(clear, 1);
    gl.clear();
    gl.render(s, c);
    gl.setRenderTarget(null);
    gl.render(scene, cam);
  };
  return { rt, mat, render };
};
