"""Loudness + blind Whisper on DELIVERED files (the AAC inside the mp4, what Instagram gets).
Usage: bash ~/.claude/skills/aura-trailer/scripts/wpy.sh verify_delivery.py <file.mp4> [<file.mp4> ...]"""
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tlib  # noqa: E402
from faster_whisper import WhisperModel  # noqa: E402

m = WhisperModel("large-v3", device="cuda", compute_type="float16")
for f in sys.argv[1:]:
    print("==", os.path.basename(f))
    r = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-nostats", "-i", f, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    print("\n".join(" ".join(x.split()) for x in r.splitlines() if x.strip().startswith(("I:", "LRA:", "Peak:"))))
    segs, info = m.transcribe(tlib.load_audio(f, 16000), beam_size=5)
    print("lang", info.language)
    for s in segs:
        print(f"[{s.start:5.2f}] {s.text.strip()}")
