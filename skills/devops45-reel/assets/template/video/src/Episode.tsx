import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { componentFor } from "./archetypes";
import { Captions } from "./components/Captions";
import { Finish } from "./components/Finish";
import { Hud } from "./components/Hud";
import { LogoCallouts } from "./components/LogoCallouts";
import { SCENES } from "./data/episode";
import { B } from "./lib/look";
import { GlobalFrameProvider } from "./lib/sync";

/**
 * One « DevOps en 45 secondes » episode — 1080x1920, 60 fps. Scenes come from data/episode.ts (generated from
 * episode.json); each scene is an ARCHETYPE (src/archetypes/<type>) filled with that scene's data, or a custom
 * scene (src/scenes/<id>). Hard cuts between scenes; the series HUD, captions and finish sit on top.
 * previewAudio = the offline mix for Studio only; the delivered mix comes from scripts/mix.py.
 */
export const Episode: React.FC<{ previewAudio?: boolean; captions?: boolean }> = ({ previewAudio = true, captions = true }) => {
  const f = useCurrentFrame();
  return (
    <GlobalFrameProvider frame={f}>
      <AbsoluteFill style={{ background: B.bg }}>
        {SCENES.map((s) => {
          const C = componentFor(s);
          return (
            <Sequence key={s.id} name={`${s.id} · ${s.type}`} from={s.from} durationInFrames={s.to - s.from} premountFor={60}>
              <C spec={s} />
            </Sequence>
          );
        })}
        <Hud />
        <LogoCallouts />
        <Finish />
        {captions ? <Captions /> : null}
        {previewAudio ? <Audio src={staticFile("audio/preview-mix.wav")} /> : null}
      </AbsoluteFill>
    </GlobalFrameProvider>
  );
};
