import * as THREE from "three";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { INTER800 } from "./inter800";

/** Inter ExtraBold glyphs (subset) as a three.js Font + layout / Path2D helpers. em = 1 unit. */
type GlyphData = { ha: number; x_min: number; x_max: number; o: string };
const DATA = INTER800 as unknown as { glyphs: Record<string, GlyphData>; resolution: number; ascender: number; descender: number };
export const UPEM = DATA.resolution;
let _font: Font | null = null;
export const interFont = () => {
  if (!_font) _font = new Font(INTER800 as unknown as ConstructorParameters<typeof Font>[0]);
  return _font;
};
export const CAP = 0.727; // Inter cap height / em

export type Placed = { ch: string; x: number; y: number; adv: number; w: number };

/**
 * Lay a single line out at `size` (world units per em), centred on (0, cy) — cy is the CAP-height centre.
 * Returns each glyph's bounding-box centre (what geometry.center() pivots on).
 */
export const layoutLine = (text: string, size: number, cy: number, tracking = -0.02, kern: Record<string, number> = {}): Placed[] => {
  const out: Placed[] = [];
  let pen = 0;
  const chars = Array.from(text);
  chars.forEach((ch, i) => {
    const g = DATA.glyphs[ch];
    if (ch === " " || !g) {
      pen += 0.26 * size;
      return;
    }
    const adv = (g.ha / UPEM) * size;
    const cxg = ((g.x_min + g.x_max) / 2 / UPEM) * size;
    out.push({ ch, x: pen + cxg, y: 0, adv, w: ((g.x_max - g.x_min) / UPEM) * size });
    const pair = ch + (chars[i + 1] ?? "");
    pen += adv + tracking * size + (kern[pair] ?? 0) * size;
  });
  const first = out[0];
  const last = out[out.length - 1];
  const left = first.x - first.w / 2;
  const right = last.x + last.w / 2;
  const mid = (left + right) / 2;
  return out.map((p) => ({ ...p, x: p.x - mid, y: cy }));
};
export const lineWidth = (text: string, size: number, tracking = -0.02, kern: Record<string, number> = {}) => {
  const l = layoutLine(text, size, 0, tracking, kern);
  return l[l.length - 1].x + l[l.length - 1].w / 2 - (l[0].x - l[0].w / 2);
};

/** Extruded glyph geometry (em units), centred on its bounding box; also returns the front-cap geometry. */
export const glyphGeometry = (ch: string, depth: number, curveSegments = 6) => {
  const shapes = interFont().generateShapes(ch, 1);
  const geo = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: false, curveSegments });
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const c = new THREE.Vector3();
  bb.getCenter(c);
  geo.translate(-c.x, -c.y, -c.z);
  const cap = new THREE.ShapeGeometry(shapes, curveSegments);
  cap.translate(-c.x, -c.y, depth - c.z + 0.002);
  // vertical offset of the glyph's bbox centre from the cap-height centre (e.g. "." sits low)
  const yOff = c.y - CAP / 2;
  return { geo, cap, yOff };
};

/** Draw a text line with the glyph outlines on a 2D canvas (no web-font dependency). x,y = left baseline in px. */
export const drawText = (ctx: CanvasRenderingContext2D, text: string, x: number, baseline: number, px: number, tracking = -0.035, kern: Record<string, number> = {}) => {
  const s = px / UPEM;
  let pen = x;
  const chars = Array.from(text);
  chars.forEach((ch, i) => {
    const g = DATA.glyphs[ch];
    if (ch === " " || !g) {
      pen += 0.26 * px;
      return;
    }
    const o = g.o.split(" ");
    const p = new Path2D();
    for (let k = 0; k < o.length; ) {
      const a = o[k++];
      if (a === "m") {
        p.moveTo(pen + +o[k++] * s, baseline - +o[k++] * s);
      } else if (a === "l") {
        p.lineTo(pen + +o[k++] * s, baseline - +o[k++] * s);
      } else if (a === "q") {
        const ex = pen + +o[k++] * s, ey = baseline - +o[k++] * s;
        const cx = pen + +o[k++] * s, cy = baseline - +o[k++] * s;
        p.quadraticCurveTo(cx, cy, ex, ey);
      } else if (a === "b") {
        const ex = pen + +o[k++] * s, ey = baseline - +o[k++] * s;
        const c1x = pen + +o[k++] * s, c1y = baseline - +o[k++] * s;
        const c2x = pen + +o[k++] * s, c2y = baseline - +o[k++] * s;
        p.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
      }
    }
    ctx.fill(p, "nonzero");
    const pair = ch + (chars[i + 1] ?? "");
    pen += (g.ha / UPEM) * px + tracking * px + (kern[pair] ?? 0) * px;
  });
  return pen - x;
};
/** width in px of a line drawn by drawText (advance-based, minus the trailing tracking) */
export const textAdvance = (text: string, px: number, tracking = -0.035, kern: Record<string, number> = {}) => {
  let w = 0;
  const chars = Array.from(text);
  chars.forEach((ch, i) => {
    const g = DATA.glyphs[ch];
    if (ch === " " || !g) {
      w += 0.26 * px;
      return;
    }
    w += (g.ha / UPEM) * px + (i < chars.length - 1 ? tracking * px + (kern[ch + chars[i + 1]] ?? 0) * px : 0);
  });
  return w;
};
