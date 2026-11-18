"""Close listening of exact slices, to judge a doubtful moment before cutting it.

    python listen.py <audio> 71.8-76.0 86.3-89.1 ... [--big] [--no-strip]

For each slice: what Whisper hears in it with no prompt and with the stuttering prompts (--big adds
the slower large-v3), and the loudness every 20 ms: a word said twice shows a dip between the two.
"""
import argparse

import numpy as np

from hear import SR, VERBATIM_PROMPT, VERBATIM_PROMPT_2, WHISPER_LANG, load_audio


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("slices", nargs="+")
    ap.add_argument("--big", action="store_true")
    ap.add_argument("--no-strip", action="store_true")
    args = ap.parse_args()
    from faster_whisper import WhisperModel

    audio = load_audio(args.audio)
    models = {"turbo": WhisperModel("mobiuslabsgmbh/faster-whisper-large-v3-turbo", device="cpu", compute_type="int8", cpu_threads=16)}
    if args.big:
        models["large-v3"] = WhisperModel("large-v3", device="cpu", compute_type="int8", cpu_threads=16)
    for spec in args.slices:
        a, b = map(float, spec.split("-"))
        clip = audio[int(a * SR): int(b * SR)]
        print(f"--- {spec}")
        for name, model in models.items():
            for label, prompt in (("plain", None), ("stut1", VERBATIM_PROMPT), ("stut2", VERBATIM_PROMPT_2)):
                segs, _ = model.transcribe(clip, language=WHISPER_LANG, word_timestamps=True, vad_filter=False, beam_size=5,
                                           condition_on_previous_text=False, initial_prompt=prompt, temperature=0.0)
                said = " ".join(f"{w.word.strip()}@{a + w.start:.2f}" for s in segs for w in s.words)
                print(f"  {name:8} {label}: {said[:400]}")
        if not args.no_strip:
            hop = int(SR * 0.02)
            n = len(clip) // hop
            db = 10 * np.log10(np.mean(clip[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)
            row = [f"{a + i * 0.02:.2f}:{v:.0f}" if i % 10 == 0 else f"{v:.0f}" for i, v in enumerate(db)]
            print("  dB:", " ".join(row))


if __name__ == "__main__":
    main()
