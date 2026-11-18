// usage: node glance_patch.js gaze.json cut.json remap.json frame-map.json [--side left|right] [--cover a-b ...] [--max-patch 16]
// Run on the FINAL plain cut (after build_cut.js). Finds the script glances still in it and patches the
// picture only (audio untouched): each glance frame shows the neighbouring clean frames of the same clip,
// played backwards, so the eyes stay on the lens while the mouth keeps moving.
// --cover a-b : ranges in ORIGINAL-cut seconds (remapped like sec()) that are hidden by a full-screen
//               cutaway graphic -> left alone. Glances longer than --max-patch frames are reported as
//               "COVER" candidates: they need a cutaway graphic, a reversed patch that long looks fake.
// Output: frame-map.json (output frame k shows input frame map[k]) for apply_frame_map.py.
const fs = require('fs');
const args = process.argv.slice(2);
const [gazeF, cutF, remF, outF] = args;
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const sideArg = opt('--side', 'left');
const MAX_PATCH = +opt('--max-patch', 16);
const covers = [];
args.forEach((a, i) => { if (a === '--cover') covers.push(args[i + 1].split('-').map(Number)); });
const g = JSON.parse(fs.readFileSync(gazeF, 'utf8'));
const cut = JSON.parse(fs.readFileSync(cutF, 'utf8'));
const { removed } = JSON.parse(fs.readFileSync(remF, 'utf8'));
const sec = s => { const f = Math.round(s * 30); let r = 0; for (const [a, z] of removed) { if (f > z) r += z - a + 1; else if (f >= a) r += f - a; } return f - r; };
const C = g.cols, ix = k => C.indexOf(k);
const look = r => {
  if (r[1] === null) return 0;
  return sideArg === 'left' ? (r[ix('eyeLookOutRight')] + r[ix('eyeLookInLeft')]) / 2 : (r[ix('eyeLookOutLeft')] + r[ix('eyeLookInRight')]) / 2;
};
const S = g.rows.map(look);
const flag = new Array(S.length).fill(false);
S.forEach((v, f) => {
  if (v > 0.4) {
    let a = f, z = f;
    while (a > 0 && S[a - 1] > 0.22) a--;
    while (z < S.length - 1 && S[z + 1] > 0.22) z++;
    for (let k = Math.max(0, a - 1); k <= Math.min(S.length - 1, z + 1); k++) flag[k] = true;
  }
});
for (const [a, b] of covers) for (let f = sec(a); f < sec(b); f++) flag[f] = false;

const map = Array.from({ length: cut.totalF }, (_, k) => k);
const patches = [];
for (const c of cut.clips) {
  const c0 = c.cutStartF, c1 = c.cutStartF + c.durF - 1;
  let f = c0;
  while (f <= c1) {
    if (!flag[f]) { f++; continue; }
    let z = f; while (z + 1 <= c1 && flag[z + 1]) z++;
    const len = z - f + 1, before = f - c0, after = c1 - z;
    let kind;
    if (len > MAX_PATCH) kind = 'COVER';
    else if (before >= len) { kind = 'before'; for (let k = 0; k < len; k++) map[f + k] = f - 1 - k; }
    else if (after >= len) { kind = 'after'; for (let k = 0; k < len; k++) map[z - k] = z + 1 + k; }
    else { kind = 'freeze'; const src = before > 0 ? f - 1 : z + 1; for (let k = f; k <= z; k++) map[k] = src; }
    patches.push({ a: f, z, kind, t: (f / 30).toFixed(2) });
    f = z + 1;
  }
}
fs.writeFileSync(outF, JSON.stringify(map));
console.log(`${patches.length} glances, ${patches.reduce((s, p) => s + p.z - p.a + 1, 0)} frames:`, patches.map(p => `${p.a}-${p.z}@${p.t}s ${p.kind}`).join(', '));
const cov = patches.filter(p => p.kind === 'COVER');
if (cov.length) console.log(`!! ${cov.length} glance(s) too long to patch — design a full-screen cutaway over them and re-run with --cover:`, cov.map(p => `${p.t}s (${p.z - p.a + 1} frames)`).join(', '));
