import React from "react";
import { Html5Audio, interpolate, Sequence, staticFile } from "remotion";
import { CUES } from "../cues";
import { at, end } from "../lib/time";
import { VOICE_FILE } from "../CleanCut";

/** Voice on top. Music bed ~-21 dB, out for the « DON'T JUST LEARN AI » beat then back on the hit.
 *  SFX: the voice never stops (no gaps), so every SFX sits ≈10 dB under it, and never louder than the bed + voice. */
const MUSIC = "audio/music/greed.wav";
const BED = 0.09;
/** Offline master (scripts/master_voice.py + scripts/mix.py): voice master v3 (warm, DeepFilterNet), music bed 13 LU
 *  under the voice while talking (ducked 3.5 dB), every SFX of CUES capped 8 LU under the voice, -14 LUFS / -1.2 dBTP.
 *  Re-run `python scripts/mix.py` after any SFX cue change. */
export const MIX_FILE = "audio/mix-v3.wav";
/** `mixed` (default true): play the offline mix as one track. `mixed={false}`: the live layers below (voice + bed + SFX). */
export const Sound: React.FC<{ total: number; mixed?: boolean }> = ({ total, mixed = true }) => {
  if (mixed) return <Html5Audio src={staticFile(MIX_FILE)} />;
  const dropA = at("dont") - 50, dropB = at("dont"), back = end("dont");
  return (
    <>
      <Html5Audio src={staticFile(VOICE_FILE)} />
      <Html5Audio
        src={staticFile(MUSIC)}
        volume={(fr) =>
          BED *
          interpolate(fr, [0, 12, dropA, dropB - 2, back, back + 4, total - 50, total], [0, 1, 1, 0.0, 0.0, 1.3, 1.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        }
      />
      {CUES.flatMap((c, i) =>
        (c.sfx ?? []).map((s, j) => (
          <Sequence key={`${i}-${j}`} from={Math.max(0, s.at)} durationInFrames={150} layout="none">
            <Html5Audio src={staticFile(s.src)} volume={0.32 * (s.vol ?? 1)} />
          </Sequence>
        )),
      )}
    </>
  );
};
