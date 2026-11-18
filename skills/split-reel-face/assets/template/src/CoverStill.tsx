import type React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { COVER, PROJECT } from "./data/project";
import { Spark } from "./edit/kit";
import { AR, K, SERIF, UI } from "./edit/theme";

/**
 * Instagram cover (1080×1920), from COVER in src/data/project.ts. Everything that matters sits inside the 4:5
 * profile-grid crop (y 285–1635) and the face stays clear; warm dark + Claude coral like the reel.
 * The title follows the video's language (PROJECT.dir): Tunisian in Arabic letters with Latin tech words, or Latin.
 */
export const CoverStill: React.FC = () => {
  const rtl = PROJECT.dir === "rtl";
  const font = rtl ? AR : UI;
  return (
    <AbsoluteFill style={{ background: K.bg0 }}>
      {/* the user, looking straight at the camera (pick the frame on a sheet of candidates) */}
      <Img src={staticFile(COVER.face)} style={{ position: "absolute", left: 0, top: -40, width: 1080, height: 1920, objectFit: "cover", filter: "contrast(1.08) saturate(1.05) brightness(1.03) sepia(0.06)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(15,11,9,0.55) 0%, rgba(15,11,9,0) 14%, rgba(15,11,9,0) 50%, rgba(15,11,9,0.85) 60%, #0F0B09 72%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(70% 45% at 50% 36%, rgba(0,0,0,0) 55%, rgba(15,11,9,0.55) 100%)" }} />
      <div style={{ position: "absolute", left: -200, top: 1050, width: 1480, height: 900, background: "radial-gradient(closest-side, rgba(217,119,87,0.30), rgba(217,119,87,0) 100%)" }} />

      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 28px", borderRadius: 999, background: "rgba(15,11,9,0.62)", border: `1.5px solid ${K.stroke}`, fontFamily: UI, fontWeight: 800, fontSize: 30, letterSpacing: "0.16em", color: K.cream }}>
          <Spark size={30} /> {COVER.kicker}
        </div>
      </div>

      <div dir={PROJECT.dir} style={{ position: "absolute", left: 50, right: 50, top: 1090, textAlign: "center", color: K.cream, fontFamily: font, fontWeight: 900, textShadow: "0 10px 40px rgba(0,0,0,0.6)", letterSpacing: rtl ? undefined : "-0.035em" }}>
        <div style={{ fontSize: rtl ? 132 : 112, lineHeight: 1.12 }}>{COVER.line1}</div>
        <div style={{ fontSize: rtl ? 96 : 88, lineHeight: 1.2, whiteSpace: "nowrap" }}>
          {COVER.line2.map(([t, a], i) => (
            <span key={i} style={{ color: a ? K.coral : undefined }}>
              {t}
            </span>
          ))}
        </div>
        <div dir="ltr" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22, marginTop: 6 }}>
          {rtl ? <Spark size={84} glow={22} /> : null}
          {!rtl && COVER.brand.prefix ? <span style={{ fontFamily: UI, fontWeight: 900, fontSize: 96, lineHeight: 1, color: K.cream }}>{COVER.brand.prefix}</span> : null}
          <span style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 124, lineHeight: 1, color: K.coral, textShadow: `0 0 50px ${K.coralGlow}` }}>{COVER.brand.word}</span>
          {rtl && COVER.brand.prefix ? <span style={{ fontFamily: AR, fontWeight: 900, fontSize: 96, lineHeight: 1, color: K.cream }}>{COVER.brand.prefix}</span> : null}
          {!rtl ? <Spark size={84} glow={22} /> : null}
        </div>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 1500, display: "flex", justifyContent: "center", gap: 14 }}>
        {COVER.chips.map((t, i) => (
          <div key={t} style={{ padding: "12px 22px", borderRadius: 999, fontFamily: UI, fontWeight: 800, fontSize: 28, color: i === 0 ? "#1A0F0B" : K.cream, background: i === 0 ? `linear-gradient(180deg, ${K.coralLight}, ${K.coral})` : "rgba(255,236,220,0.08)", border: `1.5px solid ${i === 0 ? "rgba(255,220,200,0.6)" : K.stroke}` }}>
            {t}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
