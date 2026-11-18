import React from "react";
import { fontInter } from "../../kit/fonts";
import { useGlobalFrame } from "../../lib/beat";
import { L } from "../../lib/look";
import { clamp01, EO, lin, smooth } from "./lib";

/**
 * « CODE SLICE » wall — port of the code-slice-hero technique (HyperFrames block) to CSS 3D, frame-driven:
 * one square-tile surface carries a FRONT headline and a REAR headline; a depth field sweeps across the tiles,
 * they lift, tilt and turn over (180° about Y, damped bounce) to reveal the rear headline.
 * Here the sweep is a SHOCKWAVE radiating from the user's head on the big 808 (2260), and the front headline is
 * built word by word on the beats (tiles of each word slice in from the camera).
 */
export type WallLine = { text: string; y: number; size: number; at?: number; color?: string; outline?: boolean; opacity?: number };

const CELL = 90;
const COLS = 12;
const TOP = 210;
const ROWS = 11;

const Layer: React.FC<{ lines: WallLine[]; g: number; ox: number; oy: number }> = ({ lines, g, ox, oy }) => (
  <div style={{ position: "absolute", left: -ox, top: -oy, width: 1080, height: 1920 }}>
    {lines.map((l, i) =>
      l.at !== undefined && g < l.at ? null : (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            top: l.y,
            width: 1080,
            textAlign: "center",
            fontFamily: fontInter,
            fontWeight: 800,
            fontSize: l.size,
            lineHeight: 0.82,
            letterSpacing: "-0.04em",
            whiteSpace: "nowrap",
            color: l.outline ? "transparent" : l.color ?? L.steel,
            WebkitTextStroke: l.outline ? `3px ${l.color ?? L.steel}` : undefined,
            opacity: l.opacity ?? 1,
          }}
        >
          {l.text}
        </div>
      ),
    )}
  </div>
);

const hash = (c: number, r: number, a: number, b: number) => {
  const v = Math.sin(c * a + r * b) * 43758.5453;
  return v - Math.floor(v);
};

export const SliceWall: React.FC<{
  front: WallLine[];
  back: WallLine[];
  /** frame of the flip shockwave */
  flipAt: number;
  /** origin of the shockwave (screen px) */
  ox: number;
  oy: number;
  /** wave speed px/frame */
  speed?: number;
  flipFrames?: number;
}> = ({ front, back, flipAt, ox, oy, speed = 92, flipFrames = 14 }) => {
  const g = useGlobalFrame();
  const R = (g - flipAt) * speed; // wavefront radius
  const tiles: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * CELL, y = TOP + r * CELL;
      const cx = x + CELL / 2, cy = y + CELL / 2;
      // which front word band does this tile belong to (it slices in when that word lands)
      let landAt = -Infinity;
      for (const l of front) {
        if (l.at !== undefined && cy >= l.y - 10 && cy <= l.y + l.size * 0.86 + 10) landAt = Math.max(landAt, l.at);
      }
      const delay = Math.abs(c - 5.5) * 0.45 + hash(c, r, 12.9, 78.2) * 1.2;
      const lp = landAt === -Infinity ? 1 : lin(g, landAt + delay - 1, landAt + delay + 6, 0, 1, EO);
      if (lp <= 0.001) continue;
      // shockwave flip
      const d = Math.hypot(cx - ox, cy - oy);
      const pass = flipAt + d / speed + hash(c, r, 269.5, 183.3) * 0.8;
      const fp = clamp01((g - pass) / flipFrames);
      const turn = smooth(fp / 0.64);
      const ringT = clamp01((fp - 0.64) / 0.36);
      const ringEnv = smooth(ringT / 0.12) * Math.exp(-3.3 * ringT) * (1 - smooth((ringT - 0.72) / 0.28));
      const bounce = 0.18 * 36 * Math.sin(ringT * Math.PI * 3.3) * ringEnv;
      const flight = Math.pow(Math.sin(Math.PI * fp), 0.7);
      const dir = cx < ox ? -1 : 1;
      // depth field around the wavefront + anticipation before the hit
      const field = g >= flipAt ? Math.exp(-(((d - R) / 150) ** 2)) * Math.exp(-(g - flipAt) / 22) : 0;
      const pre = g < flipAt ? smooth((g - (flipAt - 14)) / 14) * Math.exp(-((d / 420) ** 2)) : 0;
      const phase = hash(c, r, 127.1, 311.7) * 6.283;
      const jitter = (field + flight) * (Math.sin(g * 0.5 + phase) * 2.2);
      const ry = dir * (180 * turn + bounce) + jitter * 0.6;
      const rx = ((cy - oy) / 600) * 26 * field + jitter;
      const rz = (hash(c, r, 97.3, 127.9) - 0.5) * 6 * (flight + field);
      const z = 120 * field + 26 * flight + 26 * pre + (1 - lp) * 520;
      const lx = (1 - lp) * (cx - ox) * 0.25;
      const ly = (1 - lp) * -40;
      const shade = 1 - 0.28 * Math.abs(Math.sin((ry * Math.PI) / 180)) - 0.1 * field;
      const op = clamp01(lp * 1.4);
      const faceBase: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        background: "rgba(7,11,19,0.84)",
        boxShadow: "inset 0 0 0 1px rgba(230,237,247,0.045), inset 0 1px 0 rgba(230,237,247,0.07)",
        filter: shade < 0.995 ? `brightness(${shade.toFixed(3)})` : undefined,
      };
      tiles.push(
        <div
          key={`${c}-${r}`}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: CELL,
            height: CELL,
            transformStyle: "preserve-3d",
            transform: `translate3d(${lx.toFixed(1)}px, ${ly.toFixed(1)}px, ${z.toFixed(1)}px) rotateX(${(rx + (1 - lp) * 40).toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`,
            opacity: op,
          }}
        >
          <div style={faceBase}>
            <Layer lines={front} g={g} ox={x} oy={y} />
          </div>
          <div style={{ ...faceBase, transform: "rotateY(180deg)" }}>
            <Layer lines={back} g={g} ox={x} oy={y} />
          </div>
        </div>,
      );
    }
  }
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1500, perspectiveOrigin: `${ox}px ${Math.min(oy, 900)}px` }}>
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>{tiles}</div>
    </div>
  );
};
