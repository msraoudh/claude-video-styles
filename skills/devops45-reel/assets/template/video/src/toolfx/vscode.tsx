import React from "react";
import { Logo } from "../kit/Logo";
import { fontInter, fontMono } from "../kit/fonts";
import { B, glass } from "../lib/look";
import { rand } from "../lib/sync";
import { AMBER, AnamorphicFlare, clamp01, CYAN, decay, EASE_OUT, iv, rgba } from "../archetypes/title/brand/fx";
import type { ToolFx } from "./types";

/**
 * VS Code — « Tu écris le code ».
 * 0     a glass editor window (real VS Code logo in the title bar, tab « app.js ») scales up.
 * 16    five lines of JavaScript type themselves in syntax colours behind an amber cursor; each finished line gets a
 *       little cyan lightning bolt + sparks, the last one (« app.listen(3000); ») an amber bolt + lens flare (≈ f0+85).
 * idle  the cursor drops to a new line and blinks, then a comment types slowly; window floats, a light sweeps the glass.
 */
type Tok = [string, string];
const K = { kw: "#93C5FD", v: "#E6EEF9", fn: "#22D3EE", s: "#86EFAC", n: "#FDE68A", p: "rgba(226,236,250,0.62)", c: "rgba(148,190,255,0.6)" };
const CODE: Tok[][] = [
  [["const ", K.kw], ["app", K.v], [" = ", K.p], ["express", K.fn], ["();", K.p]],
  [["app", K.v], [".", K.p], ["get", K.fn], ["(", K.p], ['"/"', K.s], [", (", K.p], ["req", K.v], [", ", K.p], ["res", K.v], [") => {", K.p]],
  [["  res", K.v], [".", K.p], ["send", K.fn], ["(", K.p], ['"Hello DevOps"', K.s], [");", K.p]],
  [["});", K.p]],
  [["app", K.v], [".", K.p], ["listen", K.fn], ["(", K.p], ["3000", K.n], [");", K.p]],
];
const IDLE: Tok[] = [["// prêt pour le déploiement", K.c]];
const len = (l: Tok[]) => l.reduce((a, [s]) => a + s.length, 0);

// layout (760 design box)
const WX = 40;
const WY = 130;
const WW = 680;
const TB = 76; // title bar
const AB = 58; // activity bar
const FS = 28;
const CW = FS * 0.6; // JetBrains Mono advance
const LH = 52;
const CX = 124; // code x inside window
const CY = TB + 26; // first line top inside window
const SB = 38; // status bar
const WH = CY + 6 * LH + 22 + SB;

// typing schedule (frames after f0)
const T0 = 16;
const RATE = 1.8;
const PAUSE = 4;
const SCHED = (() => {
  let t = T0;
  return CODE.map((l) => {
    const n = len(l);
    const s = t;
    const e = t + n / RATE;
    t = e + PAUSE;
    return { s, e, n };
  });
})();
const LAST = SCHED[SCHED.length - 1];
const ENTER = LAST.e + 12; // cursor drops to the new line
const TI = 118; // idle line starts typing
const IRATE = 0.22;

const renderLine = (toks: Tok[], k: number) => {
  let left = k;
  return toks.map(([s, c], j) => {
    if (left <= 0) return null;
    const part = s.slice(0, left);
    left -= s.length;
    return (
      <span key={j} style={{ color: c, fontStyle: c === K.c ? "italic" : undefined }}>
        {part}
      </span>
    );
  });
};

const BOLT = "14,0 2,20 11,20 8,36 22,13 13,13 16,0";

export const VSCodeFx: ToolFx = ({ g, f0, size }) => {
  const t = g - f0;

  // window entrance (scale-up with a small overshoot)
  const op = iv(t, [0, 10], [0, 1]);
  const sc = t < 14 ? iv(t, [0, 14], [0.78, 1.035], EASE_OUT) : iv(t, [14, 24], [1.035, 1], EASE_OUT);
  const bob = Math.sin(t * 0.045) * 5;
  const tilt = Math.sin(t * 0.03) * 2.2;

  // typed state
  const typed = SCHED.map(({ s, n }) => Math.floor(clamp01((t - s) / (n / RATE)) * n));
  const idleN = Math.floor(Math.max(0, Math.min(len(IDLE), (t - TI) * IRATE)));
  let curLine = 0;
  SCHED.forEach(({ s }, i) => {
    if (t >= s) curLine = i;
  });
  let curCol = typed[curLine];
  if (t >= ENTER) {
    curLine = 5;
    curCol = idleN;
  }
  const typingFast = SCHED.some(({ s, e }) => t >= s - 1 && t <= e + 1);
  const sinceKey = t >= TI && idleN < len(IDLE) ? (t - TI) % (1 / IRATE) : 99;
  const blink = t % 34 < 20 ? 1 : 0.12;
  const curO = t < T0 - 6 ? 0 : typingFast || sinceKey < 3 ? 1 : blink;
  const lineCount = t >= ENTER ? 6 : SCHED.filter(({ s }) => t >= s).length;

  // completion accents
  const done = SCHED.map(({ e }) => t - e);
  const lastAge = done[done.length - 1];

  // light sweep across the glass (every 140 frames after the action)
  const sw = t > 30 ? ((t - 30) % 140) / 40 : 2;

  const codeX = WX + CX;
  const lineY = (i: number) => WY + CY + i * LH + LH / 2;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 760, transform: `scale(${(size / 760).toFixed(4)})`, transformOrigin: "0 0" }}>
      {/* back light */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 120,
          width: 640,
          height: 520,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${rgba(CYAN, 0.16 + 0.12 * decay(lastAge, 20))}, rgba(0,0,0,0))`,
          filter: "blur(30px)",
          opacity: op,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: WX,
          top: WY,
          width: WW,
          height: WH,
          opacity: op,
          transform: `translateY(${bob.toFixed(2)}px) perspective(2000px) rotateY(${tilt.toFixed(2)}deg) rotateX(${(1.5 - tilt * 0.4).toFixed(2)}deg) scale(${sc.toFixed(4)})`,
          filter: op < 0.98 ? `blur(${((1 - op) * 10).toFixed(2)}px)` : undefined,
        }}
      >
        <div style={{ position: "absolute", inset: 0, ...glass("34,211,238", 1 + 0.6 * decay(lastAge, 18)), borderRadius: 28, overflow: "hidden" }}>
          {/* dark editor body for legibility */}
          <div style={{ position: "absolute", left: 0, top: TB, right: 0, bottom: 0, background: "rgba(5,10,24,0.72)" }} />
          {/* activity bar */}
          <div style={{ position: "absolute", left: 0, top: TB, width: AB, bottom: SB, background: "rgba(255,255,255,0.025)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            {[0, 1, 2, 3].map((k) => (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: 17,
                  top: 22 + k * 52,
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  border: `2.5px solid ${k === 0 ? rgba(CYAN, 0.75) : "rgba(226,236,250,0.22)"}`,
                }}
              />
            ))}
            <div style={{ position: "absolute", left: 0, top: 18, width: 3, height: 32, background: B.cyan, borderRadius: 2 }} />
          </div>
          {/* title bar */}
          <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: TB, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            {[0, 1, 2].map((k) => (
              <div key={k} style={{ position: "absolute", left: 22 + k * 22, top: TB / 2 - 7, width: 14, height: 14, borderRadius: 7, background: "rgba(226,236,250,0.2)" }} />
            ))}
            <div style={{ position: "absolute", left: 96, top: (TB - 54) / 2 }}>
              <Logo name="vscode" size={54} draw={iv(t, [2, 18], [0, 1], EASE_OUT)} glow={0.25 + 0.4 * decay(lastAge, 16)} />
            </div>
            {/* tab app.js */}
            <div
              style={{
                position: "absolute",
                left: 168,
                top: 14,
                height: TB - 14,
                width: 190,
                borderRadius: "14px 14px 0 0",
                background: "rgba(5,10,24,0.72)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderBottom: "none",
                display: "flex",
                alignItems: "center",
                gap: 12,
                paddingLeft: 18,
                boxSizing: "border-box",
              }}
            >
              <span style={{ fontFamily: fontMono, fontWeight: 700, fontSize: 17, color: "#FDE68A", background: "rgba(253,230,138,0.12)", borderRadius: 5, padding: "2px 6px" }}>JS</span>
              <span style={{ fontFamily: fontInter, fontWeight: 600, fontSize: 23, color: B.white }}>app.js</span>
              <span style={{ fontFamily: fontInter, fontWeight: 500, fontSize: 22, color: B.text3, marginLeft: 6 }}>×</span>
              <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 3, background: B.cyan, borderRadius: 2, boxShadow: `0 0 12px ${B.cyanGlow}` }} />
            </div>
          </div>
          {/* current-line highlight */}
          <div
            style={{
              position: "absolute",
              left: AB,
              right: 0,
              top: CY + curLine * LH,
              height: LH,
              background: "rgba(148,190,255,0.06)",
              borderTop: "1px solid rgba(148,190,255,0.06)",
              borderBottom: "1px solid rgba(148,190,255,0.06)",
              opacity: t >= T0 ? 1 : 0,
            }}
          />
          {/* completion flash on each line */}
          {done.map((a, i) =>
            a >= 0 && a < 30 ? (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: AB,
                  right: 0,
                  top: CY + i * LH,
                  height: LH,
                  background: `linear-gradient(90deg, ${rgba(i === 4 ? AMBER : CYAN, 0.2 * decay(a, 8))}, rgba(0,0,0,0) 80%)`,
                }}
              />
            ) : null,
          )}
          {/* gutter numbers */}
          {Array.from({ length: lineCount }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: AB,
                width: 46,
                top: CY + i * LH,
                height: LH,
                lineHeight: `${LH}px`,
                textAlign: "right",
                fontFamily: fontMono,
                fontWeight: 500,
                fontSize: 22,
                color: i === curLine ? "rgba(226,236,250,0.8)" : "rgba(226,236,250,0.28)",
              }}
            >
              {i + 1}
            </div>
          ))}
          {/* code */}
          {CODE.map((l, i) => (
            <div key={i} style={{ position: "absolute", left: CX, top: CY + i * LH, height: LH, lineHeight: `${LH}px`, fontFamily: fontMono, fontWeight: 500, fontSize: FS, whiteSpace: "pre" }}>
              {renderLine(l, typed[i])}
            </div>
          ))}
          <div style={{ position: "absolute", left: CX, top: CY + 5 * LH, height: LH, lineHeight: `${LH}px`, fontFamily: fontMono, fontWeight: 500, fontSize: FS, whiteSpace: "pre" }}>
            {renderLine(IDLE, idleN)}
          </div>
          {/* cursor */}
          <div
            style={{
              position: "absolute",
              left: CX + curCol * CW + 1,
              top: CY + curLine * LH + 9,
              width: 3.5,
              height: LH - 18,
              borderRadius: 2,
              background: B.amber,
              boxShadow: `0 0 12px ${B.amberGlow}`,
              opacity: curO,
            }}
          />
          {/* status bar */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: SB,
              background: `linear-gradient(90deg, ${rgba(CYAN, 0.32 + 0.3 * decay(lastAge, 14))}, ${rgba(CYAN, 0.14)})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
              boxSizing: "border-box",
              fontFamily: fontMono,
              fontWeight: 500,
              fontSize: 17,
              color: "rgba(240,250,255,0.9)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: 5, background: lastAge >= 0 ? B.ok : "rgba(240,250,255,0.6)", display: "inline-block" }} />
              main
            </span>
            <span>
              Ln {curLine + 1}, Col {curCol + 1} · JavaScript
            </span>
          </div>
          {/* light sweep */}
          {sw < 1.2 ? (
            <div
              style={{
                position: "absolute",
                top: -40,
                bottom: -40,
                width: 120,
                left: -160 + sw * (WW + 220),
                transform: "skewX(-18deg)",
                background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.07), rgba(255,255,255,0))",
              }}
            />
          ) : null}
        </div>
      </div>

      {/* lightning bolts + sparks at each line end */}
      {done.map((a, i) => {
        if (a < 0 || a > 26) return null;
        const last = i === CODE.length - 1;
        const col = last ? AMBER : CYAN;
        const x = codeX + SCHED[i].n * CW + 34;
        const y = lineY(i) + bob;
        const s = (last ? 1.6 : 1.1) * (a < 6 ? iv(a, [0, 6], [0.3, 1.25], EASE_OUT) : iv(a, [6, 14], [1.25, 1]));
        const o = iv(a, [0, 2, 16, 26], [0, 1, 1, 0]);
        return (
          <React.Fragment key={i}>
            <svg
              width={24}
              height={36}
              viewBox="0 0 24 36"
              style={{ position: "absolute", left: x - 12, top: y - 18, transform: `scale(${s.toFixed(3)}) rotate(${(8 - a * 0.3).toFixed(1)}deg)`, opacity: o, filter: `drop-shadow(0 0 8px ${rgba(col, 0.9)})`, overflow: "visible" }}
            >
              <polygon points={BOLT} fill={rgba(col, 1)} stroke="rgba(255,255,255,0.85)" strokeWidth={1.2} strokeLinejoin="round" />
            </svg>
            {Array.from({ length: last ? 12 : 7 }).map((_, k) => {
              const ang = rand(i * 31 + k * 7) * Math.PI * 2;
              const d = (16 + (last ? 70 : 42) * rand(i * 17 + k * 3)) * EASE_OUT(clamp01(a / 20));
              const r = 2 + 2.5 * rand(i * 5 + k);
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: x + Math.cos(ang) * d - r,
                    top: y + Math.sin(ang) * d - r,
                    width: r * 2,
                    height: r * 2,
                    borderRadius: r,
                    background: k % 3 === 0 ? "#FFFFFF" : rgba(col, 1),
                    boxShadow: `0 0 8px ${rgba(col, 0.9)}`,
                    opacity: iv(a, [0, 2, 20], [0, 1, 0]),
                  }}
                />
              );
            })}
          </React.Fragment>
        );
      })}
      <AnamorphicFlare age={lastAge} x={codeX + LAST.n * CW + 34} y={lineY(4)} col={AMBER} dur={34} strength={0.75} size={120} streakH={90} />
    </div>
  );
};
