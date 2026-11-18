import React from "react";
import { AbsoluteFill, Composition, Folder, Sequence, useCurrentFrame } from "remotion";
import "./kit/fonts";
import { componentFor } from "./archetypes";
import { Captions } from "./components/Captions";
import { Hud } from "./components/Hud";
import { LogoCallouts } from "./components/LogoCallouts";
import { Episode } from "./Episode";
import { Cover } from "./archetypes/Cover";
import { LogoSheet } from "./kit/LogoSheet";
import { CONCEPT_FX, TOOL_FX } from "./toolfx";
import { toolLab } from "./toolfx/Lab";
import { DURATION, FPS } from "./data/voice";
import { SCENES } from "./data/episode";
import { B } from "./lib/look";
import { GlobalFrameProvider } from "./lib/sync";

/** QA: one scene on the GLOBAL timeline (stills at global frames), with HUD + logo chips + captions so overlaps are visible. */
const part = (id: string) => {
  const s = SCENES.find((x) => x.id === id)!;
  const C = componentFor(s);
  const Comp: React.FC = () => {
    const f = useCurrentFrame();
    return (
      <GlobalFrameProvider frame={f}>
        <AbsoluteFill style={{ background: B.bg }}>
          <Sequence from={s.from} durationInFrames={s.to - s.from}>
            <C spec={s} />
          </Sequence>
          <Hud />
          <LogoCallouts />
          <Captions />
        </AbsoluteFill>
      </GlobalFrameProvider>
    );
  };
  return Comp;
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Episode" component={Episode} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} defaultProps={{ previewAudio: true, captions: true }} />
    <Composition id="Episode-silent" component={Episode} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} defaultProps={{ previewAudio: false, captions: true }} />
    <Composition id="LogoSheet" component={LogoSheet} durationInFrames={180} fps={FPS} width={1080} height={1920} />
    <Composition id="Cover" component={Cover} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Folder name="ToolFx">
      {[...Object.keys(TOOL_FX), ...Object.keys(CONCEPT_FX)].map((k) => (
        <Composition key={k} id={`ToolFx-${k}`} component={toolLab(k)} durationInFrames={240} fps={FPS} width={1080} height={1920} />
      ))}
    </Folder>
    <Folder name="Parts">
      {SCENES.map((s) => (
        <Composition key={s.id} id={`Part-${s.id}`} component={part(s.id)} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
      ))}
    </Folder>
  </>
);
