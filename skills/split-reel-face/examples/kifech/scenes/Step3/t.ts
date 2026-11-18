import { f, wf } from "../../edit/time";

/**
 * Step 3 word clock (GLOBAL frames). Every visual of the scene lands on one of these spoken words.
 * 39.08 « étape 3: نقلّو بهي، هبّطلي الـ outils هاذم الكل » → 43.04 « باش نعملو حاجة بنفس الـ style، نفس الـ motions، نفس الـ cards »
 * → 47.15 « نقلّو brainstormi معايا، و act as expert motion graphics editor » → 51.2 « ديما نحكيلو نفس الحكاية »
 * → 53.02 « نقلّو راهو باش نبدّلوها selon الـ vibe متاعنا » → 55.28 (étape 4).
 */
export const T = {
  start: f(39.08),
  prompt: wf("نقلّو", 39.82),
  behi: wf("بهي", 40.66),
  send: wf("هبّطلي", 41.16),
  outils: wf("outils", 41.95),
  kol: wf("الكل", 42.83),
  bStart: wf("باش", 43.04),
  style: wf("style", 44.2),
  motions: wf("motions", 45.3),
  cards: wf("cards", 46.37),
  cIn: wf("نقلّو", 47.15),
  brain: wf("brainstormi", 47.38),
  m3aya: wf("معايا", 47.93),
  w: f(48.34),
  act: wf("act", 48.56),
  as: wf("as", 49.06),
  expert: wf("expert", 49.26),
  motion: wf("motion", 49.73),
  graphics: wf("graphics", 50.06),
  editor: wf("editor", 50.49),
  dima: wf("ديما", 51.2),
  hkeya: wf("الحكاية", 52.2),
  eIn: wf("نقلّو", 53.02),
  nbadl: wf("نبدّلوها", 53.77),
  selon: wf("selon", 54.31),
  vibe: wf("vibe", 54.61),
  end: f(55.28),
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
