import type React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { Cue } from "../edit/cue";
import { f, wf } from "../edit/time";
import { CARD_POPS, Carousel, FLY_OUT, MotionChipWall, REELS_AT, TURN_AT, W0, W1 } from "./Hook/Carousel";
import { beatFrame, Burst, ClaudeHit, Difficulty, FollowPill, MotionCard, RingCount, SoundCard, SPARK_X, SPARK_Y, StepPills, Sticker, TILE_TICKS, TimelineCard } from "./Hook/parts";
import { Spark3D } from "./Hook/Spark3D";

/**
 * HOOK (face mode) — 0–9.62 s, the « ساهلة الحكاية » callback 100.44–103.26 s and the end 113.42–115.03 s.
 * GLOBAL frames (no Sequence offset). The face is never covered: the 0.6–2.62 s carousel sits around the user's shot
 * (layout "wall"), everything else lives beside the head (x < 230 / x > 850) or on the chest under the caption pill.
 */

// ---- word frames (src/data/captions.json)
const T = {
  sound: wf("والصوت", 3.04), // 91
  hadha: wf("هذا", 3.57), // 107
  all: wf("وكل", 3.84), // 115
  first: wf("أولاً", 4.38), // 131
  use: wf("نستعمل", 4.75), // 143
  logiciel: wf("logiciel", 5.08), // 152
  montage: wf("montage", 5.55), // 167
  kollo: wf("كلّو", 5.92), // 178
  claude: wf("claude", 6.14), // 184
  tabaa: wf("تابع", 6.92), // 208
  sixty: wf("60", 7.45), // 224
  les: wf("les", 8.4), // 252
  easy: wf("easy", 9.14), // 274
  peasy: wf("peasy", 9.5), // 285
  split: f(9.62), // 289
  // callback
  sahla: wf("ساهلة", 100.44), // 3013
  hkeya: wf("الحكاية", 101.31), // 3039
  ma: wf("ما", 102.1), // 3063
  shay: wf("شي", 103.05), // 3092
  split2: f(103.26), // 3098
  // end
  direct: wf("direct", 113.42), // 3403
  yrakah: wf("يركّحلك", 113.78), // 3413
  voila: wf("voilà", 114.43), // 3433
};
const SLAM = beatFrame(7); // 181: the spark lands on the 8th beat, 3 frames before « Claude »
const CHIPS_OUT = T.first - 3; // side chips clear for the timeline card
const SPARK_OUT = T.sixty + 12;

const PartA: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {/* 0.6–2.62 : 3D carousel of the user's last 4 reels around their own shot */}
    <Carousel />
    <MotionChipWall />
    {/* 2.62–4.38 : motion graphics · الصوت · كل شيء */}
    <MotionCard at={W1 + 3} out={CHIPS_OUT} />
    <SoundCard at={T.sound} out={CHIPS_OUT + 1} swell={T.hadha} />
    <Burst at={T.all} out={CHIPS_OUT} />
    {/* 4.38–5.9 : the editing software gets struck */}
    <TimelineCard at={T.use} strike={T.montage} blow={SLAM} />
    {/* 5.92–6.9 : THE MOMENT — Claude spark 3D + flash + shockwave */}
    <ClaudeHit at={SLAM} out={SPARK_OUT} />
    <Spark3D at={SLAM} out={SPARK_OUT} x={SPARK_X} y={SPARK_Y} size={400} beat={0.05} />
    {/* 6.92–9.62 : 60 secondes · les étapes · easy peasy */}
    <RingCount at={T.sixty} out={T.split} />
    <StepPills at={T.les} split={T.split} />
    <Sticker at={T.easy} out={T.split} wobble={T.peasy} beatOn />
  </AbsoluteFill>
);

const PartB: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <Sticker at={T.sahla + 8} out={T.split2 - 2} wobble={T.hkeya} />
    <Difficulty at={T.hkeya} drain={T.ma} zero={T.shay} out={T.split2 - 2} />
  </AbsoluteFill>
);

const PartC: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <Spark3D at={T.yrakah - 2} out={9999} x={SPARK_X} y={SPARK_Y} size={400} slam={false} />
    <FollowPill at={T.yrakah + 4} click={T.voila} />
  </AbsoluteFill>
);

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= 0 && frame <= T.split + 18) return <PartA />;
  if (frame >= T.sahla && frame <= T.split2 + 10) return <PartB />;
  if (frame >= T.direct) return <PartC />;
  return null;
};

export const hookCues: Cue[] = [
  // carousel
  { f: W0 - 2, sfx: "whoosh", vol: 0.3, note: "hook: face shrinks into the reel carousel" },
  { f: REELS_AT, sfx: "swipe", vol: 0.28, note: "hook: reels slide in (left)" },
  { f: REELS_AT + 3, sfx: "swipe", vol: 0.24, note: "hook: reels slide in (right)" },
  ...CARD_POPS.map((p, i) => ({ f: p, sfx: "pop", vol: 0.2 + 0.02 * i, note: `hook: reel card ${i + 1} lands` })),
  { f: TURN_AT - 1, sfx: "whoosh", vol: 0.3, note: "hook: carousel turns on « motion »" },
  { f: 43, sfx: "riser", vol: 0.14, note: "hook: build into the first 808 (music starts 3.0 s)" },
  { f: TURN_AT + 1, sfx: "pop", vol: 0.24, note: "hook: « motion graphics » chip" },
  { f: FLY_OUT, sfx: "whip", vol: 0.3, note: "hook: cards fly out, face back full" },
  // motion graphics · الصوت · كل شيء
  { f: W1 + 4, sfx: "tap", vol: 0.22, note: "hook: motion graphics card lands left" },
  { f: T.sound, sfx: "pop", vol: 0.2, note: "hook: « الصوت » card lands on the first 808 hit (music starts 3.0 s)" },
  ...TILE_TICKS.map((d) => ({ f: T.all + d * 2, sfx: "tick", vol: 0.16, note: "hook: « كل شيء » tool tile" })),
  { f: CHIPS_OUT, sfx: "swipe", vol: 0.18, note: "hook: chips clear" },
  // logiciel de montage ✕
  { f: T.use, sfx: "pop", vol: 0.22, note: "hook: editing timeline card" },
  { f: T.montage, sfx: "record-scratch", vol: 0.26, trimFrames: 16, note: "hook: ✕ logiciel de montage" },
  { f: T.montage + 3, sfx: "windows-xp-error", vol: 0.12, trimFrames: 18, note: "hook: « 0 logiciel » stamp" },
  // كلّو بـ Claude — THE MOMENT (music starts at 5.92)
  { f: SLAM - 7, sfx: "whoosh", vol: 0.34, note: "hook: into the Claude slam" },
  { f: SLAM, sfx: "vine-boom", vol: 0.3, note: "hook: sub hit, Claude spark lands" },
  { f: SLAM, sfx: "sting", vol: 0.26, note: "hook: Claude sting" },
  { f: SLAM + 1, sfx: "flash", vol: 0.3, note: "hook: coral flash" },
  // 60 secondes · les étapes · easy peasy
  { f: T.sixty, sfx: "tick", vol: 0.2, note: "hook: ring 60 starts" },
  { f: T.sixty + 8, sfx: "tick", vol: 0.17, note: "hook: ring counts" },
  { f: T.sixty + 16, sfx: "tick", vol: 0.17, note: "hook: ring counts" },
  { f: T.sixty + 26, sfx: "ding", vol: 0.16, note: "hook: ring 60 full" },
  { f: SPARK_OUT, sfx: "dissolve", vol: 0.14, note: "hook: spark leaves" },
  ...[0, 1, 2, 3, 4].map((i) => ({ f: T.les + i * 3 + 2, sfx: "pop", vol: 0.17, note: `hook: step pill ${i + 1}` })),
  { f: T.easy, sfx: "pop", vol: 0.32, note: "hook: easy peasy sticker slap" },
  { f: T.peasy, sfx: "tap", vol: 0.22, note: "hook: sticker wobble « peasy »" },
  { f: T.split - 3, sfx: "whoosh", vol: 0.34, note: "hook → split (pills fly into the progress bar)" },
  // callback « ساهلة الحكاية »
  { f: T.sahla + 8, sfx: "pop", vol: 0.3, note: "callback: easy peasy sticker" },
  { f: T.hkeya, sfx: "tap", vol: 0.22, note: "callback: difficulty meter" },
  ...[0, 1, 2, 3, 4].map((i) => ({ f: T.ma + Math.round((i * (T.shay - T.ma)) / 5), sfx: "tick", vol: 0.15, note: "callback: meter drains" })),
  { f: T.shay, sfx: "success", vol: 0.22, note: "callback: difficulté 0 ✓" },
  { f: T.split2 - 3, sfx: "whoosh", vol: 0.3, note: "callback → split" },
  // end
  { f: T.yrakah - 2, sfx: "sting", vol: 0.18, note: "end: Claude spark returns" },
  { f: T.yrakah + 4, sfx: "swipe", vol: 0.22, note: "end: follow pill" },
  { f: T.voila, sfx: "mouse-click", vol: 0.45, note: "end: click « Suivre » on « voilà »" },
  { f: T.voila + 2, sfx: "success", vol: 0.22, note: "end: followed ✓" },
];
