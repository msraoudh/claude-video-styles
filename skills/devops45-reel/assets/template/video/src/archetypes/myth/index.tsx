import React from "react";
import { AbsoluteFill, interpolateColors } from "remotion";
import type { Archetype } from "..";
import type { SceneSpec } from "../../data/episode";
import { PHRASES } from "../../data/voice";
import { B } from "../../lib/look";
import { onWord, speechSpan } from "../../lib/episode";
import { beatPulse, useGlobalFrame } from "../../lib/sync";
import { CYAN, EIO, EO, fitBlock, fr, INTER, isCodeToken, kick, lin, MONO, norm, rand, rgba, Sparks, Stage, Streak, Tag, textW, useFontsReady, type Fit } from "./fx";

/**
 * archetype « myth » — a confident wrong idea gets struck and replaced by the fact (the brand intro's s5 wall).
 *   data = { myth: string (≤ 60), fact: string (≤ 60), on?: string, accent?: string }
 * 0     a wall of blurred grey jargon drifts; « MYTHE » tag + the myth condenses out of it word by word (white,
 *       big, confident) within 0.3 s of the cut.
 * on    (or the start of the 2nd phrase, else mid-speech): a 10-frame glitch, the strike draws line by line, the
 *       myth turns grey and ✕; it then glides up and shrinks, the wall dissolves (calm).
 * +12   the fact rises in its place, « EN VRAI » tag, cyan check with a bloom on its last word; the code-like token
 *       (« 0.0.0.0 ») or `accent` glows cyan in mono.
 */
const X = 95;
const MK = 66;
const TX = X + MK + 26;
const MAXW = 925 - TX;
const GREY = "rgba(203,213,225,0.5)";

const JARGON = [
  "c'est sécurisé par défaut", "ça marche chez moi", "on verra en prod", "personne ne scanne mon serveur", "le cloud gère tout",
  "root c'est plus simple", "chmod 777 et ça passe", "les logs ça sert à rien", "un backup ? plus tard", "0.0.0.0 c'est local",
  "le pare-feu suffit", "latest c'est stable", "on n'a jamais eu de panne", "le monitoring c'est pour les grosses boîtes",
  "le mot de passe est dans le README", "Docker = une VM", "Kubernetes pour un blog", "on testera après", "ssh root@prod",
  "c'était déjà comme ça", "ça a toujours marché", "pas besoin de doc",
];

const phraseStart = (spec: SceneSpec, n: number) => {
  const id = spec.phrases[n];
  const p = id ? PHRASES.find((x) => x.id === id) : undefined;
  return p && p.words.length ? p.words[0].f : undefined;
};

/** the jargon wall: two blurred mono layers drifting up, dissolving word by word between a and b */
const Wall: React.FC<{ g: number; from: number; a: number; b: number; myth: string }> = ({ g, from, a, b, myth }) => {
  const layer = (size: number, lh: number, alpha: number, speed: number, seed: number, blur: number) => {
    const y0 = -80 - (g - from) * speed;
    const n = Math.ceil(2100 / lh) + 3;
    return (
      <AbsoluteFill style={{ filter: `blur(${blur.toFixed(2)}px)` }}>
        {Array.from({ length: n }, (_, i) => {
          const t1 = i % 5 === 2 ? myth : JARGON[(i * 7 + seed * 3) % JARGON.length];
          const t2 = JARGON[(i * 3 + seed * 5 + 4) % JARGON.length];
          const words = `${t1}  ·  ${t2}  ·  ${JARGON[(i * 11 + seed) % JARGON.length]}`.split(" ").filter(Boolean);
          return (
            <div key={i} style={{ position: "absolute", left: -40 - rand(i * 7.1 + seed) * 260, top: y0 + i * lh, whiteSpace: "nowrap", fontFamily: MONO, fontWeight: 500, fontSize: size, lineHeight: `${lh}px`, color: `rgba(203,213,225,${alpha})` }}>
              {words.map((w, j) => {
                const td = a + rand(i * 13.7 + j * 3.1 + seed * 50) * Math.max(10, b - a - 24);
                const q = EO(lin(g, td, td + 28));
                return (
                  <span key={j} style={{ display: "inline-block", marginRight: "0.6em", opacity: 1 - q, transform: q > 0 ? `translate(${((rand(i * 3 + j * 7) - 0.5) * 60 * q).toFixed(1)}px, ${(-26 * q).toFixed(1)}px)` : undefined }}>
                    {w}
                  </span>
                );
              })}
            </div>
          );
        })}
      </AbsoluteFill>
    );
  };
  const pull = 1 - EO(lin(g, from, from + 36));
  const mask = "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, #000 12%, #000 22%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.45) 56%, #000 64%, rgba(0,0,0,0.25) 68%, rgba(0,0,0,0.25) 82%, #000 88%, rgba(0,0,0,0.6) 100%)";
  return (
    <AbsoluteFill style={{ WebkitMaskImage: mask, maskImage: mask, transform: `scale(${(1 + 0.06 * pull).toFixed(4)})` }}>
      {layer(24, 42, 0.22, 0.11, 2, 5.5 + 9 * pull)}
      {layer(33, 60, 0.3, 0.2, 1, 2.4 + 8 * pull)}
    </AbsoluteFill>
  );
};

type Tok = { w: string; code: boolean; li: number; k: number };
const tokens = (fit: Fit): Tok[] => {
  const out: Tok[] = [];
  let k = 0;
  fit.lines.forEach((l, li) => l.split(/ +/).filter(Boolean).forEach((w) => out.push({ w, code: isCodeToken(w), li, k: k++ })));
  return out;
};

/** a block of words; each word condenses out of the wall (scattered, blurred, grey → sharp) from its own frame */
const Block: React.FC<{ g: number; fit: Fit; at: number; stagger: number; color: (t: Tok) => string; glow?: (t: Tok) => string | undefined; seed: number; rise?: boolean }> = ({ g, fit, at, stagger, color, glow, seed, rise }) => {
  const toks = tokens(fit);
  return (
    <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: fit.size, lineHeight: 1.1, letterSpacing: "-0.035em", whiteSpace: "nowrap", textShadow: "0 4px 24px rgba(0,0,0,0.6)" }}>
      {fit.lines.map((_, li) => (
        <div key={li}>
          {toks
            .filter((t) => t.li === li)
            .map((t) => {
              const p = EO(lin(g, at + t.k * stagger - 2, at + t.k * stagger + 18));
              const dx = rise ? 0 : (rand(seed * 3.3 + t.k * 1.7) - 0.5) * 240;
              const dy = rise ? 44 : (rand(seed * 5.9 + t.k * 2.3) - 0.5) * 160 - 30;
              const gl = glow ? glow(t) : undefined;
              return (
                <span
                  key={t.k}
                  style={{
                    display: "inline-block",
                    marginRight: "0.26em",
                    fontFamily: t.code ? MONO : INTER,
                    fontWeight: t.code ? 700 : 800,
                    fontSize: t.code ? fit.size * 0.88 : fit.size,
                    letterSpacing: t.code ? "-0.02em" : "-0.035em",
                    opacity: Math.min(1, p * 1.4),
                    transform: `translate(${(dx * (1 - p)).toFixed(1)}px, ${(dy * (1 - p)).toFixed(1)}px) scale(${(0.9 + 0.1 * p).toFixed(3)})`,
                    filter: p < 0.98 ? `blur(${((1 - p) * 12).toFixed(2)}px)` : undefined,
                    color: interpolateColors(p, [0, 1], ["rgba(203,213,225,0.4)", color(t)]),
                    textShadow: gl,
                  }}
                >
                  {t.w}
                </span>
              );
            })}
        </div>
      ))}
    </div>
  );
};

/** ring marker: empty → ✕ (grey) or → cyan disc + ink check */
const Marker: React.FC<{ g: number; kind: "x" | "check"; p: number; at: number; show: number }> = ({ g, kind, p, at, show }) => {
  const bloom = kind === "check" ? kick(g, at, 40) : 0;
  return (
    <div
      style={{
        position: "relative",
        width: MK,
        height: MK,
        borderRadius: MK / 2,
        border: `2.5px solid ${kind === "check" ? (p > 0 ? B.cyan : "rgba(34,211,238,0.45)") : p > 0 ? "rgba(203,213,225,0.35)" : "rgba(248,250,252,0.4)"}`,
        background: kind === "check" ? rgba(CYAN, 0.95 * p) : "transparent",
        boxShadow: kind === "check" && p > 0 ? `0 0 ${(14 + 44 * bloom).toFixed(1)}px ${rgba(CYAN, 0.35 + 0.4 * bloom)}` : "none",
        transform: `scale(${(0.6 + 0.4 * EO(show) + (kind === "check" ? 0.14 * bloom * Math.sin(Math.min(1, (g - at) / 14) * Math.PI) : 0)).toFixed(3)})`,
        opacity: EO(show),
      }}
    >
      <svg width={MK} height={MK} viewBox="0 0 58 58" style={{ position: "absolute", left: -2.5, top: -2.5 }}>
        {kind === "check" ? (
          <path d="M17 30 L26 39 L42 21" fill="none" stroke={B.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={44} strokeDashoffset={44 * (1 - p)} />
        ) : (
          <>
            <path d="M20 20 L38 38" fill="none" stroke="rgba(203,213,225,0.7)" strokeWidth={4} strokeLinecap="round" strokeDasharray={26} strokeDashoffset={26 * (1 - Math.min(1, p * 2))} />
            <path d="M38 20 L20 38" fill="none" stroke="rgba(203,213,225,0.7)" strokeWidth={4} strokeLinecap="round" strokeDasharray={26} strokeDashoffset={26 * (1 - Math.max(0, p * 2 - 1))} />
          </>
        )}
      </svg>
    </div>
  );
};

export const Myth: Archetype = ({ spec }) => {
  useFontsReady();
  const g = useGlobalFrame();
  const d = (spec.data ?? {}) as Record<string, unknown>;
  const myth = fr(d.myth) || "…";
  const fact = fr(d.fact);
  const accent = typeof d.accent === "string" ? norm(d.accent) : "";

  // ── timing ──
  const [s0, s1] = speechSpan(spec);
  const t0 = spec.from + 3;
  let S = (onWord(spec, typeof d.on === "string" ? d.on : undefined) ?? phraseStart(spec, 1) ?? Math.round(s0 + (s1 - s0) * 0.5)) - 2;
  S = Math.max(spec.from + 48, Math.min(S, spec.to - 80));
  const settleA = S + 3;
  const settleB = S + 26;
  const factAt = S + 10;

  // ── layout ──
  const mFit = fitBlock(myth, { maxW: MAXW * 0.96, maxLines: 3, max: 106, min: 50, family: INTER, weight: 800, ls: -0.035, lh: 1.1, balance: true });
  const fFit = fitBlock(fact || " ", { maxW: MAXW * 0.96, maxLines: 3, max: 92, min: 48, family: INTER, weight: 800, ls: -0.035, lh: 1.1, balance: true });
  const mTop0 = Math.max(380, 800 - mFit.height / 2);
  const SC = 0.62; // settled myth scale
  const mTop1 = 530;
  const settle = EO(lin(g, settleA, settleB));
  const mTop = mTop0 + (mTop1 - mTop0) * settle;
  const mSc = 1 - (1 - SC) * settle;
  const fTagY = mTop1 + mFit.height * SC + 96;
  let fTop = fTagY + 86;
  const fSc = fTop + fFit.height > 1258 ? Math.max(0.7, (1258 - fTop) / fFit.height) : 1;
  if (fSc < 1) fTop = Math.min(fTop, 1258 - fFit.height * fSc);

  // ── strike / glitch ──
  const glitch = g >= S - 2 && g < S + 10 ? 1 - (g - (S - 2)) / 12 : 0;
  const struck = (li: number) => EO(lin(g, S + 2 + li * 5, S + 16 + li * 5));
  const greyP = EO(lin(g, S + 4, S + 20));
  const mythCol = interpolateColors(greyP, [0, 1], [B.white, GREY]);
  const factToks = tokens(fFit);
  const lastFact = factToks.length ? factToks[factToks.length - 1].k : 0;
  const checkAt = factAt + lastFact * 4 + 10;
  const checkP = EO(lin(g, checkAt, checkAt + 18));
  const keyTok = (t: Tok) => (accent ? norm(t.w) === accent : t.code);
  const hasKey = factToks.some(keyTok);
  const bloom = kick(g, checkAt, 40);
  const calm = lin(g, S, S + 90, 0, 1, EIO);

  const jitter = glitch > 0 ? (rand(g * 1.7) - 0.5) * 26 * glitch : 0;
  // width of each myth line (words + code tokens as rendered)
  const mythLineW = mFit.lines.map((l) => Math.min(MAXW, approxLineW(l, mFit.size)));
  const mythBlock = (col: (t: Tok) => string, extra?: React.CSSProperties) => (
    <div style={{ position: "absolute", left: TX, top: 0, ...extra }}>
      <Block g={g} fit={mFit} at={t0} stagger={3} seed={1} color={col} />
      {/* strike lines */}
      {mFit.lines.map((_l, li) => {
        const st = struck(li);
        if (st <= 0) return null;
        const w = mythLineW[li];
        return (
          <div key={li} style={{ position: "absolute", left: -8, top: mFit.size * 1.1 * li + mFit.size * 0.6, height: Math.max(5, mFit.size * 0.07), width: (w + 16) * st, borderRadius: 4, background: "rgba(203,213,225,0.82)", boxShadow: "0 0 10px rgba(0,0,0,0.45)" }}>
            {st < 1 ? <div style={{ position: "absolute", right: -6, top: -5, width: 16, height: 16, borderRadius: 8, background: "rgb(220,250,255)", boxShadow: `0 0 18px 6px ${rgba(CYAN, 0.7)}` }} /> : null}
          </div>
        );
      })}
    </div>
  );
  return (
    <Stage
      g={g}
      from={spec.from}
      to={spec.to}
      hit={kick(g, S, 14) + 0.6 * kick(g, checkAt, 20)}
      shake={kick(g, S, 5) * 1.2}
      seed={7}
      calm={calm * 0.6}
      focusY={40}
      back={<Wall g={g} from={spec.from} a={S + 6} b={S + 96} myth={myth} />}
      over={
        <>
          <Streak g={g} at={factAt + 2} dir={1} k={0.75} />
          {glitch > 0 ? <AbsoluteFill style={{ background: `rgba(34,211,238,${(0.06 * glitch * (rand(g) > 0.5 ? 1 : 0.3)).toFixed(3)})`, mixBlendMode: "screen" }} /> : null}
        </>
      }
    >
      {/* scrim so the lines read over the wall */}
      <AbsoluteFill style={{ background: `radial-gradient(80% 26% at 50% ${((mTop + mFit.height / 2) / 19.2).toFixed(1)}%, rgba(4,7,15,0.7) 0%, rgba(4,7,15,0) 100%)`, opacity: 1 - 0.5 * calm }} />
      {/* ── the myth ── */}
      <div style={{ position: "absolute", left: 0, top: mTop, width: 1080, transform: `scale(${mSc.toFixed(4)}) translateX(${jitter.toFixed(1)}px)`, transformOrigin: `${X}px 0px` }}>
        <div style={{ position: "absolute", left: X, top: -84 }}>
          <Tag text="Mythe" p={lin(g, t0, t0 + 14)} tone={greyP > 0.5 ? "grey" : "warm"} size={22} />
        </div>
        <div style={{ position: "absolute", left: X, top: (mFit.size * 1.1 - MK) / 2 }}>
          <Marker g={g} kind="x" p={EO(lin(g, S + 2, S + 16))} at={S} show={lin(g, t0, t0 + 14)} />
        </div>
        {mythBlock(() => mythCol)}
        {/* glitch slices: offset copies in cyan / white, clipped to random bands */}
        {glitch > 0
          ? [0, 1, 2].map((k) => {
              const y1 = rand(g * 3.1 + k) * 80;
              const h = 6 + rand(g * 5.3 + k) * 22;
              return (
                <React.Fragment key={k}>
                  {mythBlock(() => (k === 1 ? "rgba(255,255,255,0.9)" : B.cyan), {
                    left: TX + (rand(g * 7.7 + k) - 0.5) * 70 * glitch,
                    clipPath: `inset(${y1.toFixed(1)}% 0 ${Math.max(0, 100 - y1 - h).toFixed(1)}% 0)`,
                    opacity: 0.8 * glitch,
                    mixBlendMode: "screen",
                  })}
                </React.Fragment>
              );
            })
          : null}
      </div>
      {/* ── the fact ── */}
      {fact && g >= factAt - 4 ? (
        <>
          <div style={{ position: "absolute", left: X, top: fTagY }}>
            <Tag text="En vrai" p={lin(g, factAt, factAt + 14)} tone="cyan" size={22} />
          </div>
          <div style={{ position: "absolute", left: 0, top: fTop, width: 1080, transform: `scale(${fSc.toFixed(3)}) translateY(${(Math.sin(g * 0.03) * 3).toFixed(2)}px)`, transformOrigin: `${X}px 0px` }}>
            <div style={{ position: "absolute", left: X, top: (fFit.size * 1.1 - MK) / 2 }}>
              <Marker g={g} kind="check" p={checkP} at={checkAt} show={lin(g, factAt, factAt + 12)} />
            </div>
            <div style={{ position: "absolute", left: TX, top: 0 }}>
              <Block
                g={g}
                fit={fFit}
                at={factAt}
                stagger={4}
                seed={2}
                rise
                color={(t) => ((hasKey ? keyTok(t) : t.k === lastFact) && g >= checkAt ? interpolateColors(checkP, [0, 1], [B.white, B.cyan]) : B.white)}
                glow={(t) => ((hasKey ? keyTok(t) : t.k === lastFact) && checkP > 0 ? `0 0 ${(20 + 34 * bloom + 10 * beatPulse(g, 16)).toFixed(1)}px ${rgba(CYAN, 0.4 * checkP)}` : undefined)}
              />
            </div>
          </div>
          <Sparks g={g} at={checkAt + 2} x={X + MK / 2} y={fTop + (fFit.size * 1.1) / 2 * fSc} r={120} n={12} seed={4} />
        </>
      ) : null}
    </Stage>
  );
};

/** rendered width of a myth line: code tokens are mono at .88 em, words Inter 800 */
function approxLineW(line: string, size: number) {
  const ws = line.split(/ +/).filter(Boolean);
  return ws.reduce((w, word, i) => w + (isCodeToken(word) ? textW(word, size * 0.88, MONO, 700, -0.02) : textW(word, size, INTER, 800, -0.035)) + (i < ws.length - 1 ? size * 0.26 : 0), 0);
}
