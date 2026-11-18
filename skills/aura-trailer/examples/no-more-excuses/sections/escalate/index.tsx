import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { ramp } from "../../components/Shot";
import { L } from "../../lib/look";
import { Carousel } from "./Carousel";
import { EvidenceCard } from "./GlassCard";
import { S0 } from "./lib";
import { DipEnd, DipEscalator, DipPlusTard, DipTalk, FaceShot, Recap, TbsAdapte, TbsDomine, TbsMoveOn } from "./Scenes";

/**
 * ESCALATE — global frames 1804–2855 (the heaviest bass section of ACIDO III, then the dip that carries line C).
 * Every cut sits on an 808 onset (H), a beat (B) or a ghost 808 (G) from data/beats.ts.
 *
 *  1804 H  « ADAPTE-TOI. » behind him            1869 H f16   1901 H f22 (ramp)   1920 B f14 flash
 *  1934 H  « MOVE ON. » rows behind him          2000 H f18   2017 B f20   2024 G f06   2032 H f17 (ramp)
 *  2064 H  m02 escalator ↓ (glass card)          2097 H m03 « MONTE »   2130 H m04 « L'IA ne remplace pas les devs »
 *  2162 H  f09 (focus on the value)              2180 B f19
 *  2195 H  FOCUS / 2214 B ON THE / 2226 H VALUE. tile wall → 2260 BIG: shockwave flips the wall « DOMINE. »
 *  2292 H  « SES ÉPISODES » cuboid carousel, one episode per 808 (2325 … 2520); 3-frame face flash frames on 2409/2474/2540 (B)
 *  2553 H  final strobe: faces, ZONE ROUGE, slogan recaps on the 808s (2586 / 2618 / 2651 / 2683)
 *  2697 G  freeze → 2709 line C lip-synced, the light dies with the music (2748), 2785 B escalator cutaway,
 *  2808 H  « PLUS » 2809 « TARD. » 2816 behind him, 2845 dip hit → CRT-off to black.
 */
type Cut = { a: number; b: number; el: React.ReactNode };

const CUTS: Cut[] = [
  { a: 1804, b: 1869, el: <TbsAdapte /> },
  { a: 1869, b: 1901, el: <FaceShot id="f16" clip="f16" at={0.3} from={1869} /> },
  { a: 1901, b: 1920, el: <FaceShot id="f22" clip="f22" at={1.1} from={1901} speed={ramp(1.1, 7, 0.3, 1.8)} /> },
  { a: 1920, b: 1934, el: <FaceShot id="f14" clip="f14" at={0.6} from={1920} grade="mono" zoom={0.22} rgb={16} /> },
  { a: 1934, b: 2000, el: <TbsMoveOn from={1934} to={2000} /> },
  { a: 2000, b: 2017, el: <FaceShot id="f18" clip="f18" at={0.3} from={2000} /> },
  { a: 2017, b: 2024, el: <FaceShot id="f20" clip="f20" at={1.4} from={2017} grade="mono" rgb={18} slice={30} /> },
  { a: 2024, b: 2032, el: <FaceShot id="f06" clip="f06" at={1.4} from={2024} rgb={14} /> },
  { a: 2032, b: 2064, el: <FaceShot id="f17" clip="f17" at={0.4} from={2032} speed={ramp(0.4, 10, 0.3, 2.0)} /> },
  { a: 2064, b: 2097, el: <EvidenceCard clip="m02" at={0.9} from={2064} to={2097} accent={[255, 46, 77]} second={[125, 211, 252]} tiltFrom={1} /> },
  { a: 2097, b: 2130, el: <EvidenceCard clip="m03" at={0.8} from={2097} to={2130} accent={[52, 211, 153]} second={[182, 255, 59]} tiltFrom={-1} kicks={[2115]} /> },
  { a: 2130, b: 2162, el: <EvidenceCard clip="m04" at={1.2} from={2130} to={2162} accent={[167, 139, 250]} second={[125, 211, 252]} tiltFrom={1} /> },
  { a: 2162, b: 2180, el: <FaceShot id="f09" clip="f09" at={0.3} from={2162} /> },
  { a: 2180, b: 2195, el: <FaceShot id="f19" clip="f19" at={0.6} from={2180} grade="mono" rgb={14} slice={24} /> },
  { a: 2195, b: 2292, el: <TbsDomine /> },
  { a: 2292, b: 2553, el: <Carousel from={2292} /> },
  // 3-frame flash frames on the off-beats keep the strobe pulse alive under the carousel (it keeps running beneath)
  { a: 2409, b: 2412, el: <FaceShot id="fl1" clip="f02" at={1.2} from={2409} grade="mono" rgb={18} slice={30} zoom={0.1} flash={0.3} /> },
  { a: 2474, b: 2477, el: <FaceShot id="fl2" clip="f03" at={1.0} from={2474} grade="mono" rgb={18} slice={30} zoom={0.1} flash={0.3} /> },
  { a: 2540, b: 2543, el: <FaceShot id="fl3" clip="f10" at={1.0} from={2540} grade="mono" rgb={18} slice={30} zoom={0.1} flash={0.3} /> },
  { a: 2553, b: 2570, el: <FaceShot id="f05" clip="f05" at={0.6} from={2553} rgb={16} slice={26} /> },
  { a: 2570, b: 2576, el: <FaceShot id="e04" clip="e04" at={0.5} from={2570} grade="screen" zoom={0.06} rgb={14} base={1.0} /> },
  { a: 2576, b: 2586, el: <FaceShot id="f15" clip="f15" at={1.0} from={2576} grade="mono" /> },
  {
    a: 2586,
    b: 2599,
    el: (
      <Recap
        id="rc1"
        from={2586}
        at={35.3}
        s={0.86}
        hx={660}
        hy={980}
        words={[
          { text: "ADAPTE-", x: 52, y: 262, size: 222 },
          { text: "TOI.", x: 42, y: 448, size: 430 },
        ]}
      />
    ),
  },
  { a: 2599, b: 2618, el: <FaceShot id="f11" clip="f11" at={1.0} from={2599} rgb={12} /> },
  {
    a: 2618,
    b: 2630,
    el: (
      <Recap
        id="rc2"
        from={2618}
        at={24.2}
        s={0.8}
        hx={540}
        hy={990}
        words={[
          { text: "MOVE", x: 50, y: 250, size: 334 },
          { text: "ON.", x: 178, y: 520, size: 400 },
        ]}
      />
    ),
  },
  { a: 2630, b: 2651, el: <FaceShot id="f24" clip="f24" at={0.8} from={2630} rgb={12} slice={20} /> },
  {
    a: 2651,
    b: 2659,
    el: <Recap id="rc3" from={2651} at={40.0} s={0.8} hx={600} hy={990} words={[{ text: "FOCUS.", x: 48, y: 330, size: 270 }]} />,
  },
  { a: 2659, b: 2683, el: <FaceShot id="f25" clip="f25" at={0.6} from={2659} speed={ramp(0.6, 8, 0.25, 1.8)} grade="mono" rgb={14} /> },
  {
    a: 2683,
    b: 2697,
    el: (
      <Recap
        id="rc4"
        from={2683}
        at={40.0}
        s={0.7}
        hx={540}
        hy={1130}
        invert
        words={[
          { text: "DOMINE.", x: 50, y: 300, size: 236 },
          { text: "DOMINE.", x: 50, y: 510, size: 236, outline: true },
          { text: "DOMINE.", x: 50, y: 720, size: 236, outline: true },
        ]}
      />
    ),
  },
  { a: 2697, b: 2785, el: <DipTalk from={2697} /> },
  { a: 2785, b: 2808, el: <DipEscalator from={2785} /> },
  { a: 2808, b: 2845, el: <DipPlusTard from={2808} plus={2809} tard={2816} /> },
  { a: 2845, b: 2856, el: <DipEnd from={2845} /> },
];

export const Escalate: React.FC = () => (
  <AbsoluteFill style={{ background: L.ink }}>
    {CUTS.map((c) => (
      <Sequence key={c.a} from={c.a - S0} durationInFrames={c.b - c.a} name={`esc ${c.a}`}>
        {c.el}
      </Sequence>
    ))}
  </AbsoluteFill>
);
