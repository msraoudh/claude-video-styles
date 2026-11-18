import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import type { Archetype } from "..";
import { fontInter, fontMono } from "../../kit/fonts";
import { Icon, type IconName } from "../../kit/Icon";
import { Logo, logoKey } from "../../kit/Logo";
import { BEATS } from "../../data/beats";
import { B } from "../../lib/look";
import { beatPulse, useGlobalFrame } from "../../lib/sync";
import { Backdrop } from "../title/brand/Backdrop";
import { AMBER_HOT, AnamorphicFlare, clamp01, decay, EASE_IN, EASE_OUT, iv, Shockwave } from "../title/brand/fx";
import { epTitle, lineBeats, norm, resolveIcon, wordAt, words as sceneWords } from "../title/brand/meta";
import { fitWords, splitWords, useFontsReady } from "../title/brand/text";
import { Sparks } from "../cards/fx";

/**
 * archetype "hook" — the first 2.5–5 s (captions ON, hero in y 240–1270). Same grammar every day:
 *   frame 0   motion from the very first frame: the glass icon tile is already flying in (blur → sharp) through a
 *             burst of light streaks; it LANDS at +9 (shockwave + anamorphic flare) — the scroll-stopper.
 *   words     the on-screen hook statement builds word by word ON the spoken words (matched to the voice, never
 *             slower than ~7 f / word so the line is readable early); the ACCENT word ignites AMBER on its spoken
 *             word (punch on the tile, amber flare, underline sweep).
 *   build     the music is a filtered build: slow push-in + rising bloom, radar rings off the tile on every beat.
 *   end       tension move into the ident: CRT suck-in (squash to a cyan line → a point → black) over the last
 *             ~12 frames (the music's 0.3 s hole) → the ident's drop flash.
 * data: { line (≤ 60 chars, required), accent? (a word of line), sub? (small mono kicker; default EPISODE.title.kicker),
 *         icon? (Phosphor name, e.g. "ShieldWarning" — unknown → closest glyph / "lightning") }
 */

const TILE_Y = 506;
const TILE = 320;
const SUB_Y = 812;
const LINE_TOP = 858;
const LINE_MAX_H = 400; // ends ≤ 1258 (captions band from 1300)
const SUCK_Y = 800;
const easeOutQuad = Easing.out(Easing.quad);

/** the glass icon tile (the visual metaphor), lit from inside */
const Tile: React.FC<{ g: number; land: number; accentF: number; icon: IconName; logo?: string }> = ({ g, land, accentF, icon, logo }) => {
  const a = g - land;
  const inP = iv(g, [land - 9, land], [0, 1], EASE_OUT);
  const hit = decay(a, 6);
  const acc = decay(g - accentF, 7);
  const float = Math.sin(g / 34) * 6;
  const s = (1.42 - 0.42 * inP) * (1 + 0.05 * hit + 0.07 * acc) * (1 + 0.01 * beatPulse(g, 12));
  const rot = (1 - inP) * -9 + Math.sin(g / 51) * 1.2;
  const sweep = Math.max(iv(a, [0, 22], [0, 1]), g >= accentF ? iv(g - accentF, [0, 20], [0, 1]) : 0);
  const sweepOn = (a >= 0 && a < 22) || (g >= accentF && g - accentF < 20);
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - TILE / 2,
        top: TILE_Y - TILE / 2 + float,
        width: TILE,
        height: TILE,
        transform: `scale(${s.toFixed(4)}) rotate(${rot.toFixed(2)}deg)`,
        opacity: clamp01(0.7 + inP),
        filter: inP < 0.99 ? `blur(${((1 - inP) * 9).toFixed(1)}px)` : undefined,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 84,
          overflow: "hidden",
          background: "linear-gradient(150deg, rgba(255,255,255,0.16), rgba(255,255,255,0.03) 55%, rgba(34,211,238,0.10))",
          border: "1px solid rgba(255,255,255,0.18)",
          backdropFilter: "blur(18px) saturate(150%)",
          boxShadow: [
            "inset 0 1.2px 0 rgba(255,255,255,0.6)",
            "inset 0 22px 40px -22px rgba(255,255,255,0.28)",
            "inset 0 -1px 0 rgba(0,0,0,0.5)",
            "0 30px 70px rgba(0,0,0,0.55)",
            `0 0 ${(70 + 80 * hit + 60 * acc).toFixed(0)}px rgba(34,211,238,${(0.28 + 0.3 * hit + 0.2 * acc).toFixed(3)})`,
          ].join(", "),
        }}
      >
        {/* light inside the glass */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 58%, rgba(34,211,238,0.38) 0%, rgba(34,211,238,0.08) 45%, rgba(34,211,238,0) 70%)" }} />
        {sweepOn ? (
          <div
            style={{
              position: "absolute",
              top: -40,
              bottom: -40,
              width: 90,
              left: -120 + 520 * sweep,
              transform: "rotate(18deg)",
              background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.42), rgba(255,255,255,0))",
            }}
          />
        ) : null}
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {logo ? (
          <Logo name={logo} size={logoKey(logo) === "devops" ? TILE * 0.86 : 196} spin={g - land} glow={0.3 + 0.4 * hit + 0.4 * acc} />
        ) : (
        <Icon
          name={icon}
          size={184}
          weight="fill"
          color="#F4FCFF"
          style={{ filter: `drop-shadow(0 0 ${(18 + 26 * hit + 20 * acc).toFixed(0)}px rgba(34,211,238,0.95)) drop-shadow(0 6px 14px rgba(0,0,0,0.5))` }}
        />
        )}
      </div>
    </div>
  );
};

/** radar rings off the tile on every music beat + the orbit track with two lights */
const Radar: React.FC<{ g: number; from: number; land: number }> = ({ g, from, land }) => {
  const beats = [land, ...BEATS.filter((b) => b > land + 12 && b >= from)];
  const live = beats.filter((b) => g >= b && g < b + 46);
  const R0 = 226;
  const orbitIn = iv(g, [land, land + 16], [0, 1], EASE_OUT);
  const ang = (g - land) * 2.6;
  return (
    <>
      {live.map((b) => {
        const p = iv(g - b, [0, 46], [0, 1], easeOutQuad);
        const r = 150 + 330 * p;
        return (
          <div
            key={b}
            style={{
              position: "absolute",
              left: 540 - r,
              top: TILE_Y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              border: `${(3 - 2 * p).toFixed(2)}px solid rgba(34,211,238,${(0.55 * (1 - p)).toFixed(3)})`,
              boxShadow: `0 0 24px rgba(34,211,238,${(0.25 * (1 - p)).toFixed(3)})`,
            }}
          />
        );
      })}
      {orbitIn > 0 ? (
        <svg width={1080} height={1100} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: orbitIn }}>
          <circle cx={540} cy={TILE_Y} r={R0 * (0.8 + 0.2 * orbitIn)} fill="none" stroke="rgba(148,210,255,0.16)" strokeWidth={2} strokeDasharray="3 9" />
          {[0, 180].map((o) =>
            [0, 1, 2, 3].map((j) => {
              const t = ((ang + o - j * 4) * Math.PI) / 180;
              const rr = R0 * (0.8 + 0.2 * orbitIn);
              return (
                <circle
                  key={`${o}-${j}`}
                  cx={540 + Math.cos(t) * rr}
                  cy={TILE_Y + Math.sin(t) * rr}
                  r={5.5 - j * 1.1}
                  fill={j === 0 ? "#ffffff" : B.cyan}
                  opacity={(1 - j / 4) * 0.95}
                  style={j === 0 ? { filter: "drop-shadow(0 0 8px rgba(34,211,238,1))" } : undefined}
                />
              );
            }),
          )}
        </svg>
      ) : null}
    </>
  );
};

/** the tools NAMED in the hook (« Git, Docker, Kubernetes… ») fly in from the sides on their word and park around the tile */
const SLOTS = [
  { x: 205, y: 392, side: -1 },
  { x: 875, y: 392, side: 1 },
  { x: 205, y: 640, side: -1 },
  { x: 875, y: 640, side: 1 },
];
export const hookTools = (spec: Parameters<Archetype>[0]["spec"], tile?: string): { key: string; f: number }[] => {
  const ws = sceneWords(spec);
  const tk = logoKey(tile);
  const out: { key: string; f: number }[] = [];
  for (let i = 0; i < ws.length && out.length < SLOTS.length; i++) {
    const two = i + 1 < ws.length ? logoKey(ws[i].w + ws[i + 1].w) : null;
    const k = two ?? logoKey(ws[i].w);
    if (two) i++;
    if (!k || k === "devops" || k === tk || out.some((o) => o.key === k)) continue;
    out.push({ key: k, f: ws[two ? i - 1 : i].f });
  }
  return out;
};
const flyPos = (g: number, f: number, slot: (typeof SLOTS)[number]) => {
  const p = iv(g, [f - 14, f + 6], [0, 1], EASE_OUT);
  const x0 = slot.side < 0 ? -260 : 1340;
  const x = x0 + (slot.x - x0) * p;
  const y = slot.y - 150 * Math.sin((1 - p) * Math.PI * 0.5) * (1 - p);
  return { p, x, y };
};
const HookTools: React.FC<{ g: number; tools: { key: string; f: number }[] }> = ({ g, tools }) => (
  <>
    {tools.map((t, i) => {
      const slot = SLOTS[i];
      if (g < t.f - 16) return null;
      const { p, x, y } = flyPos(g, t.f, slot);
      const land = t.f + 6;
      const over = 1 + 0.18 * Math.sin(clamp01(iv(g, [land - 2, land + 12], [0, 1])) * Math.PI) * (g >= land - 2 ? 1 : 0);
      const s = (0.45 + 0.55 * p) * over;
      const rot = (1 - p) * slot.side * -540;
      const fl = Math.sin(g / 30 + i * 1.7) * 7;
      const trail = p < 0.98 ? [3, 6, 9] : [];
      const size = 128;
      return (
        <React.Fragment key={t.key}>
          {trail.map((dt) => {
            const q = flyPos(g - dt, t.f, slot);
            return (
              <div key={dt} style={{ position: "absolute", left: q.x - size / 2, top: q.y - size / 2, opacity: 0.32 * (1 - dt / 12) * q.p, filter: `blur(${(4 + dt).toFixed(0)}px)`, transform: `scale(${(0.45 + 0.55 * q.p).toFixed(3)})` }}>
                <Logo name={t.key} size={size} plate />
              </div>
            );
          })}
          <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2 + fl * p, transform: `scale(${s.toFixed(4)}) rotate(${rot.toFixed(1)}deg)`, filter: p < 0.95 ? `blur(${((1 - p) * 8).toFixed(1)}px)` : undefined, opacity: clamp01(p * 2) }}>
            <Logo name={t.key} size={size} glow={0.3 + 0.6 * decay(g - land, 10)} />
          </div>
          <Shockwave age={g - land} x={slot.x} y={slot.y} dur={22} strength={0.35} maxR={260} r0={50} />
          <Sparks g={g} at={land} x={slot.x} y={slot.y} r={120} n={10} seed={21 + i} />
        </React.Fragment>
      );
    })}
  </>
);

/** small mono kicker with hairlines */
const Sub: React.FC<{ g: number; f0: number; text: string }> = ({ g, f0, text }) => {
  const p = iv(g - f0, [0, 16], [0, 1], EASE_OUT);
  const ls = 0.34 + 0.4 * (1 - p);
  const line = iv(p, [0.2, 1], [0, 1]);
  return (
    <div style={{ position: "absolute", left: 140, right: 140, top: SUB_Y, display: "flex", justifyContent: "center", alignItems: "center", gap: 20, transform: "translateY(-50%)", opacity: iv(p, [0, 0.4], [0, 1]) }}>
      <div style={{ width: 60 * line, height: 2, background: "linear-gradient(90deg, rgba(34,211,238,0), rgba(34,211,238,0.8))" }} />
      <div style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 28, letterSpacing: `${ls.toFixed(3)}em`, marginRight: `-${ls.toFixed(3)}em`, color: "rgba(160,236,250,0.9)", whiteSpace: "nowrap" }}>{text.toUpperCase().slice(0, 30)}</div>
      <div style={{ width: 60 * line, height: 2, background: "linear-gradient(90deg, rgba(34,211,238,0.8), rgba(34,211,238,0))" }} />
    </div>
  );
};

export const Hook: Archetype = ({ spec }) => {
  useFontsReady();
  const g = useGlobalFrame();
  const d = (spec.data ?? {}) as { line?: string; accent?: string; sub?: string; icon?: string; logo?: string };
  const lineText = String(d.line ?? epTitle().line ?? "").trim();
  const words = splitWords(lineText);
  const icon = resolveIcon(d.icon, "lightning");
  const logo = logoKey(d.logo) ? (d.logo as string) : logoKey(d.icon) ? (d.icon as string) : undefined;
  const sub = d.sub ? String(d.sub) : epTitle().kicker;
  const ws = sceneWords(spec);
  const lastFe = ws.length ? ws[ws.length - 1].fe : spec.to - 12;
  const firstF = ws.length ? ws[0].f : spec.from + 12;

  // ── timing ──
  const land = spec.from + 9; // tile lands (it is already flying in on frame 0)
  const start = Math.min(firstF - 2, spec.from + 12);
  const beats = lineBeats(spec, words, { start, pace: 7 });
  const accN = d.accent ? norm(d.accent) : "";
  const accI = accN ? words.findIndex((w) => norm(w) === accN || (norm(w).startsWith(accN) && accN.length >= 3) || (accN.length >= 4 && norm(w).includes(accN))) : -1;
  const spokenAcc = accN ? wordAt(spec, [d.accent as string]) : undefined;
  const accentF = accI >= 0 ? Math.max(beats[accI] + 6, spokenAcc !== undefined ? spokenAcc - 2 : beats[accI] + 16) : Infinity;
  const suck0 = Math.max(spec.to - 22, Math.min(lastFe - 4, spec.to - 12));
  const lineF = spec.to - 5;
  const dotF = spec.to - 2;

  // ── layout ──
  const fit = fitWords(words.length ? words : [" "], { maxW: 800, maxLines: 3, min: 62, max: 116 });
  let size = fit.size;
  let lines = fit.lines;
  if (lines.length * size * 1.04 > LINE_MAX_H) {
    const f2 = fitWords(words, { maxW: 800, maxLines: 4, min: 50, max: Math.floor(LINE_MAX_H / 4 / 1.04) });
    size = f2.size;
    lines = f2.lines;
  }
  const lh = size * 1.04;

  // ── camera / energy ──
  const local = g - spec.from;
  const tSec = local / 60;
  const build = iv(g, [spec.from + 30, suck0], [0, 1], EASE_IN);
  const cam = 1 + 0.035 * clamp01(local / Math.max(60, spec.to - spec.from)) + 0.03 * build;
  const warp = Math.max(0.95 * decay(local, 16), 0.35 * build);
  const warpT = 1.1 * (1 - Math.exp(-local / 18)) + 1.4 * build * build;
  const bloom = 0.85 + 0.6 * decay(g - land, 12) + 0.45 * build + 0.4 * (g >= accentF ? decay(g - accentF, 12) : 0);

  // ── CRT suck-in into the ident ──
  const sq = iv(g, [suck0, lineF], [0, 1], EASE_IN);
  const sx = g < lineF ? 1 + 0.05 * sq : 1.05 * (1 - iv(g, [lineF, dotF], [0, 1], easeOutQuad));
  const sy = 1 - 0.994 * sq;
  const hot = clamp01((sq - 0.55) / 0.45) * (g < dotF ? 1 : 0);
  const dot = g >= lineF && g < spec.to ? 1 - iv(g, [dotF - 1, spec.to], [0, 1], EASE_IN) : 0;
  const gone = g >= dotF;

  let k = 0;
  return (
    <AbsoluteFill style={{ background: "#020409", overflow: "hidden" }}>
      {!gone ? (
        <AbsoluteFill style={{ transform: `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`, transformOrigin: `540px ${SUCK_Y}px` }}>
          <Backdrop id="hook" g={g} t={tSec} bloom={bloom} bloomAt={TILE_Y + 60} push={1 + 0.05 * tSec + 0.06 * build} warp={warp} warpT={warpT} warpAt={{ x: 540, y: TILE_Y }} warm={g >= accentF ? 0.35 * decay(g - accentF, 30) : 0} warmAt={LINE_TOP + 150} />
          <AbsoluteFill style={{ transform: `scale(${cam.toFixed(4)})`, transformOrigin: `540px ${SUCK_Y}px` }}>
            <Radar g={g} from={spec.from} land={land} />
            <Tile g={g} land={land} accentF={accentF} icon={icon} logo={logo} />
            <HookTools g={g} tools={hookTools(spec, logo)} />
            {sub ? <Sub g={g} f0={land + 4} text={sub} /> : null}
            <div style={{ position: "absolute", left: 0, right: 0, top: LINE_TOP, textAlign: "center" }}>
              {lines.map((ln, li) => (
                <div key={li} style={{ height: lh, lineHeight: `${lh}px`, whiteSpace: "nowrap", fontFamily: fontInter, fontWeight: 800, fontSize: size, letterSpacing: "-0.035em", color: B.white }}>
                  {ln.map((w, wi) => {
                    const i = k++;
                    const f = beats[i] ?? spec.from;
                    const a = g - f;
                    const p = a < 0 ? 0 : iv(a, [0, 10], [0, 1], EASE_OUT);
                    const isAcc = i === accI;
                    const lit = isAcc && g >= accentF;
                    const accHot = lit ? decay(g - accentF, 7) : 0;
                    const pop = isAcc && lit ? 1 + 0.14 * accHot : 1;
                    const ul = lit ? iv(g - accentF, [0, 12], [0, 1], EASE_OUT) : 0;
                    return (
                      <span
                        key={wi}
                        style={{
                          position: "relative",
                          display: "inline-block",
                          marginRight: wi < ln.length - 1 ? "0.24em" : 0,
                          opacity: iv(p, [0, 0.3], [0, 1]),
                          transform: `translateY(${((1 - p) * 22).toFixed(1)}px) scale(${((1.32 - 0.32 * p) * pop).toFixed(4)})`,
                          transformOrigin: "50% 65%",
                          filter: p < 0.99 ? `blur(${((1 - p) * 12).toFixed(1)}px)` : undefined,
                          color: lit ? B.amber : B.white,
                          textShadow: lit
                            ? `0 0 ${(26 + 40 * accHot).toFixed(0)}px rgba(245,158,11,${(0.55 + 0.35 * accHot).toFixed(3)}), 0 4px 18px rgba(0,0,0,0.7)`
                            : `0 4px 22px rgba(0,0,0,0.75), 0 0 ${(20 + 30 * decay(a, 5)).toFixed(0)}px rgba(34,211,238,${(0.12 + 0.4 * decay(a, 5)).toFixed(3)})`,
                        }}
                      >
                        {w}
                        {isAcc && ul > 0 ? (
                          <span style={{ position: "absolute", left: "2%", bottom: size * 0.02, height: Math.max(5, size * 0.065), width: `${(96 * ul).toFixed(1)}%`, borderRadius: 4, background: B.amber, boxShadow: `0 0 16px ${B.amberGlow}` }} />
                        ) : null}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </AbsoluteFill>
          <Shockwave age={g - land} x={540} y={TILE_Y} dur={26} strength={0.6} maxR={1200} r0={150} />
          <AnamorphicFlare age={g - land} x={540} y={TILE_Y} dur={36} strength={0.7} size={170} />
          {Number.isFinite(accentF) ? <AnamorphicFlare age={g - accentF} x={540} y={TILE_Y} col={AMBER_HOT} dur={26} strength={0.35} size={120} streakH={90} /> : null}
          {/* frame-0 light: the hook opens already lit (a soft radial pop, no white wash) */}
          {local < 8 ? <AbsoluteFill style={{ mixBlendMode: "screen", background: `radial-gradient(circle 900px at 540px ${TILE_Y}px, rgba(190,245,255,${(0.42 * (1 - local / 8)).toFixed(3)}) 0%, rgba(34,211,238,${(0.18 * (1 - local / 8)).toFixed(3)}) 45%, rgba(34,211,238,0) 100%)` }} /> : null}
          {hot > 0 ? <AbsoluteFill style={{ background: `rgba(190,245,255,${(0.9 * hot).toFixed(3)})` }} /> : null}
        </AbsoluteFill>
      ) : null}
      {dot > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 70,
            top: SUCK_Y - 70,
            width: 140,
            height: 140,
            borderRadius: "50%",
            opacity: dot,
            transform: `scale(${(0.25 + 0.75 * dot).toFixed(3)})`,
            background: "radial-gradient(closest-side, #ffffff 0%, rgba(34,211,238,0.85) 25%, rgba(34,211,238,0.2) 60%, rgba(34,211,238,0) 100%)",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
