"""Finds the moments where the voice repeats itself, from the sound alone (no transcription).

    python echoes.py <audio> [--min-len 0.16] [--max-lag 3.0] [--top 60]

Whisper can hide a stutter; the sound cannot. A word said twice makes a diagonal line in the self
similarity of the voice: the audio at t looks like the audio at t + lag, for as long as the repeat
lasts. Every candidate is (first, second, length, distance): the first occurrence is what a cut removes.
"""
import argparse
import json

import numpy as np

from hear import load_audio, SR

HOP = 0.01
WIN = 0.025


def mfcc(audio: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Cepstra (c1..c12, mean removed) and a voiced mask, every 10 ms."""
    x = np.append(audio[0], audio[1:] - 0.97 * audio[:-1])
    hop, win, nfft = int(SR * HOP), int(SR * WIN), 512
    n = 1 + (len(x) - win) // hop
    frames = np.lib.stride_tricks.sliding_window_view(x, win)[::hop][:n] * np.hanning(win)
    power = np.abs(np.fft.rfft(frames, nfft)) ** 2

    def mel(f):
        return 2595 * np.log10(1 + f / 700)

    def hz(m):
        return 700 * (10 ** (m / 2595) - 1)

    pts = hz(np.linspace(mel(80), mel(7600), 42))
    bins = np.fft.rfftfreq(nfft, 1 / SR)
    fb = np.zeros((40, len(bins)))
    for i in range(40):
        up = (bins - pts[i]) / (pts[i + 1] - pts[i])
        down = (pts[i + 2] - bins) / (pts[i + 2] - pts[i + 1])
        fb[i] = np.maximum(0, np.minimum(up, down))
    log_mel = np.log(power @ fb.T + 1e-10)
    k = np.arange(1, 13)
    dct = np.cos(np.pi * k[:, None] * (np.arange(40) + 0.5) / 40)
    cep = log_mel @ dct.T
    energy = 10 * np.log10(np.mean(frames ** 2, axis=1) + 1e-12)
    floor, speech = np.percentile(energy, 10), np.percentile(energy, 90)
    voiced = energy > floor + (speech - floor) * 0.45
    cep = cep - cep[voiced].mean(axis=0)
    return cep / (cep[voiced].std(axis=0) + 1e-9), voiced


def find_echoes(audio: np.ndarray, min_len=0.16, max_lag=3.0) -> list[dict]:
    cep, voiced = mfcc(audio)
    n = len(cep)
    # smoothing makes the distance tolerant to a repeat said a little faster or slower
    kernel = np.ones(5) / 5
    cep = np.apply_along_axis(lambda c: np.convolve(c, kernel, "same"), 0, cep)
    rng = np.random.default_rng(0)
    pairs = rng.integers(0, n, (20000, 2))
    keep = voiced[pairs[:, 0]] & voiced[pairs[:, 1]]
    base = np.linalg.norm(cep[pairs[keep, 0]] - cep[pairs[keep, 1]], axis=1)
    thr = np.percentile(base, 4)  # closer than 96 % of two random moments of this voice

    min_frames = int(min_len / HOP)
    found = []
    for lag in range(int(0.14 / HOP), int(max_lag / HOP)):
        d = np.linalg.norm(cep[:-lag] - cep[lag:], axis=1)
        close = (d < thr) & voiced[:-lag] & voiced[lag:]
        edges = np.flatnonzero(np.diff(np.concatenate(([0], close.astype(np.int8), [0]))))
        for a, b in zip(edges[::2], edges[1::2]):
            if b - a >= min_frames:
                found.append({"first": round(a * HOP, 2), "second": round((a + lag) * HOP, 2), "len": round((b - a) * HOP, 2),
                              "lag": round(lag * HOP, 2), "dist": round(float(d[a:b].mean() / thr), 3)})
    # one candidate per moment: the longest diagonal wins over its neighbours
    found.sort(key=lambda e: (-e["len"], e["dist"]))
    out = []
    for e in found:
        if all(abs(e["first"] - o["first"]) > 0.25 or abs(e["lag"] - o["lag"]) > 0.25 for o in out):
            out.append(e)
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("--min-len", type=float, default=0.16)
    ap.add_argument("--max-lag", type=float, default=3.0)
    ap.add_argument("--top", type=int, default=60)
    args = ap.parse_args()
    res = find_echoes(load_audio(args.audio), args.min_len, args.max_lag)
    print(json.dumps(res[: args.top], indent=0))


if __name__ == "__main__":
    main()
