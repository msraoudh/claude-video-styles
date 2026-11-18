// QA: every logo of the library (kit/logos.ts) on the brand background — Studio composition « LogoSheet ».
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { B } from "../lib/look";
import { fontInter } from "./fonts";
import { Logo } from "./Logo";
import { LOGOS, type LogoKey } from "./logos";

export const LogoSheet: React.FC = () => {
  const f = useCurrentFrame();
  const keys = (Object.keys(LOGOS) as LogoKey[]).filter((k) => k !== "devops");
  return (
    <AbsoluteFill style={{ background: B.bg, alignItems: "center", paddingTop: 70, fontFamily: fontInter }}>
      <Logo name="devops" size={520} draw={Math.min(1, f / 40)} spin={Math.max(0, f - 40)} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "26px 18px", justifyContent: "center", width: 1000, marginTop: 40 }}>
        {keys.map((k) => (
          <div key={k} style={{ width: 112, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <Logo name={k} size={92} />
            <div style={{ color: "rgba(226,240,250,0.75)", fontSize: 15, fontWeight: 600, textAlign: "center" }}>{LOGOS[k].label}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
