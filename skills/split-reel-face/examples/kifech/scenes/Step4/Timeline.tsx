import type React from "react";
import { random, spring } from "remotion";
import { Wave } from "../../edit/kit";
import { glass, K, MONO, UI } from "../../edit/theme";
import { Bolt, Check, cl, ease, EASE_IO, lin, Lens, mix, tc } from "./shared";

/**
 * A clean vector rebuild of a Remotion-like editor timeline for THIS reel (real data: 1080×1920 · 30 fps · 1:55,
 * the real scene blocks of EDIT-PLAN.md, the SFX hits of the beat sheet, the music bed from « كلّو بـ Claude » 0:06).
 * Window coordinates: 880×402, title bar 46, top row 56–96, ruler 104–126, 4 lanes of 56 px from y 132.
 */
export const TL_W = 880;
export const TL_H = 402;
const DUR = 115.03;

const BLOCKS: [string, number, number][] = [
  ["hook", 0, 9.62],
  ["1", 9.62, 19.86],
  ["2", 19.86, 39.08],
  ["3", 39.08, 55.28],
  ["4", 55.28, 67.0],
  ["agents", 67.0, 72.6],
  ["4", 72.6, 86.52],
  ["5", 86.52, 98.0],
  ["", 98.0, 100.44],
  ["", 100.44, 103.26],
  ["bonus", 103.26, 113.42],
  ["", 113.42, 115.03],
];
/** SFX hits of the beat sheet (seconds). */
const SFX_T = [
  0.0, 0.7, 1.34, 3.04, 3.84, 4.38, 5.92, 7.45, 8.4, 9.14, 9.62, 11.75, 12.31, 12.96, 14.68, 15.33, 15.84, 16.63, 18.11, 18.86, 19.37, 21.98, 23.33,
  30.4, 31.59, 34.19, 34.91, 35.56, 41.16, 44.2, 45.3, 46.37, 49.26, 54.61, 56.71, 58.55, 59.95, 61.49, 62.13, 63.22, 64.23, 67.2, 71.91, 75.06,
  77.78, 82.94, 83.43, 84.59, 85.31, 87.69, 89.27, 91.91, 92.86, 96.28, 98.5, 100.13, 105.46, 107.63, 111.73, 112.75, 114.43,
];
const SFX_LABELS: [number, string][] = [
  [12.96, "pop"],
  [35.56, "ding"],
  [67.2, "riser"],
  [98.5, "tick"],
];
export const SKILLS = ["reel-pro-edit", "cinematic-motion-teaser", "remotion-best-practices"];
const LANES = ["VOIX", "MOTION", "SFX", "MUSIQUE"];
/** skill chip width at font 28 (mono ≈ 0.602 em) and its docked scale */
const chipW = (s: string) => s.length * 16.86 + 78;
const DOCK_S = 0.5;
const LANE_Y = (i: number) => 132 + i * 64;
const LANE_H = 56;

export type TLProps = {
  frame: number;
  title: React.ReactNode;
  /** frames when each lane slides in */
  voiceAt: number;
  motionAt: number;
  sfxAt: number;
  musicAt: number;
  /** playhead position (seconds of the reel) */
  playT: number;
  skillsAt?: number;
  skillsDock?: number;
  sweepFrom?: number;
  sweepTo?: number;
  /** 0→1: the Studio player panel opens on the left (part B) */
  playerP?: number;
  /** 0→1: lanes swap for the review panel (part B) */
  reviewP?: number;
  /** replaces the timecode in the top row */
  status?: React.ReactNode;
  topRight?: React.ReactNode;
  /** frame of a light sheen sweeping across the glass (entrance) */
  sheenAt?: number;
  player?: React.ReactNode;
  review?: React.ReactNode;
  style?: React.CSSProperties;
};

const MusicEnvelope: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const n = Math.max(8, Math.floor(w / 6));
  const pts: string[] = [];
  const amp = (i: number) => 0.32 + 0.22 * Math.sin(i * 0.19) + 0.14 * Math.sin(i * 0.071 + 1.3) + 0.1 * random(`env${i}`);
  for (let i = 0; i <= n; i++) pts.push(`${(i / n) * w},${h / 2 - amp(i) * (h / 2)}`);
  for (let i = n; i >= 0; i--) pts.push(`${(i / n) * w},${h / 2 + amp(i) * (h / 2)}`);
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
      <polygon points={pts.join(" ")} fill="rgba(240,164,135,0.42)" />
    </svg>
  );
};

export const Timeline: React.FC<TLProps> = (p) => {
  const { frame } = p;
  const pp = p.playerP ?? 0;
  const rp = p.reviewP ?? 0;
  const labelX = mix(18, 206, pp);
  const trackX0 = mix(132, 300, pp);
  const trackX1 = 864;
  const trackW = trackX1 - trackX0;
  const tx = (s: number) => trackX0 + (s / DUR) * trackW;
  const laneAt = [p.voiceAt, p.motionAt, p.sfxAt, p.musicAt];

  // search sweep
  const sweepOn = p.sweepFrom !== undefined && p.sweepTo !== undefined && frame >= p.sweepFrom - 2;
  const sp = sweepOn ? EASE_IO(lin(frame, p.sweepFrom!, p.sweepTo!)) : 0;
  const beamX = trackX0 + sp * trackW;
  const sweepDone = sweepOn && frame >= p.sweepTo!;

  // skills
  const skillPop = (i: number) => (p.skillsAt === undefined ? 0 : spring({ frame: frame - (p.skillsAt + i * 4), fps: 30, config: { damping: 12, stiffness: 200, mass: 0.6 } }));
  const skillDock = (i: number) => (p.skillsDock === undefined ? 0 : EASE_IO((frame - (p.skillsDock + i * 2)) / 10));
  const scrim = p.skillsAt === undefined ? 0 : cl(skillPop(0)) * (1 - skillDock(0));

  const playX = tx(Math.min(DUR, Math.max(0, p.playT)));

  return (
    <div style={{ position: "absolute", width: TL_W, height: TL_H, ...p.style }}>
      <div style={{ ...glass(), position: "absolute", inset: 0, borderRadius: 26, overflow: "hidden", padding: 0 }}>
        {/* title bar */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 46, display: "flex", alignItems: "center", gap: 9, padding: "0 18px", borderBottom: `1px solid ${K.stroke}`, background: "rgba(255,236,220,0.04)" }}>
          {["#FF6159", "#FFBD2E", "#28C941"].map((c) => (
            <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c, opacity: 0.85 }} />
          ))}
          <div style={{ flex: 1, textAlign: "center", fontFamily: MONO, fontWeight: 500, fontSize: 18, color: K.muted, marginRight: 60, whiteSpace: "nowrap" }}>{p.title}</div>
        </div>

        {/* top row: timecode / status (left) */}
        <div style={{ position: "absolute", left: labelX, top: 56, height: 40, display: "flex", alignItems: "center", gap: 10 }}>
          {p.status ?? (
            <>
              <svg width={18} height={18} viewBox="0 0 24 24">
                <path d="M7 4 L20 12 L7 20 Z" fill={K.coral} />
              </svg>
              <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 22, color: K.cream }}>{tc(p.playT)}</span>
              <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 18, color: K.dim, opacity: 1 - skillDock(0) }}>/ 01:55.00</span>
            </>
          )}
        </div>
        {p.topRight ? <div style={{ position: "absolute", right: 16, top: 56, height: 40, display: "flex", alignItems: "center", gap: 10 }}>{p.topRight}</div> : null}

        {/* ruler + lanes (fade out for the review panel) */}
        <div style={{ position: "absolute", inset: 0, opacity: 1 - rp, transform: `translateY(${rp * 16}px)`, filter: rp > 0 ? `blur(${rp * 6}px)` : undefined }}>
          {/* ruler */}
          {Array.from({ length: 24 }, (_, i) => i * 5).map((s) => (
            <div key={s} style={{ position: "absolute", left: tx(s), top: s % 30 === 0 ? 106 : 116, width: 1.5, height: s % 30 === 0 ? 20 : 10, background: s % 30 === 0 ? "rgba(255,236,220,0.45)" : "rgba(255,236,220,0.2)" }} />
          ))}
          {[0, 30, 60, 90].map((s) => (
            <div key={s} style={{ position: "absolute", left: tx(s) + 6, top: 104, fontFamily: MONO, fontSize: 14, color: K.dim }}>
              {`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`}
            </div>
          ))}

          {/* lanes */}
          {LANES.map((name, i) => {
            const lp = ease(frame, laneAt[i], 9);
            if (lp <= 0) return null;
            const y = LANE_Y(i);
            return (
              <div key={name} style={{ position: "absolute", left: 0, top: y, width: TL_W, height: LANE_H, opacity: lp, transform: `translateX(${(1 - lp) * -50}px)` }}>
                <div style={{ position: "absolute", left: labelX, top: 0, height: LANE_H, display: "flex", alignItems: "center", gap: 8, fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: "0.12em", color: K.muted }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: K.coral, opacity: 0.4 + 0.6 * (i === 0 ? 1 : i === 3 ? 0.7 : 0.85) }} />
                  {name}
                </div>
                <div style={{ position: "absolute", left: trackX0 - 6, top: 0, width: trackW + 12, height: LANE_H, borderRadius: 12, background: "rgba(255,236,220,0.035)", border: "1px solid rgba(255,236,220,0.07)" }} />
              </div>
            );
          })}

          {/* VOIX: waveform wipes in */}
          {ease(frame, p.voiceAt, 9) > 0 ? (
            <div
              style={{
                position: "absolute",
                left: trackX0,
                top: LANE_Y(0) + 8,
                width: trackW,
                height: LANE_H - 16,
                clipPath: `inset(0 ${(1 - ease(frame, p.voiceAt, 16)) * 100}% 0 0)`,
                opacity: ease(frame, p.voiceAt, 9),
              }}
            >
              <Wave w={trackW} h={LANE_H - 16} bars={Math.round(trackW / 7)} seed="s4voice" />
            </div>
          ) : null}

          {/* MOTION: the real scene blocks pop in one by one */}
          {BLOCKS.map(([label, a, b], i) => {
            const bp = ease(frame, p.motionAt + i * 2, 7);
            if (bp <= 0) return null;
            const hot = label === "4";
            const x0 = tx(a) + 1.5;
            const w = tx(b) - tx(a) - 3;
            const shimmer = 0.5 + 0.5 * Math.sin(frame / 7 - i * 0.8);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x0,
                  top: LANE_Y(1) + 7,
                  width: w,
                  height: LANE_H - 14,
                  borderRadius: 8,
                  background: hot ? `linear-gradient(180deg, ${K.coralLight}, ${K.coral})` : `rgba(217,119,87,${0.2 + 0.08 * shimmer})`,
                  border: `1px solid ${hot ? "rgba(255,220,200,0.7)" : "rgba(217,119,87,0.5)"}`,
                  boxShadow: hot ? `0 0 18px ${K.coralGlow}` : undefined,
                  opacity: bp,
                  transform: `scaleY(${0.4 + 0.6 * bp})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  fontFamily: MONO,
                  fontWeight: 700,
                  fontSize: 14,
                  color: hot ? "#1A0F0B" : K.cream,
                }}
              >
                {w > label.length * 9 + 8 ? label : ""}
              </div>
            );
          })}

          {/* SFX: diamonds at the beat-sheet hits */}
          {ease(frame, p.sfxAt, 9) > 0
            ? SFX_T.map((s, i) => {
                const mp = ease(frame, p.sfxAt + 2 + i * 0.3, 5);
                const x = tx(s);
                const found = sweepOn && beamX >= x;
                const near = sweepOn && Math.abs(beamX - x) < 24 && !sweepDone;
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: x - 5.5,
                      top: LANE_Y(2) + 30,
                      width: 11,
                      height: 11,
                      borderRadius: 2.5,
                      background: found ? K.coralLight : "rgba(245,238,228,0.72)",
                      boxShadow: near ? `0 0 14px ${K.coralLight}` : found ? `0 0 8px ${K.coralGlow}` : undefined,
                      opacity: mp,
                      transform: `rotate(45deg) scale(${(0.3 + 0.7 * mp) * (near ? 1.5 : 1)})`,
                    }}
                  />
                );
              })
            : null}
          {ease(frame, p.sfxAt, 9) > 0
            ? SFX_LABELS.map(([s, l], i) => (
                <div key={l} style={{ position: "absolute", left: tx(s) + 2, top: LANE_Y(2) + 5, fontFamily: MONO, fontSize: 13, fontWeight: 500, color: sweepOn && beamX >= tx(s) ? K.coralLight : K.dim, opacity: ease(frame, p.sfxAt + 6 + i * 2, 6) }}>
                  {l}
                </div>
              ))
            : null}

          {/* MUSIQUE: one long bed from 0:03 (« والصوت », the user's pick: Young Trizzy 02) */}
          {ease(frame, p.musicAt, 9) > 0 ? (
            <div
              style={{
                position: "absolute",
                left: tx(3.0),
                top: LANE_Y(3) + 7,
                width: tx(DUR) - tx(3.0),
                height: LANE_H - 14,
                borderRadius: 8,
                overflow: "hidden",
                background: "linear-gradient(90deg, rgba(180,85,58,0.55), rgba(217,119,87,0.35))",
                border: `1px solid ${sweepOn && sp > 0.03 ? "rgba(255,220,200,0.8)" : "rgba(217,119,87,0.55)"}`,
                boxShadow: sweepOn && sp > 0.03 ? `0 0 16px ${K.coralGlow}` : undefined,
                clipPath: `inset(0 ${(1 - ease(frame, p.musicAt, 16)) * 100}% 0 0)`,
              }}
            >
              <MusicEnvelope w={tx(DUR) - tx(3.0)} h={LANE_H - 14} />
              <div style={{ position: "absolute", left: 10, top: 0, height: LANE_H - 14, display: "flex", alignItems: "center", fontFamily: MONO, fontWeight: 700, fontSize: 14, color: K.cream }}>♪ Young Trizzy 02</div>
            </div>
          ) : null}

          {/* playhead */}
          <div style={{ position: "absolute", left: playX - 1, top: 104, width: 2, height: LANE_Y(3) + LANE_H - 104, background: K.coral, boxShadow: `0 0 10px ${K.coralGlow}` }} />
          <div style={{ position: "absolute", left: playX - 8, top: 100, width: 16, height: 14, borderRadius: "4px 4px 8px 8px", background: K.coral }} />

          {/* search sweep */}
          {sweepOn ? (
            <div style={{ position: "absolute", inset: 0, opacity: 1 - lin(frame, p.sweepTo! + 2, p.sweepTo! + 10) * 0.6 }}>
              <div style={{ position: "absolute", left: beamX - 70, top: LANE_Y(0) - 4, width: 70, height: LANE_Y(3) + LANE_H - LANE_Y(0) + 8, background: "linear-gradient(90deg, transparent, rgba(240,164,135,0.28))", opacity: sweepDone ? 0 : 1 }} />
              <div style={{ position: "absolute", left: beamX - 1.5, top: LANE_Y(0) - 4, width: 3, height: LANE_Y(3) + LANE_H - LANE_Y(0) + 8, background: K.coralLight, boxShadow: `0 0 16px ${K.coralLight}`, opacity: sweepDone ? 0 : 1 }} />
              <div
                style={{
                  position: "absolute",
                  left: beamX,
                  top: 98,
                  transform: `translateX(calc(${-sp * 100}% + ${mix(10, -10, sp)}px))`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 12px",
                  borderRadius: 999,
                  background: "rgba(15,11,9,0.92)",
                  border: `1.5px solid ${sweepDone ? K.ok : K.coral}`,
                  fontFamily: MONO,
                  fontWeight: 700,
                  fontSize: 16,
                  color: K.cream,
                  whiteSpace: "nowrap",
                }}
              >
                {sweepDone ? <Check size={18} /> : <Lens size={17} color={K.coralLight} />}
                {sweepDone ? "25 SFX · 1 musique" : `SFX ${String(Math.round(sp * 25)).padStart(2, "0")}`}
              </div>
            </div>
          ) : null}
        </div>

        {/* player panel (part B) */}
        {p.player && pp > 0 ? <div style={{ position: "absolute", left: 18, top: 56, opacity: pp, transform: `translateX(${(1 - pp) * -40}px)` }}>{p.player}</div> : null}
        {/* review panel (part B) */}
        {p.review && rp > 0 ? (
          <div style={{ position: "absolute", left: 206, top: 100, width: 658, height: 288, opacity: rp, transform: `translateY(${(1 - rp) * 14}px)`, filter: rp < 1 ? `blur(${(1 - rp) * 6}px)` : undefined }}>{p.review}</div>
        ) : null}

        {/* skills: pop big over a scrim, then dock into the top row */}
        {p.skillsAt !== undefined && frame >= p.skillsAt - 1 ? (
          <>
            <div style={{ position: "absolute", left: 0, right: 0, top: 46, bottom: 0, background: "rgba(15,11,9,0.72)", opacity: scrim }} />
            {SKILLS.map((s, i) => {
              const pop = skillPop(i);
              const d = skillDock(i);
              const big = [
                { x: 306, y: 190 },
                { x: 440, y: 256 },
                { x: 566, y: 322 },
              ][i];
              const ws = chipW(s);
              const dockScale = DOCK_S;
              const widths = SKILLS.map((k) => chipW(k) * dockScale);
              let right = 864;
              for (let k = SKILLS.length - 1; k > i; k--) right -= widths[k] + 10;
              const dock = { x: right - widths[i] / 2, y: 76 };
              const cx = mix(big.x, dock.x, d);
              const cy = mix(big.y, dock.y, d);
              const sc = mix(1, dockScale, d) * (0.6 + 0.4 * Math.min(1.08, pop));
              if (pop <= 0.01) return null;
              return (
                <div
                  key={s}
                  style={{
                    position: "absolute",
                    left: cx - ws / 2,
                    top: cy - 28,
                    width: ws,
                    height: 56,
                    transform: `scale(${sc})`,
                    opacity: cl(pop * 1.4),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    borderRadius: 999,
                    background: d > 0.5 ? "rgba(217,119,87,0.16)" : `linear-gradient(180deg, rgba(240,164,135,0.24), rgba(217,119,87,0.14)), rgba(20,14,11,0.95)`,
                    border: `1.5px solid ${d > 0.5 ? "rgba(217,119,87,0.55)" : "rgba(240,164,135,0.85)"}`,
                    boxShadow: d > 0.5 ? undefined : `0 12px 34px rgba(0,0,0,0.55), 0 0 30px ${K.coralGlow}`,
                    fontFamily: MONO,
                    fontWeight: 700,
                    fontSize: 28,
                    color: K.cream,
                    whiteSpace: "nowrap",
                  }}
                >
                  <Bolt size={26} />
                  {s}
                </div>
              );
            })}
            {/* a tiny « skills » label in front of the docked chips */}
            <div
              style={{
                position: "absolute",
                left: 864 - (SKILLS.reduce((a, k) => a + chipW(k) * DOCK_S + 10, 0) - 10) - 10,
                top: 56,
                height: 40,
                display: "flex",
                alignItems: "center",
                fontFamily: UI,
                fontWeight: 600,
                fontSize: 15,
                color: K.dim,
                opacity: skillDock(2),
                transform: "translateX(-100%)",
              }}
            >
              skills
            </div>
          </>
        ) : null}

        {/* entrance sheen */}
        {p.sheenAt !== undefined && frame >= p.sheenAt && frame < p.sheenAt + 22 ? (
          <div
            style={{
              position: "absolute",
              top: -40,
              bottom: -40,
              width: 220,
              left: mix(-260, TL_W + 40, EASE_IO(lin(frame, p.sheenAt, p.sheenAt + 20))),
              background: "linear-gradient(100deg, transparent, rgba(255,236,220,0.13) 45%, rgba(255,236,220,0.2) 50%, rgba(255,236,220,0.13) 55%, transparent)",
              transform: "skewX(-16deg)",
            }}
          />
        ) : null}
      </div>
    </div>
  );
};
