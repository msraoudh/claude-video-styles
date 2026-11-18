// PLACEHOLDER — overwritten by aura-trailer/scripts/plan.py from trailer.json.
/** letterbox bar height (px): each curve is [frame, px] points, interpolated and clamped; the max wins */
export const LETTERBOX: [number, number][][] = [];
/** white flash frames (big hits before FX_LIVE_UNTIL + the extra ones from trailer.json) */
export const FLASH_FRAMES: number[] = [];
/** after this frame the music is dead (tape stop): no more flashes / fringe */
export const FX_LIVE_UNTIL = 599;
export const GRAIN = 0.11;
