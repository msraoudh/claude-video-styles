"""Whisper large-v3 transcripts with word timestamps of every downloaded reel -> analysis/transcripts/<code>.json
({code, lang, lang_p, segments: [{s, e, t, w: [[word, start, end, prob]]}]}). Reading them is how you find the
subject's best lines (punchy, self-contained, 1-4 s) and their own slogans.
Run in the project folder: bash ~/.claude/skills/aura-trailer/scripts/wpy.sh transcribe.py [--skip CODE ...] [--files a.wav ...]
"""
import argparse
import glob
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tlib  # noqa: E402
from faster_whisper import WhisperModel  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("--skip", nargs="*", default=[], help="reel codes to leave out (faceless / music-only reels)")
ap.add_argument("--files", nargs="*", default=None, help="transcribe these files instead of source/*.mp4")
ap.add_argument("--lang", default=None, help="force a language (default: detect)")
args = ap.parse_args()
OUT = tlib.path("analysis/transcripts")
os.makedirs(OUT, exist_ok=True)
files = args.files or sorted(glob.glob(tlib.path("source/*.mp4")))
m = WhisperModel("large-v3", device="cuda", compute_type="float16")
for p in files:
    c = os.path.splitext(os.path.basename(p))[0]
    if c in args.skip or os.path.exists(f"{OUT}/{c}.json"):
        continue
    a = tlib.load_audio(tlib.path(p), 16000)
    segs, info = m.transcribe(a, language=args.lang, word_timestamps=True, vad_filter=True, beam_size=5)
    segs = [{"s": round(s.start, 2), "e": round(s.end, 2), "t": s.text.strip(),
             "w": [[w.word, round(w.start, 2), round(w.end, 2), round(w.probability, 2)] for w in s.words]} for s in segs]
    json.dump({"code": c, "lang": info.language, "lang_p": round(info.language_probability, 2), "segments": segs},
              open(f"{OUT}/{c}.json", "w"), ensure_ascii=False)
    print(c, info.language, round(info.language_probability, 2), len(segs), flush=True)
