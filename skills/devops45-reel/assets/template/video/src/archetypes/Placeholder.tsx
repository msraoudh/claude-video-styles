import React from "react";
import { AbsoluteFill } from "remotion";
import type { ArchetypeProps } from ".";
import { fontMono } from "../kit/fonts";
import { B, glass } from "../lib/look";

/** Shown for a scene type that has no component yet — never ships (qa.py fails on it). */
export const Placeholder: React.FC<ArchetypeProps> = ({ spec }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <div style={{ ...glass(), padding: "40px 56px", color: B.white, fontFamily: fontMono, fontSize: 44, textAlign: "center" }}>
      MISSING ARCHETYPE
      <div style={{ color: B.amber, marginTop: 16 }}>{spec.type}</div>
      <div style={{ color: B.text3, fontSize: 30, marginTop: 10 }}>{spec.id}</div>
    </div>
  </AbsoluteFill>
);
