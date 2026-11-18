import type { Caption } from "@remotion/captions";
import type React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { ArmpitBlur } from "./components/ArmpitBlur";
import { BehindText } from "./components/Behind";
import { CinematicLayer } from "./cinematic";
import { Captions } from "./components/Captions";
import { Footage } from "./components/Footage";
import { SoundDesign } from "./components/SoundDesign";
import captionsData from "./data/captions.json";
import { sec } from "./lib/motion";
import { ClaudeCard, ClaudeSpark3D, ColorWipe, GlitchHit, LightStreak } from "./overlays/Claude";
import { AlgoCard, NameCard, SkillsStack } from "./overlays/Intro";
import { DropStage, FanCards, Flash, FollowCTA, FrenchSweep, OrbitStage, Poll, Rocket, Whip } from "./overlays/Outro";
import { ErrorPopups, IdeaBurst, JamaisCutaway, LoadingForever, Reminders, RenduCard, ScreenCrack, TutoStack } from "./overlays/Struggle";

const captions = captionsData as Caption[];

/**
 * "Cette fois, en français" — the user's intro reel.
 * All times are seconds on the cut timeline (see analysis/cut.json), converted with sec().
 */
export const Reel: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* 1 — the shot, with everything that lives INSIDE the camera (behind / around the user) */}
      <Footage>
        <Sequence name="Color before/after" from={sec(39.26)} durationInFrames={sec(40.7) - sec(39.26)} premountFor={fps}>
          <ColorWipe from={sec(39.26)} dur={sec(40.7) - sec(39.26)} />
        </Sequence>
        <BehindText name="Behind: FRANÇAIS" from={sec(1.3)} durationInFrames={sec(2.27) - sec(1.3)} lines={["FRAN", "ÇAIS"]} kicker="cette fois, en" top={250} />
        <BehindText name="Behind: MONTAGE VIDÉO" from={sec(14.76)} durationInFrames={sec(15.97) - sec(14.76)} lines={["LE", "MONTAGE", "VIDÉO"]} accentLine={2} top={210} stagger={5} />
        <BehindText name="Behind: PLUS TARD" from={sec(31.6)} durationInFrames={sec(32.37) + 40 - sec(31.6)} lines={["PLUS", "TARD"]} kicker="je commencerai…" top={260} stagger={3} />
        <DropStage name="Behind: DROP" from={sec(43.93)} dur={sec(45.1) - sec(43.93)} />
        <BehindText name="Behind: JE ME LANCE" from={sec(45.1)} durationInFrames={sec(46.4) - sec(45.1)} lines={["JE ME", "LANCE"]} accentLine={1} top={240} stagger={5} />
        <OrbitStage name="Orbit: interests" from={sec(57.34)} dur={sec(62.12) - sec(57.34)} />
        {/* privacy: tracked blur when the arm goes up (above the cutouts) */}
        <ArmpitBlur />
      </Footage>

      {/* 1b — cinematic grade, light from the angles, leaks, grain, letterbox (src/cinematic) */}
      <CinematicLayer amount={0.5} leaks={false} />

      {/* 2 — motion graphics on top of the shot */}
      <Sequence name="Algo card" from={sec(2.27)} durationInFrames={sec(4.77) - sec(2.27)} premountFor={fps}>
        <AlgoCard from={sec(2.27)} dur={sec(4.77) - sec(2.27)} />
      </Sequence>
      <Sequence name="Name card" from={sec(6.2)} durationInFrames={sec(8.95) - sec(6.2)} premountFor={fps}>
        <NameCard from={sec(6.2)} dur={sec(8.95) - sec(6.2)} />
      </Sequence>
      <Sequence name="Skills stack" from={sec(9.23)} durationInFrames={sec(11.95) - sec(9.23)} premountFor={fps}>
        <SkillsStack from={sec(9.23)} dur={sec(11.95) - sec(9.23)} />
      </Sequence>
      <Sequence name="Idea burst" from={sec(15.98)} durationInFrames={sec(18.36) - sec(15.98)} premountFor={fps}>
        <IdeaBurst from={sec(15.98)} dur={sec(18.36) - sec(15.98)} />
      </Sequence>
      <Sequence name="Rendu card" from={sec(18.4)} durationInFrames={sec(21.1) - sec(18.4)} premountFor={fps}>
        <RenduCard from={sec(18.4)} dur={sec(21.1) - sec(18.4)} />
      </Sequence>
      <Sequence name="Error popups" from={sec(22.4)} durationInFrames={sec(23.77) - sec(22.4)} premountFor={fps}>
        <ErrorPopups from={sec(22.4)} dur={sec(23.77) - sec(22.4)} />
      </Sequence>
      <Sequence name="Tutorial pile" from={sec(23.9)} durationInFrames={sec(27.25) - sec(23.9)} premountFor={fps}>
        <TutoStack from={sec(23.9)} dur={sec(27.25) - sec(23.9)} />
      </Sequence>
      <Sequence name="Screen crack" from={sec(27.64)} durationInFrames={sec(28.45) - sec(27.64)} premountFor={fps}>
        <ScreenCrack from={sec(27.64)} dur={sec(28.45) - sec(27.64)} />
      </Sequence>
      <Sequence name="Snoozed reminders" from={sec(28.45)} durationInFrames={sec(31.4) - sec(28.45)} premountFor={fps}>
        <Reminders from={sec(28.45)} dur={sec(31.4) - sec(28.45)} />
      </Sequence>
      <Sequence name="Loading forever" from={sec(33.73)} durationInFrames={sec(36.0) - sec(33.73)} premountFor={fps}>
        <LoadingForever from={sec(33.73)} dur={sec(36.0) - sec(33.73)} />
      </Sequence>
      <Sequence name="Cutaway: ∞ JAMAIS (hides a script glance)" from={sec(35.03)} durationInFrames={sec(36.07) - sec(35.03)} premountFor={fps}>
        <JamaisCutaway from={sec(35.03)} dur={sec(36.07) - sec(35.03)} />
      </Sequence>
      <Sequence name="Light streak (Claude)" from={sec(36.86)} durationInFrames={14} premountFor={fps}>
        <LightStreak from={sec(36.86)} dur={14} />
      </Sequence>
      <Sequence name="Claude spark 3D" from={sec(36.92)} durationInFrames={sec(42.43) - sec(36.92)} premountFor={fps}>
        <ClaudeSpark3D from={sec(36.92)} dur={sec(42.43) - sec(36.92)} />
      </Sequence>
      <Sequence name="Claude card" from={sec(37.05)} durationInFrames={sec(42.43) - sec(37.05)} premountFor={fps}>
        <ClaudeCard from={sec(37.05)} dur={sec(42.43) - sec(37.05)} />
      </Sequence>
      <Sequence name="Glitch (effets)" from={sec(41.2)} durationInFrames={8} premountFor={fps}>
        <GlitchHit from={sec(41.2)} dur={8} />
      </Sequence>
      <Sequence name="Flash (drop)" from={sec(43.93)} durationInFrames={5} premountFor={fps}>
        <Flash dur={5} />
      </Sequence>
      <Sequence name="Rocket (je me lance)" from={sec(45.15)} durationInFrames={sec(46.35) - sec(45.15)} premountFor={fps}>
        <Rocket from={sec(45.15)} dur={sec(46.35) - sec(45.15)} />
      </Sequence>
      <Sequence name="Fan cards" from={sec(46.9)} durationInFrames={sec(52.05) - sec(46.9)} premountFor={fps}>
        <FanCards from={sec(46.9)} dur={sec(52.05) - sec(46.9)} />
      </Sequence>
      <Sequence name="French sweep" from={sec(52.23)} durationInFrames={sec(53.08) - sec(52.23)} premountFor={fps}>
        <FrenchSweep from={sec(52.23)} dur={sec(53.08) - sec(52.23)} />
      </Sequence>
      <Sequence name="Poll" from={sec(53.08)} durationInFrames={sec(56.43) - sec(53.08)} premountFor={fps}>
        <Poll from={sec(53.08)} dur={sec(56.43) - sec(53.08)} />
      </Sequence>
      <Sequence name="Whip (bah bref)" from={sec(56.38)} durationInFrames={10} premountFor={fps}>
        <Whip dur={10} />
      </Sequence>
      <Sequence name="Follow CTA" from={sec(62.12)} durationInFrames={sec(64.3) - sec(62.12)} premountFor={fps}>
        <FollowCTA from={sec(62.12)} dur={sec(64.3) - sec(62.12)} />
      </Sequence>

      {/* 3 — captions on top (they step aside for the drop title) */}
      <Captions captions={captions} hide={[[(sec(43.93) / 30) * 1000, (sec(45.1) / 30) * 1000]]} />

      {/* 4 — sound */}
      <SoundDesign />
    </AbsoluteFill>
  );
};
