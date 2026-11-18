import { CAP, inkExtent, inkWidthEm } from "./glyphs";

/**
 * Series lockup « DEVOPS EN / (45) / SECONDES » — geometry shared by the 3D glass (texture + word masks),
 * the DOM overlays (flares, glows) and the Cover. Ported from the brand intro (s3/layout.ts), sized down so the
 * daily ident also carries the episode title under it. Units: SCREEN px at the pane plane, relative to the block
 * centre (x right, y DOWN). The camera lens-shifts so the block centre sits at screen (540, TITLE_CY).
 *
 *   DEVOPS EN      white, justified to BLOCK_W
 *   ( 45 )         AMBER hero inside the cyan ring timer (the series' signature mark)
 *   SECONDES       white, justified to BLOCK_W
 * Everything of the ident sits inside the central 1080x1080 square (y 420–1500) so the same frame is the Cover.
 */
export const W = 1080;
export const H = 1920;
export const TITLE_CY = 772;
export const BLOCK_W = 580;
export const TR = -0.03; // tracking (em)
export const L1 = "DEVOPS EN";
export const L3 = "SECONDES";
export const RING_R = 146; // ring centre-line radius
export const RING_W = 7.6; // ring stroke = 2.6 % of the diameter, like the series' RingTimer
const GAP = 26;

type Rect = { x0: number; y0: number; x1: number; y1: number };

const s1 = BLOCK_W / inkWidthEm(L1, TR);
const s3 = BLOCK_W / inkWidthEm(L3, TR);
const cap1 = CAP * s1;
const cap3 = CAP * s3;
// « 45 »: as big as the ring allows (its ink box half-diagonal clears the ring by a margin)
const w45em = inkWidthEm("45", -0.02);
const s45 = (RING_R - RING_W / 2 - 24) / Math.hypot((w45em / 2) * 1, CAP / 2);
const totalH = cap1 + GAP + 2 * RING_R + RING_W + GAP + cap3;
const top = -totalH / 2;

const lineX = (text: string, size: number, tr: number) => {
  const [l, r] = inkExtent(text, size, tr);
  return -(l + r) / 2; // pen x so the INK is centred on 0
};

export const LAY = (() => {
  const b1 = top + cap1;
  const ringCy = b1 + GAP + RING_R + RING_W / 2;
  const b3 = ringCy + RING_R + RING_W / 2 + GAP + cap3;
  const x1 = lineX(L1, s1, TR);
  const x3 = lineX(L3, s3, TR);
  const x45 = lineX("45", s45, -0.02);
  const b45 = ringCy + (CAP * s45) / 2;
  // word split inside line 1: « DEVOPS » | « EN »
  const devR = x1 + inkExtent("DEVOPS", s1, TR)[1];
  const enL = x1 + inkExtent("DEVOPS EN", s1, TR)[1] - (inkExtent("EN", s1, TR)[1] - inkExtent("EN", s1, TR)[0]);
  const split = (devR + enL) / 2;
  const pad = 12;
  const rects: Record<"devops" | "en" | "n45" | "secondes", Rect> = {
    devops: { x0: -BLOCK_W / 2 - pad, y0: b1 - cap1 - pad, x1: split, y1: b1 + pad },
    en: { x0: split, y0: b1 - cap1 - pad, x1: BLOCK_W / 2 + pad, y1: b1 + pad },
    n45: { x0: x45 - pad, y0: b45 - CAP * s45 - pad, x1: -x45 + pad, y1: b45 + pad },
    secondes: { x0: -BLOCK_W / 2 - pad, y0: b3 - cap3 - pad, x1: BLOCK_W / 2 + pad, y1: b3 + pad },
  };
  return {
    s1, s3, s45, cap1, cap3, b1, b3, b45, x1, x3, x45, ringCy, top, totalH, rects,
    /** centres of the words (block px) — DOM flares / glows */
    at: {
      devops: { x: (rects.devops.x0 + rects.devops.x1) / 2, y: b1 - cap1 / 2 },
      en: { x: (rects.en.x0 + rects.en.x1) / 2, y: b1 - cap1 / 2 },
      n45: { x: 0, y: ringCy },
      secondes: { x: 0, y: b3 - cap3 / 2 },
    },
  };
})();

/** block px → screen px (k = perspective scale of the pane plane from the camera push) */
export const toScreen = (bx: number, by: number, k = 1, cy = TITLE_CY) => ({ x: W / 2 + bx * k, y: cy + by * k });
/** screen y of the lockup's top / bottom edge (k = 1) */
export const LOCKUP_TOP = TITLE_CY + LAY.top;
export const LOCKUP_BOTTOM = TITLE_CY + LAY.totalH / 2;
