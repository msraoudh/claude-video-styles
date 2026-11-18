import type React from "react";
import { Img, spring, staticFile, useCurrentFrame } from "remotion";
import { glass, K, MONO, SERIF, UI } from "../../edit/theme";
import { Check, cl, ease, EASE_IO, lin, T } from "./shared";

/**
 * « أي حاجة في الـ vibe، في الـ rythme، ولّا أي فازة في الـ design، في الـ motion » — 4 feedback chips land ON their
 * words and each flips its card from variant A (v1) to variant B (v2). RTL order: vibe (first word) on the right.
 */
type Kind = "vibe" | "rythme" | "design" | "motion";
const TILES: { k: Kind; at: number; a: string; b: string }[] = [
  { k: "vibe", at: T.vibe, a: "froid", b: "chaud" },
  { k: "rythme", at: T.rythme, a: "lent", b: "punchy" },
  { k: "design", at: T.design, a: "chargé", b: "clean" },
  { k: "motion", at: T.motion, a: "linéaire", b: "fluide" },
];
const TW = 202;
const TH = 326;
const TY = 1116;
const tileX = (i: number) => 940 - TW - i * (TW + 24);
const IN_AT = T.vibe - 22;
const OUT_AT = T.B1 - 5;

const easeOut3 = (u: number) => 1 - Math.pow(1 - cl(u), 3);
const GREYS = ["#4A4F57", "#6E747C", "#959BA2", "#30343A"];

/* ---- the 4 mini visuals (174×180) ---- */
const VibeVis: React.FC<{ b: boolean; frame: number }> = ({ b, frame }) => {
  const cols = b ? [K.coralDeep, K.coral, K.coralLight, K.cream] : GREYS;
  return (
    <div style={{ position: "relative", width: 174, height: 180 }}>
      {b ? <div style={{ position: "absolute", left: 17, top: 20, width: 140, height: 140, borderRadius: "50%", background: K.coralGlow, filter: "blur(30px)" }} /> : null}
      {cols.map((c, i) => {
        const s = 1 + 0.05 * Math.sin(frame / 8 + i * 1.6);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 14 + (i % 2) * 80,
              top: 14 + Math.floor(i / 2) * 80,
              width: 66,
              height: 66,
              borderRadius: "50%",
              background: c,
              border: "1.5px solid rgba(255,236,220,0.18)",
              boxShadow: b ? `0 6px 18px rgba(0,0,0,0.4)` : undefined,
              transform: `scale(${s})`,
            }}
          />
        );
      })}
    </div>
  );
};

const RythmeVis: React.FC<{ b: boolean; frame: number }> = ({ b, frame }) => {
  const segs: [number, number][] = b
    ? [
        [0, 0.13],
        [0.14, 0.27],
        [0.28, 0.49],
        [0.5, 0.56],
        [0.57, 0.7],
        [0.71, 0.84],
        [0.85, 1],
      ]
    : [
        [0, 0.46],
        [0.48, 0.8],
        [0.82, 1],
      ];
  const period = b ? 40 : 90;
  const ph = (frame % period) / period;
  const px = 6 + ph * 162;
  return (
    <div style={{ position: "relative", width: 174, height: 180 }}>
      {Array.from({ length: 8 }, (_, k) => {
        const x = 6 + (k / 7) * 162;
        const hit = b && Math.abs(px - x) < 10;
        return <div key={k} style={{ position: "absolute", left: x - 1, top: 22, width: 2.5, height: hit ? 20 : 13, borderRadius: 2, background: hit ? K.coralLight : "rgba(255,236,220,0.32)" }} />;
      })}
      {segs.map(([s0, s1], i) => {
        const x0 = 6 + s0 * 162;
        const w = (s1 - s0) * 162;
        const under = px >= x0 && px <= x0 + w;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x0,
              top: 58,
              width: w,
              height: 52,
              borderRadius: 7,
              background: b ? (i % 2 ? K.coralLight : K.coral) : i % 2 ? "#6E625A" : "#574C46",
              opacity: under ? 1 : b ? 0.78 : 0.7,
              boxShadow: under && b ? `0 0 16px ${K.coralGlow}` : undefined,
              transform: `scaleY(${under && b ? 1.08 : 1})`,
            }}
          />
        );
      })}
      <div style={{ position: "absolute", left: px - 1, top: 14, width: 2.5, height: 108, background: K.cream, boxShadow: "0 0 8px rgba(255,236,220,0.6)" }} />
      {/* kick meter */}
      <div style={{ position: "absolute", left: 6, top: 136, width: 162, height: 34, display: "flex", alignItems: "flex-end", gap: 5 }}>
        {Array.from({ length: 14 }, (_, k) => {
          const x = 6 + (k / 13) * 162;
          const d = Math.abs(px - x);
          const h = b ? 6 + 28 * Math.max(0, 1 - d / 22) : 6 + 5 * Math.max(0, 1 - d / 40);
          return <div key={k} style={{ flex: 1, height: h, borderRadius: 2, background: b ? K.coral : "#6E625A" }} />;
        })}
      </div>
    </div>
  );
};

const DesignVis: React.FC<{ b: boolean; frame: number }> = ({ b, frame }) => {
  const fx = { left: 37, top: 1, width: 100, height: 178 };
  if (!b) {
    const boxes: [number, number, number, number, number, string][] = [
      [8, 10, 62, 30, -7, "#5A524D"],
      [40, 34, 52, 42, 9, "#6E747C"],
      [4, 72, 88, 22, -4, "#4A4F57"],
      [22, 102, 42, 42, 13, "#7E858F"],
      [48, 132, 46, 30, -10, "#5A524D"],
    ];
    return (
      <div style={{ position: "relative", width: 174, height: 180 }}>
        <div style={{ position: "absolute", ...fx, borderRadius: 12, background: "#2A2420", border: "1.5px solid rgba(255,236,220,0.18)", overflow: "hidden" }}>
          {boxes.map(([x, y, w, h, r, c], i) => (
            <div key={i} style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 4, background: c, opacity: 0.9, transform: `rotate(${r + Math.sin(frame / 10 + i) * 1.5}deg)` }} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: "relative", width: 174, height: 180 }}>
      <div style={{ position: "absolute", ...fx, borderRadius: 12, background: K.bg1, border: "1.5px solid rgba(217,119,87,0.6)", overflow: "hidden", boxShadow: `0 0 18px ${K.coralGlow}` }}>
        <Img src={staticFile("thumbs/trailer-1.jpg")} style={{ position: "absolute", left: 0, top: 0, width: 100, height: 76, objectFit: "cover", objectPosition: "50% 28%" }} />
        <div style={{ position: "absolute", left: 0, top: 76, width: 100, height: 2, background: K.coral }} />
        <div style={{ position: "absolute", left: 10, top: 86, width: 80, height: 5, borderRadius: 3, background: K.coral }} />
        <div style={{ position: "absolute", left: 10, top: 98, width: 80, height: 44, borderRadius: 8, background: "rgba(255,236,220,0.1)", border: "1px solid rgba(255,236,220,0.22)" }}>
          {[0, 1, 2].map((k) => (
            <div key={k} style={{ position: "absolute", left: 8, top: 9 + k * 10, width: [52, 40, 46][k] * (0.7 + 0.3 * Math.abs(Math.sin(frame / 14 + k))), height: 4, borderRadius: 2, background: k === 0 ? K.coralLight : "rgba(245,238,228,0.5)" }} />
          ))}
        </div>
        <div style={{ position: "absolute", left: 24, top: 152, width: 52, height: 14, borderRadius: 7, background: "rgba(15,11,9,0.85)", border: "1px solid rgba(255,236,220,0.25)" }}>
          <div style={{ position: "absolute", left: 6, top: 5, width: 18, height: 4, borderRadius: 2, background: K.coral }} />
          <div style={{ position: "absolute", left: 28, top: 5, width: 18, height: 4, borderRadius: 2, background: K.cream }} />
        </div>
      </div>
    </div>
  );
};

const MotionVis: React.FC<{ b: boolean; frame: number }> = ({ b, frame }) => {
  const G = { x: 12, y: 8, w: 150, h: 108 };
  const u = cl((frame % 56) / 44);
  const pos = (v: number) => (b ? easeOut3(v) : cl(v));
  const path = Array.from({ length: 31 }, (_, i) => {
    const v = i / 30;
    return `${i === 0 ? "M" : "L"}${G.x + v * G.w},${G.y + G.h - pos(v) * G.h}`;
  }).join(" ");
  const col = b ? K.coral : "#7E858F";
  return (
    <div style={{ position: "relative", width: 174, height: 180 }}>
      <svg width={174} height={130} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={`M${G.x},${G.y} V${G.y + G.h} H${G.x + G.w}`} stroke="rgba(255,236,220,0.25)" strokeWidth={2} fill="none" />
        <path d={path} stroke={col} strokeWidth={4} fill="none" strokeLinecap="round" style={{ filter: b ? `drop-shadow(0 0 6px ${K.coralGlow})` : undefined }} />
        <circle cx={G.x + u * G.w} cy={G.y + G.h - pos(u) * G.h} r={7} fill={b ? K.coralLight : K.cream} />
      </svg>
      {/* slider: the same move in space */}
      <div style={{ position: "absolute", left: 12, top: 150, width: 150, height: 6, borderRadius: 3, background: "rgba(255,236,220,0.14)" }} />
      {b
        ? [0.12, 0.08, 0.04].map((d, i) => (
            <div key={i} style={{ position: "absolute", left: 12 + pos(Math.max(0, u - d)) * 150 - 10, top: 143, width: 20, height: 20, borderRadius: 10, background: K.coral, opacity: 0.15 + i * 0.12 }} />
          ))
        : null}
      <div style={{ position: "absolute", left: 12 + pos(u) * 150 - 10, top: 143, width: 20, height: 20, borderRadius: 10, background: b ? K.coralLight : K.cream, boxShadow: b ? `0 0 12px ${K.coralGlow}` : undefined }} />
    </div>
  );
};

const VIS: Record<Kind, React.FC<{ b: boolean; frame: number }>> = { vibe: VibeVis, rythme: RythmeVis, design: DesignVis, motion: MotionVis };

const Face: React.FC<{ b: boolean; kind: Kind; word: string; frame: number; ok: number }> = ({ b, kind, word, frame, ok }) => {
  const V = VIS[kind];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        ...glass(b),
        padding: 0,
        borderRadius: 24,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: b ? "rotateY(180deg)" : undefined,
        border: `1.5px solid ${b ? (ok > 0 ? K.coralLight : "rgba(217,119,87,0.6)") : K.stroke}`,
        boxShadow: b && ok > 0 ? `0 24px 60px rgba(0,0,0,0.55), 0 0 ${30 + 30 * ok}px ${K.coralGlow}` : (glass(b).boxShadow as string),
      }}
    >
      <div style={{ position: "absolute", left: 14, top: 40, padding: "3px 10px", borderRadius: 8, fontFamily: MONO, fontWeight: 700, fontSize: 15, color: b ? "#1A0F0B" : K.muted, background: b ? K.coral : "rgba(255,236,220,0.08)" }}>{b ? "v2" : "v1"}</div>
      <div style={{ position: "absolute", right: 16, top: 26, fontFamily: SERIF, fontSize: 42, lineHeight: 1, color: b ? K.coral : "rgba(245,238,228,0.3)" }}>{b ? "B" : "A"}</div>
      <div style={{ position: "absolute", left: 14, top: 82 }}>
        <V b={b} frame={frame} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 272, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: UI, fontWeight: 800, fontSize: 25, color: b ? K.cream : K.muted }}>
        {b ? <Check size={22} /> : null}
        {word}
      </div>
    </div>
  );
};

export const Tiles: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < IN_AT - 1 || frame > T.B1 + 8) return null;
  const out = ease(frame, OUT_AT, 8);
  return (
    <>
      {TILES.map((t, i) => {
        const inP = ease(frame, IN_AT + i * 3, 9);
        const chip = spring({ frame: frame - t.at, fps: 30, config: { damping: 11, stiffness: 220, mass: 0.6 } });
        const flip = EASE_IO(lin(frame, t.at + 4, t.at + 14));
        const ok = spring({ frame: frame - (T.bay + i * 2), fps: 30, config: { damping: 12, stiffness: 200, mass: 0.6 } });
        const wob = flip > 0 && flip < 1 ? Math.sin(flip * Math.PI) : 0;
        const fl = Math.sin(frame / 16 + i * 1.3) * 3;
        const outI = ease(frame, OUT_AT + i, 7);
        return (
          <div key={t.k} style={{ position: "absolute", left: tileX(i), top: TY + fl, width: TW, height: TH, opacity: inP * (1 - outI), transform: `translateY(${(1 - inP) * 22 - outI * 40}px) scale(${0.94 + 0.06 * inP})`, filter: inP < 1 || out > 0 ? `blur(${(1 - inP) * 6 + outI * 8}px)` : undefined }}>
            {/* flip card */}
            <div style={{ position: "absolute", inset: 0, perspective: 900 }}>
              <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${flip * 180}deg) scale(${1 + wob * 0.06})` }}>
                <Face b={false} kind={t.k} word={t.a} frame={frame} ok={0} />
                <Face b kind={t.k} word={t.b} frame={frame} ok={ok} />
              </div>
            </div>
            {/* glint on the flip */}
            {wob > 0 ? <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: `linear-gradient(${100 + flip * 60}deg, transparent 30%, rgba(255,236,220,${0.35 * wob}) 50%, transparent 70%)` }} /> : null}
            {/* feedback chip, ON the word */}
            {chip > 0.01 ? (
              <div style={{ position: "absolute", left: 0, right: 0, top: -24, display: "flex", justifyContent: "center", transform: `translateY(${(1 - Math.min(1, chip)) * -34}px) scale(${0.6 + 0.4 * chip})`, opacity: cl(chip * 1.6) }}>
                <div style={{ padding: "2px 22px 8px", borderRadius: 999, background: "rgba(20,14,11,0.96)", border: `1.5px solid ${K.coral}`, boxShadow: `0 10px 26px rgba(0,0,0,0.5), 0 0 22px ${K.coralGlow}`, fontFamily: SERIF, fontSize: 40, lineHeight: 1.05, color: K.coral, whiteSpace: "nowrap" }}>{t.k}</div>
              </div>
            ) : null}
            {/* « بأي حاجة » : everything validated */}
            {ok > 0.01 ? (
              <div style={{ position: "absolute", right: -10, bottom: -10, width: 40, height: 40, borderRadius: 20, background: K.ok, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${Math.min(1.1, ok)})`, boxShadow: "0 6px 16px rgba(0,0,0,0.5)" }}>
                <Check size={26} color="#10241A" stroke={3.4} />
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};
