"""lines.json (hand-corrected Tunisian, Arabic letters + Latin tech words) + tx-ar.json (Whisper word timings)
→ ../remotion-video/src/data/captions.json (Remotion Caption[]: text, startMs, endMs, timestampMs, confidence).
Words of a line are spread over that line's Whisper words by character position (Whisper's Arabic words don't map
1:1 to the corrected text, but its timing of the speech inside the line is good). Prefix tokens ending in « ـ »
(الـ, بـ, لـ) are glued to the next word so they never show alone. Works for French/English/3arbizi lines too
(use the timing pass of that language: tx-fr.json).
Also copies lines.json to src/data/ (Captions.tsx resets pages at every line).
  python3 build_captions.py <project dir> [timing lang, default ar]
"""
import json
import os
import shutil
import sys

P = os.path.abspath(sys.argv[1])
here = f"{P}/analysis"
lang = sys.argv[2] if len(sys.argv) > 2 else "ar"
lines = json.load(open(f"{here}/lines.json", encoding="utf-8"))
segs = json.load(open(f"{here}/tx-{lang}.json", encoding="utf-8"))
ww = [w for s in segs for w in s["w"]]  # [word, start, end, prob]


def tokens(t):
    raw = t.split()
    out = []
    for r in raw:
        if out and out[-1].endswith("ـ"):
            out[-1] = out[-1] + " " + r
        else:
            out.append(r)
    return out


caps = []
for ln in lines:
    s, e = ln["s"], ln["e"]
    wl = [w for w in ww if w[1] >= s - 0.15 and w[1] < e - 0.05]
    toks = tokens(ln["t"])
    if not wl:
        wl = [["", s, e, 1]]
    # speech timeline of this line: concatenated whisper word spans, weighted by their char length
    total_c = sum(max(1, len(w[0].strip())) for w in wl)
    marks, acc = [], 0
    for w in wl:
        c = max(1, len(w[0].strip()))
        marks.append((acc / total_c, acc + c, w))
        acc += c
    tc = sum(len(t) for t in toks)
    pos = 0
    for i, t in enumerate(toks):
        frac0 = pos / tc
        pos += len(t)
        frac1 = pos / tc

        def at(fr):
            # time at fraction fr of the line's speech
            for (f0, f1c, w) in marks:
                f1 = f1c / total_c
                if fr <= f1 + 1e-9:
                    k = 0 if f1 == f0 else (fr - f0) / (f1 - f0)
                    return w[1] + k * (w[2] - w[1])
            return wl[-1][2]
        t0, t1 = at(frac0), at(frac1)
        t0 = max(s, t0)
        t1 = min(e, max(t1, t0 + 0.12))
        caps.append({"text": (" " if caps else "") + t, "startMs": round(t0 * 1000), "endMs": round(t1 * 1000),
                     "timestampMs": round((t0 + t1) / 2 * 1000), "confidence": 1, "part": ln["part"]})
# monotonic + no overlap
for a, b in zip(caps, caps[1:]):
    if b["startMs"] < a["startMs"]:
        b["startMs"] = a["startMs"] + 10
    if a["endMs"] > b["startMs"]:
        a["endMs"] = b["startMs"]
out = os.path.join(P, "remotion-video", "src", "data", "captions.json")
shutil.copy(f"{here}/lines.json", os.path.join(P, "remotion-video", "src", "data", "lines.json"))
os.makedirs(os.path.dirname(out), exist_ok=True)
json.dump(caps, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(len(caps), "caption words →", out)
for c in caps[:12]:
    print(c["startMs"], c["endMs"], c["text"])
