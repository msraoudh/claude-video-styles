import { Easing, interpolate } from "remotion";
import { f } from "./cues";

/**
 * Recommended cinematic camera moves (NOT wired into timeline.ts — merge them into cameraAt()).
 *
 * Semantics
 * - `at` / `len`: seconds on the ORIGINAL cut timeline (convert with sec(), like everything else).
 * - `scale`: a MULTIPLIER applied on top of the existing per-clip FRAMING (which already alternates
 *   ~1.0 / ~1.1 on every jump cut to hide it). Every value is >= 1.0, so the plate can only get
 *   bigger and its edges never show from scale alone.
 * - `rotateDeg`: dutch angle in degrees (positive = clockwise). Rotation needs extra coverage:
 *   clamp the final camera scale with `coverScale()` below (pivot = Footage's transformOrigin 50% 30%).
 * - `drift`: optional slow translate in px [[x0,y0],[x1,y1]] (also covered by `coverScale()`).
 * - `ease`: 'inOut' = dolly-like (EASE_IN_OUT), 'out' = settles (EASE_OUT).
 * Outside a move: multiplier 1, rotation 0, drift 0.
 */
export type CineMove = {
  at: number;
  len: number;
  scale: [number, number];
  rotateDeg?: [number, number];
  drift?: [[number, number], [number, number]];
  ease: "inOut" | "out";
  why: string;
};

export const CINE_MOVES: CineMove[] = [
  // ---- hook (warm, playful, clean) ---------------------------------------------------------
  { at: 0.87, len: 1.3, scale: [1.045, 1.0], rotateDeg: [-0.8, 0], ease: "out", why: "After the snap zoom the frame lands with a small roll settle — handheld-cinema, not static webcam." },
  { at: 2.93, len: 1.8, scale: [1.0, 1.035], ease: "inOut", why: "'peut-être l'algo…': a slow dolly-in builds curiosity toward the algo card." },
  { at: 6.2, len: 1.45, scale: [1.07, 1.0], ease: "out", why: "'moi c'est the user': a gentle pull-back introduces him while the name lands." },

  // ---- the struggle (colder, heavier) ------------------------------------------------------
  { at: 11.97, len: 2.05, scale: [1.0, 1.0], rotateDeg: [0, -1.2], ease: "inOut", why: "'Mais frère…': the existing tension push gets a slow dutch tilt — the world goes off-balance." },
  { at: 14.03, len: 0.93, scale: [1.0, 1.0], rotateDeg: [-1.2, -1.5], ease: "inOut", why: "'depuis longtemps': hold the unease into the MONTAGE punch." },
  { at: 15.97, len: 2.65, scale: [1.03, 1.06], rotateDeg: [0.6, -0.4], ease: "inOut", why: "'des idées de fou': a weightless floating push for the daydream." },
  { at: 18.63, len: 2.5, scale: [1.0, 1.04], ease: "inOut", why: "'je savais exactement…': confident slow push — he can see the dream render." },
  { at: 23.77, len: 3.55, scale: [1.07, 1.0], ease: "inOut", why: "'la flemme… trop compliqué': a slow pull-out, he shrinks under the pile of tutorials." },
  { at: 28.5, len: 2.75, scale: [1.04, 1.06], rotateDeg: [0, 1.0], drift: [[0, 0], [-16, 0]], ease: "inOut", why: "'je repoussais toujours': the frame slides and tilts away — procrastination as camera motion." },

  // ---- hope (Claude) -----------------------------------------------------------------------
  { at: 36.07, len: 1.55, scale: [1.0, 1.05], ease: "inOut", why: "'j'ai commencé à utiliser Claude': start moving in BEFORE the name so the reveal (and its 1.06 punch) lands in motion." },
  { at: 37.63, len: 1.84, scale: [1.03, 1.05], rotateDeg: [0, 0.6], ease: "inOut", why: "'pour m'aider…': lean toward the spark / Claude card." },
  { at: 39.47, len: 2.95, scale: [1.0, 1.06], ease: "inOut", why: "'couleurs, animations, effets': the build — slow push while the music filter opens." },

  // ---- suspense + drop ---------------------------------------------------------------------
  { at: 42.43, len: 1.5, scale: [1.0, 1.0], rotateDeg: [0, -2.2], ease: "inOut", why: "'mais wesh,': the dramatic push gets a creeping dutch angle — suspense, something is about to break." },
  { at: 43.93, len: 0.35, scale: [1.0, 1.0], rotateDeg: [1.6, 0], ease: "out", why: "DROP: the frame kicks the other way and snaps level on the bass hit." },
  { at: 45.1, len: 1.5, scale: [1.0, 1.03], drift: [[0, 18], [0, -18]], ease: "inOut", why: "'je me lance': a boom-up that follows the rocket." },

  // ---- outro (confident, golden) ---------------------------------------------------------
  { at: 46.6, len: 3.85, scale: [1.0, 1.05], ease: "inOut", why: "'je vais partager mes projets…': confident slow push, the promise." },
  { at: 52.23, len: 1.1, scale: [1.05, 1.0], ease: "out", why: "'Et maintenant, en français': open the frame for the VERSION FR statement." },
  { at: 55.03, len: 1.4, scale: [1.0, 1.06], rotateDeg: [0, 1.2], ease: "inOut", why: "'…parler tout seul' 🦗: comic awkward creep-in with a slight tilt." },
  { at: 57.57, len: 2.55, scale: [1.045, 1.045], rotateDeg: [-0.8, 0.8], ease: "inOut", why: "'la tech, l'IA, le cloud': the camera arcs with the 3D chips orbiting his head." },
  { at: 62.33, len: 1.0, scale: [1.0, 1.06], ease: "inOut", why: "'reste dans le coin': intimate push-in for the ask." },
  { at: 63.33, len: 0.97, scale: [1.06, 1.0], ease: "out", why: "'Salut !': release — pull back and let him go." },
];

const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * The combined recommended move at `frame`: { scale multiplier, rotate deg, x px, y px }.
 * Merge: scale = max(framingScale * m.scale, coverScale(m.rotate, m.x + shakeX, m.y + shakeY)), rotate += m.rotate, etc.
 */
export const cineMoveAt = (frame: number, moves: CineMove[] = CINE_MOVES) => {
  let scale = 1;
  let rotate = 0;
  let x = 0;
  let y = 0;
  for (const m of moves) {
    const a = f(m.at);
    const b = f(m.at + m.len);
    if (frame < a || frame >= b || b <= a) continue;
    const opts = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: m.ease === "out" ? EASE_OUT : EASE_IN_OUT } as const;
    scale *= interpolate(frame, [a, b], m.scale, opts);
    if (m.rotateDeg) rotate += interpolate(frame, [a, b], m.rotateDeg, opts);
    if (m.drift) {
      x += interpolate(frame, [a, b], [m.drift[0][0], m.drift[1][0]], opts);
      y += interpolate(frame, [a, b], [m.drift[0][1], m.drift[1][1]], opts);
    }
  }
  return { scale, rotate, x, y };
};

/**
 * Minimum camera scale so the rotated / translated plate still covers the whole frame.
 * Pivot defaults to Footage's transformOrigin (50% 30%). Use as: finalScale = Math.max(scale, coverScale(r, x, y)).
 */
export const coverScale = (rotDeg: number, tx = 0, ty = 0, width = 1080, height = 1920, originX = 0.5, originY = 0.3) => {
  const th = (-rotDeg * Math.PI) / 180;
  const c = Math.cos(th);
  const s = Math.sin(th);
  const ox = width * originX;
  const oy = height * originY;
  let need = 1;
  const corners: [number, number][] = [
    [0, 0],
    [width, 0],
    [0, height],
    [width, height],
  ];
  for (const [qx, qy] of corners) {
    // corner of the frame expressed in the (unscaled, unrotated) plate around the pivot
    const vx = qx - ox - tx;
    const vy = qy - oy - ty;
    const dx = vx * c - vy * s;
    const dy = vx * s + vy * c;
    need = Math.max(need, dx > 0 ? dx / (width - ox) : -dx / ox, dy > 0 ? dy / (height - oy) : -dy / oy);
  }
  return need;
};
