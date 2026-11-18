"""A/B clips of the voice for the user: the same 15 s window from raw, v2 and v3, loudness-matched.

Loudness matching matters: the raw file is ~10 LU quieter than the masters and « louder = better » would
decide the test. All three clips get the same integrated loudness: the loudest level the raw clip can
reach without passing -1 dBTP (plain gain, no limiter on the raw), capped at -16 LUFS. 10 ms fades.
v2 is shifted 25 ms earlier: ffmpeg afftdn delayed the v2 master by 1200 samples, so the clips line up.

Usage: python scripts/ab_clips.py [start_s=20] [dur_s=15]  ->  out/ab/raw.wav, out/ab/v2.wav, out/ab/v3.wav
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from audiolib import SR, integrated_lufs, read_wav, true_peak_db, undb, write_wav  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SRC = {"raw": ("public/audio/voice-clean-v2.wav", 0), "v2": ("public/audio/voice-master-v2.wav", 1200),
       "v3": ("public/audio/voice-master-v3.wav", 0)}


def main() -> None:
    t0 = float(sys.argv[1]) if len(sys.argv) > 1 else 20.0
    dur = float(sys.argv[2]) if len(sys.argv) > 2 else 15.0
    clips = {}
    for k, (p, lag) in SRC.items():
        x, sr = read_wav(ROOT / p)
        assert sr == SR
        a = int(t0 * SR) + lag
        clips[k] = x[a: a + int(dur * SR), 0].copy()
    raw = clips["raw"]
    target = min(-16.0, integrated_lufs(raw) + (-1.0 - true_peak_db(raw)))
    fade = np.ones(len(raw))
    n = int(0.01 * SR)
    fade[:n], fade[-n:] = np.linspace(0, 1, n), np.linspace(1, 0, n)
    print(f"window {t0:.1f}-{t0 + dur:.1f} s, all clips at {target:.1f} LUFS")
    for k, c in clips.items():
        y = c * undb(target - integrated_lufs(c)) * fade
        out = ROOT / "out/ab" / f"{k}.wav"
        write_wav(out, y)
        print(f"  {out}  I {integrated_lufs(y):.1f} LUFS  TP {true_peak_db(y):.1f} dBTP")


if __name__ == "__main__":
    main()
