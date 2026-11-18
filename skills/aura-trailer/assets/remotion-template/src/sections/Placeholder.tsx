import React from "react";
import { AbsoluteFill } from "remotion";
import { fontInter, fontMono } from "../kit/fonts";
import { BIG_HITS, BEATS, DOWNBEATS } from "../data/beats";
import { SECTIONS } from "../data/sections";
import { LINES } from "../data/voice";
import { beatPulse, bigHitPulse, hitPulse, useGlobalFrame } from "../lib/beat";
import { L } from "../lib/look";

/**
 * Stand-in for a part that has no scene yet: shows the section, the beat / 808 grid pulsing and the voice line being
 * spoken, so the timing plan can be checked in the Studio (with the preview audio) before any scene is built.
 */
export const Placeholder: React.FC = () => {
  const g = useGlobalFrame();
  const sec = SECTIONS.find((s) => g >= s.from && g < s.to);
  const ln = LINES.find((l) => g >= l.from && g < l.from + l.durationInFrames);
  const word = ln?.words.filter((w) => w.f <= g).slice(-1)[0]?.w;
  const beat = BEATS.filter((b) => b <= g).length, bar = DOWNBEATS.filter((b) => b <= g).length;
  return (
    <AbsoluteFill style={{ background: L.ink, alignItems: "center", justifyContent: "center", fontFamily: fontInter }}>
      <AbsoluteFill style={{ background: `rgba(255,255,255,${0.05 * beatPulse(g) + 0.12 * hitPulse(g) + 0.4 * bigHitPulse(g, 18)})` }} />
      <div style={{ position: "absolute", top: 260, fontFamily: fontMono, fontSize: 30, letterSpacing: "0.3em", color: L.steel2 }}>
        {sec ? `${sec.id.toUpperCase()} · ${sec.from}-${sec.to}` : "—"}
      </div>
      <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: "-0.04em", color: ln ? L.steel : L.steel3, textAlign: "center", padding: "0 90px" }}>
        {ln ? word ?? "…" : BIG_HITS.includes(g) ? "HIT" : `${bar}.${beat}`}
      </div>
      <div style={{ position: "absolute", top: 1280, width: 900, fontSize: 38, color: L.steel2, textAlign: "center" }}>{ln ? `${ln.id} · ${ln.text}` : sec?.what}</div>
      <div style={{ position: "absolute", top: 1480, fontFamily: fontMono, fontSize: 28, color: L.steel3 }}>frame {g}</div>
    </AbsoluteFill>
  );
};
