import React from "react";
import { Composition, Folder } from "remotion";
import { FPS, SCENES, TOTAL_FRAMES } from "./data/timeline";
import "./kit/fonts";
import { SCENE_COMPONENTS } from "./scenes";
import { Teaser } from "./Teaser";

/** ONE code base, both formats: every scene also gets its own composition per format for QA stills. */
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Teaser-9x16" component={Teaser} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="Teaser-16x9" component={Teaser} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
    {(["9x16", "16x9"] as const).map((fmt) => (
      <Folder key={fmt} name={`Scenes-${fmt}`}>
        {SCENES.map((s) => (
          <Composition
            key={s.id}
            id={`${s.id}-${fmt}`}
            component={SCENE_COMPONENTS[s.id]}
            durationInFrames={s.durationInFrames}
            fps={FPS}
            width={fmt === "9x16" ? 1080 : 1920}
            height={fmt === "9x16" ? 1920 : 1080}
          />
        ))}
      </Folder>
    ))}
  </>
);
