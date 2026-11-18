#!/usr/bin/env python3
"""Re-pace a voiceover: add a lead-in and breathing gaps between lines, keep word timings exact.

Why: TTS reads a teaser script too fast and too evenly. A premium teaser needs air before the
hook, a beat before each scene's line (so the cut + transition land in silence), and a longer
pause before the logo. NearMatch: ElevenLabs take A (≈38 s) -> 41.94 s placed VO inside 45 s.

Usage:
  python3 vo_repace.py vo.wav words.json gaps.json out.wav out.words.json [--lead 0.6] [--sr 48000]

words.json : [{"w": "Other", "s": 0.0, "e": 0.26}, ...]  (seconds, relative to vo.wav)
gaps.json  : {"7": 0.35, "12": 1.2, "66": 0.9}  -> extra seconds of silence inserted BEFORE word i
             (cut point = middle of the existing silence between word i-1 and word i, so no word
             is clipped). Use the scene-start word indices + a little extra before key lines.
out.words.json : [{"i": 0, "w": "Other", "s": 0.605, "e": 0.76}, ...] absolute seconds in out.wav
Needs ffmpeg + numpy.
"""
import argparse
import json
import subprocess

import numpy as np


def decode(path, sr):
    raw = subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
        check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def encode(x, sr, path):
    subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", "-",
         "-ac", "2", "-c:a", "pcm_s24le", path], input=x.astype(np.float32).tobytes(), check=True)


def fade(seg, n, head, tail):
    n = min(len(seg) // 2, n)
    if n:
        if head:
            seg[:n] *= np.linspace(0, 1, n, dtype=np.float32)
        if tail:
            seg[-n:] *= np.linspace(1, 0, n, dtype=np.float32)
    return seg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("wav"); ap.add_argument("words"); ap.add_argument("gaps")
    ap.add_argument("out_wav"); ap.add_argument("out_words")
    ap.add_argument("--lead", type=float, default=0.6, help="silence before the first word (s)")
    ap.add_argument("--sr", type=int, default=48000)
    a = ap.parse_args()

    x = decode(a.wav, a.sr)
    norm = [{"w": (w.get("w") or w.get("word") or w.get("text")).strip(),
             "s": float(w.get("s", w.get("start"))), "e": float(w.get("e", w.get("end")))}
            for w in json.load(open(a.words))]
    gaps = {int(k): float(v) for k, v in json.load(open(a.gaps)).items() if 0 < int(k) < len(norm)}

    sr, n8 = a.sr, int(0.008 * a.sr)  # 8 ms fades at every seam so inserted silence never clicks
    pieces = [np.zeros(int(a.lead * sr), np.float32)]
    prev = 0.0
    for i in sorted(gaps):
        t = (norm[i - 1]["e"] + norm[i]["s"]) / 2  # middle of the existing silence
        pieces += [fade(x[int(prev * sr):int(t * sr)].copy(), n8, prev > 0, True),
                   np.zeros(int(gaps[i] * sr), np.float32)]
        prev = t
    pieces.append(fade(x[int(prev * sr):].copy(), n8, prev > 0, False))
    out = np.concatenate(pieces)
    encode(out, sr, a.out_wav)

    def offset(i):
        return a.lead + sum(g for j, g in gaps.items() if j <= i)

    placed = [{"i": i, "w": w["w"], "s": round(w["s"] + offset(i), 3), "e": round(w["e"] + offset(i), 3)}
              for i, w in enumerate(norm)]
    json.dump(placed, open(a.out_words, "w"), indent=1, ensure_ascii=False)
    print(f"wrote {a.out_wav} ({len(out) / sr:.2f} s, was {len(x) / sr:.2f} s) and {a.out_words}")


if __name__ == "__main__":
    main()
