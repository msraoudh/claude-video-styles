import React from "react";
import { AbsoluteFill } from "remotion";
import { L } from "../../lib/look";
import { Silence } from "./Silence";
import { Title } from "./Title";
import { Finale } from "./Finale";
import { EndCard } from "./EndCard";

/**
 * CLIMAX — global frames 2856–3600 (silence → title slam → finale strobe → tape stop → end card).
 * Every timing lives in ./timing.ts; each block is its own file:
 *   Silence.tsx   2856–3107  line D, « PLUS TARD » → portal → 3D wireframe swap « JAMAIS. », line E push, black
 *   Title.tsx     3099–3237  3D glass-shard title « NO MORE EXCUSES » on the big 808, line F « je me lance »
 *   Finale.tsx    3237–3451  strobe montage: CLOUD. / IA. / AUTOMATION. / CONTENU. + face strobes
 *   EndCard.tsx   3451–3600  hero → tape stop → CRT power-down → end card + glass card (line G)
 */
export const Climax: React.FC = () => (
  <AbsoluteFill style={{ background: L.ink }}>
    <Silence />
    <Title />
    <Finale />
    <EndCard />
  </AbsoluteFill>
);
