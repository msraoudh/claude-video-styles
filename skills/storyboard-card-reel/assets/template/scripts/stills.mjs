// node scripts/stills.mjs out/qa 120 450 ...  -> one bundle, many stills at 0.4 scale
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [outDir, ...frames] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const comp = await selectComposition({ serveUrl, id: process.env.COMP || "Reel", inputProps: { sound: false, captions: true } });
for (const f of frames.map(Number)) {
  await renderStill({ serveUrl, composition: comp, frame: f, output: path.resolve(outDir, `f${String(f).padStart(5, "0")}.jpg`), imageFormat: "jpeg", scale: 0.4, inputProps: { sound: false, captions: true } });
  process.stdout.write(f + " ");
}
console.log("done");
