import React from "react";
import { Matte } from "../../components/Shot";
import { bassShake, useGlobalFrame } from "../../lib/beat";
import type { Grade } from "../../lib/look";

/**
 * the user cut out of the master-v4 master (alpha matte), placed freely on a dark stage — for text BEHIND him.
 *
 * The master is framed with his hair touching the top edge, so a moved/scaled cut-out would show a flat cut on the
 * hair. A dome mask (ellipse over the head, union with the body below the chin) rounds the top of the head, and the
 * frame sides are feathered (the adaptive-glass camera-pane recipe: transparent edge → solid in ~70 px), so the
 * cut-out sits cleanly on black at any scale.
 *
 * Geometry is in MASTER pixels (1080x1920): the head ellipse `head = [cx, cy, rx, ry]`. Screen placement:
 * screen = master * s + [x, y]. Use `placeHead()` to put the head centre where you want it.
 */
export type CutoutProps = {
  at: number;
  speed?: number | ((lf: number) => number);
  s: number;
  x: number;
  y: number;
  /** extra transform (degrees) — dutch tilt etc. */
  rot?: number;
  head?: [number, number, number, number];
  grade?: Grade;
  filter?: string;
  /** cold rim glow around the silhouette (0..1) */
  rim?: number;
  rimCol?: string;
  /** soft contact shadow he casts on the type behind him (0..1) — sells the depth of text-behind-subject */
  shadow?: number;
  /** sub-bass camera shake (px at full bass) applied to the whole cut-out (mask moves with him) */
  shake?: number;
  opacity?: number;
};

export const HEAD: [number, number, number, number] = [410, 360, 300, 352];

/** returns {x, y} so that the master head centre lands at screen (hx, hy) at scale s */
export const placeHead = (s: number, hx: number, hy: number, head = HEAD) => ({ x: hx - head[0] * s, y: hy - head[1] * s });

export const Cutout: React.FC<CutoutProps> = ({ at, speed = 0, s, x, y, rot = 0, head = HEAD, grade = "cold", filter = "brightness(0.86) saturate(0.72) contrast(1.1)", rim = 0.35, rimCol = "rgba(125,211,252,0.45)", shadow = 0.5, shake = 0, opacity = 1 }) => {
  const g = useGlobalFrame();
  const sh = shake ? bassShake(g, shake) : { x: 0, y: 0, r: 0 };
  const [cx, cy, rx, ry] = head;
  const headMask = `radial-gradient(ellipse ${rx}px ${ry}px at ${cx}px ${cy}px, #000 0%, #000 93%, rgba(0,0,0,0) 100%)`;
  const b0 = Math.round(cy + ry * 0.5), b1 = Math.round(cy + ry * 0.78);
  const bodyMask = `linear-gradient(180deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) ${b0}px, #000 ${b1}px)`;
  // the master's frame edges cut his arms: let the sides and the bottom fall into darkness
  const sideMask = "linear-gradient(90deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0.35) 70px, #000 250px, #000 830px, rgba(0,0,0,0.35) 1010px, rgba(0,0,0,0) 1080px)";
  const bottomMask = "linear-gradient(180deg, #000 0px, #000 1250px, rgba(0,0,0,0.5) 1560px, rgba(0,0,0,0) 1900px)";
  // rim: a cold backlight glow behind the head (cheaper and cleaner than a drop-shadow on the whole video layer)
  const glow = rim > 0.01 ? `radial-gradient(ellipse ${rx * 1.45}px ${ry * 1.3}px at ${cx}px ${cy - 20}px, ${rimCol} 0%, rgba(0,0,0,0) 70%)` : "";
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1080,
        height: 1920,
        transformOrigin: "0 0",
        transform: `translate(${x + sh.x}px, ${y + sh.y}px) rotate(${rot + sh.r}deg) scale(${s})`,
        opacity,
      }}
    >
      {shadow > 0.01 ? <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse ${rx * 1.25}px ${ry * 1.15}px at ${cx + 46}px ${cy + 40}px, rgba(0,0,0,${(0.62 * shadow).toFixed(3)}) 0%, rgba(0,0,0,${(0.3 * shadow).toFixed(3)}) 55%, rgba(0,0,0,0) 100%)` }} /> : null}
      {glow ? <div style={{ position: "absolute", inset: 0, background: glow, opacity: Math.min(1, rim * 2), mixBlendMode: "screen" }} /> : null}
      <div style={{ position: "absolute", inset: 0, maskImage: sideMask, WebkitMaskImage: sideMask }}>
        <div style={{ position: "absolute", inset: 0, maskImage: bottomMask, WebkitMaskImage: bottomMask }}>
          <div style={{ position: "absolute", inset: 0, maskImage: `${headMask}, ${bodyMask}`, WebkitMaskImage: `${headMask}, ${bodyMask}` }}>
            <Matte at={at} speed={speed} grade={grade} filter={filter} />
          </div>
        </div>
      </div>
    </div>
  );
};
