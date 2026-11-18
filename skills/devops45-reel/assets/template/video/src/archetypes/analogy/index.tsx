import React from "react";
import { interpolateColors } from "remotion";
import type { Archetype } from "..";
import type { SceneSpec } from "../../data/episode";
import { PHRASES } from "../../data/voice";
import { B } from "../../lib/look";
import { onWord, speechSpan } from "../../lib/episode";
import { beatPulse, useGlobalFrame } from "../../lib/sync";
import { AMBER, clamp01, CYAN, EIO, EO, fitBlock, fr, Glyph, IconTile, INTER, isCodeLine, kick, lin, MONO, pop, rgba, Shell, Sparks, Stage, Streak, useFontsReady } from "./fx";

/**
 * archetype « analogy » — the tech thing ↔ the everyday object (« un port » ↔ « une porte »).
 *   data = { thing: { icon, label }, like: { icon, label }, because?: string, on?: string }
 * 0      the tech card (cyan) flies in; below, a mystery card (grey glass, a breathing « ? »); between them an « = » pill.
 * comme  (the spoken « comme », if any) the pill morphs « = » → « ≈ comme ».
 * on     the tech icon detaches and flies down an arc THROUGH the pill, morphing (cross-fade, blur, cyan → amber) into
 *        the everyday object, which lands with a squash-and-stretch bounce, warm rim flash, amber sparks; a door opens
 *        with warm light, a key turns, a bulb lights (others do a happy hop). Tech = cool cyan, life = warm amber.
 * then   `because` blurs in word by word under the cards (2nd phrase, else ~0.8 s after the morph).
 */
const X0 = 95;
const W = 830;
const CH = 312;
const S = 214; // icon tile
const PAD = 46;
const LX = PAD + S + 40;
const LW = W - LX - 44;

const phraseStart = (spec: SceneSpec, n: number) => {
  const id = spec.phrases[n];
  const p = id ? PHRASES.find((x) => x.id === id) : undefined;
  return p && p.words.length ? p.words[0].f : undefined;
};
const obj = (x: unknown) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {});

export const Analogy: Archetype = ({ spec }) => {
  useFontsReady();
  const g = useGlobalFrame();
  const d = obj(spec.data);
  const th = obj(d.thing);
  const lk = obj(d.like);
  const thing = { icon: typeof th.icon === "string" ? th.icon : undefined, label: fr(th.label) || "…" };
  const like = { icon: typeof lk.icon === "string" ? lk.icon : undefined, label: fr(lk.label) || "…" };
  const because = fr(d.because);

  // ── timing ──
  const [s0, s1] = speechSpan(spec);
  const t0 = spec.from;
  const commeW = onWord(spec, "comme");
  let M = (onWord(spec, typeof d.on === "string" ? d.on : undefined) ?? (commeW !== undefined ? commeW + 30 : Math.round(s0 + (s1 - s0) * 0.42))) - 2;
  M = Math.max(t0 + 46, Math.min(M, spec.to - 70));
  const C = commeW !== undefined && commeW < M ? commeW - 2 : M - 22;
  const fly0 = M - 20;
  let Bc = (phraseStart(spec, 1) ?? M + 48) - 2;
  Bc = Math.max(M + 30, Math.min(Bc, spec.to - 40));

  // ── layout (vertical: tech card · link · life card · because) ──
  const bFit = fitBlock(because, { maxW: W, maxLines: 2, max: 56, min: 34, family: INTER, weight: 600, ls: -0.015, lh: 1.2, balance: true });
  const linkH = 200;
  const total = CH + linkH + CH + (because ? 44 + bFit.height : 0);
  const y0 = Math.max(262, 248 + (1262 - 248 - total) * 0.6);
  const yT = y0;
  const yL = y0 + CH + linkH;
  const yB = yL + CH + 44;
  const iconT = { x: X0 + PAD + S / 2, y: yT + CH / 2 };
  const iconL = { x: X0 + PAD + S / 2, y: yL + CH / 2 };
  const pill = { x: X0 + W / 2, y: yT + CH + linkH / 2 };

  const fitLabel = (s: string) => {
    const mono = isCodeLine(s);
    return { mono, fit: fitBlock(s, { maxW: LW, maxLines: 2, max: 100, min: 44, family: mono ? MONO : INTER, weight: mono ? 700 : 800, ls: mono ? -0.02 : -0.04, lh: 1.04, balance: true }) };
  };
  const lt = fitLabel(thing.label);
  const ll = fitLabel(like.label);

  // ── states ──
  const eT = EO(lin(g, t0 + 2, t0 + 20));
  const eL = EO(lin(g, t0 + 8, t0 + 26));
  const landed = g >= M;
  const land = kick(g, M, 12);
  const bounce = landed ? Math.sin(clamp01((g - M) / 22) * Math.PI * 2.2) * Math.exp(-(g - M) / 14) : 0; // squash & stretch
  const openO = EO(lin(g, M + 16, M + 46)) * 0.88;
  const hop = landed && g > M + 50 ? Math.pow(Math.max(0, Math.sin(((g - M - 50) / 70) * Math.PI * 2)), 3) * 0.6 : 0;
  const warmIn = EO(lin(g, M - 2, M + 14));
  const bp = beatPulse(g, 14);

  // ── flight ──
  const ft = clamp01((g - fly0) / (M - fly0));
  const flying = g >= fly0 && g < M + 1;
  const pathAt = (t: number) => ({ x: iconT.x + Math.sin(t * Math.PI) * (pill.x - iconT.x), y: iconT.y + (iconL.y - iconT.y) * t });
  const gp = pathAt(EIO(ft));
  const ghostCol = interpolateColors(ft, [0, 0.45, 1], [B.cyan, "#BDEFFF", B.amber]);
  const mid = Math.round(fly0 + (M - fly0) / 2);

  // ── pill « = » → « comme » ──
  const pp = pop(g, t0 + 10, 16);
  const toComme = EO(lin(g, C - 2, C + 12));
  const pillFlash = kick(g, mid, 10) + 0.6 * kick(g, C, 12);
  const pillW = 150 + 150 * toComme;

  const card = (kind: "thing" | "like") => {
    const isT = kind === "thing";
    const e = isT ? eT : eL;
    const y = isT ? yT : yL;
    const L = isT ? lt : ll;
    const tone = isT ? "cyan" : g >= M - 2 ? "warm" : "grey";
    const flash = isT ? kick(g, t0 + 6, 12) + 0.5 * kick(g, fly0, 10) + 0.08 * bp : 0.9 * land + 0.08 * bp * warmIn;
    const dr = Math.sin(g * 0.033 + (isT ? 0 : 2)) * 3;
    const lp = isT ? EO(lin(g, t0 + 6, t0 + 22)) : EO(lin(g, M + 2, M + 18));
    const sc = isT ? 1 : 1 + 0.035 * land;
    return (
      <div style={{ position: "absolute", left: X0, top: y, width: W, height: CH, opacity: e, transform: `translate(${((1 - e) * (isT ? -70 : 70)).toFixed(1)}px, ${dr.toFixed(2)}px) scale(${((0.95 + 0.05 * e) * sc).toFixed(4)})`, filter: e < 0.97 ? `blur(${((1 - e) * 14).toFixed(2)}px)` : undefined }}>
        <div style={{ position: "absolute", inset: 0, transform: `perspective(2200px) rotateY(${(Math.sin(g * 0.02 + (isT ? 0 : 1.5)) * 1.3 + (1 - e) * (isT ? -9 : 9)).toFixed(2)}deg)` }}>
          <Shell w={W} h={CH} tone={tone} flash={flash} sheen={isT ? lin(g, t0 + 6, t0 + 36) : lin(g, M, M + 30)} lx={24 + Math.sin(g * 0.017) * 12} ly={14} glow={isT ? 1 : 0.5 + 0.6 * warmIn}>
            {/* icon */}
            <div style={{ position: "absolute", left: PAD, top: (CH - S) / 2 }}>
              {isT ? (
                <div style={{ transform: `scale(${(1 + 0.05 * bp + 0.08 * kick(g, fly0, 10)).toFixed(3)})` }}>
                  <IconTile name={thing.icon} size={S} tone="cyan" draw={EO(lin(g, t0 + 4, t0 + 28))} glow={0.25 + 0.3 * bp} fallback="cube" />
                </div>
              ) : landed ? (
                <div style={{ transform: `translateY(${(-26 * hop).toFixed(1)}px) scale(${(1 + 0.18 * bounce).toFixed(3)}, ${(1 - 0.18 * bounce).toFixed(3)})`, transformOrigin: "50% 100%" }}>
                  <IconTile name={like.icon} size={S} tone="warm" draw={1} o={openO} glow={0.35 * land + 0.2 + 0.25 * bp} fallback="sparkle" />
                </div>
              ) : (
                <div style={{ width: S, height: S, borderRadius: S * 0.29, background: "linear-gradient(160deg, rgba(203,213,225,0.08), rgba(203,213,225,0.02))", border: "1.5px dashed rgba(203,213,225,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: INTER, fontWeight: 800, fontSize: 120, color: "rgba(226,236,250,0.5)", transform: `scale(${(1 + 0.06 * Math.sin(g * 0.12)).toFixed(3)}) rotate(${(Math.sin(g * 0.07) * 6).toFixed(1)}deg)`, display: "inline-block", opacity: 1 - lin(g, fly0, M) }}>?</span>
                </div>
              )}
            </div>
            {/* side caption */}
            <div style={{ position: "absolute", left: LX, top: (CH - 38 - L.fit.height) / 2, fontFamily: INTER, fontWeight: 700, fontSize: 21, letterSpacing: "0.18em", textTransform: "uppercase", color: isT ? rgba(CYAN, 0.85) : landed ? rgba(AMBER, 0.9) : B.text3, opacity: isT ? lp : lin(g, t0 + 14, t0 + 26) }}>{isT ? "Côté tech" : "Dans la vraie vie"}</div>
            {/* label (skeleton until the morph for the life card) */}
            {!isT && lp < 1 ? (
              <div style={{ position: "absolute", left: LX, top: CH / 2 - 14, opacity: (1 - lp) * lin(g, t0 + 14, t0 + 26) }}>
                {[260, 170].map((w, k) => (
                  <div key={k} style={{ width: w, height: 26, marginBottom: 16, borderRadius: 13, background: `linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,${(0.1 + 0.05 * Math.sin(g * 0.15 - k)).toFixed(3)}), rgba(255,255,255,0.05))` }} />
                ))}
              </div>
            ) : null}
            <div
              style={{
                position: "absolute",
                left: LX,
                top: (CH - 38 - L.fit.height) / 2 + 38,
                fontFamily: L.mono ? MONO : INTER,
                fontWeight: L.mono ? 700 : 800,
                fontSize: L.fit.size,
                lineHeight: 1.04,
                letterSpacing: L.mono ? "-0.02em" : "-0.04em",
                color: B.white,
                whiteSpace: "pre",
                opacity: lp,
                transform: `translateX(${((1 - lp) * -24).toFixed(1)}px)`,
                filter: lp < 0.98 ? `blur(${((1 - lp) * 10).toFixed(2)}px)` : undefined,
                textShadow: isT ? `0 0 30px ${rgba(CYAN, 0.25)}` : `0 0 30px ${rgba(AMBER, 0.22 * warmIn)}`,
              }}
            >
              {L.fit.lines.join("\n")}
            </div>
          </Shell>
        </div>
      </div>
    );
  };

  // trail of the flight (stays as a faint dotted link afterwards)
  const trail: React.ReactNode[] = [];
  const steps = 26;
  const head = EIO(ft);
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    if (g < fly0 || (t > head && g < M)) continue;
    const p = pathAt(t);
    const a = g >= M ? 0.32 * EO(lin(g, M, M + 20)) : 0.6 * clamp01(1 - (head - t) * 3);
    trail.push(<circle key={k} cx={p.x} cy={p.y} r={g >= M ? 2.6 : 3.6} fill={interpolateColors(t, [0, 1], [B.cyan, B.amber])} fillOpacity={a} />);
  }

  const lines = because ? bFit.lines : [];
  return (
    <Stage
      g={g}
      from={spec.from}
      to={spec.to}
      hit={kick(g, M, 14) + 0.4 * kick(g, C, 12)}
      shake={kick(g, M, 5)}
      seed={9}
      warm={warmIn}
      focusY={50}
      over={<Streak g={g} at={M + 1} dir={-1} k={0.7} rgb={AMBER} />}
    >
      {card("thing")}
      {card("like")}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
        {trail}
      </svg>
      {/* the « = / comme » pill */}
      <div
        style={{
          position: "absolute",
          left: pill.x - pillW / 2,
          top: pill.y - 44,
          width: pillW,
          height: 88,
          borderRadius: 44,
          background: "rgba(8,16,34,0.88)",
          border: `1.5px solid ${rgba(CYAN, 0.45 + 0.4 * pillFlash)}`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), 0 10px 30px rgba(0,0,0,0.5), 0 0 ${(24 + 50 * pillFlash + 10 * bp).toFixed(1)}px ${rgba(CYAN, 0.25 + 0.35 * pillFlash)}`,
          transform: `scale(${(0.3 + 0.7 * pp).toFixed(3)})`,
          opacity: clamp01(pp * 3),
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 1 - toComme, transform: `scale(${(1 - 0.4 * toComme).toFixed(3)})` }}>
          <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 56, color: B.cyan, textShadow: `0 0 18px ${rgba(CYAN, 0.6)}` }}>=</span>
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, opacity: toComme, transform: `translateY(${((1 - toComme) * 20).toFixed(1)}px)` }}>
          <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 42, color: B.cyan }}>≈</span>
          <span style={{ fontFamily: INTER, fontWeight: 800, fontSize: 46, letterSpacing: "-0.03em", color: B.white }}>comme</span>
        </div>
      </div>
      {/* the morphing ghost (+ a light core) */}
      {flying ? <div style={{ position: "absolute", left: gp.x - 120, top: gp.y - 120, width: 240, height: 240, borderRadius: 120, background: `radial-gradient(circle, ${rgba(ft < 0.5 ? CYAN : AMBER, 0.45)} 0%, rgba(0,0,0,0) 65%)`, mixBlendMode: "screen" }} /> : null}
      {flying ? (
        <div style={{ position: "absolute", left: gp.x - 95, top: gp.y - 95, width: 190, height: 190, transform: `scale(${(1 - 0.35 * Math.sin(ft * Math.PI)).toFixed(3)}) rotate(${(Math.sin(ft * Math.PI) * -14).toFixed(1)}deg)`, filter: `blur(${(Math.sin(ft * Math.PI) * 5).toFixed(2)}px) drop-shadow(0 0 22px ${ghostCol})` }}>
          <div style={{ position: "absolute", inset: 0, opacity: clamp01(1 - ft * 1.7) }}>
            <Glyph name={thing.icon} size={190} color={ghostCol} fallback="cube" sw={5.5} />
          </div>
          <div style={{ position: "absolute", inset: 0, opacity: clamp01((ft - 0.35) / 0.5) }}>
            <Glyph name={like.icon} size={190} color={ghostCol} fallback="sparkle" sw={5.5} />
          </div>
        </div>
      ) : null}
      <Sparks g={g} at={M + 1} x={iconL.x} y={iconL.y} r={190} n={14} rgb={AMBER} seed={3} dur={40} />
      <Sparks g={g} at={mid} x={pill.x} y={pill.y} r={120} n={8} rgb={CYAN} seed={8} dur={26} />
      {/* because */}
      {because ? (
        <div style={{ position: "absolute", left: X0, width: W, top: yB, textAlign: "center", fontFamily: INTER, fontWeight: 600, fontSize: bFit.size, lineHeight: 1.2, letterSpacing: "-0.015em", color: B.text2, whiteSpace: "pre", textShadow: "0 4px 20px rgba(0,0,0,0.6)" }}>
          {lines.map((l, li) => {
            const before = lines.slice(0, li).reduce((n, x) => n + x.split(" ").length, 0);
            return (
              <div key={li}>
                {l.split(" ").map((w, wi) => {
                  const q = EO(lin(g, Bc + (before + wi) * 3, Bc + (before + wi) * 3 + 18));
                  return (
                    <span key={wi} style={{ display: "inline-block", marginRight: "0.26em", opacity: q, transform: `translateY(${((1 - q) * 18).toFixed(1)}px)`, filter: q < 0.98 ? `blur(${((1 - q) * 9).toFixed(2)}px)` : undefined }}>
                      {w}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : null}
    </Stage>
  );
};
