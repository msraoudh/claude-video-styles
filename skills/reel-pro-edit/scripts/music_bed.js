// usage: node music_bed.js music.json remap.json totalFrames out.sh   (then: bash out.sh)
// Builds the music bed for the CURRENT cut from one track:
//   - piece A starts at track time `startOffset` (cut time 0)
//   - optional `drop`: piece B is aligned so track time drop.track lands on drop.at (ORIGINAL-cut seconds);
//     A and B are crossfaded at `splice` (new-cut seconds) — put the splice inside a quiet/ambient part of the
//     track (music_analyze.py shows it), there the jump is inaudible. Without `drop`, A plays to the end.
//   - two gain curves, as keyframes [[origSec, gain], ...]: `clean` (the track) and `muffled` (low-passed copy,
//     for "stuck / struggle" sections). Times are remapped like sec() so removed frames are skipped.
// music.json example (reel #1):
// { "track": "analysis/music.mp3", "out": "public/audio/music-bed.wav", "startOffset": 10.907,
//   "drop": { "track": 54.84, "at": 43.933 }, "splice": 33.0, "fadeOut": 1.7,
//   "clean":   [[0,1],[11.97,1],[12.27,0],[35.84,0],[41.9,1],[42.2,1],[42.28,0],[43.913,0],[43.933,1]],
//   "muffled": [[11.97,0],[12.27,1],[22.4,1],[22.46,0],[23.54,0],[23.84,1],[35.84,1],[41.9,0]] }
const fs = require('fs');
const [, , cfgF, remF, totalArg, outSh] = process.argv;
const cfg = JSON.parse(fs.readFileSync(cfgF, 'utf8'));
const { removed } = JSON.parse(fs.readFileSync(remF, 'utf8'));
const total = +totalArg / 30;
const T = s => { const f = Math.round(s * 30); let r = 0; for (const [a, z] of removed) { if (f > z) r += z - a + 1; else if (f >= a) r += f - a; } return (f - r) / 30; };

// piecewise-linear ffmpeg expression from [[origSec, value], ...]
const curve = (keys, fadeOut) => {
  const k = keys.map(([t, v]) => [T(t), v]);
  for (let i = 1; i < k.length; i++) if (k[i][0] <= k[i - 1][0]) k[i][0] = k[i - 1][0] + 0.02;
  let e = `${k[0][1]}`;
  for (let i = 1; i < k.length; i++) {
    const d = k[i][1] - k[i - 1][1];
    if (d !== 0) e += `+(${d})*clip((t-${k[i - 1][0].toFixed(3)})/${(k[i][0] - k[i - 1][0]).toFixed(3)}\\,0\\,1)`;
  }
  if (fadeOut) e = `(${e})*(1-clip((t-${(total - fadeOut).toFixed(3)})/${fadeOut}\\,0\\,1))`;
  return e;
};
const CLEAN = curve(cfg.clean || [[0, 1]], cfg.fadeOut || 1.5);
const MUFF = curve(cfg.muffled || [[0, 0]], cfg.fadeOut || 1.5);

const offA = cfg.startOffset || 0;
let src;
if (cfg.drop) {
  const offB = cfg.drop.track - T(cfg.drop.at);
  const X = cfg.splice, xf = 0.6;
  if (X === undefined) throw new Error('drop needs a splice point (new-cut seconds inside a quiet part of the track)');
  src = `[0:a]atrim=${offA.toFixed(3)}:${(offA + X + xf / 2).toFixed(3)},asetpts=PTS-STARTPTS[a1];` +
    `[0:a]atrim=${(offB + X - xf / 2).toFixed(3)}:${(offB + total + 1).toFixed(3)},asetpts=PTS-STARTPTS[a2];` +
    `[a1][a2]acrossfade=d=${xf}:c1=qsin:c2=qsin,aresample=48000,asplit[a][b];`;
  console.log(`drop at ${T(cfg.drop.at).toFixed(3)} s (track ${cfg.drop.track}); piece A track ${offA}→${(offA + X).toFixed(2)}, piece B from ${(offB + X).toFixed(2)}; splice at ${X} s`);
} else {
  src = `[0:a]atrim=${offA.toFixed(3)}:${(offA + total + 1).toFixed(3)},asetpts=PTS-STARTPTS,aresample=48000,asplit[a][b];`;
}
const cmd = `ffmpeg -hide_banner -loglevel error -y -i "${cfg.track}" -filter_complex "${src}` +
  `[a]volume='${CLEAN}':eval=frame[raw];[b]lowpass=f=650,lowpass=f=650,volume=1.4,volume='${MUFF}':eval=frame[lp];[raw][lp]amix=inputs=2:normalize=0[out]" ` +
  `-map "[out]" -t ${total.toFixed(3)} -c:a pcm_s16le "${cfg.out}"\n`;
fs.writeFileSync(outSh, cmd);
console.log(`wrote ${outSh} (${total.toFixed(2)} s)`);
