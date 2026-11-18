import cut from "./data/cut.json";
import { EASE_IN_OUT, EASE_OUT, lerp, sec, shake } from "./lib/motion";
import { interpolate } from "remotion";
import { cineMoveAt, coverScale } from "./cinematic/zooms";

export const FPS = 30;
export const TOTAL_FRAMES = cut.totalF; // 1929

/** Which clip of the cut is on screen at `frame`. */
export const clipAt = (frame: number) => {
  let i = 0;
  while (i + 1 < cut.clips.length && cut.clips[i + 1].cutStartF <= frame) i++;
  return i;
};

/**
 * Framing per clip: [scale at clip start, scale at clip end].
 * Alternating wide/tight hides the jump cuts; a few clips carry a deliberate move.
 */
const FRAMING: [number, number][] = [
  [1.22, 1.1], // 0  Hé, bon. (snap in)
  [1.0, 1.03], // 1  Cette fois, on tente en français
  [1.12, 1.14], // 2  On sait jamais
  [1.0, 1.04], // 3  peut-être l'algo...
  [1.12, 1.14], // 4  Bon, pour ceux qui me connaissent pas
  [1.0, 1.03], // 5  moi c'est the user
  [1.08, 1.1], // 6  le cloud, l'IA
  [1.0, 1.0], // 7  bref
  [1.1, 1.12], // 8  j'aime bien tester des trucs
  [1.0, 1.03], // 9  apprendre et construire
  [1.0, 1.12], // 10 Mais frère... (slow tension push)
  [1.13, 1.17], // 11 depuis longtemps
  [1.3, 1.34], // 12 LE MONTAGE VIDÉO (punch)
  [1.0, 1.03], // 13 Genre, dans ma tête
  [1.1, 1.13], // 14 Je savais exactement
  [1.0, 1.04], // 15 Mais au moment... (punch on "c'était")
  [1.06, 1.1], // 16 J'avais la flemme
  [1.2, 1.24], // 17 j'étais éclaté
  [1.0, 1.04], // 18 Du coup, je repoussais
  [1.1, 1.13], // 19 Je commencerai plus tard
  [1.0, 1.03], // 20 quand je maîtriserai
  [1.16, 1.0], // 21 Sauf que ce fameux plus tard... (comic pull-out)
  [1.0, 1.04], // 22 Et puis j'ai commencé à utiliser Claude
  [1.08, 1.1], // 23 pour m'aider à apprendre
  [1.0, 1.04], // 24 gérer les couleurs...
  [1.0, 1.26], // 25 Et là... mais wesh (dramatic push)
  [1.12, 1.16], // 26 POURQUOI J'ATTENDS ENCORE ? (drop)
  [1.18, 1.2], // 27 Donc voilà, je me lance enfin
  [1.0, 1.04], // 28 Je vais partager mes projets
  [1.08, 1.1], // 29 mes découvertes, mes galères
  [1.12, 1.14], // 30 Et maintenant, en français
  [1.0, 1.08], // 31 On va voir si les Français valident
  [1.14, 1.14], // 32 Bah bref
  [1.0, 1.03], // 33 si tu t'intéresses à la tech
  [1.08, 1.1], // 34 à des news
  [1.0, 1.03], // 35 et que t'aimes découvrir
  [1.1, 1.12], // 36 reste dans le coin
  [1.0, 1.02], // 37 Salut !
];

/** Extra punches inside a clip: [time s, scale multiplier, attack frames]. */
const PUNCHES: [number, number, number][] = [
  [22.46, 1.14, 3], // "c'était une autre histoire"
  [36.92, 1.06, 6], // "Claude"
];

/** Shakes: [time s, length frames, amplitude px]. */
const SHAKES: [number, number, number][] = [
  [15.04, 10, 12], // montage vidéo
  [22.46, 12, 16], // record scratch
  [27.78, 18, 30], // éclaté
  [43.93, 16, 26], // drop
];

export const cameraAt = (frame: number) => {
  const i = clipAt(frame);
  const c = cut.clips[i];
  // clips that were split by a later edit (stutter removal) keep their original framing (`orig`);
  // the second part gets a punch-in so the new jump cut reads as intentional
  const o = (c as { orig?: number }).orig ?? i;
  const part = (c as { part?: number }).part ?? 0;
  const k = part > 0 ? 1.1 : 1;
  // clips without a FRAMING entry alternate wide / tight automatically (hides every jump cut)
  const fr = FRAMING[o] ?? (o % 2 === 0 ? [1.0, 1.03] : [1.1, 1.12]);
  const [s0, s1] = [fr[0] * k, fr[1] * k];
  const ease = s1 < s0 || o === 25 || o === 10 ? EASE_IN_OUT : EASE_OUT;
  let scale =
    i === 0
      ? interpolate(frame, [0, 8, c.durF], [s0, s1 + 0.01, s1], { extrapolateRight: "clamp", easing: EASE_OUT })
      : lerp(frame, [c.cutStartF, c.cutStartF + c.durF], [s0, s1], ease);
  for (const [t, m, att] of PUNCHES) {
    const f = sec(t);
    if (frame >= f && clipAt(f) === i) scale *= interpolate(frame, [f, f + att], [1, m], { extrapolateRight: "clamp", easing: EASE_OUT });
  }
  // the drop: a bounce on top of the framing
  const drop = sec(43.93);
  if (frame >= drop && frame < drop + 20) scale *= interpolate(frame, [drop, drop + 3, drop + 20], [1.12, 1.0, 1.0], { easing: EASE_OUT });
  let x = 0, y = 0, r = 0;
  SHAKES.forEach(([t, len, amp], k) => {
    const s = shake(frame, sec(t), len, amp, `shake${k}`);
    x += s.x; y += s.y; r += s.r;
  });
  // cinematic dolly / dutch-angle moves on top (src/cinematic/zooms.ts), never showing the plate edges
  const m = cineMoveAt(frame);
  r += m.rotate; x += m.x; y += m.y;
  scale = Math.max(scale * m.scale, coverScale(r, x, y));
  return { scale, x, y, r };
};

/** Footage grade over time (CSS filter). Tension and struggle are colder and flatter. */
export const gradeAt = (frame: number) => {
  const k = (a: number, b: number) => interpolate(frame, [sec(a), Math.max(sec(b), sec(a) + 1)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // 0 = normal, 1 = muted (tension / struggle)
  const muted = k(11.97, 13.5) * (1 - k(15.9, 16.3)) + k(21.17, 21.6) * (1 - k(35.84, 36.4)) + k(55.3, 55.8) * (1 - k(56.43, 56.6));
  const wesh = k(42.43, 43.9) * (1 - k(43.93, 43.97));
  const sat = 1.14 - 0.38 * muted - 0.3 * wesh;
  const con = 1.07 + 0.04 * wesh;
  const bri = 1.02 - 0.05 * muted - 0.12 * wesh;
  return `saturate(${sat.toFixed(3)}) contrast(${con.toFixed(3)}) brightness(${bri.toFixed(3)}) sepia(0.06)`;
};
