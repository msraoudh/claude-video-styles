import type React from "react";
import { K, SERIF } from "../../edit/theme";

/** Generic vector glyphs for the tool cards (no real logos), all on a 40×40 grid. */
type P = { size?: number; color?: string; style?: React.CSSProperties };

const Svg: React.FC<{ size: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ size, style, children }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: "block", overflow: "visible", ...style }}>
    {children}
  </svg>
);

/** Remotion → a play button (programmatic video). */
export const IcPlay: React.FC<P> = ({ size = 40, color = K.coral, style }) => (
  <Svg size={size} style={style}>
    <rect x={4} y={4} width={32} height={32} rx={10} fill="none" stroke={color} strokeWidth={3} />
    <path d="M16 12.5 L28.5 20 L16 27.5 Z" fill={color} strokeLinejoin="round" stroke={color} strokeWidth={1.5} />
  </Svg>
);

/** ffmpeg → a film strip (frame by frame). */
export const IcFilm: React.FC<P> = ({ size = 40, color = K.coral, style }) => (
  <Svg size={size} style={style}>
    <rect x={4} y={7} width={32} height={26} rx={4.5} fill="none" stroke={color} strokeWidth={3} />
    {[0, 1, 2, 3].map((i) => (
      <rect key={`t${i}`} x={8.6 + i * 6.6} y={10.4} width={3.4} height={3.4} rx={1} fill={color} />
    ))}
    {[0, 1, 2, 3].map((i) => (
      <rect key={`b${i}`} x={8.6 + i * 6.6} y={26.2} width={3.4} height={3.4} rx={1} fill={color} />
    ))}
    <rect x={9} y={16.4} width={10} height={7.2} rx={1.5} fill={color} opacity={0.85} />
    <rect x={21} y={16.4} width={10} height={7.2} rx={1.5} fill={color} opacity={0.45} />
  </Svg>
);

/** Whisper → a waveform. */
export const IcWave: React.FC<P> = ({ size = 40, color = K.coral, style }) => (
  <Svg size={size} style={style}>
    {[8, 16, 26, 14, 22, 11, 6].map((h, i) => (
      <rect key={i} x={5.2 + i * 4.6} y={20 - h / 2} width={3} height={h} rx={1.5} fill={color} />
    ))}
  </Svg>
);

/** Fonts → « Aa » in the editorial serif. */
export const IcFont: React.FC<P> = ({ size = 40, color = K.coral, style }) => (
  <Svg size={size} style={style}>
    <text x={20} y={29} textAnchor="middle" fontFamily={SERIF} fontSize={27} fill={color}>
      Aa
    </text>
    <rect x={7} y={33} width={26} height={2.4} rx={1.2} fill={color} opacity={0.5} />
  </Svg>
);

/** SFX pack → a speaker with waves. */
export const IcSpeaker: React.FC<P> = ({ size = 40, color = K.coral, style }) => (
  <Svg size={size} style={style}>
    <path d="M6 15.5 H12.5 L21 8.5 V31.5 L12.5 24.5 H6 Z" fill={color} strokeLinejoin="round" stroke={color} strokeWidth={1.5} />
    <path d="M26 14.5 Q30 20 26 25.5" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
    <path d="M30 10 Q37.5 20 30 30" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
  </Svg>
);

/** three.js → an isometric wireframe cube. */
export const IcCube: React.FC<P> = ({ size = 40, color = K.coral, style }) => (
  <Svg size={size} style={style}>
    <path d="M20 5 L33 12.5 V27.5 L20 35 L7 27.5 V12.5 Z" fill="none" stroke={color} strokeWidth={2.8} strokeLinejoin="round" />
    <path d="M7 12.5 L20 20 L33 12.5 M20 20 V35" fill="none" stroke={color} strokeWidth={2.8} strokeLinejoin="round" />
    <path d="M20 5 V20 M7 27.5 L20 20 M33 27.5 L20 20" fill="none" stroke={color} strokeWidth={1.4} strokeDasharray="2 2.4" opacity={0.55} />
  </Svg>
);

/** 🎬 clapperboard (vector, so it matches the coral look). */
export const IcClapper: React.FC<P> = ({ size = 40, color = K.coral, style }) => (
  <Svg size={size} style={style}>
    <rect x={5} y={17} width={30} height={18} rx={3.2} fill={color} />
    {[0, 1, 2].map((i) => (
      <path key={`b${i}`} d={`M${9.5 + i * 8.5} 17 h4.4 l-3.4 5.4 h-4.4 Z`} fill="#1A0F0B" opacity={0.8} />
    ))}
    <g transform="rotate(-14 5 16)">
      <rect x={5} y={9.6} width={30} height={6} rx={1.6} fill={color} />
      {[0, 1, 2].map((i) => (
        <path key={`t${i}`} d={`M${9.5 + i * 8.5} 9.6 h4.4 l-3.4 6 h-4.4 Z`} fill="#1A0F0B" opacity={0.8} />
      ))}
    </g>
    <circle cx={5.6} cy={16.4} r={1.8} fill={color} />
  </Svg>
);

/** Idea bulb. */
export const IcBulb: React.FC<P> = ({ size = 40, color = K.coral, style }) => (
  <Svg size={size} style={style}>
    <path d="M20 5 C12.5 5 8.5 10.5 8.5 16 C8.5 20.5 11.5 23 13.5 25.5 C14.6 26.9 15 28 15 29.5 H25 C25 28 25.4 26.9 26.5 25.5 C28.5 23 31.5 20.5 31.5 16 C31.5 10.5 27.5 5 20 5 Z" fill={color} opacity={0.9} />
    <rect x={15} y={31} width={10} height={2.8} rx={1.4} fill={color} />
    <rect x={16.5} y={35} width={7} height={2.6} rx={1.3} fill={color} opacity={0.7} />
    <path d="M16 15 Q20 11 24 15" fill="none" stroke="#1A0F0B" strokeWidth={2} strokeLinecap="round" opacity={0.55} />
  </Svg>
);

/** Repeat / loop (🔁: two arrows chasing each other round a rounded loop). */
export const IcLoop: React.FC<P> = ({ size = 40, color = K.coral, style }) => (
  <Svg size={size} style={style}>
    <path d="M7 22 V18 A6.5 6.5 0 0 1 13.5 11.5 H30" fill="none" stroke={color} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M25.5 6.5 L31 11.5 L25.5 16.5" fill="none" stroke={color} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M33 18 V22 A6.5 6.5 0 0 1 26.5 28.5 H10" fill="none" stroke={color} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.5 23.5 L9 28.5 L14.5 33.5" fill="none" stroke={color} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** Check tick (stroke drawn by `draw` 0→1). */
export const IcCheck: React.FC<P & { draw?: number; width?: number }> = ({ size = 40, color = K.ok, style, draw = 1, width = 4 }) => (
  <Svg size={size} style={style}>
    <path d="M10 20.5 L17 27.5 L30.5 13" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={34} strokeDashoffset={34 * (1 - draw)} />
  </Svg>
);

/** ↔ swap. */
export const IcSwap: React.FC<P> = ({ size = 40, color = K.coral, style }) => (
  <Svg size={size} style={style}>
    <path d="M9 14.5 H31 M25.5 9 L31 14.5 L25.5 20" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M31 25.5 H9 M14.5 20 L9 25.5 L14.5 31" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.65} />
  </Svg>
);

/** Send arrow (up). */
export const IcSend: React.FC<P> = ({ size = 40, color = "#1A0F0B", style }) => (
  <Svg size={size} style={style}>
    <path d="M20 30 V11 M12 18.5 L20 10.5 L28 18.5" fill="none" stroke={color} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** Eyedropper (palette sampling). */
export const IcDropper: React.FC<P> = ({ size = 40, color = K.coral, style }) => (
  <Svg size={size} style={style}>
    <path d="M26 6.5 a5 5 0 0 1 7.5 7.5 l-4 4 l1.6 1.6 l-2.6 2.6 l-9.2 -9.2 l2.6 -2.6 l1.6 1.6 Z" fill={color} />
    <path d="M19 15 L8.5 25.5 L7 32 L8 33 L14.5 31.5 L25 21" fill="none" stroke={color} strokeWidth={2.8} strokeLinejoin="round" />
  </Svg>
);
