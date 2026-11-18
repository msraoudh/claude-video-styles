"""Blind Whisper check of every voice line on its own (video/public/voice/<id>.wav, from build_voice.py) + its noise
floor (music residue left by Demucs). "heard" must equal "want": no truncated first/last word, no tail of a neighbour.
Run in the project folder: bash ~/.claude/skills/aura-trailer/scripts/wpy.sh qa_lines.py"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tlib  # noqa: E402
from faster_whisper import WhisperModel  # noqa: E402

C = tlib.config()
plan = tlib.plan()
m = WhisperModel("large-v3", device="cuda", compute_type="float16")
for l in plan["lines"]:
    a = tlib.load_audio(tlib.path(f"video/public/voice/{l['id']}.wav"), 16000)
    pad = np.concatenate([np.zeros(8000, np.float32), a, np.zeros(8000, np.float32)])
    segs, _ = m.transcribe(pad, language=C.get("language"), beam_size=5)
    txt = " ".join(s.text.strip() for s in segs)
    r = 20 * np.log10(np.sqrt(np.mean(a[:len(a) // 320 * 320].reshape(-1, 320) ** 2, axis=1)) + 1e-9)
    print(f"{l['id']:4s} floor p10 {np.percentile(r, 10):6.1f} dB | heard: {txt}")
    print(f"     want : {l['text']}")
