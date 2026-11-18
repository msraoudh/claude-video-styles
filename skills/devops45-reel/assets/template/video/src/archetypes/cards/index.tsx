import React from "react";
import type { Archetype } from "..";
import { B } from "../../lib/look";
import { beatsFor } from "../../lib/episode";
import { beatPulse, useGlobalFrame } from "../../lib/sync";
import {
  clamp01, CYAN, Cursor, EO, fitBlock, fr, Glyph, IconTile, INTER, isCodeLine, isCodeToken, kick, kickAny, lin, MONO, pop, rgba, Shell, Stage, Streak, useFontsReady,
} from "./fx";

/**
 * archetype « cards » — 1–5 glass cards (a flag, a service, a metric…) that land one by one ON their spoken word.
 *   data = { heading?: string, items: [{ icon?: string, label: string, detail?: string, on?: string }] }
 * Layout adapts to the count: 1 = one hero tile, 2 = two tall tiles side by side, 3 = three wide rows, 4 = 2×2 grid,
 * 5 = a list of slim rows. At the scene start the heading types/blurs in and the empty slots draw (motion < 0.5 s);
 * each card flies in on its beat (blur 14→0, rise, scale .94→1), rim flash + icon draw-on + sheen + the cyan light
 * streak, the previous card settles back (scale .965, dimmer). A flag label (« -t ») also lights its letter in a
 * command heading (« ss -tulpn »).
 */
type Item = { icon?: string; label: string; detail: string; on?: string };
type Rect = { x: number; y: number; w: number; h: number };

const X0 = 95;
const W = 830; // content x 95 → 925 (≤ 940 below y 1000 even at the 1.03 camera push)
const BOTTOM = 1262;

const layout = (n: number, top: number): { rects: Rect[]; variant: "tile" | "row" } => {
  const avail = BOTTOM - top;
  const rects: Rect[] = [];
  if (n <= 2) {
    const gap = 36;
    const w = n === 1 ? 600 : (W - gap) / 2;
    const h = Math.min(n === 1 ? 600 : 640, avail);
    const y = top + (avail - h) * 0.42;
    for (let i = 0; i < n; i++) rects.push({ x: n === 1 ? X0 + (W - w) / 2 : X0 + i * (w + gap), y, w, h });
    return { rects, variant: "tile" };
  }
  if (n === 4) {
    const gap = 34;
    const w = (W - gap) / 2;
    const h = Math.min(410, (avail - gap) / 2);
    const y0 = top + (avail - (2 * h + gap)) * 0.42;
    for (let i = 0; i < 4; i++) rects.push({ x: X0 + (i % 2) * (w + gap), y: y0 + Math.floor(i / 2) * (h + gap), w, h });
    return { rects, variant: "tile" };
  }
  const gap = n === 3 ? 30 : 22;
  const h = Math.min(n === 3 ? 250 : 168, (avail - (n - 1) * gap) / n);
  const y0 = top + (avail - (n * h + (n - 1) * gap)) * 0.42;
  for (let i = 0; i < n; i++) rects.push({ x: X0, y: y0 + i * (h + gap), w: W, h });
  return { rects, variant: "row" };
};

/** label typography: flags / paths / code → mono; words → Inter 800 */
const labelFont = (label: string) => (isCodeToken(label) || isCodeLine(label) ? { family: MONO, weight: 700, ls: -0.02 } : { family: INTER, weight: 800, ls: -0.04 });

/** « -t » → dash cyan, letter white */
const LabelText: React.FC<{ text: string; mono: boolean }> = ({ text, mono }) => {
  const m = mono ? /^(--?)(.+)$/.exec(text) : null;
  if (!m) return <>{text}</>;
  return (
    <>
      <span style={{ color: B.cyan, textShadow: `0 0 22px ${rgba(CYAN, 0.5)}` }}>{m[1]}</span>
      {m[2]}
    </>
  );
};

const Card: React.FC<{ g: number; it: Item; i: number; n: number; r: Rect; variant: "tile" | "row"; b: number; settle: number; active: boolean }> = ({ g, it, i, n, r, variant, b, settle, active }) => {
  const p = EO(lin(g, b - 8, b + 12));
  const op = lin(g, b - 8, b + 1);
  const flash = kick(g, b + 1, 10) * (1 - settle) + (active ? 0.1 * beatPulse(g, 14) : 0);
  const sheen = lin(g, b + 1, b + 30);
  const ip = pop(g, b, 16);
  const draw = EO(lin(g, b, b + 22));
  const lp = EO(lin(g, b + 1, b + 15));
  const dp = EO(lin(g, b + 6, b + 20));
  const drift = Math.sin(g * 0.035 + i * 1.7) * 3.5;
  const ry = Math.sin(g * 0.021 + i * 2.1) * 1.4 + (1 - p) * (i % 2 ? -8 : 8);
  const rx = Math.cos(g * 0.019 + i) * 1.1 + (1 - p) * 10;
  const sc = (0.94 + 0.06 * p) * (1 - 0.035 * settle);
  const content = 1 - 0.32 * settle;
  const lf = labelFont(it.label);
  const mono = lf.family === MONO;
  const num = String(i + 1).length < 2 ? `0${i + 1}` : String(i + 1);

  let body: React.ReactNode;
  if (variant === "tile") {
    const S = Math.round(Math.min(n <= 2 ? 140 : 118, r.h * 0.29));
    const pad = n <= 2 ? 40 : 34;
    const dFit = fitBlock(it.detail, { maxW: r.w - pad * 2, maxLines: 2, max: n <= 2 ? 50 : 44, min: 28, family: INTER, weight: 600, ls: -0.01, lh: 1.16, balance: true });
    const dTop = r.h - pad - dFit.height;
    const lTopMin = pad + S + 22;
    const room = (it.detail ? dTop - 10 : r.h - pad) - lTopMin;
    const lFit = fitBlock(it.label, { maxW: r.w - pad * 2, maxLines: mono ? 1 : 2, max: Math.min(n <= 2 ? 190 : 156, room / (mono ? 1.02 : 2.04)), min: 40, family: lf.family, weight: lf.weight, ls: lf.ls, lh: 1.02, balance: true });
    const lTop = (it.detail ? dTop - 10 : r.h - pad) - lFit.height;
    body = (
      <>
        <div style={{ position: "absolute", left: pad, top: pad, transform: `scale(${(0.55 + 0.45 * ip).toFixed(3)})`, transformOrigin: "30% 30%" }}>
          <IconTile name={it.icon} size={S} draw={draw} glow={active ? 0.25 + 0.35 * beatPulse(g, 14) : 0} />
        </div>
        {room > 150 ? (
          <div style={{ position: "absolute", right: -r.w * 0.12, top: pad + S * 0.2, opacity: 0.07 + 0.05 * flash, transform: `rotate(${(-12 + Math.sin(g * 0.02 + i) * 3).toFixed(2)}deg) translateY(${(Math.sin(g * 0.03 + i) * 6).toFixed(1)}px)` }}>
            <Glyph name={it.icon} size={r.w * 0.62} color={B.cyan} draw={draw} sw={3} />
          </div>
        ) : null}
        <div style={{ position: "absolute", right: pad, top: pad, lineHeight: `${S}px`, fontFamily: MONO, fontWeight: 700, fontSize: 26, color: active ? B.cyan : B.text3, opacity: lp }}>{num}</div>
        <div
          style={{
            position: "absolute",
            left: pad,
            top: lTop,
            fontFamily: lf.family,
            fontWeight: lf.weight,
            fontSize: lFit.size,
            lineHeight: 1.02,
            letterSpacing: `${lf.ls}em`,
            color: B.white,
            whiteSpace: "pre",
            opacity: lp * content + (1 - content) * 0.6 * lp,
            transform: `translateX(${((1 - lp) * -26).toFixed(1)}px)`,
            filter: lp < 0.98 ? `blur(${((1 - lp) * 10).toFixed(2)}px)` : undefined,
            textShadow: active ? `0 0 30px ${rgba(CYAN, 0.25 + 0.2 * flash)}` : "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          {lFit.lines.map((l, k) => (
            <div key={k}>
              <LabelText text={l} mono={mono} />
            </div>
          ))}
        </div>
        {it.detail ? (
          <div style={{ position: "absolute", left: pad, top: dTop, fontFamily: INTER, fontWeight: 600, fontSize: dFit.size, lineHeight: 1.16, letterSpacing: "-0.01em", color: active ? "rgba(226,236,250,0.9)" : B.text2, whiteSpace: "pre", opacity: dp * content, transform: `translateY(${((1 - dp) * 14).toFixed(1)}px)` }}>
            {dFit.lines.join("\n")}
          </div>
        ) : null}
        <AccentBar g={g} b={b} active={active} x={pad} y={r.h - 14} w={r.w - pad * 2} />
      </>
    );
  } else {
    const S = Math.round(Math.min(r.h - 52, 124));
    const pad = 28;
    const tx = pad + S + 30;
    const tw = r.w - tx - 92;
    const big = r.h >= 200;
    const lFit = fitBlock(it.label, { maxW: tw, maxLines: 1, max: big ? 92 : 64, min: 32, family: lf.family, weight: lf.weight, ls: lf.ls, lh: 1.04 });
    const dFit = fitBlock(it.detail, { maxW: tw, maxLines: big ? 2 : 1, max: big ? 40 : 32, min: 24, family: INTER, weight: 600, ls: -0.01, lh: 1.16 });
    const blockH = lFit.height + (it.detail ? 8 + dFit.height : 0);
    const top = (r.h - blockH) / 2;
    body = (
      <>
        <div style={{ position: "absolute", left: pad, top: (r.h - S) / 2, transform: `scale(${(0.55 + 0.45 * ip).toFixed(3)})` }}>
          <IconTile name={it.icon} size={S} draw={draw} glow={active ? 0.25 + 0.35 * beatPulse(g, 14) : 0} />
        </div>
        <div
          style={{
            position: "absolute",
            left: tx,
            top,
            fontFamily: lf.family,
            fontWeight: lf.weight,
            fontSize: lFit.size,
            lineHeight: 1.04,
            letterSpacing: `${lf.ls}em`,
            color: B.white,
            whiteSpace: "pre",
            opacity: lp * (0.68 + 0.32 * content),
            transform: `translateX(${((1 - lp) * -26).toFixed(1)}px)`,
            filter: lp < 0.98 ? `blur(${((1 - lp) * 10).toFixed(2)}px)` : undefined,
            textShadow: active ? `0 0 30px ${rgba(CYAN, 0.25 + 0.2 * flash)}` : "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          <LabelText text={lFit.lines[0] ?? ""} mono={mono} />
        </div>
        {it.detail ? (
          <div style={{ position: "absolute", left: tx, top: top + lFit.height + 8, fontFamily: INTER, fontWeight: 600, fontSize: dFit.size, lineHeight: 1.16, letterSpacing: "-0.01em", color: B.text2, whiteSpace: "pre", opacity: dp * content, transform: `translateY(${((1 - dp) * 12).toFixed(1)}px)` }}>
            {dFit.lines.join("\n")}
          </div>
        ) : null}
        <div style={{ position: "absolute", right: 34, top: 0, lineHeight: `${r.h}px`, fontFamily: MONO, fontWeight: 700, fontSize: big ? 28 : 24, color: active ? B.cyan : B.text3, opacity: lp }}>{num}</div>
      </>
    );
  }

  return (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, opacity: op, transform: `translateY(${((1 - p) * 54 + drift + settle * 4).toFixed(2)}px) scale(${sc.toFixed(4)})`, filter: p < 0.97 ? `blur(${((1 - p) * 14).toFixed(2)}px)` : undefined }}>
      <div style={{ position: "absolute", inset: 0, transform: `perspective(2000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)` }}>
        <Shell w={r.w} h={r.h} flash={flash} sheen={sheen} glow={1 - 0.5 * settle} lx={30 + Math.sin(g * 0.02 + i) * 14} ly={10 + Math.cos(g * 0.017 + i) * 8} radius={variant === "row" && r.h < 190 ? 28 : 36}>
          {body}
        </Shell>
      </div>
    </div>
  );
};

/** thin cyan light line along the bottom of the active card (grows on landing) */
const AccentBar: React.FC<{ g: number; b: number; active: boolean; x: number; y: number; w: number }> = ({ g, b, active, x, y, w }) => {
  const p = EO(lin(g, b + 4, b + 24));
  if (p <= 0 || !active) return null;
  return <div style={{ position: "absolute", left: x, top: y, width: w * p, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${B.cyan}, rgba(34,211,238,0))`, boxShadow: `0 0 14px ${rgba(CYAN, 0.7)}` }} />;
};

/** empty slot outline drawn at the scene start (structure before content) */
const Slot: React.FC<{ g: number; r: Rect; at: number; land: number; i: number }> = ({ g, r, at, land, i }) => {
  const p = EO(lin(g, at, at + 18));
  const gone = lin(g, land - 8, land + 2);
  if (gone >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: r.x,
        top: r.y,
        width: r.w,
        height: r.h,
        borderRadius: 34,
        border: `2px dashed rgba(148,190,255,${(0.26 * p).toFixed(3)})`,
        background: `linear-gradient(165deg, rgba(34,211,238,${(0.06 * p).toFixed(3)}), rgba(34,211,238,0.01))`,
        opacity: 1 - gone,
        transform: `scale(${(0.96 + 0.04 * p).toFixed(4)}) translateY(${(Math.sin(g * 0.035 + i * 1.7) * 3.5).toFixed(2)}px)`,
      }}
    >
      <div style={{ position: "absolute", right: 32, top: 26, fontFamily: MONO, fontWeight: 700, fontSize: 24, color: `rgba(226,236,250,${(0.22 * p).toFixed(3)})` }}>{`0${i + 1}`}</div>
    </div>
  );
};

export const Cards: Archetype = ({ spec }) => {
  useFontsReady();
  const g = useGlobalFrame();
  const d = (spec.data ?? {}) as { heading?: unknown; items?: unknown };
  const heading = fr(d.heading);
  const raw = Array.isArray(d.items) ? (d.items as Record<string, unknown>[]) : [];
  const items: Item[] = raw
    .filter((x) => x && typeof x === "object" && (x.label || x.detail))
    .slice(0, 5)
    .map((x) => ({ icon: typeof x.icon === "string" ? x.icon : undefined, label: fr(x.label || x.detail), detail: x.label ? fr(x.detail) : "", on: typeof x.on === "string" ? x.on : undefined }));
  const n = items.length;
  // beats on the spoken words, kept inside the scene
  const beats = beatsFor(spec, items, 8, 2).map((b, i) => Math.max(spec.from + 10 + i * 6, Math.min(b, spec.to - 34 - (n - 1 - i) * 8)));
  const last = beats.length ? beats[beats.length - 1] : spec.from;
  const activeIdx = beats.reduce((m, b, i) => (g >= b - 2 ? i : m), -1);

  // heading
  const code = heading ? isCodeLine(heading) : false;
  const hText = code ? `$ ${heading}` : heading;
  const hFit = heading
    ? fitBlock(hText, { maxW: W, maxLines: code ? 1 : 2, max: n >= 5 ? 64 : n >= 3 ? 72 : 80, min: 40, family: code ? MONO : INTER, weight: code ? 700 : 800, ls: code ? -0.02 : -0.04, lh: 1.08, balance: true })
    : null;
  const H_Y = 246;
  const top = hFit ? Math.max(380, H_Y + hFit.height + 92) : 300;
  const { rects, variant } = layout(Math.max(1, n), top);

  // the flag letters of a command heading light up when their card lands (« ss -tulpn » + « -t »)
  const lit: { [k: number]: number } = {};
  if (code && heading) {
    items.forEach((it, i) => {
      const m = /^-(\w)$/.exec(it.label);
      if (!m) return;
      const re = /(^| )-(\w+)/g;
      let mm: RegExpExecArray | null;
      while ((mm = re.exec(heading))) {
        const k = mm[2].indexOf(m[1]);
        if (k >= 0) {
          lit[2 + mm.index + mm[1].length + 1 + k] = beats[i];
          break;
        }
      }
    });
  }

  const t0 = spec.from;
  const typeA = t0 + 3;
  const typeB = t0 + 3 + Math.min(26, hText.length * 2.2);
  const hit = kickAny(g, beats, 12);

  return (
    <Stage g={g} from={spec.from} to={spec.to} hit={hit} shake={kickAny(g, beats, 4) * 0.8} seed={3} focusY={42} over={beats.map((b, i) => <Streak key={i} g={g} at={b + 1} dir={i % 2 === 0 ? 1 : -1} k={0.85} />)}>
      {hFit ? (
        <div style={{ position: "absolute", left: X0, top: H_Y }}>
          {code ? (
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: hFit.size, lineHeight: 1.08, letterSpacing: "-0.02em", color: B.white, whiteSpace: "pre" }}>
              {hText
                .slice(0, Math.round(lin(g, typeA, typeB, 0, hText.length)))
                .split("")
                .map((ch, k) => {
                  if (k === 0) return <span key={k} style={{ color: B.amber, textShadow: `0 0 18px ${rgba("245,158,11", 0.45)}` }}>{ch}</span>;
                  const at = lit[k];
                  const on = at !== undefined && g >= at;
                  const kk = on ? kick(g, at, 14) : 0;
                  return (
                    <span key={k} style={{ display: "inline-block", color: on ? B.cyan : B.white, textShadow: on ? `0 0 ${(16 + 26 * kk).toFixed(1)}px ${rgba(CYAN, 0.55 + 0.3 * kk)}` : undefined, transform: `translateY(${(-10 * kk).toFixed(1)}px) scale(${(1 + 0.25 * kk).toFixed(3)})` }}>
                      {ch === " " ? " " : ch}
                    </span>
                  );
                })}
              <Cursor g={g} typing={g < typeB} size={hFit.size} />
            </div>
          ) : (
            <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: hFit.size, lineHeight: 1.08, letterSpacing: "-0.04em", color: B.white, whiteSpace: "pre", textShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
              {hFit.lines.map((l, li) => (
                <div key={li}>
                  {l.split(" ").map((w, wi) => {
                    const q = EO(lin(g, t0 + 2 + (li * 3 + wi) * 4, t0 + 20 + (li * 3 + wi) * 4));
                    return (
                      <span key={wi} style={{ display: "inline-block", marginRight: "0.24em", opacity: q, transform: `translateY(${((1 - q) * 30).toFixed(1)}px)`, filter: q < 0.98 ? `blur(${((1 - q) * 14).toFixed(2)}px)` : undefined }}>
                        {w}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          {/* progress: one segment per card */}
          <div style={{ display: "flex", gap: 8, marginTop: 22, opacity: lin(g, t0 + 6, t0 + 18) }}>
            {items.map((_, k) => {
              const on = k <= activeIdx;
              const cur = k === activeIdx;
              const kk = on ? kick(g, beats[k], 10) : 0;
              return <span key={k} style={{ width: cur ? 46 : 14, height: 8, borderRadius: 4, background: cur ? B.cyan : on ? rgba(CYAN, 0.45) : "rgba(255,255,255,0.18)", boxShadow: cur ? `0 0 ${(10 + 16 * kk).toFixed(1)}px ${rgba(CYAN, 0.6)}` : undefined }} />;
            })}
          </div>
        </div>
      ) : null}
      {items.map((_, i) => (
        <Slot key={`s${i}`} g={g} r={rects[i]} at={t0 + 4 + i * 4} land={beats[i]} i={i} />
      ))}
      {items.map((it, i) => {
        if (g < beats[i] - 8) return null;
        const next = beats[i + 1];
        // previous cards settle back; after the last one, everyone comes back to full light if the scene has time
        let settle = next !== undefined ? EO(lin(g, next - 4, next + 14)) : 0;
        if (spec.to - last > 100) settle *= 1 - EO(lin(g, last + 60 + i * 4, last + 80 + i * 4));
        return <Card key={i} g={g} it={it} i={i} n={n} r={rects[i]} variant={variant} b={beats[i]} settle={clamp01(settle)} active={i === activeIdx} />;
      })}
    </Stage>
  );
};
