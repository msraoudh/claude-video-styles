import type React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { Caret, Cursor, float, Spark, Stamp, typed } from "../../edit/kit";
import { glass, K, MONO, UI } from "../../edit/theme";
import { Check, cl, Cross, ease, EASE_IO, Emo, lin, mix, SendArrow, T, tc } from "./shared";
import { Tiles } from "./Tiles";
import { Timeline } from "./Timeline";

/**
 * ÉTAPE 4 — part B (72.6–86.52 s): « وأنا نقعد نتفرّج، وديما يقلّي: ادخل لـ Remotion وشوف، واعمل طلّة، ولّا كمّلت،
 * تحب نعمل الـ rendu؟ … أنا ديما نتشيكي، وكان حاجة ما عجبتنيش نقلّو يبدّلها: الـ vibe، الـ rythme، الـ design، الـ motion ».
 */

const WIN = { x: 60, y: 1044 };
const PLAY_W = 170;
const PLAY_H = 302;
const CLIP1 = T.rem2; // the user's trailer plays in the Studio player
const CLIP2 = T.rem2 + 120; // then his French reel
const CLICK = T.check - 3; // he clicks « Nchouf » (he always checks)
const WIN_OUT = T.vibe - 26;

/* ---------------- Studio player (the user's own clips) ---------------- */
const Player: React.FC = () => {
  const frame = useCurrentFrame();
  const second = frame >= CLIP2;
  const start = second ? CLIP2 : CLIP1;
  const prog = lin(frame, start, start + 120);
  const ring = frame >= T.talla ? EASE_IO(lin(frame, T.talla, T.talla + 10)) * (1 - lin(frame, T.talla + 22, T.talla + 40)) : 0;
  const zoom = 1 + 0.035 * Math.sin(Math.PI * lin(frame, T.talla, T.talla + 40));
  return (
    <div style={{ position: "relative", width: PLAY_W, transform: `scale(${zoom})`, transformOrigin: "50% 50%" }}>
      <div style={{ position: "relative", width: PLAY_W, height: PLAY_H, borderRadius: 14, overflow: "hidden", background: "#000", border: `1.5px solid ${K.strokeHi}`, boxShadow: "0 14px 30px rgba(0,0,0,0.6)" }}>
        <Sequence from={CLIP1} durationInFrames={120} layout="none">
          <OffthreadVideo src={staticFile("thumbs/clip-trailer.mp4")} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
        <Sequence from={CLIP2} durationInFrames={130} layout="none">
          <OffthreadVideo src={staticFile("thumbs/clip-fr.mp4")} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        </Sequence>
        <div style={{ position: "absolute", left: 8, top: 8, padding: "2px 7px", borderRadius: 6, background: "rgba(15,11,9,0.7)", fontFamily: MONO, fontSize: 11, color: K.cream }}>1080×1920</div>
        {/* cut flash between the two clips */}
        <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: 0.5 * (1 - lin(frame, CLIP2, CLIP2 + 4)) * (frame >= CLIP2 ? 1 : 0) }} />
      </div>
      {/* « واعمل طلّة » : a coral focus ring around the player */}
      {ring > 0 ? <div style={{ position: "absolute", left: -8, top: -8, width: PLAY_W + 16, height: PLAY_H + 16, borderRadius: 20, border: `3px solid ${K.coral}`, boxShadow: `0 0 26px ${K.coralGlow}`, opacity: ring, transform: `scale(${1.08 - 0.08 * ring})` }} /> : null}
      <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 8 }}>
        <svg width={13} height={13} viewBox="0 0 24 24">
          <path d="M6 4 L20 12 L6 20 Z" fill={K.coral} />
        </svg>
        <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(255,236,220,0.14)", overflow: "hidden" }}>
          <div style={{ width: `${prog * 100}%`, height: "100%", background: K.coral }} />
        </div>
        <span style={{ fontFamily: MONO, fontSize: 12, color: K.muted }}>0:0{Math.min(4, Math.floor(prog * 4))}</span>
      </div>
    </div>
  );
};

/* ---------------- review checklist (« أنا ديما نتشيكي ») ---------------- */
const ROWS: [string, string][] = [
  ["00:03", "hook"],
  ["00:21", "captions"],
  ["00:44", "sync voix"],
  ["00:52", "transition"],
];
const ROW_AT = [T.check + 3, T.check + 9, T.check + 15, T.ma3jeb];
const FIX = "ma 3ejbetnich, baddelha";

const Review: React.FC = () => {
  const frame = useCurrentFrame();
  const scanI = ROW_AT.findIndex((a) => frame < a);
  const scanY = 44 + (scanI === -1 ? 3 : scanI) * 46;
  const sent = frame >= T.baddel + 14;
  const txt = typed(FIX, frame, T.n9olou, 34);
  const okCount = ROW_AT.slice(0, 3).filter((a) => frame >= a).length;
  return (
    <div style={{ position: "relative", width: 658, height: 288 }}>
      <div style={{ position: "absolute", left: 0, top: 0, height: 30, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 17, letterSpacing: "0.2em", color: K.coral }}>REVIEW</span>
        <span style={{ fontFamily: MONO, fontSize: 17, color: K.dim }}>· v1</span>
        <Emo e="👀" size={20} />
      </div>
      <div style={{ position: "absolute", right: 4, top: 0, height: 30, display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontWeight: 700, fontSize: 17, color: okCount === 3 ? K.ok : K.muted }}>
        {okCount}/4 <Check size={17} progress={okCount / 3} />
      </div>
      {/* scan highlight */}
      {frame < T.ma3jeb + 4 ? <div style={{ position: "absolute", left: -8, top: scanY, width: 674, height: 40, borderRadius: 10, background: "rgba(217,119,87,0.09)", border: "1px solid rgba(217,119,87,0.3)" }} /> : null}
      {ROWS.map(([t, l], i) => {
        const on = frame >= ROW_AT[i];
        const bad = i === 3;
        const rp = ease(frame, T.check - 2 + i * 2, 6);
        const fixing = bad && sent;
        return (
          <div key={i} style={{ position: "absolute", left: 0, top: 44 + i * 46, width: 658, height: 40, display: "flex", alignItems: "center", gap: 16, opacity: rp, transform: `translateY(${(1 - rp) * 8}px)` }}>
            {bad && on ? <div style={{ position: "absolute", left: -8, top: 0, width: 674, height: 40, borderRadius: 10, background: "rgba(217,119,87,0.16)" }} /> : null}
            <span style={{ position: "relative", fontFamily: MONO, fontSize: 18, color: K.dim, width: 64 }}>{t}</span>
            <span style={{ position: "relative", fontFamily: UI, fontWeight: 600, fontSize: 24, color: bad && on ? K.coralLight : K.cream, textDecoration: bad && on && !fixing ? "line-through" : undefined, textDecorationColor: K.coral }}>{l}</span>
            <div style={{ position: "relative", marginLeft: "auto", marginRight: 6, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!on ? <div style={{ width: 10, height: 10, borderRadius: 5, background: "rgba(255,236,220,0.25)" }} /> : bad ? fixing ? <Spark size={24} rotate={frame * 8} /> : <Cross size={26} /> : <Check size={28} progress={lin(frame, ROW_AT[i], ROW_AT[i] + 5)} />}
            </div>
          </div>
        );
      })}
      {/* « ما عجبتنيش » stamp */}
      {frame >= T.ma3jeb ? (
        <div style={{ position: "absolute", left: 400, top: 44 + 3 * 46 - 8 }}>
          <Stamp text="BOF" at={T.ma3jeb} size={26} rotate={-8} />
        </div>
      ) : null}
      {/* the user's fix request, typed in 3arbizi */}
      <div style={{ position: "absolute", left: -8, top: 236, width: 674, height: 50, borderRadius: 16, background: "rgba(255,236,220,0.05)", border: `1.5px solid ${frame >= T.n9olou ? "rgba(217,119,87,0.5)" : K.stroke}`, opacity: ease(frame, T.ma3jeb, 6) }}>
        <div style={{ position: "absolute", left: 16, top: 0, height: 50, display: "flex", alignItems: "center", fontFamily: UI, fontWeight: 500, fontSize: 23, color: txt ? K.cream : K.dim, whiteSpace: "nowrap" }}>
          {txt || "Écris à Claude…"}
          {frame >= T.n9olou && !sent ? <Caret h={24} /> : null}
          {sent ? <Emo e=" 🙏" size={22} /> : null}
        </div>
        <div style={{ position: "absolute", right: 6, top: 6, width: 38, height: 38, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: txt ? `linear-gradient(180deg, ${K.coralLight}, ${K.coral})` : "rgba(255,236,220,0.1)", transform: `scale(${frame >= T.baddel + 14 && frame < T.baddel + 18 ? 0.85 : 1})` }}>
          <SendArrow size={20} color={txt ? "#1A0F0B" : K.dim} />
        </div>
      </div>
    </div>
  );
};

/* ---------------- the window that keeps working by itself ---------------- */
const TimelineB: React.FC = () => {
  const frame = useCurrentFrame();
  const inP = ease(frame, T.B0 + 2, 12);
  const out = ease(frame, WIN_OUT, 9);
  if (inP <= 0 || out >= 1) return null;
  const done = frame >= T.walla;
  // auto-play: the playhead runs the whole reel and lands on the end when Claude says « Kammelt »
  const playT = Math.min(115.03, 50 + ((frame - T.B0) / (T.walla - T.B0)) * 65.03);
  const playerP = EASE_IO(lin(frame, T.rem2, T.rem2 + 12));
  const reviewP = EASE_IO(lin(frame, T.check - 4, T.check + 6));
  const dots = ".".repeat(1 + (Math.floor(frame / 8) % 3));
  const push = 1 + lin(frame, T.B0, WIN_OUT) * 0.02;
  return (
    <Timeline
      frame={frame}
      title={
        <>
          <span style={{ fontFamily: UI, fontWeight: 800, fontSize: 20, color: K.cream }}>{playerP > 0.5 ? "Remotion Studio" : "Remotion"}</span>
          <span>{playerP > 0.5 ? " · localhost:3000" : " · Reel · 1080×1920 · 30 fps"}</span>
        </>
      }
      voiceAt={-100}
      motionAt={-100}
      sfxAt={-100}
      musicAt={-100}
      playT={playT}
      playerP={playerP}
      sheenAt={T.B0 + 8}
      reviewP={reviewP}
      player={<Player />}
      review={<Review />}
      status={
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: UI, fontWeight: 600, fontSize: 20, color: K.cream, whiteSpace: "nowrap" }}>
          {done ? <Check size={22} /> : <Spark size={22} rotate={frame * 5} />}
          {done ? (
            <span>
              v1 prête <span style={{ color: K.dim, fontFamily: MONO, fontSize: 17 }}>· 01:55</span>
            </span>
          ) : (
            <span>
              Claude monte la vidéo<span style={{ display: "inline-block", width: 24 }}>{dots}</span>
            </span>
          )}
        </div>
      }
      topRight={
        <>
          <span style={{ padding: "4px 10px", borderRadius: 8, fontFamily: MONO, fontWeight: 700, fontSize: 14, letterSpacing: "0.12em", color: done ? K.ok : K.coralLight, background: done ? "rgba(127,209,161,0.12)" : "rgba(217,119,87,0.16)", opacity: done ? 1 : 0.65 + 0.35 * Math.sin(frame / 5) }}>
            {done ? "DONE" : "● AUTO"}
          </span>
          <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 19, color: K.cream }}>{tc(playT)}</span>
        </>
      }
      style={{
        left: WIN.x,
        top: WIN.y,
        opacity: inP * (1 - out),
        transformOrigin: "50% 100%",
        transform: `perspective(1400px) rotateX(${(1 - inP) * 14}deg) translateY(${(1 - inP) * 40 + out * 30}px) scale(${(0.95 + 0.05 * inP - out * 0.05) * push})`,
        filter: inP < 1 || out > 0 ? `blur(${(1 - inP) * 8 + out * 8}px)` : undefined,
      }}
    />
  );
};

/* ---------------- « وأنا نقعد نتفرّج » : popcorn ---------------- */
const Popcorn: React.FC = () => {
  const frame = useCurrentFrame();
  const pop = spring({ frame: frame - T.netfarraj, fps: 30, config: { damping: 10, stiffness: 210, mass: 0.6 } });
  const out = ease(frame, T.odkhel - 2, 7);
  if (pop <= 0.01 || out >= 1) return null;
  const fl = float(frame, "s4pop", 4, 2.2);
  const kernels = [
    { d: 2, dx: -46, dy: -70 },
    { d: 5, dx: 6, dy: -86 },
    { d: 8, dx: 44, dy: -62 },
    { d: 13, dx: -20, dy: -76 },
  ];
  return (
    <div style={{ position: "absolute", right: 140, top: 1352 + fl.y, transformOrigin: "50% 100%", transform: `scale(${0.6 + 0.4 * pop}) rotate(${(1 - Math.min(1, pop)) * -8 + Math.sin(frame / 9) * 2}deg)`, opacity: cl(pop * 1.5) * (1 - out) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 22px 12px 16px", borderRadius: 999, ...glass(true), background: "rgba(24,17,13,0.94)" }}>
        <Emo e="🍿" size={40} />
        <span style={{ fontFamily: UI, fontWeight: 800, fontSize: 25, color: K.cream, whiteSpace: "nowrap" }}>mode spectateur</span>
        <Emo e="👀" size={30} />
      </div>
      {kernels.map((k, i) => {
        const t = lin(frame, T.netfarraj + k.d, T.netfarraj + k.d + 16);
        if (t <= 0 || t >= 1) return null;
        const x = 36 + k.dx * t;
        const y = 20 + k.dy * Math.sin(t * Math.PI * 0.9) + 40 * t * t;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 12, height: 10, borderRadius: 6, background: "#FFF3DF", boxShadow: "0 0 6px rgba(255,236,220,0.6)", opacity: 1 - t * 0.6, transform: `rotate(${t * 220}deg)` }} />;
      })}
    </div>
  );
};

/* ---------------- Claude notifications ---------------- */
const TOAST = { x: 404, y: 1052, w: 536 };
const Toast: React.FC<{ at: number; out: number; children: React.ReactNode }> = ({ at, out, children }) => {
  const frame = useCurrentFrame();
  const p = spring({ frame: frame - at, fps: 30, config: { damping: 14, stiffness: 190, mass: 0.7 } });
  const q = ease(frame, out, 7);
  if (p <= 0.01 || q >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: TOAST.x,
        top: TOAST.y,
        width: TOAST.w,
        ...glass(true),
        background: "linear-gradient(150deg, rgba(255,236,220,0.1), rgba(255,236,220,0.03) 60%), rgba(28,20,16,0.95)",
        borderRadius: 24,
        padding: "16px 22px 18px",
        opacity: cl(p * 1.4) * (1 - q),
        transform: `translateY(${(1 - Math.min(1, p)) * -40 - q * 26}px) scale(${0.94 + 0.06 * Math.min(1, p)})`,
        filter: q > 0 ? `blur(${q * 6}px)` : undefined,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Spark size={26} />
        <span style={{ fontFamily: UI, fontWeight: 800, fontSize: 21, color: K.cream }}>Claude</span>
        <span style={{ fontFamily: UI, fontWeight: 500, fontSize: 18, color: K.dim }}>· maintenant</span>
        <div style={{ marginLeft: "auto", width: 10, height: 10, borderRadius: 5, background: K.coral, boxShadow: `0 0 10px ${K.coralGlow}` }} />
      </div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
};

const Btn: React.FC<{ primary?: boolean; w: number; hot?: number; pressed?: boolean; children: React.ReactNode }> = ({ primary, w, hot = 0, pressed, children }) => (
  <div
    style={{
      width: w,
      height: 48,
      borderRadius: 14,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      fontFamily: UI,
      fontWeight: 800,
      fontSize: 22,
      color: primary ? "#1A0F0B" : K.cream,
      background: primary ? `linear-gradient(180deg, ${K.coralLight}, ${K.coral})` : `rgba(255,236,220,${0.07 + hot * 0.1})`,
      border: `1.5px solid ${primary ? "rgba(255,220,200,0.6)" : hot > 0 ? K.coral : K.strokeHi}`,
      boxShadow: primary ? `0 0 ${18 + hot * 20}px ${K.coralGlow}` : hot > 0 ? `0 0 ${hot * 22}px ${K.coralGlow}` : undefined,
      transform: `scale(${pressed ? 0.92 : 1 + hot * 0.03})`,
    }}
  >
    {children}
  </div>
);

const Toasts: React.FC = () => {
  const frame = useCurrentFrame();
  const rendHot = lin(frame, T.rendu - 2, T.rendu + 4) * (1 - lin(frame, T.ana2, T.ana2 + 5));
  const choufHot = lin(frame, T.ana2 + 3, T.ana2 + 7);
  const pressed = frame >= CLICK && frame < CLICK + 5;
  return (
    <>
      <Toast at={T.odkhel} out={T.chouf + 12}>
        <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 28, color: K.cream, display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
          Odkhel l Remotion w chouf <Emo e="👀" size={28} />
        </div>
      </Toast>
      <Toast at={T.walla} out={CLICK + 4}>
        <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 25, color: K.cream, display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
          Kammelt <Check size={26} progress={lin(frame, T.kammelt, T.kammelt + 6)} /> — t7eb na3mel el rendu ?
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 14, opacity: ease(frame, T.kammelt + 2, 7) }}>
          <Btn primary w={160} hot={rendHot}>
            Rendu
            <svg width={16} height={16} viewBox="0 0 24 24">
              <path d="M6 4 L20 12 L6 20 Z" fill="#1A0F0B" />
            </svg>
          </Btn>
          <Btn w={190} hot={choufHot} pressed={pressed}>
            Nchouf <Emo e="👀" size={22} />
          </Btn>
        </div>
      </Toast>
    </>
  );
};

/** The user's cursor: tempted by « Rendu », then he clicks « Nchouf » (he always checks first). */
const CursorB: React.FC = () => {
  const frame = useCurrentFrame();
  const a = T.rendu - 6;
  if (frame < a || frame > CLICK + 14) return null;
  const btnY = 1196;
  const toRendu = EASE_IO(lin(frame, a, T.rendu + 6));
  const toChouf = EASE_IO(lin(frame, T.ana2, T.ana2 + 7));
  const x = mix(mix(900, 520, toRendu), 694, toChouf);
  const y = mix(1420, btnY, toRendu) + Math.sin(frame / 6) * 2 * (1 - toChouf);
  const o = lin(frame, a, a + 4) * (1 - lin(frame, CLICK + 8, CLICK + 14));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: o }}>
      <Cursor x={x} y={y} clickAt={CLICK} />
    </div>
  );
};

export const PartB: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < T.B0 || frame > T.B1 + 8) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <TimelineB />
      <Popcorn />
      <Toasts />
      <CursorB />
      <Tiles />
    </AbsoluteFill>
  );
};
