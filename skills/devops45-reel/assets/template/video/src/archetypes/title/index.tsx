import React from "react";
import { AbsoluteFill } from "remotion";
import type { Archetype } from "..";
import { fontInter, fontMono } from "../../kit/fonts";
import { B } from "../../lib/look";
import { beatPulse, rand, useGlobalFrame } from "../../lib/sync";
import { AMBER, AMBER_HOT, AnamorphicFlare, Bloom, CYAN, clamp01, decay, EASE_OUT, iv, Shockwave, smooth } from "./brand/fx";
import { GlassTitle, planeScale } from "./brand/GlassTitle";
import { identTiming, type IdentT } from "./brand/ident";
import { LAY, LOCKUP_BOTTOM, LOCKUP_TOP, TITLE_CY, toScreen } from "./brand/layout";
import { epHandle, epNumber, epTitle } from "./brand/meta";
import { fitMono, fitWords, splitWords, textWidth, useFontsReady } from "./brand/text";

/**
 * archetype "title" — THE SERIES IDENT (identical every day, only the episode words change).
 * ~1.0–1.3 s of voice silence between the hook and the body; the music DROP lands on its first frame.
 *   from      hard cut on the drop: the ONE radial cyan flash over the brand's 3D glass panes imploding from the lens
 *   +5        the panes LOCK (recoil, shockwave, anamorphic flare) · +7/+10/+13/+16 DEVOPS · EN · 45 (amber, the
 *             cyan ring timer closes round it) · SECONDES ignite
 *   +3        chip « LINUX · ÉPISODE 7 » · +6 the episode title slams in word by word · +14 `$ command` types in
 *   to−11     the panes blast toward the lens, the type pushes through → hard cut onto the first body word.
 * Data: none — everything comes from EPISODE.title {kicker?, line, command?} and EPISODE.number (spec.data may
 * override: {kicker?, line?, command?}). Captions OFF. All the ident sits in the central 1080² square (Cover = it).
 */

const CHIP_Y = LOCKUP_TOP - 80;
const LINE_TOP = LOCKUP_BOTTOM + 66;
const LINE_W = 800; // x 140–940 (Instagram's icon column below y 1000)
const FIT = { maxW: LINE_W, maxLines: 2, min: 64, max: 112 };

type Props = { g: number; T: IdentT; cover?: boolean; data?: { kicker?: string; line?: string; command?: string } };

/** the drop flash: a radial burst of cyan-white light from the lockup (not a flat wash) */
const DropFlash: React.FC<{ a: number; x: number; y: number }> = ({ a, x, y }) =>
  a > 0.005 ? (
    <AbsoluteFill
      style={{
        mixBlendMode: "screen",
        pointerEvents: "none",
        background: `radial-gradient(circle 1250px at ${x}px ${y}px, rgba(235,252,255,${(0.95 * a).toFixed(3)}) 0%, rgba(120,230,250,${(0.7 * a).toFixed(3)}) 28%, rgba(34,211,238,${(0.32 * a).toFixed(3)}) 60%, rgba(34,211,238,${(0.1 * a).toFixed(3)}) 100%)`,
      }}
    />
  ) : null;

/** « LINUX · ÉPISODE 7 » glass chip */
const Chip: React.FC<{ g: number; T: IdentT; cover: boolean; kicker?: string; num?: number }> = ({ g, T, cover, kicker, num }) => {
  if (!kicker && !num) return null;
  const p = cover ? 1 : iv(g - T.chip, [0, 9], [0, 1], EASE_OUT);
  const sheen = cover ? -1 : iv(g - T.chip - 4, [0, 16], [0, 1]);
  const kick = kicker ? kicker.toUpperCase().slice(0, 22) : "";
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: CHIP_Y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          transform: `translateY(-50%) scale(${(0.86 + 0.14 * p).toFixed(4)})`,
          opacity: iv(p, [0, 0.4], [0, 1]),
          filter: p < 0.99 ? `blur(${((1 - p) * 10).toFixed(1)}px)` : undefined,
          display: "flex",
          alignItems: "center",
          gap: 18,
          height: 64,
          padding: "0 28px",
          borderRadius: 999,
          background: "linear-gradient(140deg, rgba(255,255,255,0.10), rgba(255,255,255,0.025))",
          border: "1px solid rgba(255,255,255,0.13)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 30px rgba(0,0,0,0.45), 0 0 40px rgba(34,211,238,0.16)",
          backdropFilter: "blur(14px) saturate(140%)",
          position: "relative",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        {kick ? <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 30, letterSpacing: "0.2em", marginRight: "-0.2em", color: B.cyan, textShadow: `0 0 16px ${B.cyanGlow}` }}>{kick}</span> : null}
        {kick && num ? <span style={{ width: 7, height: 7, borderRadius: 4, background: "rgba(226,236,250,0.5)" }} /> : null}
        {num ? <span style={{ fontFamily: fontMono, fontWeight: 500, fontSize: 30, letterSpacing: "0.14em", marginRight: "-0.14em", color: "rgba(236,244,252,0.9)" }}>ÉPISODE {num}</span> : null}
        {sheen > 0 && sheen < 1 ? (
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${(-30 + 140 * sheen).toFixed(1)}%`, width: "30%", background: "linear-gradient(100deg, rgba(255,255,255,0), rgba(255,255,255,0.28), rgba(255,255,255,0))" }} />
        ) : null}
      </div>
    </div>
  );
};

/** the episode title: big Inter 800, word-by-word slam (fitted for 3…34+ chars, ≤ 2 lines, 3 if it must) */
const Line: React.FC<{ g: number; T: IdentT; cover: boolean; text: string }> = ({ g, T, cover, text }) => {
  const words = splitWords(text);
  const fit = fitWords(words, FIT);
  const lh = fit.size * 1.06;
  const n = words.length;
  const stagger = Math.min(2, 10 / Math.max(1, n - 1));
  let k = 0;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: LINE_TOP, textAlign: "center" }}>
      {fit.lines.map((ln, li) => (
        <div key={li} style={{ height: lh, lineHeight: `${lh}px`, whiteSpace: "nowrap", fontFamily: fontInter, fontWeight: 800, fontSize: fit.size, letterSpacing: "-0.03em", color: B.white }}>
          {ln.map((w, wi) => {
            const i = k++;
            const a = g - (T.line + i * stagger);
            const p = cover ? 1 : a < 0 ? 0 : iv(a, [0, 9], [0, 1], EASE_OUT);
            const hot = cover ? 0 : decay(a, 5);
            return (
              <span
                key={wi}
                style={{
                  display: "inline-block",
                  marginRight: wi < ln.length - 1 ? "0.24em" : 0,
                  opacity: iv(p, [0, 0.3], [0, 1]),
                  transform: `scale(${(1.42 - 0.42 * p).toFixed(4)}) translateY(${((1 - p) * 12).toFixed(1)}px)`,
                  transformOrigin: "50% 60%",
                  filter: p < 0.99 ? `blur(${((1 - p) * 14).toFixed(1)}px)` : undefined,
                  textShadow: `0 4px 22px rgba(0,0,0,0.75), 0 0 ${(24 + 40 * hot).toFixed(0)}px rgba(34,211,238,${(0.18 + 0.45 * hot).toFixed(3)})`,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
const lineHeightOf = (text: string) => {
  const words = splitWords(text);
  if (!words.length) return 0;
  const fit = fitWords(words, FIT);
  return fit.lines.length * fit.size * 1.06;
};

/** `$ command` — dark glass, mono, typed in fast with the amber cursor */
const Command: React.FC<{ g: number; T: IdentT; cover: boolean; text: string; y: number }> = ({ g, T, cover, text, y }) => {
  const f = fitMono(text, 660, 50, 28);
  const a = g - T.command;
  const p = cover ? 1 : iv(a, [0, 7], [0, 1], EASE_OUT);
  const chars = Array.from(f.text);
  const dur = Math.min(10, Math.max(4, chars.length * 0.7));
  const n = cover ? chars.length : Math.max(0, Math.min(chars.length, Math.ceil((a / dur) * chars.length)));
  const typing = n < chars.length;
  const blink = cover || typing || Math.floor(a / 14) % 2 === 0;
  const fullW = textWidth(f.text, f.size, 700, true);
  const charW = fullW / Math.max(1, chars.length);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          transform: `translateY(-50%) scale(${(0.9 + 0.1 * p).toFixed(4)})`,
          opacity: iv(p, [0, 0.35], [0, 1]),
          display: "flex",
          alignItems: "center",
          gap: 0.5 * f.size,
          height: f.size * 1.75,
          padding: `0 ${(f.size * 0.8).toFixed(0)}px`,
          borderRadius: 22,
          background: "linear-gradient(180deg, rgba(8,16,34,0.86), rgba(4,8,18,0.86))",
          border: "1px solid rgba(34,211,238,0.28)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 14px 36px rgba(0,0,0,0.5), 0 0 36px rgba(34,211,238,0.14)",
          whiteSpace: "pre",
          fontFamily: fontMono,
          fontWeight: 700,
          fontSize: f.size,
        }}
      >
        <span style={{ color: B.amber, textShadow: `0 0 16px ${B.amberGlow}` }}>$</span>
        <span style={{ position: "relative", color: "#EAF6FF", width: fullW + f.size * 0.6, display: "inline-block" }}>
          {chars.slice(0, n).join("")}
          <span
            style={{
              position: "absolute",
              left: n * charW + 4,
              top: "14%",
              width: f.size * 0.48,
              height: "74%",
              borderRadius: 2,
              background: B.amber,
              boxShadow: `0 0 12px ${B.amberGlow}`,
              opacity: blink ? 0.95 : 0,
            }}
          />
        </span>
      </div>
    </div>
  );
};

/** the whole ident at frame g (the Cover freezes it at T.best with cover=true) */
export const TitleStage: React.FC<Props & { children?: React.ReactNode }> = ({ g, T, cover = false, data, children }) => {
  useFontsReady();
  const t = epTitle();
  const kicker = data?.kicker ?? t.kicker;
  const line = data?.line ?? t.line;
  const command = data?.command ?? t.command;
  const num = epNumber();
  const k = planeScale(g, T, cover);
  const at = (p: { x: number; y: number }) => toScreen(p.x, p.y, k, TITLE_CY);
  const c = toScreen(0, 0, k, TITLE_CY);
  const n45 = at(LAY.at.n45);
  const sk = decay(g - T.lock, 6);
  const sx = cover ? 0 : (rand(g * 2.3) - 0.5) * 0.05 * sk;
  const sy = cover ? 0 : (rand(g * 4.1 + 3) - 0.5) * 0.05 * sk;
  const bp = cover ? 0 : beatPulse(g, 14);
  const lit45 = g >= T.n45 ? 1 : 0;
  const out = cover ? 0 : smooth((g - T.flyOut) / Math.max(4, T.end - T.flyOut));
  const lh = line ? lineHeightOf(line) : 0;
  const cmdY = LINE_TOP + lh + 74;
  // overlays: tiny drift + the push-through on the way out
  const push = 1 + 0.012 * clamp01((g - T.from) / 60) + 0.28 * out * out;
  return (
    <AbsoluteFill style={{ background: B.bg, overflow: "hidden" }}>
      <GlassTitle g={g} T3={T} shakeX={sx} shakeY={sy} cover={cover} cy={TITLE_CY} />
      <Bloom x={n45.x} y={n45.y} rx={300 * k} ry={300 * k} col={AMBER} a={lit45 * (0.07 + 0.2 * decay(g - T.n45, 8) + 0.03 * bp) * (1 - out)} />
      <Bloom x={c.x} y={c.y} rx={560} ry={520} col={CYAN} a={(g >= T.lock ? 0.05 + 0.1 * decay(g - T.lock, 10) : 0) * (1 - out)} />
      <AbsoluteFill
        style={{
          transform: `scale(${push.toFixed(4)})`,
          transformOrigin: `540px ${TITLE_CY + 120}px`,
          opacity: 1 - 0.85 * out,
          filter: out > 0.02 ? `blur(${(10 * out).toFixed(1)}px)` : undefined,
        }}
      >
        <Chip g={g} T={T} cover={cover} kicker={kicker} num={num} />
        {line ? <Line g={g} T={T} cover={cover} text={line} /> : null}
        {command ? <Command g={g} T={T} cover={cover} text={command} y={cmdY} /> : null}
        {cover && (command ? cmdY + 92 : LINE_TOP + lh + 52) <= 1474 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: command ? cmdY + 92 : LINE_TOP + lh + 52,
              textAlign: "center",
              fontFamily: fontMono,
              fontWeight: 500,
              fontSize: 30,
              color: "rgba(226,236,250,0.72)",
              transform: "translateY(-50%)",
            }}
          >
            {epHandle()}
          </div>
        ) : null}
      </AbsoluteFill>
      {cover ? null : (
        <>
          <Shockwave age={g - T.lock} x={c.x} y={c.y} dur={24} strength={0.55} maxR={1250} r0={180} />
          <AnamorphicFlare age={g - T.lock} x={c.x} y={c.y} dur={36} strength={0.7} size={180} />
          <AnamorphicFlare age={g - T.n45} x={n45.x} y={n45.y} col={AMBER_HOT} dur={28} strength={0.5} size={140} streakH={110} />
          <AnamorphicFlare age={g - T.secondes} x={at(LAY.at.secondes).x} y={at(LAY.at.secondes).y} dur={20} strength={0.26} size={100} streakH={80} />
          <DropFlash a={iv(g - T.drop, [0, 1, 2, 5], [0.85, 0.42, 0.16, 0])} x={c.x} y={c.y} />
        </>
      )}
      {children}
    </AbsoluteFill>
  );
};

export const Title: Archetype = ({ spec }) => {
  const g = useGlobalFrame();
  const T = identTiming(spec.from, spec.to);
  return <TitleStage g={g} T={T} data={spec.data ?? undefined} />;
};
