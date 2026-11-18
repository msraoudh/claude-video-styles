import type React from "react";
import { K } from "../../edit/theme";

/** Small vector icons for the Bonus scene (no emoji: they render inconsistently and break the editorial look). */

export const FileIcon: React.FC<{ size?: number; color?: string }> = ({ size = 26, color = K.coral }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 20 24" style={{ flexShrink: 0 }}>
    <path d="M3.5 1.2h8.8l5.4 5.4v15a1.2 1.2 0 0 1-1.2 1.2H3.5a1.2 1.2 0 0 1-1.2-1.2V2.4a1.2 1.2 0 0 1 1.2-1.2z" fill="rgba(217,119,87,0.14)" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    <path d="M12.2 1.2v5.5h5.5" fill="none" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    <path d="M6 12h8M6 15.5h8M6 19h5" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.75} />
  </svg>
);

/** Clapperboard (« vidéo »). */
export const ClapIcon: React.FC<{ size?: number; color?: string }> = ({ size = 56, color = K.cream }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
    <rect x="5" y="18" width="38" height="24" rx="4" fill="rgba(255,236,220,0.08)" stroke={color} strokeWidth={2.6} />
    <path d="M5 18 L41 9.5 L43 16.5 Z" fill={K.coral} stroke={color} strokeWidth={2.4} strokeLinejoin="round" />
    <path d="M13 16.2 L17 11.5 M22.5 14 L26.5 9.3 M32 11.8 L36 7.1" stroke="#1A0F0B" strokeWidth={2.4} strokeLinecap="round" />
    <path d="M20 25.5 L30 30 L20 34.5 Z" fill={K.coral} />
  </svg>
);

/** Light bulb (« idée »). */
export const BulbIcon: React.FC<{ size?: number; glow?: number }> = ({ size = 56, glow = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0, filter: `drop-shadow(0 0 ${10 * glow}px ${K.coralGlow})` }}>
    {[0, 1, 2, 3, 4].map((i) => {
      const a = (-150 + i * 30) * (Math.PI / 180);
      return <path key={i} d={`M${24 + Math.cos(a) * 19} ${20 + Math.sin(a) * 19} L${24 + Math.cos(a) * 23} ${20 + Math.sin(a) * 23}`} stroke={K.coralLight} strokeWidth={2.4} strokeLinecap="round" opacity={0.4 + 0.6 * glow} />;
    })}
    <path d="M24 8 a12 12 0 0 1 7.2 21.6 c-1.4 1.1-2.2 2.6-2.2 4.2 V35 H19 v-1.2 c0-1.6-0.8-3.1-2.2-4.2 A12 12 0 0 1 24 8z" fill={K.coral} stroke={K.coralLight} strokeWidth={2} />
    <rect x="19" y="37" width="10" height="3.2" rx="1.6" fill={K.cream} />
    <rect x="20.5" y="41.5" width="7" height="3" rx="1.5" fill={K.cream} opacity={0.8} />
    <path d="M20 18 a5 5 0 0 1 5 -4" stroke="rgba(255,255,255,0.7)" strokeWidth={2} fill="none" strokeLinecap="round" />
  </svg>
);

/** Bolt (skill attachment chip). */
export const BoltIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = "#1A0F0B" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path d="M13.5 2 L4.5 13.5 H11 L9.8 22 L19.5 9.8 H13 Z" fill={color} strokeLinejoin="round" />
  </svg>
);

/** Send arrow (Claude input). */
export const SendIcon: React.FC<{ size?: number; color?: string }> = ({ size = 22, color = "#1A0F0B" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 19 V5 M5.5 11.5 L12 5 L18.5 11.5" stroke={color} strokeWidth={2.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Play triangle. */
export const PlayIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16">
    <path d="M4 2.5 L13 8 L4 13.5 Z" fill={K.cream} />
  </svg>
);
