import type React from "react";
import { useCurrentFrame } from "remotion";
import { Spark } from "../../edit/kit";
import { glass, K, MONO, UI } from "../../edit/theme";
import { B, c01, eio, eo, G, lerp, LOOPS } from "./beats";
import { ABSORB_HITS } from "./Fan";
import { FileIcon } from "./icons";

/**
 * The hero object, one continuous card from « skill » to the hand-off:
 *   B  « اعمللي skill باللي عملتو » : SKILL.md (the REAL aura-trailer skill) types itself; each batch of the user's
 *      videos absorbed from the deck writes one pipeline step.
 *   B' « الكل » : it shrinks and flies into the empty slot of the skills shelf (ding), NEW badge on « skill، ».
 *   C  « كل مرة » : it grows into the machine core (aura-trailer), processes every input (progress + steps light up).
 *   D  « الـ skill هاذي » : it glows (rotating coral rim), and fires a shockwave on « هاذي » (send).
 */

type Box = { x: number; y: number; w: number; h: number };
const mix = (a: Box, b: Box, t: number): Box => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });

// --- SKILL.md lines (real file: ~/.claude/skills/aura-trailer/SKILL.md, shortened) ---
type Seg = [string, string, number?]; // text, colour, weight
const LINES: { at: number; cps: number; segs: Seg[] }[] = [
  { at: B.skill, cps: 240, segs: [["---", K.dim]] },
  { at: B.skill + 2, cps: 200, segs: [["name: ", K.coral], ["aura-trailer", K.cream, 700]] },
  { at: B.belli, cps: 190, segs: [["description: ", K.coral], ['"aura" trailer, cut on the bass', K.muted]] },
  { at: B.belli + 7, cps: 240, segs: [["---", K.dim]] },
  { at: ABSORB_HITS[0], cps: 170, segs: [["1. ", K.coral], ["ig_download.sh", K.cream, 700], [" → your reels", K.muted]] },
  { at: ABSORB_HITS[1], cps: 170, segs: [["2. ", K.coral], ["music_prep.sh", K.cream, 700], [" song 0.85", K.muted]] },
  { at: ABSORB_HITS[2], cps: 170, segs: [["3. ", K.coral], ["4 scene agents", K.cream, 700], [" → render.sh", K.muted]] },
];
const lineLen = (l: (typeof LINES)[number]) => l.segs.reduce((n, s) => n + s[0].length, 0);

const SkillMd: React.FC<{ frame: number }> = ({ frame }) => {
  // current line = the last one started
  let cur = -1;
  LINES.forEach((l, i) => {
    if (frame >= l.at) cur = i;
  });
  return (
    <div style={{ width: G.skill.w, height: G.skill.h, position: "relative" }}>
      {/* header */}
      <div style={{ height: 54, display: "flex", alignItems: "center", gap: 10, padding: "0 20px 0 22px", borderBottom: `1px solid ${K.stroke}`, background: "rgba(255,236,220,0.04)" }}>
        <FileIcon size={22} />
        <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 23, color: K.cream }}>SKILL.md</span>
        <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 16, color: K.dim, flex: 1, whiteSpace: "nowrap" }}>~/.claude/skills/aura-trailer/</span>
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 12px 5px 9px", borderRadius: 999, background: "rgba(217,119,87,0.16)", border: "1.5px solid rgba(217,119,87,0.45)" }}>
          <Spark size={16} rotate={frame * 3} />
          <span style={{ fontFamily: UI, fontWeight: 700, fontSize: 16, color: K.coralLight, whiteSpace: "nowrap" }}>Claude écrit…</span>
        </div>
      </div>
      {/* body */}
      <div style={{ padding: "14px 0 0 0" }}>
        {LINES.map((l, i) => {
          if (frame < l.at) return <div key={i} style={{ height: 37 }} />;
          let n = Math.floor(((frame - l.at) / 30) * l.cps) + 1;
          const total = lineLen(l);
          n = Math.min(total, n);
          const isCur = i === cur;
          const p = eo(frame, l.at, 5);
          let left = n;
          return (
            <div
              key={i}
              style={{
                height: 37,
                display: "flex",
                alignItems: "center",
                padding: "0 22px",
                fontFamily: MONO,
                fontSize: 24,
                whiteSpace: "pre",
                position: "relative",
                background: isCur ? `rgba(217,119,87,${0.16 * p})` : "transparent",
                boxShadow: isCur ? `inset 3px 0 0 ${K.coral}` : undefined,
              }}
            >
              {l.segs.map(([t, c, wgt], k) => {
                const show = t.slice(0, Math.max(0, left));
                left -= t.length;
                return show ? (
                  <span key={k} style={{ color: c, fontWeight: wgt ?? 500 }}>
                    {show}
                  </span>
                ) : null;
              })}
              {isCur ? <span style={{ display: "inline-block", width: 12, height: 27, marginLeft: 2, background: K.coral, opacity: n < total || Math.floor(frame / 8) % 2 === 0 ? 0.95 : 0.15 }} /> : null}
            </div>
          );
        })}
      </div>
      {/* hits from the absorbed deck: a warm glint from the left edge */}
      {ABSORB_HITS.map((h) => {
        const t = frame - h;
        if (t < -1 || t > 10) return null;
        const o = Math.sin(Math.PI * c01((t + 1) / 11));
        return <div key={h} style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 260, background: `linear-gradient(90deg, rgba(240,164,135,${0.32 * o}), transparent)` }} />;
      })}
    </div>
  );
};

const Tile1: React.FC<{ frame: number }> = ({ frame }) => {
  const nb = frame - B.skill2;
  const nbS = nb < 0 ? 0 : nb < 3 ? 1.7 - nb * 0.25 : nb < 6 ? 0.95 + (nb - 3) * 0.0167 : 1;
  return (
    <div style={{ width: G.tile1.w, height: G.tile1.h, position: "relative", display: "flex", alignItems: "center", gap: 16, padding: "0 20px", boxSizing: "border-box" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(217,119,87,0.18)", border: "1.5px solid rgba(217,119,87,0.5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <FileIcon size={24} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 25, color: K.cream }}>aura-trailer</div>
        <div style={{ fontFamily: UI, fontWeight: 500, fontSize: 18, color: K.muted, whiteSpace: "nowrap" }}>trailer « aura » · cut on the bass</div>
      </div>
      {nb >= 0 ? (
        <div
          style={{
            position: "absolute",
            right: 14,
            top: 12,
            transform: `rotate(-4deg) scale(${nbS})`,
            padding: "4px 11px",
            borderRadius: 9,
            background: `linear-gradient(180deg, ${K.coralLight}, ${K.coral})`,
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: "0.12em",
            color: "#1A0F0B",
            boxShadow: `0 6px 18px ${K.coralGlow}`,
          }}
        >
          NEW
        </div>
      ) : null}
    </div>
  );
};

/** processing state of the core at `frame`: which loop (or -1) and its 0–1 progress. */
const procAt = (frame: number) => {
  for (let k = LOOPS.length - 1; k >= 0; k--) {
    const L = LOOPS[k];
    if (frame >= L.hit - 1 && frame <= L.done + 7) return { k, p: c01((frame - L.hit) / (L.done - L.hit)), hit: frame - L.hit };
  }
  return { k: -1, p: 0, hit: 99 };
};

const STEPS = ["reels", "cut", "render"];
const LOG = ["ig_download.sh", "music_prep.sh", "render.sh"];

const Core: React.FC<{ frame: number; glowD: number }> = ({ frame, glowD }) => {
  const pr = procAt(frame);
  const running = pr.k >= 0 && pr.p < 1;
  const barP = pr.k >= 0 ? pr.p : glowD > 0 ? eo(frame, B.hedhi, 12) : 0;
  // live status line (AIS meta: the real script names of the skill)
  let log: React.ReactNode = <span style={{ color: K.dim }}>prête · en attente</span>;
  if (running) {
    const i = Math.min(2, Math.floor(pr.p * 3));
    log = (
      <>
        <span style={{ color: K.coral }}>$ </span>
        <span style={{ color: K.cream }}>{LOG[i]}</span>
        <span style={{ color: K.muted }}>{".".repeat(1 + (Math.floor(frame / 2) % 3))}</span>
      </>
    );
  } else if (pr.k >= 0) {
    log = (
      <>
        <span style={{ color: K.ok }}>✓ </span>
        <span style={{ color: K.cream }}>reel_{String(pr.k + 1).padStart(2, "0")}.mp4</span>
        <span style={{ color: K.muted }}> · 60 fps</span>
      </>
    );
  } else if (glowD > 0 && frame >= B.hedhi) {
    log = (
      <>
        <span style={{ color: K.coral }}>▶ </span>
        <span style={{ color: K.cream }}>/aura-trailer</span>
      </>
    );
  } else if (glowD > 0) {
    log = <span style={{ color: K.coralLight }}>skill sélectionnée</span>;
  }
  return (
    <div style={{ width: G.core.w, height: G.core.h, position: "relative", padding: "18px 24px 20px", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <FileIcon size={18} />
        <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 18, color: K.muted, flex: 1 }}>SKILL.md</span>
        <Spark size={40} rotate={frame * (running || glowD > 0 ? 9 : 2)} glow={running || glowD > 0 ? 12 : 4} />
      </div>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 40, color: K.cream, marginTop: 6, letterSpacing: "-0.015em" }}>aura-trailer</div>
      <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 18, marginTop: 8, height: 24, whiteSpace: "nowrap" }}>{log}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {STEPS.map((s, i) => {
          const on = pr.k >= 0 ? pr.p >= i / 3 : glowD > 0 ? eo(frame, B.hedhi + i * 3, 4) : 0;
          return (
            <div
              key={s}
              style={{
                padding: "5px 13px",
                borderRadius: 999,
                fontFamily: MONO,
                fontWeight: 700,
                fontSize: 17,
                color: on ? "#1A0F0B" : K.muted,
                background: on ? `linear-gradient(180deg, ${K.coralLight}, ${K.coral})` : "rgba(255,236,220,0.07)",
                border: `1.5px solid ${on ? "rgba(255,220,200,0.6)" : K.stroke}`,
              }}
            >
              {s}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: "auto", height: 9, borderRadius: 5, background: "rgba(255,236,220,0.1)", overflow: "hidden" }}>
        <div style={{ width: `${barP * 100}%`, height: "100%", background: `linear-gradient(90deg, ${K.coralDeep}, ${K.coralLight})`, boxShadow: `0 0 12px ${K.coralGlow}` }} />
      </div>
    </div>
  );
};

export const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < B.skill - 1) return null;

  const pIn = eo(frame, B.skill, 7);
  const m1 = eio(frame, B.lkol, 12); // SKILL.md → shelf tile
  const m2 = eio(frame, B.kol, 12); // tile → machine core
  const b = mix(mix(G.skill, G.tile1, m1), G.core, m2);
  b.y -= Math.sin(Math.PI * m1) * 34;
  const land = B.lkol + 12;
  const bounce = 1 + 0.045 * Math.sin(Math.PI * c01((frame - land) / 8)) * (frame >= land ? 1 : 0);
  const pr = procAt(frame);
  const procPulse = pr.k >= 0 ? 0.05 * Math.sin(Math.PI * c01(pr.hit / 6)) : 0;
  const glowD = eo(frame, B.lskill, 8);
  const shock = frame >= B.hedhi ? c01((frame - B.hedhi) / 14) : 0;
  const firePulse = frame >= B.hedhi ? 0.07 * Math.sin(Math.PI * c01((frame - B.hedhi) / 9)) : 0;
  const sc = (0.96 + 0.04 * pIn) * bounce * (1 + procPulse + firePulse + 0.03 * glowD);

  const oSkill = 1 - eo(frame, B.lkol + 3, 6);
  const oTile = eo(frame, B.lkol + 3, 6) * (1 - eo(frame, B.kol + 1, 4));
  const oCore = eo(frame, B.kol + 3, 5);
  const processing = pr.k >= 0 ? 1 - pr.p * 0.3 : 0;
  const glowAmt = Math.max(oSkill * 0.6, processing, glowD);
  const flightBlur = Math.sin(Math.PI * m1) * 2.2 + Math.sin(Math.PI * m2) * 1.4;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;

  return (
    <>
      {/* rotating coral rim when the skill is called (D): a sharp ring + a soft halo copy */}
      {glowD > 0
        ? [
            [26, 22],
            [11, 1.5],
          ].map(([pad, bl], i) => (
            <div
              key={bl}
              style={{
                position: "absolute",
                left: b.x - pad,
                top: b.y - pad,
                width: b.w + pad * 2,
                height: b.h + pad * 2,
                borderRadius: 26 + pad,
                zIndex: 29,
                opacity: glowD * (i === 0 ? 0.9 : 1),
                transform: `scale(${sc})`,
                background: `conic-gradient(from ${frame * 10}deg, rgba(217,119,87,0) 0deg, ${K.coralLight} 60deg, #FFE3D6 85deg, rgba(217,119,87,0) 150deg, rgba(217,119,87,0) 195deg, ${K.coral} 255deg, ${K.coralLight} 280deg, rgba(217,119,87,0) 340deg)`,
                filter: `blur(${bl}px)`,
              }}
            />
          ))
        : null}
      {/* bloom */}
      <div
        style={{
          position: "absolute",
          left: cx - b.w * (0.75 + 0.3 * glowD),
          top: cy - b.h * (0.8 + 0.3 * glowD),
          width: b.w * (1.5 + 0.6 * glowD),
          height: b.h * (1.6 + 0.6 * glowD),
          borderRadius: "50%",
          background: K.coralGlow,
          filter: "blur(70px)",
          opacity: pIn * Math.min(1, 0.25 + 0.45 * glowAmt + 0.35 * glowD + 0.4 * firePulse * 14),
          zIndex: 18,
        }}
      />
      <div
        style={{
          ...glass(true),
          position: "absolute",
          left: b.x,
          top: b.y,
          width: b.w,
          height: b.h,
          padding: 0,
          overflow: "hidden",
          borderRadius: lerp(26, 24, m1),
          zIndex: 30,
          opacity: pIn,
          transform: `translateY(${(1 - pIn) * 14}px) scale(${sc})`,
          filter: pIn < 1 || flightBlur > 0.2 ? `blur(${(1 - pIn) * 6 + flightBlur}px)` : undefined,
          border: `1.5px solid rgba(217,119,87,${0.5 + 0.45 * Math.max(glowD, processing)})`,
          boxShadow: [
            "0 24px 60px rgba(0,0,0,0.6)",
            "inset 0 1px 0 rgba(255,236,220,0.22)",
            `0 0 ${50 + 50 * Math.max(glowD, processing)}px rgba(217,119,87,${0.35 + 0.35 * Math.max(glowD, processing)})`,
          ].join(", "),
          backdropFilter: undefined,
          WebkitBackdropFilter: undefined,
          background: `linear-gradient(150deg, rgba(255,236,220,0.09), rgba(255,236,220,0.02) 60%), rgba(30,21,17,0.92)`,
        }}
      >
        {oSkill > 0 ? (
          <div style={{ position: "absolute", left: 0, top: 0, opacity: oSkill, transform: `scale(${b.w / G.skill.w})`, transformOrigin: "0 0" }}>
            <SkillMd frame={frame} />
          </div>
        ) : null}
        {oTile > 0 ? (
          <div style={{ position: "absolute", left: 0, top: 0, opacity: oTile, transform: `scale(${b.w / G.tile1.w})`, transformOrigin: "0 0" }}>
            <Tile1 frame={frame} />
          </div>
        ) : null}
        {oCore > 0 ? (
          <div style={{ position: "absolute", left: 0, top: 0, opacity: oCore, transform: `scale(${b.w / G.core.w})`, transformOrigin: "0 0" }}>
            <Core frame={frame} glowD={glowD} />
          </div>
        ) : null}
        {frame >= B.hedhi && frame < B.hedhi + 10 ? (
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, rgba(255,227,214,${0.5 * (1 - (frame - B.hedhi) / 10)}), rgba(217,119,87,${0.25 * (1 - (frame - B.hedhi) / 10)}) 60%, transparent)` }} />
        ) : null}
      </div>
      {/* shockwave on « هاذي » (send): two glowing rings */}
      {shock > 0 && shock < 1
        ? [0, 0.3].map((dl, i) => {
            const s = c01((shock - dl) / (1 - dl));
            if (s <= 0 || s >= 1) return null;
            const e = 1 - Math.pow(1 - s, 2);
            const kx = 1 + 1.3 * e;
            const ky = 1 + 0.55 * e;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: cx - (b.w / 2) * kx,
                  top: cy - (b.h / 2) * ky,
                  width: b.w * kx,
                  height: b.h * ky,
                  borderRadius: 30 + 50 * s,
                  border: `${(i === 0 ? 5 : 3) * (1 - 0.6 * s)}px solid ${i === 0 ? "#FFE3D6" : K.coralLight}`,
                  opacity: (1 - s) * (i === 0 ? 0.95 : 0.7),
                  zIndex: 28,
                  boxShadow: `0 0 ${36 * (1 - s) + 8}px ${K.coral}, inset 0 0 ${30 * (1 - s)}px ${K.coralGlow}`,
                  filter: "blur(0.6px)",
                }}
              />
            );
          })
        : null}
    </>
  );
};
