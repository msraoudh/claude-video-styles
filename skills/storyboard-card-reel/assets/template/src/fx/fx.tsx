import React, { createContext, useContext } from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BIG_FONT, CAP_FONT } from "../theme";

/* =====================================================================================
 * the user's reel, v4. Black + red + WHITE, balanced (the user 2026-11-11: « leave some white »): white text on see-through
 * frosted GLASS (iOS / liquid glass: you see the blurred video through it), red is the ACCENT (key word, plates,
 * ticks, glow), photos in their REAL colours, no borders/strokes. Every component is used inside a <Sequence>.
 *
 * Fade rule: backdrop-filter sees nothing through an ancestor with opacity < 1, so wrappers NEVER set opacity:
 * they wrap children in <Fade o={…}> and every leaf multiplies its own opacity by useFade().
 * ===================================================================================== */

/** local palette (theme.ts belongs to the grade agent) */
export const K = {
  red: "#E30A17",
  hi: "#FF3B47",
  deep: "#7A0C17",
  black: "#0B0B0B",
  ink: "#120709",
  glow: "rgba(227,10,23,0.75)",
  glowSoft: "rgba(227,10,23,0.35)",
  white: "#FFFFFF",
  soft: "rgba(255,255,255,.78)",
};
/** white text on glass: a soft dark halo keeps it readable over his light wall */
export const TXT_SHADOW = "0 2px 14px rgba(0,0,0,.42), 0 1px 2px rgba(0,0,0,.45)";
/** silver (white metal) for big type on dark pages / the canvas */
/** grey→black metal, sampled from ref3 ("SIMPLE"/"MEALS"): silver top, dark band, bright highlight, deep grey-black base (the user 2026-11-11: no plain white big text) */
export const SILVER = "linear-gradient(180deg, #D6D8DB 0%, #BFC2C6 28%, #9EA1A7 44%, #EEEFF1 58%, #B9BCC0 72%, #6A6E73 88%, #2A2D30 100%)";
/** red-metal (replaces the chrome): bright red highlight → deep red → near-black band → red again */
export const REDMETAL = "linear-gradient(180deg, #FF5A64 0%, #FF3B47 16%, #E30A17 38%, #9A0A16 50%, #2A0408 57%, #6E0A14 66%, #C80C1A 80%, #FF3B47 100%)";
/** brighter red-metal for small sizes (no black band, which would eat thin strokes) */
export const REDGRAD = "linear-gradient(180deg, #FF4A55 0%, #FF3B47 30%, #E30A17 62%, #8E0712 100%)";
/** red plate (dark text sits on it) */
export const PLATE = "linear-gradient(100deg, #FF3B47 0%, #E30A17 45%, #7A0C17 100%)";
export const DARK_EDGE = "drop-shadow(0 0 1.5px rgba(10,2,4,.9)) drop-shadow(0 0 14px rgba(10,2,4,.45)) drop-shadow(0 18px 36px rgba(10,2,4,.45))";
export const gradText = (_g: string): React.CSSProperties => ({ backgroundImage: SILVER, /* the user: ALL text = grey→black metal */ WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" });

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const isArabic = (s: string) => /[؀-ۿ]/.test(s);

/* ---------------- fade context ---------------- */
const FadeCtx = createContext(1);
export const useFade = () => useContext(FadeCtx);
export const Fade: React.FC<{ o: number; children: React.ReactNode }> = ({ o, children }) => {
  const p = useFade();
  return <FadeCtx.Provider value={p * Math.max(0, Math.min(1, o))}>{children}</FadeCtx.Provider>;
};

/** a div whose opacity follows the fade context (use INSIDE a component's own <Fade>) */
export const FadeDiv: React.FC<React.HTMLAttributes<HTMLDivElement> & { o?: number }> = ({ style, o = 1, ...rest }) => {
  const f = useFade();
  return <div {...rest} style={{ ...style, opacity: f * o }} />;
};

export const useIn = (delay = 0, damping = 14, stiffness = 180) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: fr - delay, fps, config: { damping, stiffness, mass: 0.6 } });
};
/** fast exit over the last n frames of a Sequence of length dur */
export const useOut = (dur: number, n = 5) => {
  const fr = useCurrentFrame();
  return interpolate(fr, [dur - n, dur], [1, 0], clamp);
};
/** visible from local frame a (0/1), handy for item gating */
const on = (fr: number, a: number) => (fr >= a ? 1 : 0);

/* =====================================================================================
 * GLASS (iOS / liquid glass, after the effects skill's glass() + glass_widgets_v2): SEE-THROUGH frosted panel —
 * backdrop blur 20px + saturate 1.45 (+ a little dim so white text reads on his light wall), a light white tint,
 * a bright specular top edge, a top-left gradient highlight, a soft inner glow, a drop shadow. No border.
 * tint 0–1 = how much smoke under the white (0 = clearest). tone "red" = the subtle dark-red variant.
 * hot = red accent glow (inner + outer).
 * ===================================================================================== */
export const glassStyle = (hot = 0, tint = 0.5, r = 26, tone: "light" | "red" = "light"): React.CSSProperties => {
  const smoke = 0.06 + 0.2 * tint;
  const bf = `blur(20px) saturate(1.45) brightness(${(1 - 0.22 * tint).toFixed(3)})`;
  return {
    borderRadius: r,
    background: [
      // top-left specular highlight
      "linear-gradient(135deg, rgba(255,255,255,.30) 0%, rgba(255,255,255,.10) 20%, rgba(255,255,255,0) 44%)",
      // the light tint (white .08–.14), or the subtle dark-red variant
      tone === "red" ? "linear-gradient(180deg, rgba(170,16,30,.20) 0%, rgba(100,8,18,.26) 100%)" : "linear-gradient(180deg, rgba(255,255,255,.14) 0%, rgba(255,255,255,.08) 100%)",
      // smoke so white text reads
      `linear-gradient(180deg, rgba(12,10,12,${smoke.toFixed(3)}) 0%, rgba(6,4,6,${(smoke + 0.08).toFixed(3)}) 100%)`,
    ].join(", "),
    backdropFilter: bf,
    WebkitBackdropFilter: bf,
    boxShadow: [
      "inset 0 1px 0 rgba(255,255,255,.45)", // bright specular edge (top)
      "inset 1px 0 0 rgba(255,255,255,.14)",
      "inset 0 -1px 0 rgba(255,255,255,.06)",
      "inset 0 0 30px rgba(255,255,255,.10)", // soft inner glow
      `inset 0 0 ${22 + 26 * hot}px rgba(227,10,23,${(0.3 * hot).toFixed(3)})`,
      "0 22px 48px rgba(0,0,0,.38)",
      "0 4px 12px rgba(0,0,0,.22)",
      hot > 0 ? `0 0 ${60 * hot}px rgba(227,10,23,${(0.5 * hot).toFixed(3)})` : "0 0 0 rgba(0,0,0,0)",
    ].join(", "),
  };
};

export const Glass: React.FC<{ w?: number | string; h?: number | string; r?: number; hot?: number; tint?: number; tone?: "light" | "red"; o?: number; sheenAt?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ w, h, r = 26, hot = 0, tint = 0.5, tone = "light", o = 1, sheenAt = 0, style, children }) => {
  const fr = useCurrentFrame();
  const fade = useFade();
  const sh = interpolate(fr - sheenAt, [0, 20], [-40, 140], clamp);
  return (
    <div style={{ position: "relative", width: w, height: h, overflow: "hidden", opacity: fade * o, ...glassStyle(hot, tint, r, tone), ...style }}>
      {/* liquid rim: light refraction hugging the edge, brightest top-left, a faint bounce bottom-right */}
      <div style={{ position: "absolute", inset: 0, borderRadius: r, pointerEvents: "none", background: "radial-gradient(110% 80% at 0% 0%, rgba(255,255,255,.16) 0%, rgba(255,255,255,0) 40%), radial-gradient(80% 60% at 100% 100%, rgba(255,255,255,.07) 0%, rgba(255,255,255,0) 50%)" }} />
      {/* one specular sweep when it lands */}
      {sh < 139 ? <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `linear-gradient(110deg, rgba(255,255,255,0) ${sh - 14}%, rgba(255,255,255,.26) ${sh}%, rgba(255,255,255,0) ${sh + 14}%)` }} /> : null}
      {children}
    </div>
  );
};

/** which composition is rendering: Showcase draws the bold moments on the canvas ("screen" cues) instead of in the card */
export const useIsShowcase = () => useVideoConfig().id === "Showcase";
/** children only in the full-screen Reel (in Showcase the same moment is drawn bigger on the canvas) */
export const ReelOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (useIsShowcase() ? null : <>{children}</>);

/* ---------------- 4-point sparkle (red ✦) ---------------- */
export const Sparkle: React.FC<{ x: number; y: number; size?: number; delay?: number; color?: string }> = ({ x, y, size = 70, delay = 0, color = K.red }) => {
  const fr = useCurrentFrame();
  const s = useIn(delay, 9, 220);
  const fade = useFade();
  const twinkle = 1 + 0.1 * Math.sin((fr - delay) / 4);
  return (
    <svg viewBox="-50 -50 100 100" style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, opacity: fade * on(fr, delay), transform: `scale(${s * twinkle}) rotate(${(1 - s) * -90 + (fr - delay) * 0.8}deg)`, filter: `drop-shadow(0 0 12px ${K.glow})` }}>
      <path d="M0,-50 C6,-10 10,-6 50,0 C10,6 6,10 0,50 C-6,10 -10,6 -50,0 C-10,-6 -6,-10 0,-50Z" fill={color} />
    </svg>
  );
};

/* =====================================================================================
 * BIG WORD behind the head, HIGH at the top of the frame (the user 2026-11-11: « move it higher, only a little part behind
 * my head »): the letters sit above his hair, only their bottom ~20 % is tucked behind it (hair top ≈ y 140 wide).
 * Red-metal, letters rise in one by one.
 * ===================================================================================== */
/** measured on the QA stills: hair top ≈ y 190–208 on the wide shots, letters ≈ 1.0 × fs tall → centre 145 puts
 *  ~20 % of the letters behind the hair and keeps their tops ≥ y 55 */
export const BW_Y = 145;
export const BW_SIZE = 175;
export const BigWord: React.FC<{ text: string; dur: number; y?: number; size?: number; x?: number; spacing?: number; wave?: boolean; sparkles?: boolean; delay?: number }> = ({ text, dur, y = BW_Y, size = BW_SIZE, x = 540, spacing, wave = true, sparkles = true, delay = 0 }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut(dur, 6);
  const ar = isArabic(text);
  const fit = Math.min(size, 1010 / Math.max(1, text.length * 0.5)); // stays inside 1080 wide
  const fs = ar ? fit * 0.75 : fit;
  // short words are tracked out so their letters clear his hair (head ≈ x 330–730 at the top)
  const natural = text.length * 0.47 * fs;
  const track = spacing ?? (ar || text.length < 2 ? 0 : Math.max(0, Math.min(0.55 * fs, (800 - natural) / (text.length - 1))));
  const drift = 1 + Math.max(0, fr - delay) * 0.0009;
  const sheen = interpolate(fr - delay, [6, 40], [-30, 130], clamp);
  const chars = ar ? [text] : Array.from(text);
  const wv = (ph: number) => {
    let d = `M-40,${y + fs * 0.42}`;
    for (let xx = -40; xx <= 1120; xx += 20) d += ` L${xx},${(y + fs * 0.42 + Math.sin((xx / 1080) * Math.PI * 3 + (fr + ph) / 9) * 46 * Math.sin((xx / 1080) * Math.PI)).toFixed(1)}`;
    return d;
  };
  const wp = interpolate(fr - delay, [0, 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ opacity: out * on(fr, delay) }}>
      {wave ? (
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", filter: `drop-shadow(0 0 8px ${K.glow})` }}>
          <path d={wv(0)} fill="none" stroke={K.red} strokeWidth={5} opacity={0.95} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - wp} />
          <path d={wv(25)} fill="none" stroke={K.deep} strokeWidth={3} opacity={0.8} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - wp} />
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: -60, right: -60, top: y, display: "flex", justifyContent: "center", direction: ar ? "rtl" : "ltr", transform: `translate(${x - 540}px, -50%) scale(${drift}) scaleY(${ar ? 1 : 1.18})`, filter: DARK_EDGE }}>
        {chars.map((ch, i) => {
          const s = spring({ frame: fr - delay - i * 1.6, fps, config: { damping: 13, stiffness: 210, mass: 0.6 } });
          const b = interpolate(fr - delay - i * 1.6, [0, 6], [12, 0], clamp);
          return (
            <span key={i} style={{ display: "inline-block", fontFamily: BIG_FONT, fontWeight: ar ? 900 : 400, fontSize: fs, lineHeight: 1.05, marginRight: !ar && i < chars.length - 1 ? track : 0, textTransform: "uppercase", whiteSpace: "pre", opacity: Math.min(1, s * 1.6), transform: `translateY(${(1 - s) * 0.5 * fs}px) scale(${1.25 - 0.25 * s})`, filter: `blur(${b}px)`, WebkitTextStroke: `${Math.max(1.5, fs / 150)}px rgba(40,4,8,.6)`, ...gradText(`linear-gradient(100deg, rgba(255,90,100,0) ${sheen - 12}%, rgba(255,110,118,.55) ${sheen}%, rgba(255,90,100,0) ${sheen + 12}%), ${REDMETAL}`) }}>
              {ch}
            </span>
          );
        })}
      </div>
      {sparkles ? (
        <>
          <Sparkle x={70} y={Math.max(40, y - fs * 0.35)} size={60} delay={delay + 5} color={K.white} />
          <Sparkle x={1010} y={y + fs * 0.45} size={50} delay={delay + 9} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/* =====================================================================================
 * KINETIC TYPE: words rise out of a mask one after the other (pages + free wall)
 * tone: metal (red-metal), red (flat bright red), dark (near-black on light areas / red plates)
 * ===================================================================================== */
export const Type: React.FC<{ text: string; x?: number; y: number; size?: number; delay?: number; font?: "big" | "cap"; tone?: "metal" | "red" | "dark" | "white"; rotate?: number; stagger?: number; from?: "up" | "down" | "left" | "right"; edge?: boolean; italic?: boolean; dur?: number; anchor?: "left" | "center" | "right" }> = ({ text, x = 540, y, size = 120, delay = 0, font = "big", tone = "metal", rotate = 0, stagger = 3, from = "up", edge = true, italic = false, dur, anchor = "center" }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useFade();
  const out = dur ? interpolate(fr, [dur - 5, dur], [1, 0], clamp) : 1;
  const ar = isArabic(text);
  const words = text.split(" ");
  const fam = font === "big" ? BIG_FONT : CAP_FONT;
  const fill: React.CSSProperties = { ...gradText(SILVER), filter: "drop-shadow(0 3px 8px rgba(0,0,0,.6))" }; // the user: ALL text = grey→black metal (tone kept for layout only)
  const tx = anchor === "center" ? "-50%" : anchor === "right" ? "-100%" : "0";
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(${tx},-50%) rotate(${rotate}deg)`, display: "flex", gap: size * 0.22, direction: ar ? "rtl" : "ltr", opacity: fade * out * on(fr, delay), filter: edge && tone !== "dark" ? DARK_EDGE : undefined, whiteSpace: "nowrap" }}>
      {words.map((wd, i) => {
        const s = spring({ frame: fr - delay - i * stagger, fps, config: { damping: 15, stiffness: 210, mass: 0.6 } });
        const off = (1 - s) * 105;
        const t = from === "up" ? `translateY(${off}%)` : from === "down" ? `translateY(${-off}%)` : from === "left" ? `translateX(${-off}%)` : `translateX(${off}%)`;
        return (
          <span key={i} style={{ display: "inline-block", clipPath: "inset(-30% -12% -6% -12%)", padding: "0 0.04em" }}>
            <span style={{ display: "inline-block", transform: t, fontFamily: fam, fontWeight: font === "cap" ? 900 : 400, fontStyle: italic && !ar ? "italic" : "normal", fontSize: size, lineHeight: ar ? 1.35 : 1.08, textTransform: font === "big" ? "uppercase" : "none", ...(font === "big" ? { transformOrigin: "50% 100%" } : {}), ...fill }}>
              {font === "big" ? <span style={{ display: "inline-block", transform: "scaleY(1.12)" }}>{wd}</span> : wd}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/* ---------------- SVG path that draws on ---------------- */
export const Draw: React.FC<{ d: string | string[]; color?: string; width?: number; frames?: number; delay?: number; dur: number; glow?: boolean }> = ({ d, color = K.red, width = 12, frames = 12, delay = 0, dur, glow = true }) => {
  const fr = useCurrentFrame();
  const fade = useFade();
  const paths = Array.isArray(d) ? d : [d];
  const out = useOut(dur, 5);
  return (
    <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: out * fade, overflow: "visible", filter: glow ? `drop-shadow(0 0 10px ${K.glow}) drop-shadow(0 4px 8px rgba(0,0,0,.4))` : undefined }}>
      {paths.map((pd, i) => {
        const st = delay + i * Math.round(frames * 0.6);
        const p = interpolate(fr - st, [0, frames], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
        return <path key={i} d={pd} pathLength={1} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - p} opacity={p > 0 ? 1 : 0} />;
      })}
    </svg>
  );
};

/* ---------------- pop container (logos, icons) ---------------- */
export const Pop: React.FC<{ x: number; y: number; size: number; dur: number; delay?: number; rotate?: number; children: React.ReactNode; float?: boolean; spin?: number }> = ({ x, y, size, dur, delay = 0, rotate = 0, children, float = true, spin = 0 }) => {
  const fr = useCurrentFrame();
  const s = useIn(delay, 10, 240);
  const out = useOut(dur, 5);
  const bob = float ? Math.sin((fr - delay) / 12) * 6 : 0;
  return (
    <Fade o={out * on(fr, delay)}>
      <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2 + bob, width: size, height: size, transform: `scale(${s}) rotate(${rotate + (1 - s) * -25 + spin * Math.max(0, fr - delay)}deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </Fade>
  );
};

/** the real Claude mark (its own orange) on a black-red glass tile */
export const ClaudeLogo: React.FC<{ size: number; glow?: boolean; bare?: boolean }> = ({ size, glow = true, bare = false }) => {
  const fade = useFade();
  return bare ? (
    <Img src={staticFile("logos/claude.svg")} style={{ width: size, height: size, opacity: fade, filter: glow ? `drop-shadow(0 0 ${size * 0.12}px rgba(255,120,90,.8)) drop-shadow(0 0 ${size * 0.3}px ${K.glow})` : undefined }} />
  ) : (
    <Glass w={size} h={size} r={size * 0.26} hot={glow ? 0.55 : 0} tint={0.45} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Img src={staticFile("logos/claude.svg")} style={{ width: size * 0.62, height: size * 0.62, filter: "drop-shadow(0 0 10px rgba(217,119,87,.6))" }} />
    </Glass>
  );
};

/* ---------------- pills: red plate with dark text, or glass with red text ---------------- */
export const Pill: React.FC<{ text: string; size?: number; glass?: boolean; hot?: number; style?: React.CSSProperties }> = ({ text, size = 44, glass = false, hot = 0, style }) => {
  const fade = useFade();
  const ar = isArabic(text);
  const txt: React.CSSProperties = { fontFamily: CAP_FONT, fontWeight: 900, fontSize: size, whiteSpace: "nowrap", direction: ar ? "rtl" : "ltr", lineHeight: 1.15 };
  if (glass)
    return (
      <Glass r={999} hot={hot} tint={0.6} style={{ display: "inline-flex", padding: `${size * 0.3}px ${size * 0.62}px`, ...style }}>
        <span style={{ ...txt, ...gradText(SILVER), filter: "drop-shadow(0 2px 6px rgba(0,0,0,.75))" }}>{text}</span>
      </Glass>
    );
  return (
    <div style={{ display: "inline-flex", padding: `${size * 0.3}px ${size * 0.62}px`, borderRadius: 999, background: PLATE, boxShadow: `0 14px 34px rgba(8,2,3,.45), 0 0 ${30 + 30 * hot}px rgba(227,10,23,${0.35 + 0.3 * hot}), inset 0 1px 0 rgba(255,190,194,.55)`, opacity: fade, ...style }}>
      <span style={{ ...txt, ...gradText(SILVER), filter: "drop-shadow(0 2px 6px rgba(0,0,0,.6))" }}>{text}</span>
    </div>
  );
};

/** items appearing one by one at given local frames, stacked vertically */
export const Stack: React.FC<{ x: number; y: number; items: { node: React.ReactNode; at: number }[]; gap?: number; dur: number; align?: "left" | "right" | "center" }> = ({ x, y, items, gap = 96, dur, align = "left" }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut(dur, 5);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: align === "center" ? "translateX(-50%)" : align === "right" ? "translateX(-100%)" : undefined, display: "flex", flexDirection: "column", alignItems: align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start" }}>
      {items.map((it, i) => {
        const s = spring({ frame: fr - it.at, fps, config: { damping: 13, stiffness: 200, mass: 0.6 } });
        return (
          <Fade key={i} o={out * on(fr, it.at)}>
            <div style={{ height: gap, display: "flex", alignItems: "center", transform: `translateX(${(1 - s) * (align === "right" ? 90 : -90)}px) scale(${0.85 + 0.15 * s})` }}>{it.node}</div>
          </Fade>
        );
      })}
    </div>
  );
};

/* =====================================================================================
 * FULL-SCREEN PAGE: deep black → dark red, grain, a red light sweep, vignette. ≤2.5 s.
 * ===================================================================================== */
export const Page: React.FC<{ dur: number; children: React.ReactNode; sweepAt?: number }> = ({ dur, children, sweepAt = 2 }) => {
  const fr = useCurrentFrame();
  const s = useIn(0, 18, 170);
  const out = interpolate(fr, [dur - 6, dur], [1, 0], clamp);
  const grain = Math.floor(fr / 2);
  const sweep = interpolate(fr - sweepAt, [0, 26], [-50, 150], clamp);
  const breathe = 0.5 + 0.5 * Math.sin(fr / 14);
  return (
    <AbsoluteFill style={{ opacity: out * Math.min(1, s * 1.6), transform: `scale(${1.06 - 0.06 * s})`, overflow: "hidden", background: K.black }}>
      {/* deep red → black brand gradient (the user 2026-11-12) */}
      <AbsoluteFill style={{ background: "linear-gradient(165deg, #9E0C1A 0%, #6A0812 22%, #2E0509 52%, #0B0708 82%, #050405 100%)" }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 50% at 40% 30%, rgba(227,10,23,${0.22 + 0.08 * breathe}) 0%, rgba(227,10,23,0) 60%)` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 72%, rgba(0,0,0,.7) 100%)" }} />
      {/* red light sweep */}
      <AbsoluteFill style={{ background: `linear-gradient(115deg, rgba(255,255,255,0) ${sweep - 16}%, rgba(255,255,255,.10) ${sweep - 3}%, rgba(255,255,255,.18) ${sweep}%, rgba(255,255,255,0) ${sweep + 16}%)`, mixBlendMode: "screen" }} />
      {/* fine studio lines */}
      {[120, 960].map((xx, i) => (
        <div key={i} style={{ position: "absolute", left: xx, top: 0, width: 4, height: "100%", background: i ? "linear-gradient(180deg, rgba(227,10,23,0), rgba(227,10,23,.35) 40%, rgba(227,10,23,0) 85%)" : "linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,.18) 40%, rgba(255,255,255,0) 85%)", filter: "blur(2px)" }} />
      ))}
      {/* grain */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.14, mixBlendMode: "overlay" }}>
        <filter id={`g${grain}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={grain} /></filter>
        <rect width="100%" height="100%" filter={`url(#g${grain})`} />
      </svg>
      <div style={{ position: "absolute", bottom: 300, right: 90, display: "flex", gap: 3, opacity: 0.55 }}>
        {Array.from({ length: 22 }).map((_, i) => <div key={i} style={{ width: random(`b${i}`) > 0.5 ? 3 : 7, height: 40, background: K.deep }} />)}
      </div>
      {children}
    </AbsoluteFill>
  );
};

/* ---------------- stamp: a red plate that slams (no outline) ---------------- */
export const Stamp: React.FC<{ text: string; x: number; y: number; dur: number; delay?: number; rotate?: number; size?: number }> = ({ text, x, y, dur, delay = 0, rotate = -10, size = 64 }) => {
  const fr = useCurrentFrame();
  const fade = useFade();
  const s = interpolate(fr - delay, [0, 4, 7], [2.2, 0.92, 1], clamp);
  const out = useOut(dur, 5);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rotate}deg) scale(${s})`, opacity: fade * out * on(fr, delay), padding: `${size * 0.12}px ${size * 0.42}px`, borderRadius: 14, background: PLATE, boxShadow: `0 20px 40px rgba(0,0,0,.5), 0 0 50px ${K.glowSoft}, inset 0 1px 0 rgba(255,190,194,.6)`, fontFamily: BIG_FONT, fontSize: size, lineHeight: 1.1, ...gradText(SILVER), filter: "drop-shadow(0 2px 6px rgba(0,0,0,.6))", textShadow: "0 2px 8px rgba(60,0,6,.45)", letterSpacing: 2, textTransform: "uppercase", whiteSpace: "nowrap", direction: isArabic(text) ? "rtl" : "ltr" }}>
      {text}
    </div>
  );
};

/* ---------------- chat prompt bar (glass) that types ---------------- */
export const ChatBar: React.FC<{ text: string; x: number; y: number; width?: number; dur: number; cps?: number; delay?: number; sendAt?: number }> = ({ text, x, y, width = 900, dur, cps = 1.4, delay = 0, sendAt }) => {
  const fr = useCurrentFrame();
  const s = useIn(0, 14, 200);
  const out = useOut(dur, 5);
  const n = Math.max(0, Math.floor((fr - delay) * cps));
  const ar = isArabic(text);
  const send = sendAt === undefined ? 0 : spring({ frame: fr - sendAt, fps: 30, config: { damping: 10, stiffness: 260, mass: 0.5 } });
  return (
    <Fade o={out * Math.min(1, s * 1.5)}>
      <div style={{ position: "absolute", left: x, top: y, width, transform: `translate(-50%,-50%) translateY(${(1 - s) * 70}px)` }}>
        <Glass r={36} hot={0.15 + 0.6 * send} tint={0.5} style={{ display: "flex", alignItems: "center", gap: 20, padding: "24px 26px" }}>
          <div style={{ width: 62, height: 62, borderRadius: 18, background: "rgba(255,255,255,.16)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Img src={staticFile("logos/claude.svg")} style={{ width: 40, height: 40 }} />
          </div>
          <div style={{ flex: 1, fontFamily: CAP_FONT, fontWeight: 800, fontSize: 46, ...gradText(SILVER), filter: "drop-shadow(0 2px 6px rgba(0,0,0,.75))", direction: ar ? "rtl" : "ltr", whiteSpace: "nowrap", overflow: "hidden" }}>
            {text.slice(0, n)}
            <span style={{ opacity: Math.floor(fr / 8) % 2 ? 1 : 0, color: K.red }}>|</span>
          </div>
          <div style={{ width: 62, height: 62, borderRadius: 999, background: PLATE, ...gradText(SILVER), filter: "drop-shadow(0 2px 6px rgba(0,0,0,.6))", fontSize: 36, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: CAP_FONT, transform: `scale(${1 + 0.25 * Math.sin(Math.min(1, send) * Math.PI)})`, boxShadow: `0 0 ${20 + 30 * send}px ${K.glow}` }}>↑</div>
        </Glass>
      </div>
    </Fade>
  );
};

/* ---------------- red flash / whip used for transitions ---------------- */
export const Flash: React.FC<{ frames?: number; color?: string }> = ({ frames = 6, color = K.red }) => {
  const fr = useCurrentFrame();
  const o = interpolate(fr, [0, 1, frames], [0, 0.6, 0], clamp);
  return <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, rgba(255,255,255,.95) 0%, ${color} 30%, rgba(60,6,12,.9) 70%, #0B0B0B 100%)`, opacity: o }} />;
};

/** a diagonal red light band crossing the frame (accent on a key word) */
export const LightSweep: React.FC<{ frames?: number; delay?: number }> = ({ frames = 14, delay = 0 }) => {
  const fr = useCurrentFrame();
  const p = interpolate(fr - delay, [0, frames], [-40, 140], clamp);
  if (fr < delay || p >= 140) return null;
  return <AbsoluteFill style={{ pointerEvents: "none", background: `linear-gradient(120deg, rgba(255,255,255,0) ${p - 18}%, rgba(255,255,255,.18) ${p - 4}%, rgba(255,255,255,.32) ${p}%, rgba(255,255,255,0) ${p + 14}%)`, mixBlendMode: "screen" }} />;
};

/* =====================================================================================
 * PHOTO: the real photo in its REAL colours (the user: no red duotone), borderless rounded print, a soft shadow and a
 * glassy specular highlight on top. tone "dark" = the same photo, just dimmed (still real colours).
 * ===================================================================================== */
export const Photo: React.FC<{ src: string; x: number; y: number; w: number; h: number; dur: number; delay?: number; rotate?: number; pos?: string; tone?: "duo" | "dark" | "natural"; frame?: boolean; from?: "up" | "left" | "right" }> = ({ src, x, y, w: wd, h, dur, delay = 0, rotate = 0, pos = "50% 50%", tone = "natural", from = "up" }) => {
  const fr = useCurrentFrame();
  const s = useIn(delay, 13, 170);
  const out = useOut(dur, 5);
  const kb = 1.08 + Math.min(Math.max(0, fr - delay), 150) * 0.0009;
  const blur = interpolate(fr - delay, [0, 6], [10, 0], clamp);
  const sh = interpolate(fr - delay - 4, [0, 18], [-40, 140], clamp);
  const off = from === "up" ? `translateY(${(1 - s) * 110}px)` : from === "left" ? `translateX(${(1 - s) * -260}px)` : `translateX(${(1 - s) * 260}px)`;
  const r = Math.max(16, Math.min(wd, h) * 0.09);
  return (
    <Fade o={out * on(fr, delay)}>
      <div style={{ position: "absolute", left: x - wd / 2, top: y - h / 2, width: wd, height: h, transform: `${off} rotate(${rotate + (1 - s) * 7}deg) scale(${0.88 + 0.12 * s})` }}>
        <FadeDiv style={{ position: "absolute", inset: 0, borderRadius: r, overflow: "hidden", isolation: "isolate", background: K.black, boxShadow: "0 26px 60px rgba(0,0,0,.5), 0 6px 16px rgba(0,0,0,.3)" }}>
          <Img src={staticFile(`photos/${src}`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, transform: `scale(${kb})`, filter: `${tone === "dark" ? "brightness(.72) contrast(1.05)" : "contrast(1.04) saturate(1.05)"} blur(${blur}px)` }} />
          {/* glass sheen: top-left highlight + one specular sweep */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,.22) 0%, rgba(255,255,255,0) 30%), linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(0,0,0,.35) 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.45), inset 0 0 30px rgba(255,255,255,.08)", borderRadius: r }} />
          {sh < 139 ? <div style={{ position: "absolute", inset: 0, background: `linear-gradient(110deg, rgba(255,255,255,0) ${sh - 12}%, rgba(255,255,255,.3) ${sh}%, rgba(255,255,255,0) ${sh + 12}%)` }} /> : null}
        </FadeDiv>
      </div>
    </Fade>
  );
};

/* =====================================================================================
 * Rows, labels, counters, cards
 * ===================================================================================== */

/** checklist row on glass: red box (tick) or dark box (cross) + red text; the row wipes in on its word */
export const CheckBar: React.FC<{ text: string; at: number; mark?: "check" | "cross" | "dot"; width?: number; size?: number; hot?: boolean; strikeAt?: number }> = ({ text, at: a, mark = "check", width = 600, size = 46, hot = true, strikeAt }) => {
  const fr = useCurrentFrame();
  const wipe = interpolate(fr - a, [0, 9], [0, 100], { ...clamp, easing: Easing.out(Easing.cubic) });
  const tick = interpolate(fr - a - 4, [0, 7], [0, 1], clamp);
  const fade = useFade();
  const strikeP = strikeAt ?? (mark === "cross" ? a + 8 : undefined);
  const strike = strikeP === undefined ? 0 : interpolate(fr - strikeP, [0, 7], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ar = isArabic(text);
  const box = Math.round(size * 1.0);
  const h = size * 1.95;
  const clip = ar ? `inset(0 0 0 ${100 - wipe}%)` : `inset(0 ${100 - wipe}% 0 0)`;
  return (
    <div style={{ position: "relative", width, height: h, direction: ar ? "rtl" : "ltr" }}>
      <Glass w="100%" h="100%" r={Math.round(h * 0.3)} hot={hot && mark === "check" ? 0.32 : 0} tint={0.5} sheenAt={a + 3} style={{ clipPath: clip }} />
      <div style={{ position: "absolute", top: "50%", [ar ? "right" : "left"]: size * 0.45, transform: `translateY(-50%) scale(${0.4 + 0.6 * Math.min(1, tick * 2)})`, width: box, height: box, borderRadius: box * 0.26, background: mark === "check" ? PLATE : "rgba(255,255,255,.16)", boxShadow: mark === "check" ? `0 0 18px ${K.glow}, inset 0 1px 0 rgba(255,190,194,.6)` : "inset 0 1px 0 rgba(255,255,255,.4)", opacity: fade * on(fr, a) }}>
        {mark === "dot" ? <div style={{ position: "absolute", inset: "32%", borderRadius: 99, background: K.white }} /> : (
          <svg viewBox="0 0 24 24" style={{ position: "absolute", inset: 0 }}>
            <path d={mark === "check" ? "M5,12.5 L10,17 L19,7" : "M6.5,6.5 L17.5,17.5 M17.5,6.5 L6.5,17.5"} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tick} fill="none" stroke={mark === "check" ? K.white : K.hi} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div style={{ position: "absolute", top: "50%", [ar ? "right" : "left"]: size * 0.45 + box + size * 0.45, transform: "translateY(-50%)", fontFamily: CAP_FONT, fontWeight: 900, fontSize: size, lineHeight: 1.2, ...gradText(SILVER), filter: "drop-shadow(0 2px 6px rgba(0,0,0,.75))", whiteSpace: "nowrap", clipPath: ar ? `inset(-30% 0 -30% ${100 - wipe}%)` : `inset(-30% ${100 - wipe}% -30% 0)`, opacity: fade }}>
        {text}
        <div style={{ position: "absolute", left: -6, right: -6, top: "52%", height: Math.max(5, size * 0.12), borderRadius: 4, background: K.red, transform: `scaleX(${strike})`, transformOrigin: ar ? "right" : "left", boxShadow: `0 0 10px ${K.glow}` }} />
      </div>
    </div>
  );
};

/** a word on glass (red text) or on a red plate (dark text), wipes in */
export const Label: React.FC<{ text: string; x: number; y: number; dur: number; delay?: number; size?: number; red?: boolean; rotate?: number; anchor?: "left" | "center" | "right" }> = ({ text, x, y, dur, delay = 0, size = 46, red = false, rotate = 0, anchor = "center" }) => {
  const fr = useCurrentFrame();
  const out = useOut(dur, 5);
  const s = useIn(delay, 13, 220);
  const wipe = interpolate(fr - delay, [0, 9], [0, 100], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ar = isArabic(text);
  const tx = anchor === "center" ? "-50%" : anchor === "right" ? "-100%" : "0";
  const clip = ar ? `inset(0 0 0 ${100 - wipe}%)` : `inset(0 ${100 - wipe}% 0 0)`;
  const txt: React.CSSProperties = { fontFamily: CAP_FONT, fontWeight: 900, fontSize: size, lineHeight: 1.2, whiteSpace: "nowrap", direction: ar ? "rtl" : "ltr", ...gradText(SILVER), filter: "drop-shadow(0 2px 6px rgba(0,0,0,.6))", textShadow: red ? "0 1px 6px rgba(60,0,6,.4)" : TXT_SHADOW };
  const pad = `${size * 0.24}px ${size * 0.5}px`;
  return (
    <Fade o={out * on(fr, delay)}>
      <div style={{ position: "absolute", left: x, top: y, transform: `translate(${tx},-50%) rotate(${rotate}deg) translateY(${(1 - s) * 30}px)` }}>
        {red ? (
          <FadeDiv style={{ padding: pad, borderRadius: 14, background: PLATE, clipPath: clip, boxShadow: "inset 0 1px 0 rgba(255,190,194,.6)", filter: `drop-shadow(0 12px 22px rgba(0,0,0,.45)) drop-shadow(0 0 22px ${K.glowSoft})` }}><span style={txt}>{text}</span></FadeDiv>
        ) : (
          <Glass r={size * 0.42} tint={0.5} sheenAt={delay + 3} style={{ padding: pad, clipPath: clip }}><span style={txt}>{text}</span></Glass>
        )}
      </div>
    </Fade>
  );
};

/** red-metal count-up landing on local frame `land` */
export const CountUp: React.FC<{ from?: number; to: number; land: number; start?: number; x: number; y: number; size?: number; prefix?: string; suffix?: string; dur: number; sep?: string; pad?: number }> = ({ from = 0, to, land, start = 0, x, y, size = 260, prefix = "", suffix = "", dur, sep = " ", pad = 0 }) => {
  const fr = useCurrentFrame();
  const fade = useFade();
  const out = useOut(dur, 5);
  const s = useIn(start, 12, 220);
  const p = interpolate(fr, [start, land], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const v = Math.round(from + (to - from) * p);
  const txt = v.toString().padStart(pad, "0").replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  const bump = fr >= land ? interpolate(fr - land, [0, 3, 8], [1.14, 0.98, 1], clamp) : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${(0.7 + 0.3 * s) * bump}) scaleY(1.15)`, opacity: fade * out * on(fr, start), fontFamily: BIG_FONT, fontSize: size, lineHeight: 1, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", filter: DARK_EDGE, ...gradText(REDMETAL) }}>
      {prefix}{txt}{suffix}
    </div>
  );
};

/** premium "user" card: glass, optional red-duotone photo, red-metal label; can glow red or dim */
export const UserCard: React.FC<{ label: string; x: number; y: number; w?: number; h?: number; dur: number; delay?: number; photo?: string; photoAt?: number; pos?: string; redAt?: number; dimAt?: number; logoAt?: number; tag?: string; tagAt?: number; rotate?: number; flipAt?: number; from?: "left" | "right" }> = ({ label, x, y, w: wd = 240, h = 330, dur, delay = 0, photo, photoAt = 0, pos = "50% 30%", redAt, dimAt, logoAt, tag, tagAt = 0, rotate = 0, flipAt, from = "left" }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useIn(delay, 13, 200);
  const out = useOut(dur, 5);
  const red = redAt === undefined ? 0 : interpolate(fr - redAt, [0, 6], [0, 1], clamp);
  const dim = dimAt === undefined ? 0 : interpolate(fr - dimAt, [0, 8], [0, 1], clamp);
  const ph = photo ? interpolate(fr - photoAt, [0, 8], [0, 1], clamp) : 0;
  const lg = logoAt === undefined ? 0 : spring({ frame: fr - logoAt, fps, config: { damping: 10, stiffness: 240, mass: 0.6 } });
  const tg = tag ? spring({ frame: fr - tagAt, fps, config: { damping: 12, stiffness: 220, mass: 0.6 } }) : 0;
  const flip = flipAt === undefined ? 0 : interpolate(fr - flipAt, [0, 10], [0, 360], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const withPhoto = !!photo && ph > 0.5;
  const enter = (1 - s) * (from === "left" ? -220 : 220);
  return (
    <Fade o={out * on(fr, delay) * (1 - dim * 0.5)}>
      <div style={{ position: "absolute", left: x - wd / 2, top: y - h / 2, width: wd, height: h, transform: `translateX(${enter}px) rotate(${rotate}deg) perspective(900px) rotateY(${flip}deg) scale(${(0.9 + 0.1 * s) * (1 + red * 0.06)})` }}>
        <Glass w="100%" h="100%" r={28} hot={0.85 * red} tint={0.45} sheenAt={redAt ?? delay}>
          {photo ? (
            <div style={{ position: "absolute", inset: 10, borderRadius: 20, overflow: "hidden", isolation: "isolate", opacity: ph }}>
              <Img src={staticFile(`photos/${photo}`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, filter: `saturate(${1.05 - dim * 0.6}) brightness(${1 - dim * 0.4})`, transform: `scale(${1.08 + fr * 0.0006})` }} />
            </div>
          ) : null}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "46%", background: "linear-gradient(180deg, rgba(6,4,6,0) 0%, rgba(6,4,6,.78) 100%)" }} />
          {logoAt !== undefined ? (
            <div style={withPhoto ? { position: "absolute", right: 14, top: 14, transform: `scale(${lg * 0.4})`, transformOrigin: "100% 0" } : { position: "absolute", left: "50%", top: "40%", transform: `translate(-50%, -50%) scale(${lg})` }}>
              <ClaudeLogo size={wd * 0.44} glow={red > 0.5} />
            </div>
          ) : null}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 18, textAlign: "center", fontFamily: BIG_FONT, fontSize: wd * 0.24, lineHeight: 1, letterSpacing: 1, filter: "drop-shadow(0 2px 6px rgba(0,0,0,.5))", ...gradText(red > 0.5 ? REDGRAD : SILVER) }}>{label}</div>
        </Glass>
        {tag ? (
          <div style={{ position: "absolute", left: "50%", bottom: -70, transform: `translateX(-50%) scale(${tg})` }}>
            <Fade o={on(fr, tagAt)}><Pill text={tag} size={36} glass={red <= 0.5} hot={red} /></Fade>
          </div>
        ) : null}
      </div>
    </Fade>
  );
};

/** an AI answer on glass: lines fill, « parfaite » ticks, then at wrongAt it flips red, shakes, the tick is struck */
export const AnswerCard: React.FC<{ x: number; y: number; scale?: number; wrongAt?: number; okAt?: number }> = ({ x, y, scale = 1.8, wrongAt = 9999, okAt = 30 }) => {
  const fr = useCurrentFrame();
  const s = useIn(2, 14, 190);
  const wr = interpolate(fr - wrongAt, [0, 5], [0, 1], clamp);
  const ok = spring({ frame: fr - okAt, fps: 30, config: { damping: 11, stiffness: 230, mass: 0.6 } });
  const strike = interpolate(fr - wrongAt - 3, [0, 6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const shake = fr >= wrongAt && fr < wrongAt + 10 ? Math.sin(fr * 2.4) * 10 * (1 - (fr - wrongAt) / 10) : 0;
  const lines = [0.95, 0.82, 0.9, 0.66];
  return (
    <Fade o={Math.min(1, s * 1.5)}>
      <div style={{ position: "absolute", left: x, top: y, width: 460, transform: `translate(-50%,-50%) translateX(${shake}px) scale(${scale * (0.9 + 0.1 * s)})` }}>
        <Glass r={26} hot={0.85 * wr} tint={0.45} style={{ padding: 28, fontFamily: CAP_FONT }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 900, fontSize: 28, color: K.white }}><ClaudeLogo size={44} glow={false} />réponse</div>
          {lines.map((wd, i) => {
            const p = interpolate(fr - 4 - i * 5, [0, 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
            return (
              <div key={i} style={{ height: 15, width: `${wd * 100}%`, borderRadius: 8, marginTop: 15, background: "rgba(255,255,255,.12)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${p * 100}%`, borderRadius: 8, background: wr > 0.5 ? `linear-gradient(90deg, ${K.hi}, ${K.red})` : "linear-gradient(90deg, rgba(255,255,255,.85), rgba(255,255,255,.55))" }} />
              </div>
            );
          })}
          <div style={{ marginTop: 22, display: "inline-flex", alignItems: "center", gap: 12, padding: "8px 18px", borderRadius: 12, background: wr > 0.5 ? "rgba(255,255,255,.14)" : PLATE, transform: `scale(${0.6 + 0.4 * ok})`, transformOrigin: "left center", opacity: on(fr, okAt), position: "relative" }}>
            <svg viewBox="0 0 24 24" style={{ width: 30, height: 30 }}><path d="M5,12.5 L10,17 L19,7" fill="none" stroke={wr > 0.5 ? K.hi : K.white} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ fontWeight: 900, fontSize: 36, color: wr > 0.5 ? K.hi : K.white }}>parfaite</span>
            <div style={{ position: "absolute", left: 8, right: 8, top: "50%", height: 5, background: K.hi, transform: `scaleX(${strike})`, transformOrigin: "left", boxShadow: `0 0 10px ${K.glow}` }} />
          </div>
        </Glass>
      </div>
    </Fade>
  );
};

/* =====================================================================================
 * New kinetic pieces (v3): something moves on every phrase
 * ===================================================================================== */

/** red face-tracking corner brackets around a box (ref2), with an optional glass tag on top */
export const Brackets: React.FC<{ x: number; y: number; w: number; h: number; dur: number; delay?: number; tag?: string; tagSide?: "top" | "bottom" }> = ({ x, y, w: wd, h, dur, delay = 0, tag, tagSide = "top" }) => {
  const fr = useCurrentFrame();
  const fade = useFade();
  const s = useIn(delay, 12, 260);
  const out = useOut(dur, 5);
  const L = 70;
  const grow = 1.25 - 0.25 * s;
  const breathe = 1 + 0.012 * Math.sin((fr - delay) / 6);
  const cx = x + wd / 2, cy = y + h / 2;
  const g = (sx: number, sy: number) => `translate(${cx + sx * (wd / 2) * grow * breathe} ${cy + sy * (h / 2) * grow * breathe})`;
  return (
    <>
      <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", opacity: fade * out * Math.min(1, s * 2) * on(fr, delay), filter: `drop-shadow(0 0 10px ${K.glow})` }}>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => (
          <path key={i} transform={g(sx, sy)} d={`M0,${-sy * L} L0,0 L${-sx * L},0`} fill="none" stroke={K.red} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </svg>
      {tag ? <Label text={tag} x={cx} y={tagSide === "top" ? y - 30 : y + h + 40} size={50} red dur={dur} delay={delay + 4} /> : null}
    </>
  );
};

/** bar chart on glass: bars rise at their local frames; the last one is red and overshoots with an arrow */
export const Bars: React.FC<{ x: number; y: number; w?: number; h?: number; dur: number; bars: { v: number; at: number; label?: string }[]; hotLast?: boolean; title?: string }> = ({ x, y, w: wd = 900, h = 270, dur, bars, hotLast = true, title }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useIn(0, 14, 200);
  const out = useOut(dur, 5);
  const bw = (wd - 80) / bars.length;
  return (
    <Fade o={out * Math.min(1, s * 1.5)}>
      <div style={{ position: "absolute", left: x - wd / 2, top: y - h / 2, width: wd, height: h, transform: `translateY(${(1 - s) * 80}px)` }}>
        <Glass w="100%" h="100%" r={28} tint={0.5}>
          {[0.25, 0.5, 0.75].map((g, i) => <div key={i} style={{ position: "absolute", left: 30, right: 30, top: 30 + (h - 60) * g, height: 2, background: "rgba(255,255,255,.14)" }} />)}
          {title ? <div style={{ position: "absolute", left: 30, top: 18, fontFamily: CAP_FONT, fontWeight: 900, fontSize: 30, ...gradText(SILVER), filter: "drop-shadow(0 2px 6px rgba(0,0,0,.6))" }}>{title}</div> : null}
        </Glass>
        <FadeDiv style={{ position: "absolute", inset: 0 }}>
          {bars.map((b, i) => {
            const p = spring({ frame: fr - b.at, fps, config: { damping: 11, stiffness: 120, mass: 0.7 } });
            const last = hotLast && i === bars.length - 1;
            const bh = (h - 60) * b.v * p;
            return (
              <div key={i} style={{ position: "absolute", left: 40 + i * bw + bw * 0.15, width: bw * 0.7, bottom: 30, height: Math.max(0, bh), borderRadius: "12px 12px 4px 4px", background: last ? PLATE : "linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.55))", boxShadow: last ? `0 0 ${50 * p}px ${K.glow}` : undefined, opacity: on(fr, b.at) }}>
                {b.label ? <div style={{ position: "absolute", top: -64, left: "50%", transform: `translateX(-50%) scale(${p})`, fontFamily: BIG_FONT, fontSize: 64, lineHeight: 1, whiteSpace: "nowrap", filter: DARK_EDGE, ...gradText(REDGRAD) }}>{b.label}</div> : null}
              </div>
            );
          })}
        </FadeDiv>
      </div>
    </Fade>
  );
};

/** grid of person icons; at hiAt all dim except `picks`, which glow red (the minority) */
export const People: React.FC<{ x: number; y: number; cols?: number; rows?: number; size?: number; dur: number; hiAt: number; picks?: number[]; gap?: number }> = ({ x, y, cols = 12, rows = 3, size = 58, dur, hiAt, picks = [7, 16, 28], gap = 16 }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut(dur, 5);
  const wd = cols * size + (cols - 1) * gap + 60, h = rows * size * 1.2 + (rows - 1) * gap + 50;
  const hi = interpolate(fr - hiAt, [0, 8], [0, 1], clamp);
  const s = useIn(0, 14, 200);
  return (
    <Fade o={out * Math.min(1, s * 1.5)}>
      <div style={{ position: "absolute", left: x - wd / 2, top: y - h / 2, width: wd, height: h, transform: `translateY(${(1 - s) * 70}px)` }}>
        <Glass w="100%" h="100%" r={28} tint={0.5} hot={0.3 * hi}>
          <div style={{ position: "absolute", left: 30, top: 25, display: "grid", gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap }}>
            {Array.from({ length: cols * rows }).map((_, i) => {
              const ps = spring({ frame: fr - 2 - (i % cols) * 0.8 - Math.floor(i / cols) * 2, fps, config: { damping: 12, stiffness: 240, mass: 0.5 } });
              const pick = picks.includes(i);
              const col = pick ? (hi > 0.5 ? K.hi : "rgba(255,255,255,.88)") : `rgba(255,255,255,${0.88 - hi * 0.66})`;
              const pop = pick ? 1 + 0.3 * hi + 0.05 * Math.sin((fr - hiAt) / 4) * hi : 1;
              return (
                <svg key={i} viewBox="0 0 100 120" style={{ width: size, height: size * 1.2, transform: `scale(${ps * pop})`, overflow: "visible", filter: pick && hi > 0.5 ? `drop-shadow(0 0 14px ${K.glow})` : undefined }}>
                  <circle cx="50" cy="30" r="22" fill={col} />
                  <path d="M10,118 C10,78 28,60 50,60 C72,60 90,78 90,118 Z" fill={col} />
                </svg>
              );
            })}
          </div>
        </Glass>
      </div>
    </Fade>
  );
};

/** semicircle gauge: needle sweeps to `value` (0–1) by local frame `land` */
export const Gauge: React.FC<{ x: number; y: number; r?: number; dur: number; land: number; value?: number; label?: string; start?: number }> = ({ x, y, r = 120, dur, land, value = 0.92, label, start = 0 }) => {
  const fr = useCurrentFrame();
  const s = useIn(start, 13, 200);
  const out = useOut(dur, 5);
  const p = interpolate(fr, [start + 2, land], [0, value], { ...clamp, easing: Easing.out(Easing.cubic) });
  const wob = fr > land ? Math.sin((fr - land) / 2.5) * 0.015 * Math.max(0, 1 - (fr - land) / 20) : 0;
  const a = Math.PI * (1 - (p + wob));
  const W = r * 2 + 80, H = r + 110;
  return (
    <Fade o={out * on(fr, start)}>
      <div style={{ position: "absolute", left: x - W / 2, top: y - H / 2, width: W, height: H, transform: `scale(${0.8 + 0.2 * s})` }}>
        <Glass w="100%" h="100%" r={30} tint={0.5} hot={0.45 * p}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
            <path d={`M40,${r + 40} A${r},${r} 0 0 1 ${W - 40},${r + 40}`} fill="none" stroke="rgba(255,255,255,.16)" strokeWidth={18} strokeLinecap="round" />
            <path d={`M40,${r + 40} A${r},${r} 0 0 1 ${W - 40},${r + 40}`} fill="none" stroke={K.red} strokeWidth={18} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} style={{ filter: `drop-shadow(0 0 8px ${K.glow})` }} />
            {Array.from({ length: 11 }).map((_, i) => {
              const t = Math.PI * (1 - i / 10);
              return <line key={i} x1={W / 2 + Math.cos(t) * (r - 28)} y1={r + 40 - Math.sin(t) * (r - 28)} x2={W / 2 + Math.cos(t) * (r - 40)} y2={r + 40 - Math.sin(t) * (r - 40)} stroke="rgba(255,255,255,.5)" strokeWidth={4} />;
            })}
            <line x1={W / 2} y1={r + 40} x2={W / 2 + Math.cos(a) * (r - 30)} y2={r + 40 - Math.sin(a) * (r - 30)} stroke={K.white} strokeWidth={8} strokeLinecap="round" />
            <circle cx={W / 2} cy={r + 40} r={14} fill={K.white} />
          </svg>
          {label ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center", fontFamily: CAP_FONT, fontWeight: 900, fontSize: 32, ...gradText(SILVER), filter: "drop-shadow(0 2px 6px rgba(0,0,0,.75))", whiteSpace: "nowrap", direction: isArabic(label) ? "rtl" : "ltr" }}>{label}</div> : null}
        </Glass>
      </div>
    </Fade>
  );
};

/** two glass circles slide in from both sides and overlap; the overlap glows red with `result` */
export const Venn: React.FC<{ x: number; y: number; r?: number; dur: number; a: string; b: string; bAt?: number; mergeAt: number; result?: string; resultAt?: number }> = ({ x, y, r = 140, dur, a, b, bAt = 4, mergeAt, result, resultAt = 9999 }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut(dur, 5);
  const sa = spring({ frame: fr, fps, config: { damping: 14, stiffness: 180, mass: 0.6 } });
  const sb = spring({ frame: fr - bAt, fps, config: { damping: 14, stiffness: 180, mass: 0.6 } });
  const m = spring({ frame: fr - mergeAt, fps, config: { damping: 12, stiffness: 160, mass: 0.7 } });
  const res = spring({ frame: fr - resultAt, fps, config: { damping: 10, stiffness: 240, mass: 0.6 } });
  const sep = interpolate(m, [0, 1], [r * 1.25, r * 0.55]);
  const circ = (cx: number, t: string, s: number, side: number) => (
    <div style={{ position: "absolute", left: cx - r, top: -r, width: r * 2, height: r * 2, transform: `translateX(${(1 - s) * side * 500}px)`, opacity: s > 0.01 ? 1 : 0 }}>
      <Glass w="100%" h="100%" r={999} tint={0.35} hot={0.4 * m} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: CAP_FONT, fontWeight: 900, fontSize: 42, ...gradText(SILVER), filter: "drop-shadow(0 2px 6px rgba(0,0,0,.75))", transform: `translateX(${-side * r * 0.42 * m}px) scale(${1 - 0.25 * m})`, whiteSpace: "nowrap", opacity: 1 - 0.9 * m }}>{t}</div>
      </Glass>
    </div>
  );
  return (
    <Fade o={out}>
      <div style={{ position: "absolute", left: x, top: y }}>
        {circ(-sep, a, sa, -1)}
        {circ(sep, b, sb, 1)}
        <FadeDiv o={m} style={{ position: "absolute", left: -r * 0.32, top: -r * 0.72, width: r * 0.64, height: r * 1.44, borderRadius: "50%", background: `radial-gradient(closest-side, rgba(255,59,71,${0.95 * m}), rgba(227,10,23,${0.55 * m}) 60%, rgba(227,10,23,0))`, filter: "blur(4px)" }} />
        {result ? (
          <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(-50%,-50%) scale(${res})` }}>
            <Fade o={on(fr, resultAt)}><Pill text={result} size={50} hot={1} /></Fade>
          </div>
        ) : null}
      </div>
    </Fade>
  );
};

/** rating stars filling one by one (red) */
export const Stars: React.FC<{ x: number; y: number; n?: number; size?: number; dur: number; delay?: number; step?: number; shape?: "star" | "check" }> = ({ x, y, n = 5, size = 54, dur, delay = 0, step = 3, shape = "star" }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut(dur, 5);
  const s = useIn(delay, 13, 220);
  return (
    <Fade o={out * on(fr, delay)}>
      <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${0.8 + 0.2 * s})` }}>
        <Glass r={999} tint={0.5} style={{ display: "flex", gap: 8, padding: "14px 24px" }}>
          {Array.from({ length: n }).map((_, i) => {
            const p = spring({ frame: fr - delay - 4 - i * step, fps, config: { damping: 9, stiffness: 260, mass: 0.5 } });
            return (
              <svg key={i} viewBox="-50 -50 100 100" style={{ width: size, height: size, transform: `scale(${0.5 + 0.5 * p}) rotate(${(1 - p) * -60}deg)`, filter: p > 0.5 ? `drop-shadow(0 0 8px ${K.glow})` : undefined }}>
                {shape === "star" ? <path d="M0,-46 L13,-15 L46,-14 L20,7 L29,40 L0,21 L-29,40 L-20,7 L-46,-14 L-13,-15Z" fill={p > 0.5 ? K.hi : "rgba(255,255,255,.22)"} /> : (
                  <>
                    <rect x={-42} y={-42} width={84} height={84} rx={22} fill={p > 0.5 ? K.red : "rgba(255,255,255,.22)"} />
                    <path d="M-22,2 L-6,18 L24,-16" fill="none" stroke={K.white} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={p > 0.5 ? 1 : 0} />
                  </>
                )}
              </svg>
            );
          })}
        </Glass>
      </div>
    </Fade>
  );
};

/** chat bubble (glass, red text) — or `mine` = red plate, dark text — with typing dots before the text */
export const Bubble: React.FC<{ text: string; x: number; y: number; dur: number; delay?: number; mine?: boolean; size?: number; typing?: number; anchor?: "left" | "right" | "center"; maxW?: number }> = ({ text, x, y, dur, delay = 0, mine = false, size = 42, typing = 8, anchor = "center", maxW = 900 }) => {
  const fr = useCurrentFrame();
  const out = useOut(dur, 5);
  const s = useIn(delay, 12, 230);
  const ar = isArabic(text);
  const showText = fr - delay >= typing;
  const tx = anchor === "center" ? "-50%" : anchor === "right" ? "-100%" : "0";
  const content = showText ? (
    <span style={{ fontFamily: CAP_FONT, fontWeight: 900, fontSize: size, lineHeight: 1.25, ...gradText(SILVER), filter: "drop-shadow(0 2px 6px rgba(0,0,0,.6))", textShadow: mine ? undefined : TXT_SHADOW, direction: ar ? "rtl" : "ltr", whiteSpace: "nowrap" }}>{text}</span>
  ) : (
    <div style={{ display: "flex", gap: 10, padding: "8px 4px" }}>
      {[0, 1, 2].map((i) => <div key={i} style={{ width: 16, height: 16, borderRadius: 99, background: K.white, transform: `translateY(${Math.sin((fr - i * 3) / 2.5) * 5}px)` }} />)}
    </div>
  );
  const radius = mine ? "32px 32px 8px 32px" : "32px 32px 32px 8px";
  return (
    <Fade o={out * on(fr, delay)}>
      <div style={{ position: "absolute", left: x, top: y, maxWidth: maxW, transform: `translate(${tx},-50%) translateY(${(1 - s) * 40}px) scale(${0.8 + 0.2 * s})`, transformOrigin: mine ? "100% 100%" : "0 100%" }}>
        {mine ? (
          <FadeDiv style={{ padding: `${size * 0.42}px ${size * 0.7}px`, borderRadius: radius, background: PLATE, boxShadow: `0 16px 34px rgba(0,0,0,.4), 0 0 30px ${K.glowSoft}, inset 0 1px 0 rgba(255,190,194,.6)` }}>{content}</FadeDiv>
        ) : (
          <Glass r={32} tint={0.5} style={{ borderRadius: radius, padding: `${size * 0.42}px ${size * 0.7}px` }}>{content}</Glass>
        )}
      </div>
    </Fade>
  );
};

/** storyboard film strip on glass sliding across: numbered frames light up red one after the other */
export const FilmStrip: React.FC<{ y: number; dur: number; n?: number; photos?: string[]; step?: number }> = ({ y, dur, n = 5, photos = [], step = 8 }) => {
  const fr = useCurrentFrame();
  const out = useOut(dur, 5);
  const s = useIn(0, 15, 150);
  const fw = 230, gap = 26;
  const total = n * (fw + gap);
  const slide = (1 - s) * 700 - fr * 2.2;
  return (
    <Fade o={out}>
      <div style={{ position: "absolute", left: 540 - total / 2 + 120, top: y - 90, display: "flex", gap, transform: `translateX(${slide}px) rotate(-3deg)` }}>
        {Array.from({ length: n }).map((_, i) => {
          const lit = interpolate(fr - 4 - i * step, [0, 5], [0, 1], clamp);
          const ph = photos[i % Math.max(1, photos.length)];
          return (
            <Glass key={i} w={fw} h={180} r={22} tint={0.45} hot={0.45 * lit}>
              {ph ? (
                <div style={{ position: "absolute", inset: 10, borderRadius: 12, overflow: "hidden", isolation: "isolate", opacity: 0.25 + 0.75 * lit }}>
                  <Img src={staticFile(`photos/${ph}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ) : null}
              <div style={{ position: "absolute", left: 14, top: 8, fontFamily: BIG_FONT, fontSize: 46, ...gradText(lit > 0.5 ? REDGRAD : SILVER), filter: DARK_EDGE }}>{String(i + 1).padStart(2, "0")}</div>
            </Glass>
          );
        })}
      </div>
    </Fade>
  );
};

/** glass phone showing a "made with AI" product, slides up */
export const Phone: React.FC<{ x: number; y: number; dur: number; delay?: number; scale?: number; label?: string; sub?: string; rotate?: number }> = ({ x, y, dur, delay = 0, scale = 1, label = "produit", sub = "made with AI", rotate = 6 }) => {
  const fr = useCurrentFrame();
  const s = useIn(delay, 14, 170);
  const out = useOut(dur, 5);
  const bob = Math.sin((fr - delay) / 14) * 6;
  const load = interpolate(fr - delay - 6, [0, 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <Fade o={out * on(fr, delay)}>
      <div style={{ position: "absolute", left: x - 110, top: y - 200 + bob, width: 220, height: 400, transform: `translateY(${(1 - s) * 260}px) rotate(${rotate - (1 - s) * 14}deg) scale(${scale})` }}>
        <Glass w="100%" h="100%" r={40} tint={0.5} hot={0.35} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", width: 70, height: 10, borderRadius: 99, background: "rgba(0,0,0,.55)" }} />
          <ClaudeLogo size={84} glow />
          <div style={{ fontFamily: CAP_FONT, fontWeight: 900, fontSize: 34, ...gradText(SILVER), filter: "drop-shadow(0 2px 6px rgba(0,0,0,.75))" }}>{label}</div>
          <div style={{ fontFamily: CAP_FONT, fontWeight: 800, fontSize: 22, ...gradText(SILVER), filter: "drop-shadow(0 2px 6px rgba(0,0,0,.6))" }}>{sub}</div>
          <div style={{ width: 150, height: 10, borderRadius: 99, background: "rgba(255,255,255,.18)", overflow: "hidden" }}><div style={{ width: `${load * 100}%`, height: "100%", background: PLATE }} /></div>
        </Glass>
      </div>
    </Fade>
  );
};

/** red target / crosshair that locks on (rings shrink onto the point) */
export const Target: React.FC<{ x: number; y: number; r?: number; dur: number; delay?: number }> = ({ x, y, r = 110, dur, delay = 0 }) => {
  const fr = useCurrentFrame();
  const fade = useFade();
  const out = useOut(dur, 5);
  const p = interpolate(fr - delay, [0, 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const rot = (fr - delay) * 2;
  return (
    <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", opacity: fade * out * on(fr, delay), filter: `drop-shadow(0 0 10px ${K.glow})` }}>
      <g transform={`translate(${x} ${y})`}>
        <circle r={r * (2.2 - 1.2 * p)} fill="rgba(20,6,9,.35)" stroke={K.red} strokeWidth={7} opacity={0.9} />
        <circle r={r * 0.55 * (2 - p)} fill="none" stroke={K.hi} strokeWidth={5} strokeDasharray="14 10" transform={`rotate(${rot})`} />
        {[0, 90, 180, 270].map((a) => <line key={a} transform={`rotate(${a})`} x1={r * 0.75} y1={0} x2={r * 1.25} y2={0} stroke={K.red} strokeWidth={8} strokeLinecap="round" />)}
        <circle r={10 * p} fill={K.hi} />
      </g>
    </svg>
  );
};

/** ref2 logo reveal ring: red-hot core + red bloom (no white), a thinner counter-rotating ring */
export const GlowRing: React.FC<{ cx: number; cy: number; r: number; dur: number; delay?: number; frames?: number; width?: number; start?: number }> = ({ cx, cy, r, dur, delay = 0, frames = 14, width = 16, start = -30 }) => {
  const fr = useCurrentFrame();
  const fade = useFade();
  const out = useOut(dur, 6);
  const p = interpolate(fr - delay, [0, frames], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const rot = start + (fr - delay) * 0.8;
  const breathe = 1 + 0.015 * Math.sin((fr - delay) / 7);
  return (
    <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: fade * out * on(fr, delay), overflow: "visible" }}>
      <g transform={`translate(${cx} ${cy}) scale(${breathe}) rotate(${rot})`}>
        <circle r={r} fill="none" stroke={K.red} strokeWidth={width * 3.2} opacity={0.4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} style={{ filter: "blur(18px)" }} />
        <circle r={r} fill="none" stroke={K.red} strokeWidth={width * 1.4} opacity={0.8} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} style={{ filter: "blur(5px)" }} />
        <circle r={r} fill="none" stroke="#FFE9EA" strokeWidth={width * 0.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} strokeLinecap="round" />
      </g>
      <g transform={`translate(${cx} ${cy}) rotate(${-rot * 1.6 + 120})`}>
        <circle r={r * 1.08} fill="none" stroke={K.deep} strokeWidth={4} opacity={0.8 * p} pathLength={1} strokeDasharray="0.32 0.68" strokeLinecap="round" />
      </g>
    </svg>
  );
};

/** big glass number tile, e.g. « 02 », counts from 00 */
export const NumTile: React.FC<{ x: number; y: number; n: number; dur: number; delay?: number; size?: number; label?: string }> = ({ x, y, n, dur, delay = 0, size = 170, label }) => {
  const fr = useCurrentFrame();
  const s = useIn(delay, 12, 220);
  const out = useOut(dur, 5);
  const v = Math.round(interpolate(fr - delay, [0, 10], [0, n], clamp));
  return (
    <Fade o={out * on(fr, delay)}>
      <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${0.7 + 0.3 * s}) rotate(${(1 - s) * -12}deg)` }}>
        <Glass r={34} tint={0.5} hot={0.3} style={{ padding: "6px 30px 14px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontFamily: BIG_FONT, fontSize: size, lineHeight: 1.05, transform: "scaleY(1.1)", filter: "drop-shadow(0 3px 8px rgba(0,0,0,.4))", ...gradText(SILVER) }}>{String(v).padStart(2, "0")}</div>
          {label ? <div style={{ fontFamily: CAP_FONT, fontWeight: 900, fontSize: 32, ...gradText(SILVER), filter: "drop-shadow(0 2px 6px rgba(0,0,0,.6))", textShadow: "0 1px 6px rgba(0,0,0,.5)", marginTop: -6, direction: isArabic(label) ? "rtl" : "ltr" }}>{label}</div> : null}
        </Glass>
      </div>
    </Fade>
  );
};

/** a glass icon tile with an SVG icon drawn on (bulb, play, eye, gear, magnifier, steer, brain…) */
const ICONS: Record<string, string[]> = {
  play: ["M38,28 L74,50 L38,72 Z"],
  bulb: ["M50,16 C30,16 22,34 30,48 C35,57 38,60 38,70 L62,70 C62,60 65,57 70,48 C78,34 70,16 50,16", "M40,80 L60,80", "M44,88 L56,88"],
  eye: ["M12,50 C26,28 74,28 88,50 C74,72 26,72 12,50 Z", "M50,40 A10,10 0 1 1 49.9,40"],
  search: ["M44,20 A22,22 0 1 1 43.9,20", "M60,60 L82,82"],
  steer: ["M50,14 A36,36 0 1 1 49.9,14", "M50,40 A10,10 0 1 1 49.9,40", "M14,50 L40,50", "M60,50 L86,50", "M50,60 L50,86"],
  question: ["M34,34 C34,20 66,18 66,36 C66,48 50,50 50,62", "M50,76 L50,78"],
  check: ["M24,52 L42,70 L78,30"],
  cross: ["M28,28 L72,72", "M72,28 L28,72"],
  flask: ["M40,14 L40,40 L20,80 C18,86 22,88 28,88 L72,88 C78,88 82,86 80,80 L60,40 L60,14", "M34,14 L66,14", "M30,66 L70,66"],
  spark: ["M50,10 L56,44 L90,50 L56,56 L50,90 L44,56 L10,50 L44,44 Z"],
  arrowUp: ["M50,84 L50,18", "M28,40 L50,18 L72,40"],
  book: ["M50,26 C40,18 24,18 14,22 L14,80 C24,76 40,76 50,84 C60,76 76,76 86,80 L86,22 C76,18 60,18 50,26 Z", "M50,26 L50,84"],
  film: ["M18,26 L82,26 L82,74 L18,74 Z", "M30,26 L30,74", "M70,26 L70,74", "M18,50 L30,50", "M70,50 L82,50"],
  mirror: ["M50,12 C30,12 22,30 22,46 C22,64 34,76 50,76 C66,76 78,64 78,46 C78,30 70,12 50,12 Z", "M50,76 L50,90", "M36,90 L64,90", "M38,32 L48,24"],
};
export const IconTile: React.FC<{ icon: keyof typeof ICONS | string; x: number; y: number; size?: number; dur: number; delay?: number; label?: string; hot?: boolean; rotate?: number }> = ({ icon, x, y, size = 190, dur, delay = 0, label, hot = true, rotate = 0 }) => {
  const fr = useCurrentFrame();
  const s = useIn(delay, 11, 230);
  const out = useOut(dur, 5);
  const p = interpolate(fr - delay - 3, [0, 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const paths = ICONS[icon] ?? ICONS.spark;
  const bob = Math.sin((fr - delay) / 13) * 5;
  return (
    <Fade o={out * on(fr, delay)}>
      <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2 + bob, width: size, transform: `scale(${s}) rotate(${rotate + (1 - s) * -20}deg)` }}>
        <Glass w={size} h={size} r={size * 0.26} tint={0.45} hot={hot ? 0.4 : 0}>
          <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: size * 0.17, width: size * 0.66, height: size * 0.66, overflow: "visible", filter: `drop-shadow(0 0 8px ${hot ? K.glow : "rgba(0,0,0,.4)"})` }}>
            {paths.map((d, i) => <path key={i} d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, p * 1.4 - i * 0.15)} fill="none" stroke={K.white} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />)}
          </svg>
        </Glass>
        {label ? <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}><Pill text={label} size={Math.max(32, size * 0.2)} hot={0.4} /></div> : null}
      </div>
    </Fade>
  );
};

/** a glass video card with a progress bar that fills (the video he means) */
export const VideoCard: React.FC<{ x: number; y: number; w?: number; dur: number; delay?: number; rotate?: number }> = ({ x, y, w: wd = 260, dur, delay = 0, rotate = -5 }) => {
  const fr = useCurrentFrame();
  const s = useIn(delay, 13, 200);
  const out = useOut(dur, 5);
  const h = wd * 1.5;
  const prog = interpolate(fr - delay, [0, 60], [0.05, 0.85], clamp);
  return (
    <Fade o={out * on(fr, delay)}>
      <div style={{ position: "absolute", left: x - wd / 2, top: y - h / 2, width: wd, height: h, transform: `translateX(${(1 - s) * -300}px) rotate(${rotate + (1 - s) * -15}deg)` }}>
        <Glass w="100%" h="100%" r={30} tint={0.45} hot={0.3}>
          <div style={{ position: "absolute", left: "50%", top: "44%", transform: "translate(-50%,-50%)", width: wd * 0.38, height: wd * 0.38, borderRadius: 999, background: PLATE, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 30px ${K.glow}` }}>
            <svg viewBox="0 0 100 100" style={{ width: "50%", height: "50%" }}><path d="M34,22 L80,50 L34,78 Z" fill={K.white} /></svg>
          </div>
          <div style={{ position: "absolute", left: 22, right: 22, bottom: 30, height: 10, borderRadius: 99, background: "rgba(255,255,255,.2)" }}>
            <div style={{ width: `${prog * 100}%`, height: "100%", borderRadius: 99, background: PLATE, boxShadow: `0 0 12px ${K.glow}` }} />
          </div>
          <div style={{ position: "absolute", left: 22, top: 18, fontFamily: CAP_FONT, fontWeight: 900, fontSize: 26, ...gradText(SILVER), filter: "drop-shadow(0 2px 6px rgba(0,0,0,.75))" }}><span style={{ ...gradText(SILVER), filter: "drop-shadow(0 2px 6px rgba(0,0,0,.6))" }}>●</span> REC</div>
        </Glass>
      </div>
    </Fade>
  );
};

/* =====================================================================================
 * Card layout (Showcase) break-outs: drawn only OUTSIDE 0–1080 (Reel coords), so the full-screen Reel never shows them;
 * in the card layout they continue the edit onto the canvas around the card.
 * ===================================================================================== */

/** y of the red wave under a BigWord (same maths as BigWord) */
export const bigWordWaveY = (text: string, y = BW_Y, size = BW_SIZE) => {
  const fit = Math.min(size, 1010 / Math.max(1, text.length * 0.5));
  return y + (isArabic(text) ? fit * 0.75 : fit) * 0.42;
};

/** the BigWord's red wave carries on past the card edges (left canvas + right margin) */
export const WaveOut: React.FC<{ y: number; dur: number; delay?: number }> = ({ y, dur, delay = 0 }) => {
  const fr = useCurrentFrame();
  const fade = useFade();
  const out = useOut(dur, 6);
  const p = interpolate(fr - delay, [2, 16], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const seg = (x0: number, x1: number, ph: number) => {
    let d = "";
    for (let xx = x0; xx <= x1; xx += 16) d += `${d ? " L" : "M"}${xx},${(y + Math.sin(xx / 70 + (fr + ph) / 9) * 26 * Math.min(1, Math.abs(xx < 0 ? xx : xx - 1080) / 120)).toFixed(1)}`;
    return d;
  };
  return (
    <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", opacity: fade * out * on(fr, delay), filter: `drop-shadow(0 0 10px ${K.glow})` }}>
      {[0, 25].map((ph, i) => (
        <g key={i} opacity={i ? 0.6 : 1}>
          <path d={seg(-640, 0, ph)} fill="none" stroke={i ? K.deep : K.red} strokeWidth={i ? 3 : 5} pathLength={1} strokeDasharray={1} strokeDashoffset={-(1 - p)} />
          <path d={seg(1080, 1180, ph)} fill="none" stroke={i ? K.deep : K.red} strokeWidth={i ? 3 : 5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
        </g>
      ))}
      <g transform={`translate(-560 ${y - 70}) scale(${p}) rotate(${fr * 1.2})`}><path d="M0,-34 C4,-7 7,-4 34,0 C7,4 4,7 0,34 C-4,7 -7,4 -34,0 C-7,-4 -4,-7 0,-34Z" fill={K.hi} /></g>
    </svg>
  );
};
