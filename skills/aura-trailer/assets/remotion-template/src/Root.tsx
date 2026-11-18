import React from "react";
import { AbsoluteFill, Composition, Folder, Sequence, useCurrentFrame } from "remotion";
import "./kit/fonts";
import { DURATION, FPS } from "./data/beats";
import { PARTS, section } from "./data/sections";
import { GlobalFrameProvider } from "./lib/beat";
import { L } from "./lib/look";
import { Trailer } from "./Trailer";
import { partComponent } from "./sections";

/**
 * Per-part QA compositions: the part rendered on the GLOBAL timeline (same frame numbers as the trailer), so stills
 * can be taken at global frames: `./still.sh Part-<id> <globalFrame>`.
 */
const part = (id: string, fromId: string, toId: string) => {
  const C = partComponent(id);
  const Comp: React.FC = () => {
    const f = useCurrentFrame();
    const a = section(fromId).from, b = section(toId).to;
    return (
      <GlobalFrameProvider frame={f}>
        <AbsoluteFill style={{ background: L.ink }}>
          <Sequence from={a} durationInFrames={b - a}>
            <C />
          </Sequence>
        </AbsoluteFill>
      </GlobalFrameProvider>
    );
  };
  return Comp;
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Trailer" component={Trailer} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} defaultProps={{ previewAudio: true }} />
    <Composition id="Trailer-silent" component={Trailer} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} defaultProps={{ previewAudio: false }} />
    <Folder name="Parts">
      {PARTS.map((p) => (
        <Composition key={p.id} id={`Part-${p.id}`} component={part(p.id, p.from, p.to)} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
      ))}
    </Folder>
  </>
);
