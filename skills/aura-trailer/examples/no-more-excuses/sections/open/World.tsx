import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Shot } from "../../components/Shot";
import { line } from "../../data/voice";
import { beatPulse, useGlobalFrame } from "../../lib/beat";
import { L, type Grade } from "../../lib/look";
import { EASE_IN_OUT, EASE_OUT } from "../../lib/motion";
import { Darkness, Flare, PipSheen, decode, pipShadow } from "./cine";
import { Big, CardBg, Flash, GridFloor, lin, monoType, Scrim, Slam, Slices } from "./ui";

/**
 * THE WORLD (global 240-613). Cut on the 808 onsets (HITS): one cut per 2 beats at the bass entry, one per
 * beat from the L40 evidence on, a half-beat at 549, then a strobe burst on the snare roll into line A.
 *
 *   240 card « EN 2026, » (+ « L'IA CODE. » on the 273 hit)
 *   305 m05 jeunes développeurs (chart falls, -42 lands + freezes on the 338 hit)
 *   370 his face (card-zones, lip-synced pre-roll of L40)           384 « j'ai analysé… »
 *   403 e01 radar + his synced card     428 « +40 » count-up slam on « 40 »
 *   436 e02 scanned grid, « MÉTIERS » slams with the cut, « DANS L'IT » decodes under it (442)
 *   468 e04 ZONE ROUGE + his synced card
 *   501 card « L'IA RECRUTE. »
 *   533 m01 61 % des cadres, 549 punch-in cut on « 61 % »
 *   566 card « …ET TOI ? » (580 punch on the snare onset)
 *   598 strobe on the snare-roll onsets 598/601/605/609: e04 / m05 / e02 / m01 -> 614 line A (Dropout)
 */
const L40 = line("L40");
/** card-zones time for a Sequence starting at global g0, so it is lip-synced with L40 (frozen after the line). */
const czMap = (g0: number) => (lf: number) => Math.min(L40.srcIn + (g0 + lf - L40.from) / 60, L40.srcOut);

/** e01-e04 card slot (1080x1920 episode frame): his talking-head card from the same episode. */
const CARD = { left: 264, top: 1187, width: 551, height: 701, radius: 26 };

/** One of his zones-episode frames, with his talking card replaced by the lip-synced card-zones (L40). */
const Episode: React.FC<{ clip: string; at: number; g0: number; dim?: number; scale?: number; grade?: Grade; freeze?: boolean }> = ({ clip, at, g0, dim = 1, scale = 1, grade = "screen", freeze }) => (
  <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: "50% 42%" }}>
    <Shot clip={clip} at={at} speed={freeze ? 0 : 1} grade={grade} filter={`brightness(${dim})`} />
    <div style={{ position: "absolute", left: CARD.left, top: CARD.top, width: CARD.width, height: CARD.height, borderRadius: CARD.radius, overflow: "hidden", boxShadow: pipShadow(), background: L.ink, isolation: "isolate" }}>
      <Shot clip="card-zones" speed={czMap(g0)} grade={grade} filter={`brightness(${dim})`} />
      <PipSheen radius={CARD.radius} />
    </div>
  </AbsoluteFill>
);

const Seg: React.FC<{ a: number; b: number; name: string; children: React.ReactNode }> = ({ a, b, name, children }) => (
  <Sequence from={a} durationInFrames={b - a} name={name}>
    {children}
  </Sequence>
);

export const World: React.FC = () => {
  const g = useGlobalFrame();
  const bp = beatPulse(g, 10);

  return (
    <AbsoluteFill style={{ background: L.ink }}>
      {/* ---------- 240-305  « EN 2026, » / « L'IA CODE. » ---------- */}
      <Seg a={240} b={305} name="card EN 2026 / L'IA CODE">
        <CardBg glow={0.6 + 0.4 * bp} />
        <GridFloor y0={1300} opacity={0.2 + 0.12 * bp} kick={0.35 * (g >= 273 ? 1 : 0)} />
        <Flare at={240} x={0.5} y={900 / 1920} col={[125, 211, 252]} dur={36} strength={0.85} size={200} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", ...monoType(26, L.steel3) }}>{decode("FRANCE · MARCHÉ IT", g, 242, 0.7, 3)}</div>
        {/* 240: « EN 2026, » — hard text swap on the 273 hit: « L'IA CODE. » */}
        <Slam at={240} until={273} y={760} from={1.5} bands={70} ghost={20} shake={10} grow={0.04}>
          <Big size={130}>EN</Big>
        </Slam>
        <Slam at={240} until={273} y={960} from={1.6} bands={110} ghost={28} shake={14} grow={0.05}>
          <Big size={300} glow="0 0 60px rgba(125,211,252,0.25)">2026,</Big>
        </Slam>
        <Slam at={273} y={830} from={1.6} bands={110} ghost={26} shake={14} grow={0.05}>
          <Big size={300} color={L.violet} glow="0 0 70px rgba(167,139,250,0.5)">L'IA</Big>
        </Slam>
        <Slam at={275} y={1060} from={1.4} bands={70} ghost={20} shake={10} grow={0.05}>
          <Big size={200}>CODE.</Big>
        </Slam>
      </Seg>

      {/* ---------- 305-370  m05: embauches de jeunes développeurs -42 ---------- */}
      <Seg a={305} b={370} name="m05 jeunes devs">
        <AbsoluteFill style={{ transform: `scale(${lin(g, 305, 370, 1.02, 1.1, EASE_IN_OUT) * (1 + 0.03 * (g >= 338 ? beatPulse(g, 14) : 0))})`, transformOrigin: "50% 45%" }}>
          <Slices on={g >= 338 && g < 340} seed={g} amount={50}>
            <Shot clip="m05" speed={(lf) => Math.min(1.85 + lf / 60, 2.42)} grade="screen" />
          </Slices>
        </AbsoluteFill>
        {g >= 338 ? <AbsoluteFill style={{ background: L.blood, mixBlendMode: "multiply", opacity: 0.18 + 0.3 * Math.exp(-(g - 338) / 5) }} /> : null}
        <Darkness creep={0.35} />
      </Seg>

      {/* ---------- 370-403  his face, L40 pre-roll + « j'ai analysé » ---------- */}
      <Seg a={370} b={403} name="L40 face (card-zones lip-sync)">
        <AbsoluteFill style={{ transform: `scale(${lin(g, 370, 403, 1.1, 1.17, EASE_OUT)})`, transformOrigin: "50% 34%" }}>
          <Shot clip="card-zones" speed={czMap(370)} grade="cold" focus="50% 30%" filter="brightness(0.9) contrast(1.18) saturate(0.75)" />
        </AbsoluteFill>
        <AbsoluteFill style={{ background: "rgba(20,60,110,0.24)", mixBlendMode: "color" }} />
        <Darkness creep={0.6} spot={0.6} x={50} y={34} key={0.55} />
        <div style={{ position: "absolute", left: 90, top: 236, ...monoType(24, L.cyan, 0.4) }}>{decode("// ANALYSE EN COURS", g, 372, 1, 4)}</div>
        <div style={{ position: "absolute", right: 90, top: 236, ...monoType(24, L.steel3, 0.4) }}>{decode("IT · 2026", g, 376, 1, 4)}</div>
      </Seg>

      {/* ---------- 403-436  e01 radar, « +40 » on « 40 » ---------- */}
      <Seg a={403} b={436} name="e01 radar">
        <Episode clip="e01" at={1.25} g0={403} dim={lin(g, 425, 430, 1, 0.34)} scale={lin(g, 403, 436, 1.0, 1.04)} />
      </Seg>
      {/* ---------- 436-468  e02 scanned grid ---------- */}
      <Seg a={436} b={468} name="e02 grid">
        <Episode clip="e02" at={1.5} g0={436} dim={0.36} scale={lin(g, 436, 468, 1.06, 1.1)} />
      </Seg>
      {/* +40 MÉTIERS DANS L'IT — crosses the 436 cut, holds to 468 */}
      {g >= 428 && g < 468 ? (
        <>
          <Scrim y={860} w={80} h={21} a={0.8} />
          <Flare at={428} x={0.5} y={700 / 1920} col={[125, 211, 252]} dur={34} strength={0.7} size={170} ghosts={false} />
          <Slam at={428} y={700} from={1.5} bands={80} ghost={24} shake={12} grow={0.06} echo={L.cyan}>
            <Big size={330} glow="0 0 40px rgba(125,211,252,0.55), 0 0 120px rgba(125,211,252,0.3)" style={{ fontVariantNumeric: "tabular-nums" }}>
              +{Math.round(lin(g, 428, 432, 31, 40, EASE_OUT))}
            </Big>
          </Slam>
          <Slam at={436} y={905} from={1.35} bands={60} ghost={18} shake={8} grow={0.05}>
            <Big size={128}>MÉTIERS</Big>
          </Slam>
          {g >= 442 ? <div style={{ position: "absolute", left: 0, right: 0, top: 982, textAlign: "center", ...monoType(34, L.steel, 0.42) }}>{decode("DANS L'IT", g, 442, 0.6, 3)}</div> : null}
        </>
      ) : null}

      {/* ---------- 468-501  e04 ZONE ROUGE ---------- */}
      <Seg a={468} b={501} name="e04 zone rouge">
        <Episode clip="e04" at={0.55} g0={468} scale={lin(g, 468, 501, 1.08, 1.02, EASE_OUT)} />
        <AbsoluteFill style={{ background: L.blood, mixBlendMode: "screen", opacity: 0.22 * Math.exp(-(g - 468) / 4) }} />
      </Seg>

      {/* ---------- 501-533  « L'IA RECRUTE. » ---------- */}
      <Seg a={501} b={533} name="card L'IA RECRUTE">
        <CardBg tint="rgba(167,139,250,0.12)" glow={0.6 + 0.4 * bp} />
        <GridFloor y0={1300} color={L.violet} opacity={0.2 + 0.12 * bp} speed={0.02} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 590, textAlign: "center", ...monoType(26, L.steel3) }}>{decode("TRI DES CV · ENTRETIENS", g, 502, 0.5, 3)}</div>
        <Slam at={501} y={830} from={1.6} bands={110} ghost={26} shake={14} grow={0.05}>
          <Big size={300} color={L.violet} glow="0 0 70px rgba(167,139,250,0.5)">L'IA</Big>
        </Slam>
        <Slam at={503} y={1060} from={1.4} bands={70} ghost={20} shake={10} grow={0.05}>
          <Big size={172}>RECRUTE.</Big>
        </Slam>
      </Seg>

      {/* ---------- 533-566  m01: 61 % des cadres ---------- */}
      <Seg a={533} b={549} name="m01 wide">
        <Shot clip="m01" at={1.02} grade="screen" scale={lin(g, 533, 549, 1.0, 1.04)} />
        <Darkness creep={0.3} />
      </Seg>
      <Seg a={549} b={566} name="m01 punch">
        <AbsoluteFill style={{ transform: `scale(${lin(g, 549, 566, 1.2, 1.26)})`, transformOrigin: "50% 41%" }}>
          <Shot clip="m01" at={1.29} grade="screen" />
        </AbsoluteFill>
        <Darkness creep={0.45} />
      </Seg>

      {/* ---------- 566-598  « …ET TOI ? » ---------- */}
      <Seg a={566} b={598} name="card ET TOI">
        <CardBg tint="rgba(255,46,77,0.10)" glow={0.6 + 0.4 * bp} />
        <GridFloor y0={1300} color={L.blood} opacity={0.18 + 0.14 * bp} speed={0.03} kick={g >= 580 ? 0.5 : 0} />
        <AbsoluteFill style={{ transform: `scale(${g >= 580 ? 1.1 + 0.05 * Math.exp(-(g - 580) / 3) : 1})` }}>
          <Slam at={566} y={830} from={1.5} bands={80} ghost={22} shake={12} grow={0.04}>
            <Big size={200}>…ET</Big>
          </Slam>
          <Slam at={566} y={1040} from={1.6} bands={110} ghost={28} shake={14} grow={0.05} echo={L.blood}>
            <Big size={280} color={L.blood} glow="0 0 50px rgba(255,46,77,0.5), 0 0 130px rgba(255,46,77,0.3)">
              TOI ?
            </Big>
          </Slam>
        </AbsoluteFill>
        {g === 580 ? <Flash opacity={0.14} /> : null}
      </Seg>

      {/* ---------- 598-614  strobe burst on the snare roll ---------- */}
      <Seg a={598} b={601} name="strobe e04">
        <Slices on={g === 598} seed={g} amount={70}>
          <Shot clip="e04" at={1.0} speed={0} grade="mono" scale={1.12} />
        </Slices>
        <AbsoluteFill style={{ background: L.blood, mixBlendMode: "multiply", opacity: 0.45 }} />
        {g === 598 ? <Flash opacity={0.55} /> : null}
      </Seg>
      <Seg a={601} b={605} name="strobe m05">
        <Shot clip="m05" at={2.42} speed={0} grade="screen" scale={1.18} />
      </Seg>
      <Seg a={605} b={609} name="strobe e02">
        <Slices on={g === 605} seed={g} amount={60}>
          <Shot clip="e02" at={1.8} speed={0} grade="mono" scale={1.25} focus="50% 30%" />
        </Slices>
      </Seg>
      <Seg a={609} b={614} name="strobe m01">
        <AbsoluteFill style={{ transform: "scale(1.22)", transformOrigin: "50% 41%" }}>
          <Shot clip="m01" at={1.45} speed={0} grade="screen" />
        </AbsoluteFill>
        {g === 612 ? <Flash color="#000" /> : null}
      </Seg>
    </AbsoluteFill>
  );
};
