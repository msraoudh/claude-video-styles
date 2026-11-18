import { INTER800 } from "./inter800";

/**
 * Inter ExtraBold outlines (uppercase / digits subset, copied from the me-trailer climax) drawn straight onto a
 * 2D canvas — no web-font wait inside the WebGL texture. em = `px`.
 */
type GlyphData = { ha: number; x_min: number; x_max: number; o: string };
const DATA = INTER800 as unknown as { glyphs: Record<string, GlyphData>; resolution: number };
export const UPEM = DATA.resolution;
export const CAP = 0.727; // Inter cap height / em (digits sit on the same height)

/** Draw a text line with the glyph outlines. x,y = left baseline in px. Returns the advance. */
export const drawText = (ctx: CanvasRenderingContext2D, text: string, x: number, baseline: number, px: number, tracking = -0.035) => {
  const s = px / UPEM;
  let pen = x;
  const chars = Array.from(text);
  chars.forEach((ch) => {
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
    pen += (g.ha / UPEM) * px + tracking * px;
  });
  return pen - x;
};

/** visible ink extent of a line drawn by drawText: [left, right] offsets from x (px) */
export const inkExtent = (text: string, px: number, tracking = -0.035): [number, number] => {
  const chars = Array.from(text);
  let pen = 0;
  let left = Infinity;
  let right = -Infinity;
  chars.forEach((ch) => {
    const g = DATA.glyphs[ch];
    if (ch === " " || !g) {
      pen += 0.26 * px;
      return;
    }
    left = Math.min(left, pen + (g.x_min / UPEM) * px);
    right = Math.max(right, pen + (g.x_max / UPEM) * px);
    pen += (g.ha / UPEM) * px + tracking * px;
  });
  return [left, right];
};
/** visible ink width of a line in em (size 1) */
export const inkWidthEm = (text: string, tracking = -0.035) => {
  const [l, r] = inkExtent(text, 1, tracking);
  return r - l;
};
