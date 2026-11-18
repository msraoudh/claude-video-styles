import React from "react";
import { AbsoluteFill } from "remotion";
import { EPISODE, SCENES } from "../data/episode";
import { fontInter, fontMono } from "../kit/fonts";
import { Logo, logoKey } from "../kit/Logo";
import { B } from "../lib/look";

/**
 * Instagram cover (1 frame) — the episode's own title, big, with the real logos of the tools it shows (the user dropped
 * the « DevOps en 45 secondes » lockup from covers on 2026-10-22). Kicker chip, title (the part after « : » in cyan),
 * up to 6 logos, the handle. Everything sits inside the central 1080×1080 square (y 420–1500) so it survives the 1:1 and
 * 4:5 grid crops.
 */
const episodeLogos = (): string[] => {
  const out: string[] = [];
  const add = (v: unknown) => {
    const k = logoKey(v);
    if (k && k !== "devops" && !out.includes(k)) out.push(k);
  };
  const walk = (o: unknown) => {
    if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === "object") {
      for (const [key, v] of Object.entries(o)) {
        if (key === "icon" || key === "logo") add(v);
        else walk(v);
      }
    }
  };
  SCENES.forEach((s) => walk(s.data));
  return out.slice(0, 6);
};

export const Cover: React.FC = () => {
  const t = EPISODE.title as { kicker?: string; line?: string };
  const line = t.line ?? EPISODE.topic;
  const [head, tail] = line.includes(" : ") ? line.split(" : ", 2) : [line, ""];
  const logos = episodeLogos();
  const size = logos.length > 4 ? 124 : 150;
  return (
    <AbsoluteFill style={{ background: B.bg, fontFamily: fontInter }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 560,
          width: 900,
          height: 700,
          transform: "translateX(-50%)",
          background: "radial-gradient(50% 50% at 50% 50%, rgba(34,211,238,0.16), rgba(34,211,238,0) 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 420,
          left: 60,
          right: 60,
          height: 1080,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 64,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: fontMono,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: B.cyan,
            padding: "14px 30px",
            borderRadius: 999,
            border: "1px solid rgba(34,211,238,0.45)",
            background: "rgba(34,211,238,0.08)",
          }}
        >
          ÉP. {EPISODE.number} · {t.kicker ?? EPISODE.category}
        </div>
        <div style={{ fontSize: 112, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.04em", color: B.white }}>
          {head}
          {tail ? (
            <>
              <br />
              <span style={{ color: B.cyan }}>{tail}</span>
            </>
          ) : null}
        </div>
        {logos.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 30, maxWidth: 900 }}>
            {logos.map((k) => (
              <Logo key={k} name={k} size={size} glow={0.3} />
            ))}
          </div>
        ) : null}
        <div style={{ fontFamily: fontMono, fontSize: 28, color: B.text3, letterSpacing: "0.04em" }}>{EPISODE.handle}</div>
      </div>
    </AbsoluteFill>
  );
};
