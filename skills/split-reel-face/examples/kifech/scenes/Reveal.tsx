import { Video } from "@remotion/media";
import type React from "react";
import { interpolate, random, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import type { Cue } from "../edit/cue";
import { EASE, float, Ring } from "../edit/kit";
import { AR, K, MONO, SERIF } from "../edit/theme";
import { f, wf } from "../edit/time";

/**
 * REVEAL — « نستنّى 20 minutes، ونلقى الـ vidéo متاعي حاضرة » (98.0–100.44 s), GFX mode, full frame y 200–1450
 * (the face PiP circle sits at x 800–1020, y 200–420: nothing goes there). GLOBAL frames.
 * 1) a big time-lapse ring: 20:00 → 00:00 in 0.6 s (spinning comet + tick dial + render bar 13 % → 100 %),
 * 2) the ring collapses into a phone that rises and PLAYS the user's real finished episode (ep 1 « DevOps en 45
 *    secondes », its title lands right on « حاضرة »), 3) « حاضرة ✓ » slams in + confetti cannons + glass shine,
 * 4) everything zooms out on 100.44 s as the layout goes back to the full face (whoosh).
 */

const R = {
  start: f(98.0),
  wait: wf("نستنّى", 98.13),
  twenty: wf("20", 98.5),
  minutes: wf("minutes", 98.61),
  find: wf("ونلقى", 99.14),
  video: wf("vidéo", 99.44),
  ready: wf("حاضرة", 100.13),
  out: f(100.44),
};
const CD = 18; // countdown length (frames) ≈ 0.6 s
const CD0 = R.twenty;
const CD1 = R.twenty + CD;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ramp = (frame: number, at: number, len: number) => EASE((frame - at) / len);
const sp = (frame: number, at: number, damping = 13, stiffness = 170) =>
  spring({ frame: frame - at, fps: 30, config: { damping, stiffness, mass: 0.7 } });
const inOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

const RING = { cx: 540, cy: 820, size: 560 };
const PHONE = { cx: 540, top: 306, w: 500, h: 868 };

/** countdown progress 0→1 (time-lapse: slow start, very fast middle, soft landing) */
const cdAt = (frame: number) => inOut((frame - CD0) / CD);

const fmt = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

/* ───────────── time-lapse ring ───────────── */
const TimeLapse: React.FC<{ frame: number }> = ({ frame }) => {
  // enters once the face has mostly shrunk into its circle (the layout morph runs 98.0 s + 14 frames)
  const inP = sp(frame, R.wait + 1, 12, 170);
  const e = cdAt(frame);
  const ePrev = cdAt(frame - 1);
  const speed = clamp01((e - ePrev) * 7); // 0..1 (peaks mid-countdown)
  const rem = 1200 * (1 - e);
  const collapse = ramp(frame, R.find - 1, 8);
  const doneHit = interpolate(frame, [CD1, CD1 + 3, CD1 + 10], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shock = clamp01((frame - CD1) / 12);
  const spin = (frame - R.wait) * 0.6 + e * 900;
  const comet = e * 360 * 3 + (frame - R.wait) * 4;
  const chipIn = ramp(frame, CD0 - 1, 6);
  const barIn = ramp(frame, R.wait + 2, 7);
  const pct = Math.round(13 + 87 * e);
  const fl = float(frame, "revring", 4, 3);
  const scale = (0.5 + 0.5 * inP) * (1 - 0.75 * collapse) * (1 + 0.04 * doneHit);
  // fade in only once the split header has faded (no overlap with the morphing face panel)
  const op = ramp(frame, R.wait + 3, 6) * (1 - collapse);
  if (op <= 0.001) return null;
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  const big = RING.size + 120;
  return (
    <>
      {/* glow behind */}
      <div
        style={{
          position: "absolute",
          left: RING.cx - 420,
          top: RING.cy - 420,
          width: 840,
          height: 840,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(217,119,87,${0.32 + 0.3 * speed + 0.3 * doneHit}) 0%, rgba(217,119,87,0) 62%)`,
          opacity: op,
        }}
      />
      {/* shockwave at 00:00 */}
      {frame >= CD1 && shock < 1 ? (
        <div
          style={{
            position: "absolute",
            left: RING.cx - (RING.size / 2) * (1 + shock * 0.7),
            top: RING.cy - (RING.size / 2) * (1 + shock * 0.7),
            width: RING.size * (1 + shock * 0.7),
            height: RING.size * (1 + shock * 0.7),
            borderRadius: "50%",
            border: `${10 * (1 - shock)}px solid ${K.coralLight}`,
            opacity: (1 - shock) * 0.9,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: RING.cx - big / 2 + fl.x,
          top: RING.cy - big / 2 + fl.y,
          width: big,
          height: big,
          opacity: op,
          transform: `translateY(${(1 - inP) * 110}px) scale(${scale})`,
          filter: inP < 0.98 || collapse > 0 ? `blur(${(1 - inP) * 8 + collapse * 10}px)` : undefined,
        }}
      >
        {/* tick dial (spins with the time-lapse) */}
        <svg width={big} height={big} style={{ position: "absolute", inset: 0, transform: `rotate(${spin}deg)` }}>
          {ticks.map((i) => {
            const a = (i / 60) * Math.PI * 2;
            const major = i % 5 === 0;
            const r1 = big / 2 - 6;
            const r2 = big / 2 - (major ? 30 : 18);
            return (
              <line
                key={i}
                x1={big / 2 + r1 * Math.cos(a)}
                y1={big / 2 + r1 * Math.sin(a)}
                x2={big / 2 + r2 * Math.cos(a)}
                y2={big / 2 + r2 * Math.sin(a)}
                stroke={major ? "rgba(255,236,220,0.55)" : "rgba(255,236,220,0.22)"}
                strokeWidth={major ? 4 : 2}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        {/* comet sweep (motion trail) */}
        <div
          style={{
            position: "absolute",
            inset: 34,
            borderRadius: "50%",
            background: `conic-gradient(from ${comet}deg, rgba(240,164,135,0) 0deg, rgba(240,164,135,${0.15 + 0.6 * speed}) 100deg, rgba(255,236,220,${0.35 + 0.6 * speed}) 118deg, rgba(240,164,135,0) 120deg)`,
            WebkitMaskImage: "radial-gradient(circle, transparent 64%, black 65%, black 70%, transparent 71%)",
            maskImage: "radial-gradient(circle, transparent 64%, black 65%, black 70%, transparent 71%)",
          }}
        />
        {/* the ring itself (kit) */}
        <div style={{ position: "absolute", left: 60, top: 60 }}>
          <Ring
            size={RING.size}
            stroke={18}
            progress={1 - e}
            label={
              <span
                style={{
                  fontFamily: MONO,
                  fontWeight: 700,
                  fontSize: 128,
                  letterSpacing: "-0.02em",
                  color: frame >= CD1 ? K.coral : K.cream,
                  display: "inline-block",
                  filter: speed > 0.08 ? `blur(${speed * 2.2}px)` : undefined,
                  textShadow:
                    speed > 0.08
                      ? `0 ${16 * speed}px 0 rgba(217,119,87,${0.35 * speed}), 0 ${-16 * speed}px 0 rgba(217,119,87,${0.35 * speed})`
                      : doneHit > 0
                        ? `0 0 ${40 * doneHit}px ${K.coralGlow}`
                        : undefined,
                  transform: `scale(${1 + 0.1 * doneHit})`,
                }}
              >
                {fmt(rem)}
              </span>
            }
          />
          {/* « minutes » under the digits */}
          <div
            style={{
              position: "absolute",
              left: 0,
              width: RING.size,
              top: RING.size / 2 + 82,
              textAlign: "center",
              fontFamily: SERIF,
              fontSize: 46,
              color: K.muted,
              opacity: ramp(frame, R.minutes - 2, 6),
            }}
          >
            minutes
          </div>
        </div>
      </div>
      {/* TIME-LAPSE chip (above the ring, left of the face circle) */}
      <div
        style={{
          position: "absolute",
          left: RING.cx - 230,
          top: RING.cy - big / 2 - 82,
          width: 460,
          display: "flex",
          justifyContent: "center",
          opacity: chipIn * (1 - collapse),
          transform: `translateY(${(1 - chipIn) * 12}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 20px",
            borderRadius: 999,
            background: "rgba(15,11,9,0.7)",
            border: `1.5px solid rgba(217,119,87,0.6)`,
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: "0.14em",
            color: K.cream,
            whiteSpace: "nowrap",
            boxShadow: `0 0 24px ${K.coralGlow}`,
          }}
        >
          <svg width={30} height={20} viewBox="0 0 30 20">
            <path d="M2 2 L14 10 L2 18 Z M15 2 L27 10 L15 18 Z" fill={K.coral} />
          </svg>
          TIME-LAPSE <span style={{ color: K.coral, letterSpacing: 0 }}>×2000</span>
        </div>
      </div>
      {/* render bar (continues Step5's counter: 13 % → 100 %) */}
      <div style={{ position: "absolute", left: 230, top: RING.cy + big / 2 + 26, width: 620, opacity: barIn * (1 - collapse), transform: `translateY(${(1 - barIn) * 14}px)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontWeight: 700, fontSize: 24, color: K.muted }}>
          <span>
            <span style={{ color: frame >= CD1 ? K.ok : K.coral }}>● </span>
            {frame >= CD1 ? "rendu terminé" : "rendering · GPU"}
          </span>
          <span style={{ color: K.cream }}>{pct}%</span>
        </div>
        <div style={{ marginTop: 10, height: 12, borderRadius: 6, background: "rgba(255,236,220,0.1)", overflow: "hidden" }}>
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: 6,
              background: `repeating-linear-gradient(115deg, ${K.coral} 0 16px, ${K.coralLight} 16px 32px)`,
              backgroundPosition: `${frame * 6}px 0`,
              boxShadow: `0 0 14px ${K.coralGlow}`,
            }}
          />
        </div>
      </div>
    </>
  );
};

/* ───────────── phone with the finished episode ───────────── */
const TRIM = 85; // ep1-full: start at 2.83 s → the « DEVOPS EN 45 SECONDES » title lands right on « حاضرة »
const PHONE_IN = R.find + 1;

const Phone: React.FC<{ frame: number; out: number }> = ({ frame, out }) => {
  const inP = sp(frame, PHONE_IN, 14, 150);
  const blurIn = ramp(frame, PHONE_IN, 9);
  // mounted (invisible) from the scene start so the episode's video Sequence premounts
  const readyHit = sp(frame, R.ready, 9, 220);
  const shine = interpolate(frame, [R.ready + 1, R.ready + 12], [-0.35, 1.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const play = interpolate(frame, [PHONE_IN + 3, PHONE_IN + 8, PHONE_IN + 16], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fl = float(frame, "revphone", 5, 3.2);
  const rx = (1 - inP) * 24;
  const ry = (1 - inP) * -16 + Math.sin(frame / 16) * 3;
  const ty = (1 - inP) * 240;
  const sc = (0.62 + 0.38 * inP) * (1 + 0.025 * Math.sin(Math.PI * clamp01(readyHit))) * (1 + 0.08 * out);
  const inner = { w: PHONE.w - 24, h: PHONE.h - 24 };
  const vProg = clamp01((frame - PHONE_IN) / 60);
  const left = PHONE.cx - PHONE.w / 2;
  return (
    <div style={{ position: "absolute", left: left + fl.x, top: PHONE.top + fl.y, width: PHONE.w, height: PHONE.h, perspective: 1400, opacity: frame < PHONE_IN ? 0 : clamp01(inP * 2) * (1 - out) }}>
      {/* halo + rays behind the phone */}
      <div
        style={{
          position: "absolute",
          left: -260,
          top: -160,
          width: PHONE.w + 520,
          height: PHONE.h + 320,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, rgba(217,119,87,${0.42 + 0.35 * clamp01(readyHit)}), rgba(217,119,87,0))`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: PHONE.w / 2 - 650,
          top: PHONE.h / 2 - 650,
          width: 1300,
          height: 1300,
          borderRadius: "50%",
          background: `repeating-conic-gradient(from ${frame * 0.8}deg, rgba(255,236,220,0.07) 0deg 6deg, rgba(255,236,220,0) 6deg 22deg)`,
          WebkitMaskImage: "radial-gradient(circle, black 18%, transparent 62%)",
          maskImage: "radial-gradient(circle, black 18%, transparent 62%)",
          opacity: 0.5 + 0.5 * clamp01(readyHit),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateY(${ty}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${sc})`,
          filter: blurIn < 1 || out > 0 ? `blur(${(1 - blurIn) * 10 + out * 10}px)` : undefined,
        }}
      >
        {/* body */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 64,
            background: "linear-gradient(150deg, #3A2B24, #120C0A 55%, #2A1E19)",
            border: `2px solid ${K.strokeHi}`,
            boxShadow: `0 40px 90px rgba(0,0,0,0.7), 0 0 ${40 + 50 * clamp01(readyHit)}px ${K.coralGlow}, inset 0 1px 0 rgba(255,236,220,0.3)`,
          }}
        />
        {/* screen */}
        <div style={{ position: "absolute", left: 12, top: 12, width: inner.w, height: inner.h, borderRadius: 52, overflow: "hidden", background: "#05070C" }}>
          <Sequence from={PHONE_IN - 2} durationInFrames={R.out + 16 - (PHONE_IN - 2)} premountFor={30}>
            <Video src={staticFile("thumbs/ep1-full.mp4")} muted trimBefore={TRIM} style={{ width: inner.w, height: inner.h }} objectFit="cover" />
          </Sequence>
          {/* top status: what this is */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 58,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div style={{ padding: "6px 16px", borderRadius: 999, background: "rgba(10,8,7,0.55)", border: "1px solid rgba(255,236,220,0.2)", fontFamily: MONO, fontWeight: 700, fontSize: 17, color: "rgba(245,238,228,0.85)", letterSpacing: "0.06em" }}>
              Reel.mp4 · 1080×1920 · 60 fps
            </div>
          </div>
          {/* play flash */}
          {play > 0 ? (
            <div style={{ position: "absolute", left: inner.w / 2 - 60, top: inner.h / 2 - 60, width: 120, height: 120, borderRadius: 60, background: "rgba(15,11,9,0.55)", border: "2px solid rgba(255,236,220,0.5)", opacity: play, transform: `scale(${0.8 + 0.4 * play})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={46} height={52} viewBox="0 0 46 52">
                <path d="M6 4 L42 26 L6 48 Z" fill={K.cream} />
              </svg>
            </div>
          ) : null}
          {/* playback progress */}
          <div style={{ position: "absolute", left: 22, right: 22, bottom: 22, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.22)" }}>
            <div style={{ width: `${6 + 30 * vProg}%`, height: "100%", borderRadius: 3, background: K.cream }} />
          </div>
          {/* glass shine on « حاضرة » */}
          {shine > -0.35 && shine < 1.35 ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(115deg, transparent ${shine * 100 - 16}%, rgba(255,246,238,0.32) ${shine * 100 - 3}%, rgba(255,246,238,0.5) ${shine * 100}%, transparent ${shine * 100 + 10}%)`,
                mixBlendMode: "screen",
              }}
            />
          ) : null}
          <div style={{ position: "absolute", inset: 0, borderRadius: 52, boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.08)" }} />
        </div>
        {/* dynamic island */}
        <div style={{ position: "absolute", left: PHONE.w / 2 - 62, top: 26, width: 124, height: 34, borderRadius: 17, background: "#050403" }} />
      </div>
    </div>
  );
};

/* ───────────── « حاضرة ✓ » + confetti ───────────── */
const Ready: React.FC<{ frame: number; out: number }> = ({ frame, out }) => {
  if (frame < R.ready - 1) return null;
  const t = frame - R.ready;
  const s = interpolate(t, [0, 3, 6], [1.45, 0.95, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = clamp01((t + 1) / 2) * (1 - out);
  const chk = ramp(frame, R.ready + 2, 7);
  const badge = sp(frame, R.ready + 1, 9, 240);
  const ringOut = clamp01((t - 1) / 12);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 1204,
        display: "flex",
        justifyContent: "center",
        opacity: op,
        transform: `translateY(${-out * 20}px)`,
        filter: out > 0 ? `blur(${out * 8}px)` : undefined,
      }}
    >
      <div dir="rtl" style={{ display: "flex", alignItems: "center", gap: 30, transform: `scale(${s})` }}>
        <div
          style={{
            fontFamily: AR,
            fontWeight: 900,
            fontSize: 150,
            lineHeight: 1.12,
            color: K.cream,
            textShadow: `0 0 40px ${K.coralGlow}, 0 10px 30px rgba(0,0,0,0.6)`,
          }}
        >
          حاضرة
        </div>
        <div style={{ position: "relative", width: 126, height: 126 }}>
          {ringOut < 1 ? (
            <div
              style={{
                position: "absolute",
                left: 63 - 63 * (1 + ringOut),
                top: 63 - 63 * (1 + ringOut),
                width: 126 * (1 + ringOut),
                height: 126 * (1 + ringOut),
                borderRadius: "50%",
                border: `${6 * (1 - ringOut)}px solid ${K.ok}`,
                opacity: 1 - ringOut,
              }}
            />
          ) : null}
          <svg width={126} height={126} viewBox="0 0 40 40" style={{ transform: `scale(${badge})`, filter: "drop-shadow(0 0 18px rgba(127,209,161,0.55))" }}>
            <circle cx={20} cy={20} r={19} fill={K.ok} />
            <path d="M11 20.5 L17.5 27 L29.5 14" fill="none" stroke="#0F1A12" strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={30 * (1 - chk)} />
          </svg>
        </div>
      </div>
    </div>
  );
};

/** Confetti burst from BEHIND the phone (radial, coral + cream only), so the video itself stays clean. */
const CONFETTI = Array.from({ length: 110 }, (_, i) => {
  const ang = random(`ca${i}`) * Math.PI * 2;
  const cx = Math.cos(ang);
  const sy = Math.sin(ang);
  // start on the phone's silhouette (half-size 250 × 434) so every piece is visible at once
  const edge = Math.min(250 / Math.max(0.001, Math.abs(cx)), 434 / Math.max(0.001, Math.abs(sy))) * (0.82 + random(`ce${i}`) * 0.12);
  const v = 1300 + random(`cv${i}`) * 1500;
  const palette = [K.coral, K.coralLight, K.cream, K.coralDeep, K.coral, K.coralLight];
  return {
    x0: PHONE.cx + cx * edge,
    y0: PHONE.top + PHONE.h / 2 + sy * edge,
    vx: cx * v,
    vy: sy * v - 300,
    rot0: random(`cr${i}`) * 360,
    spin: (random(`cs${i}`) - 0.5) * 1600,
    flip: 8 + random(`cf${i}`) * 16,
    w: 11 + random(`cw${i}`) * 11,
    h: 18 + random(`ch${i}`) * 16,
    round: random(`cr2${i}`) > 0.78,
    color: palette[Math.floor(random(`cc${i}`) * palette.length)],
    delay: Math.floor(random(`cd${i}`) * 3),
  };
});

const Confetti: React.FC<{ frame: number; out: number }> = ({ frame, out }) => {
  const t0 = R.ready - 1;
  if (frame < t0) return null;
  return (
    <>
      {CONFETTI.map((c, i) => {
        const t = (frame - t0 - c.delay) / 30;
        if (t < 0) return null;
        const k = 3.2;
        const dist = (1 - Math.exp(-k * t)) / k;
        const x = c.x0 + c.vx * dist;
        const y = c.y0 + c.vy * dist + 0.5 * 1900 * t * t;
        const life = clamp01(1 - (t - 0.55) / 0.35) * clamp01(t * 30);
        // keep the PiP face circle and the « حاضرة » line clean
        const inFace = Math.hypot(x - 910, y - 310) < 165;
        const inText = y > 1190 && y < 1390 && x > 250 && x < 830;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - c.w / 2,
              top: y - c.h / 2,
              width: c.w,
              height: c.round ? c.w : c.h,
              borderRadius: c.round ? "50%" : 3,
              background: c.color,
              opacity: life * (1 - out) * (inFace || inText ? 0 : 1),
              transform: `rotate(${c.rot0 + c.spin * t}deg) scaleX(${Math.cos(t * c.flip)})`,
              boxShadow: c.color === K.cream ? "0 0 10px rgba(255,236,220,0.55)" : undefined,
            }}
          />
        );
      })}
    </>
  );
};

export const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < R.start - 1 || frame > R.out + 12) return null;
  const out = ramp(frame, R.out - 1, 9);
  const flash = interpolate(frame, [CD1, CD1 + 2, CD1 + 8], [0, 0.22, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <TimeLapse frame={frame} />
      <Confetti frame={frame} out={out} />
      <Phone frame={frame} out={out} />
      <Ready frame={frame} out={out} />
      {flash > 0 ? <div style={{ position: "absolute", inset: 0, background: "#FFE9DC", opacity: flash, pointerEvents: "none" }} /> : null}
    </>
  );
};

export const revealCues: Cue[] = [
  { f: R.start, sfx: "whoosh", vol: 0.4, note: "split → gfx (reveal)" },
  { f: R.wait - 2, sfx: "pop", vol: 0.3, note: "20:00 ring lands" },
  // the clock races: ticks accelerate with the time-lapse
  ...[0, 4, 7, 9, 11, 13, 14, 15, 16, 17].map((d, i) => ({ f: CD0 + d, sfx: "tick", vol: 0.16 + i * 0.012, note: `time-lapse tick ${i + 1}` })),
  { f: CD1, sfx: "ding", vol: 0.34, note: "00:00 — render done" },
  { f: CD1 + 1, sfx: "shutter-modern", vol: 0.22, note: "render shutter" },
  { f: PHONE_IN, sfx: "swipe", vol: 0.34, note: "phone rises with the video" },
  { f: R.ready, sfx: "success", vol: 0.55, note: "حاضرة ✓" },
  { f: R.ready + 1, sfx: "pop", vol: 0.3, note: "confetti burst" },
  { f: R.ready + 2, sfx: "flash", vol: 0.3, note: "glass shine" },
  { f: R.out, sfx: "whoosh", vol: 0.4, note: "gfx → face" },
];
