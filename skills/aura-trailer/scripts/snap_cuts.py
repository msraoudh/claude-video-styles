"""Where to cut each voice line: for every line's in/out point, print the 10 ms loudness strip (dBFS) around it.
Move "in" to the start of the energy rise and "out" to the bottom of the valley after the last word — Whisper's word
times are often early/late by 50-170 ms and cutting on them truncates words or leaks the next one.
Then confirm the in-point with find_in.py. Run in the project folder (after plan.py):
  ~/.venvs/audio/bin/python ~/.claude/skills/aura-trailer/scripts/snap_cuts.py [line_id ...]"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tlib  # noqa: E402

SR = 48000
C = tlib.config()
plan = tlib.plan()
want = set(sys.argv[1:])
src = {k: tlib.load_audio(tlib.path(v["audio"]), SR) for k, v in C["voice"]["sources"].items()}
hop = SR // 100
env = {k: 20 * np.log10(np.sqrt(np.mean(v[:len(v) // hop * hop].reshape(-1, hop) ** 2, axis=1)) + 1e-9) for k, v in src.items()}
for l in plan["lines"]:
    if want and l["id"] not in want:
        continue
    e = env[l["src"]]
    for name, t, lo, hi in [("in", l["srcIn"], -0.20, 0.12), ("out", l["srcOut"], -0.12, 0.30)]:
        c = int(t * 100)
        strip = " ".join(f"{(c + k) / 100:.2f}:{e[c + k]:.0f}" for k in range(int(lo * 100), int(hi * 100) + 1, 2) if 0 <= c + k < len(e))
        print(f"{l['id']:4s} {name:3s} {t:.2f} | {strip}")
