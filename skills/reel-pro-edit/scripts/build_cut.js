// usage: node build_cut.js cut-v1.json removed.json out-cut.json VIDEO_OFFSET_FRAMES [outDir]
// Rebuilds the cut from the reference (v1) clip list minus every removed range (v1 cut frames):
// script-glance trims, stutter removals, anything cut after the first pass. A removal inside a clip
// splits it (each part keeps `orig` = its v1 clip index and `part` = 0, 1, … so the camera framing can
// change on the new jump cut). removed.json may be {"removed": []} for the first build.
// VIDEO_OFFSET_FRAMES = camera-file frame shown at timeline 0 (VIDEO_START × 30).
// Writes <outDir>/cut-video.txt and cut-audio.txt (ffmpeg -/filter_complex graphs, see references/pipeline.md).
const fs = require('fs');
const path = require('path');
const [, , v1F, remF, outF, offArg, outDirArg] = process.argv;
if (offArg === undefined) throw new Error('missing VIDEO_OFFSET_FRAMES');
const VIDEO_OFFSET_F = +offArg;
const outDir = outDirArg || path.dirname(outF);
const v1 = JSON.parse(fs.readFileSync(v1F, 'utf8'));
const removed = JSON.parse(fs.readFileSync(remF, 'utf8')).removed.map(([a, z]) => [a, z]).sort((p, q) => p[0] - q[0]);
const FPS = 30;
const isRemoved = f => removed.some(([a, z]) => f >= a && f <= z);

const clips = [];
let pos = 0;
v1.clips.forEach((c, i) => {
  let part = 0, start = null;
  const flush = (endExcl) => {
    if (start === null) return;
    const durF = endExcl - start;
    if (durF >= 3) {
      clips.push({ text: c.text, orig: i, part, srcStartF: c.srcStartF + (start - c.cutStartF), srcEndF: c.srcStartF + (endExcl - c.cutStartF), cutStartF: pos, durF });
      pos += durF; part++;
    }
    start = null;
  };
  for (let f = c.cutStartF; f < c.cutStartF + c.durF; f++) {
    if (isRemoved(f)) flush(f);
    else if (start === null) start = f;
  }
  flush(c.cutStartF + c.durF);
});
fs.writeFileSync(outF, JSON.stringify({ fps: FPS, totalF: pos, clips }, null, 1));

// video: frame-exact select on the camera file; scaled to 1440x2560 so punch-ins stay sharp in a 1080x1920 comp
const sel = clips.map(c => `between(n,${c.srcStartF + VIDEO_OFFSET_F},${c.srcEndF + VIDEO_OFFSET_F - 1})`).join('+');
fs.writeFileSync(path.join(outDir, 'cut-video.txt'), `[0:v]select='${sel}',setpts=N/(30*TB),scale=1440:2560:flags=lanczos,format=yuv420p[v]`);
// audio: trims of voice-raw.wav (timeline audio) with 6–8 ms fades so no cut clicks
let a = '';
clips.forEach((c, i) => {
  const s = (c.srcStartF / FPS).toFixed(6), e = (c.srcEndF / FPS).toFixed(6), d = (c.durF / FPS - 0.008).toFixed(6);
  a += `[0:a]atrim=${s}:${e},asetpts=PTS-STARTPTS,afade=t=in:d=0.006,afade=t=out:st=${d}:d=0.008[c${i}];\n`;
});
a += clips.map((_, i) => `[c${i}]`).join('') + `concat=n=${clips.length}:v=0:a=1[a]`;
fs.writeFileSync(path.join(outDir, 'cut-audio.txt'), a);
console.log(`${clips.length} clips (${clips.filter(c => c.part > 0).length} split parts), ${pos} frames = ${(pos / FPS).toFixed(2)} s`);
