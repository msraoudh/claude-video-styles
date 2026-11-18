import type React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { Cue } from "../edit/cue";
import { EASE } from "../edit/kit";
import { Brainstorm } from "./Step3/Brainstorm";
import { Match } from "./Step3/Match";
import { Palette } from "./Step3/Palette";
import { T } from "./Step3/t";
import { DONE, DROP, Toolbox } from "./Step3/Toolbox";

/**
 * Step 3 — « ÉTAPE 3/5 · نفس الـ style، نفس الـ motion » (39.08–55.28, split mode, stage y 1040–1450).
 *  A 39.08 prompt « behi, habbetli les outils hedhom lkol » → 6 tool cards drop into a toolbox, install, ✓ 6/6 on « الكل »
 *  B 43.04 reference reel ↔ our card, 3 match checks on « style » / « motions » / « cards »
 *  C 47.15 prompt typed word by word « brainstormi m3aya, w act as expert motion graphics editor », idea bubbles,
 *          role badge stamp on « expert »;  D 51.2 « ديما » the same brief stacked + loop chip
 *  E 53.02 the reference palette is sampled and flips into OUR coral palette on « vibe ».
 * GLOBAL frames (no Sequence offset). Each beat exits fast (6 frames, blur up) right before the next one enters.
 */
const Beat: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame > to + 7) return null;
  const q = EASE((frame - to) / 6);
  const push = 1 + 0.03 * Math.min(1, Math.max(0, (frame - from) / Math.max(1, to - from)));
  return (
    <AbsoluteFill
      style={{
        opacity: 1 - q,
        filter: q > 0 ? `blur(${q * 8}px)` : undefined,
        transform: `translateY(${-q * 18}px) scale(${push - q * 0.03})`,
        transformOrigin: "500px 1245px",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const Step3: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.start || frame > T.end + 8) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Beat from={T.start} to={T.bStart - 3}>
        <Toolbox />
      </Beat>
      <Beat from={T.bStart} to={T.cIn - 2}>
        <Match />
      </Beat>
      <Beat from={T.cIn} to={T.eIn - 3}>
        <Brainstorm />
      </Beat>
      <Beat from={T.eIn} to={T.end - 3}>
        <Palette />
      </Beat>
    </AbsoluteFill>
  );
};

export const step3Cues: Cue[] = [
  // A — prompt + toolbox
  { f: T.start + 1, sfx: "whoosh", vol: 0.3, note: "step 3 stage enters" },
  { f: T.prompt + 1, sfx: "keypad", vol: 0.22, note: "typing « behi, habbetli… »" },
  { f: T.prompt + 22, sfx: "keypad", vol: 0.18, note: "typing (2)" },
  { f: T.send, sfx: "mouse-click", vol: 0.35, note: "send on « هبّطلي »" },
  ...[0, 1, 2, 3, 4, 5].map((i) => ({ f: DROP(i) + 4, sfx: i % 2 ? "tap" : "pop", vol: i % 2 ? 0.3 : 0.22, note: `tool card ${i + 1} lands` })),
  { f: DONE(1), sfx: "tick", vol: 0.16, note: "installed ✓" },
  { f: DONE(3), sfx: "tick", vol: 0.16, note: "installed ✓" },
  { f: DONE(5), sfx: "tick", vol: 0.16, note: "installed ✓" },
  { f: T.kol, sfx: "success", vol: 0.2, trimFrames: 24, note: "6/6 on « الكل »" },
  // B — reference ↔ ours
  { f: T.bStart - 1, sfx: "whoosh", vol: 0.32, note: "ref ↔ ours cards enter" },
  { f: T.bStart + 8, sfx: "switch", vol: 0.2, note: "match rows appear" },
  { f: T.style, sfx: "ding", vol: 0.2, trimFrames: 14, note: "✓ style" },
  { f: T.motions, sfx: "ding", vol: 0.21, trimFrames: 14, note: "✓ motions (inner cards replay)" },
  { f: T.motions + 1, sfx: "swipe", vol: 0.14, note: "motion replay swish" },
  { f: T.cards, sfx: "ding", vol: 0.22, trimFrames: 14, note: "✓ cards (fan spreads)" },
  { f: T.cards + 2, sfx: "page-turn", vol: 0.18, note: "cards fan" },
  // C — brainstorm + role stamp
  { f: T.cIn - 1, sfx: "whip", vol: 0.3, note: "prompt enters" },
  { f: T.brain, sfx: "keypad", vol: 0.2, note: "typing brainstormi…" },
  { f: T.act, sfx: "keypad", vol: 0.16, note: "typing act as…" },
  { f: T.motion, sfx: "keypad", vol: 0.14, note: "typing motion graphics editor" },
  { f: T.brain + 3, sfx: "pop", vol: 0.2, note: "idea bubble" },
  { f: T.brain + 9, sfx: "snapchat-notification", vol: 0.14, note: "idea bubble (Claude)" },
  { f: T.m3aya + 1, sfx: "pop", vol: 0.18, note: "idea bubble" },
  { f: T.m3aya + 7, sfx: "snapchat-notification", vol: 0.13, note: "idea bubble (Claude)" },
  { f: T.w + 1, sfx: "pop", vol: 0.17, note: "idea bubble" },
  { f: T.act, sfx: "pop", vol: 0.16, note: "idea bubble" },
  { f: T.as - 2, sfx: "riser", vol: 0.16, trimFrames: 14, note: "bubbles sucked in" },
  { f: T.expert, sfx: "shutter-modern", vol: 0.34, note: "role badge STAMP on « expert »" },
  { f: T.expert, sfx: "flash", vol: 0.22, note: "stamp flash" },
  { f: T.expert, sfx: "tap", vol: 0.42, note: "stamp hit" },
  { f: T.motion, sfx: "tick", vol: 0.14, note: "badge word lights" },
  { f: T.graphics, sfx: "tick", vol: 0.14, note: "badge word lights" },
  { f: T.editor, sfx: "tick", vol: 0.16, note: "badge word lights" },
  { f: T.editor + 12, sfx: "mouse-click", vol: 0.28, note: "prompt sent" },
  // D — the same story
  { f: T.dima, sfx: "switch", vol: 0.26, note: "loop chip « à chaque vidéo »" },
  { f: T.dima + 3, sfx: "page-turn", vol: 0.2, note: "prompt copies stack" },
  { f: T.hkeya, sfx: "tap", vol: 0.26, note: "re-sent (same story)" },
  // E — palette → our vibe
  { f: T.eIn - 1, sfx: "whoosh", vol: 0.3, note: "palette beat enters" },
  { f: T.eIn + 4, sfx: "pop", vol: 0.18, note: "sample colour 1" },
  { f: T.eIn + 10, sfx: "pop", vol: 0.16, note: "sample colour 3" },
  { f: T.eIn + 16, sfx: "pop", vol: 0.16, note: "sample colour 5" },
  { f: T.nbadl, sfx: "swipe", vol: 0.22, note: "slider starts on « نبدّلوها »" },
  { f: T.selon - 6, sfx: "dissolve", vol: 0.16, trimFrames: 24, note: "swatches flip (shimmer)" },
  { f: T.vibe, sfx: "flash", vol: 0.26, note: "our vibe on « vibe »" },
  { f: T.vibe + 3, sfx: "pop", vol: 0.16, note: "knob arrives on « notre vibe »" },
];
