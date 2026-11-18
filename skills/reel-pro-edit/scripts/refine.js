// usage: node refine.js voice-16k.wav edl.json out.json
// Snaps every clip to where the voice really starts/ends (energy > -50 dB), so the
// edit has zero pauses without clipping consonants. Hard edges ('hs'/'he') stay put.
const fs = require('fs');
const [, , wavF, edlF, outF] = process.argv;
const b = fs.readFileSync(wavF), SR = 16000, HDR = 44, W = 160; // 10 ms windows
const n = (b.length - HDR) / 2;
const db = t => {
  const i0 = Math.floor(t * SR); if (i0 < 0 || i0 + W > n) return -120;
  let s = 0; for (let j = 0; j < W; j++) { const v = b.readInt16LE(HDR + (i0 + j) * 2) / 32768; s += v * v; }
  return 10 * Math.log10(s / W + 1e-12);
};
const THR = -50, MAX_BACK = 0.3, MAX_FWD = 0.35, PRE = 0.04, POST = 0.07;
const edl = JSON.parse(fs.readFileSync(edlF, 'utf8'));
const clips = edl.clips.map(c => {
  let a = c.a, z = c.b;
  if (!c.hs) { let t = a; while (t > c.a - MAX_BACK && db(t - 0.01) > THR) t -= 0.01; a = t - PRE; }
  if (!c.he) { let t = z; while (t < c.b + MAX_FWD && db(t) > THR) t += 0.01; z = t + POST; }
  return { ...c, a: +a.toFixed(3), b: +z.toFixed(3) };
});
for (let i = 1; i < clips.length; i++) if (clips[i].a < clips[i - 1].b) clips[i].a = clips[i - 1].b;
fs.writeFileSync(outF, JSON.stringify({ clips }, null, 1));
const total = clips.reduce((s, c) => s + c.b - c.a, 0);
console.log(`clips ${clips.length}, total ${total.toFixed(2)} s`);
