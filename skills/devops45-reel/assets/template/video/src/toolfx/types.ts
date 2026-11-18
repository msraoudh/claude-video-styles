import type React from "react";
import type { LogoKey } from "../kit/logos";

/**
 * A tool animation (« Docker range l'appli dans une boîte » shown as an app packed into a container…).
 * Pure function of its props — NO useCurrentFrame / hooks with state: `g` is the GLOBAL frame.
 *   g      global frame now
 *   f0     frame the tool takes the stage (the `tool` archetype slides the whole stage in around f0 — don't animate an
 *          entrance from off-screen yourself; start your story at f0, main action done by ≈ f0 + 90)
 *   f1     frame it leaves (keep an idle loop going until then — never frozen)
 *   beats  extra spoken-word frames inside its time (may be empty): optional accents
 *   size   the square stage in px (≈ 760): draw everything inside [0, size]²
 *   logo   the tool's logo key (the CI animation serves githubactions / jenkins / gitlab)
 */
export type ToolFxProps = { g: number; f0: number; f1: number; beats: number[]; size: number; logo: LogoKey };
export type ToolFx = React.FC<ToolFxProps>;
