/**
 * fx.tsx — the shared look of the flow / stat / incident archetypes (brand-intro S4 language: lit corridor, light
 * plates, particles, real glass, one light streak per hit). COPIED verbatim into each of the three folders
 * (archetypes never import across folders) — keep the copies identical.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { fontInter, fontMono } from "../../kit/fonts";
import { Icon, type IconName } from "../../kit/Icon";
import { Logo, logoKey } from "../../kit/Logo";
import { PHOSPHOR } from "../../kit/phosphor";
import { B } from "../../lib/look";
import { beatPulse, rand } from "../../lib/sync";

/* ───────────────────────────── maths ───────────────────────────── */
export const EO = Easing.bezier(0.16, 1, 0.3, 1);
export const EIO = Easing.bezier(0.65, 0, 0.35, 1);
export const EI = Easing.bezier(0.7, 0, 0.84, 0);
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const lin = (g: number, a: number, b: number, from = 0, to = 1, ease?: (t: number) => number) =>
  b <= a
    ? g >= b
      ? to
      : from
    : interpolate(g, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", ...(ease ? { easing: ease } : {}) });
/** 0 before `at`, 1 at `at`, exponential decay after */
export const kick = (g: number, at: number, decay = 6) => (g < at ? 0 : Math.exp(-(g - at) / decay));
export const kickAny = (g: number, ats: number[], decay = 6) => ats.reduce((m, a) => Math.max(m, kick(g, a, decay)), 0);
/** 0..1 pop with a small overshoot */
export const pop = (g: number, at: number, dur = 12) => {
  const t = clamp01((g - at) / dur);
  if (t <= 0) return 0;
  const c1 = 1.5;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const CYAN = "34,211,238";
export const AMBER = "245,158,11";
export const OK = "52,211,153";
export const WHITE = "248,250,252";
export const BLUE = "59,130,246";
export const rgba = (rgb: string, a: number) => `rgba(${rgb},${Math.max(0, a).toFixed(3)})`;
export const inter = (size: number, weight = 800): React.CSSProperties => ({ fontFamily: fontInter, fontSize: size, fontWeight: weight });
export const mono = (size: number, weight = 600): React.CSSProperties => ({ fontFamily: fontMono, fontSize: size, fontWeight: weight });
/** entrance: blur 14→0 + rise + scale 0.94→1 (house ease) */
export const rise = (g: number, at: number, dist = 26, dur = 14): React.CSSProperties => {
  const p = EO(clamp01((g - at) / dur));
  return {
    opacity: clamp01((g - at) / (dur * 0.5)),
    transform: `translateY(${((1 - p) * dist).toFixed(1)}px) scale(${(0.94 + 0.06 * p).toFixed(4)})`,
    filter: p < 0.999 ? `blur(${(14 * (1 - p)).toFixed(2)}px)` : undefined,
  };
};

/* ───────────────────────────── text measuring (variable content) ───────────────────────────── */
const wCache = new Map<string, number>();
let ctx2d: CanvasRenderingContext2D | null = null;
/** width (px) of a single line. Real canvas metrics once the font is loaded (cached), a safe estimate before. */
export const textW = (text: string, size: number, weight = 800, family: "inter" | "mono" = "inter", trackingEm = 0) => {
  const fam = family === "mono" ? '"JetBrains Mono"' : "Inter";
  const font = `${weight} ${Math.round(size * 10) / 10}px ${fam}`;
  const track = trackingEm * size * Math.max(0, text.length - 1);
  const key = `${font}|${text}`;
  const hit = wCache.get(key);
  if (hit !== undefined) return hit + track;
  const est = text.length * size * (family === "mono" ? 0.602 : 0.6);
  if (typeof document === "undefined") return est + track;
  try {
    if (!ctx2d) ctx2d = document.createElement("canvas").getContext("2d");
    const loaded = (document as Document & { fonts?: FontFaceSet }).fonts?.check(font) ?? false;
    if (!ctx2d || !loaded) return est + track;
    ctx2d.font = font;
    const w = ctx2d.measureText(text).width;
    wCache.set(key, w);
    return w + track;
  } catch {
    return est + track;
  }
};
/** greedy word wrap (splits on plain spaces only: the narrow no-break space keeps « » ? ! : glued); 2 lines are balanced */
export const wrap = (text: string, size: number, maxW: number, weight = 800, family: "inter" | "mono" = "inter", trackingEm = 0) => {
  const words = text.split(/[ \t\n]+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (cur && textW(t, size, weight, family, trackingEm) > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  if (lines.length === 2 && words.length > 2) {
    let best = lines;
    let bw = Math.max(...lines.map((l) => textW(l, size, weight, family, trackingEm)));
    for (let k = 1; k < words.length; k++) {
      const a = words.slice(0, k).join(" ");
      const b = words.slice(k).join(" ");
      const w = Math.max(textW(a, size, weight, family, trackingEm), textW(b, size, weight, family, trackingEm));
      if (w <= maxW && w < bw - 0.5) {
        bw = w;
        best = [a, b];
      }
    }
    return best;
  }
  return lines.length ? lines : [""];
};
/** largest size in [minSize, maxSize] whose wrap fits maxLines lines of maxW (shrinks in 4 % steps) */
export const fitWrap = (
  text: string,
  maxSize: number,
  minSize: number,
  maxW: number,
  maxLines: number,
  weight = 800,
  family: "inter" | "mono" = "inter",
  trackingEm = 0,
) => {
  let size = maxSize;
  for (let k = 0; k < 40; k++) {
    const lines = wrap(text, size, maxW, weight, family, trackingEm);
    const widest = Math.max(...lines.map((l) => textW(l, size, weight, family, trackingEm)));
    if ((lines.length <= maxLines && widest <= maxW) || size <= minSize) return { size, lines, widest };
    size = Math.max(minSize, size * 0.96);
  }
  const lines = wrap(text, size, maxW, weight, family, trackingEm);
  return { size, lines, widest: Math.max(...lines.map((l) => textW(l, size, weight, family, trackingEm))) };
};
/** French typography: narrow no-break space before ? ! : ; (not inside « :5432 » / « 03:12 » / URLs) */
export const frType = (s: string) =>
  String(s ?? "")
    .replace(/\s+([?!;])/g, " $1")
    .replace(/\s+:(\s|$)/g, " :$1")
    .replace(/«\s*/g, "« ")
    .replace(/\s*»/g, " »");

/* ───────────────────────────── icons (generic line glyphs, no logos) ───────────────────────────── */
const sw = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
type GlyphFn = (c: string, a: string) => React.ReactNode;
const gear = (c: string) => {
  const teeth = Array.from({ length: 8 }, (_, i) => {
    const t = (i / 8) * Math.PI * 2;
    return `M${(32 + 15 * Math.cos(t)).toFixed(1)} ${(32 + 15 * Math.sin(t)).toFixed(1)} L${(32 + 22 * Math.cos(t)).toFixed(1)} ${(32 + 22 * Math.sin(t)).toFixed(1)}`;
  }).join(" ");
  return (
    <>
      <circle cx={32} cy={32} r={15} stroke={c} {...sw} />
      <circle cx={32} cy={32} r={6} stroke={c} {...sw} />
      <path d={teeth} stroke={c} strokeWidth={7} {...sw} />
    </>
  );
};
const GLYPHS: Record<string, GlyphFn> = {
  globe: (c) => (
    <>
      <circle cx={32} cy={32} r={23} stroke={c} {...sw} />
      <ellipse cx={32} cy={32} rx={10} ry={23} stroke={c} {...sw} />
      <path d="M9 32 H55 M13 20 H51 M13 44 H51" stroke={c} {...sw} />
    </>
  ),
  database: (c, a) => (
    <>
      <ellipse cx={32} cy={15} rx={19} ry={7} stroke={c} {...sw} />
      <path d="M13 15 V49 C13 53 21.5 56 32 56 C42.5 56 51 53 51 49 V15" stroke={c} {...sw} />
      <path d="M13 32 C13 36 21.5 39 32 39 C42.5 39 51 36 51 32" stroke={a} {...sw} />
    </>
  ),
  server: (c, a) => (
    <>
      <rect x={10} y={11} width={44} height={18} rx={5} stroke={c} {...sw} />
      <rect x={10} y={35} width={44} height={18} rx={5} stroke={c} {...sw} />
      <path d="M31 20 H45 M31 44 H45" stroke={c} {...sw} />
      <circle cx={19} cy={20} r={2.6} fill={a} />
      <circle cx={19} cy={44} r={2.6} fill={a} />
    </>
  ),
  shield: (c) => <path d="M32 7 L52 14.5 V30 C52 43 43.5 51.5 32 57 C20.5 51.5 12 43 12 30 V14.5 Z" stroke={c} {...sw} />,
  shieldcheck: (c, a) => (
    <>
      <path d="M32 7 L52 14.5 V30 C52 43 43.5 51.5 32 57 C20.5 51.5 12 43 12 30 V14.5 Z" stroke={c} {...sw} />
      <path d="M23 32 L29.5 38.5 L41.5 26" stroke={a} {...sw} />
    </>
  ),
  plug: (c, a) => (
    <>
      <path d="M24 7 V19 M40 7 V19" stroke={a} {...sw} />
      <path d="M15 19 H49 V29 C49 38.5 41.4 46 32 46 C22.6 46 15 38.5 15 29 Z M32 46 V57" stroke={c} {...sw} />
    </>
  ),
  cloud: (c) => (
    <path d="M19 48 H46 C52 48 56.5 43.5 56.5 37.5 C56.5 31.8 52 27.3 46.4 27.2 C44.6 19.6 38.3 14 30.6 14 C21.6 14 14.4 21.2 14.3 30.1 C10.2 31.3 7.5 35 7.5 39.2 C7.5 44.1 11.6 48 16.5 48 Z" stroke={c} {...sw} />
  ),
  cpu: (c, a) => (
    <>
      <rect x={17} y={17} width={30} height={30} rx={5} stroke={c} {...sw} />
      <rect x={26} y={26} width={12} height={12} rx={2} stroke={a} {...sw} />
      <path d="M26 9 V17 M38 9 V17 M26 47 V55 M38 47 V55 M9 26 H17 M9 38 H17 M47 26 H55 M47 38 H55" stroke={c} {...sw} />
    </>
  ),
  git: (c, a) => (
    <>
      <circle cx={20} cy={14} r={5.5} stroke={c} {...sw} />
      <circle cx={20} cy={50} r={5.5} stroke={c} {...sw} />
      <circle cx={44} cy={22} r={5.5} stroke={a} {...sw} />
      <path d="M20 19.5 V44.5 M44 27.5 C44 38 22 34 20.5 44" stroke={c} {...sw} />
    </>
  ),
  commit: (c, a) => (
    <>
      <circle cx={32} cy={32} r={9} stroke={a} {...sw} />
      <path d="M7 32 H23 M41 32 H57" stroke={c} {...sw} />
    </>
  ),
  rocket: (c, a) => (
    <>
      <path d="M32 6 C42.5 14 46.5 26.5 42.5 42 H21.5 C17.5 26.5 21.5 14 32 6 Z" stroke={c} {...sw} />
      <path d="M21.5 34 L13 42 L15 51 L23.5 45.5 M42.5 34 L51 42 L49 51 L40.5 45.5" stroke={c} {...sw} />
      <circle cx={32} cy={24} r={4.5} stroke={c} {...sw} />
      <path d="M27.5 49 L32 58 L36.5 49" stroke={a} {...sw} />
    </>
  ),
  flask: (c, a) => (
    <>
      <path d="M25 8 H39 M28 8 V25 L14 49 C12 53.5 14.5 56 18.5 56 H45.5 C49.5 56 52 53.5 50 49 L36 25 V8" stroke={c} {...sw} />
      <path d="M19.5 41 H44.5" stroke={a} {...sw} />
    </>
  ),
  gear: (c) => gear(c),
  bell: (c, a) => (
    <>
      <path d="M17 44 V30 C17 21.7 23.7 15 32 15 C40.3 15 47 21.7 47 30 V44 L51 48 H13 Z" stroke={c} {...sw} />
      <path d="M26.5 52.5 C27.6 55 29.6 56.5 32 56.5 C34.4 56.5 36.4 55 37.5 52.5" stroke={a} {...sw} />
      <path d="M32 8.5 V15" stroke={c} {...sw} />
    </>
  ),
  chart: (c, a) => (
    <>
      <path d="M8 46 L22 34 L32 40 L44 22 L56 28" stroke={c} {...sw} />
      <path d="M8 16 L56 16" stroke={a} strokeWidth={3} strokeDasharray="1 7" {...sw} />
    </>
  ),
  lock: (c, a) => (
    <>
      <rect x={13} y={28} width={38} height={27} rx={6} stroke={c} {...sw} />
      <path d="M21 28 V20 C21 13.9 25.9 9 32 9 C38.1 9 43 13.9 43 20 V28" stroke={c} {...sw} />
      <circle cx={32} cy={41.5} r={3.2} fill={a} />
    </>
  ),
  key: (c, a) => (
    <>
      <circle cx={20} cy={32} r={10} stroke={a} {...sw} />
      <path d="M30 32 L56 32 M47 32 L47 41 M54 32 L54 39" stroke={c} {...sw} />
    </>
  ),
  user: (c) => (
    <>
      <circle cx={32} cy={21} r={10} stroke={c} {...sw} />
      <path d="M13 55 C15 44 22.5 37.5 32 37.5 C41.5 37.5 49 44 51 55" stroke={c} {...sw} />
    </>
  ),
  users: (c, a) => (
    <>
      <circle cx={25} cy={22} r={9} stroke={c} {...sw} />
      <path d="M8 54 C10 44 16.5 38.5 25 38.5 C33.5 38.5 40 44 42 54" stroke={c} {...sw} />
      <path d="M38 14.5 C42.6 13.8 47 17.4 47 22.4 C47 27 43.4 30.5 39 30.8 M44 39.5 C50.2 41.5 54.4 47 56 54" stroke={a} {...sw} />
    </>
  ),
  cube: (c) => <path d="M32 8 L54 20 L54 44 L32 56 L10 44 L10 20 Z M10 20 L32 32 L54 20 M32 32 L32 56" stroke={c} {...sw} />,
  terminal: (c, a) => (
    <>
      <path d="M13 19 L28 32 L13 45" stroke={c} {...sw} />
      <path d="M33 46 L52 46" stroke={a} {...sw} />
    </>
  ),
  code: (c, a) => (
    <>
      <path d="M21 18 L9 32 L21 46 M43 18 L55 32 L43 46" stroke={c} {...sw} />
      <path d="M36.5 12 L27.5 52" stroke={a} {...sw} />
    </>
  ),
  lightning: (c) => <path d="M36 6 L14 36 H30 L26 58 L50 26 H34 Z" stroke={c} {...sw} />,
  balancer: (c, a) => (
    <>
      <circle cx={32} cy={13} r={6} stroke={a} {...sw} />
      <path d="M32 19 V31 M13 45 V37 H51 V45 M32 31 V45" stroke={c} {...sw} />
      <circle cx={13} cy={51} r={6} stroke={c} {...sw} />
      <circle cx={32} cy={51} r={6} stroke={c} {...sw} />
      <circle cx={51} cy={51} r={6} stroke={c} {...sw} />
    </>
  ),
  network: (c, a) => (
    <>
      <circle cx={32} cy={32} r={7} stroke={a} {...sw} />
      {[
        [13, 13],
        [51, 13],
        [13, 51],
        [51, 51],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={5.5} stroke={c} {...sw} />
      ))}
      <path d="M17 17 L27 27 M47 17 L37 27 M17 47 L27 37 M47 47 L37 37" stroke={c} {...sw} />
    </>
  ),
  layers: (c, a) => (
    <>
      <path d="M32 9 L55 21 L32 33 L9 21 Z" stroke={a} {...sw} />
      <path d="M9 32 L32 44 L55 32 M9 43 L32 55 L55 43" stroke={c} {...sw} />
    </>
  ),
  eye: (c, a) => (
    <>
      <path d="M5 32 C13 18.5 22.5 12 32 12 C41.5 12 51 18.5 59 32 C51 45.5 41.5 52 32 52 C22.5 52 13 45.5 5 32 Z" stroke={c} {...sw} />
      <circle cx={32} cy={32} r={8} stroke={a} {...sw} />
    </>
  ),
  warning: (c, a) => (
    <>
      <path d="M32 9 L57 53 H7 Z" stroke={c} {...sw} />
      <path d="M32 25 V38" stroke={a} {...sw} />
      <circle cx={32} cy={46} r={2.8} fill={a} />
    </>
  ),
  check: (c, a) => (
    <>
      <circle cx={32} cy={32} r={23} stroke={c} {...sw} />
      <path d="M21 32.5 L28.5 40 L43.5 25" stroke={a} {...sw} />
    </>
  ),
  clock: (c, a) => (
    <>
      <circle cx={32} cy={32} r={23} stroke={c} {...sw} />
      <path d="M32 18 V32 L42 38" stroke={a} {...sw} />
    </>
  ),
  mail: (c) => (
    <>
      <rect x={8} y={15} width={48} height={34} rx={6} stroke={c} {...sw} />
      <path d="M10 18 L32 35 L54 18" stroke={c} {...sw} />
    </>
  ),
  file: (c, a) => (
    <>
      <path d="M17 7 H38 L48 17 V57 H17 Z M38 7 V17 H48" stroke={c} {...sw} />
      <path d="M24 31 H41 M24 40 H41 M24 49 H34" stroke={a} {...sw} />
    </>
  ),
  search: (c, a) => (
    <>
      <circle cx={28} cy={28} r={16} stroke={c} {...sw} />
      <path d="M40 40 L54 54" stroke={a} {...sw} />
    </>
  ),
  browser: (c, a) => (
    <>
      <rect x={7} y={12} width={50} height={40} rx={7} stroke={c} {...sw} />
      <path d="M7 23 H57" stroke={c} {...sw} />
      <circle cx={14} cy={17.5} r={1.8} fill={a} />
    </>
  ),
  download: (c, a) => (
    <>
      <path d="M32 9 V39 M20 27 L32 39 L44 27" stroke={a} {...sw} />
      <path d="M11 45 V54 H53 V45" stroke={c} {...sw} />
    </>
  ),
  upload: (c, a) => (
    <>
      <path d="M32 39 V9 M20 21 L32 9 L44 21" stroke={a} {...sw} />
      <path d="M11 45 V54 H53 V45" stroke={c} {...sw} />
    </>
  ),
  bucket: (c, a) => (
    <>
      <ellipse cx={32} cy={17} rx={21} ry={7} stroke={c} {...sw} />
      <path d="M11 17 L17 52 C17.5 55 24 57 32 57 C40 57 46.5 55 47 52 L53 17" stroke={c} {...sw} />
      <path d="M14 31 C18 34 46 34 50 31" stroke={a} {...sw} />
    </>
  ),
  lambda: (c, a) => (
    <>
      <path d="M17 11 H25 L47 54" stroke={c} {...sw} />
      <path d="M33.5 28 L19 54" stroke={a} {...sw} />
    </>
  ),
  phone: (c, a) => (
    <>
      <rect x={19} y={7} width={26} height={50} rx={7} stroke={c} {...sw} />
      <path d="M28 49 H36" stroke={a} {...sw} />
    </>
  ),
  chat: (c) => <path d="M12 14 H52 C54.2 14 56 15.8 56 18 V42 C56 44.2 54.2 46 52 46 H28 L16 56 V46 H12 C9.8 46 8 44.2 8 42 V18 C8 15.8 9.8 14 12 14 Z" stroke={c} {...sw} />,
  wrench: (c) => (
    <path d="M40 9 C33 9.5 28 15.5 29 22.5 L10.5 41 C8 43.5 8 47.5 10.5 50 L14 53.5 C16.5 56 20.5 56 23 53.5 L41.5 35 C48.5 36 54.5 31 55 24 L47 29 L39 25 L35 17 Z" stroke={c} {...sw} />
  ),
  fire: (c, a) => (
    <>
      <path d="M32 6 C34 17 46 22 46 38 C46 48 39.7 56 32 56 C24.3 56 18 48 18 38 C18 30 22 25 26 21 C26 28 29 31 31 32 C30 22 30 14 32 6 Z" stroke={c} {...sw} />
      <path d="M32 47 C28.5 47 27 44 28.5 40 L32 35 L35.5 40 C37 44 35.5 47 32 47 Z" stroke={a} {...sw} />
    </>
  ),
  node: (c, a) => (
    <>
      <path d="M32 8 L53 20 V44 L32 56 L11 44 V20 Z" stroke={c} {...sw} />
      <circle cx={32} cy={32} r={6} stroke={a} {...sw} />
    </>
  ),
};

const norm = (s?: string) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

/** keyword → glyph. Matched against the icon name first, then the label (so « RDS » / « ALB » get a sensible glyph). */
const KEYWORDS: [string, string[]][] = [
  ["shieldcheck", ["shieldcheck", "sealcheck", "verified", "secure"]],
  ["shield", ["shield", "firewall", "parefeu", "waf", "securitygroup", "iptables", "ufw", "nftables", "guard", "protect", "security", "securite"]],
  ["globe", ["globe", "internet", "world", "web", "dns", "cdn", "cloudfront", "route53", "earth", "public", "monde"]],
  ["database", ["database", "db", "rds", "postgres", "postgresql", "mysql", "mariadb", "mongo", "dynamo", "sql", "aurora", "base", "data"]],
  ["server", ["server", "serveur", "ec2", "vm", "harddrive", "host", "instance", "machine", "node", "noeud", "backend", "nginx", "apache"]],
  ["balancer", ["alb", "elb", "nlb", "loadbalancer", "balancer", "lb", "ingress", "proxy", "haproxy", "treestructure", "split", "repartiteur"]],
  ["plug", ["plug", "plugs", "port", "socket", "connect", "connexion", "listen", "ecoute"]],
  ["cloud", ["cloud", "aws", "gcp", "azure", "region", "saas", "nuage"]],
  ["cpu", ["cpu", "chip", "processor", "compute", "memory", "memoire", "ram", "process", "programme", "program"]],
  ["git", ["gitbranch", "git", "branch", "merge", "pullrequest", "pr", "gitlab", "github", "repo", "branche"]],
  ["commit", ["commit", "gitcommit", "push"]],
  ["rocket", ["rocket", "deploy", "deploiement", "release", "launch", "ship", "prod", "production", "cd", "argocd"]],
  ["flask", ["flask", "test", "tests", "testtube", "qa", "lint", "verify", "verif", "unit"]],
  ["gear", ["gear", "build", "compile", "settings", "config", "pipeline", "ci", "job", "runner", "actions", "jenkins", "make", "cog", "automation"]],
  ["wrench", ["wrench", "fix", "repair", "patch", "correctif", "tool", "outil", "hammer"]],
  ["bell", ["bell", "alert", "alerte", "alertmanager", "pagerduty", "notify", "notification", "oncall", "astreinte", "page"]],
  ["chart", ["chart", "chartline", "graph", "metrics", "metrique", "prometheus", "grafana", "monitor", "monitoring", "scrape", "latency", "latence", "trend", "p95", "p99", "slo", "sli"]],
  ["lock", ["lock", "tls", "ssl", "https", "encrypt", "chiffre", "vault", "secret", "kms", "cert"]],
  ["key", ["key", "cle", "iam", "auth", "token", "ssh", "credential", "password", "role", "policy"]],
  ["users", ["users", "team", "equipe", "clients", "utilisateurs"]],
  ["user", ["user", "client", "utilisateur", "person", "dev", "developer", "developpeur", "admin"]],
  ["cube", ["cube", "container", "conteneur", "docker", "pod", "k8s", "kubernetes", "package", "image", "helm", "artifact", "artefact", "deployment"]],
  ["terminal", ["terminal", "shell", "bash", "cli", "console", "command", "commande", "prompt"]],
  ["code", ["code", "api", "rest", "http", "app", "application", "service", "json", "yaml", "terraform", "iac"]],
  ["lightning", ["lightning", "bolt", "cache", "redis", "memcached", "fast", "trigger", "event", "flash"]],
  ["layers", ["layers", "queue", "file", "sqs", "kafka", "rabbitmq", "stack", "sns", "pubsub", "broker", "topic"]],
  ["network", ["network", "reseau", "vpc", "subnet", "mesh", "router", "routeur", "nat", "gateway", "passerelle", "graph"]],
  ["eye", ["eye", "observe", "watch", "trace", "tracing", "audit"]],
  ["warning", ["warning", "warn", "danger", "attention", "risk", "risque", "incident"]],
  ["check", ["check", "checkcircle", "ok", "success", "valid", "healthy", "done", "pass"]],
  ["clock", ["clock", "time", "timer", "cron", "schedule", "delay", "timeout", "heure"]],
  ["mail", ["mail", "email", "envelope", "smtp", "message", "slack", "teams"]],
  ["file", ["file", "filetext", "log", "logs", "document", "doc", "config", "yaml", "manifest", "fichier", "journal"]],
  ["search", ["search", "magnifyingglass", "scan", "find", "lookup", "grep", "recherche"]],
  ["browser", ["browser", "navigateur", "frontend", "site", "page", "ui", "window", "appwindow"]],
  ["download", ["download", "pull", "fetch", "get", "telecharge"]],
  ["upload", ["upload", "send", "envoi", "export"]],
  ["bucket", ["bucket", "s3", "storage", "stockage", "blob", "backup", "sauvegarde", "archive", "disk", "volume", "ebs"]],
  ["lambda", ["lambda", "function", "fonction", "serverless", "faas"]],
  ["phone", ["phone", "mobile", "smartphone", "devicemobile"]],
  ["chat", ["chat", "chats", "chatcircle", "comment"]],
  ["fire", ["fire", "flame", "hot", "burn", "chaos"]],
];

const pickGlyph = (s: string): string | null => {
  const n = norm(s);
  if (!n) return null;
  for (const [g, keys] of KEYWORDS) if (keys.includes(n)) return g;
  for (const [g, keys] of KEYWORDS) if (keys.some((k) => k.length >= 3 && n.includes(k))) return g;
  return null;
};
const kebab = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();

/** icon name (Phosphor-style « Database », « ShieldCheck », free text…) + label → a glyph; never fails */
export const NodeGlyph: React.FC<{ name?: string; label?: string; size: number; color: string; accent?: string }> = ({ name, label, size, color, accent }) => {
  const a = accent ?? color;
  const lk = logoKey(name) ? name : logoKey(label) ? label : null;
  if (lk) return <Logo name={lk as string} size={size} />;
  let key = name ? pickGlyph(name) : null;
  if (!key && name) {
    const k = kebab(name);
    if (Object.prototype.hasOwnProperty.call(PHOSPHOR, k)) return <Icon name={k as IconName} size={size} color={color} />;
  }
  if (!key && label) for (const w of String(label).split(/[\s/·:→>-]+/)) if ((key = pickGlyph(w))) break;
  if (!key && label) key = pickGlyph(label);
  const fn = GLYPHS[key ?? "node"] ?? GLYPHS.node;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: "block", overflow: "visible" }}>
      <g strokeWidth={4.6}>{fn(color, a)}</g>
    </svg>
  );
};

export const CheckGlyph: React.FC<{ size?: number; color?: string; p?: number; stroke?: number }> = ({ size = 28, color = B.white, p = 1, stroke = 3.4 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" style={{ display: "block" }}>
    <path d="M6 14.5 L11.5 20 L22 8.5" stroke={color} strokeWidth={stroke} strokeDasharray={30} strokeDashoffset={30 * (1 - clamp01(p))} {...sw} />
  </svg>
);

/* ───────────────────────────── glass (real backdrop blur, refracted light, gradient rim) ───────────────────────────── */
/**
 * Never put opacity/filter on an ancestor of a Shell for long (it cuts the backdrop) — move it, don't fade it.
 * `tint` = the rim/glow colour (CYAN, AMBER, OK), `flash` 0..1 rim flash on a hit, `sheen` 0..1 one sweep.
 */
export const Shell: React.FC<{
  w: number;
  h: number;
  flash?: number;
  sheen?: number;
  lx?: number;
  ly?: number;
  radius?: number;
  glow?: number;
  tint?: string;
  rim?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ w, h, flash = 0, sheen = -1, lx = 28, ly = 8, radius = 38, glow = 1, tint = CYAN, rim = 1, style, children }) => (
  <div
    style={{
      position: "relative",
      width: w,
      height: h,
      borderRadius: radius,
      overflow: "hidden",
      background: "linear-gradient(165deg, rgba(36,58,100,0.50) 0%, rgba(14,26,52,0.62) 40%, rgba(6,12,28,0.74) 100%)",
      backdropFilter: "blur(26px) saturate(175%)",
      WebkitBackdropFilter: "blur(26px) saturate(175%)",
      boxShadow: [
        "0 0 0 0.5px rgba(255,255,255,0.18)",
        "0 10px 26px rgba(0,0,0,0.5)",
        "0 46px 100px rgba(0,0,0,0.5)",
        `0 0 ${((70 + 90 * flash) * glow).toFixed(1)}px ${rgba(tint, (0.16 + 0.45 * flash) * glow)}`,
        "inset 0 1px 0 rgba(255,255,255,0.42)",
        "inset 0 18px 30px -18px rgba(255,255,255,0.16)",
        "inset 0 -1px 0 rgba(0,0,0,0.5)",
      ].join(", "),
      ...style,
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(75% 55% at ${lx.toFixed(1)}% ${ly.toFixed(1)}%, ${rgba(tint, 0.17 + 0.2 * flash)} 0%, ${rgba(tint, 0.05)} 45%, ${rgba(tint, 0)} 75%)`,
      }}
    />
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "26%", background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0))" }} />
    <div style={{ position: "absolute", top: -10, left: -10, width: "50%", height: "40%", background: "radial-gradient(ellipse at 22% 18%, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 60%)" }} />
    {children}
    {sheen > 0 && sheen < 1 ? (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(112deg, rgba(255,255,255,0) ${(sheen * 150 - 40).toFixed(1)}%, rgba(255,255,255,0.13) ${(sheen * 150 - 26).toFixed(1)}%, rgba(255,255,255,0) ${(sheen * 150 - 12).toFixed(1)}%)`,
          pointerEvents: "none",
        }}
      />
    ) : null}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        padding: 1.5,
        background: `linear-gradient(180deg, rgba(255,255,255,${(0.55 * rim).toFixed(3)}) 0%, rgba(255,255,255,0.10) 26%, ${rgba(tint, (0.22 + 0.65 * flash) * rim)} 68%, rgba(255,255,255,${(0.24 * rim).toFixed(3)}) 100%)`,
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        pointerEvents: "none",
      }}
    />
  </div>
);

/** small floating pill above a card (« 01 · OUTIL LINUX » language of the brand intro) */
export const Eyebrow: React.FC<{ label: string; p: number; tint?: string; lead?: React.ReactNode }> = ({ label, p, tint = CYAN, lead }) => (
  <div
    style={{
      height: 54,
      display: "inline-flex",
      alignItems: "center",
      gap: 14,
      padding: "0 22px",
      borderRadius: 27,
      background: "rgba(8,16,34,0.82)",
      border: `1px solid ${rgba(tint, 0.32)}`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 8px 24px rgba(0,0,0,0.45), 0 0 26px ${rgba(tint, 0.12)}`,
      transform: `translateY(${((1 - p) * 18).toFixed(1)}px) scale(${(0.86 + 0.14 * p).toFixed(3)})`,
      transformOrigin: "0% 100%",
      opacity: Math.min(1, p * 1.6),
      whiteSpace: "nowrap",
    }}
  >
    {lead}
    <span style={{ ...inter(22, 700), letterSpacing: "0.16em", color: B.white, textTransform: "uppercase" }}>{label}</span>
  </div>
);

/* ───────────────────────────── the lit world behind the glass ───────────────────────────── */
const CXW = 524; // projection centre (a hair left of 540: Instagram's right-hand icon column)
const HORIZON = 1010;

/** soft light plates, perspective floor/ceiling grid moving toward the lens, back particles. `hit` flares the light. */
export const World: React.FC<{ g: number; t: number; hit?: number; warm?: number; seed?: number; speed?: number }> = ({ g, t, hit = 0, warm = 0, seed = 1, speed = 3.2 }) => {
  const bp = beatPulse(g, 14);
  const plates = [
    { x: 300 + 60 * Math.sin(t * 0.011 + seed), y: 520 + 40 * Math.cos(t * 0.009), r: 760, c: CYAN, a: 0.3 },
    { x: 820 + 50 * Math.cos(t * 0.008 + seed), y: 980 + 50 * Math.sin(t * 0.012), r: 900, c: BLUE, a: 0.26 },
    { x: 540 + 30 * Math.sin(t * 0.006), y: 760, r: 1250, c: "14,116,144", a: 0.28 },
    { x: 760 + 40 * Math.sin(t * 0.01 + 2), y: 300, r: 620, c: CYAN, a: 0.16 },
  ];
  // floor + ceiling
  const F = 1000;
  const lines: React.ReactNode[] = [];
  const step = 480;
  const off = (t * speed) % step;
  for (const pl of [
    { h: 430, a: 0.42, id: "f" },
    { h: -1250, a: 0.2, id: "c" },
  ]) {
    for (let k = 1; k < 20; k++) {
      const d = k * step - off;
      if (d < 380) continue;
      const y = HORIZON + (F * pl.h) / d;
      if (y < -10 || y > 1930) continue;
      const a = pl.a * Math.pow(clamp01(1 - d / 9000), 1.4) * clamp01((d - 380) / 300);
      lines.push(<line key={`${pl.id}t${k}`} x1={-200} x2={1280} y1={y} y2={y} stroke={rgba(CYAN, a)} strokeWidth={2.2} />);
    }
    for (let k = -11; k <= 11; k++) {
      const x = k * 380;
      const dN = 420;
      const dF = 9000;
      lines.push(
        <line
          key={`${pl.id}l${k}`}
          x1={CXW + (F * x) / dN}
          y1={HORIZON + (F * pl.h) / dN}
          x2={CXW + (F * x) / dF}
          y2={HORIZON + (F * pl.h) / dF}
          stroke={`url(#fx-fade-${pl.id})`}
          strokeWidth={2.2}
        />,
      );
    }
  }
  return (
    <AbsoluteFill style={{ background: B.bg, overflow: "hidden" }}>
      {plates.map((p, i) => {
        const a = p.a * (1 + 0.5 * hit + 0.3 * bp);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x - p.r,
              top: p.y - p.r,
              width: p.r * 2,
              height: p.r * 2,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${rgba(p.c, a)} 0%, ${rgba(p.c, a * 0.35)} 38%, ${rgba(p.c, 0)} 70%)`,
            }}
          />
        );
      })}
      {warm > 0.001 ? (
        <div style={{ position: "absolute", left: 540 - 700, top: 640 - 700, width: 1400, height: 1400, borderRadius: "50%", background: `radial-gradient(circle, ${rgba(AMBER, 0.2 * warm)} 0%, ${rgba(AMBER, 0.06 * warm)} 40%, ${rgba(AMBER, 0)} 70%)` }} />
      ) : null}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="fx-fade-f" x1="0" y1={HORIZON + 430 / 9} x2="0" y2={HORIZON + (1000 * 430) / 420} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={B.cyan} stopOpacity={0} />
            <stop offset="0.5" stopColor={B.cyan} stopOpacity={0.2} />
            <stop offset="1" stopColor={B.cyan} stopOpacity={0.48} />
          </linearGradient>
          <linearGradient id="fx-fade-c" x1="0" y1={HORIZON - 1250 / 9} x2="0" y2={HORIZON - (1000 * 1250) / 420} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={B.cyan} stopOpacity={0} />
            <stop offset="0.5" stopColor={B.cyan} stopOpacity={0.09} />
            <stop offset="1" stopColor={B.cyan} stopOpacity={0.22} />
          </linearGradient>
        </defs>
        {lines}
      </svg>
      <Particles t={t} front={false} seed={seed} />
    </AbsoluteFill>
  );
};

type Pt = { x: number; y: number; z: number; r: number; white: boolean; ph: number };
const mkParts = (n: number, seed: number, front: boolean): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    let x = rand(i * 3.1 + seed) * 1080;
    let y = rand(i * 5.7 + seed * 2) * 1920;
    if (front) {
      // foreground bokeh stays on the edges (never over the text column)
      if (rand(i * 1.3 + seed) < 0.5) x = rand(i * 2.9) < 0.5 ? rand(i * 4.4) * 130 : 950 + rand(i * 4.4) * 130;
      else y = rand(i * 2.9) < 0.5 ? rand(i * 6.1) * 210 : 1560 + rand(i * 6.1) * 360;
    }
    return { x, y, z: 0.3 + rand(i * 7.3 + seed) * 0.7, r: front ? 10 + rand(i * 9.1) * 18 : 1.4 + rand(i * 9.1) * 2.4, white: rand(i * 2.2 + seed) > 0.7, ph: rand(i * 8.8) * 6.28 };
  });
const BACK = mkParts(70, 1, false);
const FRONT = mkParts(9, 4, true);

/** slow upward drift with parallax (z); `front` = blurred near bokeh on the frame edges */
export const Particles: React.FC<{ t: number; front: boolean; seed?: number; boost?: number }> = ({ t, front, boost = 0 }) => {
  const list = front ? FRONT : BACK;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
      {front ? (
        <defs>
          <filter id="fx-bokeh" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={7} />
          </filter>
        </defs>
      ) : null}
      <g filter={front ? "url(#fx-bokeh)" : undefined}>
        {list.map((p, i) => {
          const sp = (front ? 1.1 : 0.35) * p.z;
          const y = (((p.y - t * sp - boost * 40 * p.z) % 2000) + 2000) % 2000 - 40;
          const x = p.x + Math.sin(t * 0.02 * p.z + p.ph) * 14 * p.z;
          const tw = 0.55 + 0.45 * Math.sin(t * 0.05 + p.ph);
          const a = front ? 0.16 * tw : (p.white ? 0.55 : 0.7) * p.z * tw;
          return <circle key={i} cx={x} cy={y} r={p.r} fill={p.white ? "rgb(235,245,255)" : B.cyan} opacity={a} />;
        })}
      </g>
    </svg>
  );
};

/** top/bottom grade so the HUD and the caption band stay calm */
export const Grade: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "linear-gradient(180deg, rgba(4,7,15,0.55) 0%, rgba(4,7,15,0) 13%, rgba(4,7,15,0) 64%, rgba(4,7,15,0.35) 78%, rgba(4,7,15,0.62) 100%)",
      pointerEvents: "none",
    }}
  />
);

/** the streak stays soft over the caption band (y 1300–1540) */
const STREAK_MASK = "linear-gradient(180deg, #000 0%, #000 64%, rgba(0,0,0,0.22) 68%, rgba(0,0,0,0.22) 81%, #000 85%)";
/** ONE 5-frame cyan light streak on a hit */
export const Streak: React.FC<{ g: number; at: number; dir?: 1 | -1; tint?: string }> = ({ g, at, dir = 1, tint = CYAN }) => {
  const a = at - 2;
  const b = at + 3;
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
        boxShadow: `0 0 ${glow}px ${glow / 3}px ${rgba(tint, 0.6)}`,
        borderRadius: w,
        transform: `rotate(${dir * 16}deg)`,
        transformOrigin: "50% 50%",
      }}
    />
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", overflow: "hidden", WebkitMaskImage: STREAK_MASK, maskImage: STREAK_MASK }}>
      {bar(180, -120 * dir, rgba(tint, 0.16), 50)}
      {bar(30, 0, "rgba(190,250,255,0.78)", 34)}
      {bar(7, 64 * dir, "rgba(255,255,255,0.85)", 12)}
    </AbsoluteFill>
  );
};

/** expanding shockwave rings at (x, y) from frame `at` */
export const Shock: React.FC<{ g: number; at: number; x: number; y: number; r0?: number; r1?: number; dur?: number; tint?: string; width?: number; count?: number }> = ({
  g,
  at,
  x,
  y,
  r0 = 30,
  r1 = 320,
  dur = 36,
  tint = AMBER,
  width = 4,
  count = 2,
}) => {
  if (g < at || g > at + dur + 12 * count) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", overflow: "visible" }}>
      {Array.from({ length: count }, (_, k) => {
        const tt = clamp01((g - at - k * 7) / dur);
        if (tt <= 0 || tt >= 1) return null;
        const r = mix(r0, r1, EO(tt));
        return <circle key={k} cx={x} cy={y} r={r} fill="none" stroke={rgba(k === 0 ? tint : CYAN, (1 - tt) * (k === 0 ? 0.85 : 0.5))} strokeWidth={width * (1 - 0.6 * tt)} />;
      })}
    </svg>
  );
};

/** spark burst: dots flying out of (x, y) on a hit */
export const Sparks: React.FC<{ g: number; at: number; x: number; y: number; n?: number; dist?: number; tint?: string; seed?: number }> = ({ g, at, x, y, n = 14, dist = 260, tint = AMBER, seed = 3 }) => {
  const t = (g - at) / 34;
  if (t <= 0 || t >= 1) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, i) => {
        const ang = (i / n) * Math.PI * 2 + rand(i + seed) * 0.5;
        const d = dist * (0.55 + 0.45 * rand(i * 3 + seed)) * EO(t);
        const px = x + Math.cos(ang) * d;
        const py = y + Math.sin(ang) * d * 0.8;
        const r = (i % 3 === 0 ? 5 : 3) * (1 - t * 0.6);
        return <circle key={i} cx={px} cy={py} r={r} fill={i % 3 === 1 ? "rgb(255,248,235)" : `rgb(${tint})`} opacity={(1 - t) * 0.95} />;
      })}
    </svg>
  );
};
