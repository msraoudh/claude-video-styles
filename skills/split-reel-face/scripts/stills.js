// Render many stills with ONE browser (QA, no video render). Run from the Remotion project folder.
// usage: node stills-hook.js <bundleDir> <compId> <outDir> <frame,frame,...> [scale]
const P = require("path").join(process.cwd(), "node_modules", "@remotion", "renderer");
const { openBrowser, renderStill, selectComposition } = require(P);
const path = require("path");
(async () => {
  const [serveUrl, id, outDir, framesArg, scaleArg] = process.argv.slice(2);
  const frames = framesArg.split(",").map(Number);
  const scale = Number(scaleArg || 0.5);
  const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });
  const composition = await selectComposition({ serveUrl, id, puppeteerInstance: browser, logLevel: "error" });
  for (const fr of frames) {
    await renderStill({ composition, serveUrl, output: path.join(outDir, `f${String(fr).padStart(4, "0")}.jpg`), frame: fr, scale, imageFormat: "jpeg", jpegQuality: 85, puppeteerInstance: browser, logLevel: "error", chromiumOptions: { gl: "angle" } });
    process.stdout.write(fr + " ");
  }
  await browser.close({ silent: true });
  console.log("done");
})().catch((e) => { console.error(e); process.exit(1); });
