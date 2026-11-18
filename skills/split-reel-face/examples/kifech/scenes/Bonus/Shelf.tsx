import type React from "react";
import { useCurrentFrame } from "remotion";
import { K, MONO, UI } from "../../edit/theme";
import { B, eio, eo, G, lerp } from "./beats";
import { FileIcon } from "./icons";

/**
 * The skills shelf (« الكل » → « كل مرة »): ~/.claude/skills/ with the user's REAL skills on two glass shelves.
 * Slot 1 is empty (dashed) until the new SKILL.md lands in it (Hero). On « كل » the three other tiles morph into
 * compact chips in a strip on top (the library stays in view while the skill runs), and leave for prompt 2.
 */

type Box = { x: number; y: number; w: number; h: number };
const TILES: { name: string; desc: string; tile: Box; chip: Box; at: number }[] = [
  { name: "devops45-reel", desc: "DevOps en 45 secondes", tile: { x: 510, y: 1094, w: 430, h: 140 }, chip: { x: 201, y: 1046, w: 180, h: 44 }, at: B.lkol + 3 },
  { name: "reel-pro-edit", desc: "face cam → reel pro", tile: { x: 60, y: 1254, w: 430, h: 140 }, chip: { x: 393, y: 1046, w: 180, h: 44 }, at: B.lkol + 6 },
  { name: "cinematic-motion-teaser", desc: "teasers cinématiques", tile: { x: 510, y: 1254, w: 430, h: 140 }, chip: { x: 585, y: 1046, w: 294, h: 44 }, at: B.lkol + 9 },
];

export const Shelf: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < B.lkol - 2) return null;
  const out = eo(frame, B.wtqollou - 4, 7); // chips leave for prompt 2
  if (out >= 1) return null;

  const railIn = eio(frame, B.lkol, 9);
  const railOut = eo(frame, B.kol, 7);
  const labelIn = eo(frame, B.lkol + 1, 7) * (1 - eo(frame, B.kol, 6));
  const landed = frame >= B.lkol + 12;
  const slotO = eo(frame, B.lkol + 2, 6) * (1 - eo(frame, B.lkol + 10, 4));

  return (
    <>
      {/* label */}
      <div style={{ position: "absolute", left: 60, right: 140, top: 1048, height: 34, display: "flex", alignItems: "center", gap: 14, opacity: labelIn, zIndex: 12, transform: `translateY(${(1 - labelIn) * 10}px)` }}>
        <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 21, color: K.muted }}>~/.claude/skills/</span>
        <span style={{ flex: 1, height: 1.5, background: `linear-gradient(90deg, ${K.stroke}, transparent)` }} />
        <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 21, color: K.coral }}>{landed ? 4 : 3} skills</span>
      </div>
      {/* two glass shelves */}
      {[1240, 1400].map((y, i) => (
        <div
          key={y}
          style={{
            position: "absolute",
            left: 48,
            top: y,
            width: 904,
            height: 8,
            borderRadius: 4,
            zIndex: 9,
            transformOrigin: "50% 50%",
            transform: `scaleX(${railIn})`,
            opacity: railIn * (1 - railOut),
            background: "linear-gradient(180deg, rgba(255,236,220,0.28), rgba(255,236,220,0.06))",
            boxShadow: `0 14px 26px rgba(0,0,0,0.6), 0 0 22px rgba(217,119,87,${i === 0 ? 0.25 : 0.12})`,
          }}
        />
      ))}
      {/* empty slot for the new skill */}
      {slotO > 0 ? (
        <div style={{ position: "absolute", left: G.tile1.x, top: G.tile1.y, width: G.tile1.w, height: G.tile1.h, borderRadius: 24, border: `2px dashed rgba(217,119,87,0.6)`, background: "rgba(217,119,87,0.06)", opacity: slotO, zIndex: 10 }} />
      ) : null}
      {TILES.map((t, i) => {
        const p = eo(frame, t.at, 7);
        if (p <= 0) return null;
        const m = eio(frame, B.kol + 1 + i * 1.5, 11);
        const b: Box = { x: lerp(t.tile.x, t.chip.x, m), y: lerp(t.tile.y, t.chip.y, m), w: lerp(t.tile.w, t.chip.w, m), h: lerp(t.tile.h, t.chip.h, m) };
        const ic = Math.max(0, 1 - m * 2.2);
        const fs = lerp(23, 19, m);
        const nx = lerp(92, 16, m);
        const ny = lerp(36, 9.5, m);
        return (
          <div
            key={t.name}
            style={{
              position: "absolute",
              left: b.x,
              top: b.y,
              width: b.w,
              height: b.h,
              zIndex: 11,
              borderRadius: lerp(24, 22, m),
              opacity: p * (1 - out),
              transform: `translateY(${(1 - p) * 16 - out * 14}px) scale(${0.94 + 0.06 * p})`,
              filter: p < 1 || out > 0 ? `blur(${(1 - p) * 6 + out * 6}px)` : undefined,
              background: `linear-gradient(150deg, rgba(255,236,220,0.085), rgba(255,236,220,0.02) 60%), rgba(36,26,21,0.78)`,
              border: `1.5px solid ${K.stroke}`,
              boxShadow: "0 18px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,236,220,0.18)",
              overflow: "hidden",
            }}
          >
            {ic > 0 ? (
              <div style={{ position: "absolute", left: 20, top: 42, width: 56, height: 56, borderRadius: 16, background: "rgba(255,236,220,0.06)", border: `1.5px solid ${K.stroke}`, display: "flex", alignItems: "center", justifyContent: "center", opacity: ic }}>
                <FileIcon size={24} color={K.muted} />
              </div>
            ) : null}
            <div style={{ position: "absolute", left: nx, top: ny, fontFamily: MONO, fontWeight: 700, fontSize: fs, color: m > 0.5 ? K.muted : K.cream, whiteSpace: "nowrap" }}>{t.name}</div>
            {ic > 0 ? <div style={{ position: "absolute", left: 92, top: 74, fontFamily: UI, fontWeight: 500, fontSize: 18, color: K.muted, whiteSpace: "nowrap", opacity: ic }}>{t.desc}</div> : null}
          </div>
        );
      })}
    </>
  );
};
