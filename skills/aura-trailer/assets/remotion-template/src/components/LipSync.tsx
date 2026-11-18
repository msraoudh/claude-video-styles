import React from "react";
import { Sequence, useCurrentFrame } from "remotion";
import { line as getLine } from "../data/voice";
import { useGlobalFrame } from "../lib/beat";
import { Matte, Shot, type ShotProps } from "./Shot";

type LipProps = Omit<ShotProps, "clip" | "at" | "speed"> & {
  /** voice line id from trailer.json lines[] */
  line: string;
  /** start this many frames after the line starts (cutaway first), and/or end early (cutaway after) */
  trimStart?: number;
  trimEnd?: number;
};

/** frames from the trailer start to the current Sequence's frame 0 (works at any nesting depth) */
const useOffset = () => useGlobalFrame() - useCurrentFrame();

/**
 * The subject saying one of their lines, in sync: the line's lip-sync clip (trailer.json voice.sources[src].clip),
 * played from the line's srcIn exactly while the voice line plays. Drop it anywhere inside a section.
 * Rule: while a line plays, the ONLY talking face on screen is this one.
 */
export const LipShot: React.FC<LipProps> = ({ line, trimStart = 0, trimEnd = 0, ...rest }) => {
  const l = getLine(line);
  const off = useOffset();
  const dur = l.durationInFrames - trimStart - trimEnd;
  if (dur <= 0) return null;
  return (
    <Sequence from={l.from + trimStart - off} durationInFrames={dur} layout="none">
      <Shot clip={l.clip} at={l.srcIn + trimStart / 60} {...rest} />
    </Sequence>
  );
};

/** The cut-out of the same lip-synced moment (text behind the subject while they speak): LipShot, text, LipMatte. */
export const LipMatte: React.FC<LipProps> = ({ line, trimStart = 0, trimEnd = 0, ...rest }) => {
  const l = getLine(line);
  const off = useOffset();
  const dur = l.durationInFrames - trimStart - trimEnd;
  if (dur <= 0) return null;
  return (
    <Sequence from={l.from + trimStart - off} durationInFrames={dur} layout="none">
      <Matte clip={l.clip} at={l.srcIn + trimStart / 60} {...rest} />
    </Sequence>
  );
};
