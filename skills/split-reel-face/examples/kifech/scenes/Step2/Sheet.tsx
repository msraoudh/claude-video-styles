import type React from "react";
import { Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE } from "../../edit/kit";
import { glass, K, MONO, UI } from "../../edit/theme";
import { B, io, lerp, REFS, refSrc, T, tc } from "./shared";

/**
 * Beats 3–4 (982–1098): the downloaded reel.mp4 pops out of the terminal (real frames playing) → on « ffmpeg » it breaks
 * into the 5×4 contact sheet (one tile per frame) → on « frame by frame » the tiles fly into a filmstrip that steps one
 * frame at a time under a coral selection; each selected frame gets the tag Claude reads on it (AIS reference).
 */
const PANEL = { x: 660, y: 1046, w: 280, h: 386 };
const TW = 46;
const TH = (TW * 16) / 9;
const GAP = 5;
const GX = PANEL.x + (PANEL.w - (5 * TW + 4 * GAP)) / 2;
const GY = 1084;
const grid = (i: number) => ({ x: GX + (i % 5) * (TW + GAP), y: GY + Math.floor(i / 5) * (TH + GAP), w: TW, h: TH });
const REEL = { x: PANEL.x + (PANEL.w - 172) / 2, y: 1086, w: 172, h: (172 * 16) / 9 };

// filmstrip
const SW = 150;
const SH = (SW * 16) / 9; // 266.7
const PITCH = 164;
const SX0 = 224; // index 0 lands under the selection (slot 1)
const SY = 1094;
const NSTEPS = 8;
const stepAt = (k: number) => B.steps + 4 * k;
const offAt = (frame: number) => {
  let o = 0;
  for (let k = 0; k < NSTEPS; k++) o += EASE((frame - stepAt(k)) / 3);
  return o;
};
const selAt = (j: number) => (j === 0 ? T.frame + 7 : stepAt(j - 1) + 2);

const PLAY = [2, 6, 9, 13, 17, 20, 25, 30, 34, 39];

export const SheetPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = B.c3 + 4; // 982
  if (frame < start || frame > B.replyIn + 9) return null;

  const pIn = EASE((frame - start) / 8);
  const q = EASE((frame - (B.replyIn - 2)) / 8);
  const tilesOn = frame >= T.ffmpeg;
  const reelO = 1 - EASE((frame - (T.ffmpeg + 6)) / 10);
  const flyAll = EASE((frame - T.frame) / 8); // panel chrome fades as the tiles leave
  const off = offAt(frame);
  const sel = Math.round(off);
  const selPop = spring({ frame: frame - (T.frame + 5), fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
  const stripO = EASE((frame - (T.frame + 6)) / 5);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 1 - q,
        transform: `translateY(${-22 * q}px)`,
        filter: q > 0 ? `blur(${q * 7}px)` : undefined,
      }}
    >
      {/* file preview panel (reel.mp4 → sheet.jpg) */}
      {flyAll < 1 ? (
        <div
          style={{
            position: "absolute",
            left: PANEL.x,
            top: PANEL.y,
            width: PANEL.w,
            height: PANEL.h,
            ...glass(),
            borderRadius: 24,
            padding: 0,
            opacity: pIn * (1 - flyAll),
            transform: `translateX(${(1 - pIn) * -90}px) scale(${0.9 + 0.1 * pIn})`,
            filter: pIn < 1 ? `blur(${(1 - pIn) * 7}px)` : undefined,
          }}
        >
          <div style={{ position: "absolute", left: 16, right: 16, top: 9, display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 18, color: K.muted }}>
            <span style={{ color: K.cream }}>{tilesOn ? "sheet.jpg" : "reel.mp4"}</span>
            <span>{tilesOn ? "5×4" : "0:40"}</span>
          </div>
        </div>
      ) : null}

      {/* reel.mp4 playing (real frames) */}
      {reelO > 0 ? (
        <div
          style={{
            position: "absolute",
            left: REEL.x,
            top: REEL.y,
            width: REEL.w,
            height: REEL.h,
            borderRadius: 14,
            overflow: "hidden",
            border: `1.5px solid ${K.strokeHi}`,
            opacity: pIn * reelO,
            transform: `translateX(${(1 - pIn) * -90}px) scale(${(0.9 + 0.1 * pIn) * (1 - 0.15 * (1 - reelO))})`,
            filter: pIn < 1 ? `blur(${(1 - pIn) * 7}px)` : undefined,
          }}
        >
          <Img src={refSrc(PLAY[Math.max(0, Math.floor((frame - start) / 5)) % PLAY.length])} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", left: 0, bottom: 0, height: 4, width: `${Math.min(1, (frame - start) / 44) * 100}%`, background: K.coral }} />
        </div>
      ) : null}

      {/* film band with perforations (moves with the strip) */}
      {stripO > 0 ? (
        <div style={{ position: "absolute", left: -20, width: 1120, top: SY - 16, height: SH + 32, background: "rgba(8,6,5,0.82)", borderTop: `1px solid ${K.stroke}`, borderBottom: `1px solid ${K.stroke}`, opacity: stripO, overflow: "hidden" }}>
          {[3, SH + 32 - 10].map((y) => (
            <div key={y} style={{ position: "absolute", top: y, left: -((off * PITCH) % 28), width: 1200, height: 7, backgroundImage: "linear-gradient(90deg, rgba(255,236,220,0.22) 0 12px, transparent 12px 28px)", backgroundSize: "28px 7px", borderRadius: 2 }} />
          ))}
        </div>
      ) : null}

      {/* selection (behind the tiles' glow, above the strip) */}
      {frame >= T.frame + 5 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: SX0 - 8,
              top: SY - 8,
              width: SW + 16,
              height: SH + 16,
              borderRadius: 16,
              border: `4px solid ${K.coral}`,
              boxShadow: `0 0 34px ${K.coralGlow}, inset 0 0 20px rgba(217,119,87,0.25)`,
              transform: `scale(${0.8 + 0.2 * Math.min(1.05, selPop)})`,
              opacity: Math.min(1, selPop),
              zIndex: 3,
            }}
          />
        </>
      ) : null}

      {/* tiles: sheet grid → flight → filmstrip */}
      {tilesOn
        ? REFS.map((r, i) => {
            const g = grid(i);
            const tp = EASE((frame - (T.ffmpeg + i * 0.8)) / 6);
            if (tp <= 0) return null;
            const from = { x: REEL.x + REEL.w / 2 - TW / 2, y: REEL.y + REEL.h / 2 - TH / 2, w: TW, h: TH };
            let rect = { x: lerp(from.x, g.x, tp), y: lerp(from.y, g.y, tp), w: TW, h: TH };
            const ft = io((frame - (T.frame + i * 0.45)) / 9);
            const s = { x: SX0 + PITCH * (i - off), y: SY, w: SW, h: SH };
            if (ft > 0) rect = { x: lerp(g.x, s.x, ft), y: lerp(g.y, s.y, ft), w: lerp(TW, SW, ft), h: lerp(TH, SH, ft) };
            if (rect.x > 1100 || rect.x + rect.w < -40) return null;
            const isSel = ft >= 1 && i === sel && frame >= selAt(i);
            const flash = frame >= selAt(i) && ft >= 1 ? 1 - EASE((frame - selAt(i)) / 6) : 0;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: rect.x,
                  top: rect.y,
                  width: rect.w,
                  height: rect.h,
                  borderRadius: lerp(4, 12, ft),
                  overflow: "hidden",
                  opacity: tp,
                  border: `1px solid rgba(255,236,220,${lerp(0.15, 0.25, ft)})`,
                  boxShadow: ft > 0 ? `0 ${16 * ft}px ${36 * ft}px rgba(0,0,0,0.55)` : undefined,
                  zIndex: isSel ? 2 : 1,
                }}
              >
                <Img src={refSrc(r.n)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: ft >= 1 && !isSel ? "brightness(0.78) saturate(0.9)" : undefined }} />
                {flash > 0 ? <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: 0.35 * flash }} /> : null}
                {ft > 0.6 ? (
                  <div style={{ position: "absolute", left: 7, bottom: 7, padding: "2px 7px", borderRadius: 7, background: "rgba(15,11,9,0.78)", fontFamily: MONO, fontSize: 15, fontWeight: 700, color: isSel ? K.coralLight : K.cream, opacity: (ft - 0.6) / 0.4 }}>
                    #{String(r.n).padStart(3, "0")}
                  </div>
                ) : null}
              </div>
            );
          })
        : null}

      {/* timecodes above + tags below the strip */}
      {stripO > 0
        ? REFS.map((r, i) => {
            const x = SX0 + PITCH * (i - off);
            if (x > 1080 || x + SW < 0) return null;
            const isSel = i === sel && frame >= selAt(i);
            const tagged = frame >= selAt(i) && i <= NSTEPS;
            const tagPop = spring({ frame: frame - selAt(i), fps, config: { damping: 11, stiffness: 220, mass: 0.55 } });
            return (
              <div key={i} style={{ position: "absolute", left: x, width: SW, top: SY - 44, height: SH + 100, opacity: stripO, zIndex: 4 }}>
                <div style={{ textAlign: "center", fontFamily: MONO, fontSize: 18, fontWeight: isSel ? 700 : 500, color: isSel ? K.coral : K.dim }}>{tc(r.t)}</div>
                {tagged ? (
                  <div style={{ position: "absolute", top: SH + 70, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
                    <div
                      style={{
                        padding: "4px 11px",
                        borderRadius: 999,
                        fontFamily: UI,
                        fontWeight: 800,
                        fontSize: 20,
                        letterSpacing: "0.08em",
                        whiteSpace: "nowrap",
                        color: isSel ? "#1A0F0B" : K.coralLight,
                        background: isSel ? `linear-gradient(180deg, ${K.coralLight}, ${K.coral})` : "rgba(217,119,87,0.14)",
                        border: `1.5px solid ${isSel ? "rgba(255,220,200,0.6)" : "rgba(217,119,87,0.45)"}`,
                        transform: `scale(${0.6 + 0.4 * Math.min(1.08, tagPop)})`,
                        opacity: Math.min(1, tagPop),
                      }}
                    >
                      {r.tag}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        : null}
    </div>
  );
};
