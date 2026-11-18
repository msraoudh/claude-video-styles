import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { SILVER, gradText } from "./fx/fx";
import { BIG_FONT, CAP_FONT } from "./theme";

/** Instagram cover: red→black gradient, big metal word half behind his head, metal hook below. Text inside y 240–1680 (3:4 grid crop). */
const metal: React.CSSProperties = { ...gradText(SILVER), filter: "drop-shadow(0 6px 18px rgba(0,0,0,.7))" };
export const Cover: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, #8E0B18 0%, #4A0710 26%, #1A0508 52%, #070606 78%, #050405 100%)" }}>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 30% at 50% 18%, rgba(227,10,23,.45) 0%, rgba(227,10,23,0) 100%)" }} />
    {/* big word behind the head */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontFamily: BIG_FONT, fontSize: 228, lineHeight: 1, letterSpacing: 2, ...metal }}>CRÉATIVITÉ</div>
    <Img src={staticFile("cover/said.png")} style={{ position: "absolute", left: -40, top: 150, width: 1160, height: 2062, filter: "drop-shadow(0 0 40px rgba(0,0,0,.6))" }} />
    {/* fade the lower body into black for the text */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 1080, bottom: 0, background: "linear-gradient(180deg, rgba(5,4,5,0) 0%, rgba(5,4,5,.85) 32%, #050405 55%)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 1300, textAlign: "center", fontFamily: BIG_FONT, fontSize: 170, lineHeight: 1, letterSpacing: 2, ...metal }}>+ INTELLIGENCE</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1500, display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative", fontFamily: CAP_FONT, fontWeight: 900, fontSize: 66, letterSpacing: 1 }}>
        <span style={metal}>DON'T JUST LEARN AI</span>
        <div style={{ position: "absolute", left: "3%", right: "3%", bottom: -6, height: 9, borderRadius: 99, background: "#E30A17", boxShadow: "0 0 18px rgba(227,10,23,.6)" }} />
      </div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1610, textAlign: "center", fontFamily: CAP_FONT, fontWeight: 800, fontSize: 30, letterSpacing: 3, ...metal }}>@MS_YOURNAME</div>
  </AbsoluteFill>
);
