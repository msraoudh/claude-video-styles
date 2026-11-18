import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { TrailerFX } from "./components/TrailerFX";
import { section } from "./data/sections";
import { GlobalFrameProvider } from "./lib/beat";
import { L } from "./lib/look";
import { Open } from "./sections/open";
import { Hero } from "./sections/hero";
import { Escalate } from "./sections/escalate";
import { Climax } from "./sections/climax";

const MUSIC_OFFSET_FRAMES = Math.round(6.97 * 60);

/** Each section agent owns one contiguous frame range. Hard cuts between them (the beat is the transition). */
const PARTS: Array<{ id: string; from: string; to: string; C: React.FC }> = [
  { id: "open", from: "cold", to: "world", C: Open },
  { id: "hero", from: "hero", to: "hero", C: Hero },
  { id: "escalate", from: "escalate", to: "escalate", C: Escalate },
  { id: "climax", from: "silence", to: "end", C: Climax },
];

export const Trailer: React.FC<{ previewAudio?: boolean }> = ({ previewAudio = true }) => {
  const f = useCurrentFrame();
  return (
    <GlobalFrameProvider frame={f}>
      <AbsoluteFill style={{ background: L.ink }}>
        {PARTS.map(({ id, from, to, C }) => {
          const a = section(from).from, b = section(to).to;
          return (
            <Sequence key={id} name={id} from={a} durationInFrames={b - a} premountFor={60}>
              <C />
            </Sequence>
          );
        })}
        <TrailerFX />
        {previewAudio ? (
          <>
            {/* PREVIEW ONLY (Studio): raw music + voice. The delivered audio comes from audio/mix.py. */}
            <Audio src={staticFile("music/acido3-slowed85.wav")} trimBefore={MUSIC_OFFSET_FRAMES} volume={0.35} />
            <Audio src={staticFile("voice/voice.wav")} volume={1} />
          </>
        ) : null}
      </AbsoluteFill>
    </GlobalFrameProvider>
  );
};
