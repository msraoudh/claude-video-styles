import React from "react";
import type { Archetype } from "..";
import { B } from "../../lib/look";
import { beatsFor, onWord } from "../../lib/episode";
import { beatPulse, useGlobalFrame } from "../../lib/sync";
import { AMBER, CheckGlyph, clamp, clamp01, Cursor, CYAN, enter, EO, FileGlyph, interStyle, kick, kickAny, lin, MONO_ADV, monoStyle, OK, rgba, Shell, Stage } from "./stage";
import { LANG_LABEL, normLang, sliceToks, tokenize, type Tok } from "./syntax";

/**
 * archetype « code » — a config file / manifest snippet in a glass editor.
 *
 * data = {
 *   file: string                         tab name, e.g. "postgresql.conf"  (default "config")
 *   lang?: string                        yaml | hcl (tf) | dockerfile | conf (ini/toml/nginx/env) | json | bash (sh)
 *                                        — default guessed from the file name, else conf
 *   lines: string[]                      ≤ 14 lines × 48 chars comfortably (18 lines max; longer lines → «…»)
 *   highlight?: [{ line: 1-based, on?: word, fix?: string, fix_on?: word }]   (1–3)
 *       the line glows amber on `on`; with `fix` the old line is struck/greyed and the new one is typed below it
 *       (diff style −/+) on `fix_on` (default: 42 frames after the highlight), green check when typed.
 * }
 */

const W = 870;
const LEFT = 70;
const HEAD = 72;
const STATUS = 46;
const PAD_T = 20;
const PAD_B = 18;
const NUM_R = 76; // line numbers right edge
const MARK_X = 88;
const CODE_X = 122;
const CODE_AVAIL = W - CODE_X - 34;
const MAX_H = 1000;
const CY = 745;

type HL = { line: number; on?: string; fix?: string; fix_on?: string; t: number; fx: number; ts: number; te: number; done: number };
type Row = { kind: "line" | "fix"; n: number; text: string; toks: Tok[]; hl?: HL; appear: number };

export const Code: Archetype = ({ spec }) => {
  const g = useGlobalFrame();
  const d = (spec.data ?? {}) as Record<string, unknown>;
  const from = spec.from;
  const to = spec.to;
  const file = String(d.file ?? "config").slice(0, 32);
  const lang = normLang(typeof d.lang === "string" ? d.lang : undefined, file);
  const lines0 = (Array.isArray(d.lines) ? d.lines : []).map((l) => String(l ?? "").replace(/\t/g, "  ").replace(/\s+$/, "")).slice(0, 18);
  const lines = lines0.length ? lines0 : ["# …"];
  const n = lines.length;

  /* ── highlights + timing ── */
  const rawH = (Array.isArray(d.highlight) ? d.highlight : [])
    .filter((h): h is Record<string, unknown> => !!h && typeof h === "object" && typeof (h as { line?: unknown }).line === "number")
    .map((h) => ({ line: clamp(Math.round(h.line as number), 1, n), on: typeof h.on === "string" ? h.on : undefined, fix: typeof h.fix === "string" ? h.fix.replace(/\s+$/, "") : undefined, fix_on: typeof h.fix_on === "string" ? h.fix_on : undefined }))
    .filter((h, i, a) => a.findIndex((x) => x.line === h.line) === i)
    .slice(0, 3);
  const bts = beatsFor(spec, rawH, 10);
  const hls: HL[] = [];
  rawH.forEach((h, k) => {
    const prev = hls[k - 1];
    const t = clamp(Math.max(bts[k], from + 22, prev ? prev.done + 6 : 0), from + 22, to - 30);
    let fx = h.fix ? onWord(spec, h.fix_on) ?? t + 42 : t;
    if (h.fix) fx = clamp(fx - 2, t + 14, to - 34);
    const ts = fx + 8;
    const te = ts + (h.fix ? clamp(Math.round(h.fix.length * 1.3), 12, 36) : 0);
    hls.push({ ...h, t, fx, ts, te, done: h.fix ? te + 2 : t });
  });

  /* ── layout (font from the longest line, shrunk again if the file is tall) ── */
  const all = [...lines, ...hls.filter((h) => h.fix).map((h) => h.fix as string)];
  const maxLen = Math.max(8, ...all.map((l) => l.length));
  let font = clamp(Math.floor(CODE_AVAIL / (maxLen * MONO_ADV)), 20, n <= 8 ? 40 : 34);
  const nRows = n + hls.filter((h) => h.fix).length;
  const bodyMax = MAX_H - HEAD - STATUS - PAD_T - PAD_B;
  if (nRows * font * 1.62 > bodyMax) font = Math.max(15, Math.floor(bodyMax / (nRows * 1.62)));
  const rowH = Math.round(font * 1.62);
  const cap = Math.floor(CODE_AVAIL / (font * MONO_ADV));
  const fit = (s: string) => (s.length > cap ? s.slice(0, cap - 1) + "…" : s);
  const stagger = Math.min(3, 36 / n);

  const rows: Row[] = [];
  lines.forEach((l, i) => {
    const hl = hls.find((h) => h.line === i + 1);
    rows.push({ kind: "line", n: i + 1, text: fit(l), toks: tokenize(fit(l), lang), hl, appear: from + 6 + Math.round(i * stagger) });
    if (hl?.fix) rows.push({ kind: "fix", n: i + 1, text: fit(hl.fix), toks: tokenize(fit(hl.fix), lang), hl, appear: hl.fx + 4 });
  });
  const rowHeight = (r: Row) => (r.kind === "fix" ? rowH * EO(lin(g, r.appear, r.appear + 12)) : rowH);
  const bodyNow = rows.reduce((s, r) => s + rowHeight(r), 0);
  const bodyFinal = rows.length * rowH;
  const H = HEAD + PAD_T + bodyNow + PAD_B + STATUS;
  const Hf = HEAD + PAD_T + bodyFinal + PAD_B + STATUS;
  const T = clamp(CY - Hf / 2, 250, 1250 - Hf);
  const top = T + (Hf - H) / 2;

  /* ── state ── */
  const active = [...hls].reverse().find((h) => g >= h.t);
  const focus = hls.length ? EO(lin(g, hls[0].t, hls[0].t + 12)) : 0;
  const savedAt = hls.filter((h) => h.fix).map((h) => h.done);
  const saved = savedAt.length > 0 && g >= Math.max(...savedAt);
  const editing = hls.some((h) => h.fix && g >= h.fx && g < h.done);
  const bp = beatPulse(g, 12);
  const beats = [...hls.map((h) => h.t), ...hls.filter((h) => h.fix).map((h) => h.fx)];
  const dones = hls.filter((h) => h.fix).map((h) => h.done);
  const hit = Math.min(1, 0.8 * kick(g, from + 1, 10) + 0.7 * kickAny(g, beats, 10) + 0.6 * kickAny(g, dones, 10));
  const flash = Math.min(1, 0.18 * bp + 0.75 * kick(g, from + 1, 8) + 0.45 * kickAny(g, beats, 8) + 0.4 * kickAny(g, dones, 9));
  const tint = dones.length && g >= dones[dones.length - 1] ? OK : CYAN;
  const land = enter(g, from, 18, 56, 12);
  const ry = Math.sin((g - from) * 0.021 + 1) * 1.3;
  const rx = Math.cos((g - from) * 0.017) * 0.8;
  const sheen = lin(g, from + 3, from + 32);
  const curLn = active ? active.line : 1;

  let y = HEAD + PAD_T;
  return (
    <Stage spec={spec} g={g} cy={CY} hit={hit} uid={`code-${spec.id}`}>
      <div
        style={{
          position: "absolute",
          left: LEFT - 60,
          top: top + H - 40,
          width: W + 120,
          height: 200,
          borderRadius: "50%",
          background: `radial-gradient(50% 50% at 50% 50%, ${rgba(CYAN, 0.2 + 0.12 * bp + 0.2 * hit)} 0%, ${rgba(CYAN, 0.06)} 45%, rgba(34,211,238,0) 72%)`,
          opacity: clamp01((g - from) / 10),
        }}
      />
      <div style={{ position: "absolute", left: LEFT, top, width: W, height: H, ...land }}>
        <div style={{ position: "absolute", inset: 0, transform: `perspective(2200px) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)` }}>
          <Shell w={W} h={H} flash={flash} sheen={sheen} lx={30 + 18 * Math.sin((g - from) * 0.015)} ly={6} tint={tint === OK ? OK : CYAN}>
            {/* gutter */}
            <div style={{ position: "absolute", left: 0, top: HEAD, width: CODE_X - 16, bottom: STATUS, background: "rgba(4,8,20,0.22)", borderRight: "1px solid rgba(255,255,255,0.05)" }} />
            {rows.map((r, i) => {
              const h = rowHeight(r);
              const rowTop = y;
              y += h;
              if (g < r.appear) return null;
              const p = EO(clamp01((g - r.appear) / 10));
              const hl = r.hl;
              const isOld = r.kind === "line" && !!hl?.fix && g >= hl.fx;
              const isHl = r.kind === "line" && !!hl && g >= hl.t;
              const isActive = isHl && active === hl;
              const bandP = isHl ? EO(lin(g, hl!.t, hl!.t + 11)) : 0;
              const strike = isOld ? EO(lin(g, hl!.fx, hl!.fx + 10)) : 0;
              const grey = isOld ? lin(g, hl!.fx + 2, hl!.fx + 12) : 0;
              const dimF = r.kind === "fix" || isHl ? 1 : 1 - 0.5 * focus;
              const typedN = r.kind === "fix" ? Math.round(lin(g, hl!.ts, hl!.te, 0, r.text.length)) : r.text.length;
              const typing = r.kind === "fix" && g >= hl!.ts && g < hl!.te + 6;
              const doneP = r.kind === "fix" ? pop01(g, hl!.done) : 0;
              const bandA = isOld ? 1 - grey : isActive ? 1 : 0.4;
              const pulse = isActive && !isOld ? 0.12 * bp + 0.25 * kick(g, hl!.t, 12) : 0;
              const textW = r.text.length * MONO_ADV * font;
              const numCol = r.kind === "fix" ? B.ok : isHl && !isOld ? B.amber : "rgba(226,236,250,0.32)";
              return (
                <div key={i} style={{ position: "absolute", left: 0, top: rowTop, width: W, height: h, overflow: "hidden" }}>
                  {/* highlight band (amber), fix band (green) */}
                  {isHl && bandA > 0.01 ? (
                    <div
                      style={{
                        position: "absolute",
                        left: 12,
                        top: 2,
                        height: rowH - 4,
                        width: `calc(${(bandP * 100).toFixed(1)}% - 24px)`,
                        borderRadius: 10,
                        background: `linear-gradient(90deg, ${rgba(AMBER, (0.18 + pulse) * bandA)}, ${rgba(AMBER, 0.04 * bandA)})`,
                        borderLeft: `4px solid ${rgba(AMBER, bandA)}`,
                        boxShadow: `0 0 ${(30 * kick(g, hl!.t, 12) * bandA).toFixed(1)}px ${rgba(AMBER, 0.35)}`,
                      }}
                    />
                  ) : null}
                  {r.kind === "fix" ? (
                    <div
                      style={{
                        position: "absolute",
                        left: 12,
                        top: 2,
                        height: rowH - 4,
                        width: W - 24,
                        borderRadius: 10,
                        background: `linear-gradient(90deg, ${rgba(OK, 0.16 + 0.14 * kick(g, hl!.done, 12))}, ${rgba(OK, 0.03)})`,
                        borderLeft: `4px solid ${B.ok}`,
                        boxShadow: `0 0 ${(30 * kick(g, hl!.done, 12)).toFixed(1)}px ${rgba(OK, 0.4)}`,
                      }}
                    />
                  ) : null}
                  <div style={{ position: "absolute", left: 0, top: 0, width: W, height: rowH, opacity: clamp01((g - r.appear) / 5) * dimF, transform: `translateY(${((1 - p) * 12).toFixed(1)}px)`, filter: p < 0.95 ? `blur(${((1 - p) * 6).toFixed(2)}px)` : undefined }}>
                    {/* line number */}
                    <div style={{ position: "absolute", right: W - NUM_R, top: 0, ...monoStyle(Math.round(font * 0.78), 500), lineHeight: `${rowH}px`, color: numCol, textAlign: "right" }}>{r.n}</div>
                    {/* diff marker */}
                    {isOld || r.kind === "fix" ? (
                      <div style={{ position: "absolute", left: MARK_X, top: 0, ...monoStyle(font, 700), lineHeight: `${rowH}px`, color: r.kind === "fix" ? B.ok : B.text3 }}>{r.kind === "fix" ? "+" : "−"}</div>
                    ) : null}
                    {/* code */}
                    <div style={{ position: "absolute", left: CODE_X, top: 0, ...monoStyle(font, 500), lineHeight: `${rowH}px` }}>
                      {sliceToks(r.toks, typedN).map((t, k) => (
                        <span key={k} style={{ color: grey > 0 ? mixGrey(t.c, grey) : t.c, fontWeight: t.b ? 700 : 500, fontStyle: t.i ? "italic" : undefined }}>
                          {t.t}
                        </span>
                      ))}
                      {typing ? <Cursor g={g} typing={g < hl!.te} size={font} /> : null}
                    </div>
                    {/* strike through the old line */}
                    {strike > 0 ? <div style={{ position: "absolute", left: CODE_X - 4, top: rowH / 2 - 1.5, height: 3, width: (textW + 8) * strike, borderRadius: 2, background: "rgba(203,213,225,0.62)" }} /> : null}
                    {/* green check when the fix is typed */}
                    {r.kind === "fix" && g >= hl!.done ? (
                      <div
                        style={{
                          position: "absolute",
                          left: Math.min(W - 64, CODE_X + textW + 18),
                          top: (rowH - 38) / 2,
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          background: B.ok,
                          boxShadow: `0 0 ${(12 + 22 * kick(g, hl!.done, 10)).toFixed(1)}px ${rgba(OK, 0.7)}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transform: `scale(${(0.4 + 0.6 * doneP).toFixed(3)})`,
                        }}
                      >
                        <CheckGlyph size={28} color={B.ink} stroke={4} p={lin(g, hl!.done + 2, hl!.done + 10)} />
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
            <EditorHead file={file} lang={LANG_LABEL[lang]} g={g} editing={editing} />
            <StatusBar g={g} ln={curLn} saved={saved} savedAt={savedAt.length ? Math.max(...savedAt) : 0} lang={LANG_LABEL[lang]} />
          </Shell>
        </div>
      </div>
    </Stage>
  );
};

const pop01 = (g: number, at: number, dur = 12) => {
  const t = clamp01((g - at) / dur);
  if (t <= 0) return 0;
  return 1 + 2.5 * Math.pow(t - 1, 3) + 1.5 * Math.pow(t - 1, 2);
};

/** fade a syntax colour toward the struck-through grey */
const mixGrey = (c: string, k: number) => (k >= 0.99 ? "rgba(203,213,225,0.42)" : k <= 0.01 ? c : `color-mix(in srgb, ${c} ${((1 - k) * 100).toFixed(0)}%, rgba(203,213,225,0.42))`);

const EditorHead: React.FC<{ file: string; lang: string; g: number; editing: boolean }> = ({ file, lang, g, editing }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: W, height: HEAD, borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(6,12,28,0.35)" }}>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{ position: "absolute", left: 30 + i * 24, top: 29, width: 14, height: 14, borderRadius: 7, background: `rgba(255,255,255,${(0.22 - i * 0.05).toFixed(2)})` }} />
    ))}
    <div
      style={{
        position: "absolute",
        left: 116,
        top: 14,
        height: 58,
        padding: "0 22px 0 16px",
        borderRadius: "14px 14px 0 0",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.035))",
        border: "1px solid rgba(255,255,255,0.1)",
        borderBottom: "none",
      }}
    >
      <FileGlyph size={28} />
      <span style={{ ...monoStyle(23, 600), color: B.white }}>{file}</span>
      {editing ? <span style={{ width: 11, height: 11, borderRadius: 6, background: B.amber, boxShadow: `0 0 10px ${rgba(AMBER, 0.8)}` }} /> : null}
      <span style={{ position: "absolute", left: 14, right: 14, bottom: 0, height: 2, borderRadius: 1, background: rgba(CYAN, 0.55 + 0.25 * Math.sin(g * 0.08)) }} />
    </div>
    <div style={{ position: "absolute", right: 30, top: 0, lineHeight: `${HEAD}px`, ...monoStyle(18, 600), color: B.text3, letterSpacing: "0.12em" }}>{lang}</div>
  </div>
);

const StatusBar: React.FC<{ g: number; ln: number; saved: boolean; savedAt: number; lang: string }> = ({ g, ln, saved, savedAt, lang }) => {
  const sp = EO(lin(g, savedAt, savedAt + 12));
  return (
    <div style={{ position: "absolute", left: 0, bottom: 0, width: W, height: STATUS, borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(4,8,20,0.3)" }}>
      <div style={{ position: "absolute", left: 30, top: 0, height: STATUS, display: "flex", alignItems: "center", gap: 10, ...monoStyle(17, 500), color: B.text3 }}>
        {saved ? (
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: B.ok, opacity: sp, transform: `translateY(${((1 - sp) * 8).toFixed(1)}px)` }}>
            <CheckGlyph size={20} color={B.ok} stroke={3.6} /> <span style={{ ...interStyle(18, 700) }}>corrigé</span>
          </span>
        ) : (
          <span>Ln {ln}, Col 1</span>
        )}
      </div>
      <div style={{ position: "absolute", right: 30, top: 0, lineHeight: `${STATUS}px`, ...monoStyle(17, 500), color: B.text3 }}>
        {saved ? `Ln ${ln}  ·  ` : ""}UTF-8  ·  {lang.toLowerCase()}
      </div>
    </div>
  );
};
