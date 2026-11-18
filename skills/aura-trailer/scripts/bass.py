"""Sub-bass (808) analysis of the processed song: one value per 60 fps frame.
Writes {fps, duration, hits: [{t, f, rise_db, level_db}], sub_env: [0..1 per frame], all_db: [...]}.
  hits    = rising edges of the < 120 Hz envelope (where the 808s land: cut here)
  sub_env = sub-bass loudness, normalised 0..1 (drive shake / glow / zoom with it)
Prints the hits and a loudness strip so you can find the drops, drop-outs and silences.
Usage: ~/.venvs/audio/bin/python bass.py <song.wav> <out.json>"""
import json
import sys

import librosa
import numpy as np
import scipy.signal as ss

P, OUT = sys.argv[1], sys.argv[2]
y, sr = librosa.load(P, sr=48000, mono=True)
sub = ss.sosfilt(ss.butter(4, 120, "low", fs=sr, output="sos"), y)
hop = sr // 60  # one value per 60 fps video frame


def rms(x):
    n = len(x) // hop
    return np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1))


db_sub = 20 * np.log10(rms(sub) + 1e-9)
db_all = 20 * np.log10(rms(y) + 1e-9)
on = np.maximum(0, np.diff(db_sub, prepend=db_sub[0]))
on = ss.savgol_filter(on, 5, 2)
peaks, _ = ss.find_peaks(on, height=2.0, distance=8)
hits = [{"t": round(p / 60, 3), "f": int(p), "rise_db": round(float(on[p]), 1),
         "level_db": round(float(db_sub[min(p + 3, len(db_sub) - 1)]), 1)} for p in peaks]
norm = np.clip((db_sub - db_sub.max() + 40) / 40, 0, 1)
json.dump({"fps": 60, "duration": len(y) / sr, "hits": hits, "sub_env": [round(float(v), 3) for v in norm],
           "all_db": [round(float(v), 1) for v in db_all]}, open(OUT, "w"))
print("hits", len(hits), "song", round(len(y) / sr, 1), "s")
dur = len(y) / sr
for lo in range(0, int(dur) + 1, 12):
    hs = " ".join(f"{h['t']:.2f}({h['rise_db']:.0f}/{h['level_db']:.0f})" for h in hits if lo <= h["t"] < lo + 12 and h["rise_db"] >= 4)
    print(f"--- {lo}-{lo + 12}s strong 808 hits (t(rise/level dB)): {hs}")
cells = [(i / 4, float(np.mean(db_all[int(i * 15):int(i * 15 + 15)]))) for i in range(int(len(db_all) / 15))]
for lo in range(0, int(dur) + 1, 24):
    print(f"all-band dB {lo}-{lo + 24}s:", " ".join(f"{t:.2f}:{v:.0f}" for t, v in cells if lo <= t < lo + 24))
