// usage: node build_captions.js words.json cut.json out-captions.json [fixes.json]
// Whisper words (on the FINAL cut voice) -> Remotion Caption[]:
//  - glue split tokens ("l" + "'algo", "Peut" + "-être", "encore" + "?")
//  - apply per-project corrections from fixes.json: [[["Mes","frères,"],["Mais","frère,"]], ...]
//    (word sequence -> replacement). Only add a fix after checking the audio slice with check_ranges.py:
//    Whisper both mishears names ("Claude" -> "cloud") and invents words on breaths ("hein", "bon").
//  - a word can never start before the clip it belongs to (Whisper runs early right after a jump cut)
const fs = require('fs');
const [, , wordsF, cutF, outF, fixesF] = process.argv;
const words = JSON.parse(fs.readFileSync(wordsF, 'utf8'));
const cut = JSON.parse(fs.readFileSync(cutF, 'utf8'));
const fixes = fixesF && fs.existsSync(fixesF) ? JSON.parse(fs.readFileSync(fixesF, 'utf8')) : [];
const clipStarts = cut.clips.map(c => c.cutStartF / cut.fps);

// 1. glue tokens
const glued = [];
for (const w of words) {
  const t = w.w.trim();
  const prev = glued[glued.length - 1];
  if (prev && (/^['’-]/.test(t) || /^[?!:;]$/.test(t) || /['’]$/.test(prev.text))) {
    prev.text += (/^[?!:;]$/.test(t) ? ' ' : '') + t;
    prev.e = w.e;
  } else glued.push({ text: t, s: w.s, e: w.e });
}

// 2. corrections (first occurrence of each sequence)
for (const [from, to] of fixes) {
  let done = false;
  for (let i = 0; i + from.length <= glued.length && !done; i++) {
    if (from.every((f, k) => glued[i + k].text === f)) {
      const span = glued.slice(i, i + from.length);
      const s = span[0].s, e = span[span.length - 1].e, step = (e - s) / Math.max(1, to.length);
      glued.splice(i, from.length, ...to.map((t, k) => ({ text: t, s: s + k * step, e: s + (k + 1) * step })));
      done = true;
    }
  }
  if (!done) console.warn('fix not applied (sequence not found):', from.join(' '));
}

// 3. clamp starts to their clip (the clip that contains the word's end)
for (const w of glued) {
  const mid = w.e - 0.06;
  let ci = 0; while (ci + 1 < clipStarts.length && clipStarts[ci + 1] <= mid) ci++;
  if (w.s < clipStarts[ci]) w.s = clipStarts[ci];
  if (w.e < w.s + 0.08) w.e = w.s + 0.08;
}

const captions = glued.map((w, i) => ({
  text: (i === 0 ? '' : ' ') + w.text,
  startMs: Math.round(w.s * 1000),
  endMs: Math.round(Math.max(w.s + 0.06, Math.min(w.e, glued[i + 1] ? glued[i + 1].s : w.e)) * 1000),
  timestampMs: Math.round(((w.s + w.e) / 2) * 1000),
  confidence: null,
}));
const bad = captions.filter((c, i) => c.endMs <= c.startMs || (i && c.startMs < captions[i - 1].startMs)).length;
fs.writeFileSync(outF, JSON.stringify(captions, null, 1));
console.log(captions.length, 'captions,', bad, 'malformed (must be 0)');
console.log(captions.map(c => c.text).join(''));
