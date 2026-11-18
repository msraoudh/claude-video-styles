// usage: node regions.js vad.json mouth.json transcript.json regions.json [--mouth-thr 0.02]
// Speech regions for take selection: Silero VAD speech (hysteresis 0.5/0.35) where a weaker voice score (0.3)
// is enough when the lips are clearly moving; regions closer than 0.25 s are merged.
// Each region gets the words of the full transcript that fall in it. Next step: transcribe_regions.py
// (re-transcribes every region on its own for tight word timings), then YOU pick the best take of each line.
const fs = require('fs');
const args = process.argv.slice(2);
const [vadF, mouthF, trF, outF] = args;
const thr = args.includes('--mouth-thr') ? +args[args.indexOf('--mouth-thr') + 1] : 0.02;
const v = JSON.parse(fs.readFileSync(vadF));
const m = fs.existsSync(mouthF) ? JSON.parse(fs.readFileSync(mouthF)) : null;
const T = JSON.parse(fs.readFileSync(trF, 'utf8'));
const words = T.flatMap(s => s.words);
let lips = () => false;
if (m) {
  const R = m.rows, fps = m.fps, k = Math.round(0.33 * fps);
  const act = R.map((_, i) => { const w = R.slice(Math.max(0, i - k), i + k + 1).map(r => r[1]).filter(x => x !== null); return w.length < k ? null : Math.max(...w) - Math.min(...w); });
  lips = t => { const a = act[Math.round(t * fps)]; return a != null && a > thr; };
}
let regs = [], st = null;
v.probs.forEach((p, i) => {
  const t = i * v.step;
  if (st === null && (p > 0.5 || (p > 0.3 && lips(t)))) st = t;
  else if (st !== null && p < 0.35 && !(p > 0.15 && lips(t))) { regs.push([st, t]); st = null; }
});
if (st !== null) regs.push([st, v.probs.length * v.step]);
regs = regs.filter(([a, b]) => b - a >= 0.12);
const mg = []; for (const r of regs) { if (mg.length && r[0] - mg.at(-1)[1] < 0.25) mg.at(-1)[1] = r[1]; else mg.push([...r]); }
const out = mg.map(([a, b], i) => {
  const ws = words.filter(w => Math.min(w.e, w.s + 0.6) > a - 0.05 && w.s < b + 0.05);
  return { id: i, a: +a.toFixed(2), b: +b.toFixed(2), text: ws.map(w => w.w).join(' ') };
});
fs.writeFileSync(outF, JSON.stringify(out));
for (const r of out) console.log(String(r.id).padStart(3), r.a.toFixed(2).padStart(7), r.b.toFixed(2).padStart(7), (r.b - r.a).toFixed(2).padStart(5), '|', r.text);
