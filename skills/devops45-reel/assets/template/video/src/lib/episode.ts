import { PHRASES, type Word } from "../data/voice";
import type { SceneSpec } from "../data/episode";

/**
 * Timing helpers for archetype scenes. Everything is GLOBAL frames (use useGlobalFrame()).
 * A data item may carry `on: "<word>"` — the visual beat lands on that spoken word of the scene.
 * Without `on` (or if the word isn't found) items are spread evenly over the scene's speech.
 */
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

export const sceneWords = (spec: SceneSpec): Word[] =>
  PHRASES.filter((p) => spec.phrases.includes(p.id)).flatMap((p) => p.words);

/** [first word frame, last word end frame] of the scene's speech (falls back to the scene range) */
export const speechSpan = (spec: SceneSpec): [number, number] => {
  const w = sceneWords(spec);
  return w.length ? [w[0].f, w[w.length - 1].fe] : [spec.from + 10, spec.to - 10];
};

/** global frame of a spoken word in this scene (prefix match, accents ignored), or undefined */
export const onWord = (spec: SceneSpec, word?: string, nth = 0): number | undefined => {
  if (!word) return undefined;
  const want = norm(word);
  if (!want) return undefined;
  const hits = sceneWords(spec).filter((w) => norm(w.w).startsWith(want) || (want.length > 3 && norm(w.w).includes(want)));
  return hits[nth]?.f;
};

/**
 * Frame of item i of n: its `on` word if spoken, else spread over the speech span.
 * `lead` shifts the visual a few frames BEFORE the word (eyes before ears reads as "in sync").
 */
export const beatFor = (spec: SceneSpec, item: { on?: string } | undefined, i: number, n: number, lead = 2): number => {
  const w = onWord(spec, item?.on);
  if (w !== undefined) return w - lead;
  const [a, b] = speechSpan(spec);
  return Math.round(a + ((b - a) * i) / Math.max(1, n)) - lead;
};

/** all beats of a list, forced monotonic (≥ minGap frames apart) */
export const beatsFor = (spec: SceneSpec, items: { on?: string }[], minGap = 6, lead = 2): number[] => {
  const out: number[] = [];
  items.forEach((it, i) => {
    const f = beatFor(spec, it, i, items.length, lead);
    out.push(out.length ? Math.max(f, out[out.length - 1] + minGap) : Math.max(f, spec.from + 4));
  });
  return out;
};
