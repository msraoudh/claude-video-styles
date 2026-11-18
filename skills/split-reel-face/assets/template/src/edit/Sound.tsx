import { Audio } from "@remotion/media";
import type React from "react";
import { staticFile, useVideoConfig } from "remotion";
import { ALL_CUES } from "../scenes";
import { PROJECT } from "../data/project";
import { MUSIC } from "./music";
import { DURATION, WORDS } from "./time";

/** 1 where a word is being spoken (±2 frames), from the caption word timings — drives the SFX ducking. */
const SPEECH = (() => {
  const a = new Float32Array(DURATION + 1);
  for (const w of WORDS) {
    const s = Math.max(0, Math.round((w.startMs / 1000) * 30) - 2);
    const e = Math.min(DURATION, Math.round((w.endMs / 1000) * 30) + 2);
    for (let i = s; i <= e; i++) a[i] = 1;
  }
  // smooth 3 frames each side so the ducking glides
  const b = new Float32Array(DURATION + 1);
  for (let i = 0; i <= DURATION; i++) {
    let m = 0;
    for (let k = -3; k <= 3; k++) m = Math.max(m, (a[i + k] ?? 0) * (1 - Math.abs(k) / 4));
    b[i] = m;
  }
  return b;
})();
/** SFX gain multiplier at a global frame: 0.62 while words are spoken, 1 in the gaps. */
const duck = (frame: number) => 1 - 0.38 * (SPEECH[Math.max(0, Math.min(DURATION, frame))] ?? 0);

/**
 * Voice (the user's own, mastered −16 LUFS) + music bed (the user's pick, src/edit/music.ts) + every scene's SFX,
 * each SFX ducked under the spoken words. Each SFX is its own named node so it can be nudged in the Studio timeline.
 */
export const Sound: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <>
      <Audio name="Voice" src={staticFile(PROJECT.voice)} premountFor={fps} />
      {MUSIC ? (
        <Audio
          name={`Music — ${MUSIC.title}`}
          src={staticFile(MUSIC.file)}
          trimBefore={MUSIC.trimBefore}
          from={MUSIC.from}
          premountFor={fps}
          volume={(fr) => MUSIC!.volume(fr + MUSIC!.from)}
        />
      ) : null}
      {ALL_CUES.map((c, i) => {
        const at = Math.max(0, c.f);
        const v = c.vol ?? 0.4;
        return (
          <Audio
            key={i}
            name={`sfx ${c.sfx}${c.note ? ` · ${c.note}` : ""}`}
            src={staticFile(`audio/sfx/${c.sfx}.wav`)}
            from={at}
            durationInFrames={c.trimFrames}
            volume={(fr) => v * duck(at + fr)}
            premountFor={fps}
          />
        );
      })}
    </>
  );
};
