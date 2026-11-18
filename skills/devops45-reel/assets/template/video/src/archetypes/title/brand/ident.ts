/**
 * Timing of the series ident (the `title` scene), GLOBAL frames. The ident is ~1.0–1.3 s of voice silence between
 * the hook and the body; the music DROP lands on its first frame (KEY.drop == scene.from).
 * Everything is relative to [from, to) so any gap length works (min ~40 frames).
 *   from      hard cut on the drop: radial cyan flash, glass panes mid-flight imploding from the lens side
 *   lock      panes seated (recoil ring, shockwave, anamorphic flare)
 *   devops/en/n45/secondes  the lockup ignites word by word (45 in amber, the cyan ring closes round it)
 *   line      the episode title slams in word by word (2 f stagger), command types in after it
 *   flyOut    the panes blast toward the lens, the type pushes through → hard cut onto the first body word at `to`
 */
export type IdentT = {
  from: number;
  to: number;
  drop: number;
  flightFrom: number;
  lock: number;
  devops: number;
  en: number;
  n45: number;
  secondes: number;
  ringDur: number;
  chip: number;
  line: number;
  command: number;
  sweep2: number;
  flyOut: number;
  end: number;
  /** the frame the Cover freezes (everything lit, ring closed, sweeps parked) */
  best: number;
};

export const identTiming = (from: number, to: number): IdentT => {
  const len = Math.max(30, to - from);
  const k = Math.min(1, len / 66); // compress for very short gaps
  const r = (x: number) => from + Math.round(x * k);
  return {
    from,
    to,
    drop: from,
    flightFrom: from - 4,
    lock: r(5),
    devops: r(7),
    en: r(10),
    n45: r(13),
    secondes: r(16),
    ringDur: Math.max(8, Math.round(13 * k)),
    chip: r(3),
    line: r(6),
    command: r(14),
    sweep2: r(34),
    flyOut: to - Math.max(7, Math.round(11 * k)),
    end: to,
    best: r(44),
  };
};
