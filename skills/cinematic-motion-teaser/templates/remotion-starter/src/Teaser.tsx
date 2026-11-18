import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries, type TransitionPresentation } from "@remotion/transitions";
import React from "react";
import { AbsoluteFill, getStaticFiles, staticFile, useVideoConfig } from "remotion";
import { Captions } from "./components/Captions";
import { SoundDesign } from "./components/SoundDesign";
import { SCENES, type SceneSpec } from "./data/timeline";
import { C } from "./kit/theme";
import { blurDissolve, cardFlyAway, irisFrom, lightStreak, whipPush } from "./lib/transitions";
import { SCENE_COMPONENTS } from "./scenes";

/** Per-cut transition. irisFrom should open from the UI element that was just tapped (pass its x/y). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const presentationFor = (s: SceneSpec, portrait: boolean): TransitionPresentation<any> => {
  switch (s.transitionIn?.type) {
    case "lightStreak":
      return lightStreak({ core: "#FFFFFF", accent: s.id === "endcard" ? C.violet : C.rose });
    case "irisFrom":
      return irisFrom({ x: 0.5, y: portrait ? 0.8 : 0.7, ring: C.rose });
    case "blurDissolve":
      return blurDissolve();
    case "cardFlyAway":
      return cardFlyAway();
    case "whipPush":
    default:
      return whipPush({ direction: "left" });
  }
};

/** The full video: scenes on a TransitionSeries + global captions + VO (master clock) + sound design. */
export const Teaser: React.FC = () => {
  const { fps, width, height } = useVideoConfig();
  const portrait = height > width;
  const hasVo = getStaticFiles().some((f) => f.name === "audio/vo.wav");
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries name="Scenes">
        {SCENES.flatMap((s) => {
          const Scene = SCENE_COMPONENTS[s.id];
          const items: React.ReactNode[] = [];
          if (s.transitionIn) {
            items.push(
              <TransitionSeries.Transition
                key={`t-${s.id}`}
                presentation={presentationFor(s, portrait)}
                timing={linearTiming({ durationInFrames: s.transitionIn.frames })}
              />,
            );
          }
          items.push(
            <TransitionSeries.Sequence key={s.id} name={s.id} durationInFrames={s.durationInFrames} premountFor={fps}>
              <Scene />
            </TransitionSeries.Sequence>,
          );
          return items;
        })}
      </TransitionSeries>
      <Captions />
      {hasVo ? <Audio name="Voiceover" src={staticFile("audio/vo.wav")} premountFor={fps} /> : null}
      <SoundDesign />
    </AbsoluteFill>
  );
};
