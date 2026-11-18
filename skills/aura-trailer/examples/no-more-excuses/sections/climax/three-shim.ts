import * as THREE from "three";

/**
 * The installed @types/three is missing its `src/scenes` folder (Scene / Fog / FogExp2 have no types here),
 * so construct those through the runtime module with a local structural type.
 */
export type SceneLike = THREE.Object3D & {
  background: THREE.Color | THREE.Texture | null;
  environment: THREE.Texture | null;
  fog: unknown;
  environmentRotation: THREE.Euler;
};
const T3 = THREE as unknown as Record<string, unknown>;
export const newScene = () => new (T3.Scene as new () => SceneLike)();
export const newFogExp2 = (color: THREE.Color, density: number) => new (T3.FogExp2 as new (c: THREE.Color, d: number) => object)(color, density);
