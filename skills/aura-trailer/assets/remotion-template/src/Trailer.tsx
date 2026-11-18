import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { TrailerFX } from "./components/TrailerFX";
import { MUSIC } from "./data/beats";
import { PARTS, section } from "./data/sections";
import { GlobalFrameProvider } from "./lib/beat";
import { L } from "./lib/look";
import { partComponent } from "./sections";

/** Each scene agent owns one part (a contiguous range of sections). Hard cuts between them: the beat is the transition. */
export const Trailer: React.FC<{ previewAudio?: boolean }> = ({ previewAudio = true }) => {
  const f = useCurrentFrame();
  return (
    <GlobalFrameProvider frame={f}>
      <AbsoluteFill style={{ background: L.ink }}>
        {PARTS.map(({ id, from, to }) => {
          const a = section(from).from, b = section(to).to;
          const C = partComponent(id);
          return (
            <Sequence key={id} name={id} from={a} durationInFrames={b - a} premountFor={60}>
              <C />
            </Sequence>
          );
        })}
        <TrailerFX />
        {previewAudio ? (
          <>
            {/* PREVIEW ONLY (Studio): raw song + voice. The delivered audio comes from scripts/mix.py. */}
            {MUSIC.file ? <Audio src={staticFile(MUSIC.file)} trimBefore={MUSIC.offsetFrames} volume={0.35} /> : null}
            <Audio src={staticFile("voice/voice.wav")} volume={1} />
          </>
        ) : null}
      </AbsoluteFill>
    </GlobalFrameProvider>
  );
};
