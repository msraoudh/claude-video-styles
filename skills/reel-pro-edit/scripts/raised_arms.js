// usage: node raised_arms.js pose.json cut.json armpit.json [--dx -55 --dy 115 --rx 165 --ry 195]
// Finds every moment an arm is raised (elbow at or above its shoulder, from pose.py) and writes a
// smoothed, faded blur track for <ArmpitBlur/> (camera-space px, 1080x1920).
// The armpit sits BELOW-INSIDE the shoulder landmark when the arm is up: the default offset was
// calibrated on reel #1 (left arm, image right). ALWAYS verify on a pixel-grid overlay before trusting it
// (see references/pipeline.md "Privacy blur") — different arm/side/framing needs a different offset.
const fs = require('fs');
const args = process.argv.slice(2);
const [poseF, cutF, outF] = args;
const opt = (k, d) => (args.includes(k) ? +args[args.indexOf(k) + 1] : d);
const DX = opt('--dx', -55), DY = opt('--dy', 115), RX = opt('--rx', 165), RY = opt('--ry', 195);
const P = JSON.parse(fs.readFileSync(poseF, 'utf8'));
const cut = JSON.parse(fs.readFileSync(cutF, 'utf8'));
const W = 1080, H = 1920, PAD = 8;
const clipOf = f => { let i = 0; while (i + 1 < cut.clips.length && cut.clips[i + 1].cutStartF <= f) i++; return i; };
const track = [];
for (const side of ['l', 'r']) {
  const up = P.map(p => !!p && p[side + 'S'][2] > 0.5 && p[side + 'E'][2] > 0.4 && p[side + 'E'][1] < p[side + 'S'][1] + 0.03);
  let ev = [], st = null;
  up.forEach((u, f) => { if (u && st === null) st = f; if (!u && st !== null) { ev.push([st, f - 1]); st = null; } });
  if (st !== null) ev.push([st, up.length - 1]);
  const m = []; for (const e of ev) { if (m.length && e[0] - m.at(-1)[1] <= 6) m.at(-1)[1] = e[1]; else m.push([...e]); }
  for (const [a, z] of m) {
    if (z - a < 3) continue;
    console.log(`arm ${side === 'l' ? "subject's LEFT (image right)" : "subject's RIGHT (image left)"} up: frames ${a}-${z} (${(a / 30).toFixed(2)}–${(z / 30).toFixed(2)} s) "${cut.clips[clipOf(a)].text.slice(0, 40)}"`);
    const A = Math.max(0, a - PAD), Z = Math.min(P.length - 1, z + PAD);
    const sgn = side === 'l' ? 1 : -1; // mirror the x offset for the other arm
    for (let f = A; f <= Z; f++) {
      let sx = 0, sy = 0, n = 0;
      for (let k = -3; k <= 3; k++) { const p = P[f + k]; if (p && p[side + 'S'][2] > 0.3) { sx += p[side + 'S'][0]; sy += p[side + 'S'][1]; n++; } }
      if (!n) continue;
      const fade = Math.max(0, Math.min(1, (f - A) / 5, (Z - f) / 5));
      track.push({ f, x: Math.round((sx / n) * W + sgn * DX), y: Math.round((sy / n) * H + DY), rx: RX, ry: RY, o: +fade.toFixed(2) });
    }
  }
}
track.sort((p, q) => p.f - q.f);
fs.writeFileSync(outF, JSON.stringify(track));
console.log(track.length ? `${track.length} blur frames written` : 'no raised arm found — write [] and skip the blur');
