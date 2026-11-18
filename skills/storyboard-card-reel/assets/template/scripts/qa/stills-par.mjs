// QA stills without copying 4 GB of footage (disk is full): node out/qa/stills-par.mjs <outDir> <conc> frames...
// bundles into out/qa/bundle with a stub public dir, then hard-links the real footage into the bundle.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
const [outDir, conc, ...frames] = process.argv.slice(2);
const root = path.resolve(".");
const pub = path.join(root, "public");
const stub = path.join(root, "out/qa/stub");
const bdir = path.join(root, "out/qa/bundle");
const footage = fs.readFileSync(path.join(root, "src/parts/Footage.tsx"), "utf8").match(/"(footage\/[^"]+)"/g).map((s) => s.slice(1, -1));
let serveUrl = bdir;
if (!(process.env.REUSE && fs.existsSync(path.join(bdir, "index.html")))) {
  fs.rmSync(stub, { recursive: true, force: true });
  fs.rmSync(bdir, { recursive: true, force: true });
  for (const d of ["photos", "logos", "footage"]) fs.mkdirSync(path.join(stub, d), { recursive: true });
  for (const d of ["photos", "logos"]) for (const f of fs.readdirSync(path.join(pub, d))) fs.copyFileSync(path.join(pub, d, f), path.join(stub, d, f));
  for (const f of footage) fs.writeFileSync(path.join(stub, f), "");
  serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), outDir: bdir, publicDir: stub });
  for (const f of footage) {
    const dst = path.join(bdir, "public", f);
    fs.rmSync(dst, { force: true });
    fs.linkSync(path.join(pub, f), dst);
  }
}
const COMP = process.env.COMP || "Reel";
const inputProps = COMP === "Showcase" ? { sound: false } : { sound: false, captions: true };
const comp = await selectComposition({ serveUrl, id: COMP, inputProps });
fs.mkdirSync(outDir, { recursive: true });
// mode A: "every:N[:from:to]" â†’ one renderFrames call (one asset download); mode B: explicit frames (one renderStill each)
if (conc.startsWith("every")) {
  const [, n, a, b] = conc.split(":").map(Number);
  const { renderFrames } = await import("@remotion/renderer");
  const from = Number.isFinite(a) ? a : 0, to = Number.isFinite(b) ? b : comp.durationInFrames - 1;
  await renderFrames({ serveUrl, composition: comp, inputProps, outputDir: outDir, imageFormat: "jpeg", scale: 0.4, everyNthFrame: n, frameRange: [from, to], concurrency: 6,
    onStart: () => {}, onFrameUpdate: (done) => { if (done % 20 === 0) process.stdout.write(done + " "); },
    imageSequencePattern: "f[frame].[ext]" });
  console.log("done");
  process.exit(0);
}
const queue = frames.map(Number);
// run me with TEMP/TMP pointing at out/qa/tmp (see qa.sh): renderStill leaves ~550 MB asset copies in the temp dir on Windows,
// so this process only ever writes (and cleans) its own temp folder
const worker = async () => {
  const browser = await openBrowser("chrome");
  while (queue.length) {
    const f = queue.shift();
    await renderStill({ serveUrl, composition: comp, frame: f, output: path.resolve(outDir, `f${String(f).padStart(5, "0")}.jpg`), imageFormat: "jpeg", scale: 0.4, inputProps, puppeteerInstance: browser });
    process.stdout.write(f + " ");
  }
  await browser.close({ silent: true });
};
await Promise.all(Array.from({ length: Number(conc) }, worker));
console.log("done");

