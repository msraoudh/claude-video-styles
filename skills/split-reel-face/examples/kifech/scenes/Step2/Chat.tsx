import type React from "react";
import { Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Caret, Cursor, EASE, Spark, typed } from "../../edit/kit";
import { glass, K, SERIF_UP, UI } from "../../edit/theme";
import { B, bell, clamp01, io, kf, lerp, LinkIcon, refSrc, SendIcon, T } from "./shared";

/**
 * Beat 1 (596–929): the reel (left) hands its link to Claude (right) → « ونقلّو » the window widens and the prompt types
 * itself in 3arbizi, word-synced to the voice; key words get a coral underline when they are said; sent on « وكل شيء ».
 */
const PROMPT = "tfarrej fel vidéo hedhi w analysiha b détails : chnowa ma3moula, b chnowa, w chnowa les outils";
const ix = (s: string) => PROMPT.indexOf(s);
// typing keyframes: [frame, characters typed] — follow the spoken phrase
const TYPE: [number, number][] = [
  [T.tfarrej, 0],
  [T.tfarrej + 13, ix("fel")],
  [T.hedhi + 1, ix("hedhi")],
  [T.analyse, ix("w analysiha")],
  [T.details - 2, ix("b détails")],
  [T.details + 15, ix(" :")],
  [T.qolli, ix("chnowa ma3")],
  [T.bech - 8, ix(", b chnowa")],
  [T.bech, ix("b chnowa")],
  [T.outils1 - 6, ix(", w chnowa")],
  [T.outils1, ix("w chnowa")],
  [T.kol - 4, PROMPT.length],
];
const typedN = (frame: number) =>
  Math.floor(
    kf(
      frame,
      TYPE.map((t) => t[0]),
      TYPE.map((t) => t[1]),
      true,
    ),
  );
const frameTyped = (idx: number) => {
  for (let k = 0; k < TYPE.length - 1; k++) {
    const [f0, n0] = TYPE[k];
    const [f1, n1] = TYPE[k + 1];
    if (idx > n0 && idx <= n1) return Math.ceil(f0 + ((idx - n0) / (n1 - n0)) * (f1 - f0));
  }
  return TYPE[TYPE.length - 1][0];
};
const SEGS: { s: string; hl?: number }[] = [
  { s: "tfarrej fel vidéo hedhi w " },
  { s: "analysiha", hl: T.analyse },
  { s: " b " },
  { s: "détails", hl: T.details },
  { s: " : chnowa ma3moula, b chnowa, w chnowa " },
  { s: "les outils", hl: T.outils1 },
];

const REEL_FRAMES = [2, 6, 9, 13, 17, 20, 25, 30];

/** Link chip (« instagram.com/p/ » unfolds once it is in the input). */
const LinkChip: React.FC<{ expand: number; size?: number }> = ({ expand, size = 23 }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "9px 18px 9px 13px",
      borderRadius: 14,
      background: "linear-gradient(180deg, rgba(217,119,87,0.26), rgba(217,119,87,0.14))",
      border: "1.5px solid rgba(240,164,135,0.6)",
      fontFamily: UI,
      fontWeight: 600,
      fontSize: size,
      color: K.coralLight,
      whiteSpace: "nowrap",
      boxShadow: "0 10px 26px rgba(0,0,0,0.45)",
    }}
  >
    <LinkIcon size={size} />
    <span style={{ display: "inline-block", maxWidth: expand * 200, overflow: "hidden", opacity: expand, verticalAlign: "bottom" }}>instagram.com/p/</span>
    <span style={{ color: K.cream }}>DemwzTPJK6J</span>
  </div>
);

export const ChatPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < T.start || frame >= B.toTerm + 10) return null;

  // window geometry: 1a (next to the reel) → 1b (full width) on « ونقلّو »
  const m = EASE((frame - T.nqollo) / 12);
  const winX = lerp(290, 70, m);
  const winW = lerp(670, 890, m);
  const winY = 1045;
  const winH = 400;
  const inTop = lerp(54 + 100, 54 + 16, m);
  const inH = winH - inTop - 16;

  const pIn = EASE((frame - B.winIn) / 7);
  const q = EASE((frame - B.toTerm) / 9);
  const push = 1 + 0.018 * clamp01((frame - B.winIn) / 320);

  // link chip: sits on the reel (612) → grabbed (640) → arcs into the input (659)
  const chipA = { x: 84, y: 1370 };
  const chipB = { x: 290 + 22 + 18, y: winY + 54 + 100 + 16 }; // input slot at m = 0
  const ft = io((frame - B.grab) / (T.lien - B.grab));
  const arc = Math.sin(Math.PI * clamp01((frame - B.grab) / (T.lien - B.grab)));
  const chipX = lerp(chipA.x, chipB.x, ft);
  const chipY = lerp(chipA.y, chipB.y, ft) - 38 * arc;
  const chipPop = spring({ frame: frame - (T.start + 16), fps, config: { damping: 12, stiffness: 190, mass: 0.6 } });
  const landed = frame >= T.lien;
  const land = spring({ frame: frame - T.lien, fps, config: { damping: 9, stiffness: 220, mass: 0.6 } });
  const expand = EASE((frame - T.lien - 4) / 10);

  // typing
  const n = typedN(frame);
  const sent = EASE((frame - (B.send + 1)) / 6);
  const focused = frame >= T.nqollo + 2;

  // cursor
  let curX = 0;
  let curY = 0;
  let curO = 0;
  if (frame < T.lien + 16) {
    if (frame < B.grab) {
      curX = kf(frame, [T.give - 6, T.give + 2], [230, 156]);
      curY = kf(frame, [T.give - 6, T.give + 2], [1440, 1392]);
    } else if (frame < T.lien) {
      curX = chipX + 72;
      curY = chipY + 22;
    } else {
      curX = kf(frame, [T.lien, T.lien + 14], [chipB.x + 72, chipB.x + 120]);
      curY = kf(frame, [T.lien, T.lien + 14], [chipB.y + 22, chipB.y + 60]);
    }
    curO = clamp01((frame - (T.give - 6)) / 5) * (1 - clamp01((frame - (T.lien + 6)) / 8));
  } else if (frame > B.send - 18) {
    const sx = winX + 22 + (winW - 44) - 16 - 27 - 2;
    const sy = winY + inTop + inH - 14 - 27 - 2;
    curX = kf(frame, [B.send - 18, B.send - 2], [sx - 150, sx]);
    curY = kf(frame, [B.send - 18, B.send - 2], [sy + 60, sy]);
    curO = clamp01((frame - (B.send - 18)) / 5) * (1 - q);
  }
  const clicks = [B.grab, T.lien, B.send].filter((c) => c <= frame);
  const clickAt = clicks.length ? clicks[clicks.length - 1] : undefined;

  // reel card (1a)
  const rIn = EASE((frame - (B.winIn + 3)) / 7);
  const rq = m;
  const reelIdx = REEL_FRAMES[Math.max(0, Math.floor((frame - B.winIn) / 9)) % REEL_FRAMES.length];

  // spark on « Claude »
  const glow = bell(frame, T.claude1 - 2, T.claude1 + 22);
  const spin = 120 * EASE((frame - T.claude1) / 14);

  const sendPress = frame >= B.send && frame < B.send + 6 ? 0.86 : 1;
  const sendRing = frame >= B.send && frame < B.send + 14 ? (frame - B.send) / 14 : 0;

  let acc = 0;
  return (
    <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "540px 1245px" }}>
      {/* the reel we liked (real frames of DemwzTPJK6J) */}
      {rq < 1 ? (
        <div
          style={{
            position: "absolute",
            left: 70,
            top: 1062,
            width: 200,
            height: 356,
            opacity: rIn * (1 - rq),
            transform: `translate(${-(1 - rIn) * 30 - rq * 220}px, ${(1 - rIn) * 14}px) scale(${0.96 + 0.04 * rIn})`,
            filter: rIn < 1 || rq > 0 ? `blur(${(1 - rIn) * 6 + rq * 8}px)` : undefined,
            borderRadius: 22,
            overflow: "hidden",
            border: `1.5px solid ${K.strokeHi}`,
            boxShadow: "0 22px 50px rgba(0,0,0,0.6)",
          }}
        >
          <Img src={refSrc(reelIdx)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", left: 10, top: 10, padding: "5px 11px", borderRadius: 999, background: "rgba(15,11,9,0.72)", fontFamily: UI, fontWeight: 700, fontSize: 16, color: K.cream }}>
            Reel · 0:40
          </div>
          <div style={{ position: "absolute", left: 0, bottom: 0, height: 5, width: `${(((frame - B.winIn) / 240) % 1) * 100}%`, background: K.coral }} />
        </div>
      ) : null}

      {/* Claude window */}
      <div
        style={{
          position: "absolute",
          left: winX,
          top: winY,
          width: winW,
          height: winH,
          ...glass(),
          borderRadius: 26,
          overflow: "hidden",
          padding: 0,
          opacity: pIn * (1 - q),
          transform: `translate(${-q * 170}px, ${(1 - pIn) * 14}px) scale(${0.96 + 0.04 * pIn - 0.05 * q})`,
          filter: pIn < 1 || q > 0 ? `blur(${(1 - pIn) * 6 + q * 9}px)` : undefined,
        }}
      >
        {/* title bar */}
        <div style={{ height: 54, display: "flex", alignItems: "center", gap: 10, padding: "0 20px", borderBottom: `1px solid ${K.stroke}`, background: "rgba(255,236,220,0.04)" }}>
          {["#FF6159", "#FFBD2E", "#28C941"].map((c) => (
            <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c, opacity: 0.85 }} />
          ))}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 9, marginRight: 60, fontFamily: UI, fontWeight: 600, fontSize: 22, color: K.cream }}>
            <Spark size={22} rotate={spin} glow={glow * 10} /> Claude
          </div>
        </div>

        {/* greeting (1a only) */}
        <div style={{ position: "absolute", left: 28, top: 54 + 30, display: "flex", alignItems: "center", gap: 16, opacity: 1 - m, transform: `translateY(${-24 * m}px)` }}>
          <Spark size={40} rotate={spin} glow={6 + glow * 18} />
          <div style={{ fontFamily: SERIF_UP, fontSize: 42, color: K.cream, whiteSpace: "nowrap" }}>{typed("On analyse quoi aujourd'hui ?", frame, B.winIn + 8, 48)}</div>
        </div>

        {/* input */}
        <div
          style={{
            position: "absolute",
            left: 22,
            top: inTop,
            width: winW - 44,
            height: inH,
            borderRadius: 22,
            background: "rgba(255,236,220,0.05)",
            border: `1.5px solid ${focused ? "rgba(217,119,87,0.55)" : K.stroke}`,
            boxShadow: focused ? `0 0 0 4px rgba(217,119,87,0.10), 0 0 34px rgba(217,119,87,0.16)` : undefined,
          }}
        >
          <div style={{ position: "absolute", inset: 0, opacity: 1 - sent, transform: `translateY(${-26 * sent}px) scale(${1 - 0.03 * sent})` }}>
            {/* attachment */}
            {landed ? (
              <div style={{ position: "absolute", left: 18, top: 16, transform: `scale(${lerp(1.14, 1, land)}) translateY(${(1 - land) * -6}px)`, transformOrigin: "left center" }}>
                <LinkChip expand={expand} />
              </div>
            ) : (
              <div style={{ position: "absolute", left: 18, top: 16, width: 220, height: 46, borderRadius: 14, border: `1.5px dashed rgba(255,236,220,${0.18 * clamp01((frame - B.grab) / 6)})` }} />
            )}
            {/* prompt */}
            <div style={{ position: "absolute", left: 22, right: 22, top: 80, fontFamily: UI, fontWeight: 500, fontSize: 38, lineHeight: 1.32, color: K.cream }}>
              {n === 0 ? (
                <span style={{ color: K.dim }}>
                  {focused ? <Caret h={38} /> : null}
                  Écris à Claude…
                </span>
              ) : (
                <>
                  {SEGS.map((sg, i) => {
                    const a = acc;
                    acc += sg.s.length;
                    const vis = sg.s.slice(0, Math.max(0, Math.min(sg.s.length, n - a)));
                    if (!vis) return null;
                    if (sg.hl === undefined) return <span key={i}>{vis}</span>;
                    const u = EASE((frame - Math.max(sg.hl, frameTyped(a + sg.s.length))) / 7);
                    return (
                      <span
                        key={i}
                        style={{
                          color: u > 0 ? K.coralLight : K.cream,
                          backgroundImage: `linear-gradient(${K.coral}, ${K.coral})`,
                          backgroundSize: `${u * 100}% 4px`,
                          backgroundPosition: "0 100%",
                          backgroundRepeat: "no-repeat",
                          paddingBottom: 3,
                        }}
                      >
                        {vis}
                      </span>
                    );
                  })}
                  {frame < B.send ? <Caret h={38} /> : null}
                </>
              )}
            </div>
          </div>
          {/* bottom bar */}
          <div style={{ position: "absolute", left: 16, bottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, border: `1.5px solid ${K.stroke}`, display: "flex", alignItems: "center", justifyContent: "center", color: K.muted, fontFamily: UI, fontSize: 30, fontWeight: 400 }}>+</div>
          </div>
          <div style={{ position: "absolute", right: 16, bottom: 14, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative", width: 54, height: 54 }}>
              {sendRing > 0 ? (
                <div style={{ position: "absolute", left: 27 - 50 * sendRing, top: 27 - 50 * sendRing, width: 100 * sendRing, height: 100 * sendRing, borderRadius: "50%", border: `3px solid ${K.coral}`, opacity: 1 - sendRing }} />
              ) : null}
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${sendPress})`,
                  background: n > 0 ? `linear-gradient(180deg, ${K.coralLight}, ${K.coral})` : "rgba(255,236,220,0.1)",
                  boxShadow: n > 0 ? `0 8px 22px ${K.coralGlow}` : undefined,
                }}
              >
                <SendIcon color={n > 0 ? "#1A0F0B" : K.dim} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* the link chip before it lands */}
      {!landed && frame >= T.start + 16 ? (
        <div
          style={{
            position: "absolute",
            left: chipX,
            top: chipY,
            opacity: Math.min(1, chipPop),
            transform: `rotate(${-6 * arc}deg) scale(${(0.7 + 0.3 * Math.min(1.1, chipPop)) * (1 + 0.08 * arc)})`,
            transformOrigin: "left center",
            filter: arc > 0.05 ? `drop-shadow(0 ${16 * arc}px ${20 * arc}px rgba(0,0,0,0.6))` : undefined,
          }}
        >
          <LinkChip expand={0} />
        </div>
      ) : null}

      {curO > 0.01 ? (
        <div style={{ position: "absolute", inset: 0, opacity: curO }}>
          <Cursor x={curX} y={curY} clickAt={clickAt} />
        </div>
      ) : null}
    </div>
  );
};
