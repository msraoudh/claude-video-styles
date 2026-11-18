"""Find the earliest in-point (10 ms steps) of a line where Whisper hears the expected first word and nothing before it
(no tail of the previous word). Prints every try, then "==> <id> in = <s>"; put that value in trailer.json lines[].in.
Run in the project folder:
  bash ~/.claude/skills/aura-trailer/scripts/wpy.sh find_in.py <line_id> <first_word> <lo_s> <hi_s> [--lang fr]"""
import argparse
import os
import re
import sys
import unicodedata

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tlib  # noqa: E402
from faster_whisper import WhisperModel  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("line")
ap.add_argument("word")
ap.add_argument("lo", type=float)
ap.add_argument("hi", type=float)
ap.add_argument("--lang", default=None)
a = ap.parse_args()
SR = 16000
C = tlib.config()
L = next(x for x in C["lines"] if x["id"] == a.line)
audio = tlib.load_audio(tlib.path(C["voice"]["sources"][L["src"]]["audio"]), SR)
lang = a.lang or C.get("language")


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z' ]", " ", s).replace("'", "").split()


want = norm(a.word)[0] if norm(a.word) else a.word
m = WhisperModel("large-v3", device="cuda", compute_type="float16")
found = None
for t in np.arange(a.lo, a.hi + 1e-6, 0.01):
    x = audio[int(t * SR):int(float(L["out"]) * SR)].copy()
    f = int(0.02 * SR)
    x[:f] *= np.linspace(0, 1, f)
    pad = np.concatenate([np.zeros(8000, np.float32), x, np.zeros(8000, np.float32)])
    segs, _ = m.transcribe(pad, language=lang, beam_size=5)
    txt = " ".join(s.text.strip() for s in segs)
    w = norm(txt)
    ok = bool(w) and w[0] == want
    print(f"{a.line} {t:.2f} {'OK ' if ok else '   '} {txt}", flush=True)
    if ok:
        found = round(float(t), 2)
        break
print(f"==> {a.line} in = {found}")
