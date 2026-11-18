import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/**
 * NearMatch type system: Inter for every word, JetBrains Mono for digits only
 * (countdowns, the meeting code). Same font files as the app/brand kit.
 */
export const INTER = "Inter";
export const MONO = "JetBrains Mono";

const inter: Array<[string, string]> = [
  ["400", "Inter_400Regular.ttf"],
  ["500", "Inter_500Medium.ttf"],
  ["600", "Inter_600SemiBold.ttf"],
  ["700", "Inter_700Bold.ttf"],
  ["800", "Inter_800ExtraBold.ttf"],
];

for (const [weight, file] of inter) {
  loadFont({ family: INTER, url: staticFile(`fonts/${file}`), weight });
}
loadFont({
  family: MONO,
  url: staticFile("fonts/JetBrainsMono_500Medium.ttf"),
  weight: "500",
});
loadFont({
  family: MONO,
  url: staticFile("fonts/JetBrainsMono_700Bold.ttf"),
  weight: "700",
});

export const fontInter = `${INTER}, -apple-system, system-ui, sans-serif`;
export const fontMono = `"${MONO}", ui-monospace, monospace`;
