import { Audio } from "@remotion/media";
import type React from "react";
import { interpolate, staticFile, useVideoConfig } from "remotion";
import { sec } from "../lib/motion";

/**
 * Voice (mastered, -17 LUFS) + music bed (Young Trizzy 02 by Arulo, Mixkit free licence,
 * pre-edited: muffled struggle, record-scratch stop, opening sweep on "Claude", silence on
 * "mais wesh", drop on "pourquoi") + SFX placed on the words they illustrate.
 * Every SFX is its own node so it can be moved in the Studio timeline.
 */
export const SoundDesign: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <>
      <Audio name="Voice" src={staticFile("footage/voice-v4-master.wav")} premountFor={fps} />
      <Audio
        name="Music bed"
        src={staticFile("audio/music-bed.wav")}
        premountFor={fps}
        volume={(f) => interpolate(f, [0, 8, sec(43.9), sec(43.9) + 2], [0, 0.11, 0.11, 0.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />

      {/* — hook — */}
      <Audio name="sfx whoosh (snap in)" src={staticFile("audio/sfx/whoosh.wav")} from={0} volume={0.45} premountFor={fps} />
      <Audio name="sfx whoosh (FRANÇAIS)" src={staticFile("audio/sfx/whoosh.wav")} from={sec(1.3)} volume={0.7} premountFor={fps} />
      <Audio name="sfx pop (algo card)" src={staticFile("audio/sfx/pop.wav")} from={sec(2.27)} volume={0.5} premountFor={fps} />
      <Audio name="sfx keypad (calcul)" src={staticFile("audio/sfx/keypad.wav")} from={sec(3.2)} volume={0.3} premountFor={fps} />
      <Audio name="sfx ding (France)" src={staticFile("audio/sfx/ding.wav")} from={sec(4.2)} volume={0.4} premountFor={fps} />

      {/* — intro — */}
      <Audio name="sfx swipe (the user)" src={staticFile("audio/sfx/swipe.wav")} from={sec(6.4)} volume={0.7} premountFor={fps} />
      <Audio name="sfx pop (tech)" src={staticFile("audio/sfx/pop.wav")} from={sec(7.14)} volume={0.55} premountFor={fps} />
      <Audio name="sfx pop (cloud)" src={staticFile("audio/sfx/pop.wav")} from={sec(7.74)} volume={0.55} premountFor={fps} />
      <Audio name="sfx pop (IA)" src={staticFile("audio/sfx/pop.wav")} from={sec(8.06)} volume={0.6} premountFor={fps} />
      <Audio name="sfx whip (bref)" src={staticFile("audio/sfx/whip.wav")} from={sec(8.66)} volume={0.7} premountFor={fps} />
      <Audio name="sfx tick (tester)" src={staticFile("audio/sfx/tick.wav")} from={sec(9.65)} volume={0.55} premountFor={fps} />
      <Audio name="sfx tick (apprendre)" src={staticFile("audio/sfx/tick.wav")} from={sec(10.74)} volume={0.55} premountFor={fps} />
      <Audio name="sfx tick (construire)" src={staticFile("audio/sfx/tick.wav")} from={sec(11.07)} volume={0.55} premountFor={fps} />

      {/* — the problem — */}
      <Audio name="sfx dissolve (mood drop)" src={staticFile("audio/sfx/dissolve.wav")} from={sec(11.95)} volume={0.35} premountFor={fps} />
      <Audio name="sfx vine boom (MONTAGE VIDÉO)" src={staticFile("audio/sfx/vine-boom.wav")} from={sec(15.02)} volume={0.24} premountFor={fps} />
      <Audio name="sfx pop (bulb)" src={staticFile("audio/sfx/pop.wav")} from={sec(16.52)} volume={0.45} premountFor={fps} />
      <Audio name="sfx success (idées de fou)" src={staticFile("audio/sfx/success.wav")} from={sec(17.3)} volume={0.4} premountFor={fps} />
      <Audio name="sfx swipe (rendu card)" src={staticFile("audio/sfx/swipe.wav")} from={sec(18.36)} volume={0.45} premountFor={fps} />
      <Audio name="sfx shutter (rendu)" src={staticFile("audio/sfx/shutter-modern.wav")} from={sec(20.0)} volume={0.55} premountFor={fps} />
      <Audio name="sfx record scratch" src={staticFile("audio/sfx/record-scratch.wav")} from={sec(22.36)} volume={0.3} premountFor={fps} />
      <Audio name="sfx error 1" src={staticFile("audio/sfx/windows-xp-error.wav")} from={sec(22.5)} volume={0.3} premountFor={fps} />
      <Audio name="sfx error 2" src={staticFile("audio/sfx/windows-xp-error.wav")} from={sec(22.8)} volume={0.26} premountFor={fps} />
      <Audio name="sfx error 3" src={staticFile("audio/sfx/windows-xp-error.wav")} from={sec(23.1)} volume={0.26} premountFor={fps} />
      <Audio name="sfx page (tuto 1)" src={staticFile("audio/sfx/page-turn.wav")} from={sec(24.14)} volume={0.6} premountFor={fps} />
      <Audio name="sfx page (tuto 2)" src={staticFile("audio/sfx/page-turn.wav")} from={sec(24.62)} volume={0.6} premountFor={fps} />
      <Audio name="sfx page (tuto 3)" src={staticFile("audio/sfx/page-turn.wav")} from={sec(25.04)} volume={0.6} premountFor={fps} />
      <Audio name="sfx whoosh (tutos fall)" src={staticFile("audio/sfx/whoosh.wav")} from={sec(26.66)} volume={0.5} premountFor={fps} />
      <Audio name="sfx crack (éclaté)" src={staticFile("audio/sfx/bone-crack.wav")} from={sec(27.76)} volume={0.5} premountFor={fps} />
      <Audio name="sfx notif 1" src={staticFile("audio/sfx/snapchat-notification.wav")} from={sec(28.58)} volume={0.45} premountFor={fps} />
      <Audio name="sfx notif 2" src={staticFile("audio/sfx/snapchat-notification.wav")} from={sec(29.52)} volume={0.45} premountFor={fps} />
      <Audio name="sfx notif 3" src={staticFile("audio/sfx/snapchat-notification.wav")} from={sec(30.6)} volume={0.45} premountFor={fps} />
      <Audio name="sfx whoosh (PLUS TARD)" src={staticFile("audio/sfx/whoosh.wav")} from={sec(31.6)} volume={0.6} premountFor={fps} />
      <Audio name="sfx loading lag" src={staticFile("audio/sfx/loading-lag.wav")} from={sec(34.0)} durationInFrames={39} volume={0.22} premountFor={fps} />
      <Audio name="sfx switch (∞ jamais)" src={staticFile("audio/sfx/switch.wav")} from={sec(35.28)} volume={0.6} premountFor={fps} />

      {/* — Claude — */}
      <Audio name="sfx riser (into Claude)" src={staticFile("audio/sfx/riser.wav")} from={sec(35.32)} volume={0.55} premountFor={fps} />
      <Audio name="sfx flash (Claude)" src={staticFile("audio/sfx/flash.wav")} from={sec(36.9)} volume={0.6} premountFor={fps} />
      <Audio name="sfx match (Claude)" src={staticFile("audio/sfx/match.wav")} from={sec(36.92)} volume={0.35} premountFor={fps} />
      <Audio name="sfx keypad (prompt)" src={staticFile("audio/sfx/keypad.wav")} from={sec(37.2)} volume={0.28} premountFor={fps} />
      <Audio name="sfx tick (apprendre)" src={staticFile("audio/sfx/tick.wav")} from={sec(38.1)} volume={0.5} premountFor={fps} />
      <Audio name="sfx tick (monter)" src={staticFile("audio/sfx/tick.wav")} from={sec(38.5)} volume={0.5} premountFor={fps} />
      <Audio name="sfx dissolve (couleurs)" src={staticFile("audio/sfx/dissolve.wav")} from={sec(39.85)} volume={0.4} premountFor={fps} />
      <Audio name="sfx tick (couleurs)" src={staticFile("audio/sfx/tick.wav")} from={sec(39.98)} volume={0.5} premountFor={fps} />
      <Audio name="sfx tick (animations)" src={staticFile("audio/sfx/tick.wav")} from={sec(40.5)} volume={0.5} premountFor={fps} />
      <Audio name="sfx flash (effets)" src={staticFile("audio/sfx/flash.wav")} from={sec(41.2)} volume={0.55} premountFor={fps} />
      <Audio name="sfx tick (effets)" src={staticFile("audio/sfx/tick.wav")} from={sec(41.3)} volume={0.5} premountFor={fps} />

      {/* — the drop — */}
      <Audio name="sfx riser (mais wesh)" src={staticFile("audio/sfx/riser.wav")} from={sec(42.33)} volume={0.45} premountFor={fps} />
      <Audio name="sfx sting (DROP)" src={staticFile("audio/sfx/sting.wav")} from={sec(43.93)} volume={0.6} premountFor={fps} />
      <Audio name="sfx whoosh (DROP)" src={staticFile("audio/sfx/whoosh.wav")} from={sec(43.9)} volume={0.6} premountFor={fps} />
      <Audio name="sfx whoosh (je me lance)" src={staticFile("audio/sfx/whoosh.wav")} from={sec(45.1)} volume={0.6} premountFor={fps} />

      {/* — what's coming — */}
      <Audio name="sfx pop (projets)" src={staticFile("audio/sfx/pop.wav")} from={sec(47.22)} volume={0.45} premountFor={fps} />
      <Audio name="sfx pop (tech)" src={staticFile("audio/sfx/pop.wav")} from={sec(47.84)} volume={0.45} premountFor={fps} />
      <Audio name="sfx pop (cloud)" src={staticFile("audio/sfx/pop.wav")} from={sec(48.34)} volume={0.45} premountFor={fps} />
      <Audio name="sfx pop (spécialité)" src={staticFile("audio/sfx/pop.wav")} from={sec(49.52)} volume={0.45} premountFor={fps} />
      <Audio name="sfx pop (découvertes)" src={staticFile("audio/sfx/pop.wav")} from={sec(50.54)} volume={0.45} premountFor={fps} />
      <Audio name="sfx pop (galères)" src={staticFile("audio/sfx/pop.wav")} from={sec(51.22)} volume={0.5} premountFor={fps} />
      <Audio name="sfx whoosh (VERSION FR)" src={staticFile("audio/sfx/whoosh.wav")} from={sec(52.48)} volume={0.6} premountFor={fps} />
      <Audio name="sfx pop (poll)" src={staticFile("audio/sfx/pop.wav")} from={sec(53.1)} volume={0.45} premountFor={fps} />
      <Audio name="sfx tap (OUI)" src={staticFile("audio/sfx/tap.wav")} from={sec(54.42)} volume={0.7} premountFor={fps} />
      <Audio name="sfx ding (OUI)" src={staticFile("audio/sfx/ding.wav")} from={sec(54.5)} volume={0.3} premountFor={fps} />
      <Audio name="sfx whip (bah bref)" src={staticFile("audio/sfx/whip.wav")} from={sec(56.4)} volume={0.75} premountFor={fps} />
      <Audio name="sfx pop (orbit tech)" src={staticFile("audio/sfx/pop.wav")} from={sec(58.4)} volume={0.4} premountFor={fps} />
      <Audio name="sfx pop (orbit IA)" src={staticFile("audio/sfx/pop.wav")} from={sec(58.86)} volume={0.4} premountFor={fps} />
      <Audio name="sfx pop (orbit cloud)" src={staticFile("audio/sfx/pop.wav")} from={sec(59.5)} volume={0.4} premountFor={fps} />
      <Audio name="sfx pop (orbit news)" src={staticFile("audio/sfx/pop.wav")} from={sec(60.26)} volume={0.4} premountFor={fps} />
      <Audio name="sfx pop (orbit trucs)" src={staticFile("audio/sfx/pop.wav")} from={sec(61.6)} volume={0.45} premountFor={fps} />

      {/* — CTA — */}
      <Audio name="sfx swipe (follow card)" src={staticFile("audio/sfx/swipe.wav")} from={sec(62.12)} volume={0.45} premountFor={fps} />
      <Audio name="sfx click (s'abonner)" src={staticFile("audio/sfx/mouse-click.wav")} from={sec(62.76)} volume={0.8} premountFor={fps} />
      <Audio name="sfx success (abonné)" src={staticFile("audio/sfx/success.wav")} from={sec(62.85)} volume={0.35} premountFor={fps} />
    </>
  );
};
