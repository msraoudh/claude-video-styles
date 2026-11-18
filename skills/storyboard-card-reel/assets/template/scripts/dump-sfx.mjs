// Dump the exact SFX cue list (src, frame, vol) from src/cues.tsx + the voice timing used by the mixer.
// Bundles cues.tsx with esbuild for node and evaluates it (the cue elements are lazy functions, never rendered).
// Usage: node scripts/dump-sfx.mjs [out.json]   (default: out/sfx-cues.json)
import { build } from "esbuild";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = resolve(root, process.argv[2] ?? "out/sfx-cues.json");
const tmp = join(root, "out", `.dump-sfx-${process.pid}.mjs`);
mkdirSync(dirname(outFile), { recursive: true });

const entry = `
import { CUES } from "./src/cues";
import { at, end, DURATION, LINES } from "./src/lib/time";
export const data = {
  duration: DURATION,
  dont: { at: at("dont"), end: end("dont") },
  lines: LINES.map((l) => ({ id: l.id, s: l.s, e: l.e })),
  sfx: CUES.flatMap((c) => (c.sfx ?? []).map((s) => ({ src: s.src, at: s.at, vol: s.vol ?? 1 }))),
};`;

// Browser-only side effects (fonts, documents) are stubbed so the module graph evaluates in node.
globalThis.document ??= { fonts: { add() {}, ready: Promise.resolve() }, createElement: () => ({ style: {} }), head: { appendChild() {} } };
globalThis.window ??= globalThis;
globalThis.FontFace ??= class { load() { return Promise.resolve(this); } };

await build({
  stdin: { contents: entry, resolveDir: root, loader: "ts" },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: tmp,
  jsx: "automatic",
  loader: { ".png": "empty", ".jpg": "empty", ".svg": "empty", ".css": "empty" },
  logLevel: "error",
  banner: { js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);" },
});
try {
  const { data } = await import(pathToFileURL(tmp).href);
  writeFileSync(outFile, JSON.stringify(data, null, 1));
  console.log(`${data.sfx.length} sfx cues, duration ${data.duration} f, dont ${data.dont.at}-${data.dont.end} -> ${outFile}`);
} finally {
  rmSync(tmp, { force: true });
}
