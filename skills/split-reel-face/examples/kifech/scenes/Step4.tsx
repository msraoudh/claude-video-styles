import type React from "react";
import { useCurrentFrame } from "remotion";
import type { Cue } from "../edit/cue";
import { PartA } from "./Step4/PartA";
import { PartB } from "./Step4/PartB";
import { T } from "./Step4/shared";

/**
 * ÉTAPE 4/5 « Claude يخدم… وأنا نتفرّج » — SPLIT mode, stage y 1040–1450, x 60–940. GLOBAL frames.
 * Part A 55.28–67.0 s: topic chip → script.md types itself → ElevenLabs voice generates → a Remotion timeline builds
 *   (voice + the real scene blocks) → skill chips dock → SFX lane + music lane slide in → a search sweep finds them all.
 * Part B 72.6–86.52 s: the timeline plays by itself (« mode spectateur » 🍿) → Claude notifications (« Odkhel l Remotion
 *   w chouf 👀 » + a Studio player with the user's own clips, « Kammelt ✓ — t7eb na3mel el rendu ? ») → he clicks
 *   « Nchouf », reviews, one row fails → 4 feedback chips (vibe / rythme / design / motion) flip their cards A → B.
 * (67.0–72.6 is the full-screen « agents » scene, not ours.)
 */
export const Step4: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= T.A0 && frame <= T.A1 + 6) return <PartA />;
  if (frame >= T.B0 && frame <= T.B1 + 8) return <PartB />;
  return null;
};

export const step4Cues: Cue[] = [
  // ---- part A ----
  { f: T.A0 + 5, sfx: "swipe", vol: 0.25, note: "s4 prompt card in" },
  { f: T.give, sfx: "keypad", vol: 0.22, trimFrames: 26, note: "s4 typing the prompt" },
  { f: T.topic, sfx: "pop", vol: 0.42, note: "s4 topic chip" },
  { f: T.howa, sfx: "tap", vol: 0.35, note: "s4 send" },
  { f: T.howa + 5, sfx: "whoosh", vol: 0.18, note: "s4 topic docks" },
  { f: T.yekteb, sfx: "page-turn", vol: 0.3, note: "s4 script.md opens" },
  { f: T.script, sfx: "keypad", vol: 0.2, trimFrames: 26, note: "s4 script types" },
  { f: T.script + 26, sfx: "keypad", vol: 0.15, trimFrames: 16, note: "s4 script types (end)" },
  { f: T.gen, sfx: "riser", vol: 0.2, trimFrames: 48, note: "s4 voice generating" },
  { f: T.eleven, sfx: "pop", vol: 0.34, note: "s4 ElevenLabs label" },
  { f: T.use + 6, sfx: "ding", vol: 0.22, note: "s4 voix prête" },
  { f: T.remotion - 2, sfx: "whoosh", vol: 0.38, note: "s4 Remotion timeline in" },
  { f: T.remotion + 7, sfx: "tick", vol: 0.2, note: "s4 scene blocks" },
  { f: T.remotion + 12, sfx: "tick", vol: 0.18, note: "s4 scene blocks" },
  { f: T.remotion + 17, sfx: "tick", vol: 0.18, note: "s4 scene blocks" },
  { f: T.skills, sfx: "pop", vol: 0.38, note: "s4 skill reel-pro-edit" },
  { f: T.skills + 4, sfx: "pop", vol: 0.33, note: "s4 skill cinematic-motion-teaser" },
  { f: T.skills + 8, sfx: "pop", vol: 0.33, note: "s4 skill remotion-best-practices" },
  { f: T.sound - 9, sfx: "swipe", vol: 0.2, note: "s4 skills dock" },
  { f: T.sound, sfx: "swipe", vol: 0.3, note: "s4 SFX lane in" },
  { f: T.sound + 5, sfx: "tick", vol: 0.16, note: "s4 sfx markers" },
  { f: T.sound + 10, sfx: "tick", vol: 0.16, note: "s4 sfx markers" },
  { f: T.sound + 15, sfx: "tick", vol: 0.16, note: "s4 sfx markers" },
  { f: T.music, sfx: "sting", vol: 0.3, trimFrames: 40, note: "s4 music lane (bass)" },
  { f: T.music, sfx: "whoosh", vol: 0.18, note: "s4 music lane slides" },
  { f: T.kol - 2, sfx: "whoosh", vol: 0.22, note: "s4 search sweep" },
  { f: T.kol + 8, sfx: "tick", vol: 0.15, note: "s4 sweep finds" },
  { f: T.kol + 16, sfx: "tick", vol: 0.15, note: "s4 sweep finds" },
  { f: T.kol + 24, sfx: "tick", vol: 0.15, note: "s4 sweep finds" },
  { f: T.ylawj - 3, sfx: "pop", vol: 0.3, note: "s4 25 SFX · 1 musique ✓" },
  { f: T.handoff, sfx: "whoosh", vol: 0.45, note: "s4 hand-off to agents" },
  // ---- part B ----
  { f: T.netfarraj, sfx: "pop", vol: 0.4, note: "s4 popcorn chip" },
  { f: T.netfarraj + 3, sfx: "tap", vol: 0.16, note: "s4 popcorn kernel" },
  { f: T.netfarraj + 8, sfx: "tap", vol: 0.14, note: "s4 popcorn kernel" },
  { f: T.odkhel, sfx: "snapchat-notification", vol: 0.3, note: "s4 toast « Odkhel l Remotion »" },
  { f: T.rem2, sfx: "whoosh", vol: 0.24, note: "s4 Studio player opens" },
  { f: T.rem2 + 8, sfx: "tap", vol: 0.25, note: "s4 play" },
  { f: T.talla, sfx: "tick", vol: 0.22, note: "s4 focus ring « طلّة »" },
  { f: T.walla, sfx: "ding", vol: 0.3, note: "s4 toast « Kammelt ✓ »" },
  { f: T.check - 3, sfx: "mouse-click", vol: 0.45, note: "s4 click « Nchouf »" },
  { f: T.check, sfx: "swipe", vol: 0.22, note: "s4 review panel" },
  { f: T.check + 3, sfx: "tick", vol: 0.22, note: "s4 review ✓ hook" },
  { f: T.check + 9, sfx: "tick", vol: 0.22, note: "s4 review ✓ captions" },
  { f: T.check + 15, sfx: "tick", vol: 0.22, note: "s4 review ✓ sync" },
  { f: T.ma3jeb, sfx: "windows-xp-error", vol: 0.12, trimFrames: 18, note: "s4 review ✕ « ما عجبتنيش »" },
  { f: T.n9olou, sfx: "keypad", vol: 0.2, trimFrames: 20, note: "s4 typing « baddelha »" },
  { f: T.baddel + 14, sfx: "tap", vol: 0.3, note: "s4 send fix" },
  { f: T.vibe - 16, sfx: "whoosh", vol: 0.26, note: "s4 variant cards in" },
  { f: T.vibe, sfx: "pop", vol: 0.4, note: "s4 chip vibe" },
  { f: T.vibe + 5, sfx: "switch", vol: 0.42, note: "s4 flip vibe A→B" },
  { f: T.rythme, sfx: "pop", vol: 0.4, note: "s4 chip rythme" },
  { f: T.rythme + 5, sfx: "switch", vol: 0.42, note: "s4 flip rythme A→B" },
  { f: T.design, sfx: "pop", vol: 0.4, note: "s4 chip design" },
  { f: T.design + 5, sfx: "switch", vol: 0.42, note: "s4 flip design A→B" },
  { f: T.motion, sfx: "pop", vol: 0.4, note: "s4 chip motion" },
  { f: T.motion + 5, sfx: "switch", vol: 0.42, note: "s4 flip motion A→B" },
  { f: T.bay, sfx: "success", vol: 0.3, note: "s4 all v2 ✓" },
  { f: T.B1 - 4, sfx: "whip", vol: 0.28, note: "s4 exit to étape 5" },
];
