// usage: node glance_trims.js cut-v1.json gaze-v1.json voice-v1-16k.wav removed.json [--side left|right] [--write]
// Finds the moments the speaker looks away at a script (eye-gaze blendshapes from gaze.py, run on the
// v1 cut video) and decides, per glance:
//   - glance frames at a clip edge with no speech  -> REMOVED (appended to removed.json in v1 frames)
//   - glance frames that still carry speech         -> left for glance_patch.js (picture patch) later
// --side: which way the script screen is, seen from the CAMERA (image) side. "left" = the person looks to
// the left of the frame (that's eyeLookOutRight + eyeLookInLeft). the user's screen is top-left -> "left".
// Prints a report; without --write it only reports (look at the face crops before writing!).
const fs = require('fs');
const args = process.argv.slice(2);
const [cutF, gazeF, wavF, remF] = args;
const side = args.includes('--side') ? args[args.indexOf('--side') + 1] : 'left';
const write = args.includes('--write');
const cut = JSON.parse(fs.readFileSync(cutF, 'utf8'));
const g = JSON.parse(fs.readFileSync(gazeF, 'utf8'));
const b = fs.readFileSync(wavF), n = (b.length - 44) / 2;
const SEED = 0.4, GROW = 0.22, MARGIN = 1, SPEECH_DB = -42;
const C = g.cols, ix = k => C.indexOf(k);
const look = r => {
  if (r[1] === null) return 0;
  return side === 'left' ? (r[ix('eyeLookOutRight')] + r[ix('eyeLookInLeft')]) / 2 : (r[ix('eyeLookOutLeft')] + r[ix('eyeLookInRight')]) / 2;
};
const db = f => {
  const a = Math.floor(f * 16000 / 30), z = Math.min(n, Math.floor((f + 1) * 16000 / 30));
  let s = 0; for (let i = a; i < z; i++) { const v = b.readInt16LE(44 + i * 2) / 32768; s += v * v; }
  return 10 * Math.log10(s / Math.max(1, z - a) + 1e-12);
};
const speech = f => db(f) > SPEECH_DB;
const S = g.rows.map(look);
// hysteresis: seed above SEED, grow while above GROW
const flag = new Array(S.length).fill(false);
S.forEach((v, f) => {
  if (v > SEED) { let a = f, z = f; while (a > 0 && S[a - 1] > GROW) a--; while (z < S.length - 1 && S[z + 1] > GROW) z++; for (let k = a; k <= z; k++) flag[k] = true; }
});
const removed = fs.existsSync(remF) ? JSON.parse(fs.readFileSync(remF, 'utf8')).removed : [];
let trimmed = 0, patchLater = 0, events = 0;
for (const c of cut.clips) {
  const c0 = c.cutStartF, c1 = c.cutStartF + c.durF - 1;
  let f = c0;
  while (f <= c1) {
    if (!flag[f]) { f++; continue; }
    let a = Math.max(c0, f - MARGIN), z = f; while (z + 1 <= c1 && flag[z + 1]) z++;
    z = Math.min(c1, z + MARGIN); events++;
    const line = `glance ${a}-${z} (${((z - a + 1) / 30).toFixed(2)} s) in "${c.text.slice(0, 40)}" speech ${Array.from({ length: z - a + 1 }, (_, k) => (speech(a + k) ? '#' : '.')).join('')}`;
    if (z >= c1 - 1) { let k = c1; while (k >= a && !speech(k)) k--; if (k < c1) { removed.push([k + 1, c1]); trimmed += c1 - k; } z = k; }
    if (a <= c0 + 1) { let k = c0; while (k <= z && !speech(k)) k++; if (k > c0) { removed.push([c0, k - 1]); trimmed += k - c0; } a = k; }
    if (z >= a) patchLater += z - a + 1;
    console.log(line);
    f = Math.max(f + 1, z + 1 + MARGIN);
  }
}
removed.sort((p, q) => p[0] - q[0]);
const merged = []; for (const r of removed) { if (merged.length && r[0] <= merged.at(-1)[1] + 1) merged.at(-1)[1] = Math.max(merged.at(-1)[1], r[1]); else merged.push([...r]); }
console.log(`${events} glances: ${trimmed} silent frames to cut, ${patchLater} speech frames left for glance_patch.js`);
if (write) { fs.writeFileSync(remF, JSON.stringify({ removed: merged }, null, 1)); console.log('wrote', remF); }
else console.log('(dry run — add --write after checking the face crops)');
