import React from "react";
import { AbsoluteFill } from "remotion";
import { L } from "../../lib/look";
import { Builds } from "./Builds";
import { At } from "./fx";
import { LineB } from "./LineB";
import { Montage1, Montage2 } from "./Montage";
import { NameReveal } from "./NameReveal";
import { T } from "./timeline";
import { Wall } from "./Wall";

/**
 * HERO — DROP 1, global frames 757–1803 (1804 belongs to escalate).
 *   757  NAME REVEAL: liquid-glass dossier slab, tiles flip into « MED YOURNAME » (signature), portrait, dive
 *   943  « LES 1000 VERSIONS » montage I (2-beat → 1-beat cuts, flash frames)
 *   1171 line B lip-synced: freeze → colour on the first word → « IDÉES DE FOU » behind him
 *   1295 HE BUILDS: his real screens orbiting a dot-sphere mind, intercut with faces
 *   1577 the reel wall flips (radial), 52 REELS · 4 900 ABONNÉS · 134K VUES
 *   1644 montage II: beat → half-beat strobe, freeze/mono, ramps, push into 1804
 * Every cut is a beat / downbeat / half-beat from data/beats.ts (see timeline.ts).
 */
export const Hero: React.FC = () => (
  <AbsoluteFill style={{ background: L.ink }}>
    <At from={T.drop} to={T.m1} name="Name reveal (3D)">
      <NameReveal />
    </At>
    <Montage1 />
    <LineB />
    <Builds />
    <At from={T.wall} to={T.m2a} name="Reel wall (3D)">
      <Wall />
    </At>
    <Montage2 />
  </AbsoluteFill>
);
