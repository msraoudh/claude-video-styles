/* eslint-disable @typescript-eslint/no-explicit-any */
import { EPISODE, KEY } from "../../../data/episode";
import { PHRASES, type Word } from "../../../data/voice";
import type { SceneSpec } from "../../../data/episode";
import { PHOSPHOR } from "../../../kit/phosphor";
import type { IconName } from "../../../kit/Icon";

/**
 * Episode meta for the signature pieces, read DEFENSIVELY (data/episode.ts is regenerated every day; any optional
 * field may be missing): title {kicker?, line, command?}, number, page, handle.
 */
const E = EPISODE as any;
const K = KEY as any;

export const epTitle = (): { kicker?: string; line: string; command?: string } => {
  const t = E.title ?? {};
  const line = String(t.line ?? E.topic ?? "").trim();
  const kicker = t.kicker ? String(t.kicker).trim() : undefined;
  const command = t.command ? String(t.command).trim() : undefined;
  return { kicker: kicker || undefined, line, command: command || undefined };
};
export const epNumber = (): number | undefined => (typeof E.number === "number" || typeof E.number === "string" ? Number(E.number) || undefined : undefined);
export const epPage = (): string => String(E.page ?? "Your Page");
export const epHandle = (): string => String(E.handle ?? "@your_page");

export const keys = () => ({
  titleFrom: Number(K.titleFrom ?? K.drop ?? 0),
  titleTo: Number(K.titleTo ?? 0),
  ctaFrom: Number(K.ctaFrom ?? 0),
  finalHit: Number(K.finalHit ?? 0),
  end: Number(K.end ?? 0),
});

/* ───────────── icons: Phosphor names ("ShieldWarning", "shield-warning", "Plugs") → a glyph we have ───────────── */
const kebab = (s: string) =>
  s
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
const ALIAS: Record<string, string> = {
  plugs: "lightning", plug: "lightning", database: "file-text", server: "laptop", cpu: "gear-six", terminal: "laptop",
  globe: "map-trifold", cloud: "sparkle", door: "lock-simple-open", ear: "eye", bug: "warning-circle", fire: "lightning",
  rocket: "paper-plane-tilt", key: "lock-simple", lock: "lock-simple", "lock-key": "lock-simple", eye: "eye",
  question: "info", alarm: "bell", gauge: "timer", speedometer: "timer", chart: "lightning", "chart-line": "lightning",
  code: "file-text", file: "file-text", folder: "file-text", wrench: "gear-six", gear: "gear-six", stack: "cards",
  cube: "cards", package: "cards", "git-branch": "cards", network: "users", "shield-warning": "shield", "shield-slash": "shield",
  warning: "warning-circle", "warning-octagon": "warning-circle", skull: "ghost", detective: "magnifying-glass",
};
export const resolveIcon = (name?: string, fallback: IconName = "lightning"): IconName => {
  if (!name) return fallback;
  const has = (n: string) => Object.prototype.hasOwnProperty.call(PHOSPHOR, n);
  const k0 = kebab(name);
  if (has(k0)) return k0 as IconName;
  // plural parts: "arrows-clockwise" → "arrow-clockwise", "hard-drives" → "hard-drive"
  const sing = k0.split("-").map((p) => (p.length > 3 && p.endsWith("s") ? p.slice(0, -1) : p)).join("-");
  if (has(sing)) return sing as IconName;
  const k = k0;
  if (ALIAS[k] && has(ALIAS[k])) return ALIAS[k] as IconName;
  // try shorter forms: "shield-warning" → "shield", "warning-circle" … then any part
  const parts = k.split("-");
  for (let n = parts.length - 1; n >= 1; n--) {
    const p = parts.slice(0, n).join("-");
    if (has(p)) return p as IconName;
    if (ALIAS[p] && has(ALIAS[p])) return ALIAS[p] as IconName;
  }
  for (const p of parts) {
    if (has(p)) return p as IconName;
    if (has(`${p}-circle`)) return `${p}-circle` as IconName;
    if (ALIAS[p] && has(ALIAS[p])) return ALIAS[p] as IconName;
  }
  return fallback;
};

/* ───────────── words ───────────── */
export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
export const words = (spec: SceneSpec): Word[] => PHRASES.filter((p) => spec.phrases.includes(p.id)).flatMap((p) => p.words);

/** first spoken word matching any of `keys` (prefix, accents ignored) at or after frame `after` */
export const wordAt = (spec: SceneSpec, keys: string[], after = -Infinity): number | undefined => {
  const ws = words(spec);
  for (const w of ws) {
    if (w.f < after) continue;
    const n = norm(w.w);
    if (keys.some((k) => {
      const kk = norm(k);
      return kk && (n.startsWith(kk) || (kk.length > 3 && n.includes(kk)));
    })) return w.f;
  }
  return undefined;
};

/**
 * Landing frames for the words of an on-screen line, synced to the voice:
 * each line word is matched (monotonic, prefix) to a spoken word; unmatched words are interpolated between their
 * matched neighbours. Then the line never lags the reading pace: word i lands no later than start + i·pace
 * (the voice may still be slower — the line leads, eyes before ears).
 */
export const lineBeats = (spec: SceneSpec, lineWords: string[], o: { start: number; pace: number; lead?: number }): number[] => {
  const ws = words(spec);
  const lead = o.lead ?? 2;
  const m: (number | undefined)[] = [];
  let j = 0;
  for (const lw of lineWords) {
    const want = norm(lw);
    let hit: number | undefined;
    if (want) {
      const look = want.length <= 2 ? 3 : ws.length; // tiny words only match very close by
      for (let q = j; q < Math.min(ws.length, j + look); q++) {
        const n = norm(ws[q].w);
        if (n === want || (want.length >= 3 && (n.startsWith(want) || (want.startsWith(n) && n.length >= 3)))) {
          hit = ws[q].f - lead;
          j = q + 1;
          break;
        }
      }
    }
    m.push(hit);
  }
  const n = lineWords.length;
  const [a, b] = ws.length ? [ws[0].f, ws[ws.length - 1].fe] : [spec.from + 6, spec.to - 20];
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    let f = m[i];
    if (f === undefined) {
      let p = i - 1;
      while (p >= 0 && m[p] === undefined) p--;
      let q = i + 1;
      while (q < n && m[q] === undefined) q++;
      const fa = p >= 0 ? (m[p] as number) : a - lead;
      const ia = p >= 0 ? p : -1;
      const fb = q < n ? (m[q] as number) : Math.max(fa + 8, Math.min(b, fa + (n - ia) * 10));
      const ib = q < n ? q : n;
      f = Math.round(fa + ((fb - fa) * (i - ia)) / Math.max(1, ib - ia));
    }
    f = Math.min(f, o.start + i * o.pace);
    if (out.length) f = Math.max(f, out[out.length - 1] + 2);
    out.push(Math.max(spec.from, f));
  }
  return out;
};
