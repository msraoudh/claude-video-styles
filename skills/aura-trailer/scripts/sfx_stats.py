"""Pick the better of the generated variants of each SFX by measurement (you can't listen): peak/RMS, sub (<100 Hz)
share, spectral centroid, attack time to peak, decay to -30 dB. Impacts want more sub and an early attack; the reverse
wants a late peak (its suck-in ends on the hit); textures want a darker (lower) centroid.
Reads audio/sfx-gen/<name>-<n>.mp3, writes the picks as 48 kHz stereo WAV to audio/sfx-pick/<name>.wav.
Run in the project folder: ~/.venvs/audio/bin/python ~/.claude/skills/aura-trailer/scripts/sfx_stats.py"""
import glob
import os
import subprocess
import sys

import librosa
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tlib  # noqa: E402

GEN, PICK = tlib.path("audio/sfx-gen"), tlib.path("audio/sfx-pick")
os.makedirs(PICK, exist_ok=True)
IMPACTS = {"braam", "subdrop", "metalhit", "titleslam", "impact", "sub-impact"}
rows = {}
for p in sorted(glob.glob(f"{GEN}/*.mp3") + glob.glob(f"{GEN}/*.wav")):
    y, sr = librosa.load(p, sr=48000, mono=True)
    S = np.abs(librosa.stft(y, n_fft=4096)) ** 2
    fr = librosa.fft_frequencies(sr=sr, n_fft=4096)
    sub = S[fr < 100].sum() / (S.sum() + 1e-12)
    cen = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
    env = np.abs(y)
    pk = int(np.argmax(env))
    after = np.where(env[pk:] < env[pk] * 10 ** (-30 / 20))[0]
    decay = (after[0] if len(after) else len(env) - pk) / sr
    rms = 20 * np.log10(np.sqrt(np.mean(y ** 2)) + 1e-9)
    name = os.path.splitext(os.path.basename(p))[0]
    rows[name] = dict(sub=sub, cen=cen, attack=pk / sr, decay=decay, rms=rms, peak=20 * np.log10(env[pk] + 1e-9), dur=len(y) / sr, path=p)
    print(f"{name:14s} dur {len(y) / sr:4.1f}s rms {rms:6.1f} peak {rows[name]['peak']:5.1f} sub {sub:4.2f} centroid {cen:6.0f}Hz attack {pk / sr:4.2f}s decay {decay:4.2f}s")


def score(n, r):
    if n in IMPACTS:
        return r["sub"] - r["attack"] * 0.2
    if n == "reverse":
        return r["attack"]
    return -r["cen"]


pick = {}
for n in sorted({k.rsplit("-", 1)[0] for k in rows}):
    variants = {k: r for k, r in rows.items() if k.rsplit("-", 1)[0] == n}
    best = max(variants, key=lambda k: score(n, variants[k]))
    pick[n] = best
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", variants[best]["path"], "-ar", "48000", "-ac", "2", f"{PICK}/{n}.wav"], check=True)
print("picked", pick)
