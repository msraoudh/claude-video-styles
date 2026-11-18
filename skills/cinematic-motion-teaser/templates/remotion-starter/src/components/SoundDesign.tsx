import { Audio } from "@remotion/media";
import React from "react";
import {
  getInputProps,
  getStaticFiles,
  interpolate,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { SCENES, TOTAL_FRAMES, WORDS } from "../data/timeline";
import { SCENE_CUES, type Cue } from "../scenes";

/**
 * The whole mix, frame-accurate, from data:
 *  - opening riser at frame 0
 *  - a transition sound on every cut, placed so its PEAK lands on the cut (lead = frames before)
 *  - scene-local cues exported by each scene file (SFX_CUES, local frames)
 *  - a music bed, ducked smoothly under the voice (10-frame ramp), with a tail guard
 * The VO itself is placed by Teaser.tsx at frame 0.
 *
 * Per-format music: the user may approve one format and want different music in the other
 * ("this change i want it in 16:9 dont touch the 9:16"). Keep a MUSIC entry per orientation so
 * changing one can never alter the other's render.
 */
const TRANSITION_SFX: Record<string, { sfx: string; lead: number; volume: number }> = {
  lightStreak: { sfx: "whoosh", lead: 12, volume: 0.55 },
  whipPush: { sfx: "whip", lead: 8, volume: 0.5 },
  blurDissolve: { sfx: "whoosh", lead: 10, volume: 0.3 },
  irisFrom: { sfx: "pop", lead: 2, volume: 0.4 },
  cardFlyAway: { sfx: "whoosh", lead: 10, volume: 0.5 },
};

type MusicBed = {
  file: string; // in public/
  /** Frames to delay the bed so its drop lands on the release word (0 if the bed is pre-cut). */
  offset: number;
  /** Volume while the voice speaks / between lines. NearMatch: 0.17/0.36 (calm), 0.33/0.67 (more present). */
  under: number;
  between: number;
};
const MUSIC: { portrait: MusicBed; landscape: MusicBed } = {
  portrait: { file: "audio/music.wav", offset: 0, under: 0.17, between: 0.36 },
  landscape: { file: "audio/music.wav", offset: 0, under: 0.17, between: 0.36 },
};

const VO_PAD_IN = 8;
const VO_PAD_OUT = 14;
/** Frames from `f` to the nearest spoken word (0 while the voice is speaking). */
const distanceToVoice = (f: number) =>
  WORDS.reduce((best, w) => {
    const a = w.s - VO_PAD_IN;
    const b = w.e + VO_PAD_OUT;
    const d = f < a ? a - f : f > b ? f - b : 0;
    return Math.min(best, d);
  }, Infinity);

export const SoundDesign: React.FC = () => {
  const { fps, width, height } = useVideoConfig();
  const bed = height > width ? MUSIC.portrait : MUSIC.landscape;
  const files = new Set(getStaticFiles().map((f) => f.name));
  const has = (p: string) => files.has(p);
  const sfxPath = (name: string) => `audio/sfx/${name}.wav`;
  // `--props='{"noMusic":true}'` renders voice + SFX only: the stem for auditioning music beds.
  const noMusic = (getInputProps() as { noMusic?: boolean }).noMusic;

  const cues: Cue[] = [{ frame: 0, sfx: "riser", volume: 0.5 }];
  for (const s of SCENES) {
    if (s.transitionIn) {
      const t = TRANSITION_SFX[s.transitionIn.type];
      if (t) cues.push({ frame: Math.max(0, s.cutIn - t.lead), sfx: t.sfx, volume: t.volume });
    }
    for (const c of SCENE_CUES[s.id] ?? []) cues.push({ ...c, frame: s.from + c.frame });
  }

  return (
    <>
      {has(bed.file) && !noMusic ? (
        <Sequence name="Music bed" from={bed.offset} premountFor={fps}>
          <Audio
            src={staticFile(bed.file)}
            volume={(f) => {
              const g = f + bed.offset; // global frame
              const duck = interpolate(distanceToVoice(g), [0, 10], [bed.under, bed.between], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const tail = interpolate(g, [TOTAL_FRAMES - fps * 0.8, TOTAL_FRAMES], [1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return duck * tail;
            }}
          />
        </Sequence>
      ) : null}
      {cues
        .filter((c) => has(sfxPath(c.sfx)))
        .map((c, i) => (
          <Sequence key={`${c.sfx}-${c.frame}-${i}`} name={`sfx: ${c.sfx}`} from={c.frame} premountFor={fps}>
            <Audio src={staticFile(sfxPath(c.sfx))} volume={c.volume ?? 0.6} />
          </Sequence>
        ))}
    </>
  );
};
