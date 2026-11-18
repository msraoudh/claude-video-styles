import React from "react";
import type { Archetype } from "..";
import type { SceneSpec } from "../../data/episode";
import { PHRASES } from "../../data/voice";
import { B } from "../../lib/look";
import { onWord, speechSpan } from "../../lib/episode";
import { beatPulse, useGlobalFrame } from "../../lib/sync";
import {
  AMBER, clamp01, CYAN, EO, fitBlock, fr, Glyph, GREYC, IconTile, INTER, isCodeLine, kick, kickAny, lin, MONO, norm, OK, pop, rgba, Shell, Sparks, Stage, Streak, Tag, textW, TONE, type Tone, useFontsReady, Words,
} from "./fx";

/**
 * archetype « compare » — two glass panels stacked top / bottom (readable in 9:16) + an optional verdict pill.
 *   data = { mode: "vs" | "before_after",
 *            left:  { label, points: string[1–3], icon?, on?, tag? },
 *            right: { label, points: string[1–3], icon?, on?, tag? },
 *            verdict?: { text, on?, accent? } }
 * before_after: top = the old way (grey glass, ✕ markers; its points get struck when the new way lands), bottom =
 *   the new way (cyan, green checks ticking one by one). vs: both neutral, top cyan / bottom periwinkle, a « VS »
 *   badge, the verdict = the decision rule with ONE amber key word (accent, else the word matching a label, else the
 *   last word). Both panel frames slide in at the scene start (motion < 0.5 s), their content lands on its word.
 */
type Side = { label: string; points: string[]; icon?: string; on?: string; tag?: string };
const X0 = 95;
const PW = 830;
const TOP = 250;
const IC = 104; // header icon tile
const RH = 58; // min point row height
const BOTTOM = 1262;

const side = (x: unknown, dflt: string): Side => {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const pts = Array.isArray(o.points) ? (o.points as unknown[]).map(fr).filter(Boolean).slice(0, 3) : [];
  return { label: fr(o.label) || dflt, points: pts, icon: typeof o.icon === "string" ? o.icon : undefined, on: typeof o.on === "string" ? o.on : undefined, tag: typeof o.tag === "string" ? fr(o.tag) : undefined };
};

/** first word of the n-th phrase of the scene (fallback beat for « the second half ») */
const phraseStart = (spec: SceneSpec, n: number) => {
  const id = spec.phrases[n];
  const p = id ? PHRASES.find((x) => x.id === id) : undefined;
  return p && p.words.length ? p.words[0].f : undefined;
};

type PanelGeo = { y: number; h: number; head: number; rows: { y: number; fit: ReturnType<typeof fitBlock> }[]; label: ReturnType<typeof fitBlock>; mono: boolean; tagW: number };

const measurePanel = (s: Side, tag: string, ptMax: number): Omit<PanelGeo, "y"> => {
  const tagW = tag ? tag.length * 22 * 0.78 + 60 : 0;
  const mono = isCodeLine(s.label);
  const label = fitBlock(s.label, { maxW: PW - 36 - IC - 26 - 36 - tagW, maxLines: 1, max: 84, min: 36, family: mono ? MONO : INTER, weight: mono ? 700 : 800, ls: mono ? -0.02 : -0.04, lh: 1.05 });
  const head = 34 + IC;
  let y = head + 22;
  const rows = s.points.map((pt) => {
    const fit = fitBlock(pt, { maxW: PW - 36 - 54 - 24 - 40, maxLines: 2, max: ptMax, min: 28, family: INTER, weight: 600, ls: -0.015, lh: 1.18 });
    const r = { y, fit };
    y += Math.max(RH, fit.height) + 20;
    return r;
  });
  return { h: y + 8, head, rows, label, mono, tagW };
};

const Panel: React.FC<{
  g: number;
  s: Side;
  geo: PanelGeo;
  tone: Tone;
  tag: string;
  enter: number;
  land: number;
  from: -1 | 1;
  kind: "old" | "new" | "neutral";
  strikeAt?: number;
  dim: number;
  active: boolean;
}> = ({ g, s, geo, tone, tag, enter, land, from, kind, strikeAt, dim, active }) => {
  const e = EO(lin(g, enter, enter + 18));
  const lp = EO(lin(g, land - 2, land + 14));
  const flash = kick(g, land, 10) + (active ? 0.08 * beatPulse(g, 14) : 0);
  const ac = TONE[tone];
  const drift = Math.sin(g * 0.033 + (from > 0 ? 2 : 0)) * 3;
  const sc = (0.95 + 0.05 * e) * (1 - 0.03 * dim);
  const ry = (1 - e) * 10 * from + Math.sin(g * 0.02 + from) * 1.2;
  const pending = 1 - lp;
  const labelCol = kind === "old" ? "rgba(226,236,250,0.82)" : B.white;
  return (
    <div style={{ position: "absolute", left: X0, top: geo.y, width: PW, height: geo.h, opacity: e, transform: `translate(${((1 - e) * 80 * from).toFixed(1)}px, ${drift.toFixed(2)}px) scale(${sc.toFixed(4)})`, filter: e < 0.97 ? `blur(${((1 - e) * 14).toFixed(2)}px)` : undefined }}>
      <div style={{ position: "absolute", inset: 0, transform: `perspective(2200px) rotateY(${ry.toFixed(2)}deg)` }}>
        <Shell w={PW} h={geo.h} tone={tone} flash={flash} sheen={lin(g, land, land + 30)} glow={(0.5 + 0.5 * lp) * (1 - 0.5 * dim)} lx={26 + Math.sin(g * 0.018) * 14} ly={12}>
          {/* header */}
          <div style={{ position: "absolute", left: 36, top: 34, transform: `scale(${(0.6 + 0.4 * Math.max(pop(g, land, 16), 0.0001) * lp + 0.4 * (1 - lp) * 0.9).toFixed(3)})`, transformOrigin: "0 0" }}>
            <IconTile name={s.icon} size={IC} tone={tone} draw={EO(lin(g, land, land + 22))} glow={active ? 0.2 + 0.3 * beatPulse(g, 14) : 0} fallback={kind === "old" ? "clock" : kind === "new" ? "sparkle" : "cube"} />
          </div>
          {/* label (placeholder shimmer bar until its word) */}
          {pending > 0.01 ? (
            <div style={{ position: "absolute", left: 36 + IC + 26, top: 34 + IC / 2 - 14, width: 260, height: 28, borderRadius: 14, background: `linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,${(0.1 + 0.06 * Math.sin(g * 0.15)).toFixed(3)}), rgba(255,255,255,0.06))`, opacity: pending }} />
          ) : null}
          <div
            style={{
              position: "absolute",
              left: 36 + IC + 26,
              top: 34,
              height: IC,
              display: "flex",
              alignItems: "center",
              fontFamily: geo.mono ? MONO : INTER,
              fontWeight: geo.mono ? 700 : 800,
              fontSize: geo.label.size,
              letterSpacing: geo.mono ? "-0.02em" : "-0.04em",
              color: labelCol,
              whiteSpace: "pre",
              opacity: lp * (1 - (kind === "old" ? 0.45 : 0.3) * dim),
              transform: `translateX(${((1 - lp) * -24).toFixed(1)}px)`,
              filter: lp < 0.98 ? `blur(${((1 - lp) * 10).toFixed(2)}px)` : undefined,
              textShadow: kind !== "old" && active ? `0 0 28px ${rgba(ac, 0.35)}` : "0 4px 20px rgba(0,0,0,0.5)",
            }}
          >
            {geo.label.lines[0] ?? ""}
          </div>
          {tag ? (
            <div style={{ position: "absolute", right: 30, top: 34 + IC / 2 - 24 }}>
              <Tag text={tag} p={lin(g, enter + 4, enter + 18)} tone={tone} size={20} />
            </div>
          ) : null}
          <div style={{ position: "absolute", left: 36, right: 36, top: geo.head + 10, height: 1, background: `linear-gradient(90deg, ${rgba(kind === "old" ? GREYC : ac, 0.3)}, rgba(255,255,255,0.03))`, opacity: e }} />
          {/* pending: shimmer bars where the points will land */}
          {pending > 0.01
            ? geo.rows.map((r, k) => (
                <div key={`ph${k}`} style={{ position: "absolute", left: 36 + 78, top: r.y + Math.max(RH, r.fit.height) / 2 - 11, width: 300 + ((k * 137) % 160), height: 22, borderRadius: 11, background: `linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,${(0.09 + 0.05 * Math.sin(g * 0.15 - k)).toFixed(3)}), rgba(255,255,255,0.05))`, opacity: pending * e }}>
                  <div style={{ position: "absolute", left: -78, top: -16, width: 54, height: 54, borderRadius: 27, border: "2px solid rgba(255,255,255,0.12)" }} />
                </div>
              ))
            : null}
          {/* points */}
          {geo.rows.map((r, k) => {
            const at = land + 8 + k * 7;
            const q = EO(lin(g, at, at + 14));
            const st = strikeAt !== undefined ? EO(lin(g, strikeAt + k * 6, strikeAt + k * 6 + 14)) : 0;
            const tick = kind === "new" ? EO(lin(g, land + 12 + k * 10, land + 26 + k * 10)) : 0;
            const tk = kind === "new" ? pop(g, land + 12 + k * 10, 14) : 0;
            const txtCol = kind === "old" ? `rgba(226,236,250,${(0.78 - 0.34 * st).toFixed(3)})` : B.white;
            return (
              <div key={k} style={{ position: "absolute", left: 36, top: r.y, width: PW - 72, height: Math.max(RH, r.fit.height), opacity: q * (1 - 0.25 * dim), transform: `translateY(${((1 - q) * 16).toFixed(1)}px)` }}>
                {/* marker */}
                <div style={{ position: "absolute", left: 0, top: Math.max(RH, r.fit.height) / 2 - 27, width: 54, height: 54 }}>
                  {kind === "old" ? (
                    <div style={{ width: 48, height: 48, borderRadius: 24, border: "2.5px solid rgba(203,213,225,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width={26} height={26} viewBox="0 0 28 28">
                        <path d="M8 8 L20 20" stroke="rgba(203,213,225,0.7)" strokeWidth={3.4} strokeLinecap="round" strokeDasharray={18} strokeDashoffset={18 * (1 - clamp01(q * 2))} />
                        <path d="M20 8 L8 20" stroke="rgba(203,213,225,0.7)" strokeWidth={3.4} strokeLinecap="round" strokeDasharray={18} strokeDashoffset={18 * (1 - clamp01(q * 2 - 1))} />
                      </svg>
                    </div>
                  ) : kind === "new" ? (
                    <div style={{ width: 48, height: 48, borderRadius: 24, border: `2.5px solid ${tick > 0 ? B.ok : rgba(OK, 0.4)}`, background: rgba(OK, 0.92 * tick), boxShadow: tick > 0 ? `0 0 ${(12 + 26 * kick(g, land + 12 + k * 10, 12)).toFixed(1)}px ${rgba(OK, 0.55)}` : "none", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${(0.8 + 0.2 * Math.max(tk, q * 0.9)).toFixed(3)})` }}>
                      <svg width={28} height={28} viewBox="0 0 28 28">
                        <path d="M6 14.5 L11.5 20 L22 8.5" fill="none" stroke={B.ink} strokeWidth={3.8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={30 * (1 - tick)} />
                      </svg>
                    </div>
                  ) : (
                    <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 14, height: 14, borderRadius: 7, background: `rgb(${ac})`, boxShadow: `0 0 14px ${rgba(ac, 0.7)}`, transform: `scale(${(0.4 + 0.6 * pop(g, at, 12)).toFixed(3)})` }} />
                    </div>
                  )}
                </div>
                {/* text + strike */}
                <div style={{ position: "absolute", left: 54 + 24, top: (Math.max(RH, r.fit.height) - r.fit.height) / 2, whiteSpace: "pre", lineHeight: 1.18 }}>
                  {r.fit.lines.map((l, li) => {
                    const lw = Math.min(PW - 72 - 78, textW(l, r.fit.size, INTER, 600, -0.015) + 8);
                    return (
                      <div key={li} style={{ position: "relative" }}>
                        <Words text={l} size={r.fit.size} color={txtCol} weight={600} ls={-0.015} />
                        {st > 0 ? <div style={{ position: "absolute", left: -6, top: "54%", height: 4, width: (lw + 6) * st, borderRadius: 2, background: "rgba(203,213,225,0.75)", boxShadow: "0 0 8px rgba(0,0,0,0.4)" }} /> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </Shell>
      </div>
    </div>
  );
};

export const Compare: Archetype = ({ spec }) => {
  useFontsReady();
  const g = useGlobalFrame();
  const d = (spec.data ?? {}) as Record<string, unknown>;
  const vs = d.mode === "vs";
  const L = side(d.left, vs ? "A" : "Avant");
  const R = side(d.right, vs ? "B" : "Après");
  const vd = (d.verdict && typeof d.verdict === "object" ? d.verdict : null) as Record<string, unknown> | null;
  const verdict = vd && fr(vd.text) ? { text: fr(vd.text), on: typeof vd.on === "string" ? vd.on : undefined, accent: typeof vd.accent === "string" ? vd.accent : undefined } : null;
  const tagL = L.tag ?? (vs ? "" : "Avant");
  const tagR = R.tag ?? (vs ? "" : "Maintenant");

  // ── beats ──
  const [s0, s1] = speechSpan(spec);
  let lB = (onWord(spec, L.on) ?? s0) - 2;
  let rB = (onWord(spec, R.on) ?? phraseStart(spec, 1) ?? Math.round(s0 + (s1 - s0) * 0.4)) - 2;
  let vB = verdict ? (onWord(spec, verdict.on) ?? Math.round(s0 + (s1 - s0) * 0.78)) - 2 : spec.to;
  lB = Math.max(spec.from + 12, Math.min(lB, spec.to - 120));
  rB = Math.max(lB + 24, Math.min(rB, spec.to - 70));
  if (verdict) vB = Math.max(rB + 26, Math.min(vB, spec.to - 30));
  const enterL = spec.from + 2;
  const enterR = spec.from + 9;

  // ── layout: points 50 → 42 px first, then the whole group scales down uniformly (never below 0.72) so it always
  //    fits between y 250 and 1262 (the caption band starts at 1300) ──
  const GAP = 112;
  const vFit = (max: number) => fitBlock(verdict ? verdict.text : "", { maxW: PW - 150, maxLines: 2, max, min: 32, family: INTER, weight: 800, ls: -0.035, lh: 1.1, balance: true });
  let gl = measurePanel(L, tagL, 50);
  let gr = measurePanel(R, tagR, 50);
  let vf = vFit(64);
  const total = () => gl.h + GAP + gr.h + (verdict ? 40 + vf.height + 46 : 0);
  for (const pm of [46, 42]) {
    if (total() <= BOTTOM - TOP) break;
    gl = measurePanel(L, tagL, pm);
    gr = measurePanel(R, tagR, pm);
    vf = vFit(pm + 10);
  }
  const K = Math.max(0.72, Math.min(1, (BOTTOM - TOP) / total()));
  const y0 = TOP + Math.max(0, (BOTTOM - TOP - total() * K) * 0.42) / K;
  const geoL: PanelGeo = { ...gl, y: y0 };
  const geoR: PanelGeo = { ...gr, y: y0 + gl.h + GAP };
  const vY = geoR.y + gr.h + 40;
  const vH = vf.height + 46;

  const toneL: Tone = vs ? "cyan" : "grey";
  const toneR: Tone = vs ? "peri" : "cyan";
  const leftDim = vs ? 0.5 * EO(lin(g, rB, rB + 16)) * (1 - EO(lin(g, vB, vB + 20))) : EO(lin(g, rB, rB + 18));
  const rightDim = 0;

  // ── badge between the panels ──
  const bx = X0 + PW / 2;
  const by = geoL.y + gl.h + GAP / 2;
  const badgeAt = vs ? spec.from + 14 : rB - 10;
  const bp = pop(g, badgeAt, 16);
  const flow = (g * 0.02) % 1;

  // ── verdict: ONE amber key word ──
  const labels = [R.label, L.label].map(norm);
  const words = verdict ? verdict.text.split(/ +/) : [];
  let keyIdx = -1;
  if (verdict?.accent) keyIdx = words.findIndex((w) => norm(w) === norm(verdict.accent ?? ""));
  if (keyIdx < 0) keyIdx = words.findIndex((w) => norm(w) !== "" && labels.indexOf(norm(w)) >= 0);
  if (keyIdx < 0) {
    for (let k = words.length - 1; k >= 0; k--)
      if (norm(words[k]).length > 2) {
        keyIdx = k;
        break;
      }
  }
  const keyWord = keyIdx >= 0 ? words[keyIdx] : "";
  const keyMono = keyWord && labels.indexOf(norm(keyWord)) >= 0 && (isCodeLine(R.label) || isCodeLine(L.label));
  const vp = EO(lin(g, vB - 6, vB + 12));
  const vk = kick(g, vB + 2, 14);
  const vw = Math.min(PW, vf.width + 150);

  const hits = [lB, rB, ...(verdict ? [vB] : [])];
  return (
    <Stage
      g={g}
      from={spec.from}
      to={spec.to}
      hit={kickAny(g, hits, 12)}
      shake={kickAny(g, [rB, vB], 4) * 0.7}
      seed={5}
      warm={verdict ? 0.6 * EO(lin(g, vB, vB + 30)) : 0}
      focusY={46}
      over={
        <>
          <Streak g={g} at={rB + 1} dir={1} k={0.8} />
          {verdict ? <Streak g={g} at={vB + 1} dir={-1} k={0.9} /> : null}
        </>
      }
    >
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: K < 1 ? `scale(${K.toFixed(4)})` : undefined, transformOrigin: `${X0 + PW / 2}px ${TOP}px` }}>
      <Panel g={g} s={L} geo={geoL} tone={toneL} tag={tagL} enter={enterL} land={lB} from={-1} kind={vs ? "neutral" : "old"} strikeAt={vs ? undefined : rB + 8} dim={leftDim} active={g < rB} />
      {/* connector + badge */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
        <line x1={bx} x2={bx} y1={geoL.y + gl.h + 6} y2={geoR.y - 6} stroke={rgba(CYAN, 0.35 * EO(lin(g, badgeAt - 6, badgeAt + 10)))} strokeWidth={2.5} strokeDasharray="2 10" strokeLinecap="round" />
        {!vs && g >= rB - 4 ? <circle cx={bx} cy={geoL.y + gl.h + 6 + (GAP - 12) * flow} r={5} fill={B.cyan} fillOpacity={0.9 * Math.sin(flow * Math.PI)} /> : null}
      </svg>
      <div style={{ position: "absolute", left: bx - 44, top: by - 44, width: 88, height: 88, borderRadius: 44, background: "rgba(8,16,34,0.9)", border: `1.5px solid ${rgba(CYAN, 0.5)}`, boxShadow: `0 0 ${(20 + 40 * kick(g, badgeAt + 4, 12) + 12 * beatPulse(g, 14)).toFixed(1)}px ${rgba(CYAN, 0.35)}, inset 0 1px 0 rgba(255,255,255,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${(0.3 + 0.7 * bp).toFixed(3)}) rotate(${((1 - bp) * -40).toFixed(1)}deg)`, opacity: clamp01(bp * 3) }}>
        {vs ? (
          <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, color: B.white, letterSpacing: "0.02em" }}>VS</span>
        ) : (
          <Glyph name="arrowdown" size={44} color={B.cyan} draw={EO(lin(g, badgeAt, badgeAt + 16))} sw={6} />
        )}
        <svg width={112} height={112} viewBox="0 0 112 112" style={{ position: "absolute", left: -12, top: -12, transform: `rotate(${(g * 0.6).toFixed(1)}deg)` }}>
          <circle cx={56} cy={56} r={53} fill="none" stroke={rgba(CYAN, 0.35)} strokeWidth={1.5} strokeDasharray="4 12" />
        </svg>
      </div>
      <Panel g={g} s={R} geo={geoR} tone={toneR} tag={tagR} enter={enterR} land={rB} from={1} kind={vs ? "neutral" : "new"} dim={rightDim} active={g >= rB} />
      {!vs ? <Sparks g={g} at={rB + 4} x={X0 + 36 + IC / 2} y={geoR.y + 34 + IC / 2} r={130} n={12} rgb={CYAN} seed={7} /> : null}
      {/* verdict */}
      {verdict && g >= vB - 6 ? (
        <div style={{ position: "absolute", left: X0 + (PW - vw) / 2, top: vY, width: vw, height: vH, opacity: clamp01(vp * 1.5), transform: `translateY(${((1 - vp) * 30).toFixed(1)}px) scale(${(0.86 + 0.14 * pop(g, vB - 4, 16)).toFixed(3)})`, filter: vp < 0.97 ? `blur(${((1 - vp) * 12).toFixed(2)}px)` : undefined }}>
          <Shell w={vw} h={vH} tone="cyan" flash={vk} sheen={lin(g, vB + 2, vB + 32)} radius={Math.min(vH / 2, 46)} glow={1 + 0.3 * beatPulse(g, 14)}>
            <div style={{ position: "absolute", left: 34, top: vH / 2 - 30 }}>
              <Glyph name={vs ? "scales" : "arrowright"} size={60} color={B.cyan} draw={EO(lin(g, vB, vB + 18))} sw={5.4} />
            </div>
            <div style={{ position: "absolute", left: 116, top: 23, whiteSpace: "pre", lineHeight: 1.1, fontFamily: INTER, fontWeight: 800, fontSize: vf.size, letterSpacing: "-0.035em", color: B.white }}>
              {vf.lines.map((l, li) => {
                const before = vf.lines.slice(0, li).reduce((n, x) => n + x.split(/ +/).length, 0);
                return (
                  <div key={li}>
                    <Words
                      text={l}
                      size={vf.size}
                      color={B.white}
                      accent={(_w, i) =>
                        before + i === keyIdx
                          ? { color: B.amber, textShadow: `0 0 ${(18 + 30 * vk).toFixed(1)}px ${rgba(AMBER, 0.45 + 0.3 * vk)}`, ...(keyMono ? { fontFamily: MONO, fontWeight: 700, fontSize: vf.size * 0.92 } : {}) }
                          : null
                      }
                    />
                  </div>
                );
              })}
            </div>
          </Shell>
        </div>
      ) : null}
      </div>
    </Stage>
  );
};
