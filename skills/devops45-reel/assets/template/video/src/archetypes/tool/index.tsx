import React from "react";
import type { Archetype } from "..";
import { fontInter, fontMono } from "../../kit/fonts";
import { Logo } from "../../kit/Logo";
import { B } from "../../lib/look";
import { beatsFor, onWord, sceneWords } from "../../lib/episode";
import { useGlobalFrame } from "../../lib/sync";
import { toolFx } from "../../toolfx";
import { AnamorphicFlare, clamp01, EASE_IN, EASE_OUT, iv } from "../title/brand/fx";
import { Sparks, Stage, Streak, useFontsReady } from "../cards/fx";

/**
 * archetype « tool » — each tool SHOWN doing its job (src/toolfx: Docker packs the app into a container, Kubernetes runs
 * the boxes, Git stacks versions, a CI robot builds and tests…). The user's direction 2026-10-22: « when mentioning git,
 * docker, k8s… animate it, it comes from the left or the right, full motion graphics ».
 *   data = { heading?: string, items: [{ tool: "<logo key | concept key>", label?: string ≤ 34, on?: "<spoken word>",
 *            beats?: ["<spoken word>", …] (the animation's phase words; default: the item's first spoken words) }] (1–3) }
 * Concept keys (no logo): culture, automation, measure, sharing, recipe (src/toolfx CONCEPT_FX).
 * Items take the stage one after another, each on its spoken word: the stage FLIES IN from the right (item 1, 3) or the
 * left (item 2) with motion blur, a light streak and a flare; the previous one is thrown out the other way. Under the
 * stage: the tool's logo chip + its name (mono, cyan) and the label (big, white) word by word. Stage 760² at y 300–1060,
 * text 1092–1262 (captions band from 1300). A tool without an animation yet falls back to its big logo.
 */
type Item = { tool?: string; label?: string; on?: string; beats?: string[] };
const STAGE = 760;
const SX = 160;
const SY = 300;
const IN = 18; // frames of the fly-in
const OUT = 14;

export const Tool: Archetype = ({ spec }) => {
  useFontsReady();
  const g = useGlobalFrame();
  const d = (spec.data ?? {}) as { heading?: string; items?: Item[] };
  const items = (d.items ?? []).filter((it) => toolFx(it.tool) || it.tool).slice(0, 3);
  const n = Math.max(1, items.length);
  const raw = beatsFor(spec, items, 40, 10);
  // the first tool is on stage early (eyes before ears) unless its word comes late in the scene
  const starts = raw.map((b, i) => (i === 0 ? Math.min(b, spec.from + 24) : b));
  const ends = starts.map((s, i) => (i + 1 < starts.length ? starts[i + 1] + OUT : spec.to + 4));
  const heading = d.heading ? String(d.heading) : "";
  const ws = sceneWords(spec);
  const hp = iv(g, [spec.from, spec.from + 14], [0, 1], EASE_OUT);

  return (
    <Stage
      g={g}
      from={spec.from}
      to={spec.to}
      seed={7}
      focusY={36}
      over={starts.map((s, i) => <Streak key={i} g={g} at={s + 6} dir={i % 2 === 0 ? -1 : 1} k={0.9} />)}
    >
      {heading ? (
        <div style={{ position: "absolute", left: 60, top: 222, opacity: hp, transform: `translateY(${((1 - hp) * 16).toFixed(1)}px)` }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 14, height: 54, padding: "0 22px", borderRadius: 27, background: "rgba(8,16,34,0.82)", border: "1px solid rgba(34,211,238,0.32)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 8px 24px rgba(0,0,0,0.45)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: B.cyan, boxShadow: `0 0 12px ${B.cyanGlow}` }} />
            <span style={{ fontFamily: fontInter, fontSize: 22, fontWeight: 700, letterSpacing: "0.16em", color: B.white, textTransform: "uppercase" }}>{heading}</span>
            {n > 1 ? <span style={{ fontFamily: fontMono, fontSize: 20, color: B.text3 }}>{`${Math.min(n, starts.filter((s) => g >= s).length || 1)}/${n}`}</span> : null}
          </div>
        </div>
      ) : null}
      {items.map((it, i) => {
        const s = starts[i];
        const e = ends[i];
        if (g < s - 2 || g > e) return null;
        const fx = toolFx(it.tool);
        const dir = i % 2 === 0 ? 1 : -1; // +1 = comes from the right
        const pin = iv(g, [s - 2, s + IN], [0, 1], EASE_OUT);
        const pout = i + 1 < items.length ? iv(g, [e - OUT, e], [0, 1], EASE_IN) : 0;
        const x = dir * (1 - pin) * 1150 - dir * pout * 1150;
        const skew = dir * ((1 - pin) * -10 + pout * 10);
        const blur = (1 - pin) * 18 + pout * 18;
        const sc = 0.86 + 0.14 * pin + 0.04 * Math.sin(clamp01(pin) * Math.PI) - 0.08 * pout;
        // ghosts: the motion trail while flying
        const ghosts = pin < 0.97 || pout > 0.03 ? [1, 2] : [];
        const key = fx?.logo ?? null;
        const name = fx ? fx.label : String(it.tool ?? "");
        const labelWords = String(it.label ?? "").split(/\s+/).filter(Boolean);
        const lw0 = s + 10;
        const spoken = onWord(spec, it.on);
        const settled = g - s;
        const stageEl = (
          <div style={{ position: "absolute", left: 0, top: 0, width: STAGE, height: STAGE }}>
            {fx ? (
              <fx.C g={g} f0={s} f1={e} beats={it.beats ? it.beats.map((w) => onWord(spec, w)).filter((f): f is number => f !== undefined && f > s && f < e) : ws.filter((w) => w.f > s && w.f < e).map((w) => w.f).slice(0, 8)} size={STAGE} logo={fx.logo ?? "devops"} />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Logo name={String(it.tool)} size={280} draw={pin} glow={0.4} />
              </div>
            )}
          </div>
        );
        return (
          <React.Fragment key={i}>
            {/* soft light pool behind the stage */}
            <div style={{ position: "absolute", left: SX - 120, top: SY - 60, width: STAGE + 240, height: STAGE + 160, opacity: pin * (1 - pout), background: "radial-gradient(50% 50% at 50% 50%, rgba(34,211,238,0.16), rgba(34,211,238,0) 70%)" }} />
            {ghosts.map((k) => (
              <div key={k} style={{ position: "absolute", left: SX + x + dir * k * 90 * (1 - pin + pout), top: SY, width: STAGE, height: STAGE, opacity: 0.22 / k, filter: `blur(${(blur + 10 * k).toFixed(1)}px)`, transform: `skewX(${skew.toFixed(2)}deg) scale(${sc.toFixed(4)})` }}>
                {stageEl}
              </div>
            ))}
            <div style={{ position: "absolute", left: SX + x, top: SY, width: STAGE, height: STAGE, transform: `skewX(${skew.toFixed(2)}deg) scale(${sc.toFixed(4)})`, filter: blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
              {stageEl}
            </div>
            <AnamorphicFlare age={settled - IN + 4} x={540} y={SY + STAGE / 2} dur={26} strength={0.45} size={150} />
            <Sparks g={g} at={s + IN - 4} x={540} y={SY + STAGE / 2} r={360} n={14} seed={11 + i} />
            {/* name chip + label */}
            <div style={{ position: "absolute", left: 60, right: 140, top: 1092, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, transform: `translateX(${(x * 0.6).toFixed(1)}px)`, opacity: 1 - pout }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: iv(g, [s + 4, s + 16], [0, 1]), transform: `translateY(${(iv(g, [s + 4, s + 18], [1, 0], EASE_OUT) * 20).toFixed(1)}px)` }}>
                {key ? <Logo name={key} size={46} draw={iv(g, [s + 4, s + 20], [0, 1])} /> : null}
                <span style={{ fontFamily: fontMono, fontSize: 30, fontWeight: 700, letterSpacing: "0.06em", color: B.cyan }}>{name}</span>
              </div>
              {labelWords.length ? (
                <div style={{ fontFamily: fontInter, fontSize: 56, fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", color: B.white, textAlign: "center", textShadow: "0 4px 22px rgba(0,0,0,0.75)" }}>
                  {labelWords.map((w, wi) => {
                    const f = Math.max(lw0 + wi * 5, spoken !== undefined ? spoken + wi * 4 : 0);
                    const p = iv(g, [f, f + 12], [0, 1], EASE_OUT);
                    return (
                      <span key={wi} style={{ display: "inline-block", marginRight: wi < labelWords.length - 1 ? "0.24em" : 0, opacity: iv(p, [0, 0.4], [0, 1]), transform: `translateY(${((1 - p) * 26).toFixed(1)}px)`, filter: p < 0.98 ? `blur(${((1 - p) * 10).toFixed(1)}px)` : undefined }}>
                        {w}
                      </span>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </React.Fragment>
        );
      })}
    </Stage>
  );
};
