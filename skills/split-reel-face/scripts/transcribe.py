"""Whisper large-v3 (GPU, WSL) on the user's voice, word timings → analysis/tx-<lang>.json, printed as lines.
For Tunisian, run BOTH « ar » and « fr »: the Arabic pass gives the dialect, the French pass the French/tech words;
read both and write analysis/lines.json by hand (references/captions.md). Whisper can't write 3arbizi.
  bash wpy.sh transcribe.py <project dir> [ar fr en]   (default: ar fr)
"""
import json
import os
import subprocess
import sys

import numpy as np
from faster_whisper import WhisperModel

P = os.path.abspath(sys.argv[1])
A = f"{P}/analysis"
langs = sys.argv[2:] or ["ar", "fr"]
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f"{A}/voice-16k.wav", "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                     capture_output=True, check=True).stdout
y = np.frombuffer(raw, np.float32).copy()  # faster-whisper's own decoder (PyAV) is broken in this venv
m = WhisperModel("large-v3", device="cuda", compute_type="float16")
prompt = os.environ.get("WHISPER_PROMPT", "Claude, reel, motion graphics, ffmpeg, Whisper, Remotion, ElevenLabs, skills, agents")
for lang in langs:
    segs, _ = m.transcribe(y, language=lang, word_timestamps=True, beam_size=5, initial_prompt=prompt, vad_filter=False)
    out = [{"s": round(s.start, 2), "e": round(s.end, 2), "t": s.text.strip(),
            "w": [[w.word, round(w.start, 2), round(w.end, 2), round(w.probability, 2)] for w in (s.words or [])]} for s in segs]
    json.dump(out, open(f"{A}/tx-{lang}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print("=====", lang)
    for s in out:
        print(f"[{s['s']:6.2f}-{s['e']:6.2f}] {s['t']}")
