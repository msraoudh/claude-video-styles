import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Shot } from "../../components/Shot";
import { line } from "../../data/voice";
import { useGlobalFrame } from "../../lib/beat";
import { L } from "../../lib/look";
import { EASE_IN, EASE_IN_OUT, EASE_OUT } from "../../lib/motion";
import { Darkness, Flare } from "./cine";
import { Big, inWindows, lin, monoType, ScanLine, Slam, Slices } from "./ui";

/**
 * COLD OPEN (global 0-239). Black, drone + heartbeat. the user's face card (zones episode, lip-synced to line H)
 * surfaces from the dark under a slow push 1.0 -> 1.15, a cold scan line crosses it, tiny HUD labels.
 * « TON MÉTIER » types in small and gets struck out; « TOI. » slams huge in blood red on the « toi » syllable
 * (the "t" burst is at 220, the vowel opens at 223 -> slam at 221). Hard cut to the world at 240 (808 in).
 */
export const TOI_F = 221;
/** tiny percussive ticks of the muffled intro (hi-band onsets) -> 2-frame data glitches on the card */
const GLITCH_F = [74, 155, 161, 191, 206];
const HEART_F = [6, 22, 151, 167];

export const Cold: React.FC = () => {
  const g = useGlobalFrame();
  const h = line("H");
  const toi = g >= TOI_F;

  // face: emerges from the dark, slow push, then a hard punch on « toi »
  // director: his face is already readable (dim) on frame 0 — the feed's first frame / cover must not be black
  const reveal = lin(g, 0, 90, 0.45, 1, EASE_IN_OUT);
  // heartbeat throbs, synced to the cued heartbeat.wav thumps (lub +2, dub +18 after the cue frames 4 and 149)
  const hb = HEART_F.reduce((s, f) => s + (g >= f ? Math.exp(-(g - f) / 4) : 0), 0);
  const push = lin(g, 18, TOI_F, 1.0, 1.15, EASE_IN_OUT) * (1 + 0.006 * hb);
  const scale = toi ? lin(g, TOI_F, TOI_F + 5, 1.15, 1.34, EASE_OUT) + (g - TOI_F) * 0.003 : push;
  const glitch = inWindows(g, GLITCH_F, 2);
  const flicker = glitch ? 1.35 : 1;
  const toiDim = toi ? lin(g, TOI_F, TOI_F + 3, 1, 0.42) * lin(g, 234, 239, 1, 0.12, EASE_IN) : 1;
  const bright = (0.18 + 0.62 * reveal) * flicker * toiDim * (1 + 0.16 * hb);
  const spot = 28 + 70 * reveal; // spotlight radius %

  // « TON MÉTIER » typed on « ton métier », struck on « remplacer », gone on « toi »
  const TM = "TON MÉTIER";
  const typed = Math.floor(lin(g, 112, 134, 0, TM.length));
  const strike = lin(g, 197, 212, 0, 1, EASE_OUT);
  const tmFlick = g >= 213 && g < TOI_F ? (g % 3 === 0 ? 0.2 : 1) : 1;

  // HUD fades in with the first heartbeat
  // (frame 0 already carries the HUD: the first frame in the feed is never pure black)
  const hud = (g < 6 ? (g % 2 === 0 ? 0.9 : 0.35) : 0.55 + 0.45 * lin(g, 6, 40, 0, 1)) * (toi ? 0 : 1);
  const scanY = lin(g, 30, 214, 300, 1640, EASE_IN_OUT);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence from={0} durationInFrames={240} name="H face (card-zones, held still until the line starts, then lip-synced)">
        <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: "50% 34%" }}>
          <Slices on={glitch} seed={g} amount={46}>
            <Shot clip="card-zones" speed={(lf) => h.srcIn + Math.max(0, lf - h.from) / 60} grade={toi ? "mono" : "night"} focus="50% 30%" filter={`brightness(${bright}) contrast(1.22)`} />
          </Slices>
        </AbsoluteFill>
        {/* darkness that slowly lets him in */}
        <AbsoluteFill style={{ background: `radial-gradient(ellipse ${spot}% ${spot * 0.62}% at 50% 36%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.97) 100%)` }} />
        <Darkness creep={toi ? 0.85 : 0.75 - 0.25 * reveal} spot={toi ? 0 : 0.78} x={50} y={36} key={0.45} />
        {/* cold tint / blood tint after « toi » */}
        <AbsoluteFill style={{ background: toi ? "rgba(120,0,18,0.42)" : "rgba(20,60,110,0.18)", mixBlendMode: toi ? "multiply" : "color" }} />
        {!toi ? <ScanLine y={scanY} opacity={0.22 * reveal} /> : null}
      </Sequence>

      {/* HUD */}
      <div style={{ position: "absolute", left: 90, top: 226, opacity: hud * (glitch ? 0.4 : 1), ...monoType(22, L.steel3, 0.38) }}>
        DOSSIER <span style={{ textTransform: "none" }}>#yourhandle</span>
      </div>
      <div style={{ position: "absolute", right: 90, top: 226, opacity: hud, ...monoType(22, L.steel3, 0.38), display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 10, height: 10, borderRadius: 5, background: L.blood, opacity: Math.floor(g / 24) % 2 === 0 ? 1 : 0.25 }} />
        2026
      </div>

      {/* « TON MÉTIER » — small, typed, then struck */}
      {g >= 112 && !toi ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1404, textAlign: "center", opacity: tmFlick * lin(g, 112, 116, 0, 1) }}>
          <span style={{ position: "relative", display: "inline-block", ...monoType(40, L.steel, 0.42) }}>
            {TM.slice(0, typed)}
            <span style={{ opacity: typed < TM.length || Math.floor(g / 12) % 2 === 0 ? 1 : 0, color: L.cyan }}>▌</span>
            <span style={{ position: "absolute", left: -10, top: "52%", height: 4, width: `calc(${strike * 100}% + 10px)`, background: L.blood, boxShadow: `0 0 14px ${L.blood}` }} />
          </span>
        </div>
      ) : null}

      {/* « TOI. » — the slam */}
      <Flare at={TOI_F - 1} x={0.5} y={1150 / 1920} col={[255, 46, 77]} dur={30} strength={0.9} size={190} ghosts={false} />
      <Slam at={TOI_F} until={240} y={1150} from={1.45} grow={0.05} shake={14} ghost={28} bands={120} echo={L.blood}>
        <Big size={390} color={L.blood} glow="0 0 50px rgba(255,46,77,0.55), 0 0 140px rgba(255,46,77,0.35)">TOI.</Big>
      </Slam>
      {/* 1-frame white core on the slam */}
      {g === TOI_F ? <AbsoluteFill style={{ background: "#fff", opacity: 0.28, mixBlendMode: "screen" }} /> : null}
    </AbsoluteFill>
  );
};
