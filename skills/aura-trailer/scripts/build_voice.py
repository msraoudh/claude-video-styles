"""Assemble the voice track (48 kHz mono) from plan/plan.json: the subject's own lines, cut from their sources.
Each line: trimmed [in, out], 8 ms fade in / 40 ms fade out, loudness-matched on its voiced part (-18 dBFS RMS
by default), peak-capped. A source with music under it must be a Demucs vocal stem first (vocals.sh).
Writes video/public/voice/voice.wav (+ one file per line: video/public/voice/<id>.wav, checked by qa_lines.sh).
Run in the project folder: ~/.venvs/audio/bin/python ~/.claude/skills/aura-trailer/scripts/build_voice.py
"""
import os
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tlib  # noqa: E402

SR = 48000
C = tlib.config()
V = C["voice"]
plan = tlib.plan()
src = {}
for sid, s in V["sources"].items():
    p = tlib.path(s["audio"])
    if not os.path.exists(p):
        raise SystemExit(f"voice source {sid}: {p} missing (music under the voice? make a stem with vocals.sh)")
    src[sid] = tlib.load_audio(p, SR)
N = int(plan["durationInFrames"] / plan["fps"] * SR)
out = np.zeros(N, dtype=np.float32)
OUT = tlib.path("video/public/voice")
os.makedirs(OUT, exist_ok=True)
target = 10 ** (V.get("rms_dbfs", -18) / 20)
for l in plan["lines"]:
    a, b = int(l["srcIn"] * SR), int(l["srcOut"] * SR)
    x = src[l["src"]][a:b].copy()
    fi, fo = int(V.get("fade_in_ms", 8) / 1000 * SR), int(V.get("fade_out_ms", 40) / 1000 * SR)
    x[:fi] *= np.linspace(0, 1, fi)
    x[-fo:] *= np.linspace(1, 0, fo)
    win = 480
    r = np.sqrt(np.mean(x[:len(x) // win * win].reshape(-1, win) ** 2, axis=1))
    voiced = r[r > np.percentile(r, 60)]
    gain = target / (np.sqrt(np.mean(voiced ** 2)) + 1e-9)
    x *= gain
    peak = np.max(np.abs(x))
    cap = V.get("peak_max", 0.89)
    if peak > cap:
        x *= cap / peak
    sf.write(f"{OUT}/{l['id']}.wav", x, SR)
    s = int(l["at"] * SR)
    out[s:s + len(x)] += x[:max(0, min(len(x), N - s))]
    print(f"{l['id']:4s} gain {20 * np.log10(gain):+5.1f} dB  len {len(x) / SR:.2f}s")
sf.write(f"{OUT}/voice.wav", out, SR)
print("wrote", f"{OUT}/voice.wav", len(out) / SR, "s")
