// usage: node make_v1.js edl-refined.json cut-v1.json
// Snaps every refined EDL clip to the 30 fps grid and lays them back to back.
// Frames are TIMELINE frames: timeline 0 = the first sample of voice-raw.wav (see references/pipeline.md).
// cut-v1.json is the reference cut: every later removal (glances, stutters) is expressed in its frames.
const fs = require('fs');
const [, , inF, outF] = process.argv;
const FPS = 30;
const clips = JSON.parse(fs.readFileSync(inF, 'utf8')).clips;
let pos = 0;
const out = clips.map(c => {
  // hard edges (inside connected speech) round to nearest; soft edges round outward so no consonant is lost
  const fa = c.hs ? Math.round(c.a * FPS) : Math.floor(c.a * FPS);
  const fb = c.he ? Math.round(c.b * FPS) : Math.ceil(c.b * FPS);
  const r = { text: c.text, srcStartF: fa, srcEndF: fb, cutStartF: pos, durF: fb - fa };
  pos += fb - fa;
  return r;
});
for (let i = 1; i < out.length; i++) if (out[i].srcStartF < out[i - 1].srcEndF) throw new Error('overlapping clips at ' + i + ': fix edl.json');
fs.writeFileSync(outF, JSON.stringify({ fps: FPS, totalF: pos, clips: out }, null, 1));
console.log(`clips ${out.length}, ${pos} frames = ${(pos / FPS).toFixed(2)} s`);
