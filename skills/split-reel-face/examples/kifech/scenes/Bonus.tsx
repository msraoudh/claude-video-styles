import type React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { Cue } from "../edit/cue";
import { B, eo, G, LOOPS } from "./Bonus/beats";
import { ABSORB_HITS, Fan } from "./Bonus/Fan";
import { Hero } from "./Bonus/Hero";
import { Loop } from "./Bonus/Loop";
import { Prompt } from "./Bonus/Prompt";
import { Shelf } from "./Bonus/Shelf";

/**
 * BONUS · « اعمللي skill » — 103.26–113.42 s, SPLIT mode (stage y 1040–1450). GLOBAL frames.
 *   A 103.3 « bien sûr، كان تحب برشا vidéos كيما هكّا يتعملو » → the user's reels: deck → fan (« برشا ») → more behind
 *     (« vidéos ») → the centre reel steps forward (« كيما هكّا ») → riffle flip (« يتعملو »).
 *   B 106.9 « تقلّو: اعمللي skill باللي عملتو الكل » → fan collapses to a deck, prompt « a3melli skill b elli 3maltou lkol »
 *     types + sends, SKILL.md (real: aura-trailer) types itself while the deck is absorbed into it (one step per batch),
 *     then flies into the empty slot of the ~/.claude/skills/ shelf (devops45-reel, reel-pro-edit, cinematic-motion-teaser).
 *   C 109.2 « يعمللك skill، كل مرة تعطيه vidéo ولّا idée » → NEW badge; the shelf folds into a strip, the skill becomes the
 *     machine: rush / vidéo / idée → skill → finished reel (real aura-trailer output « NO MORE EXCUSES », ig-1) ×3.
 *   D 112.0 « وتقلّو: استعمل الـ skill هاذي » → prompt « esta3mel el skill hedhi » + chip ⚡ aura-trailer, the skill glows,
 *     send on « هاذي » fires a shockwave; 113.42 whoosh + zoom-through into the face outro.
 */
export const Bonus: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < B.start || frame > B.end + 12) return null;
  const q = eo(frame, B.end - 3, 10);
  const oy = G.core.y + G.core.h / 2;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          opacity: 1 - q,
          transformOrigin: `540px ${oy}px`,
          transform: `scale(${(1 + 0.02 * ((frame - B.start) / (B.end - B.start))) * (1 + 0.22 * q)})`, // slow push + exit zoom-through
          filter: q > 0 ? `blur(${q * 10}px)` : undefined,
        }}
      >
        <Fan />
        <Shelf />
        <Loop />
        <Hero />
        <Prompt text="a3melli skill b elli 3maltou lkol" at={B.tqollou} typeAt={B.tqollou + 3} cps={72} sendAt={B.a3melli + 7} out={B.lkol - 5} x={290} y={1040} w={650} />
        <Prompt text="esta3mel el skill hedhi" at={B.wtqollou - 1} typeAt={B.wtqollou + 2} cps={44} sendAt={B.hedhi} out={B.end + 40} x={60} y={1040} w={880} chipAt={B.lskill} />
      </div>
    </AbsoluteFill>
  );
};

export const bonusCues: Cue[] = [
  { f: B.sur, sfx: "pop", vol: 0.3, note: "bonus · deck of reels lands" },
  { f: B.kan, sfx: "tick", vol: 0.22, note: "bonus · deck lifts" },
  { f: B.barcha, sfx: "page-turn", vol: 0.5, note: "bonus · fan out « برشا »" },
  { f: B.barcha + 1, sfx: "whoosh", vol: 0.25, note: "bonus · fan air" },
  { f: B.videos, sfx: "page-turn", vol: 0.3, note: "bonus · back row « vidéos »" },
  { f: B.kima, sfx: "pop", vol: 0.28, note: "bonus · centre reel forward" },
  { f: B.yit3amlou, sfx: "page-turn", vol: 0.34, note: "bonus · riffle 1" },
  { f: B.yit3amlou + 6, sfx: "page-turn", vol: 0.28, note: "bonus · riffle 2" },
  { f: B.tqollou, sfx: "swipe", vol: 0.32, note: "bonus · fan collapses" },
  { f: B.tqollou + 3, sfx: "keypad", vol: 0.26, trimFrames: 15, note: "bonus · prompt 1 typing" },
  { f: B.a3melli + 7, sfx: "mouse-click", vol: 0.35, note: "bonus · prompt 1 send" },
  { f: B.skill, sfx: "pop", vol: 0.3, note: "bonus · SKILL.md appears" },
  { f: B.skill + 2, sfx: "keypad", vol: 0.24, trimFrames: 26, note: "bonus · SKILL.md types" },
  ...ABSORB_HITS.map((h, i): Cue => ({ f: h - 1, sfx: "tap", vol: 0.34, note: `bonus · videos absorbed ${i + 1}` })),
  { f: B.lkol, sfx: "whoosh", vol: 0.34, note: "bonus · skill → shelf" },
  { f: B.lkol + 12, sfx: "ding", vol: 0.34, trimFrames: 26, note: "bonus · skill lands in the shelf" },
  { f: B.skill2, sfx: "pop", vol: 0.3, note: "bonus · NEW badge" },
  { f: B.kol, sfx: "swipe", vol: 0.28, note: "bonus · shelf → machine" },
  ...LOOPS.flatMap((L, i): Cue[] => [
    { f: L.fly, sfx: "whoosh", vol: 0.24, note: `bonus · loop ${i + 1} in` },
    { f: L.hit, sfx: "tick", vol: 0.26, note: `bonus · loop ${i + 1} skill runs` },
    { f: L.land - 2, sfx: "pop", vol: 0.34, note: `bonus · loop ${i + 1} reel out` },
  ]),
  { f: B.wtqollou + 2, sfx: "keypad", vol: 0.24, trimFrames: 16, note: "bonus · prompt 2 typing" },
  { f: B.lskill, sfx: "snapchat-notification", vol: 0.3, note: "bonus · skill chip attaches" },
  { f: B.hedhi, sfx: "mouse-click", vol: 0.32, note: "bonus · prompt 2 send" },
  { f: B.hedhi + 1, sfx: "flash", vol: 0.3, note: "bonus · skill fires" },
  { f: B.end - 3, sfx: "whoosh", vol: 0.42, note: "bonus · hand-off to face outro" },
];
