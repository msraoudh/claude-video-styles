"""Add a royalty-free track to the series library: assets/music/<key>/{track.flac, meta.json}.
Analyses the WHOLE track once (beat grid with music-to-video's analyze-beatgrid.py, sub-bass hits, drop onset), so
every episode only shifts it. Only add tracks the user approved (Mixkit / free licence, no AI music, no songs).

  ~/.venvs/audio/bin/python music_add.py <file.mp3|wav> <approx drop s> <key> "<title>" "<credit>" "<licence>" [bed]
With `bed` (calm episode beds): no drop alignment — the 2nd argument is the START second played at video 0.
"""
import json
import os
import subprocess
import sys

import librosa
import numpy as np
import scipy.signal as ss

import elib

SRC, D0, KEY, TITLE, CREDIT, LIC = sys.argv[1], float(sys.argv[2]), sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6]
D = f"{elib.SKILL}/assets/music/{KEY}"
os.makedirs(D, exist_ok=True)
FLAC = f"{D}/track.flac"
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", SRC, "-ar", "48000", "-ac", "2", "-c:a", "flac", FLAC], check=True)
y, sr = librosa.load(FLAC, sr=48000, mono=True)
hop = 480
env = 20 * np.log10(np.sqrt(np.mean(y[: len(y) // hop * hop].reshape(-1, hop) ** 2, axis=1)) + 1e-9)
sub = ss.sosfilt(ss.butter(4, 150, "low", fs=sr, output="sos"), y)
senv = 20 * np.log10(np.sqrt(np.mean(sub[: len(sub) // hop * hop].reshape(-1, hop) ** 2, axis=1)) + 1e-9)
a, b = int((D0 - 0.6) * 100), int((D0 + 0.6) * 100)
jump = np.array([env[i + 3:i + 8].mean() - env[i - 8:i - 1].mean() + 0.6 * (senv[i + 3:i + 8].mean() - senv[i - 8:i - 1].mean())
                 for i in range(a, b)])
i0 = a + int(np.argmax(jump))
pre = env[i0 - 8:i0 - 1].mean()
k = next((j for j in range(i0 - 6, i0 + 10) if env[j] > pre + 6), i0)
drop = k / 100
AM = f"{D}/audiomap.json"
WAV = "/tmp/devops45-music-add.wav"
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", FLAC, WAV], check=True)
analyzer = "/mnt/c/Users/YOU/.claude/skills/music-to-video/scripts/analyze-beatgrid.py"
subprocess.run([os.path.expanduser("~/.venvs/audio/bin/python"), analyzer, WAV, "-o", AM], check=True, stdout=subprocess.DEVNULL)
am = json.load(open(AM))
# sub-bass hits on the whole track (source seconds)
sb = ss.sosfilt(ss.butter(4, 120, "low", fs=48000, output="sos"), y)
h = 800  # 1/60 s
se = 20 * np.log10(np.sqrt(np.mean(sb[: len(sb) // h * h].reshape(-1, h) ** 2, axis=1)) + 1e-9)
on = np.maximum(0, np.diff(se, prepend=se[0]))
pk, _ = ss.find_peaks(on, height=3.0, distance=10)
hits = [[round(p / 60, 3), round(float(on[p]), 1)] for p in pk]
norm = np.clip((se - se.max() + 40) / 40, 0, 1)
meta = {"key": KEY, "title": TITLE, "credit": CREDIT, "licence": LIC, "duration_s": round(len(y) / sr, 3),
        "drop_s": drop, "bpm": am["tempo"]["bpm"], "beats_per_bar": am["tempo"]["beats_per_bar"],
        "beats_s": am["grid"]["beats_sec"], "downbeats_s": am["grid"]["downbeats_sec"], "sub_hits": hits,
        "sub_env_60": [round(float(v), 3) for v in norm]}
if len(sys.argv) > 7 and sys.argv[7] == "bed":
    meta.update(mode="bed", start_s=D0)
elib.wjson(f"{D}/meta.json", meta)
print(f"{KEY}: drop {D0} → {drop:.3f} s · {meta['bpm']} BPM · {len(meta['beats_s'])} beats · {len(hits)} sub hits · {meta['duration_s']} s")
