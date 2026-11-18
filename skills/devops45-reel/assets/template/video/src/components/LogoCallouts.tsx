import React from "react";
import { AbsoluteFill } from "remotion";
import { clamp01, EASE_IN, EASE_OUT, iv } from "../archetypes/title/brand/fx";
import { SCENES } from "../data/episode";
import { PHRASES } from "../data/voice";
import { fontInter } from "../kit/fonts";
import { Logo, logoKey } from "../kit/Logo";
import { LOGOS, type LogoKey } from "../kit/logos";
import { B, glass } from "../lib/look";
import { useGlobalFrame } from "../lib/sync";

/**
 * Logo callouts — when the voice SAYS a tool or an AWS service (« Docker », « S3 », « GitHub Actions »), its real logo
 * pops in top-right (opposite the HUD, y ≈ 80–196) as a glass chip « [logo] Docker », on the word, for ≈ 2 s.
 * Skipped in the hook / title / cta (they have their own logo) and when the current scene already shows that logo big;
 * « DevOps » (the series word) never pops. Same logo again only after 8 s. Cue: ui-pop on the word (cues.py).
 */
const HOLD = 120; // frames on screen
const GAP = 480; // same logo again only after 8 s
const SKIP_TYPES = new Set(["hook", "title", "cta"]);

type Callout = { key: LogoKey; f: number; to: number };

const shown = (scene: (typeof SCENES)[number], key: LogoKey) => {
  const j = JSON.stringify(scene.data ?? {});
  return j.includes(`"icon":"${key}"`) || j.includes(`"tool":"${key}"`);
};

export const CALLOUTS: Callout[] = (() => {
  const out: Callout[] = [];
  const last: Record<string, number> = {};
  for (const p of PHRASES) {
    const ws = p.words;
    for (let i = 0; i < ws.length; i++) {
      const two = i + 1 < ws.length ? logoKey(ws[i].w + ws[i + 1].w) : null;
      const key = two ?? logoKey(ws[i].w);
      if (!key || key === "devops") continue;
      const f = ws[i].f;
      const sc = SCENES.find((s) => f >= s.from && f < s.to);
      if (!sc || SKIP_TYPES.has(sc.type) || shown(sc, key)) continue;
      if (last[key] !== undefined && f - last[key] < GAP) continue;
      last[key] = f;
      if (two) i++;
      out.push({ key, f, to: Math.min(f + HOLD, sc.to - 4) });
    }
  }
  // one chip at a time: a new one cuts the previous short
  for (let i = 0; i + 1 < out.length; i++) out[i].to = Math.min(out[i].to, out[i + 1].f - 2);
  return out.filter((c) => c.to - c.f >= 24);
})();

export const LogoCallouts: React.FC = () => {
  const g = useGlobalFrame();
  const c = CALLOUTS.find((x) => g >= x.f - 4 && g < x.to);
  if (!c) return null;
  const pin = iv(g, [c.f - 8, c.f + 10], [0, 1], EASE_OUT);
  const pout = iv(g, [c.to - 12, c.to], [0, 1], EASE_IN);
  const vis = pin * (1 - pout);
  const label = LOGOS[c.key].label;
  const fly = (1 - pin) * 520 + pout * 60;
  const trail = pin < 0.96 ? [1, 2, 3] : [];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {trail.map((k) => (
        <div key={k} style={{ position: "absolute", right: 56 - fly - k * 70 * (1 - pin), top: 84, height: 112, width: 300, borderRadius: 32, opacity: 0.18 / k, filter: `blur(${4 + 4 * k}px)`, background: "linear-gradient(90deg, rgba(34,211,238,0), rgba(34,211,238,0.9))" }} />
      ))}
      <div
        style={{
          position: "absolute",
          right: 56,
          top: 84,
          height: 112,
          padding: "0 30px 0 16px",
          display: "flex",
          alignItems: "center",
          gap: 18,
          ...glass(),
          borderRadius: 32,
          opacity: clamp01(vis * 1.3),
          transform: `translateX(${fly.toFixed(1)}px) scale(${(0.9 + 0.1 * pin + 0.08 * Math.sin(pin * Math.PI)).toFixed(3)})`,
          filter: pin < 0.98 ? `blur(${((1 - pin) * 6).toFixed(1)}px)` : undefined,
        }}
      >
        <div style={{ transform: `rotate(${((1 - pin) * 360).toFixed(1)}deg)` }}>
          <Logo name={c.key} size={80} draw={clamp01(iv(g, [c.f - 2, c.f + 14], [0, 1], EASE_OUT))} glow={0.25} />
        </div>
        <div style={{ fontFamily: fontInter, fontWeight: 800, fontSize: 40, letterSpacing: "-0.03em", color: B.white ?? "#fff", whiteSpace: "nowrap" }}>{label}</div>
      </div>
    </AbsoluteFill>
  );
};
