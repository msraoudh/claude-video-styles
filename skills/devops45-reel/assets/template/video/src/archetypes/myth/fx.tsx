/**
 * fx.tsx — shared look kit of the cards / compare / myth / analogy archetypes.
 * The SAME file is copied verbatim into each of those four folders (archetype folders never import each other).
 * Ported from the brand intro (output/brand-intro/project/video/src/scenes/s4 skin/space/lib + s5 wall):
 *   Stage (lit world: light plates, perspective grid, dust, foreground bokeh, camera push), Shell (glass card with
 *   refracted light, gradient rim, sheen), Streak (the 5-frame cyan light streak), Tag (eyebrow pill),
 *   Glyph (generic DevOps + everyday line icons; a tool / AWS name shows its real logo via kit/Logo), text measuring/fitting that never overflows.
 */
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, interpolate } from "remotion";
import { fontInter, fontMono } from "../../kit/fonts";
import { Icon, type IconName } from "../../kit/Icon";
import { Logo, logoKey } from "../../kit/Logo";
import { PHOSPHOR } from "../../kit/phosphor";
import { B } from "../../lib/look";
import { beatPulse, rand } from "../../lib/sync";

/* ───────────────────────────── curves + small math ───────────────────────────── */
export const EO = Easing.bezier(0.16, 1, 0.3, 1);
export const EIO = Easing.bezier(0.65, 0, 0.35, 1);
export const EI = Easing.bezier(0.7, 0, 0.84, 0);
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const lin = (g: number, a: number, b: number, from = 0, to = 1, ease?: (t: number) => number) =>
  b <= a
    ? g >= a
      ? to
      : from
    : interpolate(g, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", ...(ease ? { easing: ease } : {}) });
/** 0 before `at`, 1 at `at`, exponential decay after */
export const kick = (g: number, at: number, decay = 6) => (g < at ? 0 : Math.exp(-(g - at) / decay));
export const kickAny = (g: number, ats: number[], decay = 6) => ats.reduce((m, a) => Math.max(m, kick(g, a, decay)), 0);
/** 0..1 with a small overshoot (back-out), deterministic */
export const pop = (g: number, at: number, dur = 12) => {
  const t = clamp01((g - at) / dur);
  if (t <= 0) return 0;
  const c1 = 1.6;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const CYAN = "34,211,238";
export const AMBER = "245,158,11";
export const OK = "52,211,153";
export const WHITE = "248,250,252";
export const BLUE = "59,130,246";
export const GREYC = "203,213,225";
export const PERI = "129,152,255";
export const rgba = (rgb: string, a: number) => `rgba(${rgb},${clamp01(a).toFixed(3)})`;
export const px = (x: number) => `${x.toFixed(2)}px`;
export { rand };

/* ───────────────────────────── text: French typography, measuring, fitting ───────────────────────────── */
export const INTER = fontInter;
export const MONO = fontMono;

/** narrow no-break space before ? ! : ; (French), keeps « 0.0.0.0:22 » intact */
export const fr = (s: unknown): string =>
  typeof s === "string" ? s.replace(/\s+/g, " ").trim().replace(/ ?([?!;:])(?=\s|$)/g, " $1").replace(/« ?/g, "« ").replace(/ ?»/g, " »") : "";

const WCACHE: { [k: string]: number } = {};
let CTX: CanvasRenderingContext2D | null | undefined;
const SPECS = ["800 100px Inter", "700 100px Inter", "600 100px Inter", '700 100px "JetBrains Mono"', '500 100px "JetBrains Mono"'];
const fontsOk = () => {
  if (typeof document === "undefined" || !document.fonts) return true;
  try {
    return SPECS.every((s) => document.fonts.check(s));
  } catch {
    return true;
  }
};
const rawW = (text: string, family: string, weight: number): number => {
  const key = `${weight}|${family}|${text}`;
  if (WCACHE[key] !== undefined) return WCACHE[key];
  let w = text.length * (family === MONO ? 60 : 55);
  if (typeof document !== "undefined") {
    if (CTX === undefined) CTX = document.createElement("canvas").getContext("2d");
    if (CTX) {
      const spec = `${weight} 100px ${family}`;
      CTX.font = spec;
      w = CTX.measureText(text).width;
      let ok = false;
      try {
        ok = document.fonts ? document.fonts.check(spec) : true;
      } catch {
        ok = false;
      }
      if (ok) WCACHE[key] = w;
    }
  }
  return w;
};
/** width (px) of `text` at `size`; ls = letter-spacing in em */
export const textW = (text: string, size: number, family = INTER, weight = 800, ls = 0) =>
  ((rawW(text, family, weight) + ls * 100 * Math.max(0, text.length - 1)) * size) / 100;

/**
 * Text measuring needs the real fonts: if they are not loaded yet at the first render of a tab, hold the frame
 * (delayRender) and re-render once they are — so a still never captures a layout measured with a fallback font.
 */
export const useFontsReady = () => {
  const [ready, setReady] = useState(() => fontsOk());
  const [handle] = useState(() => (fontsOk() ? null : delayRender("archetype fonts")));
  useEffect(() => {
    if (ready) return;
    let live = true;
    const done = () => {
      if (handle !== null) continueRender(handle);
    };
    const loads = typeof document !== "undefined" && document.fonts ? SPECS.map((s) => document.fonts.load(s).catch(() => [])) : [];
    Promise.all(loads).then(() => {
      if (live) setReady(true);
      done();
    });
    return () => {
      live = false;
      done();
    };
  }, [ready, handle]);
  return ready;
};

/** greedy word wrap (regular spaces only:   /   keep their neighbours glued) */
export const wrapText = (text: string, size: number, maxW: number, family = INTER, weight = 800, ls = 0): string[] => {
  const words = text.split(/ +/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (cur && textW(t, size, family, weight, ls) > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
};
export type Fit = { size: number; lines: string[]; width: number; height: number };
/** largest size in [min, max] that fits maxW in ≤ maxLines; below min it shrinks further rather than overflow */
export const fitBlock = (
  text: string,
  o: { maxW: number; maxLines: number; max: number; min: number; family?: string; weight?: number; ls?: number; lh?: number; step?: number; balance?: boolean },
): Fit => {
  const fam = o.family ?? INTER;
  const wt = o.weight ?? 800;
  const ls = o.ls ?? 0;
  const lh = o.lh ?? 1.12;
  const step = o.step ?? 2;
  const widest = (ls2: string[], s: number) => ls2.reduce((m, l) => Math.max(m, textW(l, s, fam, wt, ls)), 0);
  const out = (size: number, lines: string[]): Fit => ({ size, lines, width: widest(lines, size), height: lines.length * size * lh });
  if (!text) return { size: o.max, lines: [], width: 0, height: 0 };
  for (let s = o.max; s >= o.min; s -= step) {
    let lines = wrapText(text, s, o.maxW, fam, wt, ls);
    if (lines.length <= o.maxLines && widest(lines, s) <= o.maxW) {
      if (o.balance && lines.length > 1) lines = balance(text, s, lines.length, fam, wt, ls, o.maxW) ?? lines;
      return out(s, lines);
    }
  }
  // still too long: shrink below min until it fits (never overflow)
  let s = o.min;
  for (let k = 0; k < 30; k++) {
    const lines = wrapText(text, s, o.maxW, fam, wt, ls);
    if (lines.length <= o.maxLines && widest(lines, s) <= o.maxW) return out(s, lines);
    s *= 0.94;
  }
  const lines = wrapText(text, s, o.maxW, fam, wt, ls);
  return out(Math.min(s, (s * o.maxW) / Math.max(1, widest(lines, s))), lines);
};
/** same number of lines but evened out (no lonely last word) */
const balance = (text: string, s: number, n: number, fam: string, wt: number, ls: number, maxW: number): string[] | null => {
  let lo = maxW * 0.4;
  let hi = maxW;
  let best: string[] | null = null;
  for (let k = 0; k < 12; k++) {
    const mid = (lo + hi) / 2;
    const l = wrapText(text, s, mid, fam, wt, ls);
    if (l.length <= n && l.every((x) => textW(x, s, fam, wt, ls) <= mid + 0.5)) {
      best = l;
      hi = mid;
    } else lo = mid;
  }
  return best;
};

/** token looks like code / a command / an address → mono */
export const isCodeToken = (w: string) => {
  const t = w.replace(/[«»\u202f\u00a0]/g, "").replace(/[,;:!?…)]+$/, "").replace(/\.$/, "").replace(/^[(]/, "");
  return t.length > 0 && /^[-$/.~#]|[=/_:]|\d[.:]\d|^\d+(\.\d+)+$|^[a-z]+\d|^--?\w|[{}<>[\]|*]/.test(t);
};
/** a whole string looks like a command (« ss -tulpn », « kubectl get pods ») */
const CLI = " kubectl docker podman git ss ls cd chmod chown systemctl journalctl curl wget grep ps top htop df du terraform helm aws gcloud az ansible npm npx ssh scp sudo cat tail less kill ping dig nslookup netstat iptables ufw crontab apt yum dnf make vim nano find awk sed tar mkdir rm mv cp echo export kubeadm k9s nginx openssl ip mount free uptime lsof strace watch xargs head wc sort uniq jq yq pip go cargo node kustomize argocd vault consul nmap tcpdump traceroute rsync cron ";
export const isCodeLine = (s: string) =>
  !/[A-ZÀ-ÿ]/.test(s) &&
  /^[a-z0-9$][a-z0-9_.\-/:=*'" ]*$/.test(s) &&
  (/[-_./:=]|^\S+$/.test(s) || CLI.indexOf(` ${s.split(" ")[0]} `) >= 0);
export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

/* ───────────────────────────── the lit world (3 planes) ───────────────────────────── */
type Plate = { x: number; y: number; rx: number; ry: number; c: string; a: number };

/** light plates + perspective grid + dust: everything behind the glass */
export const Atmos: React.FC<{ g: number; hit?: number; warm?: number; seed?: number; calm?: number; focusY?: number }> = ({ g, hit = 0, warm = 0, seed = 1, calm = 0, focusY = 40 }) => {
  const bp = beatPulse(g, 16);
  const amp = (1 + 0.32 * bp + 0.75 * hit) * (1 - 0.35 * calm);
  const s = seed * 1.7;
  const plates: Plate[] = [
    { x: 28 + 9 * Math.sin(g * 0.0042 + s), y: focusY - 12 + 5 * Math.cos(g * 0.0037 + s), rx: 70, ry: 34, c: CYAN, a: 0.2 },
    { x: 80 + 7 * Math.cos(g * 0.0031 + s * 2), y: focusY + 22 + 6 * Math.sin(g * 0.0041 + s), rx: 72, ry: 38, c: BLUE, a: 0.2 },
    { x: 50 + 12 * Math.sin(g * 0.0026 + s * 3), y: focusY + 4, rx: 58, ry: 26, c: "14,116,144", a: 0.22 },
    { x: 50, y: 104, rx: 110, ry: 30, c: "14,116,144", a: 0.18 },
  ];
  if (warm > 0) plates.push({ x: 68 + 6 * Math.sin(g * 0.003), y: focusY + 34, rx: 62, ry: 26, c: AMBER, a: 0.1 * warm });
  const bg = plates
    .map((p) => `radial-gradient(${p.rx}% ${p.ry}% at ${p.x.toFixed(2)}% ${p.y.toFixed(2)}%, ${rgba(p.c, p.a * amp)} 0%, ${rgba(p.c, p.a * amp * 0.34)} 42%, rgba(${p.c},0) 74%)`)
    .join(", ");
  return (
    <>
      <AbsoluteFill style={{ background: B.bg }} />
      <AbsoluteFill style={{ background: bg }} />
      <Grid g={g} hit={hit} />
      <Dust g={g} seed={seed} />
    </>
  );
};

/** faint perspective floor + ceiling grids scrolling toward the camera (the brand intro's lit corridor) */
const Grid: React.FC<{ g: number; hit: number }> = ({ g, hit }) => {
  const els: React.ReactNode[] = [];
  const VX = 510;
  const planes = [
    { hz: 1150, dir: 1, a: 0.24, reach: 820 },
    { hz: 470, dir: -1, a: 0.12, reach: 520 },
  ];
  const phase = (g * 0.012) % 1;
  planes.forEach((pl, pi) => {
    for (let k = 1; k <= 16; k++) {
      const d = k - phase; // depth: smaller = nearer
      const y = pl.hz + pl.dir * (pl.reach / d);
      if (y < -10 || y > 1930) continue;
      const near = clamp01((16 - d) / 16);
      const a = pl.a * Math.pow(near, 1.6) * clamp01(d / 1.2) * (1 + 0.6 * hit);
      els.push(<line key={`h${pi}-${k}`} x1={-200} x2={1280} y1={y} y2={y} stroke={B.cyan} strokeOpacity={a} strokeWidth={1.6 + 1.2 * near} />);
    }
    for (let j = -7; j <= 7; j++) {
      const xb = VX + j * 300;
      const y0 = pl.hz + pl.dir * (pl.reach / 16);
      const y1 = pl.dir > 0 ? 1920 : 0;
      const t = (y1 - pl.hz) / (pl.dir * pl.reach); // param at the frame edge
      const x1 = VX + (xb - VX) * Math.min(4, Math.abs(t));
      els.push(<line key={`v${pi}${j}`} x1={VX + (xb - VX) * 0.06} y1={y0} x2={x1} y2={y1} stroke={`url(#fx-gv${pi})`} strokeWidth={1.6} />);
    }
  });
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id="fx-gv0" x1="0" y1="1170" x2="0" y2="1920" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={B.cyan} stopOpacity={0} />
          <stop offset="1" stopColor={B.cyan} stopOpacity={0.26} />
        </linearGradient>
        <linearGradient id="fx-gv1" x1="0" y1="440" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={B.cyan} stopOpacity={0} />
          <stop offset="1" stopColor={B.cyan} stopOpacity={0.13} />
        </linearGradient>
      </defs>
      {els}
    </svg>
  );
};

type Mote = { x: number; y: number; d: number; r: number; w: boolean; ph: number };
const MOTES: Mote[] = Array.from({ length: 78 }, (_, i) => ({ x: rand(i * 3.1 + 1) * 1080, y: rand(i * 5.7 + 2) * 2100, d: rand(i * 7.3 + 3), r: 1.1 + rand(i * 9.1) * 2.4, w: rand(i * 2.2) > 0.7, ph: rand(i * 4.4) * 6.28 }));
/** dust drifting up with parallax (back plane) */
const Dust: React.FC<{ g: number; seed: number }> = ({ g, seed }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    {MOTES.map((m, i) => {
      const sp = 0.15 + 0.55 * m.d;
      const y = ((((m.y - g * sp + seed * 300) % 2100) + 2100) % 2100) - 90;
      const x = m.x + Math.sin(g * 0.01 + m.ph) * 10 * m.d;
      const a = (0.18 + 0.5 * m.d) * (0.6 + 0.4 * Math.sin(g * 0.05 + m.ph));
      return <circle key={i} cx={x} cy={y} r={m.r * (0.7 + 0.6 * m.d)} fill={m.w ? "rgb(235,245,255)" : B.cyan} fillOpacity={a} />;
    })}
  </svg>
);

type Bok = { x: number; y: number; r: number; c: string; a: number; ph: number };
const BOKEH: Bok[] = [
  { x: 40, y: 330, r: 46, c: CYAN, a: 0.2, ph: 0.3 },
  { x: 1050, y: 520, r: 62, c: WHITE, a: 0.1, ph: 1.7 },
  { x: 990, y: 1240, r: 40, c: CYAN, a: 0.18, ph: 2.2 },
  { x: 70, y: 1120, r: 70, c: BLUE, a: 0.18, ph: 3.9 },
  { x: 560, y: 1800, r: 90, c: CYAN, a: 0.12, ph: 5.1 },
  { x: 880, y: 250, r: 34, c: WHITE, a: 0.12, ph: 4.4 },
];
/** foreground out-of-focus lights at the edges (front plane) */
export const FrontBokeh: React.FC<{ g: number }> = ({ g }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
    <defs>
      <filter id="fx-bok" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="9" />
      </filter>
    </defs>
    <g filter="url(#fx-bok)">
      {BOKEH.map((b, i) => (
        <circle key={i} cx={b.x + Math.sin(g * 0.008 + b.ph) * 26} cy={b.y + Math.cos(g * 0.006 + b.ph) * 20 - g * 0.05} r={b.r} fill={`rgb(${b.c})`} fillOpacity={b.a * (0.75 + 0.25 * Math.sin(g * 0.03 + b.ph))} />
      ))}
    </g>
  </svg>
);

/** whole-scene frame: world → camera layer (slow push 1 → 1.03 + drift, beat-hit shake) → front bokeh → grade */
export const Stage: React.FC<{
  g: number;
  from: number;
  to: number;
  hit?: number;
  shake?: number;
  warm?: number;
  seed?: number;
  calm?: number;
  focusY?: number;
  back?: React.ReactNode;
  over?: React.ReactNode;
  children: React.ReactNode;
}> = ({ g, from, to, hit = 0, shake = 0, warm = 0, seed = 1, calm = 0, focusY, back, over, children }) => {
  const t = lin(g, from, to);
  const cam = 1 + 0.03 * EIO(t);
  const dx = Math.sin(g * 0.011 + seed) * 4 + shake * 4 * Math.sin(g * 2.3);
  const dy = Math.cos(g * 0.009 + seed) * 3 + shake * 3 * Math.cos(g * 1.7);
  return (
    <AbsoluteFill style={{ background: B.ink, overflow: "hidden" }}>
      <Atmos g={g} hit={hit} warm={warm} seed={seed} calm={calm} focusY={focusY} />
      {back}
      <AbsoluteFill style={{ transform: `translate(${px(dx)}, ${px(dy)}) scale(${cam.toFixed(4)})`, transformOrigin: "510px 760px" }}>{children}</AbsoluteFill>
      <FrontBokeh g={g} />
      {/* soft top/bottom grade: the HUD and the caption band stay calm */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(4,7,15,0.5) 0%, rgba(4,7,15,0) 12%, rgba(4,7,15,0) 66%, rgba(4,7,15,0.32) 78%, rgba(4,7,15,0.55) 100%)", pointerEvents: "none" }} />
      {over}
    </AbsoluteFill>
  );
};

/* ───────────────────────────── light streak (the ONE 5-frame cyan sweep on a hit) ───────────────────────────── */
const STREAK_MASK = "linear-gradient(180deg, #000 0%, #000 64%, rgba(0,0,0,0.22) 68%, rgba(0,0,0,0.22) 81%, #000 85%)";
export const Streak: React.FC<{ g: number; at: number; dir?: 1 | -1; k?: number; rgb?: string }> = ({ g, at, dir = 1, k = 1, rgb = CYAN }) => {
  const a = at - 2;
  const b = at + 4;
  if (g <= a || g >= b) return null;
  const p = (g - a) / (b - a);
  const x = dir > 0 ? mix(-380, 1460, p) : mix(1460, -380, p);
  const bar = (w: number, off: number, bg: string, glow: number) => (
    <div
      style={{
        position: "absolute",
        left: x + off - w / 2,
        top: -400,
        width: w,
        height: 2720,
        background: bg,
        boxShadow: `0 0 ${glow}px ${glow / 3}px ${rgba(rgb, 0.6 * k)}`,
        borderRadius: w,
        transform: `rotate(${dir * 16}deg)`,
      }}
    />
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", overflow: "hidden", WebkitMaskImage: STREAK_MASK, maskImage: STREAK_MASK }}>
      {bar(180, -120 * dir, rgba(rgb, 0.16 * k), 50)}
      {bar(30, 0, `rgba(190,250,255,${(0.78 * k).toFixed(3)})`, 34)}
      {bar(7, 64 * dir, `rgba(255,255,255,${(0.85 * k).toFixed(3)})`, 12)}
    </AbsoluteFill>
  );
};

/* ───────────────────────────── glass card ───────────────────────────── */
export type Tone = "cyan" | "grey" | "warm" | "peri" | "ok";
export const TONE: { [k in Tone]: string } = { cyan: CYAN, grey: GREYC, warm: AMBER, peri: PERI, ok: OK };
/**
 * Glass card (the brand intro's Shell): tinted glass body, refracted light sliding inside (lx/ly %), gradient rim
 * flashing in the accent on a hit, top sheen + a light streak sweeping across (sheen 0→1). No backdrop-filter
 * (cheaper, and the scenes can fade/blur it freely).
 */
export const Shell: React.FC<{
  w: number;
  h: number;
  tone?: Tone;
  flash?: number;
  sheen?: number;
  lx?: number;
  ly?: number;
  radius?: number;
  glow?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ w, h, tone = "cyan", flash = 0, sheen = -1, lx = 28, ly = 8, radius = 36, glow = 1, style, children }) => {
  const ac = TONE[tone];
  const grey = tone === "grey";
  const body = grey
    ? "linear-gradient(165deg, rgba(52,60,76,0.52) 0%, rgba(24,30,42,0.66) 42%, rgba(10,13,20,0.80) 100%)"
    : tone === "warm"
      ? "linear-gradient(165deg, rgba(64,56,62,0.50) 0%, rgba(26,26,44,0.66) 42%, rgba(8,11,24,0.80) 100%)"
      : "linear-gradient(165deg, rgba(36,58,100,0.52) 0%, rgba(14,26,52,0.66) 42%, rgba(6,12,28,0.80) 100%)";
  const ga = grey ? 0.35 : 1;
  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        borderRadius: radius,
        overflow: "hidden",
        background: body,
        boxShadow: [
          "0 0 0 0.5px rgba(255,255,255,0.16)",
          "0 10px 26px rgba(0,0,0,0.5)",
          "0 46px 100px rgba(0,0,0,0.5)",
          `0 0 ${((60 + 90 * flash) * glow).toFixed(1)}px ${rgba(ac, (0.14 + 0.45 * flash) * glow * ga)}`,
          "inset 0 1px 0 rgba(255,255,255,0.40)",
          "inset 0 18px 30px -18px rgba(255,255,255,0.15)",
          "inset 0 -1px 0 rgba(0,0,0,0.5)",
        ].join(", "),
        ...style,
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(75% 60% at ${lx.toFixed(1)}% ${ly.toFixed(1)}%, ${rgba(ac, (0.15 + 0.22 * flash) * ga)} 0%, ${rgba(ac, 0.045 * ga)} 45%, rgba(${ac},0) 75%)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: Math.min(140, h * 0.3), background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0))" }} />
      <div style={{ position: "absolute", top: -10, left: -10, width: "50%", height: Math.min(220, h * 0.5), background: "radial-gradient(ellipse at 22% 18%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 60%)" }} />
      {children}
      {sheen > 0 && sheen < 1 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(112deg, rgba(255,255,255,0) ${(sheen * 160 - 40).toFixed(1)}%, rgba(255,255,255,0.16) ${(sheen * 160 - 24).toFixed(1)}%, rgba(190,250,255,0.06) ${(sheen * 160 - 16).toFixed(1)}%, rgba(255,255,255,0) ${(sheen * 160 - 8).toFixed(1)}%)`,
            pointerEvents: "none",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          padding: 1.6,
          background: `linear-gradient(180deg, rgba(255,255,255,${grey ? 0.32 : 0.55}) 0%, rgba(255,255,255,0.10) 26%, ${rgba(ac, (grey ? 0.16 : 0.24) + 0.7 * flash)} 68%, rgba(255,255,255,0.22) 100%)`,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

/** eyebrow pill (« 01 · OUTIL LINUX »): optional number, label, optional progress dots */
export const Tag: React.FC<{ text: string; p: number; tone?: Tone; num?: string; icon?: React.ReactNode; dots?: { n: number; i: number }; size?: number; style?: React.CSSProperties }> = ({
  text,
  p,
  tone = "cyan",
  num,
  icon,
  dots,
  size = 22,
  style,
}) => {
  const ac = TONE[tone];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        height: size * 2.4,
        padding: `0 ${size}px`,
        borderRadius: size * 1.2,
        background: "rgba(8,16,34,0.82)",
        border: `1px solid ${rgba(ac, tone === "grey" ? 0.3 : 0.36)}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 8px 24px rgba(0,0,0,0.45), 0 0 26px ${rgba(ac, tone === "grey" ? 0.04 : 0.12)}`,
        transform: `translateY(${((1 - EO(clamp01(p))) * 16).toFixed(1)}px) scale(${(0.86 + 0.14 * EO(clamp01(p))).toFixed(3)})`,
        transformOrigin: "0% 100%",
        opacity: clamp01(p * 1.6),
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {num ? <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: size * 1.08, color: `rgb(${ac})` }}>{num}</span> : null}
      {num ? <span style={{ width: 1, height: size, background: "rgba(255,255,255,0.22)" }} /> : null}
      {icon}
      <span style={{ fontFamily: INTER, fontWeight: 700, fontSize: size, letterSpacing: "0.16em", color: tone === "grey" ? B.text2 : B.white, textTransform: "uppercase" }}>{text}</span>
      {dots ? (
        <span style={{ display: "flex", gap: 6, marginLeft: 4 }}>
          {Array.from({ length: dots.n }, (_, k) => (
            <span key={k} style={{ width: k === dots.i ? 22 : 8, height: 8, borderRadius: 4, background: k === dots.i ? `rgb(${ac})` : k < dots.i ? rgba(ac, 0.45) : "rgba(255,255,255,0.2)" }} />
          ))}
        </span>
      ) : null}
    </div>
  );
};

/** amber block cursor (the signal) — solid while typing, blinks when idle */
export const Cursor: React.FC<{ g: number; typing: boolean; size: number }> = ({ g, typing, size }) => {
  const on = typing || Math.floor(g / 16) % 2 === 0;
  return (
    <span
      style={{
        display: "inline-block",
        width: size * 0.56,
        height: size * 1.02,
        marginLeft: size * 0.08,
        verticalAlign: "-0.16em",
        background: B.amber,
        opacity: on ? 1 : 0.12,
        boxShadow: on ? `0 0 ${size * 0.5}px ${rgba(AMBER, 0.6)}` : "none",
        borderRadius: 3,
      }}
    />
  );
};

/** small spark burst (sparkle stars + dots) around a point, deterministic */
export const Sparks: React.FC<{ g: number; at: number; x: number; y: number; r?: number; n?: number; rgb?: string; seed?: number; dur?: number }> = ({ g, at, x, y, r = 150, n = 12, rgb = CYAN, seed = 1, dur = 34 }) => {
  const t = (g - at) / dur;
  if (t <= 0 || t >= 1) return null;
  const e = EO(t);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", overflow: "visible" }}>
      {Array.from({ length: n }, (_, i) => {
        const ang = (i / n) * Math.PI * 2 + rand(seed * 13 + i) * 0.6;
        const dist = r * (0.55 + 0.45 * rand(seed * 7 + i * 3)) * e;
        const cx = x + Math.cos(ang) * dist;
        const cy = y + Math.sin(ang) * dist;
        const a = (1 - t) * (0.9 - 0.4 * rand(i * 5 + seed));
        if (i % 3 === 0) {
          const s = 12 * (1 - t * 0.6);
          return <path key={i} d={`M${cx} ${cy - s} Q${cx} ${cy} ${cx + s} ${cy} Q${cx} ${cy} ${cx} ${cy + s} Q${cx} ${cy} ${cx - s} ${cy} Q${cx} ${cy} ${cx} ${cy - s} Z`} fill={`rgb(${rgb})`} fillOpacity={a} />;
        }
        return <circle key={i} cx={cx} cy={cy} r={3.2 * (1 - t * 0.5)} fill={i % 2 ? "rgb(240,250,255)" : `rgb(${rgb})`} fillOpacity={a} />;
      })}
    </svg>
  );
};

/* ───────────────────────────── glyphs (generic line icons — no logos, no trademarks) ───────────────────────────── */
type El = (
  | { t: "p"; d: string; fill?: string; op?: number; w?: number }
  | { t: "r"; x: number; y: number; w: number; h: number; rx?: number; fill?: string }
  | { t: "c"; cx: number; cy: number; r: number; dot?: boolean }
) & { _rot?: number };
type Anim = { o: number; c: string };
type GDef = El[] | ((a: Anim) => El[]);
const P = (d: string, w?: number): El => ({ t: "p", d, w });
const R = (x: number, y: number, w: number, h: number, rx = 4): El => ({ t: "r", x, y, w, h, rx });
const C = (cx: number, cy: number, r: number): El => ({ t: "c", cx, cy, r });
const D = (cx: number, cy: number, r = 3): El => ({ t: "c", cx, cy, r, dot: true });
const gear = (): El[] => {
  const out: El[] = [C(32, 32, 8), C(32, 32, 17)];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    out.push(P(`M${(32 + Math.cos(a) * 17).toFixed(1)} ${(32 + Math.sin(a) * 17).toFixed(1)} L${(32 + Math.cos(a) * 25).toFixed(1)} ${(32 + Math.sin(a) * 25).toFixed(1)}`, 6));
  }
  return out;
};
const GL: { [k: string]: GDef } = {
  plug: [P("M25 6 V18 M39 6 V18"), P("M16 18 H48 V27 Q48 44 32 44 Q16 44 16 27 Z"), P("M32 44 V52 Q32 58 38 58 H46")],
  plugs: [P("M4 32 H14"), P("M14 21 H24 Q34 21 34 32 Q34 43 24 43 H14 Z"), P("M34 26 H41 M34 38 H41"), P("M46 21 V43"), P("M46 21 H50 Q60 21 60 32 Q60 43 50 43 H46")],
  broadcast: [D(32, 32, 4), P("M24 22 A12 12 0 0 0 24 42"), P("M40 22 A12 12 0 0 1 40 42"), P("M15 13 A24 24 0 0 0 15 51"), P("M49 13 A24 24 0 0 1 49 51")],
  ear: [P("M20 26 A13 13 0 1 1 44 33 Q40 37 39 44 Q37 56 28 56 Q22 56 20 50"), P("M27 27 A6 6 0 0 1 38 29 Q38 33 34 35")],
  cpu: [R(16, 16, 32, 32, 6), R(25, 25, 14, 14, 2), P("M25 8 V16 M39 8 V16 M25 48 V56 M39 48 V56 M8 25 H16 M8 39 H16 M48 25 H56 M48 39 H56")],
  door: (a) => {
    const o = clamp01(a.o);
    const xr = 46 - 25 * o;
    const els: El[] = [];
    if (o > 0.01) {
      els.push({ t: "p", d: "M14 58 L50 58 L62 66 L2 66 Z", fill: rgba(AMBER, 0.32 * o) }); // light spilling on the floor
      els.push({ t: "r", x: 18, y: 9, w: 28, h: 48, rx: 2, fill: rgba(AMBER, 0.8 * o) });
    }
    els.push(R(16, 7, 32, 51, 3));
    els.push({ t: "p", d: `M18 9 L${xr.toFixed(1)} ${(9 - 5 * o).toFixed(1)} L${xr.toFixed(1)} ${(57 + 4 * o).toFixed(1)} L18 57 Z`, fill: o > 0.01 ? "rgba(10,16,32,0.92)" : undefined });
    els.push(D(xr - 6 + 3 * o, 33, 3));
    els.push(P("M8 58 H56"));
    return els;
  },
  database: [P("M14 15 A18 7 0 1 0 50 15 A18 7 0 1 0 14 15"), P("M14 15 V48 A18 7 0 0 0 50 48 V15"), P("M14 31.5 A18 7 0 0 0 50 31.5")],
  globe: [C(32, 32, 23), P("M9 32 H55"), P("M32 9 Q16 32 32 55 Q48 32 32 9"), P("M13 20 H51 M13 44 H51", 3)],
  shield: [P("M32 7 L52 15 V30 Q52 48 32 57 Q12 48 12 30 V15 Z")],
  shieldcheck: [P("M32 7 L52 15 V30 Q52 48 32 57 Q12 48 12 30 V15 Z"), P("M23 31 L29.5 37.5 L42 25")],
  shieldwarning: [P("M32 7 L52 15 V30 Q52 48 32 57 Q12 48 12 30 V15 Z"), P("M32 20 V34"), D(32, 42, 3.2)],
  lock: [R(13, 28, 38, 27, 6), P("M21 28 V20 A11 11 0 0 1 43 20 V28"), P("M32 38 V45")],
  lockopen: [R(13, 28, 38, 27, 6), P("M21 28 V18 A11 11 0 0 1 42 14"), P("M32 38 V45")],
  key: (a) => rot([C(20, 32, 10), P("M30 32 H56 M47 32 V41 M54 32 V39")], -90 * clamp01(a.o)),
  server: [R(11, 10, 42, 19, 5), R(11, 35, 42, 19, 5), D(20, 19.5, 3), D(20, 44.5, 3), P("M30 19.5 H44 M30 44.5 H44", 3.5)],
  terminal: [R(7, 11, 50, 42, 7), P("M17 25 L25 32 L17 39"), P("M30 41 H43")],
  code: [P("M22 19 L9 32 L22 45 M42 19 L55 32 L42 45"), P("M36 13 L28 51")],
  cloud: [P("M19 47 H46 A11 11 0 0 0 47 25 A15 15 0 0 0 19 25 A11 11 0 0 0 19 47 Z")],
  gear: gear(),
  cube: [P("M32 7 L54 19 L54 45 L32 57 L10 45 L10 19 Z M10 19 L32 31 L54 19 M32 31 L32 57")],
  clock: [C(32, 32, 23), P("M32 17 V32 L42 39")],
  lightning: [P("M37 5 L14 36 H30 L26 59 L50 26 H34 Z")],
  chart: [P("M8 48 L22 34 L32 41 L44 22 L56 29"), P("M8 56 H56", 3)],
  eye: [P("M5 32 Q32 6 59 32 Q32 58 5 32 Z"), C(32, 32, 8)],
  user: [C(32, 21, 10), P("M12 56 Q12 37 32 37 Q52 37 52 56")],
  users: [C(24, 22, 9), P("M7 54 Q7 37 24 37 Q41 37 41 54"), P("M38 14 A9 9 0 1 1 42 31 M44 38 Q57 40 57 54")],
  file: [P("M15 7 H38 L50 19 V57 H15 Z M38 7 V19 H50"), P("M23 32 H42 M23 41 H42 M23 50 H34", 3.5)],
  folder: [P("M7 17 H25 L30 23 H57 V52 H7 Z")],
  network: [C(32, 13, 6), C(13, 51, 6), C(51, 51, 6), P("M29 18 L16 45 M35 18 L48 45 M19 51 H45")],
  git: [C(20, 13, 5), C(20, 51, 5), C(44, 23, 5), P("M20 18 V46 M44 28 Q44 42 22 46")],
  bug: [P("M22 24 Q22 14 32 14 Q42 14 42 24 V40 Q42 54 32 54 Q22 54 22 40 Z"), P("M22 30 H10 M42 30 H54 M22 42 H12 M42 42 H52 M26 14 L21 8 M38 14 L43 8 M32 24 V54", 3.5)],
  rocket: [P("M32 5 Q46 17 44 40 H20 Q18 17 32 5 Z"), C(32, 23, 5), P("M20 32 L11 46 L20 44 M44 32 L53 46 L44 44"), P("M27 46 L32 57 L37 46")],
  warning: [P("M32 8 L58 54 H6 Z"), P("M32 24 V38"), D(32, 46, 3.2)],
  check: [C(32, 32, 23), P("M21 33 L29 41 L44 24")],
  x: [C(32, 32, 23), P("M23 23 L41 41 M41 23 L23 41")],
  wifi: [P("M8 24 Q32 2 56 24"), P("M16 33 Q32 18 48 33"), P("M24 42 Q32 35 40 42"), D(32, 51, 3.5)],
  harddrive: [R(7, 20, 50, 25, 6), D(47, 32.5, 3.2), P("M15 32.5 H34", 3.5)],
  memory: [R(7, 17, 50, 26, 3), R(14, 23, 9, 14, 1), R(28, 23, 9, 14, 1), R(42, 23, 8, 14, 1), P("M15 43 V51 M25 43 V51 M39 43 V51 M49 43 V51", 3.5)],
  list: [D(12, 17, 3.4), D(12, 32, 3.4), D(12, 47, 3.4), P("M23 17 H55 M23 32 H55 M23 47 H55")],
  search: [C(27, 27, 17), P("M40 40 L56 56")],
  bell: [P("M17 45 V29 A15 15 0 0 1 47 29 V45 L52 50 H12 Z"), P("M27 56 H37")],
  house: [P("M8 31 L32 9 L56 31"), P("M15 25 V56 H49 V25"), R(27, 38, 10, 18, 2)],
  building: [R(12, 9, 26, 48, 3), R(38, 25, 16, 32, 3), P("M19 18 H22 M28 18 H31 M19 27 H22 M28 27 H31 M19 36 H22 M28 36 H31 M44 34 H48 M44 43 H48 M21 57 V48 H29 V57", 3.5)],
  car: [P("M7 41 V32 L15 19 H49 L57 32 V41 Z"), P("M7 32 H57", 3), C(18, 45, 5), C(46, 45, 5)],
  truck: [R(5, 17, 33, 26, 3), P("M38 25 H50 L59 35 V43 H38"), C(16, 47, 5), C(48, 47, 5)],
  envelope: [R(7, 15, 50, 35, 5), P("M8 19 L32 36 L56 19")],
  book: [P("M32 15 Q20 9 7 13 V50 Q20 46 32 52 Q44 46 57 50 V13 Q44 9 32 15 Z"), P("M32 15 V52")],
  phone: [R(19, 5, 26, 54, 6), P("M28 51 H36", 3.5)],
  bulb: (a) => {
    const els: El[] = [P("M23 42 Q15 34 15 25 A17 17 0 0 1 49 25 Q49 34 41 42 Z"), P("M25 49 H39 M28 56 H36")];
    if (a.o > 0.01) {
      els.unshift({ t: "p", d: "M23 42 Q15 34 15 25 A17 17 0 0 1 49 25 Q49 34 41 42 Z", fill: rgba(AMBER, 0.45 * a.o) });
      els.push({ t: "p", d: "M32 0 V-4 M4 25 H0 M60 25 H64 M10 5 L7 2 M54 5 L57 2", op: a.o });
    }
    return els;
  },
  stack: [P("M32 9 L57 21 L32 33 L7 21 Z"), P("M7 32 L32 44 L57 32"), P("M7 43 L32 55 L57 43")],
  refresh: [P("M51 24 A21 21 0 1 0 53 36"), P("M53 11 V25 H39")],
  flame: [P("M32 5 Q50 21 47 38 A15 15 0 0 1 17 38 Q17 27 26 19 Q28 30 35 31 Q31 18 32 5 Z")],
  signpost: [P("M32 6 V58 M24 58 H40"), P("M32 12 H50 L56 18 L50 24 H32"), P("M32 30 H14 L8 36 L14 42 H32")],
  fridge: [R(15, 5, 34, 54, 6), P("M15 24 H49"), P("M22 13 V18 M22 31 V40")],
  ship: [P("M6 38 H58 L49 53 H15 Z"), R(16, 25, 13, 13, 1), R(31, 25, 13, 13, 1), R(23, 13, 13, 12, 1)],
  thermometer: [P("M27 11 A5 5 0 0 1 37 11 V37 A10 10 0 1 1 27 37 Z"), P("M32 23 V45")],
  battery: [R(6, 19, 46, 26, 5), P("M57 27 V37"), R(12, 25, 9, 14, 1), R(25, 25, 9, 14, 1)],
  gauge: [P("M10 46 A23 23 0 1 1 54 46"), P("M32 41 L44 24"), D(32, 42, 3.4)],
  robot: [R(13, 20, 38, 29, 7), D(24, 33, 3.6), D(40, 33, 3.6), P("M32 20 V11"), D(32, 9, 3), P("M26 42 H38 M7 30 V39 M57 30 V39", 3.5)],
  calendar: [R(9, 13, 46, 42, 7), P("M9 27 H55 M21 7 V18 M43 7 V18")],
  scales: [P("M32 9 V54 M21 55 H43 M11 17 H53"), P("M11 17 L5 33 H17 Z M53 17 L47 33 H59 Z")],
  arrowright: [P("M9 32 H53 M37 16 L53 32 L37 48")],
  arrowdown: [P("M32 9 V53 M16 37 L32 53 L48 37")],
  prohibit: [C(32, 32, 23), P("M16 16 L48 48")],
  tag: [P("M8 8 H31 L57 34 L34 57 L8 31 Z"), D(20, 20, 3.6)],
  wrench: [P("M41 7 A13 13 0 0 0 29 25 L9 45 A6.5 6.5 0 0 0 19 55 L39 35 A13 13 0 0 0 57 23 L48 29 L41 26 L39 17 Z")],
  window: [R(6, 11, 52, 42, 6), P("M6 23 H58"), D(13, 17, 2), D(20, 17, 2)],
  sparkle: [P("M32 6 Q32 32 58 32 Q32 32 32 58 Q32 32 6 32 Q32 32 32 6 Z")],
  heart: [P("M32 54 Q8 39 8 22 A12 12 0 0 1 32 17 A12 12 0 0 1 56 22 Q56 39 32 54 Z")],
  star: [P("M32 6 L39 24 L58 25 L43 37 L48 56 L32 45 L16 56 L21 37 L6 25 L25 24 Z")],
  box: [P("M8 20 L32 9 L56 20 V46 L32 57 L8 46 Z"), P("M8 20 L32 31 L56 20 M32 31 V57"), P("M20 14.5 L44 25.5", 3.5)],
  link: [P("M27 37 L37 27"), P("M22 30 L16 36 A9 9 0 0 0 28 48 L34 42"), P("M30 22 L36 16 A9 9 0 0 1 48 28 L42 34")],
  pipe: [P("M6 24 H24 Q32 24 32 32 Q32 40 40 40 H58"), P("M6 16 V32 M58 32 V48")],
  queue: [R(6, 22, 12, 20, 3), R(26, 22, 12, 20, 3), R(46, 22, 12, 20, 3)],
  dashboard: [R(7, 9, 50, 46, 7), P("M7 22 H57"), P("M15 46 L24 36 L31 41 L41 30 L49 34", 3.5)],
  coffee: [P("M12 24 H44 V40 Q44 52 28 52 Q12 52 12 40 Z"), P("M44 29 H50 Q55 29 55 35 Q55 41 49 41 H44"), P("M22 9 Q19 13 22 17 M32 9 Q29 13 32 17", 3.5)],
  split: [C(12, 32, 6), P("M18 32 H28 M28 32 L48 14 M28 32 H48 M28 32 L48 50"), P("M42 10 L49 14 L44 21 M42 28 L49 32 L42 36 M44 43 L49 50 L42 54", 3.5)],
  chef: [P("M18 34 A9 9 0 0 1 20 17 A12 12 0 0 1 44 17 A9 9 0 0 1 46 34 Z"), P("M20 34 V50 H44 V34")],
  map: [P("M8 15 L23 9 L41 15 L56 9 V49 L41 55 L23 49 L8 55 Z"), P("M23 9 V49 M41 15 V55", 3.5)],
};
/** rotate a group of elements about (32,32) — only paths/circles survive rotation via transform later */
function rot(els: El[], deg: number): El[] {
  return els.map((e) => ({ ...e, _rot: deg }));
}

const ALIAS: { [k: string]: string } = {
  prise: "plug", plugsconnected: "plugs", socket: "plugs", connexion: "plugs", connection: "plugs",
  radio: "broadcast", antenna: "broadcast", signal: "broadcast", oreille: "ear", listen: "ear", processor: "cpu", chip: "cpu",
  dooropen: "door", porte: "door", db: "database", internet: "globe", world: "globe", globehemispherewest: "globe", globesimple: "globe",
  shieldchevron: "shield", firewall: "shield", lockkey: "lock", locksimple: "lock", padlock: "lock", cadenas: "lock",
  locksimpleopen: "lockopen", lockkeyopen: "lockopen", cle: "key", password: "key", hardrives: "server", rack: "server",
  terminalwindow: "terminal", console: "terminal", prompt: "terminal", shell: "terminal", codesimple: "code", brackets: "code", filecode: "code",
  cloudarrowup: "cloud", gearsix: "gear", settings: "gear", cog: "gear", package: "box", container: "cube", pod: "cube", cubefocus: "cube", conteneur: "ship",
  timer: "clock", alarm: "clock", stopwatch: "clock", hourglass: "clock", bolt: "lightning", zap: "lightning", fast: "lightning",
  chartline: "chart", chartlineup: "chart", activity: "chart", pulse: "chart", trendup: "chart", graph: "chart", metrics: "chart",
  eyes: "eye", person: "user", usercircle: "user", bouncer: "user", videur: "user", usersthree: "users", team: "users", group: "users",
  filetext: "file", document: "file", doc: "file", recipe: "file", notebook: "book", folderopen: "folder", foldersimple: "folder",
  treestructure: "network", share: "network", graphnodes: "network", gitbranch: "git", branch: "git", gitcommit: "git", bugbeetle: "bug",
  rocketlaunch: "rocket", deploy: "rocket", warningcircle: "warning", warningoctagon: "warning", alert: "warning", checkcircle: "check",
  sealcheck: "check", xcircle: "x", wifihigh: "wifi", disk: "harddrive", hdd: "harddrive", ssd: "harddrive", ram: "memory",
  listbullets: "list", listchecks: "list", magnifyingglass: "search", bellringing: "bell", houseline: "house", home: "house", maison: "house",
  buildings: "building", buildingoffice: "building", immeuble: "building", carprofile: "car", voiture: "car", van: "truck", camion: "truck",
  envelopesimple: "envelope", mail: "envelope", letter: "envelope", lettre: "envelope", mailbox: "envelope", bookopen: "book", books: "book",
  annuaire: "book", devicemobile: "phone", smartphone: "phone", lightbulb: "bulb", idea: "bulb", ampoule: "bulb", layers: "stack",
  stacksimple: "stack", arrowsclockwise: "refresh", arrowclockwise: "refresh", sync: "refresh", loop: "refresh", repeat: "refresh",
  fire: "flame", road: "signpost", route: "signpost", refrigerator: "fridge", frigo: "fridge", boat: "ship", bateau: "ship", boatsimple: "ship",
  batteryfull: "battery", batteryhigh: "battery", speedometer: "gauge", bot: "robot", calendarblank: "calendar", scale: "scales",
  balance: "scales", arrow: "arrowright", arrowfatright: "arrowright", forbidden: "prohibit", nosign: "prohibit", label: "tag",
  tool: "wrench", hammer: "wrench", appwindow: "window", browser: "window", sparkles: "sparkle", restaurant: "chef", cuisine: "chef",
  cook: "chef", chefhat: "chef", waiter: "user", serveur: "user", loadbalancer: "split", balancer: "split", router: "split", proxy: "split", reverseproxy: "split", arrowssplit: "split", ingress: "split", maptrifold: "map", pipeline: "pipe", flow: "pipe", fileattente: "queue",
  gauges: "gauge", monitor: "dashboard", grafana: "dashboard", cafe: "coffee", mug: "coffee",
};
export const glyphKey = (name?: string): string | null => {
  if (!name || typeof name !== "string") return null;
  const k = norm(name);
  if (GL[k]) return k;
  if (ALIAS[k]) return ALIAS[k];
  // trailing weight words / plurals (« ShieldCheckFill », « Servers »)
  const k2 = k.replace(/(fill|bold|regular|duotone|simple)$/, "");
  if (GL[k2]) return k2;
  if (ALIAS[k2]) return ALIAS[k2];
  const k3 = k2.replace(/s$/, "");
  if (GL[k3]) return k3;
  if (ALIAS[k3]) return ALIAS[k3];
  return null;
};
const kebab = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();

/**
 * Line icon. `draw` 0→1 draws the strokes on (pathLength), `o` drives animated glyphs (door opens, key turns,
 * bulb lights). Unknown names: our glyph set → the kit's Phosphor set → `fallback`.
 */
export const Glyph: React.FC<{ name?: string; size: number; color?: string; draw?: number; o?: number; sw?: number; fallback?: string; style?: React.CSSProperties }> = ({
  name,
  size,
  color = B.cyan,
  draw = 1,
  o = 0,
  sw = 4.6,
  fallback = "cube",
  style,
}) => {
  if (logoKey(name)) return <Logo name={name as string} size={size} draw={draw} style={style} />;
  let key = glyphKey(name);
  if (!key && name) {
    const kb = kebab(name);
    if (Object.prototype.hasOwnProperty.call(PHOSPHOR, kb)) {
      return (
        <div style={{ width: size, height: size, opacity: clamp01(draw * 1.4), transform: `scale(${(0.8 + 0.2 * clamp01(draw)).toFixed(3)})`, ...style }}>
          <Icon name={kb as IconName} size={size} color={color} />
        </div>
      );
    }
  }
  if (!key) key = glyphKey(fallback) ?? "cube";
  const def = GL[key];
  const els = typeof def === "function" ? def({ o, c: color }) : def;
  const dr = clamp01(draw);
  const common = { fill: "none", stroke: color, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - dr };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: "block", overflow: "visible", ...style }}>
      {els.map((e, i) => {
        const r = e._rot;
        const tr = r ? `rotate(${r.toFixed(1)} 32 32)` : undefined;
        if (e.t === "p") {
          if (!e.d) return null;
          if (e.fill) return <path key={i} d={e.d} fill={e.fill} stroke="none" opacity={dr} transform={tr} />;
          return <path key={i} d={e.d} {...common} strokeWidth={e.w ?? sw} opacity={e.op ?? 1} transform={tr} />;
        }
        if (e.t === "r") {
          if (e.fill) return <rect key={i} x={e.x} y={e.y} width={e.w} height={e.h} rx={e.rx} fill={e.fill} opacity={dr} transform={tr} />;
          return <rect key={i} x={e.x} y={e.y} width={e.w} height={e.h} rx={e.rx} {...common} transform={tr} />;
        }
        if (e.dot) return <circle key={i} cx={e.cx} cy={e.cy} r={e.r} fill={color} opacity={dr} transform={tr} />;
        return <circle key={i} cx={e.cx} cy={e.cy} r={e.r} {...common} transform={tr} />;
      })}
    </svg>
  );
};

/** rounded icon tile (tinted glass square) with a glyph inside */
export const IconTile: React.FC<{ name?: string; size: number; tone?: Tone; draw?: number; o?: number; glow?: number; fallback?: string; color?: string }> = ({ name, size, tone = "cyan", draw = 1, o = 0, glow = 0, fallback, color }) => {
  const ac = TONE[tone];
  if (logoKey(name)) return <Logo name={name as string} size={size} draw={draw} glow={0.25 + glow} glowColor={ac} />;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.29,
        background: `linear-gradient(160deg, ${rgba(ac, tone === "grey" ? 0.1 : 0.17)}, ${rgba(ac, 0.04)})`,
        border: `1px solid ${rgba(ac, tone === "grey" ? 0.22 : 0.36)}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 0 ${(22 + 40 * glow).toFixed(1)}px ${rgba(ac, (tone === "grey" ? 0.04 : 0.14) + 0.35 * glow)}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Glyph name={name} size={size * 0.62} color={color ?? (tone === "grey" ? "rgba(203,213,225,0.7)" : `rgb(${ac})`)} draw={draw} o={o} sw={size < 90 ? 5.2 : 4.6} fallback={fallback} />
    </div>
  );
};

/** words of a line rendered with code tokens in mono (slightly smaller), optional accent token */
export const Words: React.FC<{ text: string; size: number; color: string; accent?: (w: string, i: number) => React.CSSProperties | null; weight?: number; ls?: number }> = ({ text, size, color, accent, weight = 800, ls = -0.035 }) => {
  const ws = text.split(/ +/).filter(Boolean);
  return (
    <>
      {ws.map((w, i) => {
        const code = isCodeToken(w);
        const acc = accent ? accent(w, i) : null;
        return (
          <React.Fragment key={i}>
            <span
              style={{
                fontFamily: code ? MONO : INTER,
                fontWeight: code ? 700 : weight,
                fontSize: code ? size * 0.9 : size,
                letterSpacing: code ? "-0.01em" : `${ls}em`,
                color,
                ...(acc ?? {}),
              }}
            >
              {w}
            </span>
            {i < ws.length - 1 ? <span style={{ fontFamily: INTER, fontSize: size }}> </span> : null}
          </React.Fragment>
        );
      })}
    </>
  );
};
