"""Applies the decisions: removes the words marked by decide.py, cutting in the dips of the voice.

    python cut.py <audio> <decisions.json> <out.wav> <out-cuts.json>

Whisper's word times are off by up to 0.2 s, so they only say roughly where to look. The exact cut point
is the quietest moment around them, measured every 5 ms, on a zero crossing, joined with an 8 ms
crossfade so no click can appear. Natural pauses are left alone: only what was decided is removed.
"""
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48000
HOP = 0.005
FADE = 0.008
SEARCH = 0.09  # how far around Whisper's time the dip is looked for
QUIET_ENOUGH = 2.0  # dB: dips this close count as equal, the one nearest the kept word wins


def load(path) -> np.ndarray:
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-vn", "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.float32)


def level(audio: np.ndarray) -> np.ndarray:
    hop = int(SR * HOP)
    n = len(audio) // hop
    return 10 * np.log10(np.mean(audio[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)


def dip(db: np.ndarray, a: float, b: float, prefer_late: bool) -> tuple[float, float]:
    i, j = max(0, int(a / HOP)), min(len(db), int(b / HOP) + 1)
    if j <= i:
        return a, float(db[min(i, len(db) - 1)])
    part = db[i:j]
    near = np.flatnonzero(part <= part.min() + QUIET_ENOUGH)
    k = near[-1] if prefer_late else near[0]
    return (i + k) * HOP, float(part[k])


def zero_cross(audio: np.ndarray, t: float) -> float:
    i = int(t * SR)
    span = int(0.002 * SR)
    seg = audio[max(0, i - span): i + span]
    if len(seg) < 2:
        return t
    return (max(0, i - span) + int(np.argmin(np.abs(seg)))) / SR


def removal_spans(words: list[dict]) -> list[tuple[int, int]]:
    spans, i = [], 0
    while i < len(words):
        if words[i]["reason"]:
            j = i
            while j + 1 < len(words) and words[j + 1]["reason"]:
                j += 1
            spans.append((i, j))
            i = j + 1
        else:
            i += 1
    return spans


def main() -> None:
    audio_path, dec_path, out_wav, out_cuts = sys.argv[1:5]
    audio = load(audio_path)
    db = level(audio)
    decisions = json.loads(Path(dec_path).read_text(encoding="utf8"))
    words = decisions["words"]
    total = len(audio) / SR

    cuts = []
    for i, j in removal_spans(words):
        prev, nxt = words[i - 1] if i else None, words[j + 1] if j + 1 < len(words) else None
        first, last = words[i], words[j]
        # start: the first dip after the kept word; end: the last dip before the next kept word
        a0 = first["s"] - SEARCH if prev is None else max(prev["e"] - SEARCH, prev["s"] + 0.03)
        start, db_a = dip(db, a0, first["s"] + SEARCH, prefer_late=False)
        if nxt is None:
            end, db_b = total, -120.0
        else:
            end, db_b = dip(db, max(start + 0.02, last["e"] - SEARCH), min(nxt["s"] + SEARCH * 0.6, nxt["e"] - 0.03), prefer_late=True)
        cuts.append({"a": round(zero_cross(audio, start), 4), "b": round(zero_cross(audio, end), 4), "db_a": round(db_a, 1), "db_b": round(db_b, 1),
                     "removed": " ".join(w["w"] for w in words[i: j + 1]), "reason": words[i]["reason"],
                     "before": " ".join(w["w"] for w in words[max(0, i - 4): i]), "after": " ".join(w["w"] for w in words[j + 1: j + 5])})

    for a, b, why in decisions.get("spans", []):  # exact pieces chosen by ear-proxy, smaller than a word
        around = [w for w in words if w["e"] > a - 1.2 and w["s"] < b + 1.2]
        cuts.append({"a": round(zero_cross(audio, a), 4), "b": round(zero_cross(audio, b), 4), "db_a": round(float(db[int(a / HOP)]), 1), "db_b": round(float(db[int(b / HOP)]), 1),
                     "removed": "(son)", "reason": why, "before": " ".join(w["w"] for w in around if w["s"] < a), "after": " ".join(w["w"] for w in around if w["s"] >= a)})
    cuts.sort(key=lambda c: c["a"])

    # keep everything between the cuts, joined with short crossfades
    fade = int(FADE * SR)
    curve = np.sin(np.linspace(0, np.pi / 2, fade)) ** 2
    pieces, pos = [], 0.0
    for c in cuts:
        if c["a"] > pos:
            pieces.append((pos, c["a"]))
        pos = max(pos, c["b"])
    if pos < total:
        pieces.append((pos, total))
    out = np.zeros(0, np.float32)
    timeline = []
    for a, b in pieces:
        seg = audio[int(a * SR): int(b * SR)].copy()
        if len(out) >= fade and len(seg) >= fade:
            seg[:fade] = seg[:fade] * curve + out[-fade:] * curve[::-1]
            out = out[:-fade]
        timeline.append({"a": round(a, 4), "b": round(b, 4), "t": round(len(out) / SR, 4)})
        out = np.concatenate((out, seg))

    with wave.open(out_wav, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes())
    Path(out_cuts).write_text(json.dumps({"cuts": cuts, "timeline": timeline}, ensure_ascii=False, indent=0), encoding="utf8")
    print(f"{total:.1f} s -> {len(out) / SR:.1f} s, {len(cuts)} coupes")
    for c in cuts:
        print(f"  {c['a']:7.2f}-{c['b']:7.2f} ({c['db_a']:6.1f}/{c['db_b']:6.1f} dB) {c['reason']:<20} {c['before']} [{c['removed']}] {c['after']}")


if __name__ == "__main__":
    main()
