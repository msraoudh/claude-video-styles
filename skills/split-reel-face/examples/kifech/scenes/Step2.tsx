import type React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { Cue } from "../edit/cue";
import { ChatPhase } from "./Step2/Chat";
import { ReplyPhase } from "./Step2/Reply";
import { B, T } from "./Step2/shared";
import { SheetPhase } from "./Step2/Sheet";
import { TermPhase } from "./Step2/Term";

/**
 * ÉTAPE 2/5 · « نعطيها لـ Claude يحلّلها » (19.86–39.08 s, split stage y 1040–1450) — the « Claude really works » moment.
 * Five compositions, one per beat, swapped with quick blur/slide transitions:
 *   1. the reel hands its link to Claude → the prompt types itself in 3arbizi (word-synced) → send
 *   2. Claude Code: REAL `yt-dlp https://www.instagram.com/p/DemwzTPJK6J/` + download bar → stamp « TOUT SEUL »
 *   3. terminal compacts, reel.mp4 pops out → whisper → REAL `ffmpeg -i reel.mp4 -vf fps=2,tile=5x4 sheet.jpg` → contact sheet
 *   4. « frame by frame »: the sheet's tiles (REAL frames of the reference) fly into a filmstrip that steps frame by frame
 *   5. Claude's reply card (French): Hook / Layout / Couleur / Motion / Sons + tools Remotion · ffmpeg · Whisper
 */
export const Step2: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.start || frame > T.end + 10) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <ChatPhase />
      <TermPhase />
      <SheetPhase />
      <ReplyPhase />
    </AbsoluteFill>
  );
};

const keys = (at: number, trimFrames: number, note: string): Cue => ({ f: at, sfx: "keypad", vol: 0.16, trimFrames, note });

export const step2Cues: Cue[] = [
  // 1 — chat
  { f: B.winIn, sfx: "swipe", vol: 0.3, note: "step2 · Claude window in" },
  { f: T.start + 16, sfx: "pop", vol: 0.22, note: "step2 · link chip on the reel" },
  { f: B.grab, sfx: "mouse-click", vol: 0.35, note: "step2 · grab the link" },
  { f: B.grab + 3, sfx: "whoosh", vol: 0.18, trimFrames: 14, note: "step2 · drag" },
  { f: T.lien, sfx: "pop", vol: 0.45, note: "step2 · « lien » drops into the input" },
  { f: T.claude1, sfx: "flash", vol: 0.2, note: "step2 · spark glow « Claude »" },
  { f: T.nqollo, sfx: "whoosh", vol: 0.22, trimFrames: 16, note: "step2 · window widens" },
  keys(T.tfarrej, 20, "step2 · typing tfarrej fel vidéo"),
  keys(T.analyse, 18, "step2 · typing analysiha"),
  keys(T.details - 2, 16, "step2 · typing b détails"),
  keys(T.qolli + 4, 24, "step2 · typing chnowa ma3moula"),
  keys(T.bech, 20, "step2 · typing b chnowa"),
  keys(T.outils1, 26, "step2 · typing w chnowa les outils"),
  { f: B.send, sfx: "mouse-click", vol: 0.35, note: "step2 · send click" },
  { f: B.send + 2, sfx: "whoosh", vol: 0.28, note: "step2 · sent" },
  // 2 — Claude Code downloads
  { f: B.toTerm, sfx: "whip", vol: 0.4, note: "step2 · → terminal" },
  keys(B.ytType, 17, "step2 · yt-dlp command"),
  { f: T.yhabet, sfx: "tick", vol: 0.16, note: "step2 · download starts" },
  { f: T.yhabet + 6, sfx: "tick", vol: 0.14, note: "step2 · download" },
  { f: T.wahdou, sfx: "shutter-modern", vol: 0.38, note: "step2 · stamp TOUT SEUL" },
  { f: B.dlDone, sfx: "success", vol: 0.24, note: "step2 · 100 %" },
  // 3 — analysis
  { f: B.c3, sfx: "whoosh", vol: 0.22, trimFrames: 16, note: "step2 · terminal compacts, reel.mp4 out" },
  { f: T.outils2, sfx: "tap", vol: 0.25, note: "step2 · whisper" },
  { f: T.outils2 + 9, sfx: "tick", vol: 0.18, note: "step2 · 128 mots" },
  keys(B.ffType, 18, "step2 · ffmpeg command"),
  ...[0, 4, 8, 12, 16].map((d): Cue => ({ f: T.ffmpeg + d, sfx: "tick", vol: 0.16, note: "step2 · contact sheet tiles" })),
  // 4 — frame by frame
  { f: T.frame, sfx: "swipe", vol: 0.38, note: "step2 · tiles → filmstrip" },
  ...Array.from({ length: 8 }, (_, k): Cue => ({ f: B.steps + 4 * k, sfx: "tick", vol: 0.15, note: "step2 · frame step" })),
  // 5 — reply
  { f: B.replyIn, sfx: "whoosh", vol: 0.26, trimFrames: 16, note: "step2 · reply card" },
  { f: T.yqolli, sfx: "ding", vol: 0.42, note: "step2 · Claude replies" },
  ...[0, 1, 2, 3, 4].map((k): Cue => ({ f: T.yqolli + 4 + 4 * k, sfx: "tick", vol: 0.17, note: "step2 · analysis row" })),
  { f: T.bchnowa, sfx: "switch", vol: 0.22, note: "step2 · highlight Couleur" },
  { f: T.kifech, sfx: "switch", vol: 0.22, note: "step2 · highlight Motion" },
  ...[0, 1, 2].map((k): Cue => ({ f: T.wchnowa + 5 * k, sfx: "pop", vol: 0.32, note: "step2 · tool chip" })),
];
