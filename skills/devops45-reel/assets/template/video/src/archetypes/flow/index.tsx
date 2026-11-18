import React from "react";
import { AbsoluteFill } from "remotion";
import type { Archetype } from "..";
import { B } from "../../lib/look";
import { beatsFor } from "../../lib/episode";
import { beatPulse, useGlobalFrame } from "../../lib/sync";
import {
  AMBER,
  clamp01,
  CYAN,
  EIO,
  EO,
  Eyebrow,
  fitWrap,
  frType,
  Grade,
  inter,
  kick,
  kickAny,
  lin,
  mix,
  mono,
  NodeGlyph,
  Particles,
  rgba,
  Shell,
  Shock,
  Streak,
  textW,
  World,
} from "./fx";

/**
 * archetype « flow » — an architecture / request path / pipeline diagram.
 *   data = { nodes: [{ label, sub?, icon?, on? }] (2–6), direction?: "down" | "right", packet?: boolean (default true),
 *            loop?: boolean, heading?: string }
 * Glass node chips on the lit corridor. All chips are laid out from the start as dim « ghosts » (the path is readable),
 * each one LIGHTS UP on its word: the link to it draws behind a travelling light packet that arrives exactly on the word
 * (beat − 2 frames), the chip turns amber (the node being talked about) and flashes, the previous one settles to cyan.
 * Drawn links keep a travelling light. After the last node: one light sweep along the whole path (or endless packets
 * with loop: true). down = vertical zig-zag chain (best in 9:16); right = rows of ≤ 3 tiles, snaking.
 */
type FlowNode = { label?: string; sub?: string; icon?: string; on?: string };
type FlowData = { nodes?: FlowNode[]; direction?: "down" | "right"; packet?: boolean; loop?: boolean; heading?: string };
type Rect = { x: number; y: number; w: number; h: number };

const CX = 524; // a hair left of centre (Instagram's right-hand icon column)
const BOTTOM = 1250; // hero zone ends above the caption band (1300)

type Layout = {
  mode: "down" | "right";
  rects: Rect[];
  k: number;
  fs: number;
  subFs: number;
  labels: string[][];
  top: number;
};

const layoutDown = (nodes: FlowNode[], top: number): Layout => {
  const n = nodes.length;
  const avail = BOTTOM - top;
  const k = Math.min(1.12, avail / (170 * n + 104 * Math.max(0, n - 1)));
  const ch = 170 * k;
  const gap = 104 * k;
  const zig = n >= 3 ? 30 * k : 0;
  const maxW = Math.min(760, 2 * (940 - CX - zig));
  const it = ch * 0.6;
  const pad = ch * 0.2;
  const textLeft = pad + it + pad * 0.9;
  const rightArea = 62 * k + pad;
  const textMax = maxW - textLeft - rightArea;
  const fs0 = Math.max(30, 58 * k);
  const subFs = Math.max(20, 26 * k);
  // one common label size (fits the longest label on one line)
  let fs = fs0;
  for (const nd of nodes) fs = Math.min(fs, fitWrap(nd.label ?? "", fs0, fs0 * 0.62, textMax, 1, 800, "inter", -0.03).size);
  let widest = 0;
  for (const nd of nodes) {
    widest = Math.max(widest, textW(nd.label ?? "", fs, 800, "inter", -0.03));
    if (nd.sub) widest = Math.max(widest, Math.min(textMax, textW(nd.sub, subFs, 500, "mono")));
  }
  const w = Math.max(Math.min(maxW, 660 * Math.min(1, k + 0.15)), Math.min(maxW, textLeft + widest + rightArea + 8));
  const total = n * ch + (n - 1) * gap;
  const y0 = top + (avail - total) / 2;
  const rects = nodes.map((_, i) => {
    const cx = CX + (i % 2 ? zig : -zig);
    return { x: cx - w / 2, y: y0 + i * (ch + gap), w, h: ch };
  });
  return { mode: "down", rects, k, fs, subFs, labels: nodes.map((nd) => [nd.label ?? ""]), top };
};

const layoutRight = (nodes: FlowNode[], top: number): Layout => {
  const n = nodes.length;
  const cols = n <= 3 ? n : Math.ceil(n / 2);
  const rows = n <= 3 ? 1 : 2;
  const gapX = cols >= 3 ? 56 : 90;
  const tw = Math.min(300, (860 - (cols - 1) * gapX) / cols);
  const k = tw / 300;
  const fs0 = Math.max(28, 42 * Math.min(1, k + 0.1));
  const subFs = Math.max(19, 23 * Math.min(1, k + 0.1));
  let fs = fs0;
  for (const nd of nodes) fs = Math.min(fs, fitWrap(nd.label ?? "", fs0, fs0 * 0.66, tw - 36, 2, 800, "inter", -0.03).size);
  const labels = nodes.map((nd) => fitWrap(nd.label ?? "", fs, fs, tw - 36, 2, 800, "inter", -0.03).lines);
  const maxLines = Math.max(1, ...labels.map((l) => l.length));
  const hasSub = nodes.some((nd) => nd.sub);
  const iconBox = 104 * Math.min(1, k + 0.1);
  const th = 34 + iconBox + 26 + maxLines * fs * 1.08 + (hasSub ? subFs * 1.5 + 8 : 0) + 34;
  const gapY = 120;
  const total = rows * th + (rows - 1) * gapY;
  const avail = BOTTOM - top;
  const y0 = top + Math.max(0, (avail - total) / 2);
  const cxr = 510;
  const left0 = cxr - (cols * tw + (cols - 1) * gapX) / 2;
  const rects = nodes.map((_, i) => {
    const r = Math.floor(i / cols);
    const c = r % 2 === 0 ? i % cols : cols - 1 - (i % cols);
    return { x: left0 + c * (tw + gapX), y: y0 + r * (th + gapY), w: tw, h: th };
  });
  return { mode: "right", rects, k, fs, subFs, labels, top };
};

/** edge-to-edge segment between two rects (vertical if they're stacked, horizontal if side by side) */
const linkEnds = (a: Rect, b: Rect) => {
  const acx = a.x + a.w / 2;
  const acy = a.y + a.h / 2;
  const bcx = b.x + b.w / 2;
  const bcy = b.y + b.h / 2;
  if (Math.abs(bcy - acy) > Math.abs(bcx - acx) * 0.6) {
    const down = bcy > acy;
    return { x1: acx, y1: down ? a.y + a.h - 4 : a.y + 4, x2: bcx, y2: down ? b.y + 4 : b.y + b.h - 4 };
  }
  const right = bcx > acx;
  return { x1: right ? a.x + a.w - 4 : a.x + 4, y1: acy, x2: right ? b.x + 4 : b.x + b.w - 4, y2: bcy };
};

/** a light packet: glow + white core + comet tail along (dx, dy) */
const Packet: React.FC<{ x: number; y: number; dx: number; dy: number; a?: number; tint?: string }> = ({ x, y, dx, dy, a = 1, tint = CYAN }) => {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return (
    <g opacity={a}>
      {Array.from({ length: 7 }, (_, j) => (
        <circle key={j} cx={x - ux * j * 13} cy={y - uy * j * 13} r={9 - j * 0.9} fill={rgba(tint, 0.6 * (1 - j / 7))} />
      ))}
      <circle cx={x} cy={y} r={40} fill="url(#flow-pk)" />
      <circle cx={x} cy={y} r={10} fill="rgb(245,253,255)" />
    </g>
  );
};

export const Flow: Archetype = ({ spec }) => {
  const g = useGlobalFrame();
  const d: FlowData = spec.data ?? {};
  const nodes: FlowNode[] = (Array.isArray(d.nodes) ? d.nodes : [])
    .filter((nd) => nd && String(nd.label ?? "").trim() !== "")
    .slice(0, 6)
    .map((nd) => ({ ...nd, label: frType(String(nd.label).trim()), sub: nd.sub ? frType(String(nd.sub)) : undefined }));
  const n = nodes.length;
  const t = g - spec.from;
  const dur = Math.max(1, spec.to - spec.from);
  const heading = d.heading ? frType(String(d.heading)) : "";
  const top = heading ? 330 : 250;
  const mode = d.direction === "right" ? "right" : "down";
  const L = n ? (mode === "right" ? layoutRight(nodes, top) : layoutDown(nodes, top)) : null;
  const beats = n ? beatsFor(spec, nodes, 8) : [];
  const packetOn = d.packet !== false;
  const last = beats[n - 1] ?? spec.from;

  // per-node light-up and « talked about » amounts
  const lit = beats.map((b) => clamp01((g - b) / 7));
  const active = beats.map((_, i) => (i < n - 1 ? lit[i] * (1 - lit[i + 1]) : lit[i]));
  // link i (into node i) travel window: arrives exactly on beat i
  const win = beats.map((b, i) => {
    if (i === 0) return [b, b];
    const gapF = b - beats[i - 1];
    const D = Math.max(10, Math.min(38, gapF * 0.75));
    return [Math.max(beats[i - 1] + 3, b - D), b];
  });

  // camera: slow push-in + drift, a 3 px kick on every arrival
  const push = 1 + 0.04 * EIO(clamp01(t / dur));
  const hit = kickAny(g, beats, 9);
  const shake = kickAny(g, beats, 4);
  const sx = shake * 3 * Math.sin(g * 2.3);
  const sy = shake * 3 * Math.cos(g * 1.7);
  const bp = beatPulse(g, 14);

  // live rects (each chip floats on its own)
  const rects: Rect[] = (L?.rects ?? []).map((r, i) => ({
    ...r,
    x: r.x + Math.sin(t * 0.021 + i * 1.7) * 4,
    y: r.y + Math.cos(t * 0.017 + i * 1.1) * 5,
  }));
  const ends = rects.slice(1).map((r, j) => linkEnds(rects[j], r));

  // after the last node: one sweep along the whole path, or endless packets (loop)
  const sweepAt = last + 10;
  const sweepDur = Math.max(18, 14 * (n - 1));
  const runs: number[] = [];
  if (n > 1) {
    if (d.loop) {
      const period = Math.max(sweepDur + 16, 46);
      for (let s = sweepAt; s < spec.to; s += period) runs.push(s);
    } else runs.push(sweepAt);
  }
  const pathPoint = (s: number) => {
    // s in [0, n-1] along the chain of links
    const j = Math.min(n - 2, Math.max(0, Math.floor(s)));
    const e = ends[j];
    const f = clamp01(s - j);
    return { x: mix(e.x1, e.x2, f), y: mix(e.y1, e.y2, f), dx: e.x2 - e.x1, dy: e.y2 - e.y1 };
  };

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <World g={g} t={t} hit={hit * 0.8} seed={2} />
      <AbsoluteFill style={{ transform: `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) scale(${push.toFixed(4)})`, transformOrigin: `${CX}px 760px` }}>
        {/* the light that follows the packet: lights the glass from behind (backdrop blur catches it) */}
        {(() => {
          if (!n) return null;
          const centre = (i: number) => ({ x: rects[i].x + rects[i].w / 2, y: rects[i].y + rects[i].h / 2 });
          let p = centre(0);
          let warmth = active[0] ?? 0;
          for (let i = 0; i < n; i++) if (g >= beats[i]) p = centre(i);
          for (let i = 1; i < n; i++) {
            const [a, b] = win[i];
            if (g > a && g < b) {
              const u = EIO(clamp01((g - a) / (b - a)));
              const c0 = centre(i - 1);
              const c1 = centre(i);
              p = { x: mix(c0.x, c1.x, u), y: mix(c0.y, c1.y, u) };
            }
          }
          warmth = Math.max(...active);
          const a0 = (0.2 + 0.1 * bp + 0.2 * hit) * clamp01(t / 12);
          return (
            <div
              style={{
                position: "absolute",
                left: p.x - 460,
                top: p.y - 300,
                width: 920,
                height: 600,
                borderRadius: "50%",
                background: `radial-gradient(closest-side, ${rgba(warmth > 0.5 ? AMBER : CYAN, a0)} 0%, ${rgba(CYAN, a0 * 0.35)} 50%, ${rgba(CYAN, 0)} 100%)`,
              }}
            />
          );
        })()}
        {/* links */}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <radialGradient id="flow-pk">
              <stop offset="0" stopColor="rgb(200,250,255)" stopOpacity={0.9} />
              <stop offset="0.35" stopColor={B.cyan} stopOpacity={0.45} />
              <stop offset="1" stopColor={B.cyan} stopOpacity={0} />
            </radialGradient>
            <filter id="flow-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={6} />
            </filter>
          </defs>
          {ends.map((e, j) => {
            const i = j + 1;
            const [a, b] = win[i];
            const u = b <= a ? (g >= b ? 1 : 0) : EIO(clamp01((g - a) / (b - a)));
            const hx = mix(e.x1, e.x2, u);
            const hy = mix(e.y1, e.y2, u);
            const appear = clamp01((t - 4 - j * 3) / 12);
            const len = Math.hypot(e.x2 - e.x1, e.y2 - e.y1);
            const arrived = g >= b;
            const glowA = 0.32 + 0.25 * bp + 0.4 * kick(g, b, 14);
            return (
              <g key={j}>
                {/* the path, readable from the start */}
                <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={`rgba(226,236,250,${(0.22 * appear).toFixed(3)})`} strokeWidth={3.5} strokeDasharray="1 11" strokeLinecap="round" />
                {u > 0 ? (
                  <>
                    <line x1={e.x1} y1={e.y1} x2={hx} y2={hy} stroke={B.cyan} strokeWidth={15} opacity={glowA} filter="url(#flow-glow)" strokeLinecap="round" />
                    <line x1={e.x1} y1={e.y1} x2={hx} y2={hy} stroke={B.cyan} strokeWidth={5} strokeLinecap="round" />
                  </>
                ) : null}
                {/* travelling light on a drawn link */}
                {arrived ? (
                  <line
                    x1={e.x1}
                    y1={e.y1}
                    x2={e.x2}
                    y2={e.y2}
                    stroke="rgba(214,252,255,0.95)"
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min(18, len * 0.2).toFixed(1)} ${Math.max(40, len * 0.45).toFixed(1)}`}
                    strokeDashoffset={(-(g - b) * 2.4).toFixed(1)}
                    opacity={0.5 + 0.3 * bp}
                  />
                ) : null}
                {u > 0 && u < 1 ? (
                  packetOn ? (
                    <Packet x={hx} y={hy} dx={e.x2 - e.x1} dy={e.y2 - e.y1} />
                  ) : (
                    <circle cx={hx} cy={hy} r={12} fill="url(#flow-pk)" />
                  )
                ) : null}
                {/* arrival ping on the receiving edge */}
                {g >= b && g < b + 20 ? (
                  <circle cx={e.x2} cy={e.y2} r={8 + 40 * EO(clamp01((g - b) / 20))} fill="none" stroke={rgba(AMBER, 0.85 * (1 - (g - b) / 20))} strokeWidth={3} />
                ) : null}
              </g>
            );
          })}
          {/* completion sweep / loop packets */}
          {runs.map((s0, r) => {
            const p = (g - s0) / sweepDur;
            if (p <= 0 || p >= 1) return null;
            const pt = pathPoint(EIO(p) * (n - 1));
            return <Packet key={r} x={pt.x} y={pt.y} dx={pt.dx} dy={pt.dy} a={d.loop ? 0.75 : 1} />;
          })}
        </svg>

        {heading && L ? (
          <div style={{ position: "absolute", left: Math.max(60, Math.min(...rects.map((r) => r.x))), top: top - 96 }}>
            <Eyebrow label={heading} p={clamp01((t - 2) / 10)} lead={<span style={{ width: 10, height: 10, borderRadius: 5, background: B.cyan, boxShadow: `0 0 12px ${B.cyanGlow}` }} />} />
          </div>
        ) : null}

        {/* nodes */}
        {L
          ? nodes.map((nd, i) => {
              const r = rects[i];
              const b = beats[i];
              const lt = lit[i];
              const ac = active[i];
              const flash = kick(g, b, 10);
              const near = clamp01((g - (b - 8)) / 8) * (1 - lt); // anticipation as the packet comes in
              const entry = clamp01((t - 2 - i * 4) / 14);
              const ep = EO(entry);
              const tint = ac > 0.5 ? AMBER : CYAN;
              const iconCol = lt > 0.5 ? B.white : "rgba(226,236,250,0.36)";
              const accent = ac > 0.5 ? B.amber : lt > 0.5 ? B.cyan : "rgba(226,236,250,0.36)";
              const scale = (0.94 + 0.06 * ep) * (1 + 0.035 * flash);
              const labelCol = `rgba(248,250,252,${mix(0.3, 1, Math.max(lt, near * 0.35)).toFixed(3)})`;
              const ringA = ac * (0.45 + 0.35 * bp);
              const down = L.mode === "down";
              const it = down ? r.h * 0.6 : 104 * Math.min(1, L.k + 0.1);
              const pad = down ? r.h * 0.2 : 34;
              const iconX = down ? pad : (r.w - it) / 2;
              const iconY = down ? (r.h - it) / 2 : 34;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: r.x,
                    top: r.y,
                    width: r.w,
                    height: r.h,
                    transform: `translateY(${((1 - ep) * 30).toFixed(1)}px) scale(${scale.toFixed(4)})`,
                    opacity: entry < 1 ? clamp01(entry * 1.8) : undefined,
                    filter: entry < 1 ? `blur(${(10 * (1 - ep)).toFixed(2)}px)` : undefined,
                  }}
                >
                  <Shell
                    w={r.w}
                    h={r.h}
                    radius={down ? Math.min(40, r.h * 0.3) : 34}
                    flash={flash}
                    tint={tint}
                    glow={0.25 + 0.75 * lt + 0.5 * ac * (0.7 + 0.5 * bp)}
                    rim={0.35 + 0.65 * lt}
                    sheen={lin(g, b + 2, b + 26)}
                    lx={24 + Math.sin(t * 0.02 + i) * 10}
                    ly={10}
                  >
                    {/* icon tile */}
                    <div
                      style={{
                        position: "absolute",
                        left: iconX,
                        top: iconY,
                        width: it,
                        height: it,
                        borderRadius: it * 0.3,
                        background: rgba(ac > 0.5 ? AMBER : CYAN, 0.06 + 0.08 * lt + 0.06 * ac),
                        border: `1px solid ${rgba(ac > 0.5 ? AMBER : CYAN, 0.18 + 0.2 * lt + 0.25 * ac)}`,
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), 0 0 ${(18 + 30 * flash).toFixed(1)}px ${rgba(ac > 0.5 ? AMBER : CYAN, 0.08 + 0.25 * lt * (0.5 + flash))}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <NodeGlyph name={nd.icon} label={nd.label} size={it * 0.6} color={iconCol} accent={accent} />
                    </div>
                    {down ? (
                      <>
                        <div
                          style={{
                            position: "absolute",
                            left: pad + it + pad * 0.9,
                            right: 62 * L.k + pad,
                            top: 0,
                            bottom: 0,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            gap: nd.sub ? 4 * L.k : 0,
                          }}
                        >
                          <div style={{ ...inter(L.fs, 800), letterSpacing: "-0.03em", lineHeight: 1.05, color: labelCol, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nd.label}</div>
                          {nd.sub ? (
                            <div style={{ ...mono(L.subFs, 500), lineHeight: 1.2, color: lt > 0.5 ? B.text2 : B.text3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nd.sub}</div>
                          ) : null}
                        </div>
                        <div style={{ position: "absolute", right: pad, top: 0, bottom: 0, display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ ...mono(Math.max(18, 24 * L.k), 700), color: ac > 0.5 ? B.amber : lt > 0.5 ? rgba(CYAN, 0.85) : B.text3 }}>{String(i + 1).padStart(2, "0")}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ position: "absolute", left: 16, right: 16, top: iconY + it + 24, textAlign: "center" }}>
                          {L.labels[i].map((ln, li) => (
                            <div key={li} style={{ ...inter(L.fs, 800), letterSpacing: "-0.03em", lineHeight: 1.08, color: labelCol, whiteSpace: "nowrap" }}>
                              {ln}
                            </div>
                          ))}
                          {nd.sub ? (
                            <div style={{ ...mono(L.subFs, 500), marginTop: 8, color: lt > 0.5 ? B.text2 : B.text3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nd.sub}</div>
                          ) : null}
                        </div>
                        <div style={{ position: "absolute", left: 20, top: 16, ...mono(20, 700), color: ac > 0.5 ? B.amber : lt > 0.5 ? rgba(CYAN, 0.85) : B.text3 }}>{String(i + 1).padStart(2, "0")}</div>
                      </>
                    )}
                  </Shell>
                  {/* amber frame + halo of the node being talked about */}
                  {ac > 0.01 ? (
                    <div style={{ position: "absolute", inset: 0, borderRadius: down ? Math.min(40, r.h * 0.3) : 34, border: `2px solid ${rgba(AMBER, 0.7 * ac)}`, boxShadow: `0 0 ${(36 + 24 * bp + 40 * flash).toFixed(1)}px ${rgba(AMBER, (0.22 + 0.12 * bp) * ac)}, inset 0 0 26px ${rgba(AMBER, 0.12 * ac)}`, pointerEvents: "none" }} />
                  ) : null}
                  {ac > 0.01 ? (
                    <div
                      style={{
                        position: "absolute",
                        left: iconX - 10,
                        top: iconY - 10,
                        width: it + 20,
                        height: it + 20,
                        borderRadius: (it + 20) * 0.32,
                        border: `2px solid ${rgba(AMBER, ringA)}`,
                        boxShadow: `0 0 ${(22 + 18 * bp).toFixed(1)}px ${rgba(AMBER, 0.35 * ac)}`,
                        pointerEvents: "none",
                      }}
                    />
                  ) : null}
                </div>
              );
            })
          : null}
        {L
          ? beats.map((b, i) => {
              const r = rects[i];
              const down = L.mode === "down";
              const it = down ? r.h * 0.6 : 104 * Math.min(1, L.k + 0.1);
              const cx = r.x + (down ? r.h * 0.2 + it / 2 : r.w / 2);
              const cy = r.y + (down ? r.h / 2 : 34 + it / 2);
              return <Shock key={i} g={g} at={b} x={cx} y={cy} r0={it * 0.5} r1={it * 1.9} dur={30} width={3} />;
            })
          : null}
        <Particles t={t} front />
      </AbsoluteFill>
      <Grade />
      {beats.length ? <Streak g={g} at={beats[0]} dir={1} /> : null}
      {n > 1 ? <Streak g={g} at={last} dir={-1} /> : null}
    </AbsoluteFill>
  );
};
