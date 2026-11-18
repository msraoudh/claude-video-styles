import React from "react";
import type { Archetype } from "..";
import { B } from "../../lib/look";
import { onWord, speechSpan } from "../../lib/episode";
import { beatPulse, useGlobalFrame } from "../../lib/sync";
import {
  AMBER,
  balancedSplit,
  CheckGlyph,
  clamp,
  clamp01,
  CopyGlyph,
  Cursor,
  CYAN,
  enter,
  EO,
  interStyle,
  interWidth,
  kick,
  kickAny,
  lin,
  MONO_ADV,
  monoStyle,
  OK,
  phraseEndAt,
  pop,
  PromptGlyph,
  rgba,
  Shell,
  Stage,
} from "./stage";

/**
 * archetype « terminal » — THE command of the day, typed in a glass terminal.
 *
 * data = {
 *   command: string            (≤ ~60 chars; shrinks, then wraps with a `\` continuation at spaces)
 *   on?: string                spoken word where typing starts (default: scene start)
 *   enter_on?: string          spoken word for Enter (default: end of the phrase that contains `on`, 8–48 f after typing)
 *   output?: (string | {text, tone?: "dim"|"ok"|"warn"|"accent"|"default", on?})[]   0–8 lines ≤ ~70 chars
 *   commands?: [{command, on?, enter_on?, output?}]   (2 max — replaces command/on/output; the window scrolls)
 *   note?: {text, on?, line?}  callout chip under an output line (line = 1-based index in the last command's output;
 *                              default = the last landed warn → accent → non-dim line)
 *   copy?: boolean | number    « copier » button + « copié ✓ » chip (default true, on the last command; number = index)
 *   copy_on?: string           spoken word for the copy click
 *   tab?: string               tab name in the title bar (default "toi@serveur: ~"),  shell?: string (default "bash")
 * }
 */

type Tone = "dim" | "ok" | "warn" | "accent" | "default";
type OutLine = { text: string; tone: Tone; on?: string };
type Cmd = { command: string; on?: string; enter_on?: string; output: OutLine[] };

const W = 870; // window width (left 70 → right edge 940: clear of Instagram's icon column below y 1000)
const LEFT = 70;
const BAR = 66;
const PADX = 40;
const PAD_TOP = 30;
const CMD_GAP = 16;
const BLOCK_GAP = 26;
const PAD_BOTTOM = 34;
const MAX_H = 1000; // y 250 → 1250 (captions start at 1300)
const CY = 745;
const COPY = 64;

const TONE: Record<Tone, string> = { dim: B.text3, ok: B.ok, warn: B.amber, accent: B.cyan, default: "rgba(236,242,252,0.9)" };

const normLine = (l: unknown): OutLine | null => {
  if (typeof l === "string") return { text: l, tone: "default" };
  if (l && typeof l === "object" && typeof (l as { text?: unknown }).text === "string") {
    const o = l as { text: string; tone?: string; on?: string };
    const tone = (["dim", "ok", "warn", "accent"].includes(o.tone ?? "") ? o.tone : "default") as Tone;
    return { text: o.text.replace(/\t/g, "  "), tone, on: o.on };
  }
  return null;
};
const normCmds = (d: Record<string, unknown>): Cmd[] => {
  const raw = Array.isArray(d.commands) && d.commands.length ? (d.commands as Record<string, unknown>[]).slice(0, 2) : [d];
  return raw
    .map((c) => ({
      command: String(c?.command ?? "").replace(/^\s*\$\s*/, "").replace(/\s+/g, " ").trim(),
      on: typeof c?.on === "string" ? c.on : undefined,
      enter_on: typeof c?.enter_on === "string" ? c.enter_on : undefined,
      output: (Array.isArray(c?.output) ? c.output : []).map(normLine).filter((x): x is OutLine => !!x).slice(0, 8),
    }))
    .filter((c) => c.command.length > 0 || c.output.length > 0);
};

/** command → displayed lines (`\` continuation) + font size */
const layoutCmd = (cmd: string, avail: number) => {
  let best = { lines: [cmd], font: 0 };
  for (let n = 1; n <= 3; n++) {
    const parts = n === 1 ? [cmd] : balancedSplit(cmd, n, (s) => s.length);
    if (parts.length < n) break;
    const disp = parts.map((p, i) => (i ? "  " : "") + p + (i < parts.length - 1 ? " \\" : ""));
    const chars = Math.max(...disp.map((s) => s.length)) + 2; // « $ »
    const font = Math.min(52, avail / (chars * MONO_ADV));
    if (font > best.font + (n > 1 ? 4 : 0)) best = { lines: disp, font }; // only wrap if it buys ≥ 4 px
    if (best.font >= 34) break;
  }
  return { lines: best.lines, font: Math.max(20, Math.floor(best.font)) };
};

/** wrap one output line into rows of ≤ cap chars (continuation rows indented) */
const wrapRows = (text: string, cap: number): string[] => {
  if (text.length <= cap) return [text];
  const rows: string[] = [];
  let rest = text;
  let first = true;
  while (rest.length && rows.length < 3) {
    const c = first ? cap : cap - 2;
    let cut = rest.length <= c ? rest.length : rest.lastIndexOf(" ", c);
    if (cut <= c * 0.5) cut = Math.min(rest.length, c);
    rows.push((first ? "" : "  ") + rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
    first = false;
  }
  return rows;
};

type RowL = { idx: number; rows: string[]; top: number; tone: Tone; t: number };
type Block = { top: number; bottom: number; lines: string[]; rows: RowL[]; ts: number; te: number; en: number; appear: number; total: number };

export const Terminal: Archetype = ({ spec }) => {
  const g = useGlobalFrame();
  const d = (spec.data ?? {}) as Record<string, unknown>;
  const cmds = normCmds(d);
  if (!cmds.length) cmds.push({ command: "echo bonjour", output: [] });
  const copyOn = d.copy !== false;
  const copyIdx = typeof d.copy === "number" ? clamp(Math.round(d.copy), 0, cmds.length - 1) : cmds.length - 1;
  const tab = String(d.tab ?? d.title ?? "toi@serveur: ~").slice(0, 34);
  const shell = String(d.shell ?? "bash").slice(0, 10);
  const from = spec.from;
  const to = spec.to;

  /* ── layout ── */
  const cmdAvail = W - 2 * PADX - (copyOn ? COPY + 14 : 0);
  const cl = cmds.map((c) => layoutCmd(c.command, cmdAvail));
  const cmdFont = Math.min(...cl.map((x) => x.font));
  const cmdLH = Math.round(cmdFont * 1.55);
  const maxLen = Math.max(1, ...cmds.flatMap((c) => c.output.map((l) => l.text.length)));
  const outFont = clamp(Math.floor((W - 2 * PADX) / (maxLen * MONO_ADV)), 18, 30);
  const cap = Math.floor((W - 2 * PADX) / (outFont * MONO_ADV));
  const rowH = Math.round(outFont * 1.72);
  const promptH = Math.max(rowH, 46);

  const blocks: Block[] = [];
  let y = PAD_TOP;
  cmds.forEach((c, ci) => {
    const top = y;
    y += cl[ci].lines.length * cmdLH;
    const bottom = y;
    const rows: RowL[] = [];
    if (c.output.length) y += CMD_GAP;
    c.output.forEach((l, k) => {
      const rs = wrapRows(l.text, cap);
      rows.push({ idx: k, rows: rs, top: y, tone: l.tone, t: 0 });
      y += rs.length * rowH;
    });
    blocks.push({ top, bottom, lines: cl[ci].lines, rows, ts: 0, te: 0, en: 0, appear: 0, total: cl[ci].lines.join("").length });
    if (ci < cmds.length - 1) y += BLOCK_GAP;
  });
  const promptTop = y + 8;
  const contentEnd = promptTop + promptH + PAD_BOTTOM;

  /* ── timing (every beat on a spoken word; fallbacks stay inside the scene) ── */
  const [sp0] = speechSpan(spec);
  let cursorT = from + 10;
  const lastOK = to - 8;
  cmds.forEach((c, ci) => {
    const b = blocks[ci];
    b.appear = ci === 0 ? from : cursorT - 10;
    const onF = onWord(spec, c.on);
    const want = onF !== undefined ? onF - 2 : ci === 0 ? Math.max(cursorT, Math.min(sp0, from + 30)) : cursorT;
    const ts = Math.min(lastOK - 40, Math.max(want, cursorT));
    const te = ts + clamp(Math.round(c.command.length * 2.6), 16, 80);
    const lineOn = c.output.map((l) => onWord(spec, l.on));
    const firstOn = lineOn.reduce<number | undefined>((m, f) => (f === undefined ? m : m === undefined ? f : Math.min(m, f)), undefined);
    const enterOn = onWord(spec, c.enter_on);
    let en = enterOn ?? (onF !== undefined ? clamp(phraseEndAt(spec, onF) ?? te + 10, te + 8, te + 48) : te + 10);
    if (enterOn === undefined && firstOn !== undefined) en = Math.min(en, firstOn - 4);
    en = Math.min(lastOK - 6, Math.max(en, te + 4));
    let prev = en;
    b.rows.forEach((r, k) => {
      const f = lineOn[k];
      let t = f !== undefined ? Math.max(f - 2, prev + 5, en + 3) : Math.max(prev + (k === 0 ? 3 : 6), en + 3);
      t = Math.min(t, lastOK - (b.rows.length - 1 - k) * 3);
      r.t = t;
      prev = t;
    });
    b.ts = ts;
    b.te = te;
    b.en = en;
    cursorT = prev + 16;
  });
  const last = blocks[blocks.length - 1];
  const lastLineT = last.rows.length ? last.rows[last.rows.length - 1].t : last.en;
  const promptT = Math.min(lastOK, lastLineT + 10);
  const allRows = blocks.flatMap((b) => b.rows);

  // note
  const nd = d.note as { text?: unknown; on?: string; line?: number } | undefined;
  const note = nd && typeof nd === "object" && typeof nd.text === "string" && nd.text.trim() ? { text: nd.text.trim(), on: nd.on, line: nd.line } : null;
  let noteT = note ? (onWord(spec, note.on) ?? lastLineT + 20) - 2 : 0;
  noteT = clamp(noteT, from + 20, to - 24);
  let target: RowL | undefined;
  if (note && allRows.length) {
    if (typeof note.line === "number" && last.rows[note.line - 1]) target = last.rows[note.line - 1];
    else {
      const landed = allRows.filter((r) => r.t <= noteT + 1);
      const pool = [...(landed.length ? landed : allRows)].reverse();
      target = pool.find((r) => r.tone === "warn") ?? pool.find((r) => r.tone === "accent") ?? pool.find((r) => r.tone !== "dim") ?? pool[0];
    }
    if (target && target.t > noteT) noteT = Math.min(to - 12, target.t + 8);
  }
  const noteText = note?.text ?? "";
  const noteFont = clamp(Math.floor(((W - 2 * PADX - 90) / Math.max(1, interWidth(noteText, 34, -0.01))) * 34), 22, 34);
  const noteW = Math.min(W - 2 * PADX + 10, interWidth(noteText, noteFont, -0.01) + 80);
  const noteH = 68;
  const NOTE_GAP = 24; // the chip hangs under the window, linked to its line by an amber leader on the left

  // copy
  const cb = blocks[copyIdx];
  const copyWord = onWord(spec, typeof d.copy_on === "string" ? d.copy_on : undefined);
  const beatsAll = [...blocks.map((b) => b.en), ...allRows.map((r) => r.t), ...(note ? [noteT] : [])];
  const lastBeat = Math.max(...beatsAll);
  let copyT = copyWord !== undefined ? copyWord - 2 : cb.en - cb.te >= 24 ? cb.te + 8 : Math.min(to - 40, lastBeat + 22);
  copyT = clamp(copyT, cb.te + 2, to - 14);

  /* ── window growth + scroll (content bottom, eased per event) ── */
  const events: [number, number][] = [[from, blocks[0].bottom + PAD_BOTTOM]];
  blocks.forEach((b, ci) => {
    if (ci > 0) events.push([b.appear, b.bottom + PAD_BOTTOM]);
    b.rows.forEach((r) => events.push([r.t, r.top + r.rows.length * rowH + PAD_BOTTOM]));
  });
  events.push([promptT, contentEnd]);
  events.sort((a, b) => a[0] - b[0]);
  let run = 0;
  const ev = events.map(([t, b]) => {
    run = Math.max(run, b);
    return [t, run] as [number, number];
  });
  const finalBottom = run;
  let bottom = ev[0][1];
  for (let i = 1; i < ev.length; i++) bottom += (ev[i][1] - ev[i - 1][1]) * EO(lin(g, ev[i][0], ev[i][0] + 13));
  const viewMax = MAX_H - (note && allRows.length ? 82 : 0);
  const H = Math.min(viewMax, BAR + bottom);
  const scroll = Math.max(0, BAR + bottom - viewMax);
  const Hf = Math.min(MAX_H - (note && target ? NOTE_GAP + noteH : 0), BAR + finalBottom);
  const extra = note && target ? NOTE_GAP + noteH : 0;
  const T = clamp(CY - (Hf + extra) / 2, 250, 1250 - Hf - extra);
  const top = T + (Hf - H) * 0.42;
  // compact window (command only) is zoomed ×1.1 — it sits above y 1000 so it may use x 60–1020 — and settles to ×1 as it grows
  const H0 = BAR + ev[0][1];
  const growth = Hf > H0 + 1 ? clamp01((H - H0) / (Hf - H0)) : 1;
  let zoom = 1 + 0.1 * (1 - EO(growth));
  if (top + H * zoom > 990) zoom = Math.max(1, Math.min(zoom, (990 - top) / H));

  /* ── energy ── */
  const lineTs = allRows.map((r) => r.t);
  const ens = blocks.map((b) => b.en);
  const bp = beatPulse(g, 12);
  const hit = Math.min(1, 0.8 * kick(g, from + 1, 10) + 0.7 * kickAny(g, ens, 9) + 0.3 * kickAny(g, lineTs, 7) + 0.6 * kick(g, copyT, 10) + (note ? 0.5 * kick(g, noteT, 10) : 0));
  const flash = Math.min(1, 0.18 * bp + 0.75 * kick(g, from + 1, 8) + 0.5 * kickAny(g, ens, 8) + 0.22 * kickAny(g, lineTs, 6) + 0.45 * kick(g, copyT, 9));
  const shake = 0.7 * kickAny(g, ens, 4);
  const land = enter(g, from, 18, 56, 12);
  const ry = Math.sin((g - from) * 0.021) * 1.3;
  const rx = Math.cos((g - from) * 0.017) * 0.8;
  const sheen = g < from + 34 ? lin(g, from + 3, from + 32) : lin(g, copyT + 2, copyT + 30);
  const focus = note && target ? EO(lin(g, noteT, noteT + 12)) : 0;

  return (
    <Stage spec={spec} g={g} cy={CY} hit={hit} shake={shake} uid={`term-${spec.id}`}>
      {/* light pool on the floor under the window (depth) */}
      <div
        style={{
          position: "absolute",
          left: LEFT - 60,
          top: top + H * zoom - 40,
          width: W + 120,
          height: 200,
          borderRadius: "50%",
          background: `radial-gradient(50% 50% at 50% 50%, ${rgba(CYAN, 0.2 + 0.12 * bp + 0.2 * hit)} 0%, ${rgba(CYAN, 0.06)} 45%, rgba(34,211,238,0) 72%)`,
          opacity: clamp01((g - from) / 10),
        }}
      />
      <div style={{ position: "absolute", left: LEFT, top, width: W, height: H, ...land, transform: `${land.transform} scale(${zoom.toFixed(4)})`, transformOrigin: "100px 0px" }}>
        <div style={{ position: "absolute", inset: 0, transform: `perspective(2200px) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)` }}>
          <Shell w={W} h={H} flash={flash} sheen={sheen} lx={30 + 18 * Math.sin((g - from) * 0.015)} ly={6}>
            {/* content (scrolls when two long commands overflow) */}
            <div style={{ position: "absolute", left: 0, top: BAR - scroll, width: W, height: finalBottom + 40 }}>
              {blocks.map((b, ci) => {
                if (g < b.appear) return null;
                const typedN = Math.round(lin(g, b.ts, b.te, 0, b.total));
                const typing = g >= b.ts && g < b.te;
                const showCursor = g < b.en + 1;
                let curLine = b.lines.length - 1;
                for (let k = 0, acc = 0; k < b.lines.length; k++) {
                  acc += b.lines[k].length;
                  if (typedN < acc) {
                    curLine = k;
                    break;
                  }
                }
                let rem = typedN;
                const isCopy = copyOn && ci === copyIdx;
                const glint = isCopy ? lin(g, copyT, copyT + 20) : 0;
                const enterK = kick(g, b.en, 6);
                return (
                  <React.Fragment key={ci}>
                    {/* command */}
                    <div style={{ position: "absolute", left: PADX, top: b.top, opacity: clamp01((g - b.appear) / 6) }}>
                      {b.lines.map((ln, li) => {
                        const n = Math.max(0, Math.min(ln.length, rem));
                        rem -= ln.length;
                        if (li > 0 && n === 0 && curLine < li) return <div key={li} style={{ height: cmdLH }} />;
                        return (
                          <div key={li} style={{ ...monoStyle(cmdFont, 700), lineHeight: `${cmdLH}px`, height: cmdLH, color: B.white, transform: `translateX(${(enterK * 3).toFixed(2)}px)` }}>
                            <span style={{ color: li === 0 ? B.amber : "rgba(0,0,0,0)", textShadow: li === 0 ? `0 0 18px ${rgba(AMBER, 0.45 + 0.4 * enterK)}` : undefined }}>$</span>{" "}
                            <CmdText text={ln.slice(0, n)} />
                            {showCursor && li === curLine ? <Cursor g={g} typing={typing} size={cmdFont} /> : null}
                          </div>
                        );
                      })}
                    </div>
                    {/* glint across the command on the copy click (amber signal) */}
                    {glint > 0 && glint < 1 ? (
                      <div
                        style={{
                          position: "absolute",
                          left: PADX - 16,
                          top: b.top - 4,
                          width: W - 2 * PADX - COPY,
                          height: b.lines.length * cmdLH + 8,
                          borderRadius: 16,
                          mixBlendMode: "screen",
                          background: `linear-gradient(105deg, rgba(245,158,11,0) ${(glint * 130 - 22).toFixed(1)}%, rgba(255,200,110,0.34) ${(glint * 130 - 15).toFixed(1)}%, rgba(245,158,11,0) ${(glint * 130 - 8).toFixed(1)}%)`,
                        }}
                      />
                    ) : null}
                    {isCopy ? <CopyButton g={g} at={copyT} appear={b.appear} x={W - PADX - COPY + 6} y={b.top + (cmdLH - COPY) / 2} /> : null}
                    {/* output rows */}
                    {b.rows.map((r, k) => {
                      if (g < r.t) return null;
                      const p = EO(clamp01((g - r.t) / 9));
                      const isT = target === r;
                      const dimF = isT ? 1 : 1 - 0.35 * focus;
                      const scan = lin(g, r.t, r.t + 14);
                      const col = TONE[r.tone];
                      return (
                        <div key={k} style={{ position: "absolute", left: PADX - 14, top: r.top, width: W - 2 * PADX + 28, height: r.rows.length * rowH }}>
                          {isT ? (
                            <div
                              style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: `${(100 * focus).toFixed(1)}%`,
                                borderRadius: 10,
                                background: `linear-gradient(90deg, ${rgba(AMBER, 0.17)}, ${rgba(AMBER, 0.03)})`,
                                borderLeft: focus > 0.02 ? `3px solid ${B.amber}` : undefined,
                                boxShadow: `0 0 ${(26 * kick(g, noteT, 12)).toFixed(1)}px ${rgba(AMBER, 0.35)}`,
                              }}
                            />
                          ) : null}
                          {scan > 0 && scan < 1 ? (
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: 10,
                                background: `linear-gradient(90deg, rgba(34,211,238,0) ${(scan * 130 - 40).toFixed(1)}%, ${rgba(CYAN, 0.16)} ${(scan * 130 - 15).toFixed(1)}%, rgba(34,211,238,0) ${(scan * 130).toFixed(1)}%)`,
                              }}
                            />
                          ) : null}
                          {r.rows.map((txt, j) => (
                            <div
                              key={j}
                              style={{
                                position: "absolute",
                                left: 14,
                                top: j * rowH,
                                ...monoStyle(outFont, r.tone === "dim" ? 500 : 600),
                                lineHeight: `${rowH}px`,
                                color: isT && focus > 0.5 && (r.tone === "default" || r.tone === "dim") ? B.white : col,
                                letterSpacing: r.tone === "dim" ? "0.02em" : undefined,
                                opacity: clamp01((g - r.t) / 4) * dimF,
                                transform: `translateY(${((1 - p) * 10).toFixed(1)}px)`,
                                filter: p < 0.95 ? `blur(${((1 - p) * 5).toFixed(2)}px)` : undefined,
                                textShadow:
                                  r.tone === "warn" ? `0 0 14px ${rgba(AMBER, 0.3)}` : r.tone === "ok" ? `0 0 14px ${rgba(OK, 0.3)}` : r.tone === "accent" ? `0 0 14px ${rgba(CYAN, 0.3)}` : undefined,
                              }}
                            >
                              {txt}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              {/* fresh prompt */}
              {g >= promptT ? (
                <div style={{ position: "absolute", left: PADX, top: promptTop, ...monoStyle(Math.min(cmdFont, 32), 700), lineHeight: `${promptH}px`, color: B.white, opacity: clamp01((g - promptT) / 4) * (1 - 0.5 * focus) }}>
                  <span style={{ color: B.amber }}>$</span>
                  <Cursor g={g} typing={false} size={Math.min(cmdFont, 32)} />
                </div>
              ) : null}
              {/* note callout chip, hanging under its line */}
            </div>
            <WinBar tab={tab} shell={shell} g={g} />
            {/* « copié ✓ » chip — rises out of the copy button into the title bar */}
            {copyOn && g >= copyT + 1 ? <CopiedChip g={g} at={copyT + 1} right={PADX - 10} top={7} /> : null}
          </Shell>
          {note && target && g >= noteT ? (
            <NoteChip g={g} at={noteT} text={noteText} font={noteFont} w={noteW} h={noteH} x={PADX - 10} y={H + NOTE_GAP} rowY={BAR - scroll + target.top + (target.rows.length * rowH) / 2} />
          ) : null}
        </div>
      </div>
    </Stage>
  );
};

/** command text: flags in pale cyan, the rest white */
const CmdText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\s+)/);
  return (
    <>
      {parts.map((p, i) => (
        <span key={i} style={{ color: /^--?[\w]/.test(p) ? "#A5F3FC" : p === "\\" || p === "|" || p === "&&" ? B.text3 : B.white }}>
          {p}
        </span>
      ))}
    </>
  );
};

/** title bar: three neutral dots, a tab (prompt glyph + name), shell name */
const WinBar: React.FC<{ tab: string; shell: string; g: number }> = ({ tab, shell, g }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: W, height: BAR, borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(6,12,28,0.35)" }}>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{ position: "absolute", left: 30 + i * 24, top: 26, width: 14, height: 14, borderRadius: 7, background: `rgba(255,255,255,${(0.22 - i * 0.05).toFixed(2)})` }} />
    ))}
    <div
      style={{
        position: "absolute",
        left: 116,
        top: 13,
        height: 53,
        padding: "0 22px 0 14px",
        borderRadius: "14px 14px 0 0",
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.035))",
        border: "1px solid rgba(255,255,255,0.1)",
        borderBottom: "none",
      }}
    >
      <PromptGlyph size={24} />
      <span style={{ ...monoStyle(20, 500), color: B.text2 }}>{tab}</span>
      <span style={{ position: "absolute", left: 14, right: 14, bottom: 0, height: 2, borderRadius: 1, background: rgba(CYAN, 0.55 + 0.25 * Math.sin(g * 0.08)) }} />
    </div>
    <div style={{ position: "absolute", right: 30, top: 0, lineHeight: `${BAR}px`, ...monoStyle(20, 500), color: B.text3 }}>{shell}</div>
  </div>
);

const CopyButton: React.FC<{ g: number; at: number; appear: number; x: number; y: number }> = ({ g, at, appear, x, y }) => {
  const done = g >= at;
  const press = kick(g, at, 5);
  const rip = EO(lin(g, at, at + 18));
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: COPY,
          height: COPY,
          borderRadius: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: done ? rgba(AMBER, 0.16) : "rgba(255,255,255,0.06)",
          border: `1px solid ${done ? rgba(AMBER, 0.6) : "rgba(255,255,255,0.14)"}`,
          transform: `scale(${(1 - 0.14 * press).toFixed(3)})`,
          boxShadow: done ? `0 0 ${(14 + 30 * kick(g, at, 10)).toFixed(1)}px ${rgba(AMBER, 0.4)}` : "none",
          opacity: clamp01((g - appear - 4) / 8),
        }}
      >
        {done ? <CheckGlyph size={30} color={B.amber} p={lin(g, at, at + 8)} stroke={3.6} /> : <CopyGlyph size={32} color={B.text2} />}
      </div>
      {g >= at && g < at + 18 ? (
        <div
          style={{
            position: "absolute",
            left: x + COPY / 2 - 55 * rip,
            top: y + COPY / 2 - 55 * rip,
            width: 110 * rip,
            height: 110 * rip,
            borderRadius: "50%",
            border: `2px solid ${rgba(AMBER, 0.7 * (1 - lin(g, at, at + 18)))}`,
          }}
        />
      ) : null}
    </>
  );
};

const CopiedChip: React.FC<{ g: number; at: number; right: number; top: number }> = ({ g, at, right, top }) => {
  const cp = pop(g, at, 12);
  const out = lin(g, at + 84, at + 96);
  if (out >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        right,
        top,
        height: 52,
        padding: "0 18px",
        borderRadius: 17,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(24,16,4,0.94)",
        border: `1.5px solid ${rgba(AMBER, 0.75)}`,
        boxShadow: `0 0 ${(16 + 30 * kick(g, at, 10)).toFixed(1)}px ${rgba(AMBER, 0.45)}, 0 8px 18px rgba(0,0,0,0.5)`,
        ...interStyle(27, 800),
        color: B.amber,
        letterSpacing: "-0.01em",
        transform: `translateY(${((1 - cp) * 56 - 10 * out).toFixed(1)}px) scale(${(0.5 + 0.5 * cp).toFixed(3)})`,
        transformOrigin: "80% 100%",
        opacity: clamp01((g - at) / 3) * (1 - out),
      }}
    >
      copié <CheckGlyph size={24} color={B.amber} stroke={3.8} p={lin(g, at + 3, at + 12)} />
    </div>
  );
};

const NoteChip: React.FC<{ g: number; at: number; text: string; font: number; w: number; h: number; x: number; y: number; rowY: number }> = ({ g, at, text, font, w, h, x, y, rowY }) => {
  const p = pop(g, at + 6, 13);
  const pulse = 0.5 + 0.5 * Math.sin((g - at) * 0.16);
  // amber leader: from the line's left edge, out along the window's left side, down into the chip
  const lx = -24;
  const cy = y + h / 2;
  const seg1 = 24 - lx;
  const seg2 = Math.max(0, cy - rowY);
  const seg3 = x - lx;
  const total = seg1 + seg2 + seg3;
  const drawn = total * EO(lin(g, at, at + 14));
  return (
    <>
    <svg width={x + 10 - lx} height={cy - rowY + 20} style={{ position: "absolute", left: lx - 10, top: rowY - 10, overflow: "visible" }}>
      <path
        d={`M ${24 - lx + 10} 10 L 10 10 L 10 ${seg2 + 10} L ${seg3 + 10} ${seg2 + 10}`}
        stroke={B.amber}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${drawn.toFixed(1)} ${total + 40}`}
        style={{ filter: `drop-shadow(0 0 6px ${rgba(AMBER, 0.7)})` }}
      />
      <circle cx={24 - lx + 10} cy={10} r={5 * clamp01((g - at) / 4)} fill={B.amber} />
    </svg>
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        transform: `translateY(${((1 - p) * 14).toFixed(1)}px) scale(${(0.82 + 0.18 * p).toFixed(3)})`,
        transformOrigin: "0% 50%",
        opacity: clamp01((g - at - 6) / 4),
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 22px 0 18px",
          background: "rgba(24,16,4,0.94)",
          border: `1.5px solid ${rgba(AMBER, 0.7)}`,
          boxShadow: `0 0 ${(18 + 26 * kick(g, at, 12)).toFixed(1)}px ${rgba(AMBER, 0.35)}, 0 10px 24px rgba(0,0,0,0.5)`,
        }}
      >
        <span style={{ width: 12, height: 12, borderRadius: 6, flex: "none", background: B.amber, boxShadow: `0 0 ${(6 + 10 * pulse).toFixed(1)}px ${rgba(AMBER, 0.8)}` }} />
        <span style={{ ...interStyle(font, 700), color: B.white, letterSpacing: "-0.01em" }}>{text}</span>
      </div>
    </div>
    </>
  );
};
