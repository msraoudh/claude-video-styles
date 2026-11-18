"""Whisper A/B of voice versions: does the processing cost any word?

Each corrected line of src/data/lines.json is cut out of every file (0.15 s padding) and decoded alone with
faster-whisper large-v3 (CUDA, beam 5, temperature 0, language fixed, a short Tunisian prompt): a 107 s decode
of Tunisian drifts into MSA translation, per-line decoding does not. Prints per file: words, mean word
probability, share of words < 0.5, character error rate vs the corrected transcript (diacritics/tatweel/
punctuation stripped, spaces removed), lines with CER > 50 % and lines that lost words; JSON in out/ab/.
Large-v3 is weak on Tunisian (raw CER ~65 %), so read the differences between versions, not the absolute.

Usage (GPU venv): C:\\Users\\YOU\\.venvs\\devops45\\Scripts\\python.exe scripts/whisper_ab.py ref.wav a.wav b.wav ...
"""
from __future__ import annotations

import difflib
import json
import os
import sys
from pathlib import Path

site = Path(sys.executable).resolve().parent.parent / "Lib/site-packages/nvidia"
for sub in ("cublas/bin", "cudnn/bin", "cuda_nvrtc/bin"):
    d = site / sub
    if d.is_dir():
        os.add_dll_directory(str(d))
        os.environ["PATH"] = str(d) + os.pathsep + os.environ["PATH"]

from faster_whisper import WhisperModel  # noqa: E402

LANG = os.environ.get("WHISPER_LANG", "ar")
sys.stdout.reconfigure(encoding="utf-8")
LINES = Path(__file__).resolve().parent.parent / "src/data/lines.json"


def norm(t: str) -> str:
    import re
    import unicodedata
    t = unicodedata.normalize("NFKC", t).lower()
    t = re.sub("[ً-ٰٟـ]", "", t)  # tashkeel, shadda, tatweel
    t = t.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ة", "ه").replace("ى", "ي")
    return re.sub(r"[^\w]", "", t)


def cer(ref: str, hyp: str) -> float:
    prev = list(range(len(hyp) + 1))
    for i, a in enumerate(ref, 1):
        cur = [i] + [0] * len(hyp)
        for j, b in enumerate(hyp, 1):
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a != b))
        prev = cur
    return prev[-1] / max(1, len(ref))


def load16k(path: str):
    """ffmpeg -> 16 kHz mono float32 (the PyAV in this venv does not match faster-whisper's decoder)."""
    import subprocess
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def transcribe(model: WhisperModel, path: str) -> dict:
    segs, _ = model.transcribe(load16k(path), language=LANG, beam_size=5, temperature=0.0, condition_on_previous_text=False,
                               word_timestamps=True, vad_filter=False)
    words, lp = [], []
    for s in segs:
        lp.append(s.avg_logprob)
        words += [(w.word.strip(), w.probability) for w in s.words if w.word.strip()]
    return dict(words=words, logprob=sum(lp) / max(1, len(lp)))


PROMPT = "توّا برشا عباد، باهي، شنوّة هاذي، الـAI"


def per_line(model: WhisperModel, path: str, lines: list) -> list[tuple[str, float]]:
    """Each corrected line decoded alone (0.15 s padding): stable for Tunisian, where a 107 s decode drifts into MSA."""
    x = load16k(path)
    out = []
    for l in lines:
        a, b = max(0, int((l["s"] - 0.15) * 16000)), int((l["e"] + 0.15) * 16000)
        segs, _ = model.transcribe(x[a:b], language=LANG, beam_size=5, temperature=0.0, condition_on_previous_text=False,
                                   initial_prompt=PROMPT, word_timestamps=True, vad_filter=False)
        ws = [(w.word.strip(), w.probability) for sg in segs for w in sg.words if w.word.strip()]
        out.append(ws)
    return out


def main() -> None:
    files = sys.argv[1:]
    model = WhisperModel("large-v3", device="cuda", compute_type="float16")
    lines = json.loads(LINES.read_text(encoding="utf-8"))
    print(f"whisper large-v3, language={LANG}, per corrected line ({len(lines)} lines, "
          f"{sum(len(l['words']) for l in lines)} words); CER vs src/data/lines.json, normalised, spaces removed")
    print(f"{'file':<26}{'words':>6}{'p_mean':>8}{'p<0.5':>7}{'CER':>7}{'lines CER>50%':>15}{'lines with fewer words':>24}")
    out = {}
    for f in files:
        res = per_line(model, f, lines)
        ws = [w for r in res for w in r]
        p = [q for _, q in ws]
        gold = "".join(norm(l["text"]) for l in lines)
        hyp = "".join(norm("".join(w for w, _ in r)) for r in res)
        per = [cer(norm(l["text"]), norm("".join(w for w, _ in r))) for l, r in zip(lines, res)]
        fewer = sum(len(r) < len(l["words"]) - 1 for l, r in zip(lines, res))
        c = cer(gold, hyp)
        print(f"{Path(f).name:<26}{len(ws):>6}{sum(p) / max(1, len(p)):>8.3f}{sum(q < 0.5 for q in p) / max(1, len(p)):>7.1%}"
              f"{c:>7.1%}{sum(v > 0.5 for v in per):>15}{fewer:>24}")
        out[f] = dict(cer=c, p_mean=sum(p) / max(1, len(p)), lines=[" ".join(w for w, _ in r) for r in res], line_cer=per)
    Path("out/ab").mkdir(parents=True, exist_ok=True)
    Path("out/ab/whisper-ab.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
