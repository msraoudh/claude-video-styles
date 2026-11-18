// HERO (DROP 1) — every cut, as GLOBAL frames, all taken from data/beats.ts (BEATS / DOWNBEATS / KEY).
// Beats in range: 758 788 820D 851 882 912 943D 975 1007 1040 1072D 1106 1138 1171 1203D 1236 1266
//                 1295 1325D 1354 1383 1415 1447D 1479 1513 1545 1577D 1610 1644 1676 1704D 1733 1764 1794 | 1804 = next section
import { KEY } from "../../data/beats";
import { line } from "../../data/voice";

export const SEC_FROM = 757; // KEY.drop1 (808 hit) — the section's first frame
export const SEC_TO = 1804; // KEY.bassSection (escalate agent)
export const B = line("B"); // « Dans ma tête, j'avais les idées de fou. » 1188–1288

/** half-beat between two beats (strobe grid) */
const half = (a: number, b: number) => Math.round((a + b) / 2);

export const T = {
  drop: KEY.drop1, // 757 — name reveal (tile flip) starts on the hit
  ripple: 788, // beat — depth ripple through the tiles, handle lands
  angle2: 820, // downbeat — camera cut, tiles turn over to his portrait
  hud: 851, // beat — name block + tags + route on the slab
  angle3: 882, // beat — camera cut, face lock-on
  dive: 912, // beat — camera dives into the portrait
  m1: 943, // downbeat — match cut: the portrait comes alive (f18)
  m1b: 1007,
  m1c: 1072, // downbeat
  m1d: 1106,
  m1e: 1138,
  bFreeze: 1171, // beat — master-v4 frozen (mono) → unfreezes on the first word at B.from (1188)
  bPunch: 1203, // downbeat — jump punch-in
  bWide: 1236, // beat — wide, dark void, « IDÉES » behind him on the word (1248)
  bFou: 1266, // beat — punch on « FOU »
  w1: 1295, // beat — HE BUILDS: n8n station
  w1label: 1325, // downbeat
  f1: 1354, // beat — face cutaway
  w2: 1383, // beat — SECRÉTAIRE IA station
  w2hit: 1415, // beat — SUCCESS
  f2: 1447, // downbeat — face cutaway
  w3: 1479, // beat — BLENDER × CLAUDE station
  w3hit: 1513, // beat
  w4: 1545, // beat — REVERSE ENGINEERING
  wall: 1577, // downbeat — the reel wall flips (les 1000 versions)
  stats: 1610, // beat — 52 REELS · 4 900 ABONNÉS · 134K VUES
  m2a: 1644,
  m2b: 1676,
  m2c: 1704, // downbeat — half-beat strobe starts
  m2d: half(1704, 1733), // 1718
  m2e: 1733,
  m2f: half(1733, 1764), // 1748
  m2g: 1764,
  m2h: half(1764, 1794), // 1779
  last: 1794, // beat — final freeze push into 1804
} as const;

/** flash frames (2–4 frame strobes of other outfits) on half-beats inside the 2-beat holds */
export const FLASHES = [
  { f: 975, len: 4, clip: "f19", at: 2.0 },
  { f: 1040, len: 3, clip: "f14", at: 1.2 },
  { f: half(1072, 1106), len: 3, clip: "f23", at: 2.2 }, // 1089
  { f: half(1138, 1171), len: 3, clip: "f21", at: 1.6 }, // 1155
] as const;
