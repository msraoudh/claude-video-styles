// usage: node capcut_read.js "<CapCut project folder or name>"
// Reads a CapCut desktop project (draft_content.json, not encrypted in CapCut 5–7) and prints the source
// files and the sync the user set up: which part of the camera file and of the voice recording sit at
// timeline 0. Those numbers become VIDEO_START / AUDIO_START in the pipeline.
// Projects live in %LOCALAPPDATA%\CapCut\User Data\Projects\com.lveditor.draft\<name>.
const fs = require('fs');
const path = require('path');
let dir = process.argv[2];
const root = path.join(process.env.LOCALAPPDATA || '', 'CapCut', 'User Data', 'Projects', 'com.lveditor.draft');
if (!dir) {
  const list = fs.readdirSync(root).filter(n => fs.existsSync(path.join(root, n, 'draft_content.json')))
    .map(n => ({ n, t: fs.statSync(path.join(root, n, 'draft_content.json')).mtimeMs })).sort((a, b) => b.t - a.t);
  console.log('Most recent CapCut projects:'); list.slice(0, 8).forEach(p => console.log('  ' + p.n, new Date(p.t).toISOString()));
  process.exit(0);
}
if (!fs.existsSync(path.join(dir, 'draft_content.json'))) dir = path.join(root, dir);
const d = JSON.parse(fs.readFileSync(path.join(dir, 'draft_content.json'), 'utf8'));
const mats = {};
for (const [k, arr] of Object.entries(d.materials)) if (Array.isArray(arr)) for (const m of arr) if (m && m.id) mats[m.id] = { kind: k, ...m };
console.log(`project: ${dir}\ncanvas ${JSON.stringify(d.canvas_config)} fps ${d.fps} duration ${(d.duration / 1e6).toFixed(2)} s`);
for (const t of d.tracks) {
  for (const s of t.segments) {
    const m = mats[s.material_id] || {};
    console.log(`${t.type.padEnd(6)} ${m.path || m.name || s.material_id}\n        source starts at ${(s.source_timerange.start / 1e6).toFixed(6)} s, placed at timeline ${(s.target_timerange.start / 1e6).toFixed(6)} s, length ${(s.target_timerange.duration / 1e6).toFixed(3)} s, volume ${s.volume}`);
  }
}
console.log('\nIf a video and an audio segment both start at timeline 0: VIDEO_START = video source start, AUDIO_START = audio source start.');
console.log('If the camera audio is the voice (single file): AUDIO_START = VIDEO_START and the audio file = the video file.');
