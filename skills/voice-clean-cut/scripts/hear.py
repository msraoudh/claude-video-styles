"""Verbatim hearing: what was REALLY said, stutters included.

    python hear.py <audio> <out.json> [--model NAME] [--force]

Whisper tidies speech: on a long clip, and above all when it is given the script as a prompt, it
drops repeated words and hears what should have been said. So here:
  - the recording is split on its own pauses and every phrase is transcribed alone;
  - never with the script, never conditioned on the previous phrase;
  - twice: with no prompt, and with a prompt written in stuttering style (Whisper imitates it).
Timings are in the raw file. Results are cached phrase by phrase in <out.json>.
"""
import argparse
import json
import subprocess
from pathlib import Path

import numpy as np

SR = 16000
HOP = 0.02
SPLIT_PAUSE = 0.30  # a pause this long separates two phrases
MAX_PHRASE = 18.0
PAD = 0.18
from lang import VERBATIM_PROMPT, VERBATIM_PROMPT_2, WHISPER_LANG  # VC_LANG = fr (default) | en | tn


def looped(words: list[dict]) -> bool:
    """Whisper stuck on one sound: 'une image, une image, une image, une image…'"""
    said = [w["w"].lower().strip(" ,.?!") for w in words]
    return any(len(set(said[i: i + k * 4])) <= k and len(said[i: i + k * 4]) == k * 4 for k in (1, 2) for i in range(len(said)))


def load_audio(path) -> np.ndarray:
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-vn", "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.float32)


def level_db(audio: np.ndarray) -> np.ndarray:
    hop = int(SR * HOP)
    n = len(audio) // hop
    return 10 * np.log10(np.mean(audio[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)


def voice_threshold(db: np.ndarray) -> float:
    """Halfway (in dB) between the noise floor and the speech level of this recording."""
    floor, speech = np.percentile(db, 10), np.percentile(db, 90)
    return floor + (speech - floor) * 0.35


def voiced_runs(db: np.ndarray, thr: float, min_gap: float) -> list[tuple[float, float]]:
    voiced = db > thr
    runs, start = [], None
    for i, v in enumerate(voiced):
        if v and start is None:
            start = i
        elif not v and start is not None:
            runs.append([start, i])
            start = None
    if start is not None:
        runs.append([start, len(voiced)])
    merged = []
    for r in runs:
        if merged and (r[0] - merged[-1][1]) * HOP < min_gap:
            merged[-1][1] = r[1]
        else:
            merged.append(r)
    return [(a * HOP, b * HOP) for a, b in merged]


def split_long(run, db, thr):
    """Cuts a phrase longer than MAX_PHRASE at its deepest dips."""
    a, b = run
    if b - a <= MAX_PHRASE:
        return [run]
    lo, hi = int((a + MAX_PHRASE * 0.4) / HOP), int((a + MAX_PHRASE) / HOP)
    cut = (lo + int(np.argmin(db[lo:hi]))) * HOP
    return [(a, cut)] + split_long((cut, b), db, thr)


def phrases_of(audio: np.ndarray) -> list[tuple[float, float]]:
    db = level_db(audio)
    thr = voice_threshold(db)
    out = []
    for run in voiced_runs(db, thr, SPLIT_PAUSE):
        if run[1] - run[0] >= 0.08:
            out += split_long(run, db, thr)
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("out")
    ap.add_argument("--model", default="mobiuslabsgmbh/faster-whisper-large-v3-turbo")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    out = Path(args.out)
    if out.exists() and not args.force and out.stat().st_mtime > Path(args.audio).stat().st_mtime:
        print("cached:", out)
        return
    from faster_whisper import WhisperModel

    audio = load_audio(args.audio)
    model = WhisperModel(args.model, device="cpu", compute_type="int8", cpu_threads=16)

    def listen(clip, s, prompt):
        segs, _ = model.transcribe(clip, language=WHISPER_LANG, word_timestamps=True, vad_filter=False, beam_size=5,
                                   condition_on_previous_text=False, initial_prompt=prompt, temperature=0.0)
        return [{"w": w.word.strip(), "s": round(s + w.start, 3), "e": round(s + w.end, 3), "p": round(w.probability, 2)}
                for seg in segs for w in seg.words]

    res = []
    for a, b in phrases_of(audio):
        s, e = max(0.0, a - PAD), min(len(audio) / SR, b + PAD)
        clip = audio[int(s * SR): int(e * SR)]
        passes = {"plain": listen(clip, s, None), "verbatim": listen(clip, s, VERBATIM_PROMPT)}
        if looped(passes["verbatim"]):  # the stuttering prompt can send Whisper into a loop: try the other one
            passes["verbatim"] = listen(clip, s, VERBATIM_PROMPT_2)
        res.append({"a": round(a, 3), "b": round(b, 3), **passes})
        print(f"{a:7.2f}-{b:7.2f} | {' '.join(w['w'] for w in passes['plain'])}\n{'':15} * {' '.join(w['w'] for w in passes['verbatim'])}", flush=True)
    out.write_text(json.dumps(res, ensure_ascii=False, indent=0), encoding="utf8")


if __name__ == "__main__":
    main()
