import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Matte, Shot } from "../../components/Shot";
import { KEY } from "../../data/beats";
import { line } from "../../data/voice";
import { useGlobalFrame } from "../../lib/beat";
import { L } from "../../lib/look";
import { EASE_IN, EASE_IN_OUT } from "../../lib/motion";
import { Darkness, decode } from "./cine";
import { Big, Flash, lin, monoType, Slam, Slices } from "./ui";

/**
 * LINE A + DROP-OUT (global 614-756). Hard cut to the user (master-v4, lip-synced) on the 614 hit, right on « moi ».
 * « MOI C'EST ▌ » lands on « c'est » (622) with a waiting terminal cursor: the name is withheld — the strobe on
 * the snare roll scrambles the frame exactly while he says « the user » (633-646). At 647 the music drops out:
 * night grade, darkness creeps in, slow intimate push 1.08 -> 1.26. TECH · CLOUD · IA decode on their words.
 * 744-750 the frame is sucked in (accelerating zoom, blur, to black); 751-756 black with « MOI C'EST ▌ » hanging,
 * so the HERO section can answer it on DROP 1 (757).
 */
const A = line("A");
const CUT = 614;
const SUCK = 744;
const BLACK = 751;

/** strobe events on the snare roll (hi-band onsets 624-646): [frame, kind, length] */
const STROBE: Array<[number, "white" | "black" | "invert" | "slice", number]> = [
  [624, "white", 2],
  [629, "slice", 2],
  [634, "black", 2],
  [638, "invert", 2],
  [641, "slice", 2],
  [646, "black", 1],
];

export const Dropout: React.FC = () => {
  const g = useGlobalFrame();
  const out = g >= KEY.dropout1[0]; // 647: music drops out
  const ev = STROBE.find(([f, , n]) => g >= f && g < f + n);
  const kind = ev ? ev[1] : null;

  const push = g < KEY.dropout1[0] ? 1.08 : lin(g, KEY.dropout1[0], SUCK, 1.08, 1.26, EASE_IN_OUT);
  // suck-in: accelerating zoom into his face + blur + exposure collapse, then black
  const suck = lin(g, SUCK, BLACK, 0, 1, (t) => t * t);
  const scale = push * (1 + 1.1 * suck);
  const bright = (1 - suck) ** 2.2;
  const blur = 9 * suck;
  // trailer grade on the bright webcam plate: build = cold steel, drop-out = night with a key on the face.
  // Wall-only grade (from his previous reel): the plate is the BACKGROUND, crushed; the matte (him) sits on top.
  const plate = out ? "brightness(0.84) contrast(1.3) saturate(0.42) hue-rotate(-12deg)" : "brightness(0.8) contrast(1.26) saturate(0.5) hue-rotate(-14deg)";
  const wall = out ? "brightness(0.3) contrast(1.15) saturate(0.25) hue-rotate(-14deg)" : "brightness(0.5) contrast(1.2) saturate(0.35) hue-rotate(-14deg)";
  const srcAt = A.srcIn + (CUT - A.from) / 60;
  const fx = kind === "invert" ? " invert(1)" : "";

  // cursor: steady blink, frantic while the name is spoken, solid on the black
  const cursorOn = g >= BLACK ? true : g >= 633 && g < 647 ? g % 4 < 2 : Math.floor((g - 622) / 9) % 2 === 0;
  const words: Array<[string, number, string]> = [
    ["TECH", 673, L.steel],
    ["CLOUD", 703, L.steel],
    ["IA", 724, L.violet],
  ];
  const wordsOut = lin(g, SUCK, BLACK - 1, 1, 0);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence from={CUT} durationInFrames={BLACK - CUT} name="A face (master-v4 lip-sync)">
        <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: "50% 27%", filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>
          {kind === "slice" || kind === "invert" ? (
            // strobe frames: the raw plate only (keeps the video count low while it is sliced)
            <Slices on={kind === "slice"} seed={g} amount={70}>
              <Shot clip="master-v4" at={srcAt} grade={kind === "invert" ? "mono" : "screen"} focus="50% 30%" filter={`${kind === "invert" ? "" : plate}${fx}`} />
            </Slices>
          ) : (
            <>
              <Shot clip="master-v4" at={srcAt} grade="screen" focus="50% 30%" filter={`${wall} brightness(${bright})`} />
              <Matte at={srcAt} grade="screen" focus="50% 30%" filter={`${plate} brightness(${bright})`} />
            </>
          )}
        </AbsoluteFill>
        {/* cold cast over everything */}
        <AbsoluteFill style={{ background: "rgba(30,70,120,0.26)", mixBlendMode: "color" }} />
        <Darkness creep={out ? lin(g, 647, 700, 0.5, 0.85) : 0.4} spot={out ? lin(g, 647, 690, 0.3, 0.7) : 0.25} x={50} y={27} key={0.5} />
        {kind === "white" ? <Flash opacity={0.8} /> : null}
        {kind === "black" ? <Flash color="#000" /> : null}
      </Sequence>

      {/* « MOI C'EST ▌ » — the name stays withheld until DROP 1 */}
      {g >= 622 && kind !== "black" ? (
        <Slam at={622} y={1215} from={1.25} bands={50} ghost={14} shake={6} grow={0.0} style={{ scale: String(lin(g, SUCK, 756, 1, 0.9, EASE_IN)) }}>
          <Big size={116} style={{ display: "flex", alignItems: "center", gap: 18 }}>
            MOI C'EST
            <span style={{ display: "inline-block", width: 62, height: 104, background: g >= 633 && g < 647 ? L.blood : L.steel, opacity: cursorOn ? 1 : 0, boxShadow: g >= 633 && g < 647 ? `0 0 26px ${L.blood}` : undefined }} />
          </Big>
        </Slam>
      ) : null}

      {/* TECH · CLOUD · IA — decoded on their word frames */}
      {g >= 673 && g < BLACK ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1318, display: "flex", justifyContent: "center", gap: 0, opacity: wordsOut }}>
          {words.map(([w, f, c], i) => (
            <span key={w} style={{ ...monoType(52, c, 0.34), opacity: g >= f ? 1 : 0, textShadow: g >= f && g < f + 10 ? `0 0 18px ${c}` : undefined }}>
              {i > 0 ? <span style={{ color: L.steel3, margin: "0 0.42em 0 0.1em" }}>·</span> : null}
              {g >= f ? decode(w, g, f, 1.5, 4) : w}
            </span>
          ))}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
