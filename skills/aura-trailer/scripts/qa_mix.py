"""Audio QA of the mix (you can't listen, so measure): for every voice line, the voice's lead over music+SFX on its
spoken frames (broadband and 1-4 kHz, where words are understood) — aim >= 10 dB on both; the music level per second;
and a BLIND Whisper transcript of the mastered mix (no language, no prompt): every line must come back word for word.
Run in the project folder (after mix.py + mastering; deliver.sh does it):
  bash ~/.claude/skills/aura-trailer/scripts/wpy.sh qa_mix.py"""
import os
import sys

import numpy as np
import scipy.signal as ss

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tlib  # noqa: E402
from faster_whisper import WhisperModel  # noqa: E402

SR = 16000
O = tlib.path("audio/out")
plan = tlib.plan()
FPS = plan["fps"]
mix, voc = tlib.load_audio(f"{O}/mix.wav", SR), tlib.load_audio(f"{O}/voice.wav", SR)
n = min(len(mix), len(voc))
mix, voc = mix[:n], voc[:n]
rest = mix - voc
band = ss.butter(4, [1000, 4000], "band", fs=SR, output="sos")
mb, vb = ss.sosfilt(band, rest), ss.sosfilt(band, voc)


def dbm(x):
    return 10 * np.log10(np.mean(x ** 2) + 1e-12)


print("line  lead(broad)  lead(1-4k)   music+sfx")
for l in plan["lines"]:
    m = np.zeros(n, bool)
    for w in l["words"]:
        m[int(w["f"] / FPS * SR):int(w["e"] / FPS * SR)] = True
    if not m.any():
        print(f"{l['id']:4s} (no words)")
        continue
    lead, lead_b = dbm(voc[m]) - dbm(rest[m]), dbm(vb[m]) - dbm(mb[m])
    flag = "" if lead >= 10 and lead_b >= 10 else "   <-- LOW: duck deeper / raise this line"
    print(f"{l['id']:4s} {lead:8.1f} dB {lead_b:9.1f} dB {dbm(rest[m]):9.1f} dB{flag}")
mu = tlib.load_audio(f"{O}/music.wav", SR)
secs = int(len(mu) / SR)
print("music dBFS/s:", " ".join(f"{dbm(mu[i * SR:(i + 1) * SR]):.0f}" for i in range(secs)))
master = f"{O}/mix-master.wav" if os.path.exists(f"{O}/mix-master.wav") else f"{O}/mix.wav"
segs, info = WhisperModel("large-v3", device="cuda", compute_type="float16").transcribe(tlib.load_audio(master, SR), beam_size=5)
print("blind transcript (lang", info.language, ")")
for s in segs:
    print(f"[{s.start:5.2f}-{s.end:5.2f}] {s.text.strip()}")
print("want:")
for l in plan["lines"]:
    print(f"[{l['at']:5.2f}] {l['id']}: {l['text']}")
